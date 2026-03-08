import { useState, useRef, useEffect } from 'react';
import { sendChatbotMessage } from '../../apis/chatbotApi';
import { postFirstChatAstream } from '../../apis/chatbotApi';
import { createBlockChat, insertBanWord } from '../../apis/chatbotApi';
import { ChatbotProps, ChatMessage } from './chatbot.types';
import { INITIAL_MESSAGE, DEFAULT_THREAD_ID } from './chatbot.constants';
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

// React StrictMode(개발환경)에서 mount/unmount 재실행 시 중복 호출 방지용
const initialAnalysisRunKeys = new Set<string>();
const initialAnalysisInFlightKeys = new Set<string>();

export default function Chatbot({ documentText, topicId }: ChatbotProps) {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  const [threadId, setThreadId] = useState(DEFAULT_THREAD_ID);
  
  // UI 상태 관리 (서버 Redis에 저장되는 대화 내용과 별도)
  const [topicOptions, setTopicOptions] = useState<TopicOption[]>([]);
  const [isTopicSelectionRequired, setIsTopicSelectionRequired] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  
  // 최초 astream 호출 여부 추적 (React StrictMode 대응)
  const [hasInitialTopicAnalysisRun, setHasInitialTopicAnalysisRun] = useState(false);
  const isInitializingRef = useRef(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 메시지가 추가될 때마다 스크롤을 아래로 이동
  useAutoScroll({ chatContainerRef, messages, isLoading });

  // 1. 문서 최초 업로드 시 astream SSE 호출 (정확히 1회만)
  useEffect(() => {
    const initializeChatbot = async () => {
      // 기본 유효성 검증
      if (!documentText || documentText.trim().length === 0) {
        return;
      }
      
      if (!topicId || topicId.trim().length === 0) {
        return;
      }

      const analysisKey = topicId.trim();

      if (initialAnalysisRunKeys.has(analysisKey)) {
        setHasInitialTopicAnalysisRun(true);
        return;
      }

      if (initialAnalysisInFlightKeys.has(analysisKey)) {
        return;
      }

      // 이미 astream 호출을 실행했으면 재실행하지 않음
      if (hasInitialTopicAnalysisRun) {
        return;
      }

      // React StrictMode에서 중복 호출 방지 (development 환경)
      if (isInitializingRef.current) {
        return;
      }

      initialAnalysisInFlightKeys.add(analysisKey);
      isInitializingRef.current = true;
      setHasInitialTopicAnalysisRun(true);
      setIsLoading(true);
      
      try {
        const response = await postFirstChatAstream({
          threadId,
          documentText,
          topicId,
          query: '문서 분석을 시작합니다.',
          negativeId: '',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // SSE 스트리밍 응답 파싱
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let extractedThreadId = '';
        let extractedSessionId = '';
        let extractedFinalResponse: TopicOption[] = [];

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim() || !line.startsWith('data: ')) continue;
              
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;
              if (jsonStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const eventType = parsed.event || parsed.type || parsed.status;
                
                // session 이벤트에서 session_id, thread_id 추출
                if (eventType === 'session') {
                  if (parsed.session_id) {
                    extractedSessionId = parsed.session_id;
                  }
                  if (parsed.thread_id) {
                    extractedThreadId = parsed.thread_id;
                  }
                }
                
                // success 이벤트에서 final_response 추출 (신뢰할 수 있는 유일한 소스)
                if (eventType === 'success') {
                  const finalRes =
                    parsed.data?.final_response ??
                    parsed.final_response ??
                    parsed.result?.final_response;

                  if (Array.isArray(finalRes)) {
                    extractedFinalResponse = finalRes;
                  }
                }
              } catch (e) {
                console.warn('SSE 파싱 오류:', e);
              }
            }
          }
        }

        // session_id, thread_id 업데이트
        if (extractedSessionId) {
          setSessionId(extractedSessionId);
        }
        if (extractedThreadId) {
          setThreadId(extractedThreadId);
        }

        // final_response를 UI 상태로 저장 (서버 Redis와 별도)
        if (extractedFinalResponse.length > 0) {
          setTopicOptions(extractedFinalResponse);
          setIsTopicSelectionRequired(true);
          
          // 봇 메시지로 선택지 표시
          setMessages(prev => [...prev, {
            role: 'bot',
            content: '다음 주제 중에서 선택해주세요:',
            selections: extractedFinalResponse,
            responseType: 'selection'
          }]);
        }

        initialAnalysisRunKeys.add(analysisKey);
        initialAnalysisInFlightKeys.delete(analysisKey);
      } catch (error) {
        console.error('❌ 챗봇 초기화 오류:', error);
        setMessages(prev => [...prev, {
          role: 'bot',
          content: '죄송합니다. 문서 분석 중 오류가 발생했습니다.'
        }]);
        // 오류 시 재시도 가능하도록 플래그 리셋
        setHasInitialTopicAnalysisRun(false);
        isInitializingRef.current = false;
        initialAnalysisInFlightKeys.delete(topicId.trim());
      } finally {
        setIsLoading(false);
      }
    };

    initializeChatbot();
    // 의존성 배열에 documentText를 넣지 않아 Quill 변경 시 재실행 방지
    // topicId는 최초 식별용으로만 사용
  }, [topicId, hasInitialTopicAnalysisRun, threadId]);

  // 3. 사용자 메시지 전송 시 ban word 체크 후 전송
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsLoading(true);

    try {
      // 3-1. Ban word 체크
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

      // 3-2. 정상 메시지 전송
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
          '',
          threadId,
          'selection_negative_topic',
          documentText || '',
          topicIdForNegative,
          String(negativeId),
          sessionId
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
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '죄송합니다. 오류가 발생했습니다.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 선택지 클릭 시 /api/v1/chatbot/call 사용
  const handleSelectionClick = async (keyId: string, sentence: string) => {
    // 선택 메시지 추가
    setMessages(prev => [...prev, { role: 'user', content: sentence }]);
    setIsLoading(true);
    
    // 선택 완료 → 입력창 활성화
    setIsTopicSelectionRequired(false);
    setSelectedTopicId(keyId);

    try {
      // /api/v1/chatbot/call 엔드포인트 사용
      const response = await sendChatbotMessage(
        sentence,
        threadId,
        'selection_main_topic',
        documentText || '',
        keyId,
        undefined,
        sessionId
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
        disabled={isTopicSelectionRequired}
      />
    </>
  );
}
