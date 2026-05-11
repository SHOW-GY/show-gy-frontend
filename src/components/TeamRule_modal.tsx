import React, { useEffect, useRef, useState } from 'react';
import {
  FormalityLevel,
  ParagraphStructure,
  ResponseFormat,
  SentenceLength,
  TeamRule,
  TeamRuleResponse,
  getTeamRule,
  updateTeamRule,
} from '../apis/teamRuleApi';
import '../styles/modal.css';
import './TeamRule_modal.css';

type Props = {
  open: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  // 디자인 미리보기용: 주어지면 API 호출 건너뛰고 mock으로 채운다.
  mock?: TeamRuleResponse;
};

// 라디오 옵션 + 예시 문장 — 사용자가 옵션만 보고 느낌이 안 올 수 있어 한 줄씩 예시를 박는다.
const PARAGRAPH_OPTIONS: { value: ParagraphStructure; label: string; example: string }[] = [
  { value: 'front_loaded', label: '두괄식', example: '예) 매출이 12% 늘었습니다. 광고 효율이 개선됐고 신규 채널이 기여했기 때문입니다.' },
  { value: 'back_loaded', label: '미괄식', example: '예) 광고 효율이 개선되고 신규 채널이 기여했습니다. 그래서 매출이 12% 늘었습니다.' },
  { value: 'wrapped', label: '양괄식', example: '예) 매출이 12% 늘었습니다. 광고 효율과 신규 채널이 주효했고, 결과적으로 매출 12% 성장으로 이어졌습니다.' },
  { value: 'mixed', label: '혼합', example: '예) 단락마다 결론 위치를 자유롭게. 보고서·이메일 등 문서 성격에 맞춰 변형.' },
];

const RESPONSE_FORMAT_OPTIONS: { value: ResponseFormat; label: string; example: string }[] = [
  { value: 'narrative', label: '서술형', example: '예) 이번 분기 매출은 전년 대비 12% 증가했으며, 광고 효율 개선이 주된 원인이었습니다.' },
  { value: 'bullet', label: '불릿', example: '예) • 매출 +12%   • 광고 효율 +8%   • 신규 채널 기여 4%' },
  { value: 'numbered', label: '번호 매김', example: '예) 1. 매출 +12%   2. 광고 효율 +8%   3. 신규 채널 +4%' },
];

const FORMALITY_OPTIONS: { value: FormalityLevel; label: string; example: string }[] = [
  { value: 'formal', label: '격식체', example: '예) 보고드립니다. 검토 부탁드립니다.' },
  { value: 'semi_formal', label: '반격식', example: '예) 공유드려요. 확인 한 번만 부탁드려요.' },
  { value: 'casual', label: '구어체', example: '예) 일단 공유해요! 한 번 봐주세요~' },
];

const SENTENCE_LENGTH_OPTIONS: { value: SentenceLength; label: string; example: string }[] = [
  { value: 'short', label: '단문', example: '예) 매출이 늘었습니다. 광고 효율도 개선됐습니다.' },
  { value: 'medium', label: '중문', example: '예) 광고 효율이 개선되어 매출이 12% 증가했습니다.' },
  { value: 'long', label: '장문', example: '예) 광고 효율 개선과 신규 채널 도입이 함께 작용한 결과, 이번 분기 매출은 전년 대비 12% 늘어났으며 향후에도 유사한 추세가 예상됩니다.' },
];

