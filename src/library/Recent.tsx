import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import starIcon from '../assets/icons/star.png';
import '../styles/library.css';

interface RecentFile {
	id: number;
	name: string;
	date: string;
	location: string;
}

const recentFiles: RecentFile[] = [
	{ id: 1, name: '회의록 요약본', date: '2025-12-20', location: '팀 폴더/회의 자료' },
	{ id: 2, name: '과제 리서치 노트', date: '2025-12-18', location: '내 드라이브/과제' },
	{ id: 3, name: '프로젝트 계획서', date: '2025-12-15', location: '공유 드라이브/기획' },
	{ id: 4, name: '데이터 분석 보고서', date: '2025-12-14', location: '팀 폴더/분석' },
	{ id: 5, name: '마케팅 제안서', date: '2025-12-13', location: '공유 드라이브/마케팅' },
	{ id: 6, name: '개발 문서', date: '2025-12-12', location: '내 드라이브/개발' },
	{ id: 7, name: '디자인 가이드', date: '2025-12-11', location: '팀 폴더/디자인' },
	{ id: 8, name: '예산 계획서', date: '2025-12-10', location: '공유 드라이브/재무' },
	{ id: 9, name: '사용자 피드백', date: '2025-12-09', location: '내 드라이브/리서치' },
	{ id: 10, name: '월간 리포트', date: '2025-12-08', location: '팀 폴더/보고서' },
	{ id: 11, name: '추가 문서', date: '2025-12-07', location: '기타' },
];

export default function Recent() {
	// loop: false로 캐러셀이 끝에서 멈추도록 설정
	const [emblaRef, emblaApi] = useEmblaCarousel({
		align: 'start',
		containScroll: 'trimSnaps',
		dragFree: false,
		loop: false,
	});

	const [canScrollPrev, setCanScrollPrev] = useState(false);
	const [canScrollNext, setCanScrollNext] = useState(false);

	const onSelect = useCallback(() => {
		if (!emblaApi) return;
		setCanScrollPrev(emblaApi.canScrollPrev());
		setCanScrollNext(emblaApi.canScrollNext());
	}, [emblaApi]);

	useEffect(() => {
		if (!emblaApi) return;
		onSelect();
		emblaApi.on('select', onSelect);
		emblaApi.on('reInit', onSelect);
	}, [emblaApi, onSelect]);

	const scrollPrev = useCallback(() => {
		if (emblaApi) emblaApi.scrollPrev();
	}, [emblaApi]);

	const scrollNext = useCallback(() => {
		if (emblaApi) emblaApi.scrollNext();
	}, [emblaApi]);

	const top10 = recentFiles.slice(0, 10);

	return (
		<div className="recent-carousel-wrapper">
			<div className="recent-carousel-container">
				<div className="embla">
					<div className="embla__viewport" ref={emblaRef}>
						<div className="embla__container">
							{top10.map((file) => (
								<div key={file.id} className="embla__slide">
									<div className="recent-card">
										<img
											src={starIcon}
											alt="즐겨찾기"
											className="recent-card-star"
										/>

										<div className="recent-card-menu">⋮</div>

										<div className="recent-card-content">
											<div className="recent-card-name">{file.name}</div>
											<div className="recent-card-date">{file.date}</div>
											<div className="recent-card-location">{file.location}</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				<button
					onClick={scrollPrev}
					disabled={!canScrollPrev}
					className="carousel-button carousel-button-prev"
				>
					‹
				</button>

				<button
					onClick={scrollNext}
					disabled={!canScrollNext}
					className="carousel-button carousel-button-next"
				>
					›
				</button>
			</div>
		</div>
	);
}

// npm i embla-carousel embla-carousel-react
