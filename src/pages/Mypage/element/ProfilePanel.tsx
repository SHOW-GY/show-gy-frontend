import { useEffect, useRef, useState } from "react";
import cameraIcon from "../../../assets/icons/camera.png";
import {
  uploadProfileImage,
  getProfileImagePath,
  buildProfileImageUrl,
} from "../../../apis/profileImageApi";

// TODO: 개인정보 수정 기능 구현 필요

type ProfilePanelProps = {
  userInfo: any;
  onLogout: () => void;
  onDeleteUser: () => void;
};

{/*보류*/}
export default function ProfilePanel({ userInfo, onLogout, onDeleteUser }: ProfilePanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 화면에 실제로 표시할 이미지 URL (서버 URL 형태)
  const [profileImgUrl, setProfileImgUrl] = useState<string | null>(null);

  // 서버가 준 "경로 문자열" (before_file_path로 넘기기 위해 저장)
  const [profilePath, setProfilePath] = useState<string>("");

  // (선택 직후) 로컬 미리보기 URL
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // 1) 페이지 진입 시: GET으로 현재 프로필 경로 가져오기 → 표시
  useEffect(() => {
    const run = async () => {
      try {
        const data = await getProfileImagePath();
        if (data?.profile_path) {
          setProfilePath(data.profile_path);
          setProfileImgUrl(buildProfileImageUrl(data.profile_path));
        }
      } catch (e) {
        // 프로필 이미지가 아직 없을 수도 있으니 조용히 무시
      }
    };
    run();
  }, []);

  const onClickAvatar = () => {
    fileInputRef.current?.click();
  };

  const onChangeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 2) 즉시 미리보기 (카메라 숨김)
    const preview = URL.createObjectURL(file);
    setLocalPreviewUrl(preview);

    try {
      // 3) 업로드
      const saved = await uploadProfileImage({
        file,
        file_name: file.name,
        before_file_path: profilePath, // 기존 경로 있으면 전달
      });

      // 4) 저장 성공 후: POST 응답 경로로 반영
      if (saved?.profile_path) {
        setProfilePath(saved.profile_path);
        setProfileImgUrl(buildProfileImageUrl(saved.profile_path));
      }

      // 5) 네 요구대로 "GET으로 다시" 확인하고 싶으면 여기서 한번 더:
      // const data = await getProfileImagePath();
      // if (data?.profile_path) {
      //   setProfilePath(data.profile_path);
      //   setProfileImgUrl(buildProfileImageUrl(data.profile_path));
      // }
    } catch (err) {
      alert("프로필 이미지 업로드에 실패했습니다.");
      // 실패하면 미리보기 취소
      setLocalPreviewUrl(null);
    } finally {
      // 같은 파일 다시 선택 가능하게 input 초기화
      e.target.value = "";
    }
  };

  // 로컬 미리보기가 있으면 그걸 우선 보여줌(업로드 중에도 카메라 안 보이게)
  const displayedUrl = localPreviewUrl ?? profileImgUrl;

  return (
    <aside className="mypage-left-panel">
      <div className="mypage-avatar" onClick={onClickAvatar} role="button" tabIndex={0}>
        {displayedUrl ? (
          <img className="mypage-avatar-img" src={displayedUrl} alt="profile" />
        ) : (
          <div className="mypage-avatar-camera">
            <img src={cameraIcon} alt="camera" />
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={onChangeFile}
        />
      </div>

      <div className="mypage-nickname">{userInfo?.nickname || "닉네임"}</div>

      <div className="mypage-label">이름</div>
      <div className="mypage-subtext">
        {userInfo?.first_name && userInfo?.last_name
          ? `${userInfo.first_name} ${userInfo.last_name}`
          : "이름 정보 없음"}
      </div>

      <div className="mypage-label">아이디</div>
      <div className="mypage-subtext">{userInfo?.user_id || "아이디 정보 없음"}</div>

      <div className="mypage-label">이메일</div>
      <div className="mypage-subtext">{userInfo?.email || "이메일 정보 없음"}</div>

      <button className="mypage-action-btn" onClick={() => alert("개인정보 수정은 추후 연결 예정입니다.")}>
        개인정보 수정하기
      </button>
      <button className="mypage-action-btn" onClick={onLogout}>로그아웃</button>
      <button className="mypage-withdraw" onClick={onDeleteUser}>회원탈퇴</button>
    </aside>
  );
}