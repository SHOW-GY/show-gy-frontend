import { useState, useRef, useEffect } from 'react';
import { sendChatbotMessage, getChatSessions, getChatHistory, extractChatAttachment } from '../../apis/chatbotApi';
import { ChatbotProps, ChatMessage } from './chatbot.types';
import { INITIAL_MESSAGE } from './chatbot.constants';
import { parseResponseToMessage, extractShortSessionId, convertHistoryToMessages } from './chatbot.parsers';
import { useAutoScroll } from './hooks/useAutoScroll';
import { ChatMessages } from './parts/ChatMessages';
import { ChatInputBar } from './parts/ChatInputBar';
import '../../styles/chatbot.css';

export default function Chatbot({
  documentId,
  documentText,
  topicId,
  deltaDocument,
  onFinalEdit,
  onHighlight,
  onClearHighlight,
  onFeedback,
  onReferences,
  onApplyDocument,
}: ChatbotProps) {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  // 챗봇 입력창에 첨부한 참고 문서 (PDF/TXT/MD → backend 추출 텍스트)
  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const [attachedText, setAttachedText] = useState<string>('');
  // 같은 documentId에 대한 중복 fetch 방지 + documentId 바뀌면 새로 fetch
  const lastLoadedDocIdRef = useRef<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  useAutoScroll({ chatContainerRef, messages, isLoading });

  // 대화 내역 복원 — documentId가 바뀔 때마다 다시 불러옴.
  // 같은 documentId에 대해서는 한 번만 호출 (React 18 StrictMode 이중 mount 대비)
  useEffect(() => {
    if (!documentId) return;
    const docKey = String(documentId);
    if (lastLoadedDocIdRef.current === docKey) return;
    lastLoadedDocIdRef.current = docKey;

    // 문서 전환 시 이전 대화 잔류 방지 — 항상 초기 상태로 reset 후 fetch
    setMessages([INITIAL_MESSAGE]);
    setSessionId('');
    setSelectedTopicId('');

    (async () => {
      try {
        const sessRes = await getChatSessions(docKey);
        const sessions = sessRes.data || [];
        if (sessions.length === 0) return;

        // 메시지 전송용 sessionId 는 short (백엔드 request_llm 키 조립 규약에 맞춤)
        // history 호출은 full thread_id 를 보내야 source family 통합 때 정확한 Redis 키를 찾음
        const fullId = sessions[0].session_id;
        const shortId = extractShortSessionId(fullId);
        setSessionId(shortId);

        const histRes = await getChatHistory(docKey, fullId);
        const history = histRes.data || [];
        if (history.length === 0) return;

        const restored = convertHistoryToMessages(history);
        if (restored.length > 1) {
          setMessages(restored);
        }
      } catch {
        // 대화 내역 없음/에러 — 위에서 reset한 기본 상태 유지
      }
    })();
  }, [documentId]);

  // 공통: 응답 처리 (session_id 저장 + 메시지 추가 + final_edit/highlight 콜백)
  const handleResponse = (response: any) => {
    // session_id 저장
    const sid = response.data?.session_id || response.session_id;
    if (sid) setSessionId(sid);

    // final_edit → Quill 에디터에 적용
    if (response.response_type === 'final_edit') {
      // 하이라이트 해제
      onClearHighlight?.();

      const removed: string[] = response.data?.removed_sentences || [];
      const edited: Array<{ original: string; edited_sentence: string }> = response.data?.edited_sentences || [];
      // 팀장 스타일 적용 트리거 시 백엔드가 주입하는 hint들
      const formatHints = response.data?.format_hints || undefined;
      const pdfStyleHint = response.data?.pdf_style_hint || undefined;

      if (removed.length > 0 || edited.length > 0) {
        // surgical 편집: 삭제/수정할 문장 정보를 전달
        onFinalEdit?.({ ops: [] }, removed, edited, formatHints, pdfStyleHint);
      } else if (response.data?.final_response?.ops) {
        // fallback: 전체 Delta 교체
        onFinalEdit?.(response.data.final_response, undefined, undefined, formatHints, pdfStyleHint);
      } else if (formatHints || pdfStyleHint) {
        // 텍스트 변경은 없지만 format hint만 있는 경우 (드물지만 안전망)
        onFinalEdit?.({ ops: [] }, undefined, undefined, formatHints, pdfStyleHint);
      }
    }

    // negative_selection → 부정문 문장 리스트로 에디터 하이라이트 + 피드백 탭에 사유 push
    if (response.response_type === 'negative_selection' && response.data?.negative_sentence_list) {
      const sentences: string[] = response.data.negative_sentence_list;
      const reasons: string[] = response.data.negative_sentence_reason || [];
      onHighlight?.(sentences);
      // 피드백 탭에 sentence/reason 페어 push
      const feedbackItems = sentences.map((s, idx) => ({
        sentence: s,
        reason: reasons[idx] || '사유가 제공되지 않았습니다.',
      }));
      onFeedback?.(feedbackItems);
    }

    // apply_document → 직전 제안을 Quill 에디터에 직접 덮어쓰기.
    // 응답 계약: final_response = explain string (채팅창), data.revised_document = 본문.
    if (response.response_type === 'apply_document') {
      const revised: string | undefined = response.data?.revised_document;
      if (revised) {
        onApplyDocument?.(revised);
      }
    }

    // selection_main_topic 또는 임의 응답에 reference_sources가 있으면 참고자료 탭에 push
    const refs = response.data?.reference_sources;
    if (Array.isArray(refs) && refs.length > 0) {
      onReferences?.(refs);
    }

    // 챗봇 메시지 추가
    const botMessage = parseResponseToMessage(response);
    setMessages(prev => [...prev, botMessage]);
  };

  // 사용자 메시지 전송
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    // 첨부 파일 이름이 있으면 사용자 메시지에 표시 (말풍선)
    const userMessageDisplay = attachedFileName
      ? `📎 ${attachedFileName}\n${userMessage}`
      : userMessage;
    setMessages(prev => [...prev, { role: 'user', content: userMessageDisplay }]);
    setChatInput('');
    setIsLoading(true);

    // 첨부 텍스트는 한 번 전송 후 자동 해제
    const inputDocsToSend = attachedText || undefined;
    const sentFileName = attachedFileName;
    setAttachedFileName('');
    setAttachedText('');

    try {
      const response = await sendChatbotMessage(
        documentId ? String(documentId) : '',
        'first',
        userMessage,
        deltaDocument,
        selectedTopicId || undefined,
        undefined,
        sessionId || undefined,
        inputDocsToSend,
      );
      handleResponse(response);
    } catch (error) {
      // 실패 시 첨부 상태 복구 (사용자가 재시도 가능)
      if (sentFileName && inputDocsToSend) {
        setAttachedFileName(sentFileName);
        setAttachedText(inputDocsToSend);
      }
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 파일 첨부 — backend 에서 텍스트 추출 후 state 에 보관, 다음 메시지에 input_docs 로 전송
  const handleAttachFile = async (file: File) => {
    try {
      const res = await extractChatAttachment(file);
      if (res?.status === 'success' && res.data?.text) {
        setAttachedFileName(res.data.filename || file.name);
        setAttachedText(res.data.text);
      } else {
        setMessages(prev => [...prev, {
          role: 'bot',
          content: '첨부 파일에서 텍스트를 추출하지 못했습니다.',
        }]);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.detail || '첨부 파일 처리 중 오류가 발생했습니다.';
      setMessages(prev => [...prev, { role: 'bot', content: msg }]);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachedFileName('');
    setAttachedText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 주제문 선택
  const handleSelectionClick = async (keyId: string, sentence: string) => {
    setMessages(prev => [...prev, { role: 'user', content: sentence }]);
    setIsLoading(true);
    setSelectedTopicId(keyId);

    try {
      const response = await sendChatbotMessage(
        documentId ? String(documentId) : '',
        'selection_main_topic',
        sentence,
        undefined,
        keyId,
        undefined,
        sessionId
      );
      handleResponse(response);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '죄송합니다. 오류가 발생했습니다.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 부정문 일괄 처리 — 단건 클릭마다 API 보내지 않고 사용자가 선택 완료 후 한 번에 전송.
  // deleteIds 비어있으면 "전체 보관" 의미 (API 호출 없이 로컬 메시지만).
  const handleNegativeBatchSubmit = async (deleteIds: number[]) => {
    if (deleteIds.length === 0) {
      // 사용자가 모두 유지를 선택했으므로 부정문 하이라이트(빨강/밑줄/볼드)를 원상복구.
      // 삭제 흐름은 final_edit 응답에서 자동 해제되지만, 이 분기는 API 호출이 없어
      // 명시적으로 해제해야 함.
      onClearHighlight?.();
      setMessages(prev => [...prev,
        { role: 'user', content: '전체 보관' },
        { role: 'bot', content: '제안된 문장을 모두 보관했습니다.' },
      ]);
      return;
    }

    const topicIdForNegative = selectedTopicId || '';
    if (!topicIdForNegative) {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '주제 정보가 없어 삭제 요청을 진행할 수 없습니다. 먼저 주제를 선택해주세요.'
      }]);
      return;
    }

    setIsLoading(true);
    setMessages(prev => [...prev, {
      role: 'user',
      content: `선택한 ${deleteIds.length}개 문장 삭제 요청`,
    }]);

    try {
      const response = await sendChatbotMessage(
        documentId ? String(documentId) : '',
        'selection_negative_topic',
        undefined,
        undefined,
        topicIdForNegative,
        deleteIds.join(','),  // AI는 sevice.py:447-452에서 쉼표 분리 다중 ID 지원
        sessionId
      );
      handleResponse(response);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '죄송합니다. 오류가 발생했습니다.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        chatContainerRef={chatContainerRef}
        onSelectionClick={handleSelectionClick}
        onNegativeSubmit={handleNegativeBatchSubmit}
      />
      <ChatInputBar
        chatInput={chatInput}
        onChatInputChange={setChatInput}
        onSendMessage={handleSendMessage}
        onKeyPress={handleKeyPress}
        attachedFileName={attachedFileName}
        onAttachFile={handleAttachFile}
        onRemoveAttachment={handleRemoveAttachment}
      />
    </>
  );
}
