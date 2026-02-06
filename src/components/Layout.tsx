import Header from "./Header";
import Tail from "./Tail";

interface LayoutProps {
  activeMenu?: "home" | "summary" | "library" | "login" | "mypage" | "showgy";
  children: React.ReactNode;
}

function Layout({ activeMenu = "home", children }: LayoutProps) {
  return (
    <div className="layout">
      <Header activeMenu={activeMenu} />
      {children}
      <Tail />
    </div>
  );
}

export default Layout;
