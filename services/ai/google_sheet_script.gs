// Paste this into your Google Sheet: Extensions -> Apps Script.
// It adds each new Sara lead as a row on the first sheet. Requests without the secret code are ignored.
// Set the code under Project Settings -> Script properties, with the property name SECRET.

const HEADERS = ["When (UTC)", "Name", "Phone", "What they want", "Language", "Lead ID"];
// The column with each lead's unique id, used to update a lead the sheet already has.
const ID_COLUMN = 6;

function doPost(event) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const lead = JSON.parse(event.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty("SECRET");
    if (!secret || lead.secret !== secret) return reply({ ok: false });
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    if (sheet.getRange(1, ID_COLUMN).getValue() === "") sheet.getRange(1, ID_COLUMN).setValue("Lead ID");
    const id = String(lead.id || "");
    const values = [lead.when, lead.name, lead.phone, lead.note, lead.language, id].map(asText);
    // A lead the sheet already has is updated in place: a retry changes nothing, and a corrected name replaces the old one.
    const row = id ? rowOf(sheet, id) : 0;
    if (row) {
      sheet.getRange(row, 1, 1, values.length).setValues([values]);
      return reply({ ok: true, updated: true });
    }
    sheet.appendRow(values);
    return reply({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

// The row number of the lead with this id, or 0 if the sheet doesn't have it yet.
function rowOf(sheet, id) {
  const rows = sheet.getLastRow() - 1;
  if (rows < 1) return 0;
  const found = sheet.getRange(2, ID_COLUMN, rows, 1).createTextFinder(id).matchEntireCell(true).findNext();
  return found ? found.getRow() : 0;
}

// A value starting with = + - or @, even after spaces or control characters, is kept as text, so the sheet never runs it as a formula.
function asText(value) {
  const text = String(value || "");
  return /^[\s\x00-\x1f]*[=+\-@]|^[\t\r]/.test(text) ? "'" + text : text;
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
