import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteUser } from '../../../apis/userApi';
import { logout } from '../../../apis/authApi';
import { generateTeam, participateTeam } from '../../../apis/cooperation';
import { TeamCard } from '../types';

// TODO: 팀 목록 API fetch 구현 필요
// TODO: 팀 클릭 시 상세 페이지 이동 구현 필요
// TODO: 팀 탈퇴 기능 구현 필요

export function useMypage() {
  const PAGE_SIZE = 8;
  const [userInfo, setUserInfo] = useState<any>(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamJoinOpen, setTeamJoinOpen] = useState(false);
  const [teamCards, setTeamCards] = useState<TeamCard[]>([]);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const pageCount = Math.ceil(teamCards.length / PAGE_SIZE);
  const currentTeams = teamCards.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  {/*팀 생성 핸들러 */}
  const handleCreateTeam = async (teamName: string) => {
    try {
      const result = await generateTeam({ team_name: teamName });
      const newCard: TeamCard = {
        team_name: result.data.team_name,
        team_code: result.data.team_code,
        leader_id: result.data.user_id,
      };
      setTeamCards((prev) => {
        if (prev.some((t) => t.team_code === newCard.team_code)) return prev;
        return [newCard, ...prev];
      });
      alert(`${result.message}\n팀 코드: ${result.data.team_code}`);
    } catch (error) {
      alert("팀 생성에 실패했습니다. 다시 시도해주세요.");
    }
  };

  {/*팀 참가 핸들러 */}
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
      alert("팀 참가에 실패했습니다. 팀 코드를 확인해주세요.");
    }
  };

  {/*사용자 정보 로드 */}
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserInfo(user);
      } catch (e) {
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  {/*페이지 변경 시 유효성 검사 */}
  useEffect(() => {
    if (page > pageCount - 1) {
      setPage(Math.max(0, pageCount - 1));
    }
  }, [page, pageCount]);

  const handlePageChange = ({ selected }: { selected: number }) => {
    setPage(selected);
  };

  {/*로그아웃 핸들러 */}
  const handleLogout = async () => {
    try {
      await logout();
      alert('로그아웃되었습니다.');
      navigate('/');
    } catch (error) {
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  {/*회원탈퇴 핸들러 */}
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
        alert('회원탈퇴에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  return {
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
  };
}
