import glasses from '../assets/icons/Glasses.png';
import garbage from '../assets/icons/Garbage.png';
import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, moveToTrash } from '../apis/documentApi';

interface FileItem {
	id: number;
	name: string;
	date: string;
	teamName: string;
	teamLeader: string;
	status: string;
	rejectReason: string | null;
}

// 문서 상태 → 작성자(팀원)에게 보여줄 배지 라벨/색.
// submitted=대기중 / approved=완료 / rejected=반려 / 그 외(pending·editing·completed)=작성 중
function statusBadge(status: string): { label: string; bg: string; fg: string } {
	switch (status) {
		case 'submitted': return { label: '대기중', bg: 'rgba(245,158,11,0.18)', fg: '#fbbf24' };
		case 'approved':  return { label: '완료',   bg: 'rgba(16,185,129,0.18)', fg: '#34d399' };
		case 'rejected':  return { label: '반려',   bg: 'rgba(239,68,68,0.18)',  fg: '#f87171' };
		default:          return { label: '작성 중', bg: 'rgba(148,163,184,0.18)', fg: '#cbd5e1' };
	}
}

export default function Alldocument() {
	const navigate = useNavigate();
	const [files, setFiles] = useState<FileItem[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	// 반려 사유 펼친 문서 id (배지 클릭 토글)
	const [openReasonId, setOpenReasonId] = useState<number | null>(null);

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
					status: doc.status || '',
					rejectReason: doc.reject_reason ?? null,
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
					<div className="files-table-col">상태</div>
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
						filteredFiles.map((file) => {
							const badge = statusBadge(file.status);
							const isRejected = file.status === 'rejected' && !!file.rejectReason;
							return (
							<Fragment key={file.id}>
							<div
								className="files-table-row"
								onClick={() => handleDocumentClick(file.id)}
								style={{ cursor: 'pointer' }}
							>
								<div className="files-table-cell files-table-project">{file.name}</div>
								<div className="files-table-cell">
									<span
										title={isRejected ? `반려 사유: ${file.rejectReason}` : undefined}
										onClick={isRejected ? (e) => { e.stopPropagation(); setOpenReasonId(prev => prev === file.id ? null : file.id); } : undefined}
										style={{
											display: 'inline-flex', alignItems: 'center', gap: 4,
											padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
											background: badge.bg, color: badge.fg,
											cursor: isRejected ? 'pointer' : 'default', whiteSpace: 'nowrap',
										}}
									>
										{badge.label}{isRejected ? ' ⓘ' : ''}
									</span>
								</div>
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
							{isRejected && openReasonId === file.id && (
								<div className="files-reason-row">
									📌 반려 사유: {file.rejectReason}
								</div>
							)}
							</Fragment>
							);
						})
					)}
				</div>
			</div>
		</div>
	);
}
