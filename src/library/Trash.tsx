import documentIcon from '../assets/icons/document.png';
import { useState } from 'react';

interface TrashFile {
	id: number;
	name: string;
	date: string;
	teamName: string;
	teamLeader: string;
}

export default function Trash() {
	const [trashFiles] = useState<TrashFile[]>([]);

	return (
		<section className="trash-page">
			<div className="trash-header">
				<h1 className="library-title">휴지통</h1>
				<button className="empty-trash-btn">휴지통 비우기</button>
			</div>

			<div className="files-table">
				<div className="files-table-header">
					<div className="files-table-col">프로젝트명</div>
					<div className="files-table-col">수정 날짜</div>
					<div className="files-table-col">팀명</div>
					<div className="files-table-col">팀장</div>
				</div>
				<div className="files-table-body">
					{trashFiles.map((file) => (
						<div key={file.id} className="files-table-row">
							<div className="files-table-cell files-table-project">{file.name}</div>
							<div className="files-table-cell">{file.date}</div>
							<div className="files-table-cell">{file.teamName}</div>
							<div className="files-table-cell">{file.teamLeader}</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
