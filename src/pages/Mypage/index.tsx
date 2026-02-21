import Layout from '../../components/Layout';
import ProfilePanel from './element/ProfilePanel';
import TeamSection from './element/TeamSection';
import { useMypage } from './hooks/useMypage';
import '../../styles/design.css';
import '../../styles/mypage.css';

export default function Mypage() {
  const {
    userInfo,
    teamModalOpen,
    setTeamModalOpen,
    teamJoinOpen,
    setTeamJoinOpen,
    teamCards,
    currentTeams,
    page,
    pageCount,
    handlePageChange,
    handleCreateTeam,
    handleJoinTeam,
    handleLogout,
    handleDeleteUser,
  } = useMypage();

  {/*사용자 정보가 없으면 null 반환 오류 방지 */}
  if (!userInfo) return null;

  return (
    <Layout activeMenu="mypage">
      <div className="mypage-container">
        <div className="mypage-shell">
          <ProfilePanel 
            userInfo={userInfo}
            onLogout={handleLogout}
            onDeleteUser={handleDeleteUser}
          />
          
          <TeamSection
            teamModalOpen={teamModalOpen}
            setTeamModalOpen={setTeamModalOpen}
            teamJoinOpen={teamJoinOpen}
            setTeamJoinOpen={setTeamJoinOpen}
            teamCards={teamCards}
            currentTeams={currentTeams}
            page={page}
            pageCount={pageCount}
            handlePageChange={handlePageChange}
            handleCreateTeam={handleCreateTeam}
            handleJoinTeam={handleJoinTeam}
          />
        </div>
      </div>
    </Layout>
  );
}
