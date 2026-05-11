import TeamRule_modal from '../components/TeamRule_modal';

// 디자인 미리보기 전용 — 인증/실API 없이 모달만 띄움.
export default function TeamRulePreview() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#1a1230,#2a1a4a)' }}>
      <TeamRule_modal
        open={true}
        onClose={() => {}}
        teamId="DEMO"
        teamName="시연용 팀"
        mock={{
          team_id: 'DEMO',
          is_leader: true,
          leader_id: 'demo_leader',
          rule: {
            paragraph_structure: 'front_loaded',
            response_format: 'bullet',
            formality_level: 'formal',
            sentence_length: 'medium',
          },
          ban_words: ['신박', '대박'],
          ban_contexts: ['허위·과장 표현', '경쟁사 비방'],
        }}
      />
    </div>
  );
}
