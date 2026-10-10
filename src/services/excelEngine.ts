import * as XLSX from "xlsx";
import type { DataColumn } from "@/components/arc/sortable-data-table/sortable-data-table";

export interface ExcelRow extends Record<string, unknown> {
  __id: string;
}

export interface SheetData {
  sheetName: string;
  totalRows: number;
  totalColumns: number;
  columns: DataColumn<ExcelRow>[];
  rows: ExcelRow[];
}

export interface ExcelProcessResult {
  fileName: string;
  sheetName: string;
  availableSheets: string[];
  totalRows: number;
  totalColumns: number;
  columns: DataColumn<ExcelRow>[];
  rows: ExcelRow[];
  sheets: Record<string, SheetData>;
  metadata: {
    headerRowIndex: number;
    hasMultiLevelHeaders: boolean;
    unrolledMergesCount: number;
    emptyRowsRemoved: number;
    processingTimeMs: number;
  };
}

/**
 * Propagates merged cells across only relevant headers and data blocks
 * Avoids infinite loops over empty template ranges
 */
function unrollWorksheetMerges(worksheet: XLSX.WorkSheet, maxRowsLimit: number): number {
  const merges = worksheet["!merges"];
  if (!merges || !Array.isArray(merges) || merges.length === 0) return 0;

  let unrolledCount = 0;
  for (const merge of merges) {
    // Skip unreasonable massive ranges (e.g. whole column A:A merge)
    if (merge.s.r > maxRowsLimit) continue;
    const endR = Math.min(merge.e.r, maxRowsLimit);
    const endC = Math.min(merge.e.c, merge.s.c + 50);

    const startCellAddress = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
    const sourceCell = worksheet[startCellAddress];
    if (!sourceCell) continue;

    for (let r = merge.s.r; r <= endR; r++) {
      for (let c = merge.s.c; c <= endC; c++) {
        if (r === merge.s.r && c === merge.s.c) continue;
        const targetAddress = XLSX.utils.encode_cell({ r, c });
        if (!worksheet[targetAddress] || worksheet[targetAddress].v === undefined) {
          worksheet[targetAddress] = { ...sourceCell };
          unrolledCount++;
        }
      }
    }
  }
  return unrolledCount;
}

/**
 * Fast delimiter detector for CSV / TSV text
 */
function detectAndParseDelimitedText(text: string): XLSX.WorkBook | null {
  const sampleLines = text.split(/\r?\n/).slice(0, 10).filter((l) => l.trim().length > 0);
  if (sampleLines.length === 0) return null;

  const counts = { ",": 0, ";": 0, "\t": 0, "|": 0 };
  for (const line of sampleLines) {
    counts[","] += (line.match(/,/g) || []).length;
    counts[";"] += (line.match(/;/g) || []).length;
    counts["\t"] += (line.match(/\t/g) || []).length;
    counts["|"] += (line.match(/\|/g) || []).length;
  }

  let bestDelimiter = ",";
  let maxCount = counts[","];
  if (counts[";"] > maxCount) {
    bestDelimiter = ";";
    maxCount = counts[";"];
  }
  if (counts["\t"] > maxCount) {
    bestDelimiter = "\t";
    maxCount = counts["\t"];
  }
  if (counts["|"] > maxCount) {
    bestDelimiter = "|";
  }

  try {
    return XLSX.read(text, {
      type: "string",
      raw: false,
      cellDates: true,
      FS: bestDelimiter,
    });
  } catch {
    return null;
  }
}

/**
 * High-performance, Memory-Efficient Sheet Analyzer
 * Handles 100 to 100,000+ rows in milliseconds without browser freezing
 */
