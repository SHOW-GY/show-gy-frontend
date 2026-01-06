import Header from '../components/Header';
import '../styles/design.css';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css';
import { useState } from 'react';

export default function Signup1() {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="home-container">
      <Header activeMenu="signup" />
      <div className="signup1-container">
        <div className="signup1-title-inner">
          <div className="signup1-title-text">회원가입</div>
          <div className="signup1-title-underline"></div>
        </div>
        <div className="signup1-confirm-button" onClick={handleBackToHome}>            <div className="signup1-confirm-text">처음으로</div>
          <div className="signup1-confirm-text">처음으로</div>
        </div>
        <div className="signup1-congrats-text">회원가입을<br />축하드립니다</div>
      </div>
    </div>
  );
}
