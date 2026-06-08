// ===== Bolão da Copa 2026 — backend no Google Sheets =====
// Cole isto em Extensões → Apps Script da sua planilha.
// 1) Rode a função setup() UMA vez (cria as abas e cabeçalhos).
// 2) Implantar → Nova implantação → App da Web → Executar como: Eu →
//    Quem tem acesso: Qualquer pessoa → Implantar → copie a URL /exec.
// Use essa URL como NEXT_PUBLIC_API_URL no app.

const SS = SpreadsheetApp.getActiveSpreadsheet();

function setup() {
  getOrCreateSheet_('palpites', ['userId', 'nome', 'enviadoEm', 'palpite']);
  const gab = getOrCreateSheet_('gabarito', ['grupo', '1', '2', '3', '4']);
  if (gab.getLastRow() < 2) {
    const letras = 'ABCDEFGHIJKL'.split('');
    gab.getRange(2, 1, letras.length, 1).setValues(letras.map(function (l) { return [l]; }));
  }
}

function getOrCreateSheet_(name, headers) {
  let sh = SS.getSheetByName(name);
  if (!sh) sh = SS.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  return sh;
}

// GET -> { palpites: [...], gabarito: {...} }
function doGet() {
  return json_(readState_());
}

// POST { action:"save", userId, nome, palpite:{sigla:pos}, submit } -> upsert
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action !== 'save') return json_({ error: 'acao invalida' });
    const userId = String(body.userId || '').trim();
    const nome = String(body.nome || '').trim();
    if (!userId || nome.length < 2) return json_({ error: 'dados invalidos' });

    const sh = getOrCreateSheet_('palpites', ['userId', 'nome', 'enviadoEm', 'palpite']);
    const values = sh.getDataRange().getValues();
    let row = -1;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) === userId) { row = i + 1; break; }
    }
    const enviadoEm = body.submit ? new Date().toISOString()
      : (row > 0 ? values[row - 1][2] : '');
    const rowData = [userId, nome, enviadoEm, JSON.stringify(body.palpite || {})];
    if (row > 0) sh.getRange(row, 1, 1, 4).setValues([rowData]);
    else sh.appendRow(rowData);
    return json_({ ok: true });
  } catch (err) {
    return json_({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function readState_() {
  const pSh = getOrCreateSheet_('palpites', ['userId', 'nome', 'enviadoEm', 'palpite']);
  const gSh = getOrCreateSheet_('gabarito', ['grupo', '1', '2', '3', '4']);
  const pv = pSh.getDataRange().getValues();
  const palpites = [];
  for (let i = 1; i < pv.length; i++) {
    if (!pv[i][0]) continue;
    let parsed = {};
    try { parsed = JSON.parse(pv[i][3] || '{}'); } catch (_) {}
    palpites.push({
      userId: String(pv[i][0]), nome: String(pv[i][1]),
      enviadoEm: String(pv[i][2] || ''), palpite: parsed
    });
  }
  const gv = gSh.getDataRange().getValues();
  const gabarito = {};
  for (let i = 1; i < gv.length; i++) {
    const grupo = String(gv[i][0] || '').trim();
    if (!grupo) continue;
    const ordem = [gv[i][1], gv[i][2], gv[i][3], gv[i][4]]
      .map(function (c) { return String(c || '').trim().toUpperCase(); })
      .filter(Boolean);
    if (ordem.length) gabarito[grupo] = ordem;
  }
  return { palpites, gabarito };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
