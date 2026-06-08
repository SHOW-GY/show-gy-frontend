import { useState, useRef, useEffect } from 'react';
import { sendChatbotMessage, sendChatbotMessageStream, getChatSessions, getChatHistory, extractChatAttachment } from '../../apis/chatbotApi';
import type { ChatbotStreamEvent } from '../../apis/chatbotApi';
import { ChatbotProps, ChatMessage, ChatStep } from './chatbot.types';
import { deltaToHtml } from '../quill/deltaToHtml';

// AI 사고 단계 키 → 사용자 표시 한글 라벨.
// 알 수 없는 키가 들어오면 키 그대로 표시 (개발 중에만 노출).
const STEP_LABELS: Record<string, string> = {
  // LangGraph 노드
  filtering: '금칙어 검사 중',
  domain_guard: '주제 적합성 확인 중',
  style_intent: '팀장 스타일 의도 파악 중',
  plan: '계획 수립 중',
  dispatcher_agent: '답변 생성 중',
  tool_node: '도구 실행 중',
  unified_response_node: '응답 정리 중',
  ban_check: '금칙어 후처리 중',
  // 도구
  qa_tool: '문서에서 답 찾는 중',
  summary_tool: '문서 요약 생성 중',
  flex_document_tool: '문서 수정 중',
  apply_leader_style_tool: '팀장 스타일 적용 중',
  apply_last_suggestion_tool: '이전 제안 적용 중',
  restore_markdown_format_tool: '서식 복원 중',
  diff_summary_tool: '변경 사항 정리 중',
  reject_out_of_scope_tool: '범위 외 요청 판단 중',
  apply_input_docs_tool: '첨부 문서 적용 중',
  external_search_tool: '외부 자료 검색 중',
  undo_apply_tool: '이전 상태 복원 중',
};

