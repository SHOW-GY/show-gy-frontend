export const MAX_COLS = 10;
export const MAX_ROWS = 100;
export const MIN_COL_W = 40;
export const MIN_ROW_H = 24;
export const EDGE = 12;

export function getActiveTableEl(q: any): HTMLTableElement | null {
  const range = q.getSelection(true);
  if (!range) return null;

  const [leaf] = q.getLeaf(range.index);
  const dom: HTMLElement | null = leaf?.domNode ?? null;
  if (!dom || !(dom instanceof HTMLElement)) return null;
  if (typeof dom.closest !== "function") return null;

  return dom.closest("table") as HTMLTableElement | null;
}

export function getTableSize(table: HTMLTableElement): { rows: number; cols: number } {
  const tbody = table.querySelector("tbody");
  const trs = Array.from((tbody ?? table).querySelectorAll("tr"));
  const rows = trs.length;

  const firstTr = trs[0];
  const cols = firstTr ? Array.from(firstTr.querySelectorAll("td,th")).length : 0;

  return { rows, cols };
}

export function ensureColGroup(table: HTMLTableElement) {
  const { cols } = getTableSize(table);

  let cg = table.querySelector("colgroup");
  if (!cg) {
    cg = document.createElement("colgroup");
    table.insertBefore(cg, table.firstChild);
  }

  while (cg.children.length < cols) cg.appendChild(document.createElement("col"));
  while (cg.children.length > cols) cg.removeChild(cg.lastChild!);

  table.style.tableLayout = "fixed";
  table.style.width = table.style.width || "100%";
  return cg as HTMLTableColElement;
}

export function findTableFromEvent(e: PointerEvent): HTMLTableElement | null {
  const t = e.target as HTMLElement | null;
  return (t?.closest?.("table") as HTMLTableElement | null) ?? null;
}

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

export function getColWidths(table: HTMLTableElement): number[] {
  ensureColGroup(table);
  const cols = Array.from(table.querySelectorAll("colgroup > col")) as HTMLTableColElement[];
  return cols.map((c) => parseFloat(c.style.width || "") || c.getBoundingClientRect().width);
}

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

export function hitTestRowBoundary(rowEl: HTMLTableRowElement, clientY: number) {
  const r = rowEl.getBoundingClientRect();
  return Math.abs(clientY - r.bottom) <= EDGE;
}