const TeamRule_modal: React.FC<Props> = ({ open, onClose, teamId, teamName, mock }) => {
  const modalBackground = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  const [rule, setRule] = useState<TeamRule>({
    paragraph_structure: null,
    response_format: null,
    formality_level: null,
    sentence_length: null,
  });
  const [banWords, setBanWords] = useState<string[]>([]);
  const [banContexts, setBanContexts] = useState<string[]>([]);
  const [banInput, setBanInput] = useState('');
  const [banContextText, setBanContextText] = useState('');

  useEffect(() => {
    if (!open) return;
    if (mock) {
      setIsLeader(mock.is_leader);
      setRule(mock.rule);
      setBanWords(mock.ban_words);
      setBanContexts(mock.ban_contexts);
      setBanContextText(mock.ban_contexts.join('\n'));
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setError(null);
    setLoading(true);
    (async () => {
      try {
        const res: TeamRuleResponse = await getTeamRule(teamId);
        if (cancelled) return;
        setIsLeader(res.is_leader);
        setRule(res.rule);
        setBanWords(res.ban_words);
        setBanContexts(res.ban_contexts);
        setBanContextText(res.ban_contexts.join('\n'));
      } catch (e: any) {
        if (cancelled) return;
        const detail = e?.response?.data?.detail ?? e?.message ?? '규칙을 불러올 수 없습니다.';
        setError(String(detail));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, teamId, mock]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const addBanWord = () => {
    const trimmed = banInput.trim();
    if (!trimmed) return;
    if (banWords.includes(trimmed)) {
      setBanInput('');
      return;
    }
    setBanWords([...banWords, trimmed]);
    setBanInput('');
  };

  const removeBanWord = (word: string) => {
    setBanWords(banWords.filter(w => w !== word));
  };

  const handleSave = async () => {
    if (!isLeader) return;
    setSaving(true);
    setError(null);
    try {
      const contextsArr = banContextText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
      await updateTeamRule({
        team_id: teamId,
        rule,
        ban_words: banWords,
        ban_contexts: contextsArr,
      });
      setBanContexts(contextsArr);
      onClose();
    } catch (e: any) {
      const detail = e?.response?.data?.detail ?? e?.message ?? '저장 실패.';
      setError(String(detail));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="modal-container"
      ref={modalBackground}
      onClick={(e) => {
        if (e.target === modalBackground.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="trm-modal">
        <div className="trm-header">
          <div className="trm-title">팀 규칙 — {teamName}</div>
          <button className="trm-close" onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className="trm-body trm-loading">로딩 중...</div>
        ) : (
          <div className="trm-body">
            {!isLeader && (
              <div className="trm-readonly-banner">
                팀장만 수정할 수 있어요. 읽기 전용으로 표시됩니다.
              </div>
            )}
            {error && <div className="trm-error">{error}</div>}

            <RadioGroup
              title="서술 구조"
              value={rule.paragraph_structure}
              options={PARAGRAPH_OPTIONS}
              disabled={!isLeader}
              onChange={(v) => setRule({ ...rule, paragraph_structure: v })}
            />
            <RadioGroup
              title="응답 포맷"
              value={rule.response_format}
              options={RESPONSE_FORMAT_OPTIONS}
              disabled={!isLeader}
              onChange={(v) => setRule({ ...rule, response_format: v })}
            />
            <RadioGroup
              title="격식 수준"
              value={rule.formality_level}
              options={FORMALITY_OPTIONS}
              disabled={!isLeader}
              onChange={(v) => setRule({ ...rule, formality_level: v })}
            />
            <RadioGroup
              title="문장 길이"
              value={rule.sentence_length}
              options={SENTENCE_LENGTH_OPTIONS}
              disabled={!isLeader}
              onChange={(v) => setRule({ ...rule, sentence_length: v })}
            />

            <section className="trm-section">
              <div className="trm-section-title">금칙 단어</div>
              <div className="trm-ban-row">
                <input
                  className="trm-ban-input"
                  type="text"
                  placeholder="단어 입력 후 Enter"
                  value={banInput}
                  disabled={!isLeader}
                  onChange={(e) => setBanInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addBanWord();
                    }
                  }}
                />
                <button
                  type="button"
                  className="trm-ban-add"
                  onClick={addBanWord}
                  disabled={!isLeader}
                >
                  추가
                </button>
              </div>
              <div className="trm-ban-chips">
                {banWords.length === 0 && <span className="trm-ban-empty">등록된 금칙 단어 없음</span>}
                {banWords.map(w => (
                  <span key={w} className="trm-ban-chip">
                    {w}
                    {isLeader && (
                      <button className="trm-ban-chip-x" onClick={() => removeBanWord(w)}>×</button>
                    )}
                  </span>
                ))}
              </div>
            </section>

            <section className="trm-section">
              <div className="trm-section-title">금칙 문맥 (한 줄에 한 패턴)</div>
              <textarea
                className="trm-ban-context"
                rows={3}
                placeholder={'예)\n허위·과장 표현\n경쟁사 비방'}
                value={banContextText}
                disabled={!isLeader}
                onChange={(e) => setBanContextText(e.target.value)}
              />
            </section>
          </div>
        )}

        <div className="trm-footer">
          <button className="trm-footer-btn cancel" onClick={onClose} disabled={saving}>
            닫기
          </button>
          {isLeader && (
            <button
              className="trm-footer-btn save"
              onClick={handleSave}
              disabled={loading || saving}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

type RadioGroupProps<T extends string> = {
  title: string;
  value: T | null;
  options: { value: T; label: string; example: string }[];
  disabled: boolean;
  onChange: (v: T) => void;
};

function RadioGroup<T extends string>({ title, value, options, disabled, onChange }: RadioGroupProps<T>) {
  return (
    <section className="trm-section">
      <div className="trm-section-title">{title}</div>
      <div className="trm-radio-list">
        {options.map(opt => {
          const checked = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`trm-radio-item${checked ? ' checked' : ''}${disabled ? ' disabled' : ''}`}
            >
              <input
                type="radio"
                name={title}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(opt.value)}
              />
              <span className="trm-radio-label">{opt.label}</span>
              <span className="trm-radio-example">{opt.example}</span>
            </label>
          );
        })}
      </div>
    </section>
  );
}

export default TeamRule_modal;
