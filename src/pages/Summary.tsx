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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
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
        console.error('사용자 정보 파싱 실패:', e);
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

        const saved = localStorage.getItem("team_id");
        if (saved && (saved === "personal" || teams.some(t => t.team_id === saved))) {
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

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTeamId = e.target.value;
    setSelectedTeam(newTeamId);

    if (newTeamId === "personal") localStorage.removeItem("team_id");
    else localStorage.setItem("team_id", newTeamId);
  };

  {/*파일 관련 코드*/}  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setErrorMessage('');
    }
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
    const fileInput = document.getElementById('summary-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSearchQuery(e.target.value);
    e.target.style.height = 'auto';
    const maxHeight = 135;
    e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
    setErrorMessage('');
  };

  const handleSearch = async () => {
    // TODO: 문서 업로드 및 요약 처리 로직 구현(Marker PDF 구현되면 코드 짤게요)
    if (!uploadedFile && !searchQuery.trim()) {
      setErrorMessage('파일을 업로드하거나 문서 내용을 입력해주세요.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');

    try {
      console.log('문서 업로드:', { uploadedFile, searchQuery, selectedTeam });
    } catch (err) {
      console.error('문서 업로드 실패:', err);
      setErrorMessage('문서 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Layout activeMenu="summary">
      <div className="summary-container">
        <div className="noise-large"></div>
        <div className="noise-small"></div>

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
                <option key={team.team_id} value={team.team_id}>
                  {team.team_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="hero-title">
          <p className="hero-title-main animate-reveal-left">안녕하세요, {userNickname}님</p>
          <p className="hero-title-sub animate-reveal-left">원하는 문서를 업로드 또는 작성해주세요.</p>
        </div>

        <div className="summary-input-area">
          {uploadedFile && (
            <div className="uploaded-file-preview">
              <div className="file-icon">PDF</div>
              <span className="file-name">{uploadedFile.name}</span>
              <button className="file-remove-btn" onClick={handleFileRemove}>×</button>
            </div>
          )}
          <div className="summary-input-shell">
            <textarea
              className="summary-text-input"
              placeholder="문서 내용을 입력하세요."
              aria-label="문서 내용을 입력하세요"
              value={searchQuery}
              onChange={handleInputChange}
              rows={1}
              style={{ resize: 'none' }}
            />
            {errorMessage && (
              <div className="summary-error-msg" aria-live="polite" style={{ color: '#ff6b6b', marginTop: 8 }}>
                {errorMessage}
              </div>
            )}
            <div className="summary-upload-group">
              <input 
                type="file" 
                id="summary-file-input" 
                className="summary-file-input" 
                aria-label="파일 업로드"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
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