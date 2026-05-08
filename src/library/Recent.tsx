import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecentDocuments } from '../apis/documentApi';
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

export default function Recent() {
	const navigate = useNavigate();
	const gallRef = useRef<HTMLDivElement | null>(null);
	const btnsRef = useRef<HTMLDivElement | null>(null);
	const gallDegRef = useRef(0);
	const posRef = useRef({ x: 0 });

	const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
	const [recentProjects, setRecentProjects] = useState<RecentProjectRow[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchRecent = async () => {
			try {
				const res = await getRecentDocuments();
				const docs = Array.isArray(res.data) ? res.data : [];
				setRecentFiles(docs.map((doc: any) => ({
					id: doc.id,
					name: doc.title,
					date: doc.access_at ? new Date(doc.access_at).toLocaleDateString('ko-KR') : '',
					team: doc.team_id,
				})));
				setRecentProjects(docs.map((doc: any) => ({
					id: doc.id,
					projectName: doc.title,
					updatedAt: doc.access_at ? new Date(doc.access_at).toLocaleDateString('ko-KR') : '',
					teamName: doc.team_id,
					leader: doc.team_leader,
				})));
			} catch (e) {
				console.error('최근 문서 조회 실패:', e);
			} finally {
				setIsLoading(false);
			}
		};
		fetchRecent();
	}, []);

	const top10 = recentFiles.slice(0, 10);

	useEffect(() => {
		if (top10.length === 0) return;
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

	const handleDocumentClick = (docId: number) => {
		navigate(`/summary/center/${docId}`);
	};

	if (isLoading) {
		return <div className="carousel-root"><h1 className="carousel-title">로딩 중...</h1></div>;
	}

	if (recentFiles.length === 0) {
		return (
			<div className="carousel-root">
				<h1 className="carousel-title">최근 작업한 문서가 없습니다</h1>
			</div>
		);
	}

	return (
		<div className="carousel-root">
			<h1 className="carousel-title">최근 작업한 문서를 빠르게 탐색하세요</h1>

			<div id="scene">
				<div id="gall" ref={gallRef}>
					{top10.map((file, idx) => (
						<div
							key={file.id}
							className="gall-item"
							onClick={() => handleDocumentClick(file.id)}
							style={{ cursor: 'pointer' }}
						>
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
						<div
							key={row.id}
							className="recent-table-row"
							onClick={() => handleDocumentClick(row.id)}
							style={{ cursor: 'pointer' }}
						>
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
