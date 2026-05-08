import glasses from '../assets/icons/Glasses.png';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments } from '../apis/documentApi';

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
					teamName: doc.team_id,
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
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
