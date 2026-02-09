import { useState, useEffect } from 'react';
import ReactPaginate from 'react-paginate';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import cameraIcon from '../assets/icons/camera.png';
import { deleteUser } from '../apis/userApi';
import { logout } from '../apis/authApi';
import { generateTeam, participateTeam } from '../apis/cooperation';
import '../styles/design.css';
import '../styles/mypage.css';

import Team_make from "../components/Team_make";
import Team_join from "../components/Team_join";

type TeamCard = {
  team_name: string;
  team_code: string;
  leader_id: string; // = user_id
};


export default function Mypage() {
  const PAGE_SIZE = 8;
  const [userInfo, setUserInfo] = useState<any>(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamJoinOpen, setTeamJoinOpen] = useState(false);
  const [teamCards, setTeamCards] = useState<TeamCard[]>([]);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  const pageCount = Math.ceil(teamCards.length / PAGE_SIZE);
  const currentTeams = teamCards.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const handleCreateTeam = async (teamName: string) => {
    try {
      const result = await generateTeam({ team_name: teamName });

      // 응답: result.data = { team_name, team_code, user_id, team_owner }
      const newCard: TeamCard = {
        team_name: result.data.team_name,
        team_code: result.data.team_code,
        leader_id: result.data.user_id,
      };

      // 중복 방지(팀코드 기준)
      setTeamCards((prev) => {
        if (prev.some((t) => t.team_code === newCard.team_code)) return prev;
        return [newCard, ...prev];
      });

      alert(`${result.message}\n팀 코드: ${result.data.team_code}`);
    } catch (error) {
      console.error("팀 생성 실패:", error);
      alert("팀 생성에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleJoinTeam = async (teamCode: string) => {
    try {
      const result = await participateTeam({ team_code: teamCode });

      const newCard: TeamCard = {
        team_name: result.data.team_name,
        team_code: teamCode,
        leader_id: result.data.user_id,
      };

      setTeamCards((prev) => {
        if (prev.some((t) => t.team_code === newCard.team_code)) return prev;
        return [newCard, ...prev];
      });

      alert(`${result.message}\n참가한 팀: ${result.data.team_name}`);
    } catch (error) {
      console.error("팀 참가 실패:", error);
      alert("팀 참가에 실패했습니다. 팀 코드를 확인해주세요.");
    }
  };


  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserInfo(user);
      } catch (e) {
        console.error('사용자 정보 파싱 실패:', e);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (page > pageCount - 1) {
      setPage(Math.max(0, pageCount - 1));
    }
  }, [page, pageCount]);

  const handlePageChange = ({ selected }: { selected: number }) => {
    setPage(selected);
  };

  const handleLogout = async () => {
    try {
      await logout();
      alert('로그아웃되었습니다.');
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteUser = async () => {
    if (window.confirm('정말로 회원탈퇴를 하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await deleteUser();
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        alert('회원탈퇴가 완료되었습니다.');
        navigate('/login');
      } catch (error) {
        console.error('회원탈퇴 실패:', error);
        alert('회원탈퇴에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  if (!userInfo) return null;

  return (
    <Layout activeMenu="mypage">
      <div className="summary-container">
        <div className="mypage-left-panel">
          <div className="mypage-avatar">
            <div className="mypage-avatar-camera">
              <img src={cameraIcon} alt="camera" />
            </div>
          </div>

          <div className="mypage-nickname">{userInfo?.nickname || '닉네임'}</div>
          <div className="mypage-label">이름</div>
          <div className="mypage-subtext">
            {userInfo?.first_name && userInfo?.last_name
              ? `${userInfo.first_name} ${userInfo.last_name}`
              : '이름 정보 없음'}
          </div>

          <div className="mypage-label">아이디</div>
          <div className="mypage-subtext">{userInfo?.user_id || '아이디 정보 없음'}</div>

          <div className="mypage-label">이메일</div>
          <div className="mypage-subtext">{userInfo?.email || '이메일 정보 없음'}</div>

          <button className="mypage-action-btn" onClick={() => alert('개인정보 수정은 추후 연결 예정입니다.')}>
            개인정보 수정하기
          </button>
          <button className="mypage-action-btn" onClick={handleLogout}>로그아웃</button>
          <button className="mypage-withdraw" onClick={handleDeleteUser}>회원탈퇴</button>
        </div>

        <div className="mypage-right-panel">
          <div className="mypage-team-actions">
            <div className="mypage-team-title">팀 관리</div>

            <div className="mypage-team-buttons">
              <button
                className="mypage-team-btn create"
                onClick={() => setTeamModalOpen(true)}
              >
                팀 생성
              </button>

              <button
                className="mypage-team-btn join"
                onClick={() => setTeamJoinOpen(true)}
              >
                팀 참가
              </button>
            </div>

            <Team_make
              open={teamModalOpen}
              onClose={() => setTeamModalOpen(false)}
              onCreate={handleCreateTeam}
            />

            <Team_join
              open={teamJoinOpen}
              onClose={() => setTeamJoinOpen(false)}
              onJoin={handleJoinTeam}
            />
          </div>
        </div>

        <div className="mypage-team-list-box">
          <div className="mypage-team-list-header">
            <div className="mypage-team-list-title">팀 커뮤니티</div>
            <div className="mypage-team-list-sub">팀명 / 팀코드 / 리더ID</div>
          </div>

          {teamCards.length === 0 ? (
            <div className="mypage-team-empty">
              아직 생성된 팀이 없습니다. "팀 생성/팀 참가" 을 눌러 만들어보세요.
            </div>
          ) : (
            <div className="mypage-team-grid">
              {currentTeams.map((t) => (
                <div key={t.team_code} className="mypage-team-card-simple">
                  <div className="mypage-team-row">
                    <span className="mypage-team-label">팀명</span>
                    <span className="mypage-team-value">{t.team_name}</span>
                  </div>
                  <div className="mypage-team-row">
                    <span className="mypage-team-label">팀코드</span>
                    <span className="mypage-team-value code">{t.team_code}</span>
                  </div>
                  <div className="mypage-team-row">
                    <span className="mypage-team-label">리더ID</span>
                    <span className="mypage-team-value">{t.leader_id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <ReactPaginate
              previousLabel="<"
              nextLabel=">"
              breakLabel="..."
              marginPagesDisplayed={1}
              pageRangeDisplayed={3}
              pageCount={pageCount}
              onPageChange={handlePageChange}
              forcePage={page}
              containerClassName="mypage-pagination"
              pageClassName="mypage-page"
              pageLinkClassName="mypage-page-link"
              activeClassName="active"
              previousClassName="mypage-prev"
              nextClassName="mypage-next"
              disabledClassName="disabled"
            />
          )}
        </div>

      </div>
    </Layout>
  );
}
