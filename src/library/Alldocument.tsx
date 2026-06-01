import glasses from '../assets/icons/Glasses.png';
import garbage from '../assets/icons/Garbage.png';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, moveToTrash } from '../apis/documentApi';

interface FileItem {
	id: number;
	name: string;
	date: string;
	teamName: string;
	teamLeader: string;
}

export default function Alldocument() {
	const navigate = useNavigate();
	const [files, setFiles] = useState<FileItem[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchDocuments = async () => {
			try {
				const res = await getDocuments();
				const docs = Array.isArray(res.data) ? res.data : [];
				setFiles(docs.map((doc: any) => ({
					id: doc.id,
					name: doc.title,
					date: doc.access_at ? new Date(doc.access_at).toLocaleDateString('ko-KR') : '',
					// team_name(표시명)을 우선, 없으면 team_id(코드)로 폴백
					teamName: doc.team_name || doc.team_id,
					teamLeader: doc.team_leader,
				})));
			} catch (e) {
				console.error('문서 목록 조회 실패:', e);
			} finally {
				setIsLoading(false);
			}
		};
		fetchDocuments();
	}, []);

	const filteredFiles = files.filter(f =>
		f.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const handleDocumentClick = (fileId: number) => {
		navigate(`/summary/center/${fileId}`);
	};

	const handleMoveToTrash = async (fileId: number, fileName: string, e: React.MouseEvent) => {
		// 행 클릭 navigation이 발화하지 않도록 stopPropagation
		e.stopPropagation();
		if (!window.confirm(`"${fileName}" 문서를 휴지통으로 이동하시겠어요?`)) return;
		try {
			await moveToTrash({ document_id: String(fileId) });
			// 낙관적 업데이트 — 서버 응답 성공 후 로컬 상태에서 제거
			setFiles(prev => prev.filter(f => f.id !== fileId));
		} catch (err) {
			console.error('휴지통 이동 실패:', err);
			window.alert('휴지통 이동에 실패했습니다. 잠시 후 다시 시도해주세요.');
		}
	};

	return (
		<div className="alldoc">
			<div className="library-search">
				<span className="search-icon"><img src={glasses} alt="Glasses Icon" /></span>
				<input
					type="text"
					placeholder="검색어를 입력해주세요"
					className="search-input"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			<div className="files-table">
				<div className="files-table-header">
					<div className="files-table-col">프로젝트명</div>
					<div className="files-table-col">수정 날짜</div>
					<div className="files-table-col">팀명</div>
					<div className="files-table-col">팀장</div>
					<div className="files-table-col" style={{ textAlign: 'center' }}>삭제</div>
				</div>
				<div className="files-table-body">
					{isLoading ? (
						<div className="files-table-row">
							<div className="files-table-cell" style={{ textAlign: 'center', gridColumn: '1 / -1' }}>로딩 중...</div>
						</div>
					) : filteredFiles.length === 0 ? (
						<div className="files-table-row">
							<div className="files-table-cell" style={{ textAlign: 'center', gridColumn: '1 / -1' }}>문서가 없습니다.</div>
						</div>
					) : (
						filteredFiles.map((file) => (
							<div
								key={file.id}
								className="files-table-row"
								onClick={() => handleDocumentClick(file.id)}
								style={{ cursor: 'pointer' }}
							>
								<div className="files-table-cell files-table-project">{file.name}</div>
								<div className="files-table-cell">{file.date}</div>
								<div className="files-table-cell">{file.teamName}</div>
								<div className="files-table-cell">{file.teamLeader}</div>
								<div className="files-table-cell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'visible' }}>
									<button
										type="button"
										onClick={(e) => handleMoveToTrash(file.id, file.name, e)}
										aria-label={`${file.name} 휴지통으로 이동`}
										title="휴지통으로 이동"
										style={{
											background: 'transparent',
											border: 'none',
											padding: 4,
											cursor: 'pointer',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											borderRadius: 4,
											opacity: 0.7,
										}}
										onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
										onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.7'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
									>
										<img src={garbage} alt="" style={{ width: 18, height: 18 }} />
									</button>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
