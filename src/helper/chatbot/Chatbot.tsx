import { useState, useRef } from 'react';
import { sendChatbotMessage } from '../../apis/chatbotApi';
import { ChatbotProps, ChatMessage } from './chatbot.types';
import { INITIAL_MESSAGE } from './chatbot.constants';
import { parseResponseToMessage } from './chatbot.parsers';
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
}: ChatbotProps) {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  useAutoScroll({ chatContainerRef, messages, isLoading });

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
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsLoading(true);

    try {
      const response = await sendChatbotMessage(
        documentId ? String(documentId) : '',
        'first',
        userMessage,
        deltaDocument,
        selectedTopicId || undefined,
        undefined,
        sessionId || undefined
      );
      handleResponse(response);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.'
      }]);
    } finally {
      setIsLoading(false);
    }
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

  // 부정문 삭제/보관
  const handleNegativeClick = async (negativeId: number, action: 'delete' | 'keep') => {
    setIsLoading(true);

    try {
      if (action === 'delete') {
        const topicIdForNegative = selectedTopicId || '';
        if (!topicIdForNegative) {
          setMessages(prev => [...prev, {
            role: 'bot',
            content: '주제 정보가 없어 삭제 요청을 진행할 수 없습니다. 먼저 주제를 선택해주세요.'
          }]);
          return;
        }

        setMessages(prev => [...prev, { role: 'user', content: '삭제' }]);

        const response = await sendChatbotMessage(
          documentId ? String(documentId) : '',
          'selection_negative_topic',
          undefined,
          undefined,
          topicIdForNegative,
          String(negativeId),
          sessionId
        );
        handleResponse(response);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'user', content: '보관' },
          { role: 'bot', content: '문장이 보관되었습니다.' },
        ]);
      }
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
        onNegativeClick={handleNegativeClick}
      />
      <ChatInputBar
        chatInput={chatInput}
        onChatInputChange={setChatInput}
        onSendMessage={handleSendMessage}
        onKeyPress={handleKeyPress}
      />
    </>
  );
}
