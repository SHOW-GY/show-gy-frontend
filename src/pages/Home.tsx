import Header from '../components/Header';
import '../styles/design.css';
import '../styles/animations.css';

export default function Home() {
  return (
    <div className="home-container">
      <div className="noise-large"></div>
      <div className="noise-small"></div>

      <div className="blob-purple"></div>
      <div className="blob-pink"></div>
      <div className="blob-cyan"></div>

      <div className="hero-title">
        <p className="hero-title-main animate-slide-up">긴 문서, 한눈에 핵심만</p>
        <p className="hero-title-sub animate-slide-up delay-200">AI 기반 스마트 요약 시스템</p>
      </div>

      <div className="university-info animate-slide-up delay-400">한양대학교 ERICA x 롯데이노베이트</div>

      <Header activeMenu="home" />
    </div>
  );
}