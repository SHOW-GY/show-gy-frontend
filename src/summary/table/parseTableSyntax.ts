import type Quill from "quill";

const MAX_COLS = 10;

// 변환 중복 방지 플래그
let isConvertingTable = false;
let isConvertingMath = false;

export function parseTableSyntax(text: string): { rows: string[][]; success: boolean } {
  const match = text.match(/::table\s*([\s\S]*?)\s*::endtable/);
  if (!match) {
    return { rows: [], success: false };
  }

  const content = match[1].trim();
  if (!content) {
    return { rows: [], success: false };
  }

  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    return { rows: [], success: false };
  }

  const rows: string[][] = lines.map(line => {
    const cells = line.split('|').map(cell => cell.trim());
    return cells.slice(0, MAX_COLS); // 최대 10개 열로 제한
  });

  // 모든 행의 열 개수를 첫 번째 행 기준으로 맞춤
  const colCount = rows[0].length;
  rows.forEach(row => {
    while (row.length < colCount) {
      row.push('');
    }
  });

  return { rows, success: true };
}

{/* Quill 에 표 삽입하는 로직 */}
export function insertParsedTable(quill: Quill, rows: string[][], startIndex: number, matchLength: number) {
  if (rows.length === 0) return;
  
  isConvertingTable = true;
  
  quill.deleteText(startIndex, matchLength, 'silent'); // 정확한 길이로 삭제
  const cols = rows[0].length;
  const tableModule = quill.getModule('table') as any;
  
  if (tableModule && typeof tableModule.insertTable === 'function') {
    tableModule.insertTable(rows.length, cols);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const range = quill.getSelection(true);
        let table: HTMLTableElement | null = null;

        if (range) {
          const [leaf] = quill.getLeaf(range.index);
          const dom = leaf?.domNode;
          if (dom) {
            table = (dom as HTMLElement).closest('table') as HTMLTableElement | null;
          }
        }

        if (!table) {
          const allTables = quill.root.querySelectorAll('table');
          if (allTables.length > 0) {
            table = allTables[allTables.length - 1] as HTMLTableElement;
          }
        }

        if (!table) {
          console.warn('표를 찾을 수 없습니다');
          isConvertingTable = false;
          return;
        }

        const tds = Array.from(table.querySelectorAll('td, th'));
        let cellIndex = 0;

        for (let r = 0; r < rows.length; r++) {
          for (let c = 0; c < rows[r].length; c++) {
            const td = tds[cellIndex];
            if (td) {
              td.textContent = rows[r][c];
            }
            cellIndex++;
          }
        }
        
        isConvertingTable = false;
      });
    });
  } else {
    isConvertingTable = false;
  }
}

{/* 텍스트 변경 시 ::table 구문을 감지하고 표로 변환 */}
export function detectAndConvertTableSyntax(quill: Quill) {
  // 변환 중이면 스킵
  if (isConvertingTable) return;
  
  // 전체 문서에서 첫 번째 ::table...::endtable 찾기
  const fullText = quill.getText();
  const match = fullText.match(/::table\s*([\s\S]*?)\s*::endtable/);
  if (!match) return;

  const { rows, success } = parseTableSyntax(fullText);
  if (!success || rows.length === 0) return;

  // 정확한 위치와 길이 계산
  const matchStart = fullText.indexOf('::table');
  const matchLength = match[0].length;

  insertParsedTable(quill, rows, matchStart, matchLength);
}

{/* Math 구문 파싱: ::math tex content ::endmath */}
export function parseMathSyntax(text: string): { tex: string; success: boolean } {
  const match = text.match(/::math\s*([\s\S]*?)\s*::endmath/);
  if (!match) {
    return { tex: '', success: false };
  }

  const tex = match[1].trim();
  if (!tex) {
    return { tex: '', success: false };
  }

  return { tex, success: true };
}

{/* Quill에 Math 블록 삽입하는 로직 */}
export function insertParsedMath(quill: Quill, tex: string, startIndex: number, matchLength: number) {
  if (!tex) return;

  isConvertingMath = true;

  // 기존 ::math...::endmath 텍스트 완전히 삭제
  quill.deleteText(startIndex, matchLength, 'silent');

  // math 블록 삽입
  const insertAt = startIndex;
  quill.insertEmbed(insertAt, 'sg-math-block', { tex }, 'silent');
  quill.insertText(insertAt + 1, '\n', 'silent');
  quill.setSelection(insertAt + 2, 0, 'silent');
  
  // 약간의 지연 후 플래그 해제
  setTimeout(() => {
    isConvertingMath = false;
  }, 100);
}

{/* 텍스트 변경 시 ::math 구문을 감지하고 수식 블록으로 변환 */}
export function detectAndConvertMathSyntax(quill: Quill) {
  // 변환 중이면 스킵
  if (isConvertingMath) return;
  
  // 전체 문서에서 첫 번째 ::math...::endmath 찾기
  const fullText = quill.getText();
  const match = fullText.match(/::math\s*([\s\S]*?)\s*::endmath/);
  if (!match) return;

  const { tex, success } = parseMathSyntax(fullText);
  if (!success || !tex) return;

  // 정확한 위치와 길이 계산
  const matchStart = fullText.indexOf('::math');
  const matchLength = match[0].length;

  insertParsedMath(quill, tex, matchStart, matchLength);
}
