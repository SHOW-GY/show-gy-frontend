/**
 * Chatbot 메인 컨테이너
 * ⚠️ 기존 상태/로직/API 호출 순서를 1도 변경하지 않음
 */

import { useState, useRef } from 'react';
import { sendChatbotMessage } from '../../apis/chatbotApi';
import { ChatbotProps, ChatMessage } from './chatbot.types';
import { INITIAL_MESSAGE, DEFAULT_THREAD_ID } from './chatbot.constants';
import { parseResponseToMessage } from './chatbot.parsers';
import { useAutoScroll } from './hooks/useAutoScroll';
import { ChatMessages } from './parts/ChatMessages';
import { ChatInputBar } from './parts/ChatInputBar';
import '../../styles/chatbot.css';

export default function Chatbot({ documentText, topicId }: ChatbotProps) {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  const [threadId, setThreadId] = useState(DEFAULT_THREAD_ID);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 메시지가 추가될 때마다 스크롤을 아래로 이동
  useAutoScroll({ chatContainerRef, messages, isLoading });

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsLoading(true);

    try {
      const response = await sendChatbotMessage(
        userMessage,
        threadId,
        'first',
        documentText || '',
        topicId || ''
      );
      
      // thread_id 업데이트
      if (response.thread_id) {
        setThreadId(response.thread_id);
      }
      
      // 봇 응답 추가
      const botMessage = parseResponseToMessage(response);
      setMessages(prev => [...prev, botMessage]);
      setResponseData(response.data);
    } catch (error) {
      console.error('챗봇 API 오류:', error);
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
        // 삭제 선택 시 negative_id를 보냄
        const response = await sendChatbotMessage(
          '',
          threadId,
          'selection_negative_topic',
          documentText || '',
          '',
          String(negativeId)
        );

        if (response.thread_id) {
          setThreadId(response.thread_id);
        }

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
        } else if (typeof finalResponse === 'object' && finalResponse?.negative_sentence_list) {
          // 다음 삭제 제안이 있는 경우
          const negatives = finalResponse.negative_sentence_list.map(
            (sentence: string, idx: number) => ({
              sentence,
              reason: finalResponse.negative_sentence_reason?.[idx] || '삭제 제안',
              negativeId: finalResponse.negative_id_list?.[idx] || idx,
            })
          );
          setMessages(prev => [...prev, {
            role: 'bot',
            content: '다음 문장들을 삭제하시겠습니까?',
            negatives,
            responseType: responseType
          }]);
        } else {
          const botResponse = response.message || response.session || '처리되었습니다.';
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
      console.error('[Chatbot] 삭제 처리 오류:', error);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '죄송합니다. 오류가 발생했습니다.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectionClick = async (keyId: string, sentence: string) => {
    // 선택 메시지 추가
    setMessages(prev => [...prev, { role: 'user', content: sentence }]);
    setIsLoading(true);

    try {
      const response = await sendChatbotMessage(
        sentence,
        threadId,
        'selection_main_topic',
        documentText || '',
        keyId
      );

      // thread_id 업데이트
      if (response.thread_id) {
        setThreadId(response.thread_id);
      }

      const responseType = response.response_type || '';
      const finalResponse = response.data?.final_response;

      if (Array.isArray(finalResponse)) {
        setMessages(prev => [...prev, {
          role: 'bot',
          content: '다음 중에서 선택해주세요:',
          selections: finalResponse,
          responseType: responseType
        }]);
      } else if (typeof finalResponse === 'object' && finalResponse?.negative_sentence_list) {
        // negative_sentence_list가 있는 경우 - 삭제 제안
        const negatives = finalResponse.negative_sentence_list.map(
          (sentence: string, idx: number) => ({
            sentence,
            reason: finalResponse.negative_sentence_reason?.[idx] || '삭제 제안',
            negativeId: finalResponse.negative_id_list?.[idx] || idx,
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
        const botResponse = response.message || response.session || '응답을 받았습니다.';
        setMessages(prev => [...prev, {
          role: 'bot',
          content: botResponse,
          responseType: responseType
        }]);
      }
      setResponseData(response.data);
    } catch (error) {
      console.error('[Chatbot] 선택 처리 오류:', error);
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
