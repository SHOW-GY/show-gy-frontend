import { useEffect, useRef } from 'react';
import '../styles/carousel.css';

interface RecentFile {
	id: number;
	name: string;
	date: string;
	team: string;
}

interface RecentProjectRow {
	id: number;
	projectName: string;
	updatedAt: string;
	teamName: string;
	leader: string;
}

const recentFiles: RecentFile[] = [
	{ id: 1, name: '별 헤는 밤', date: '2025-12-20', team: 'SHOW-GY' },
	{ id: 2, name: '과제 리서치 노트', date: '2025-12-18', team: '컴퓨터비전' },
	{ id: 3, name: '프로젝트 계획서', date: '2025-12-15', team: 'SHOW-GY' },
	{ id: 4, name: '데이터 분석 보고서', date: '2025-12-14', team: '컴퓨터비전' },
	{ id: 5, name: '마케팅 제안서', date: '2025-12-13', team: 'SHOW-GY' },
	{ id: 6, name: '개발 문서', date: '2025-12-12', team: 'SHOW-GY' },
	{ id: 7, name: '디자인 가이드', date: '2025-12-11', team: 'SHOW-GY' },
	{ id: 8, name: '예산 계획서', date: '2025-12-10', team: 'SHOW-GY' },
	{ id: 9, name: '사용자 피드백', date: '2025-12-09', team: 'SHOW-GY' },
	{ id: 10, name: '월간 리포트', date: '2025-12-08', team: 'SHOW-GY' },
	{ id: 11, name: '추가 문서', date: '2025-12-07', team: 'SHOW-GY' },
];

const recentProjects: RecentProjectRow[] = [
	{ id: 1, projectName: '별 헤는 밤', updatedAt: '2025-10-25', teamName: 'SHOW-GY', leader: '김용민' },
	{ id: 2, projectName: '과제 리서치 노트', updatedAt: '2025-10-04', teamName: '컴퓨터비전', leader: '박성철' },
	{ id: 3, projectName: '프로젝트 계획서', updatedAt: '2025-09-29', teamName: 'SHOW-GY', leader: '김용민' },
	{ id: 4, projectName: '데이터 분석 보고서', updatedAt: '2025-09-20', teamName: '컴퓨터비전', leader: '박성철' },
	{ id: 5, projectName: '마케팅 제안서', updatedAt: '2025-09-15', teamName: 'SHOW-GY', leader: '김용민' },
	{ id: 6, projectName: '개발 문서', updatedAt: '2025-09-10', teamName: 'SHOW-GY', leader: '김용민' },
	{ id: 7, projectName: '디자인 가이드', updatedAt: '2025-09-05', teamName: 'SHOW-GY', leader: '김용민' },
	{ id: 8, projectName: '예산 계획서', updatedAt: '2025-08-30', teamName: 'SHOW-GY', leader: '김용민' },
	{ id: 9, projectName: '사용자 피드백', updatedAt: '2025-08-25', teamName: 'SHOW-GY', leader: '김용민' },
	{ id: 10, projectName: '월간 리포트', updatedAt: '2025-08-20', teamName: 'SHOW-GY', leader: '김용민' },
];

