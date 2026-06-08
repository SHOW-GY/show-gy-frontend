import Quill from 'quill';

/**
 * Quill Delta → 서식 보존 HTML (detached Quill 인스턴스 사용).
 *
 * 챗봇 요청 시 `document`(원본 HTML)로 실어 보내 백엔드 `document_raw` 에 보관 →
 * undo(되돌리기) 가 plaintext 가 아닌 *서식 포함 HTML* 을 복원하도록 한다.
 * (delta 가 비어있거나 변환 실패 시 빈 문자열 반환)
 */
export function deltaToHtml(delta: any): string {
  if (!delta || !delta.ops) return '';
  try {
    const Q: any = (Quill as any).default ?? Quill;
    const tmp = document.createElement('div');
    const q = new Q(tmp);
    q.setContents(delta);
    return q.root.innerHTML;
  } catch {
    return '';
  }
}
