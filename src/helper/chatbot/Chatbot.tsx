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

interface TopicOption {
  key_id: string;
  main_topic_sentence: string;
  sources: any[];
}

export default function Chatbot({ documentText, topicId }: ChatbotProps) {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  
  // UI 상태 관리
  const [topicOptions, setTopicOptions] = useState<TopicOption[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 메시지가 추가될 때마다 스크롤을 아래로 이동
  useAutoScroll({ chatContainerRef, messages, isLoading });

  // 사용자 메시지 전송 시 ban word 체크 후 전송
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsLoading(true);

    try {
      // Ban word 체크
      try {
        await insertBanWord({
          ban_word_list: [userMessage],
          ban_context: '사용자 입력 검증'
        });
      } catch (banError: any) {
        // ban word가 감지되면 에러 응답
        if (banError.response?.status === 400 || banError.response?.data?.success === false) {
          setMessages(prev => [...prev, {
            role: 'bot',
            content: '금지된 단어가 포함되어 있습니다. 다른 표현을 사용해주세요.'
          }]);
          setIsLoading(false);
          return;
        }
        // 그 외 에러는 무시하고 진행
      }

      // 사용자 입력에 대해 챗봇이 응답 (action: 'first')
      const response = await sendChatbotMessage(
        topicId || '',
        'first',
        userMessage,
        undefined,
        selectedTopicId || topicId || ''
      );
      
      // 봇 응답 추가
      const botMessage = parseResponseToMessage(response);
      setMessages(prev => [...prev, botMessage]);
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

  const handleNegativeClick = async (negativeId: number, action: 'delete' | 'keep') => {
    setIsLoading(true);

    try {
      if (action === 'delete') {
        const topicIdForNegative = selectedTopicId || topicId || '';

        if (!topicIdForNegative) {
          setMessages(prev => [...prev, {
            role: 'bot',
            content: '주제 정보가 없어 삭제 요청을 진행할 수 없습니다. 먼저 주제를 선택해주세요.'
          }]);
          return;
        }

        // 삭제 선택 시 negative_id를 보냄
        const response = await sendChatbotMessage(
          topicId || '',
          'selection_negative_topic',
          undefined,
          undefined,
          topicIdForNegative,
          String(negativeId),
          sessionId
        );

        // 사용자 동작 표시
        setMessages(prev => [...prev, {
          role: 'user',
          content: `삭제됨`
        }]);

        // 봇 응답
        const responseType = response.response_type || '';
        const finalResponse = response.data?.final_response;

        if (typeof finalResponse === 'string') {
          setMessages(prev => [...prev, {
            role: 'bot',
            content: finalResponse,
            responseType: responseType
          }]);
        } else if (typeof finalResponse === 'object' && finalResponse !== null && 'negative_sentence_list' in finalResponse) {
          // 다음 삭제 제안이 있는 경우
          const negatives = (finalResponse.negative_sentence_list as string[]).map(
            (sentence: string, idx: number) => ({
              sentence,
              reason: (finalResponse.negative_sentence_reason as string[])?.[idx] || '삭제 제안',
              negativeId: (finalResponse.negative_id_list as number[])?.[idx] || idx,
            })
          );
          setMessages(prev => [...prev, {
            role: 'bot',
            content: '다음 문장들을 삭제하시겠습니까?',
            negatives,
            responseType: responseType
          }]);
        } else {
          const botResponse = response.message || '처리되었습니다.';
          setMessages(prev => [...prev, {
            role: 'bot',
            content: botResponse,
            responseType: responseType
          }]);
        }
        setResponseData(response.data);
      } else {
        // 보관 선택 시
        setMessages(prev => [...prev, {
          role: 'user',
          content: '보관'
        }]);
        setMessages(prev => [...prev, {
          role: 'bot',
          content: '문장이 보관되었습니다.'
        }]);
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

  // 선택지 클릭 시 chatbot 엔드포인트 사용
  const handleSelectionClick = async (keyId: string, sentence: string) => {
    // 선택 메시지 추가
    setMessages(prev => [...prev, { role: 'user', content: sentence }]);
    setIsLoading(true);
    
    // 선택 완료
    setSelectedTopicId(keyId);

    try {
      // 새로운 chatbot 엔드포인트 사용
      const response = await sendChatbotMessage(
        topicId || '',
        'selection_main_topic',
        sentence,
        undefined,
        keyId,
        undefined,
        sessionId
      );

      const responseType = response.response_type || '';
      const finalResponse = response.data?.final_response;

      if (Array.isArray(finalResponse)) {
        setMessages(prev => [...prev, {
          role: 'bot',
          content: '다음 중에서 선택해주세요:',
          selections: finalResponse,
          responseType: responseType
        }]);
      } else if (typeof finalResponse === 'object' && finalResponse !== null && 'negative_sentence_list' in finalResponse) {
        // negative_sentence_list가 있는 경우 - 삭제 제안
        const negatives = (finalResponse.negative_sentence_list as string[]).map(
          (sentence: string, idx: number) => ({
            sentence,
            reason: (finalResponse.negative_sentence_reason as string[])?.[idx] || '삭제 제안',
            negativeId: (finalResponse.negative_id_list as number[])?.[idx] || idx,
          })
        );
        setMessages(prev => [...prev, {
          role: 'bot',
          content: '다음 문장들을 삭제하시겠습니까?',
          negatives,
          responseType: responseType
        }]);
      } else if (typeof finalResponse === 'string') {
        setMessages(prev => [...prev, {
          role: 'bot',
          content: finalResponse,
          responseType: responseType
        }]);
      } else {
        const botResponse = response.message || '응답을 받았습니다.';
        setMessages(prev => [...prev, {
          role: 'bot',
          content: botResponse,
          responseType: responseType
        }]);
      }
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
