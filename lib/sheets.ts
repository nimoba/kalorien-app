import { google, sheets_v4 } from "googleapis";

export function getSheets(readonly = false): sheets_v4.Sheets {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
    scopes: [readonly ? "https://www.googleapis.com/auth/spreadsheets.readonly" : "https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export const SHEET_ID = () => process.env.GOOGLE_SHEET_ID || "";

let sheetGidCache: Record<string, number> | null = null;

/** Resolves a sheet title (e.g. "Tabelle1") to its numeric sheetId (gid). */
export async function getSheetGid(sheets: sheets_v4.Sheets, title: string): Promise<number> {
  if (sheetGidCache && sheetGidCache[title] !== undefined) return sheetGidCache[title];
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID(), fields: "sheets.properties" });
  const map: Record<string, number> = {};
  for (const s of meta.data.sheets || []) {
    if (s.properties?.title && s.properties.sheetId !== undefined && s.properties.sheetId !== null) {
      map[s.properties.title] = s.properties.sheetId;
    }
  }
  sheetGidCache = map;
  if (map[title] === undefined) throw new Error(`Sheet "${title}" nicht gefunden`);
  return map[title];
}

/** Deletes a single 1-based row from the given sheet. */
export async function deleteRow(sheets: sheets_v4.Sheets, title: string, rowNumber: number) {
  const gid = await getSheetGid(sheets, title);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID(),
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId: gid, dimension: "ROWS", startIndex: rowNumber - 1, endIndex: rowNumber },
        },
      }],
    },
  });
}

export function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", "."));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}
