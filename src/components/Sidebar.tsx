import { Sling as Hamburger } from "hamburger-react";
import { Dispatch, SetStateAction } from "react";

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export default function Sidebar({
  activeMenu,
  setActiveMenu,
  open,
  setOpen,
}: SidebarProps) {
  return (
    <>
      {/* 웹용 햄버거 버튼 */}
      <button
        className="sidebar-toggle"
        aria-label="Toggle sidebar"
        onClick={() => setOpen(!open)}
      >
        <Hamburger toggled={open} toggle={setOpen} size={22} color="#BE7C85" rounded />
      </button>

      <aside className={`library-sidebar ${open ? "open" : "closed"}`}>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeMenu === "recent" ? "active" : ""}`}
            onClick={() => setActiveMenu("recent")}
          >
            최근 문서함
          </button>

          <button
            className={`nav-item ${activeMenu === "my-drive" ? "active" : ""}`}
            onClick={() => setActiveMenu("my-drive")}
          >
            전체 문서함
          </button>

          <button
            className={`nav-item ${activeMenu === "trash" ? "active" : ""}`}
            onClick={() => setActiveMenu("trash")}
          >
            휴지통
          </button>
        </nav>
      </aside>
    </>
  );
}