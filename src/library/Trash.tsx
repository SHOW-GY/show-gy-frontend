import { useState, useEffect } from 'react';
import { getDeletedDocuments, restoreDocument } from '../apis/documentApi';

interface TrashFile {
	id: number;
	name: string;
	date: string;
	teamName: string;
	teamLeader: string;
}

export default function Trash() {
	const [trashFiles, setTrashFiles] = useState<TrashFile[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchTrash = async () => {
		try {
			const res = await getDeletedDocuments();
			const docs = Array.isArray(res.data) ? res.data : [];
			setTrashFiles(docs.map((doc: any) => ({
				id: doc.id,
				name: doc.title,
				date: doc.access_at ? new Date(doc.access_at).toLocaleDateString('ko-KR') : '',
				teamName: doc.team_id,
				teamLeader: doc.team_leader,
			})));
		} catch (e) {
			console.error('휴지통 조회 실패:', e);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchTrash();
	}, []);

	const handleRestore = async (fileId: number) => {
		try {
			await restoreDocument(fileId);
			setTrashFiles(prev => prev.filter(f => f.id !== fileId));
		} catch (e) {
			console.error('복구 실패:', e);
		}
	};

	return (
		<section className="trash-page">
			<div className="trash-header">
				<h1 className="library-title">휴지통</h1>
			</div>

			<div className="files-table">
				<div className="files-table-header">
					<div className="files-table-col">프로젝트명</div>
					<div className="files-table-col">수정 날짜</div>
					<div className="files-table-col">팀명</div>
					<div className="files-table-col">팀장</div>
					<div className="files-table-col">작업</div>
				</div>
				<div className="files-table-body">
					{isLoading ? (
						<div className="files-table-row">
							<div className="files-table-cell" style={{ textAlign: 'center', gridColumn: '1 / -1' }}>로딩 중...</div>
						</div>
					) : trashFiles.length === 0 ? (
						<div className="files-table-row">
							<div className="files-table-cell" style={{ textAlign: 'center', gridColumn: '1 / -1' }}>휴지통이 비어있습니다.</div>
						</div>
					) : (
						trashFiles.map((file) => (
							<div key={file.id} className="files-table-row">
								<div className="files-table-cell files-table-project">{file.name}</div>
								<div className="files-table-cell">{file.date}</div>
								<div className="files-table-cell">{file.teamName}</div>
								<div className="files-table-cell">{file.teamLeader}</div>
								<div className="files-table-cell">
									<button
										onClick={() => handleRestore(file.id)}
										style={{
											padding: '4px 12px', borderRadius: 4, border: '1px solid #ddd',
											background: '#fff', cursor: 'pointer', fontSize: 12,
										}}
									>
										복구
									</button>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</section>
	);
}
