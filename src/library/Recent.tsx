import starIcon from '../assets/icons/star.png';

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
];

export default function Recent() {
	return (
		<>
			<div className="library-search">
				<span className="search-icon">🔍</span>
				<input
					type="text"
					placeholder="최근 문서를 검색하세요"
					className="search-input"
				/>
			</div>

			<div className="files-table">
				<div className="table-header">
					<div className="column-header">이름</div>
					<div className="column-header">최근 수정</div>
					<div className="column-header">위치</div>
				</div>
				<div className="table-body">
					{recentFiles.map((file) => (
						<div key={file.id} className="table-row">
							<div className="table-cell name-cell">
								<img src={starIcon} alt="즐겨찾기" className="table-star" />
								{file.name}
							</div>
							<div className="table-cell">{file.date}</div>
							<div className="table-cell">{file.location}</div>
							<div className="table-menu">⋮</div>
						</div>
					))}
				</div>
			</div>
		</>
	);
}
