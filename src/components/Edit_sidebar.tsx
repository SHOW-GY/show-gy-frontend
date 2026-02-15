import "../styles/edit_sidebar.css";

import save from "../assets/icons/save.png";
import settings from "../assets/icons/settings.png";

type EditSidebarProps = {
  open: boolean;
  onClose: () => void;
  onExportPdf: () => void;
  onToggleMargin: () => void;
};

export default function EditSidebar({
  open,
  onClose,
  onExportPdf,
  onToggleMargin,
}: EditSidebarProps) {
  if (!open) return null;

  return (
    <div className="edit-sidebar-overlay" onClick={onClose}>
      <div className="edit-sidebar-drawer" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="edit-sidebar-btn" onClick={onExportPdf}>
          <img src={save} alt="save" className="edit-sidebar-icon" />
        </button>
        <button type="button" className="edit-sidebar-btn" onClick={onToggleMargin}>
          <img src={settings} alt="settings" className="edit-sidebar-icon" />
        </button>
      </div>
    </div>
  );
}
