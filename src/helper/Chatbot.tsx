import { useState, useEffect, useRef } from 'react';
import fileupload from '../assets/icons/fileupload.png';
import search from '../assets/icons/search.png';
import { sendChatbotMessage } from '../apis/chatbotApi';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

export default function Chatbot() {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', content: 'SHOW-GY 챗봇입니다.\n무엇을 도와드릴까요?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
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
      const response = await sendChatbotMessage(userMessage);
      
      // 봇 응답 추가
      const botResponse = response.session || '응답을 받았습니다.';
      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
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

  return (
    <>
      <div className="panel-chat-container" ref={chatContainerRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`panel-chat-message ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}>
            <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
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
