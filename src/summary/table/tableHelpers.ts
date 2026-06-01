export const MAX_COLS = 10;
export const MAX_ROWS = 100;
export const MIN_COL_W = 40;
export const MIN_ROW_H = 24;
export const EDGE = 12;

{/* 커서의 위치파악 로직 */}
export function getActiveTableEl(q: any): HTMLTableElement | null {
  const range = q.getSelection();
  if (!range) return null;

  // 1단계: 현재 index에서 leaf 확인
  const [leaf] = q.getLeaf(range.index);
  const dom: HTMLElement | null = leaf?.domNode ?? null;
  if (dom && dom instanceof HTMLElement && typeof dom.closest === "function") {
    const table = dom.closest("table") as HTMLTableElement | null;
    if (table) return table;
  }

  // 2단계: 이전 index에서 leaf 확인 (경계 케이스 처리)
  if (range.index > 0) {
    const [prevLeaf] = q.getLeaf(range.index - 1);
    const prevDom: HTMLElement | null = prevLeaf?.domNode ?? null;
    if (prevDom && prevDom instanceof HTMLElement && typeof prevDom.closest === "function") {
      const table = prevDom.closest("table") as HTMLTableElement | null;
      if (table) return table;
    }
  }

  // 3단계: 네이티브 selection 폴백 (window.getSelection())
  const nativeSelection = window.getSelection();
  if (nativeSelection && nativeSelection.rangeCount > 0) {
    const nativeRange = nativeSelection.getRangeAt(0);
    const container = nativeRange.commonAncestorContainer;
    let element = container.nodeType === Node.TEXT_NODE 
      ? container.parentElement 
      : container as HTMLElement;
    
    if (element && typeof element.closest === "function") {
      const table = element.closest("table") as HTMLTableElement | null;
      if (table) return table;
    }
  }

  return null;
}

{/* 표의 행과 열의 개수 파악하는 로직 */}
export function getTableSize(table: HTMLTableElement): { rows: number; cols: number } {
  const tbody = table.querySelector("tbody");
  const trs = Array.from((tbody ?? table).querySelectorAll("tr"));
  const rows = trs.length;

  const firstTr = trs[0];
  const cols = firstTr ? Array.from(firstTr.querySelectorAll("td,th")).length : 0;

  return { rows, cols };
}

{ /*표의 열 너비 조절하는 로직 */}
export function ensureColGroup(table: HTMLTableElement) {
  const { cols } = getTableSize(table);
  let cg = table.querySelector("colgroup");
  const hadColgroup = !!cg;
  if (!cg) {
    cg = document.createElement("colgroup");
    table.insertBefore(cg, table.firstChild);
  }

  // 첫 호출(아직 colgroup 없던 시점)이면 현재 셀들의 자연 너비 *비율*로 col 에 박는다.
  // 비율(%) 사용 이유:
  //  - px 로 박으면 첫 측정 시점의 좁은 width 가 고정돼 페이지 폭 변동에 못 따라감.
  //  - 표 전체는 width:100% 로 부모 폭 가득 채우고, col 은 비율로 콘텐츠 모양 유지.
  let ratios: number[] | null = null;
  if (!hadColgroup) {
    const firstRow = table.querySelector("tr");
    if (firstRow) {
      const cells = Array.from(firstRow.querySelectorAll("td, th")) as HTMLElement[];
      const widths = cells.map((c) => c.getBoundingClientRect().width);
      const sum = widths.reduce((a, b) => a + b, 0);
      if (sum > 0) {
        ratios = widths.map((w) => w / sum);
      }
    }
  }

  while (cg.children.length < cols) {
    const idx = cg.children.length;
    const col = document.createElement("col");
    if (ratios && ratios[idx] && ratios[idx] > 0) {
      col.style.width = `${(ratios[idx] * 100).toFixed(2)}%`;
    }
    cg.appendChild(col);
  }
  while (cg.children.length > cols) cg.removeChild(cg.lastChild!);

  table.style.tableLayout = "fixed";
  // 표는 부모 폭 가득 (페이지 폭에 맞춤). px 박지 않음.
  table.style.width = "100%";
  return cg as HTMLTableColElement;
}

{ /*표 안에 커서가 있는지 감지하는 로직 */}
export function isCursorInTable(q: any): boolean {
  const table = getActiveTableEl(q);
  return !!table;
}

