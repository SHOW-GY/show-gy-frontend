import React, { useEffect, useRef, useState } from "react";
import "../styles/modal.css";

type TeamMakeProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (teamName: string) => void;
};

const Team_make: React.FC<TeamMakeProps> = ({ open, onClose, onCreate }) => {
  const [teamName, setTeamName] = useState("");
  const modalBackground = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 열릴 때 입력 포커스 + 초기화
  useEffect(() => {
    if (!open) return;
    setTeamName("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleCreate = () => {
    const trimmed = teamName.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    onClose();
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
      <div className="modal-content">
        <h3 className="modal-title">팀 생성</h3>

        <label className="modal-label" htmlFor="teamName">
          팀명
        </label>
        <input
          id="teamName"
          ref={inputRef}
          className="modal-input"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="예: SHOW-GY"
          maxLength={30}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
        />

        <div className="modal-actions">
          <button className="modal-close-btn" onClick={onClose} type="button">
            취소
          </button>
          <button
            className="modal-create-btn"
            onClick={handleCreate}
            type="button"
            disabled={!teamName.trim()}
          >
            생성
          </button>
        </div>
      </div>
    </div>
  );
};

export default Team_make;