function analyzeAndExtractSheet(worksheet: XLSX.WorkSheet, sheetName: string): SheetData & {
  headerRowIndex: number;
  hasMultiLevelHeaders: boolean;
  emptyRowsRemoved: number;
} {
  if (!worksheet || !worksheet["!ref"]) {
    return {
      sheetName,
      totalRows: 0,
      totalColumns: 0,
      columns: [],
      rows: [],
      headerRowIndex: 0,
      hasMultiLevelHeaders: false,
      emptyRowsRemoved: 0,
    };
  }

  // 1. Fast boundary estimation
  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  const maxRowsLimit = Math.min(range.e.r, 50000);

  // 2. Unroll only header and active data merges
  unrollWorksheetMerges(worksheet, Math.min(maxRowsLimit, 100));

  // 3. Fast SheetJS extraction to 2D string array
  const rawMatrix: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });

  if (!rawMatrix || rawMatrix.length === 0) {
    return {
      sheetName,
      totalRows: 0,
      totalColumns: 0,
      columns: [],
      rows: [],
      headerRowIndex: 0,
      hasMultiLevelHeaders: false,
      emptyRowsRemoved: 0,
    };
  }

  // 4. Intelligent Header Row Scoring on first 20 rows
  let bestHeaderIdx = 0;
  let maxScore = -1;
  const inspectionLimit = Math.min(rawMatrix.length, 20);

  for (let r = 0; r < inspectionLimit; r++) {
    const row = rawMatrix[r];
    if (!Array.isArray(row)) continue;

    let nonEmptyCount = 0;
    let stringCount = 0;
    const uniqueTokens = new Set<string>();

    for (const cell of row) {
      const str = cell != null ? String(cell).trim() : "";
      if (str !== "") {
        nonEmptyCount++;
        const cleanedNum = str.replace(/[$,%]/g, "").trim();
        if (isNaN(Number(cleanedNum)) || cleanedNum === "") {
          stringCount++;
        }
        uniqueTokens.add(str.toLowerCase());
      }
    }

    if (nonEmptyCount === 0) continue;

    const stringRatio = stringCount / nonEmptyCount;
    const uniquenessRatio = uniqueTokens.size / nonEmptyCount;
    let downstreamScore = 0;
    if (r + 1 < rawMatrix.length) {
      const nextRow = rawMatrix[r + 1];
      if (Array.isArray(nextRow) && nextRow.length >= Math.floor(nonEmptyCount * 0.7)) {
        downstreamScore = 15;
      }
    }

    const score = nonEmptyCount * 3 + stringRatio * 15 + uniquenessRatio * 10 + downstreamScore;
    if (score > maxScore) {
      maxScore = score;
      bestHeaderIdx = r;
    }
  }

  // 5. Multi-level Header Check
  let hasMultiLevelHeaders = false;
  let headerRow = (rawMatrix[bestHeaderIdx] || []) as unknown[];

  if (bestHeaderIdx + 1 < rawMatrix.length) {
    const nextRow = rawMatrix[bestHeaderIdx + 1];
    if (Array.isArray(nextRow)) {
      const currNonEmpty = headerRow.filter((c) => c != null && String(c).trim() !== "").length;
      const nextNonEmpty = nextRow.filter((c) => c != null && String(c).trim() !== "").length;

      if (nextNonEmpty >= Math.floor(currNonEmpty * 0.75) && currNonEmpty > 1) {
        hasMultiLevelHeaders = true;
        const maxLen = Math.max(headerRow.length, nextRow.length);
        const combinedHeader: string[] = [];
        for (let c = 0; c < maxLen; c++) {
          const top = headerRow[c] != null ? String(headerRow[c]).trim() : "";
          const sub = nextRow[c] != null ? String(nextRow[c]).trim() : "";
          if (top && sub && top !== sub) {
            combinedHeader.push(`${top} - ${sub}`);
          } else {
            combinedHeader.push(sub || top);
          }
        }
        headerRow = combinedHeader;
        bestHeaderIdx = bestHeaderIdx + 1;
      }
    }
  }

  // 6. Active Column Detection & Name Deduplication
  const maxColsCount = Math.min(
    Math.max(headerRow.length, ...rawMatrix.slice(bestHeaderIdx, bestHeaderIdx + 30).map((r) => (Array.isArray(r) ? r.length : 0))),
    150
  );

  const activeColIndices: number[] = [];
  const seenHeaderNames = new Set<string>();
  const columnLabels: string[] = [];

  for (let c = 0; c < maxColsCount; c++) {
    let colHasContent = false;
    for (let r = bestHeaderIdx; r < Math.min(rawMatrix.length, bestHeaderIdx + 50); r++) {
      const row = rawMatrix[r];
      if (row && row[c] != null && String(row[c]).trim() !== "") {
        colHasContent = true;
        break;
      }
    }

    if (!colHasContent) continue;

    activeColIndices.push(c);
    let baseName = headerRow[c] != null ? String(headerRow[c]).trim() : "";
    if (!baseName || baseName.startsWith("__EMPTY")) {
      baseName = `Column ${XLSX.utils.encode_col(c)}`;
    }

    let finalName = baseName;
    let dupCounter = 2;
    while (seenHeaderNames.has(finalName)) {
      finalName = `${baseName} (${dupCounter})`;
      dupCounter++;
    }
    seenHeaderNames.add(finalName);
    columnLabels.push(finalName);
  }

  // 7. Fast Data Extraction
  const dataRows: ExcelRow[] = [];
  let emptyRowsCount = 0;

  for (let r = bestHeaderIdx + 1; r < rawMatrix.length; r++) {
    const row = rawMatrix[r];
    if (!row || !Array.isArray(row)) {
      emptyRowsCount++;
      continue;
    }

    let rowHasData = false;
    const rowObj: ExcelRow = {
      __id: `row-${dataRows.length + 1}`,
    };

    for (let i = 0; i < activeColIndices.length; i++) {
      const colIdx = activeColIndices[i];
      const colKey = columnLabels[i];
      const val = row[colIdx];
      const strVal = val != null ? String(val).trim().replace(/\u00a0/g, " ") : "";
      rowObj[colKey] = strVal;
      if (strVal !== "") {
        rowHasData = true;
      }
    }

    if (rowHasData) {
      dataRows.push(rowObj);
    } else {
      emptyRowsCount++;
    }
  }

  // 8. Column Type Detection & Dynamic Width Calculation
  const columns: DataColumn<ExcelRow>[] = columnLabels.map((colKey) => {
    let numericCount = 0;
    let filledCount = 0;
    let maxCharLen = colKey.length;

    // Fast sampling on first 80 rows
    const sampleLimit = Math.min(dataRows.length, 80);
    for (let r = 0; r < sampleLimit; r++) {
      const val = String(dataRows[r][colKey] ?? "");
      if (val !== "") {
        filledCount++;
        if (val.length > maxCharLen) {
          maxCharLen = Math.min(val.length, 45);
        }
        const cleaned = val.replace(/[$,%]/g, "").trim();
        if (!isNaN(Number(cleaned)) && cleaned !== "") {
          numericCount++;
        }
      }
    }

    const isNumeric = filledCount > 0 && numericCount === filledCount;
    const computedWidth = Math.max(Math.min(maxCharLen * 10 + 44, 380), 140);

    return {
      key: colKey,
      label: colKey,
      sortable: true,
      numeric: isNumeric,
      width: computedWidth,
      render: (value: unknown) => {
        if (value == null || value === "") {
          return "—";
        }
        return String(value);
      },
    };
  });

  return {
    sheetName,
    totalRows: dataRows.length,
    totalColumns: columns.length,
    columns,
    rows: dataRows,
    headerRowIndex: bestHeaderIdx,
    hasMultiLevelHeaders,
    emptyRowsRemoved: emptyRowsCount,
  };
}

