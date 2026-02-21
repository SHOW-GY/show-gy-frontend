import ReactPaginate from 'react-paginate';
import Team_make from '../../../components/Team_make';
import Team_join from '../../../components/Team_join';
import { TeamCard } from '../types';

// TODO: 팀 클릭 시 상세 페이지 이동 기능 구현 필요

type TeamSectionProps = {
  teamModalOpen: boolean;
  setTeamModalOpen: (open: boolean) => void;
  teamJoinOpen: boolean;
  setTeamJoinOpen: (open: boolean) => void;
  teamCards: TeamCard[];
  currentTeams: TeamCard[];
  page: number;
  pageCount: number;
  handlePageChange: ({ selected }: { selected: number }) => void;
  handleCreateTeam: (teamName: string) => Promise<void>;
  handleJoinTeam: (teamCode: string) => Promise<void>;
};

{/*팀 관리 섹션 */}
export default function TeamSection({
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
}: TeamSectionProps) {
  return (
    <main className="mypage-main">
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
    </main>
  );
}
