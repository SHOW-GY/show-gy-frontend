import Header from "./Header";
import Tail from "./Tail";

type LibraryMenu = "recent" | "my-drive" | "trash";

interface LayoutProps {
  activeMenu?: "home" | "summary" | "library" | "login" | "mypage" | "showgy";
  children: React.ReactNode;

  onSelectLibraryMenu?: (menu: LibraryMenu) => void;
  activeLibraryMenu?: LibraryMenu; // 선택된 메뉴 표시용(선택 사항)
}

function Layout({
  activeMenu = "home",
  children,
  onSelectLibraryMenu,
  activeLibraryMenu,
}: LayoutProps) {
  return (
    <div className="layout">
      <Header
        activeMenu={activeMenu}
        onSelectLibraryMenu={onSelectLibraryMenu}
        activeLibraryMenu={activeLibraryMenu}
      />
      {children}
      <Tail />
    </div>
  );
}

export default Layout;
