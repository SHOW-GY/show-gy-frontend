import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { marked } from "marked";
import Quill from 'quill';
import 'quilljs-markdown/dist/quilljs-markdown-common-style.css'
import 'quill/dist/quill.snow.css';
import Header from '../components/Header';
import '../styles/design.css';
import '../styles/animations.css';
import '../styles/summary.css';
import { uploadDocument } from '../apis/documentApi';
import fileuploadIcon from '../assets/icons/fileupload.png';
import searchIcon from '../assets/icons/search.png';

export default function Summary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userNickname, setUserNickname] = useState<string>('사용자');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();
  const quillInstances = useRef<(Quill | null)[]>([]);

  // 사용자 정보 로드
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

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  // 파일 제거 핸들러
  const handleFileRemove = () => {
    setUploadedFile(null);
    const fileInput = document.getElementById('summary-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // 텍스트 입력 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSearchQuery(e.target.value);
    e.target.style.height = 'auto';
    const maxHeight = 135;
    e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
  };

  // 검색/업로드 핸들러
  const handleSearch = async () => {
    try {
      const hasText = searchQuery.trim().length > 0;
      const hasFile = !!uploadedFile;
      let uploadData: { title?: string; text?: string; summary?: string } | null = null;

      if (!hasText && !hasFile) {
        setErrorMessage('문서를 업로드 또는 작성해주세요');
        return;
      }
      setErrorMessage('');

      setIsUploading(true);
      
      if (hasFile) {
        // 필수 쿼리 파라미터 준비 (team_id, approver_id, creator_id)
        const userStr = localStorage.getItem('user');
        let creatorId: string | undefined;
        try {
          if (userStr) {
            const u = JSON.parse(userStr);
            creatorId = u?.user_id;
          }
        } catch {}

        let teamId = localStorage.getItem('team_id') || undefined;
        let approverId = localStorage.getItem('approver_id') || undefined;

        // 필요한 경우 간단히 입력 받기 (임시)
        if (!teamId) {
          teamId = window.prompt('team_id가 필요합니다. 값을 입력해주세요.') || undefined;
          if (teamId) localStorage.setItem('team_id', teamId);
        }
        if (!approverId) {
          approverId = window.prompt('approver_id가 필요합니다. 값을 입력해주세요.') || undefined;
          if (approverId) localStorage.setItem('approver_id', approverId);
        }

        const res = await uploadDocument(uploadedFile!, {
          team_id: teamId,
          approver_id: approverId,
          creator_id: creatorId,
        });
        console.log('문서 업로드 결과:', res);

        const payload = (res as any)?.data ?? res;
        const extracted = payload?.extracted_data ?? payload?.data?.extracted_data;
        uploadData = {
          title: payload?.title ?? payload?.data?.title ?? uploadedFile?.name,
          text: extracted?.text ?? '',
          summary: extracted?.summary ?? '',
        };
      }
      
      // 요약 페이지로 이동
      if (hasText) {
        localStorage.setItem('draft_document', searchQuery);
      }
      
      navigate('/summary/center', {
        state: {
          draftText: hasText ? searchQuery : null,
          uploadData,
        },
      });
    } catch (err) {
      console.error('문서 업로드 실패:', err);
      const hasText = searchQuery.trim().length > 0;
      navigate('/summary/center', {
        state: {
          draftText: hasText ? searchQuery : null,
          uploadErrorMessage: '업로드에 실패하였습니다',
        },
      });
    } finally {
      setIsUploading(false);
    }
  };

  const insertMarkdownToQuill = async (md: string, pageIdx = 0) => {
    const quill = quillInstances.current[pageIdx];
    if (!quill) return;

    // Markdown -> HTML
    const html = await marked.parse(md);


    quill.clipboard.dangerouslyPasteHTML(html);
  };

  return (
    <div className="summary-container">
      <div className="noise-large"></div>
      <div className="noise-small"></div>

      <div className="blob-purple"></div>
      <div className="blob-pink"></div>
      <div className="blob-cyan"></div>

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
              onClick={handleSearch}
              className="summary-search-btn"
              aria-label="검색"
            >
              <img src={searchIcon} alt="검색" className="summary-search-icon" />
            </button>
          </div>
        </div>
      </div>

      <div className="summary-university-info">한양대학교 ERICA x 롯데이노베이트</div>

      <Header activeMenu="summary" />
    </div>
  );
}