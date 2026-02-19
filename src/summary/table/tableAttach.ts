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
  findRowAtY,
  findTableFromEvent,
  getActiveTableEl,
  getTableSize,
  hitTestColBoundary,
  hitTestRowBoundary,
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

  function hideTablePlus() {
    hoveredTableRef.current = null;
    setTablePlus(null);
  }

  const hideTimerRef = { current: null as number | null };

  function scheduleHide() {
    if (hideTimerRef.current != null) return;
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null;
      const active = hoveredTableRef.current ?? getActiveTableEl(quill);
      if (!active) hideTablePlus();
    }, 180);
  }

  function cancelHide() {
    if (hideTimerRef.current != null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  const isOverPlus = (el: HTMLElement | null) => !!el?.closest?.(".sg-table-plus");

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
      scheduleHide();
      return;
    }

    cancelHide();
    hoveredTableRef.current = table;
    updateTablePlusPosition(table);
  };

  const showPlusIfCursorInTable = () => {
    if (mathOpenRef.current) return;

    const table = getActiveTableEl(quill);
    if (!table) {
      if (!hoveredTableRef.current) hideTablePlus();
      return;
    }
    hoveredTableRef.current = table;
    updateTablePlusPosition(table);
  };

  const onWin = () => {
    const table = hoveredTableRef.current ?? getActiveTableEl(quill);
    if (!table) return;
    updateTablePlusPosition(table);
  };

  function insert3x3Table(q: Quill) {
    const tb = q.getModule("table") as TableModule | null;
    if (!tb) return;
    tb.insertTable(3, 3);
    q.setSelection(q.getLength() - 1, 0, Q.sources.SILENT);
  }

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

  function startColResize(table: HTMLTableElement, colIndex: number, startX: number) {
    ensureColGroup(table);
    const cols = Array.from(table.querySelectorAll("colgroup > col")) as HTMLTableColElement[];
    const colEl = cols[colIndex];
    if (!colEl) return;

    const startW = parseFloat(colEl.style.width || "0") || colEl.getBoundingClientRect().width;
    document.body.classList.add("sg-table-resizing");

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const next = Math.max(MIN_COL_W, startW + dx);
      colEl.style.width = `${next}px`;
      tableApiRef.current.refresh?.();
    };

    const onUp = () => {
      document.body.classList.remove("sg-table-resizing");
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      tableApiRef.current.refresh?.();
    };

    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("pointerup", onUp, true);
  }

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

  function currentLineText(q: Quill) {
    const range = q.getSelection();
    if (!range) return null;
    const [line] = q.getLine(range.index);
    if (!line) return null;
    return ((line as any).domNode?.textContent as string | undefined)?.trim() ?? "";
  }

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

    const row = findRowAtY(table, e.clientY);
    if (row && hitTestRowBoundary(row, e.clientY)) {
      document.body.classList.add("sg-row-resize-cursor-body");
      root.classList.add("sg-row-resize-cursor");
    }
  };

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

    const row = findRowAtY(table, e.clientY);
    if (row && hitTestRowBoundary(row, e.clientY)) {
      e.preventDefault();
      e.stopPropagation();

      hoveredTableRef.current = table;
      updateTablePlusPosition(table);

      startRowResize(row, e.clientY);
    }
  };

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
