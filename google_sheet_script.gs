// Paste this into your Google Sheet: Extensions -> Apps Script.
// It adds each new Sara lead as a row on the first sheet. Requests without the secret code are ignored.
// Set the code under Project Settings -> Script properties, with the property name SECRET.

const HEADERS = ["When (UTC)", "Name", "Phone", "What they want", "Language", "Lead ID"];
// The column with each lead's unique id, used to skip a lead that was already added.
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
    if (id && alreadyAdded(sheet, id)) return reply({ ok: true, duplicate: true });
    sheet.appendRow([lead.when, lead.name, lead.phone, lead.note, lead.language, id].map(asText));
    return reply({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function alreadyAdded(sheet, id) {
  const rows = sheet.getLastRow() - 1;
  if (rows < 1) return false;
  return sheet.getRange(2, ID_COLUMN, rows, 1).createTextFinder(id).matchEntireCell(true).findNext() !== null;
}

// A value starting with = + - or @, even after spaces or control characters, is kept as text, so the sheet never runs it as a formula.
function asText(value) {
  const text = String(value || "");
  return /^[\s\x00-\x1f]*[=+\-@]|^[\t\r]/.test(text) ? "'" + text : text;
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
