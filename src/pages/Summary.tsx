import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import 'quill/dist/quill.snow.css';
import '../styles/design.css';
import '../styles/animations.css';
import '../styles/summary.css';
import fileuploadIcon from '../assets/icons/fileupload.png';
import searchIcon from '../assets/icons/search.png';
import showgy from '../assets/image/showgy.png';

import Layout from '../components/Layout';
import { getTeamInfo } from '../apis/cooperation';
import { uploadDocument, summarizeDocuments } from '../apis/documentApi';

interface TeamOption {
  team_id: string;
  team_name: string;
}

interface TeamInfoResponse {
  status: string;
  data: TeamOption[];
}

export default function Summary() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [userNickname, setUserNickname] = useState<string>('사용자');
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('personal');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  // 각 파일에 대응하는 doc_type 평행 배열. 파일 추가 시 'general' 기본값 push,
  // 삭제 시 같은 idx 제거. summarizeDocuments 호출 시 함께 전송.
  const [docTypes, setDocTypes] = useState<string[]>([]);
  const DOC_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: 'general', label: '일반' },
    { value: 'template', label: '양식' },
    { value: 'paper', label: '논문' },
    { value: 'meeting', label: '회의록' },
    { value: 'official_report', label: '공문·보고서' },
  ];
  const [isUploading, setIsUploading] = useState(false);
  const [isTeamLoading, setIsTeamLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const didFetchRef = useRef(false);

  {/*사용자 정보 로드*/}
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserNickname(user.nickname || user.name || '사용자');
      } catch (e) {
        setUserNickname('사용자');
      }
    }
  }, []);

  {/*팀 선택*/}
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;

    const fetchTeamInfo = async () => {
      setIsTeamLoading(true);
      try {
        const res = await getTeamInfo();

        const teams = Array.isArray(res.data) ? res.data : [];
        setTeamOptions(teams);

        const saved = localStorage.getItem("team_name");
        if (saved && (saved === "personal" || teams.some(t => t.team_name === saved))) {
          setSelectedTeam(saved);
        } else {
          setSelectedTeam("personal");
        }
      } catch (err) {
        setErrorMessage("팀 정보를 불러오지 못했습니다.");
      } finally {
        setIsTeamLoading(false);
      }
    };

    fetchTeamInfo();
  }, []);

  {/*팀 선택 핸들러*/}
  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTeamName = e.target.value;
    setSelectedTeam(newTeamName);
    if (newTeamName === "personal") localStorage.removeItem("team_name");
    else localStorage.setItem("team_name", newTeamName);
  };

  {/*파일 관련 코드*/}
  const isAcceptedFile = (file: File) => {
    const allowed = ['.pdf', '.doc', '.docx', '.txt', '.md'];
    const name = file.name.toLowerCase();
    return allowed.some((ext) => name.endsWith(ext));
  };

  const appendFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const f of arr) {
      if (isAcceptedFile(f)) accepted.push(f);
      else rejected.push(f.name);
    }
    if (rejected.length > 0) {
      setErrorMessage(`지원하지 않는 파일 형식: ${rejected.join(', ')} (.pdf, .doc, .docx, .txt, .md)`);
    } else {
      setErrorMessage('');
    }
    if (accepted.length > 0) {
      // uploadedFiles와 docTypes 동시 갱신 (dedup 결과와 인덱스가 1:1로 유지되도록 함수형 setter 안에서 처리)
      setUploadedFiles((prev) => {
        const seen = new Set(prev.map((f) => `${f.name}::${f.size}`));
        const merged = [...prev];
        const addedCount: number[] = [];
        for (const f of accepted) {
          const key = `${f.name}::${f.size}`;
          if (!seen.has(key)) {
            merged.push(f);
            seen.add(key);
            addedCount.push(1);
          }
        }
        // setUploadedFiles 콜백 안에서 setDocTypes를 호출하면 stale closure 위험 →
        // 동기적으로 prev 길이 기반 차이만큼 docTypes 추가
        setDocTypes((prevTypes) => [...prevTypes, ...addedCount.map(() => 'general')]);
        return merged;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      appendFiles(e.target.files);
      // input value 초기화 — 같은 파일 재선택 가능하도록
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      appendFiles(e.dataTransfer.files);
    }
  };

  {/*개별 파일 제거 — uploadedFiles와 docTypes를 같은 idx에서 함께 제거*/}
  const handleFileRemove = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setDocTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDocTypeChange = (index: number, newType: string) => {
    setDocTypes((prev) => prev.map((t, i) => (i === index ? newType : t)));
  };

  {/*텍스트 입력 핸들러*/}
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSearchQuery(e.target.value);
    e.target.style.height = 'auto';
    const maxHeight = 135;
    e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
    setErrorMessage('');
  };

  const handleSearch = async () => {
    const hasFiles = uploadedFiles.length > 0;
    const trimmedQuery = searchQuery.trim();

    if (!hasFiles && !trimmedQuery) {
      setErrorMessage('파일을 업로드하거나 문서 내용을 입력해주세요.');
      return;
    }
    if (hasFiles && selectedTeam === 'personal') {
      setErrorMessage('소속된 팀이 없어 문서 업로드에 실패했습니다. 팀에 가입한 뒤 다시 시도해주세요.');
      return;
    }
    setIsUploading(true);
    setErrorMessage('');
    try {
      if (hasFiles) {
        // 파일이 있으면 무조건 요약 엔드포인트로 — query 가 비었으면 백엔드 기본 동작 수행
        if (!trimmedQuery) {
          setErrorMessage('요약 관점을 입력해주세요. (예: "예산 관련 부분만 정리해줘")');
          setIsUploading(false);
          return;
        }
        const res = await summarizeDocuments({
          team_name: selectedTeam,
          query: trimmedQuery,
          files: uploadedFiles,
          doc_types: docTypes,
        });
        localStorage.removeItem('uploadedDocument');
        navigate(`/summary/center/${res.data.document_id}`);
      } else {
        // 파일 없이 텍스트만 입력한 경우 — 기존 draftText 흐름 유지 (직접 입력 모드)
        localStorage.setItem('draft_document', trimmedQuery);
        navigate('/summary/center', { state: { draftText: trimmedQuery } });
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 404 && typeof detail === 'string' && detail.includes('팀')) {
        setErrorMessage('소속된 팀이 없어 문서 업로드에 실패했습니다. 팀에 가입한 뒤 다시 시도해주세요.');
      } else if (typeof detail === 'string') {
        setErrorMessage(detail);
      } else {
        setErrorMessage('요약 생성에 실패했습니다.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Layout activeMenu="summary">
      <div className="summary-container">
        <div className="blob-purple"></div>
        <div className="blob-pink"></div>
        <div className="blob-cyan"></div>

        <div className="summary-team-selector">
          <div className="summary-team-prompt">
            <img src={showgy} alt="showgy" className="summary-team-avatar" />
            <div className="summary-team-bubble">당신의 팀을 선택해주세요</div>
          </div>
          <div className="summary-team-select-wrap">
            <select
              className="summary-team-select"
              value={selectedTeam}
              onChange={handleTeamChange}
              disabled={isTeamLoading}
              aria-label="팀 선택"
            >
              <option value="personal">개인용</option>
              {teamOptions.map((team) => (
                <option key={team.team_id} value={team.team_name}>
                  {team.team_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="summary-hero-title">
          <p className="hero-title-main animate-reveal-left">안녕하세요, {userNickname}님</p>
          <p className="hero-title-sub animate-reveal-left">원하는 문서를 업로드 또는 작성해주세요.</p>
        </div>

        <div className="summary-input-area">
          {uploadedFiles.length > 0 && (
            <div className="uploaded-file-list" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {uploadedFiles.map((file, idx) => {
                const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
                const currentType = docTypes[idx] || 'general';
                return (
                  <div key={`${file.name}-${idx}`} className="uploaded-file-preview">
                    <div className="file-icon">{ext}</div>
                    <span className="file-name">{file.name}</span>
                    <select
                      value={currentType}
                      onChange={(e) => handleDocTypeChange(idx, e.target.value)}
                      aria-label={`${file.name} 문서 유형`}
                      disabled={isUploading}
                      style={{
                        marginLeft: 6,
                        padding: '2px 6px',
                        borderRadius: 4,
                        border: '1px solid #ccc',
                        fontSize: 12,
                        background: '#fff',
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {DOC_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button
                      className="file-remove-btn"
                      onClick={() => handleFileRemove(idx)}
                      aria-label={`${file.name} 제거`}
                    >×</button>
                  </div>
                );
              })}
            </div>
          )}
          <div
            className="summary-input-shell"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <textarea
              className="summary-text-input"
              placeholder={uploadedFiles.length > 0 ? "요약 관점을 입력하세요. (예: 예산 관련 부분만 비교해줘)" : "문서 내용을 입력하세요."}
              aria-label="요약 관점을 입력하세요"
              value={searchQuery}
              onChange={handleInputChange}
              rows={1}
              style={{ resize: 'none' }}
              disabled={isUploading}
            />
            {errorMessage && (
              <div className="summary-error-msg" aria-live="polite" style={{ color: '#ff6b6b', marginTop: 8 }}>
                {errorMessage}
              </div>
            )}
            {isUploading && (
              <div className="summary-uploading-msg" aria-live="polite" style={{ color: '#888', marginTop: 8, fontSize: 13 }}>
                요약 생성 중… (최대 1~2분 소요)
              </div>
            )}
            <div className="summary-upload-group">
              <input
                type="file"
                id="summary-file-input"
                className="summary-file-input"
                aria-label="파일 업로드"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.md"
                multiple
              />
              <label htmlFor="summary-file-input" className="summary-upload-hit">
                <img src={fileuploadIcon} alt="파일 업로드" className="summary-upload-icon" />
              </label>
              <button
                className="summary-search-btn"
                aria-label="검색"
                onClick={handleSearch}
                disabled={isUploading}
              >
                <img src={searchIcon} alt="검색" className="summary-search-icon" />
              </button>
            </div>
          </div>
        </div>

        <div className="summary-university-info">한양대학교 ERICA x 롯데이노베이트</div>

      </div>
    </Layout>
  );
}