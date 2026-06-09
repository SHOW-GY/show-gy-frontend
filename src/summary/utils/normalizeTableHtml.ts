/**
 * 붙여넣기(dangerouslyPasteHTML) 직전 표 HTML 정규화.
 *
 * Quill 내장 table 모듈은 `<thead>` / `<th>` 를 지원하지 않는다. 마크다운→HTML
 * 변환(marked) 결과나 LLM 이 만든 HTML 표는 헤더를 `<thead><th>` 로 내보내는데,
 * 그대로 붙이면 헤더 행이 본문 표와 분리돼 별도의 단일 셀처럼 떨어져 나온다.
 *
 * 그래서 모든 표를:
 *  - `<th>` → `<td>` 로 변환
 *  - thead/tbody/tfoot 을 없애고 모든 `<tr>` 을 단일 `<tbody>` 로 합침
 * → 헤더가 표의 첫 행으로 들어가 하나의 표로 렌더된다.
 */
export function normalizeTableHtml(html: string): string {
  if (!html || html.indexOf('<table') === -1) return html;
  try {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    tmp.querySelectorAll('table').forEach((table) => {
      const rows = Array.from(table.querySelectorAll('tr'));
      // th → td (텍스트/인라인 서식 유지)
      rows.forEach((tr) => {
        Array.from(tr.querySelectorAll('th')).forEach((th) => {
          const td = document.createElement('td');
          td.innerHTML = th.innerHTML;
          th.replaceWith(td);
        });
      });
      // 모든 행을 단일 tbody 로 재구성 (thead/tfoot 래퍼 제거)
      const tbody = document.createElement('tbody');
      rows.forEach((tr) => tbody.appendChild(tr));
      table.innerHTML = '';
      table.appendChild(tbody);
    });
    return tmp.innerHTML;
  } catch {
    return html;
  }
}