/**
 * Universal Ultra-Fast Excel Engine
 */
export async function processExcelWorkbook(
  input: ArrayBuffer | Uint8Array | File | string,
  fileName: string = "Spreadsheet"
): Promise<ExcelProcessResult> {
  const startTime = performance.now();

  let workbook: XLSX.WorkBook;

  if (input instanceof File) {
    fileName = input.name;
    const isCsvOrText =
      input.name.endsWith(".csv") ||
      input.name.endsWith(".tsv") ||
      input.name.endsWith(".txt");

    if (isCsvOrText) {
      const text = await input.text();
      const parsedTextWb = detectAndParseDelimitedText(text);
      if (parsedTextWb) {
        workbook = parsedTextWb;
      } else {
        const buffer = await input.arrayBuffer();
        workbook = XLSX.read(buffer, {
          type: "array",
          cellDates: true,
          cellNF: true,
          cellText: true,
          raw: false,
        });
      }
    } else {
      const buffer = await input.arrayBuffer();
      workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
        cellNF: true,
        cellText: true,
        raw: false,
      });
    }
  } else if (typeof input === "string") {
    const parsedTextWb = detectAndParseDelimitedText(input);
    if (parsedTextWb) {
      workbook = parsedTextWb;
    } else {
      workbook = XLSX.read(input, {
        type: "string",
        cellDates: true,
        cellNF: true,
        cellText: true,
      });
    }
  } else {
    const buffer = input instanceof Uint8Array ? input.buffer : input;
    workbook = XLSX.read(buffer, {
      type: "array",
      cellDates: true,
      cellNF: true,
      cellText: true,
      raw: false,
    });
  }

  const availableSheets = workbook.SheetNames || [];
  if (availableSheets.length === 0) {
    throw new Error("No worksheets found in this workbook.");
  }

  // Parse all available sheets
  const sheets: Record<string, SheetData> = {};
  let bestSheetName = availableSheets[0];
  let maxRowsCount = -1;
  let primaryAnalysis: ReturnType<typeof analyzeAndExtractSheet> | null = null;

  for (const sName of availableSheets) {
    const ws = workbook.Sheets[sName];
    if (ws) {
      const analysis = analyzeAndExtractSheet(ws, sName);
      sheets[sName] = {
        sheetName: sName,
        totalRows: analysis.totalRows,
        totalColumns: analysis.totalColumns,
        columns: analysis.columns,
        rows: analysis.rows,
      };

      if (analysis.totalRows > maxRowsCount) {
        maxRowsCount = analysis.totalRows;
        bestSheetName = sName;
        primaryAnalysis = analysis;
      }
    }
  }

  const primary = primaryAnalysis || {
    sheetName: bestSheetName,
    totalRows: 0,
    totalColumns: 0,
    columns: [],
    rows: [],
    headerRowIndex: 0,
    hasMultiLevelHeaders: false,
    emptyRowsRemoved: 0,
  };

  const processingTimeMs = Math.round(performance.now() - startTime);

  return {
    fileName,
    sheetName: bestSheetName,
    availableSheets,
    totalRows: primary.totalRows,
    totalColumns: primary.totalColumns,
    columns: primary.columns,
    rows: primary.rows,
    sheets,
    metadata: {
      headerRowIndex: primary.headerRowIndex,
      hasMultiLevelHeaders: primary.hasMultiLevelHeaders,
      unrolledMergesCount: 0,
      emptyRowsRemoved: primary.emptyRowsRemoved,
      processingTimeMs,
    },
  };
}
