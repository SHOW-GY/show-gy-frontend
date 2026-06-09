import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type Quill from "quill";
import { Q } from "../setupQuill";
import {
  EDGE,
  MAX_COLS,
  MAX_ROWS,
  MIN_COL_W,
  MIN_ROW_H,
  ensureColGroup,
  findRowBoundary,
  findTableFromEvent,
  getActiveTableEl,
  getTableSize,
  hitTestColBoundary,
} from "./tableHelpers";

type TableModule = {
  insertTable: (rows: number, cols: number) => void;
  insertRowAbove: () => void;
  insertRowBelow: () => void;
  insertColumnLeft: () => void;
  insertColumnRight: () => void;
};

type TablePlus = {
  top: number;
  left: number;
  w: number;
  h: number;
} | null;

type TableApiRef = MutableRefObject<{
  addRow?: (where: "above" | "below") => void;
  addCol?: (where: "left" | "right") => void;
  refresh?: () => void;
}>;

type AttachTableArgs = {
  quill: Quill;
  hoveredTableRef: MutableRefObject<HTMLTableElement | null>;
  setTablePlus: Dispatch<SetStateAction<TablePlus>>;
  tableApiRef: TableApiRef;
  mathOpenRef: MutableRefObject<boolean>;
};

export function attachTableInteractions({
  quill,
  hoveredTableRef,
  setTablePlus,
  tableApiRef,
  mathOpenRef,
}: AttachTableArgs) {
  function updateTablePlusPosition(table: HTMLTableElement) {
    const anchorEl = document.querySelector(".center-document") as HTMLElement | null;
    if (!anchorEl) return;

    const a = anchorEl.getBoundingClientRect();
    const r = table.getBoundingClientRect();

    const top = r.top - a.top;
    const left = r.left - a.left;

    setTablePlus({
      top,
      left,
      w: r.width,
      h: r.height,
    });
  }

  {/* 테이블 플러스 버튼 숨기는 로직 */ }
  function hideTablePlus() {
    hoveredTableRef.current = null;
    setTablePlus(null);
  }

  {/* 테이블 플러스 버튼 보여주는 로직 */ }
  const hideTimerRef = { current: null as number | null };

  {/* 테이블 플러스 버튼 숨기는 로직 */ }
  function scheduleHide() {
    if (hideTimerRef.current != null) return;
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null;
      const active = hoveredTableRef.current ?? getActiveTableEl(quill);
      if (!active) hideTablePlus();
    }, 180);
  }

  {/* 테이블 플러스 버튼 숨기는 타이머 취소하는 로직 */ }
  function cancelHide() {
    if (hideTimerRef.current != null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  {/* 마우스가 테이블 플러스 버튼 위에 있는지 체크하는 로직 */ }
  const isOverPlus = (el: HTMLElement | null) => !!el?.closest?.(".sg-table-plus");

  { /* 마우스가 움직일 때 테이블과 테이블 플러스 버튼과의 상호작용 처리하는 로직 */ }
  const onMouseMove = (e: MouseEvent) => {
    const t = e.target as HTMLElement | null;

    if (isOverPlus(t)) {
      cancelHide();
      const table = hoveredTableRef.current ?? getActiveTableEl(quill);
      if (table) updateTablePlusPosition(table);
      return;
    }

    const table = (t?.closest?.("table") as HTMLTableElement | null) ?? null;

    if (!table) {
      hoveredTableRef.current = null;
      scheduleHide();
      return;
    }

    cancelHide();
    hoveredTableRef.current = table;
    updateTablePlusPosition(table);
  };

  {/* 커서가 테이블 안에 있는지 체크해서 테이블 플러스 버튼 보여주는 로직 */ }
  const showPlusIfCursorInTable = () => {
    if (mathOpenRef.current) return;

    // ✅ Quill이 포커스가 아닐 때는 절대 selection 기반 동작하지 않음
    if (!quill.hasFocus()) {
      if (!hoveredTableRef.current) hideTablePlus();
      return;
    }

    const table = getActiveTableEl(quill);
    if (!table) {
      if (!hoveredTableRef.current) hideTablePlus();
      return;
    }
    hoveredTableRef.current = table;
    updateTablePlusPosition(table);
  };

  {/* 윈도우가 스크롤되거나 리사이즈될 때 테이블 플러스 버튼 위치 업데이트하는 로직 */ }
  const onWin = () => {
    const table = hoveredTableRef.current ?? getActiveTableEl(quill);
    if (!table) return;
    updateTablePlusPosition(table);
  };

  {/* 엔터쳤을 때 현재 라인이 "/table"이면 표 삽입하는 로직 */ }
  function insert3x3Table(q: Quill) {
    const tb = q.getModule("table") as TableModule | null;
    if (!tb) return;
    tb.insertTable(3, 3);
    q.setSelection(q.getLength() - 1, 0, Q.sources.SILENT);
  }

  {/* 표에 행 추가하는 로직 */ }
  function addRow(q: Quill, where: "above" | "below") {
    const tb = q.getModule("table") as TableModule | null;
    if (!tb) return;

    const table = getActiveTableEl(q);
    if (!table) return;

    const { rows } = getTableSize(table);
    if (rows >= MAX_ROWS) {
      alert(`세로(행)는 최대 ${MAX_ROWS}칸까지 가능합니다.`);
      return;
    }

    if (where === "above") tb.insertRowAbove();
    else tb.insertRowBelow();
  }

  {/* 표에 열 추가하는 로직 */ }
  function addCol(q: Quill, where: "left" | "right") {
    const tb = q.getModule("table") as TableModule | null;
    if (!tb) return;

    const table = getActiveTableEl(q);
    if (!table) return;

    const { cols } = getTableSize(table);
    if (cols >= MAX_COLS) {
      alert(`가로(열)는 최대 ${MAX_COLS}칸까지 가능합니다.`);
      return;
    }

    if (where === "left") tb.insertColumnLeft();
    else tb.insertColumnRight();
  }

  {/* 표의 열 크기 조절하는 로직 — boundaryIndex 와 startX 받아 i열/i+1열 동시 조정.
     colgroup 의 <col width> 뿐 아니라 각 <td> 의 inline width 도 같이 박아야 한다.
     이유: 일부 표는 td.style.width 가 콘텐츠 측정값으로 우선해서 col.width 가 무시됨. */ }
  function startColResize(table: HTMLTableElement, boundaryIndex: number, startX: number) {
    ensureColGroup(table);
    // table-layout: fixed 강제 + width px 고정 (auto 면 col.width 무시되므로)
    table.style.tableLayout = "fixed";
    if (!table.style.width || table.style.width === "100%") {
      table.style.width = `${table.getBoundingClientRect().width}px`;
    }

    const cols = Array.from(table.querySelectorAll("colgroup > col")) as HTMLTableColElement[];
    const colA = cols[boundaryIndex];
    const colB = cols[boundaryIndex + 1] ?? null;
    if (!colA) return;

    // 시작 너비는 실제 렌더된 셀에서 측정 (% col 은 getBoundingClientRect 가 0 일 수 있음)
    const firstRow = table.querySelector("tr") as HTMLTableRowElement | null;
    const startWA = firstRow?.cells[boundaryIndex]?.getBoundingClientRect().width
      ?? colA.getBoundingClientRect().width;
    const startWB = colB
      ? (firstRow?.cells[boundaryIndex + 1]?.getBoundingClientRect().width
        ?? colB.getBoundingClientRect().width)
      : 0;

    document.body.classList.add("sg-table-resizing-col");

    const applyCellWidths = (widthA: number, widthB: number | null) => {
      const rows = Array.from(table.querySelectorAll("tr"));
      for (const row of rows) {
        const cellA = (row as HTMLTableRowElement).cells[boundaryIndex];
        const cellB = (row as HTMLTableRowElement).cells[boundaryIndex + 1];
        if (cellA) cellA.style.width = `${widthA}px`;
        if (cellB && widthB != null) cellB.style.width = `${widthB}px`;
      }
    };

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const nextA = Math.max(MIN_COL_W, startWA + dx);
      colA.style.width = `${nextA}px`;
      let nextB: number | null = null;
      if (colB) {
        nextB = Math.max(MIN_COL_W, startWB - (nextA - startWA));
        colB.style.width = `${nextB}px`;
      }
      applyCellWidths(nextA, nextB);
      tableApiRef.current.refresh?.();
    };

    const onUp = () => {
      document.body.classList.remove("sg-table-resizing-col");
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      tableApiRef.current.refresh?.();
    };

    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("pointerup", onUp, true);
  }

  {/* 표의 행 크기 조절하는 로직 */ }
  function startRowResize(rowEl: HTMLTableRowElement, startY: number) {
    const startH = rowEl.getBoundingClientRect().height;
    document.body.classList.add("sg-table-resizing-row");

    const onMove = (ev: PointerEvent) => {
      const dy = ev.clientY - startY;
      const next = Math.max(MIN_ROW_H, startH + dy);
      rowEl.style.height = `${next}px`;
      tableApiRef.current.refresh?.();
    };

    const onUp = () => {
      document.body.classList.remove("sg-table-resizing-row");
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      tableApiRef.current.refresh?.();
    };

    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("pointerup", onUp, true);
  }

  {/* 현재 커서가 있는 라인의 텍스트 가져오는 로직 */ }
  function currentLineText(q: Quill) {
    const range = q.getSelection();
    if (!range) return null;
    const [line] = q.getLine(range.index);
    if (!line) return null;
    return ((line as any).domNode?.textContent as string | undefined)?.trim() ?? "";
  }

  { /* 표에서 현재 라인 삭제하는 로직 */ }
  function deleteCurrentLine(q: Quill) {
    const range = q.getSelection();
    if (!range) return;
    const [line, offset] = q.getLine(range.index);
    if (!line) return;

    const lineStart = range.index - offset;
    const len = (line as any).length();
    q.deleteText(lineStart, len, Q.sources.USER);
    q.setSelection(lineStart, 0, Q.sources.SILENT);
  }

  tableApiRef.current.addRow = (where) => addRow(quill, where);
  tableApiRef.current.addCol = (where) => addCol(quill, where);
  tableApiRef.current.refresh = () => {
    const t = hoveredTableRef.current ?? getActiveTableEl(quill);
    if (!t) return;
    ensureColGroup(t);
    updateTablePlusPosition(t);
  };

  {/* 마우스가 테이블과 테이블 플러스 버튼 위에 있는지 체크해서 테이블 플러스 버튼 보여주는 로직 */ }
  const onPointerMove = (e: PointerEvent) => {
    const root = quill.root as HTMLElement;
    root.classList.remove("sg-col-resize-cursor", "sg-row-resize-cursor");
    document.body.classList.remove("sg-col-resize-cursor-body", "sg-row-resize-cursor-body");

    const table = findTableFromEvent(e);
    if (!table) return;

    const colHit = hitTestColBoundary(table, e.clientX);
    if (colHit) {
      document.body.classList.add("sg-col-resize-cursor-body");
      root.classList.add("sg-col-resize-cursor");
      return;
    }

    const rowB = findRowBoundary(table, e.clientY);
    if (rowB) {
      document.body.classList.add("sg-row-resize-cursor-body");
      root.classList.add("sg-row-resize-cursor");
    }
  };

  {/* 마우스가 테이블과 테이블 플러스 버튼 위에 있는지 체크해서 테이블 플러스 버튼 보여주는 로직 */ }
  const onPointerDown = (e: PointerEvent) => {
    const t = e.target as HTMLElement | null;
    if (t?.closest?.(".sg-table-plus")) return;

    const table = findTableFromEvent(e);
    if (!table) return;

    const colHit = hitTestColBoundary(table, e.clientX);
    if (colHit) {
      e.preventDefault();
      e.stopPropagation();

      hoveredTableRef.current = table;
      updateTablePlusPosition(table);

      startColResize(table, colHit.boundaryIndex, colHit.startX);
      return;
    }

    const rowB = findRowBoundary(table, e.clientY);
    if (rowB) {
      e.preventDefault();
      e.stopPropagation();

      hoveredTableRef.current = table;
      updateTablePlusPosition(table);

      startRowResize(rowB, e.clientY);
    }
  };

  {/* 엔터쳤을 때 현재 라인이 "/table"이면 표 삽입하는 로직 */ }
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;

    const text = currentLineText(quill);
    if (text !== "/table") return;

    e.preventDefault();
    e.stopPropagation();

    deleteCurrentLine(quill);
    insert3x3Table(quill);
  };

  quill.root.addEventListener("mousemove", onMouseMove);
  quill.on("selection-change", showPlusIfCursorInTable);
  window.addEventListener("scroll", onWin, { passive: true });
  window.addEventListener("resize", onWin, { passive: true });
  quill.root.addEventListener("keydown", onKeydown, true);
  quill.root.addEventListener("pointermove", onPointerMove, true);
  quill.root.addEventListener("pointerdown", onPointerDown, true);

  return () => {
    quill.root.removeEventListener("mousemove", onMouseMove);
    quill.off("selection-change", showPlusIfCursorInTable);
    window.removeEventListener("scroll", onWin);
    window.removeEventListener("resize", onWin);
    quill.root.removeEventListener("keydown", onKeydown, true);
    quill.root.removeEventListener("pointermove", onPointerMove, true);
    quill.root.removeEventListener("pointerdown", onPointerDown, true);
    if (hideTimerRef.current != null) clearTimeout(hideTimerRef.current);
    tableApiRef.current = {};
  };
}