{ /*코드블럭 안에 커서가 있는지 감지하는 로직 */}
export function isCursorInCodeBlock(q: any): boolean {
  const range = q.getSelection();
  if (!range) return false;

  // 1단계: 현재 index에서 leaf 확인
  const [leaf] = q.getLeaf(range.index);
  const dom: HTMLElement | null = leaf?.domNode ?? null;
  if (dom && dom instanceof HTMLElement && typeof dom.closest === "function") {
    if (dom.closest(".ql-code-block-container") || dom.closest(".ql-code-block") || dom.closest("pre") || dom.closest("code")) {
      return true;
    }
  }

  // 2단계: 이전 index에서 leaf 확인
  if (range.index > 0) {
    const [prevLeaf] = q.getLeaf(range.index - 1);
    const prevDom: HTMLElement | null = prevLeaf?.domNode ?? null;
    if (prevDom && prevDom instanceof HTMLElement && typeof prevDom.closest === "function") {
      if (prevDom.closest(".ql-code-block-container") || prevDom.closest(".ql-code-block") || prevDom.closest("pre") || prevDom.closest("code")) {
        return true;
      }
    }
  }

  // 3단계: 네이티브 selection 폴백
  const nativeSelection = window.getSelection();
  if (nativeSelection && nativeSelection.rangeCount > 0) {
    const nativeRange = nativeSelection.getRangeAt(0);
    const container = nativeRange.commonAncestorContainer;
    let element = container.nodeType === Node.TEXT_NODE 
      ? container.parentElement 
      : container as HTMLElement;
    
    if (element && typeof element.closest === "function") {
      if (element.closest(".ql-code-block-container") || element.closest(".ql-code-block") || element.closest("pre") || element.closest("code")) {
        return true;
      }
    }
  }

  return false;
}

{ /*텍스트블록(blockquote) 안에 커서가 있는지 감지하는 로직 */}
export function isCursorInTextBlock(q: any): boolean {
  const range = q.getSelection();
  if (!range) return false;

  // 1단계: 현재 index에서 leaf 확인
  const [leaf] = q.getLeaf(range.index);
  const dom: HTMLElement | null = leaf?.domNode ?? null;
  if (dom && dom instanceof HTMLElement && typeof dom.closest === "function") {
    if (dom.closest("blockquote")) {
      return true;
    }
  }

  // 2단계: 이전 index에서 leaf 확인
  if (range.index > 0) {
    const [prevLeaf] = q.getLeaf(range.index - 1);
    const prevDom: HTMLElement | null = prevLeaf?.domNode ?? null;
    if (prevDom && prevDom instanceof HTMLElement && typeof prevDom.closest === "function") {
      if (prevDom.closest("blockquote")) {
        return true;
      }
    }
  }

  // 3단계: 네이티브 selection 폴백
  const nativeSelection = window.getSelection();
  if (nativeSelection && nativeSelection.rangeCount > 0) {
    const nativeRange = nativeSelection.getRangeAt(0);
    const container = nativeRange.commonAncestorContainer;
    let element = container.nodeType === Node.TEXT_NODE 
      ? container.parentElement 
      : container as HTMLElement;
    
    if (element && typeof element.closest === "function") {
      if (element.closest("blockquote")) {
        return true;
      }
    }
  }

  return false;
}

{ /*표의 행과 열 사이의 경계에 커서가 있는지 감지하는 로직 */}
export function findTableFromEvent(e: PointerEvent): HTMLTableElement | null {
  const t = e.target as HTMLElement | null;
  return (t?.closest?.("table") as HTMLTableElement | null) ?? null;
}

{ /*표의 행과 열 사이의 경계에 커서가 있는지 감지하는 로직 */}
export function findRowAtY(
  table: HTMLTableElement,
  clientY: number
): HTMLTableRowElement | null {
  const rows = Array.from(table.querySelectorAll("tr")) as HTMLTableRowElement[];
  for (const row of rows) {
    const r = row.getBoundingClientRect();
    if (clientY >= r.top && clientY <= r.bottom) return row;
  }
  return null;
}

{ /*표에서 현재 라인의 텍스트 가져오는 로직 */ }
export function getColWidths(table: HTMLTableElement): number[] {
  ensureColGroup(table);
  const cols = Array.from(table.querySelectorAll("colgroup > col")) as HTMLTableColElement[];
  return cols.map((c) => parseFloat(c.style.width || "") || c.getBoundingClientRect().width);
}

{ /*표에서 현재 라인의 텍스트 가져오는 로직 */ }
export function hitTestColBoundary(table: HTMLTableElement, clientX: number) {
  const tr = table.getBoundingClientRect();
  const x = clientX - tr.left;

  const widths = getColWidths(table);
  let acc = 0;

  for (let i = 0; i < widths.length; i++) {
    acc += widths[i];
    if (Math.abs(x - acc) <= EDGE) {
      return { boundaryIndex: i, startX: clientX };
    }
  }

  return null;
}

{/*표에서 현재 라인의 텍스트 가져오는 로직 */ }
export function hitTestRowBoundary(rowEl: HTMLTableRowElement, clientY: number) {
  const r = rowEl.getBoundingClientRect();
  return Math.abs(clientY - r.bottom) <= EDGE;
}
