import { useState, useEffect, useRef } from 'react';
import fileupload from '../assets/icons/fileupload.png';
import search from '../assets/icons/search.png';
import { sendChatbotMessage } from '../apis/chatbotApi';

interface ChatbotProps {
  documentText?: string;
  topicId?: string;
}

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  selections?: Array<{ key_id: string; main_topic_sentence: string }>;
  negatives?: Array<{ 
    sentence: string; 
    reason: string; 
    negativeId: number;
  }>;
  responseType?: string;
}

export default function Chatbot({ documentText, topicId }: ChatbotProps) {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', content: 'SHOW-GY 챗봇입니다.\n무엇을 도와드릴까요?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  const [threadId, setThreadId] = useState('default');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 메시지가 추가될 때마다 스크롤을 아래로 이동
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    
    // 사용자 메시지 추가
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
      const responseType = response.response_type || '';
      const finalResponse = response.data?.final_response;
      
      // final_response가 배열(선택지)인 경우
      if (Array.isArray(finalResponse)) {
        setMessages(prev => [...prev, {
          role: 'bot',
          content: '다음 중에서 선택해주세요:',
          selections: finalResponse,
          responseType: responseType
        }]);
        setResponseData(response.data);
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
        setResponseData(response.data);
      } else if (typeof finalResponse === 'string') {
        // final_response가 문자열인 경우
        setMessages(prev => [...prev, {
          role: 'bot',
          content: finalResponse,
          responseType: responseType
        }]);
        setResponseData(response.data);
      } else {
        // message 또는 session 사용
        const botResponse = response.message || response.session || '응답을 받았습니다.';
        setMessages(prev => [...prev, {
          role: 'bot',
          content: botResponse,
          responseType: responseType
        }]);
        setResponseData(response.data);
      }
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
      <div className="panel-chat-container" ref={chatContainerRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`panel-chat-message ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}>
            <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
            {msg.negatives && msg.negatives.length > 0 && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {msg.negatives.map((neg, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#FEE2E2',
                      borderLeft: '3px solid #EF4444',
                      borderRadius: '4px',
                      marginBottom: '8px'
                    }}
                  >
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#7F1D1D' }}>
                      <strong>삭제 제안:</strong> {neg.sentence}
                    </p>
                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#991B1B' }}>
                      <em>이유: {neg.reason}</em>
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleNegativeClick(neg.negativeId, 'delete')}
                        disabled={isLoading}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#EF4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          opacity: isLoading ? 0.6 : 1,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        삭제
                      </button>
                      <button
                        onClick={() => handleNegativeClick(neg.negativeId, 'keep')}
                        disabled={isLoading}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#6B7280',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          opacity: isLoading ? 0.6 : 1,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        보관
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {msg.selections && msg.selections.length > 0 && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {msg.selections.map((sel) => (
                  <button
                    key={sel.key_id}
                    onClick={() => handleSelectionClick(sel.key_id, sel.main_topic_sentence)}
                    disabled={isLoading}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#8B5CF6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      opacity: isLoading ? 0.6 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {sel.main_topic_sentence}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="panel-chat-message bot-message">
            <p>...</p>
          </div>
        )}
      </div>

      <div className="panel-input-bar">
        <textarea
          className="panel-input-field"
          placeholder="메시지를 입력하세요"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={1}
        />
        <img src={fileupload} alt="파일 업로드" className="panel-input-rect" />
        <img 
          src={search} 
          alt="검색" 
          className="panel-input-square" 
          onClick={handleSendMessage}
          style={{ cursor: 'pointer' }}
        />
        <div className="panel-input-plus">+</div>
      </div>
    </>
  );
}
