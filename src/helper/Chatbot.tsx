import { useState } from 'react';
import fileupload from '../assets/icons/fileupload.png';
import search from '../assets/icons/search.png';

export default function Chatbot() {
  const [chatInput, setChatInput] = useState('');

  return (
    <>
      <div className="panel-chat-message">
        <p>SHOW-GY 챗봇입니다.<br />무엇을 도와드릴까요?</p>
      </div>

      <div className="panel-input-bar">
        <textarea
          className="panel-input-field"
          placeholder="메시지를 입력하세요"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          rows={1}
        />
        <img src={fileupload} alt="파일 업로드" className="panel-input-rect" />
        <img src={search} alt="검색" className="panel-input-square" />
        <div className="panel-input-plus">+</div>
      </div>
    </>
  );
}
