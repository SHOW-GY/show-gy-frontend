import glasses from '../assets/icons/Glasses.png';
import { useState } from 'react';

interface FileItem {
	id: number;
	name: string;
	date: string;
	teamName: string;
	teamLeader: string;
}

export default function Alldocument() {
	const [files] = useState<FileItem[]>([
		{ id: 1, name: 'OCR 기반 스마트 요약 시스템', date: '2025-10-25', teamName: 'SHOW-GY', teamLeader: '김용민' },
		{ id: 2, name: 'YOLO기반 이상치 탐지', date: '2025-10-04', teamName: '컴퓨터비전', teamLeader: '박성철' },
	]);
	return (
		<div className="alldoc">
			{/* 상단 바 */}
			<div className="library-search">
				<span className="search-icon"><img src={glasses} alt="Glasses Icon" /></span>
				<input 
					type="text" 
					placeholder="검색어를 입력해주세요"
					className="search-input"
				/>
			</div>

			{/* 파일 테이블 */}
			<div className="files-table">
				<div className="files-table-header">
					<div className="files-table-col">프로젝트명</div>
					<div className="files-table-col">수정 날짜</div>
					<div className="files-table-col">팀명</div>
					<div className="files-table-col">팀장</div>
				</div>
				<div className="files-table-body">
					{files.map((file) => (
						<div key={file.id} className="files-table-row">
							<div className="files-table-cell files-table-project">{file.name}</div>
							<div className="files-table-cell">{file.date}</div>
								<div className="files-table-cell">{file.teamName}</div>
								<div className="files-table-cell">{file.teamLeader}</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}