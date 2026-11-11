// Paste this into your Google Sheet: Extensions -> Apps Script.
// It adds each new Gayu lead as a row on the first sheet. Requests without the secret code are ignored.
// Set the code under Project Settings -> Script properties, with the property name SECRET.

const HEADERS = ["When (UTC)", "Name", "Phone", "What they want", "Language"];

function doPost(event) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const lead = JSON.parse(event.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty("SECRET");
    if (!secret || lead.secret !== secret) return reply({ ok: false });
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    sheet.appendRow([lead.when, lead.name, lead.phone, lead.note, lead.language].map(asText));
    return reply({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

// A value starting with = + - or @ is kept as text, so the sheet never runs it as a formula.
function asText(value) {
  const text = String(value || "");
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
