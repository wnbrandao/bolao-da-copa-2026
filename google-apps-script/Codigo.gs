// ===== Bolão da Copa 2026 — backend no Google Sheets =====
// Cole isto em Extensões → Apps Script da sua planilha.
// 1) Rode a função setup() UMA vez (cria/atualiza as abas e cabeçalhos).
// 2) Implantar → Nova implantação → App da Web → Executar como: Eu →
//    Quem tem acesso: Qualquer pessoa → Implantar → copie a URL /exec.
// Use essa URL como NEXT_PUBLIC_API_URL no app.
//
// >> AO ALTERAR ESTE SCRIPT: publique NOVA VERSÃO na implantação EXISTENTE
//    (Gerenciar implantações → Editar → Nova versão). NÃO crie nova implantação —
//    isso mudaria a URL /exec e quebraria o secret NEXT_PUBLIC_API_URL.

const SS = SpreadsheetApp.getActiveSpreadsheet();

const PALPITES_HEADERS = ['userId', 'nome', 'enviadoEm', 'palpite', 'mata', 'enviadoMataEm'];

function setup() {
  ensurePalpites_();
  const gab = getOrCreateSheet_('gabarito', ['grupo', '1', '2', '3', '4']);
  if (gab.getLastRow() < 2) {
    const letras = 'ABCDEFGHIJKL'.split('');
    gab.getRange(2, 1, letras.length, 1).setValues(letras.map(function (l) { return [l]; }));
  }
  getOrCreateSheet_('chaveamento', ['tipo', 'id', 'valor']);
}

// Garante a aba palpites com as 6 colunas (acrescenta as novas se a planilha já
// existia com 4). Idempotente.
function ensurePalpites_() {
  const sh = getOrCreateSheet_('palpites', PALPITES_HEADERS);
  if (sh.getLastColumn() < PALPITES_HEADERS.length) {
    sh.getRange(1, 1, 1, PALPITES_HEADERS.length).setValues([PALPITES_HEADERS]);
  }
  return sh;
}

function getOrCreateSheet_(name, headers) {
  let sh = SS.getSheetByName(name);
  if (!sh) sh = SS.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  return sh;
}

// GET -> { palpites: [...], gabarito: {...}, chaveamento: {seeding, resultados} }
function doGet() {
  return json_(readState_());
}

// POST: action "save" (grupos) | "saveMata" (mata-mata).
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action === 'save') return saveGrupos_(body);
    if (body.action === 'saveMata') return saveMata_(body);
    return json_({ error: 'acao invalida' });
  } catch (err) {
    return json_({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function findRow_(values, userId) {
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === userId) return i + 1;
  }
  return -1;
}

function writeRow_(sh, row, rowData) {
  if (row > 0) sh.getRange(row, 1, 1, rowData.length).setValues([rowData]);
  else sh.appendRow(rowData);
}

function safeParseStr_(s) {
  try { return JSON.parse(s || '{}'); } catch (_) { return {}; }
}

function saveGrupos_(body) {
  const userId = String(body.userId || '').trim();
  const nome = String(body.nome || '').trim();
  if (!userId || nome.length < 2) return json_({ error: 'dados invalidos' });
  const sh = ensurePalpites_();
  const values = sh.getDataRange().getValues();
  const row = findRow_(values, userId);
  const prev = row > 0 ? values[row - 1] : [];
  const enviadoEm = body.submit ? new Date().toISOString() : String(prev[2] || '');
  // preserva mata/enviadoMataEm
  const rowData = [
    userId, nome, enviadoEm, JSON.stringify(body.palpite || {}),
    JSON.stringify(safeParseStr_(prev[4])), String(prev[5] || ''),
  ];
  writeRow_(sh, row, rowData);
  return json_({ ok: true });
}

function saveMata_(body) {
  const userId = String(body.userId || '').trim();
  const nome = String(body.nome || '').trim();
  if (!userId || nome.length < 2) return json_({ error: 'dados invalidos' });
  const sh = ensurePalpites_();
  const values = sh.getDataRange().getValues();
  const row = findRow_(values, userId);
  const prev = row > 0 ? values[row - 1] : [];
  const enviadoMataEm = body.submit ? new Date().toISOString() : String(prev[5] || '');
  // preserva enviadoEm/palpite (grupos)
  const rowData = [
    userId, nome, String(prev[2] || ''), JSON.stringify(safeParseStr_(prev[3])),
    JSON.stringify(body.mata || {}), enviadoMataEm,
  ];
  writeRow_(sh, row, rowData);
  return json_({ ok: true });
}

function readState_() {
  const pSh = ensurePalpites_();
  const gSh = getOrCreateSheet_('gabarito', ['grupo', '1', '2', '3', '4']);
  const cSh = getOrCreateSheet_('chaveamento', ['tipo', 'id', 'valor']);

  const pv = pSh.getDataRange().getValues();
  const palpites = [];
  for (let i = 1; i < pv.length; i++) {
    if (!pv[i][0]) continue;
    palpites.push({
      userId: String(pv[i][0]),
      nome: String(pv[i][1]),
      enviadoEm: String(pv[i][2] || ''),
      palpite: safeParseStr_(pv[i][3]),
      mata: safeParseStr_(pv[i][4]),
      enviadoMataEm: String(pv[i][5] || ''),
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

  const cv = cSh.getDataRange().getValues();
  const seeding = {};
  const resultados = {};
  for (let i = 1; i < cv.length; i++) {
    const tipo = String(cv[i][0] || '').trim();
    const id = String(cv[i][1] || '').trim();
    const valor = String(cv[i][2] || '').trim();
    if (!tipo || !id || !valor) continue;
    if (tipo === 'seed') seeding[id] = valor.toUpperCase();
    else if (tipo === 'result') resultados[id] = valor;
  }

  return { palpites: palpites, gabarito: gabarito, chaveamento: { seeding: seeding, resultados: resultados } };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