export default function Recent() {
	const gallRef = useRef<HTMLDivElement | null>(null);
	const btnsRef = useRef<HTMLDivElement | null>(null);
	const gallDegRef = useRef(0);
	const posRef = useRef({ x: 0 });

	const top10 = recentFiles.slice(0, 10);

	useEffect(() => {
		const $gall = gallRef.current;
		if (!$gall) return;
		const $btns = btnsRef.current;
		const $$item = $gall.querySelectorAll<HTMLDivElement>('.gall-item');
		if ($$item.length === 0) return;

		const deg = 360 / $$item.length;

		const styleItem = () => {
			const itemWidth = $$item[0].offsetWidth;
			const getZ = (() => {
				const widthHalf = itemWidth / 2;
				const radient = (Math.PI / 180) * (deg / 2);
				const r = widthHalf / Math.tan(radient);
				const gap = Math.min(window.innerWidth, window.innerHeight) / 50;
				const result = parseInt(String(r), 10);
				return result + gap;
			})();

			$$item.forEach(($item, idx) => {
				$item.style.transform = `rotateY(${idx * deg}deg) translateZ(${getZ}px)`;
			});
		};

		const rotateGallery = () => {
			$gall.animate(
				[
					{
						transform: `rotateY(${gallDegRef.current}deg)`,
					},
				],
				{
					duration: 1000,
					fill: 'both',
					easing: 'ease-in-out',
				}
			);
		};

		const calcFinalDeg = (newX: number) => {
			if (Math.abs(newX) < 50) return;
			const finalDeg = newX > 0 ? deg : -1 * deg;
			gallDegRef.current += finalDeg;
			rotateGallery();
		};

		const onMouseUp = (e: MouseEvent) => {
			const newX = e.clientX - posRef.current.x;
			calcFinalDeg(newX);
			$gall.addEventListener('mousedown', onMouseDown, { once: true });
		};

		const onMouseDown = (e: MouseEvent) => {
			posRef.current.x = e.clientX;
			window.addEventListener('mouseup', onMouseUp, { once: true });
		};

		const onTouchEnd = (e: TouchEvent) => {
			const newX = e.changedTouches[0].clientX - posRef.current.x;
			calcFinalDeg(newX);
			$gall.addEventListener('touchstart', onTouchStart, { once: true });
		};

		const onTouchStart = (e: TouchEvent) => {
			posRef.current.x = e.touches[0].clientX;
			window.addEventListener('touchend', onTouchEnd, { once: true });
		};

		const onResize = () => {
			styleItem();
		};

		const onBtnsClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (target.tagName !== 'BUTTON') return;
			const direction = (target as HTMLButtonElement).dataset.direction;
			const finalDeg = direction === 'prev' ? deg : -1 * deg;
			gallDegRef.current += finalDeg;
			rotateGallery();
		};

		styleItem();
		$gall.addEventListener('mousedown', onMouseDown, { once: true });
		$gall.addEventListener('touchstart', onTouchStart, { once: true });
		window.addEventListener('resize', onResize);
		$btns?.addEventListener('click', onBtnsClick);

		return () => {
			$gall.removeEventListener('mousedown', onMouseDown);
			$gall.removeEventListener('touchstart', onTouchStart);
			window.removeEventListener('resize', onResize);
			$btns?.removeEventListener('click', onBtnsClick);
			window.removeEventListener('mouseup', onMouseUp);
			window.removeEventListener('touchend', onTouchEnd);
		};
	}, [top10.length]);

	return (
		<div className="carousel-root">
			<div id="scene">
				<div id="gall" ref={gallRef}>
					{top10.map((file, idx) => (
						<div key={file.id} className="gall-item">
							<div className="gall-card">
								<div className="gall-index">{idx + 1}</div>
								<div className="gall-title">{file.name}</div>
								<div className="gall-meta">{file.date}</div>
								<div className="gall-meta">{file.team}</div>
							</div>
						</div>
					))}
				</div>
			</div>
			<div id="btns" ref={btnsRef}>
				<button className="btn" data-direction="prev" aria-label="이전">
					prev
				</button>
				<button className="btn" data-direction="next" aria-label="다음">
					next
				</button>
			</div>
			<div className="recent-table">
				<div className="recent-table-header">
					<div className="recent-table-col">프로젝트명</div>
					<div className="recent-table-col">수정 날짜</div>
					<div className="recent-table-col">팀명</div>
					<div className="recent-table-col">팀장</div>
				</div>
				<div className="recent-table-body">
					{recentProjects.map((row) => (
						<div key={row.id} className="recent-table-row">
							<div className="recent-table-cell recent-table-project">{row.projectName}</div>
							<div className="recent-table-cell">{row.updatedAt}</div>
							<div className="recent-table-cell">{row.teamName}</div>
							<div className="recent-table-cell">{row.leader}</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}