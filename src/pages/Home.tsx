import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { useNavigate } from 'react-router-dom';

import Layout from '../components/Layout';
import '../styles/design.css';
import '../styles/animations.css';
import '../styles/home.css';

import folder from '../assets/icons/folder.png';
import pen from '../assets/icons/pen.png';
import desktop from '../assets/image/desktop.png';
import folder_to_desktop from '../assets/image/folder_to_desktop.png';
import balloon from '../assets/icons/balloon.png';
import robot from '../assets/image/robot.png';
import garbage from '../assets/icons/Garbage.png';
import collection from '../assets/image/collection.png';

import erica from '../assets/image/erica.jpg';
import lotte from '../assets/image/Lotteinovate.jpeg';
import showgy_stand from '../assets/image/showgy_stand.png';

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

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 480);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // useLayoutEffect: 카드/뷰포트 사이즈 측정
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

      // 소수점 흔들림 줄이기
      const step = Math.round((cardW + gap) * 1000) / 1000;
      const offset = Math.round(((viewportW - cardW) / 2) * 1000) / 1000;

      // 값이 진짜 바뀔 때만 setState
      const last = lastRef.current;
      if (last && last.step === step && last.offset === offset) return;
      lastRef.current = { step, offset };

      setStepPx(step);
      setOffsetPx(offset);
    };

    // resize 폭주 방지: rAF로 1프레임에 1번만 측정
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


  // useEffect: index 변경 시 transform 적용
  useEffect(() => {
    if (isMobile) return;
    const track = trackRef.current;
    if (!track) {
      return;
    }
    if (stepPx === 0) return;      // offsetPx가 0인 건 정상일 수 있음
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
          <div className="blob-purple"></div>
          <div className="blob-pink"></div>
          <div className="blob-cyan"></div>
          <div className="show-gy animate-slide-up"><img src={showgy_stand} alt="Show-Gy stand" /></div>
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
                <div className={`service-card-bg ${getPosClass(0)}`}>
                  <div className="service-card-main-text">
                    어떤 문서든,<br/>원하는 방식으로
                  </div>
                  <div className="service-card-gradient"></div>
                  <div className="service-features-box">
                    <div className="service-feature-icon"><img src={folder} alt="Folder Icon" /></div>
                    <div className="service-feature-item service-feature-item-1">
                      파일 업로드 요약<br/>PDF, DOCX 등 파일 업로드
                    </div>
                    <div className="service-pen-icon"><img src={pen} alt="Pen Icon" /></div>
                    <div className="service-feature-item service-feature-item-2">
                      직접 핵심 요약<br/>텍스트 입력 즉시 요약
                    </div>
                  </div>
                  <div className="service-description">
                    AI가 문서의 핵심을 자동으로 요약합니다.
                  </div>
                  <div className="service-desktop-img"><img src={desktop} alt="Desktop Icon" /></div>
                </div>

                {/* 2nd Card */}
                <div className={`service-card-bg ${getPosClass(1)}`}>
                  <div className="service-card-main-text">
                    AI 스마트 요약
                  </div>
                  <div className="service-card-gradient"></div>
                  <div className="service-features-box">
                    <div className="service-feature-icon"><img src={pen} alt="Pen Icon" /></div>
                    <div className="service-feature-item service-feature-item-1">
                      핵심 문장 추출<br/>불필요한 내용 제거
                    </div>
                    <div className="service-pen-icon"><img src={pen} alt="Pen Icon" /></div>
                    <div className="service-feature-item service-feature-item-2">
                      문단 구조 유지<br/>텍스트 맥락 유지 요약
                    </div>
                  </div>
                  <div className="service-desktop-img"><img src={folder_to_desktop} alt="Folder to Desktop Icon" /></div>
                </div>

                {/* 3rd Card */}
                <div className={`service-card-bg ${getPosClass(2)}`}>
                  <div className="service-card-main-text">
                    요약을 대화로 완성
                  </div>
                  <div className="service-card-gradient"></div>
                  <div className="service-balloon-box">
                    <div className="service-feature-icon"><img src={balloon} alt="Balloon Icon" /></div>
                    <div className="service-feature-item service-feature-item-1">
                      챗봇에게 요청해 요약 수정<br/>더 쉽게/더 짧게/결론 중심
                    </div>
                  </div>
                  <div className="service-desktop-img"><img src={robot} alt="Robot Icon" /></div>
                </div>

                {/* 4th Card */}
                <div className={`service-card-bg ${getPosClass(3)}`}>
                  <div className="service-card-main-text">
                    요약한 문서,<br/> 자동으로 정리
                  </div>
                  <div className="service-card-gradient"></div>
                  <div className="service-features-box">
                    <div className="service-feature-icon"><img src={balloon} alt="Balloon Icon" /></div>
                    <div className="service-feature-item service-feature-item-1">
                      문서 보관함<br/>내 드라이브/최근/중요 문서
                    </div>
                    <div className="service-pen-icon"><img src={garbage} alt="Garbage Icon" /></div>
                    <div className="service-feature-item service-feature-item-2">
                      휴지통
                    </div>
                  </div>
                  <div className="service-desktop-img"><img src={collection} alt="Collection Icon" /></div>
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