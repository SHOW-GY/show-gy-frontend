import cameraIcon from '../../../assets/icons/camera.png';

// TODO: 개인정보 수정 기능 구현 필요

type ProfilePanelProps = {
  userInfo: any;
  onLogout: () => void;
  onDeleteUser: () => void;
};

{/* 사용자 정보 패널 */}
export default function ProfilePanel({ userInfo, onLogout, onDeleteUser }: ProfilePanelProps) {
  return (
    <aside className="mypage-left-panel">
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
      <button className="mypage-action-btn" onClick={onLogout}>로그아웃</button>
      <button className="mypage-withdraw" onClick={onDeleteUser}>회원탈퇴</button>
    </aside>
  );
}