const labelFor = (key: string) => STEP_LABELS[key] || key;
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  // 챗봇 입력창에 첨부한 참고 문서 (PDF/TXT/MD → backend 추출 텍스트)
  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const [attachedText, setAttachedText] = useState<string>('');
  // 첨부 문서 역할 — 사용자가 라디오로 선택. 첨부 있는데 미선택이면 send 불가.
  const [attachedKind, setAttachedKind] = useState<'template' | 'content' | null>(null);
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
    // 가드 제거 — kind 미선택이어도 전송 허용. AI 가 query 보고 추론.

    const userMessage = chatInput.trim();
    // 첨부 파일 이름이 있으면 사용자 메시지에 표시 (말풍선)
    const kindLabel = attachedKind === 'template' ? '양식' : attachedKind === 'content' ? '내용' : '';
    const userMessageDisplay = attachedFileName
      ? `📎 ${attachedFileName}${kindLabel ? ` (${kindLabel})` : ''}\n${userMessage}`
      : userMessage;
    setMessages(prev => [...prev, { role: 'user', content: userMessageDisplay }]);
    setChatInput('');
    setIsLoading(true);

    // 첨부 텍스트는 세션 동안 유지 — 사용자가 × 클릭하거나 세션 종료까지.
    // "다시 적용해줘"/"다른 형식으로" 같은 후속 요청에 재활용 가능.
    const inputDocsToSend = attachedText || undefined;
    const inputDocsKindToSend = attachedKind || undefined;
    const sentFileName = attachedFileName;
    const sentKind = attachedKind;

    // 스트림 모드 — 빈 봇 메시지 placeholder 를 추가하고 토큰/step 이 올 때마다 갱신.
    // final 시점에 기존 handleResponse 와 동일한 후처리 (revised_document, format_hints 등).
    let placeholderInserted = false;
    let isStreamingNow = false;
    let accumulated = '';
    let feedbackMarkerHit = false;  // ⟦FEEDBACK⟧ 마커 감지 후 그 이후 토큰은 누적 중단 (사용자 노출 방지)

    const ensurePlaceholder = () => {
      if (placeholderInserted) return;
      setMessages(prev => [...prev, { role: 'bot', content: '', steps: [] }]);
      placeholderInserted = true;
    };

    const updateLastBot = (updater: (msg: ChatMessage) => ChatMessage) => {
      ensurePlaceholder();
      setMessages(prev => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === 'bot') {
            next[i] = updater(next[i]);
            break;
          }
        }
        return next;
      });
    };

    const upsertLastBotMessage = (text: string) => {
      updateLastBot(msg => ({ ...msg, content: text }));
    };

    const pushStep = (key: string) => {
      updateLastBot(msg => {
        const steps: ChatStep[] = msg.steps ? [...msg.steps] : [];
        steps.push({ key, label: labelFor(key), done: false, startedAt: performance.now() });
        return { ...msg, steps };
      });
    };

    const completeStep = (key: string, serverElapsedMs?: number) => {
      updateLastBot(msg => {
        const steps: ChatStep[] = msg.steps ? [...msg.steps] : [];
        // 같은 key 중 가장 마지막의 미완료 step 을 완료 처리
        for (let i = steps.length - 1; i >= 0; i--) {
          if (steps[i].key === key && !steps[i].done) {
            const elapsedMs = serverElapsedMs ?? (steps[i].startedAt
              ? Math.round(performance.now() - steps[i].startedAt!)
              : undefined);
            steps[i] = { ...steps[i], done: true, elapsedMs };
            break;
          }
        }
        return { ...msg, steps };
      });
    };

    try {
      await sendChatbotMessageStream(
        documentId ? String(documentId) : '',
        'first',
        (evt: ChatbotStreamEvent) => {
          switch (evt.type) {
            case 'session':
              if (evt.session_id) setSessionId(evt.session_id);
              break;
            case 'token':
              if (!isStreamingNow) {
                isStreamingNow = true;
                setIsStreaming(true);
              }
              if (feedbackMarkerHit) {
                // 마커 이후 토큰은 누적/표시 모두 중단 — unified_response_node 가 JSON 파싱 담당
                break;
              }
              accumulated += evt.text;
              {
                const markerIdx = accumulated.indexOf('⟦FEEDBACK⟧');
                if (markerIdx !== -1) {
                  // 마커 시작 감지 — accumulated 자체를 마커 직전까지로 자르고 flag set.
                  // 이후 token 은 위 가드에서 차단되어 final.content 에 마커 안 들어감.
                  accumulated = accumulated.slice(0, markerIdx).trimEnd();
                  feedbackMarkerHit = true;
                }
                upsertLastBotMessage(accumulated);
              }
              break;
            case 'step':
              if (!isStreamingNow) {
                isStreamingNow = true;
                setIsStreaming(true);
              }
              if (evt.state === 'start') pushStep(evt.key);
              else if (evt.state === 'done') completeStep(evt.key, evt.elapsed_ms);
              break;
            case 'tool':
              // 레거시 호환 — 이미 'step' 으로 처리되므로 무시
              break;
            case 'final':
              // 기존 handleResponse 호환 형태로 가공
              const fakeResponse = {
                status: 'success',
                response_type: evt.response_type,
                data: evt.data,
                title: evt.title || '',
                session_id: evt.data?.session_id,
              };
              // session_id
              const sid = fakeResponse.data?.session_id;
              if (sid) setSessionId(sid);
              // final_edit / apply_document / negative_selection 등 부수효과는 handleResponse 와 동일
              if (fakeResponse.response_type === 'apply_document') {
                const revised: string | undefined = fakeResponse.data?.revised_document;
                if (revised) onApplyDocument?.(revised);
              }
              if (fakeResponse.response_type === 'final_edit') {
                onClearHighlight?.();
                const removed: string[] = fakeResponse.data?.removed_sentences || [];
                const edited: any[] = fakeResponse.data?.edited_sentences || [];
                const formatHints = fakeResponse.data?.format_hints || undefined;
                const pdfStyleHint = fakeResponse.data?.pdf_style_hint || undefined;
                if (removed.length > 0 || edited.length > 0) {
                  onFinalEdit?.({ ops: [] }, removed, edited, formatHints, pdfStyleHint);
                } else if (fakeResponse.data?.final_response?.ops) {
                  onFinalEdit?.(fakeResponse.data.final_response, undefined, undefined, formatHints, pdfStyleHint);
                } else if (formatHints || pdfStyleHint) {
                  onFinalEdit?.({ ops: [] }, undefined, undefined, formatHints, pdfStyleHint);
                }
              }
              // 평가/약점 응답에서 추출된 feedback_items → 피드백 탭에 push
              const feedbackItemsFromAi = fakeResponse.data?.feedback_items;
              if (Array.isArray(feedbackItemsFromAi) && feedbackItemsFromAi.length > 0) {
                onFeedback?.(feedbackItemsFromAi.map((it: any) => ({
                  sentence: String(it?.sentence || ''),
                  reason: String(it?.reason || ''),
                })).filter((it: any) => it.sentence));
              }
              if (fakeResponse.response_type === 'negative_selection' && fakeResponse.data?.negative_sentence_list) {
                const sentences: string[] = fakeResponse.data.negative_sentence_list;
                const reasons: string[] = fakeResponse.data.negative_sentence_reason || [];
                onHighlight?.(sentences);
                const feedbackItems = sentences.map((s: string, idx: number) => ({
                  sentence: s,
                  reason: reasons[idx] || '사유가 제공되지 않았습니다.',
                }));
                onFeedback?.(feedbackItems);
              }
              const refs = fakeResponse.data?.reference_sources;
              if (Array.isArray(refs) && refs.length > 0) onReferences?.(refs);

              // 최종 메시지는 parseResponseToMessage 결과로 교체 (token 누적과 최종 메시지가 다를 수 있음 — apply_document/negative_selection 등)
              // steps 는 스트리밍 중 누적된 것을 유지.
              // botMessage.content 에도 마커 잔존 가능성 안전망 — 한 번 더 strip.
              const botMessage = parseResponseToMessage(fakeResponse as any);
              if (botMessage.content && typeof botMessage.content === 'string') {
                const mIdx = botMessage.content.indexOf('⟦FEEDBACK⟧');
                if (mIdx !== -1) botMessage.content = botMessage.content.slice(0, mIdx).trimEnd();
              }
              if (placeholderInserted) {
                setMessages(prev => {
                  const next = [...prev];
                  for (let i = next.length - 1; i >= 0; i--) {
                    if (next[i].role === 'bot') {
                      const existingSteps = next[i].steps;
                      // general_chat 은 token 누적 텍스트가 그대로 최종이므로 content 유지, 그 외는 botMessage content
                      const keepContent = fakeResponse.response_type === 'general_chat' && accumulated;
                      next[i] = {
                        ...botMessage,
                        content: keepContent ? accumulated : botMessage.content,
                        steps: existingSteps,
                      };
                      break;
                    }
                  }
                  return next;
                });
              } else {
                setMessages(prev => [...prev, botMessage]);
              }
              break;
            case 'error':
              upsertLastBotMessage(`오류가 발생했습니다: ${evt.message}`);
              break;
          }
        },
        {
          query: userMessage,
          // 현재 본문을 서식 포함 HTML 로 함께 전송 → 백엔드 document_raw 백업 →
          // undo(되돌리기) 시 강조/색상 등 양식이 풀리지 않고 그대로 복원됨.
          document: deltaToHtml(deltaDocument) || undefined,
          deltaDocument,
          topicId: selectedTopicId || undefined,
          sessionId: sessionId || undefined,
          inputDocs: inputDocsToSend,
          inputDocsKind: inputDocsKindToSend,
        },
      );
    } catch (error) {
      // 첨부는 세션 유지 정책이라 별도 복구 불필요 (이미 state 에 남아있음)
      void sentFileName; void sentKind;
      if (!placeholderInserted) {
        setMessages(prev => [...prev, {
          role: 'bot',
          content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.'
        }]);
      } else {
        upsertLastBotMessage('죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
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
    setAttachedKind(null);
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
        isStreaming={isStreaming}
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
        attachedKind={attachedKind}
        onAttachKindChange={setAttachedKind}
        onAttachFile={handleAttachFile}
        onRemoveAttachment={handleRemoveAttachment}
      />
    </>
  );
}
