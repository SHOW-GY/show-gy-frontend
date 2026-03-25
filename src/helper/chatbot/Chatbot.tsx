import { useState, useRef } from 'react';
import { sendChatbotMessage } from '../../apis/chatbotApi';
import { insertBanWord } from '../../apis/chatbotApi';
import { ChatbotProps, ChatMessage } from './chatbot.types';
import { INITIAL_MESSAGE } from './chatbot.constants';
import { parseResponseToMessage } from './chatbot.parsers';
import { useAutoScroll } from './hooks/useAutoScroll';
import { ChatMessages } from './parts/ChatMessages';
import { ChatInputBar } from './parts/ChatInputBar';
import '../../styles/chatbot.css';

export default function Chatbot({ deltaDocument, topicId, onDocumentEdit }: ChatbotProps) {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);

  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useAutoScroll({ chatContainerRef, messages, isLoading });

  // 봇 응답에 delta가 있으면 에디터에 반영
  const applyDeltaIfPresent = (botMessage: ChatMessage) => {
    if (botMessage.delta && onDocumentEdit) {
      onDocumentEdit(botMessage.delta);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsLoading(true);

    try {
      try {
        await insertBanWord({
          ban_word_list: [userMessage],
          ban_context: '사용자 입력 검증'
        });
      } catch (banError: any) {
        if (banError.response?.status === 400 || banError.response?.data?.success === false) {
          setMessages(prev => [...prev, {
            role: 'bot',
            content: '금지된 단어가 포함되어 있습니다. 다른 표현을 사용해주세요.'
          }]);
          setIsLoading(false);
          return;
        }
      }

      const docId = topicId || 'default';
      const response = await sendChatbotMessage(
        docId,
        'first',
        userMessage,
        deltaDocument,
        selectedTopicId || topicId || undefined,
        undefined,
        sessionId || undefined
      );

      if (response.data?.session_id) {
        setSessionId(response.data.session_id);
      }
      const botMessage = parseResponseToMessage(response);
      setMessages(prev => [...prev, botMessage]);
      applyDeltaIfPresent(botMessage);
      setResponseData(response.data);
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

  // 부정문 확인 후 선택된 ID들만 삭제 요청 (0개 = 건너뛰기)
  const handleNegativeConfirm = async (selectedIds: number[]) => {
    if (selectedIds.length === 0) {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '수정 없이 건너뛰었습니다. 추가 요청이 있으면 말씀해주세요.'
      }]);
      return;
    }
    setIsLoading(true);

    try {
      setMessages(prev => [...prev, {
        role: 'user',
        content: `${selectedIds.length}개 문장 삭제 선택`
      }]);

      // 선택된 negative_id들을 쉼표로 연결하여 전송
      const response = await sendChatbotMessage(
        topicId || 'default',
        'selection_negative_topic',
        undefined,
        undefined,
        selectedTopicId || topicId || undefined,
        selectedIds.join(','),
        sessionId
      );

      if (response.data?.session_id) {
        setSessionId(response.data.session_id);
      }
      const botMessage = parseResponseToMessage(response);
      setMessages(prev => [...prev, botMessage]);
      applyDeltaIfPresent(botMessage);
      setResponseData(response.data);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '죄송합니다. 오류가 발생했습니다.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectionClick = async (keyId: string, sentence: string) => {
    setMessages(prev => [...prev, { role: 'user', content: sentence }]);
    setIsLoading(true);

    setSelectedTopicId(keyId);

    try {
      const response = await sendChatbotMessage(
        topicId || 'default',
        'selection_main_topic',
        sentence,
        undefined,
        keyId,
        undefined,
        sessionId
      );

      if (response.data?.session_id) {
        setSessionId(response.data.session_id);
      }
      const botMessage = parseResponseToMessage(response);
      setMessages(prev => [...prev, botMessage]);
      applyDeltaIfPresent(botMessage);
      setResponseData(response.data);
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
        onNegativeConfirm={handleNegativeConfirm}
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
