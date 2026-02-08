import React from 'react';
import glasses from '../assets/icons/Glasses.png';

interface FileItem {
	id: number;
	name: string;
	date: string;
	Leader: string;
}

interface AlldocumentProps {
	files: FileItem[];
}

export default function Alldocument({ files }: AlldocumentProps) {
	return (
		<>
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
				<div className="table-header">
					<div className="column-header">팀명</div>
					<div className="column-header">수정 날짜</div>
					<div className="column-header">팀장</div>
				</div>
				<div className="table-body">
					{files.map((file) => (
						<div key={file.id} className="table-row">
							<div className="table-cell name-cell">
								{file.name}
							</div>
							<div className="table-cell">{file.date}</div>
							<div className="table-cell">{file.Leader}</div>
							<div className="table-menu">⋮</div>
						</div>
					))}
				</div>
			</div>
		</>
	);
}
