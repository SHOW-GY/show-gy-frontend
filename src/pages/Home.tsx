import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import '../styles/design.css';
import '../styles/animations.css';
import '../styles/home.css';
import card1_1 from '../assets/image/card1_1.png';
import card1_2 from '../assets/image/card1_2.png';
import card1_3 from '../assets/image/card1_3.png';
import card1_4 from '../assets/image/card1_4.png';
import card2 from '../assets/image/card2_team.png';
import card3 from '../assets/image/card3.png';
import card4 from '../assets/image/card4.png';
import erica from '../assets/image/erica.jpg';
import lotte from '../assets/image/Lotteinovate.jpeg';

export default function Home() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const total = 4;
  const [stepPx, setStepPx] = useState(0);
  const [offsetPx, setOffsetPx] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<{ step: number; offset: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  {/* 모바일 여부 체크 */}
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 480);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  {/* 홈 캐러셀 좌표 계산 로직 */}
  useLayoutEffect(() => {
    const measure = () => {
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!viewport || !track) return;
      const firstCard = track.querySelector<HTMLDivElement>(".service-card-bg");
      if (!firstCard) return;
      const cardW = firstCard.offsetWidth;
      const styles = window.getComputedStyle(track);
      const gap = parseFloat(styles.gap || "0") || 0;
      const viewportW = viewport.getBoundingClientRect().width;
      if (!cardW || !viewportW) return;
      const step = Math.round((cardW + gap) * 1000) / 1000;
      const offset = Math.round(((viewportW - cardW) / 2) * 1000) / 1000;
      const last = lastRef.current;
      if (last && last.step === step && last.offset === offset) return;
      lastRef.current = { step, offset };
      setStepPx(step);
      setOffsetPx(offset);
    };

    const onResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        measure();
      });
    };
    measure();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);


  {/* 홈 캐러셀 이동 및 렌더링 */}
  useEffect(() => {
    if (isMobile) return;
    const track = trackRef.current;
    if (!track) {
      return;
    }
    if (stepPx === 0) return;
    const x = -(index * stepPx) + offsetPx;
    track.style.transform = `translateX(${x}px)`;
  }, [index, stepPx, offsetPx, isMobile]);

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(total - 1, i + 1));

  const getPosClass = (i:number) => {
    let diff = i - index;
    diff = ((diff % total) + total) % total;
    if (diff > total / 2) diff -= total;

    if (diff === 0) return 'pos-center';
    if (diff === -1) return 'pos-left';
    if (diff === 1) return 'pos-right';
    if (diff === -2) return 'pos-left2';
    if (diff === 2) return 'pos-right2';
    return 'pos-hidden';
  }

  return (
    <Layout activeMenu="home">
      <div className="home-container">
        <section className="hero">
          <div className="hero-title">
            <p className="hero-title-main animate-slide-up">긴 문서, 한눈에 핵심만</p>
            <p className="hero-title-sub animate-slide-up delay-200">AI 기반 스마트 요약 시스템</p>
          </div>

          <div className="university-info animate-slide-up delay-400">한양대학교 ERICA x 롯데이노베이트</div>

          <div className="scroll-indicator" aria-hidden="true">
            <span className="scroll-text">Scroll</span>
            <span className="scroll-arrow" />
          </div>
        </section>

        {/* Service Section */}
        <section className="services">
          <div className="how-to-use-container">
            <div className="how-to-use-title">HOW TO USE</div>
            <div className="how-to-use-underline"></div>
          </div>

          <div className="service-title animate-slide-up">SHOW-GY에서 제공하는 서비스</div>

          <div className="service-card-container">
            <div className={`carousel-viewport ${isMobile ? "is-mobile" : ""}`} ref={viewportRef}>
              <div className={`Home-carousel ${isMobile ? "is-mobile" : ""}`} ref={trackRef}>
                
                {/* 1st Card */}
                <div className={`service-card-bg service-card-upload ${getPosClass(0)}`}>
                  <div className="card-upload-title">
                    어떤 문서든,<br/>원하는 방식으로
                  </div>

                  <div className="card-upload-subtitle">
                    문서를 업로드하여 요약을 시작합니다.
                  </div>

                  <div className="card-upload-info-box">
                    <div className="card-upload-info-text">
                      ① 문서를 업로드하면 OCR로 문서를 읽습니다. <br/>
                      ② 수식, 표, 코드, 이미지를 완벽하게 읽습니다.<br/>
                      ③ 마크다운 언어로 편집이 가능합니다.
                    </div>
                  </div>

                  <div className="card-upload-button">
                    <span className="card-upload-button-text">UPLOAD</span>
                  </div>

                  <div className="card-upload-image-placeholder-1 card-upload-img-1">
                    <img src={card1_1} alt="Card 1 Image 1" />
                  </div>
                  <div className="card-upload-image-placeholder-2 card-upload-img-2">
                    <img src={card1_2} alt="Card 1 Image 2" />
                  </div>
                  <div className="card-upload-image-placeholder-3 card-upload-img-3">
                    <img src={card1_3} alt="Card 1 Image 3" />
                  </div>
                  <div className="card-upload-image-placeholder-4 card-upload-img-4">
                    <img src={card1_4} alt="Card 1 Image 4" />
                  </div>
                </div>

                {/* 2nd Card */}
                <div className={`service-card-bg service-card-team ${getPosClass(1)}`}>
                  <div className="card-team-title">
                     AI 기반 팀 협업 솔루션
                  </div>
                  <div className="card-team-subtitle">
                    팀 협업이 가능하고 팀원간의 스타일을 AI가 파악합니다.
                  </div>
                  <div className="card-team-info-box">
                    <div className="card-team-info-text">
                      ① 프로젝트 추가 시 팀 협업이 가능합니다. <br/>
                      ② 팀원간의 스타일을 AI가 파악합니다.
                    </div>
                  </div>
                  <div className="card-team-image-1"><img src={card2} alt="Card 2 Image 1" />
                  </div>
                </div>

                {/* 3rd Card */}
                <div className={`service-card-bg service-card-chatbot ${getPosClass(2)}`}>
                  <div className="card-chatbot-title">
                    챗봇이 피드백부터 요약까지
                  </div>
                  <div className="card-chatbot-subtitle">
                    원하는 스타일로 챗봇 조절이 가능합니다.
                  </div>
                  <div className="card-chatbot-info-box">
                    <div className="card-chatbot-info-text">
                      ① 챗봇과 대화로 요약에 대한 피드백을 받습니다.
                      <br />
                      ② 검색 엔진을 통한 참고자료를 제공합니다.
                    </div>
                  </div>
                  <div className="card-chatbot-image">
                    <img src={card3} alt="Card 3 Chatbot Illustration" />
                  </div>
                </div>

                {/* 4th Card */}
                <div className={`service-card-bg service-card-tech ${getPosClass(3)}`}>
                  <div className="card-tech-title">
                    AI 기술스택과<br />강력한 요약구조
                  </div>
                  <div className="card-tech-subtitle">
                    고도화된 AI 기술스택을 활용합니다.
                  </div>
                  <div className="card-tech-info-box">
                    <div className="card-tech-info-text">
                      ① 고도화된 AI 기술스택을 활용합니다.
                      <br/>
                      ② 랭체인과 랭그래프로 요약 구조를 강화합니다.
                    </div>
                  </div>
                  <div className="card-tech-main-image"><img src={card4} alt="AI Tech Stack" />
                  </div>
                </div>
              </div>
            </div>  
          </div>
        
          {/* Carousel Controls */}
          <div className="carousel-controls">
            <div
              className={`prev-button ${index === 0 ? "disabled" : ""}`}
              onClick={prev}
            >
              이전
            </div>
            <div
              className={`next-button ${index === total - 1 ? "disabled" : ""}`}
              onClick={next}
            >
              다음
            </div>
          </div>
        </section>
        
        {/* About Us */}
        <section className="about">
          <div className="about-inner">
            <div className="about-us">
              <div className="about-us-title">ABOUT US</div>
              <div className="about-us-underline"></div>
            </div>

            <div className="about-grid">
              {/* ERICA card */}
              <div className="about-card">
                <img src={erica} alt="Erica" className="about-card-img" />
                <div className="about-card-info">
                  <div className="info-row"><span className="label">School</span><span className="colon">:</span><span className="value">한양대학교 에리카</span></div>
                  <div className="info-row"><span className="label">Group</span><span className="colon">:</span><span className="value">소프트웨어융합대학</span></div>
                  <div className="info-row"><span className="label">Address</span><span className="colon">:</span><span className="value">경기도 안산시 상록구 한양대학로 55</span></div>
                  <div className="info-row"><span className="label">Contact</span><span className="colon">:</span><span className="value">showgy0706@gmail.com</span></div>
                </div>
              </div>

              {/* LOTTE card */}
              <div className="about-card">
                <img src={lotte} alt="Lotte" className="about-card-img" />
                <div className="about-card-info">
                  <div className="info-row"><span className="label">Company</span><span className="colon">:</span><span className="value">롯데이노베이트</span></div>
                  <div className="info-row"><span className="label">Role</span><span className="colon">:</span><span className="value">산학 연계 협력 기업</span></div>
                  <div className="info-row"><span className="label">Address</span><span className="colon">:</span><span className="value">서울특별시 금천구 가산디지털2로 179</span></div>
                </div>
              </div>
            </div>

            <button className="more-info-btn" onClick={() => navigate('/showgy')} type="button">
              <span className="more-info-btn-text">More Information</span>
            </button>

          </div>
        </section>

      </div>
    </Layout>
  );
}