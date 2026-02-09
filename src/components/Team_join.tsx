import React, { useEffect, useRef, useState } from "react";
import "../styles/modal.css";

type TeamJoinProps = {
  open: boolean;
  onClose: () => void;
  onJoin: (teamCode: string) => void;
};

const Team_join: React.FC<TeamJoinProps> = ({ open, onClose, onJoin }) => {
  const [teamCode, setTeamCode] = useState("");
  const modalBackground = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setTeamCode("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleJoin = () => {
    const trimmed = teamCode.trim();
    if (!trimmed) return;
    onJoin(trimmed);
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
        <h3 className="modal-title">팀 참가</h3>

        <label className="modal-label" htmlFor="teamCode">
          팀 코드
        </label>
        <input
          id="teamCode"
          ref={inputRef}
          className="modal-input"
          value={teamCode}
          onChange={(e) => setTeamCode(e.target.value)}
          placeholder="예: ABCD-1234"
          maxLength={40}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleJoin();
          }}
        />

        <div className="modal-actions">
          <button className="modal-close-btn" onClick={onClose} type="button">
            취소
          </button>
          <button
            className="modal-create-btn"
            onClick={handleJoin}
            type="button"
            disabled={!teamCode.trim()}
          >
            참가
          </button>
        </div>
      </div>
    </div>
  );
};

export default Team_join;
