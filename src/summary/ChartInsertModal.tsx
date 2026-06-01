/**
 * 차트 삽입 모달 — 종류 선택 + mermaid 코드 입력 → 본문에 SVG 로 삽입.
 *
 * 종류별 기본 템플릿을 제공해서 mermaid 문법 몰라도 데이터만 바꿔서 쓸 수 있게.
 */
import { useState } from 'react';

interface ChartInsertModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (mermaidCode: string) => void;
}

type ChartType = 'pie' | 'flowchart' | 'sequence' | 'gantt' | 'xychart' | 'mindmap';

const CHART_PRESETS: { type: ChartType; label: string; desc: string; template: string }[] = [
  {
    type: 'pie',
    label: '원 차트 (비율)',
    desc: '항목별 비율을 한눈에',
    template: `pie title 카테고리별 비율
  "기획" : 30
  "개발" : 45
  "테스트" : 15
  "배포" : 10`,
  },
  {
    type: 'xychart',
    label: '막대/꺾은선 차트',
    desc: '수치 데이터 추이',
    template: `xychart-beta
  title "월별 사용자"
  x-axis [1월, 2월, 3월, 4월, 5월]
  y-axis "사용자 수" 0 --> 500
  bar [120, 180, 250, 320, 420]
  line [120, 180, 250, 320, 420]`,
  },
  {
    type: 'flowchart',
    label: '플로우차트',
    desc: '프로세스/의사결정 흐름',
    template: `flowchart TD
  A[시작] --> B{조건?}
  B -->|예| C[처리 1]
  B -->|아니오| D[처리 2]
  C --> E[종료]
  D --> E`,
  },
  {
    type: 'sequence',
    label: '시퀀스 다이어그램',
    desc: '시간 순서 상호작용',
    template: `sequenceDiagram
  participant 사용자
  participant 서버
  participant DB
  사용자->>서버: 요청
  서버->>DB: 조회
  DB-->>서버: 결과
  서버-->>사용자: 응답`,
  },
  {
    type: 'gantt',
    label: '간트 차트',
    desc: '일정/타임라인',
    template: `gantt
  title 프로젝트 일정
  dateFormat YYYY-MM-DD
  section 기획
    리서치 :a1, 2026-06-01, 7d
    문서화 :a2, after a1, 5d
  section 개발
    구현   :b1, after a2, 14d
    테스트 :b2, after b1, 5d`,
  },
  {
    type: 'mindmap',
    label: '마인드맵',
    desc: '아이디어 구조화',
    template: `mindmap
  root((중심 주제))
    분야 A
      세부 1
      세부 2
    분야 B
      세부 3
    분야 C`,
  },
];

export function ChartInsertModal({ open, onClose, onInsert }: ChartInsertModalProps) {
  const [selected, setSelected] = useState<ChartType>('pie');
  const [code, setCode] = useState<string>(CHART_PRESETS[0].template);

  if (!open) return null;

  const handleSelectType = (type: ChartType) => {
    setSelected(type);
    const preset = CHART_PRESETS.find((p) => p.type === type);
    if (preset) setCode(preset.template);
  };

  const handleInsert = () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    // applyMarkdown 이 ```mermaid 블록을 파싱하니 그 포맷으로 감싸서 전달
    onInsert(`\n\n\`\`\`mermaid\n${trimmed}\n\`\`\`\n\n`);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(720px, 90vw)',
          maxHeight: '85vh',
          background: '#1a1a25',
          borderRadius: 12,
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: 'white', fontSize: 17, fontWeight: 700 }}>
            차트 삽입
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#aaa',
              fontSize: 20,
              cursor: 'pointer',
              padding: 4,
            }}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CHART_PRESETS.map((p) => (
            <button
              key={p.type}
              type="button"
              onClick={() => handleSelectType(p.type)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border:
                  selected === p.type
                    ? '1px solid rgba(236, 72, 153, 0.7)'
                    : '1px solid rgba(255,255,255,0.12)',
                background:
                  selected === p.type
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(236, 72, 153, 0.18))'
                    : 'rgba(255,255,255,0.04)',
                color: 'white',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              title={p.desc}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ color: '#bbb', fontSize: 12 }}>
          아래 mermaid 코드를 자유롭게 수정하세요. 라벨은 한국어 가능, 노드 ID 는 영문/숫자 권장.
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          style={{
            width: '100%',
            minHeight: 220,
            background: '#0f0f15',
            color: '#f5f5f5',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '10px 12px',
            fontFamily: '"JetBrains Mono", Consolas, monospace',
            fontSize: 13,
            lineHeight: 1.5,
            resize: 'vertical',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleInsert}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          >
            본문에 삽입
          </button>
        </div>
      </div>
    </div>
  );
}
