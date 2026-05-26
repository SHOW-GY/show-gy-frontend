import { useEffect, useState } from 'react';
import ReactPaginate from 'react-paginate';
import Team_make from '../../../components/Team_make';
import Team_join from '../../../components/Team_join';
import TeamRule_modal from '../../../components/TeamRule_modal';
import { TeamCard } from '../types';
import {
  approveJoinRequest,
  getJoinRequests,
  getMyLeaderPendingCounts,
  getTeamMembers,
  rejectJoinRequest,
  type JoinRequest,
  type TeamMember,
} from '../../../apis/cooperation';
import {
  approveDocument,
  getReviewQueue,
  getReviewQueueCount,
  rejectDocument,
  type ReviewQueueItem,
} from '../../../apis/documentApi';

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
  const [ruleTarget, setRuleTarget] = useState<TeamCard | null>(null);
  const [memberTarget, setMemberTarget] = useState<TeamCard | null>(null);
  const [memberList, setMemberList] = useState<TeamMember[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);

  const [pendingTarget, setPendingTarget] = useState<TeamCard | null>(null);
  const [pendingList, setPendingList] = useState<JoinRequest[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [resolvingUserId, setResolvingUserId] = useState<string | null>(null);

  // 본인이 리더인 팀들의 대기 요청 카운트 {team_code: count}
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  // 팀별 문서 검토 대기 수 {team_code: count}
  const [reviewCounts, setReviewCounts] = useState<Record<string, number>>({});
  // 검토 대기 모달
  const [reviewTarget, setReviewTarget] = useState<TeamCard | null>(null);
  const [reviewList, setReviewList] = useState<ReviewQueueItem[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewBusyId, setReviewBusyId] = useState<number | null>(null);

  const refreshPendingCounts = async () => {
    try {
      const data = await getMyLeaderPendingCounts();
      setPendingCounts(data || {});
    } catch {
      // 비치명적
    }
  };

  const refreshReviewCounts = async () => {
    // 리더인 팀의 검토 큐 카운트 — pendingCounts 가 있는 팀만 (리더인 팀 식별)
    const ownerTeams = teamCards
      .filter((t) => pendingCounts[t.team_code] !== undefined || true) // 모든 팀에 대해 시도 — 리더 아니면 백엔드가 빈 카운트 반환
      .map((t) => t.team_code);
    const next: Record<string, number> = {};
    await Promise.all(
      ownerTeams.map(async (code) => {
        try {
          const cnt = await getReviewQueueCount(code);
          if (cnt > 0) next[code] = cnt;
        } catch {
          // ignore
        }
      })
    );
    setReviewCounts(next);
  };

  useEffect(() => {
    refreshPendingCounts();
    refreshReviewCounts();
  }, [teamCards.length]);

  const openReviewModal = async (t: TeamCard) => {
    setReviewTarget(t);
    setReviewList([]);
    setReviewLoading(true);
    try {
      const data = await getReviewQueue(t.team_code);
      setReviewList(data);
    } catch (e: any) {
      alert(e?.response?.data?.message || '검토 대기 목록을 불러오지 못했습니다.');
      setReviewTarget(null);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReviewApprove = async (docId: number) => {
    setReviewBusyId(docId);
    try {
      const r = await approveDocument(docId);
      setReviewList((prev) => prev.filter((x) => x.document_id !== docId));
      await refreshReviewCounts();
      alert(`승인 완료. (이전 활성본 ${r.archived_previous ?? 0}건이 보관 처리됨)`);
    } catch (e: any) {
      alert(e?.response?.data?.message || '승인 실패');
    } finally {
      setReviewBusyId(null);
    }
  };

  const handleReviewReject = async (docId: number) => {
    const reason = prompt('반려 사유를 입력하세요 (선택)') ?? '';
    setReviewBusyId(docId);
    try {
      await rejectDocument(docId, reason);
      setReviewList((prev) => prev.filter((x) => x.document_id !== docId));
      await refreshReviewCounts();
    } catch (e: any) {
      alert(e?.response?.data?.message || '반려 실패');
    } finally {
      setReviewBusyId(null);
    }
  };

  const openMembersModal = async (t: TeamCard) => {
    setMemberTarget(t);
    setMemberList([]);
    setMemberLoading(true);
    try {
      const data = await getTeamMembers(t.team_code);
      setMemberList(data);
    } catch (e: any) {
      alert(e?.response?.data?.message || '멤버 목록을 불러오지 못했습니다.');
      setMemberTarget(null);
    } finally {
      setMemberLoading(false);
    }
  };

  const openPendingModal = async (t: TeamCard) => {
    setPendingTarget(t);
    setPendingList([]);
    setPendingLoading(true);
    try {
      const data = await getJoinRequests(t.team_code);
      setPendingList(data);
    } catch (e: any) {
      alert(e?.response?.data?.message || '대기 목록을 불러오지 못했습니다.');
      setPendingTarget(null);
    } finally {
      setPendingLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!pendingTarget) return;
    setResolvingUserId(userId);
    try {
      await approveJoinRequest(pendingTarget.team_code, userId);
      setPendingList((prev) => prev.filter((r) => r.user_id !== userId));
      await refreshPendingCounts();
    } catch (e: any) {
      alert(e?.response?.data?.message || '승인에 실패했습니다.');
    } finally {
      setResolvingUserId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!pendingTarget) return;
    setResolvingUserId(userId);
    try {
      await rejectJoinRequest(pendingTarget.team_code, userId);
      setPendingList((prev) => prev.filter((r) => r.user_id !== userId));
      await refreshPendingCounts();
    } catch (e: any) {
      alert(e?.response?.data?.message || '거절에 실패했습니다.');
    } finally {
      setResolvingUserId(null);
    }
  };

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
              <div key={t.team_code} className="mypage-team-stack">
                <div className="mypage-team-card-simple">
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
                <div className="mypage-team-card-simple mypage-team-rule-card">
                  <div className="mypage-team-row">
                    <span className="mypage-team-label">규칙</span>
                    <button
                      type="button"
                      className="mypage-team-rule-btn"
                      onClick={() => setRuleTarget(t)}
                    >
                      규칙 정하기
                    </button>
                  </div>
                  <div className="mypage-team-row">
                    <span className="mypage-team-label">멤버</span>
                    <button
                      type="button"
                      className="mypage-team-rule-btn"
                      onClick={() => openMembersModal(t)}
                    >
                      멤버 보기
                    </button>
                  </div>
                  {pendingCounts[t.team_code] > 0 && (
                    <div className="mypage-team-row">
                      <span className="mypage-team-label">가입신청</span>
                      <button
                        type="button"
                        className="mypage-team-rule-btn"
                        onClick={() => openPendingModal(t)}
                        style={{ background: '#ffefef', color: '#c0392b', fontWeight: 600 }}
                      >
                        대기 {pendingCounts[t.team_code]}건 보기
                      </button>
                    </div>
                  )}
                  {reviewCounts[t.team_code] > 0 && (
                    <div className="mypage-team-row">
                      <span className="mypage-team-label">문서검토</span>
                      <button
                        type="button"
                        className="mypage-team-rule-btn"
                        onClick={() => openReviewModal(t)}
                        style={{ background: '#fff7d6', color: '#a16800', fontWeight: 600 }}
                      >
                        검토 {reviewCounts[t.team_code]}건
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <TeamRule_modal
          open={!!ruleTarget}
          onClose={() => setRuleTarget(null)}
          teamId={ruleTarget?.team_code ?? ''}
          teamName={ruleTarget?.team_name ?? ''}
        />

        {/* 멤버 목록 모달 */}
        {memberTarget && (
          <div
            onClick={() => setMemberTarget(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: 12, padding: 24,
                width: 'min(480px, 92vw)', maxHeight: '80vh', overflow: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <strong style={{ fontSize: 18 }}>{memberTarget.team_name} · 팀원</strong>
                <button onClick={() => setMemberTarget(null)} style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              {memberLoading ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>불러오는 중…</div>
              ) : memberList.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>아직 멤버가 없습니다.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {memberList.map((m) => (
                    <li key={m.user_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 4px', borderBottom: '1px solid #eee' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {m.nickname || m.user_id}
                          {m.leader && <span style={{ marginLeft: 8, fontSize: 12, color: '#3b82f6' }}>리더</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#888' }}>
                          {m.user_id} {m.email ? `· ${m.email}` : ''}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* 문서 검토 대기 모달 (팀장 전용) */}
        {reviewTarget && (
          <div
            onClick={() => setReviewTarget(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: 12, padding: 24,
                width: 'min(560px, 92vw)', maxHeight: '80vh', overflow: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <strong style={{ fontSize: 18 }}>{reviewTarget.team_name} · 문서 검토</strong>
                <button onClick={() => setReviewTarget(null)} style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              {reviewLoading ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>불러오는 중…</div>
              ) : reviewList.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>검토 대기 문서가 없습니다.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {reviewList.map((r) => {
                    const busy = reviewBusyId === r.document_id;
                    return (
                      <li key={r.document_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 4px', borderBottom: '1px solid #eee' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{r.title}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>
                            작성자: {r.creator_id} · doc#{r.document_id}
                            {r.source_document_id ? ` · 원본#${r.source_document_id}` : ''}
                          </div>
                          <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                            제출: {r.register_date ? new Date(r.register_date).toLocaleString() : '-'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            disabled={busy}
                            onClick={() => handleReviewApprove(r.document_id)}
                            style={{
                              padding: '6px 14px', borderRadius: 6, border: 'none',
                              background: busy ? '#aac' : '#3b82f6', color: '#fff', cursor: busy ? 'wait' : 'pointer',
                            }}
                          >
                            승인
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => handleReviewReject(r.document_id)}
                            style={{
                              padding: '6px 14px', borderRadius: 6, border: '1px solid #ddd',
                              background: '#fff', color: '#c0392b', cursor: busy ? 'wait' : 'pointer',
                            }}
                          >
                            반려
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* 가입 신청 대기 모달 (리더 전용) */}
        {pendingTarget && (
          <div
            onClick={() => setPendingTarget(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: 12, padding: 24,
                width: 'min(520px, 92vw)', maxHeight: '80vh', overflow: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <strong style={{ fontSize: 18 }}>{pendingTarget.team_name} · 가입 신청</strong>
                <button onClick={() => setPendingTarget(null)} style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              {pendingLoading ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>불러오는 중…</div>
              ) : pendingList.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>대기 중인 가입 신청이 없습니다.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {pendingList.map((r) => {
                    const busy = resolvingUserId === r.user_id;
                    return (
                      <li key={r.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px', borderBottom: '1px solid #eee' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{r.nickname || r.user_id}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>
                            {r.user_id} {r.email ? `· ${r.email}` : ''}
                          </div>
                          <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                            신청: {new Date(r.requested_at).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            disabled={busy}
                            onClick={() => handleApprove(r.user_id)}
                            style={{
                              padding: '6px 14px', borderRadius: 6, border: 'none',
                              background: busy ? '#aac' : '#3b82f6', color: '#fff', cursor: busy ? 'wait' : 'pointer',
                            }}
                          >
                            승인
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => handleReject(r.user_id)}
                            style={{
                              padding: '6px 14px', borderRadius: 6, border: '1px solid #ddd',
                              background: '#fff', color: '#c0392b', cursor: busy ? 'wait' : 'pointer',
                            }}
                          >
                            거절
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
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
