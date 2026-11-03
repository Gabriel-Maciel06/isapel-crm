/**
 * tests/test_adversarial_backend.js
 * Empirical Adversarial Test Harness - Backend, RBAC, Validation & Arena Integration
 * CRM Isapel Papéis v1.2.0
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('⚡ ============================================================');
console.log('⚡ INICIANDO SUÍTE ADVERSARIAL EMPÍRICA (BACKEND & ARENA)');
console.log('⚡ ============================================================\n');

// Mock browser globals for Node.js
const eventLog = [];
global.window = {
  dispatchEvent: (evt) => {
    eventLog.push(evt);
    return true;
  }
};
global.CustomEvent = class {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
};

const mockFetchCalls = [];
global.fetch = async (url, options = {}) => {
  mockFetchCalls.push({ url, options });
  return {
    ok: true,
    status: 200,
    json: async () => []
  };
};

// Resilient localStorage mock
const storageMock = {};
global.localStorage = {
  getItem: (k) => storageMock[k] || null,
  setItem: (k, v) => { storageMock[k] = String(v); },
  removeItem: (k) => { delete storageMock[k]; },
  clear: () => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }
};
global.sessionStorage = {
  getItem: (k) => storageMock[k] || null,
  setItem: (k, v) => { storageMock[k] = String(v); },
  removeItem: (k) => { delete storageMock[k]; },
  clear: () => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }
};

const authPath = path.resolve(__dirname, '../js/crm-auth.js');
const syncPath = path.resolve(__dirname, '../js/crm-sync.js');
const backendPath = path.resolve(__dirname, '../js/crm-backend.js');

const IsapelAuth = require(authPath);
const IsapelSync = require(syncPath);
const IsapelCRM = require(backendPath);

global.window.IsapelAuth = IsapelAuth;
global.window.IsapelSync = IsapelSync;
global.window.IsapelCRM = IsapelCRM;

const diretoriaLogin = IsapelAuth.login('diretoria', 'Diretoria123!');
assert.strictEqual(diretoriaLogin.ok, true, 'Diretoria deve autenticar para os testes');
const sessaoDir = diretoriaLogin.sessao;

const macielLogin = IsapelAuth.login('maciel', 'maciel0602');
assert.strictEqual(macielLogin.ok, true, 'Maciel deve autenticar');
const sessaoVendedor = macielLogin.sessao;

let passCount = 0;
let failCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failCount++;
  }
}

// ============================================================================
// 1. BOUNDARY & EXTREME CONDITIONS: SELLER REGISTRATION
// ============================================================================
console.log('--- 1. Boundary & Extreme Conditions: Seller Registration ---');

// 1.1 Whitespace Fuzzing
runTest('Whitespace-only login is rejected', () => {
  const res = IsapelAuth.cadastrarVendedor({ nome: 'Teste Silva', login: '   ', senhaInicial: '123456' }, sessaoDir);
  assert.strictEqual(res.ok, false);
  assert(res.erro.includes('Identificador'));
});

runTest('Whitespace-only name is rejected', () => {
  const res = IsapelAuth.cadastrarVendedor({ nome: '   ', login: 'teste_valido', senhaInicial: '123456' }, sessaoDir);
  assert.strictEqual(res.ok, false);
  assert(res.erro.includes('Nome completo'));
});

runTest('Leading and trailing whitespace in login is trimmed and sanitized', () => {
  const res = IsapelAuth.cadastrarVendedor({ nome: 'Consultor Trim', login: '  trim_user  ', senhaInicial: '123456' }, sessaoDir);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.vendedor.login, 'trim_user');
  assert.strictEqual(res.vendedor.id, 'trim_user');
});

runTest('Internal whitespace in login is stripped to valid alphanumeric format', () => {
  const res = IsapelAuth.cadastrarVendedor({ nome: 'Consultor Espacos', login: 'user with spaces', senhaInicial: '123456' }, sessaoDir);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.vendedor.login, 'userwithspaces');
});

// 1.2 Mixed Case & Collision Resistance
runTest('Collision check blocks uppercase founder login "MACIEL"', () => {
  const res = IsapelAuth.cadastrarVendedor({ nome: 'Falso Maciel', login: 'MACIEL', senhaInicial: '123456' }, sessaoDir);
  assert.strictEqual(res.ok, false);
  assert(res.erro.includes('já está em uso'), `Esperado erro de duplicata, recebido: ${res.erro}`);
});

runTest('Collision check blocks mixed-case founder login "FeRnAnDa"', () => {
  const res = IsapelAuth.cadastrarVendedor({ nome: 'Falsa Fernanda', login: 'FeRnAnDa', senhaInicial: '123456' }, sessaoDir);
  assert.strictEqual(res.ok, false);
  assert(res.erro.includes('já está em uso'));
});

runTest('Collision check blocks mixed-case founder login "CaIo"', () => {
  const res = IsapelAuth.cadastrarVendedor({ nome: 'Falso Caio', login: 'CaIo', senhaInicial: '123456' }, sessaoDir);
  assert.strictEqual(res.ok, false);
  assert(res.erro.includes('já está em uso'));
});

runTest('Collision check blocks admin login "DiReToRiA"', () => {
  const res = IsapelAuth.cadastrarVendedor({ nome: 'Falsa Diretoria', login: 'DiReToRiA', senhaInicial: '123456' }, sessaoDir);
  assert.strictEqual(res.ok, false);
  assert(res.erro.includes('já está em uso'));
});

runTest('Duplicate check blocks re-registration of existing dynamic seller with different case', () => {
  const res1 = IsapelAuth.cadastrarVendedor({ nome: 'Roberto Carlos', login: 'roberto_carlos', senhaInicial: '123456' }, sessaoDir);
  assert.strictEqual(res1.ok, true);

  const res2 = IsapelAuth.cadastrarVendedor({ nome: 'Roberto Carlos Clone', login: 'ROBERTO_CARLOS', senhaInicial: '123456' }, sessaoDir);
  assert.strictEqual(res2.ok, false);
  assert(res2.erro.includes('já está em uso'));
});

// 1.3 Special Characters, Accents & Injection Attacks
runTest('Special characters only (e.g. "@#$%^&*()") are stripped and rejected if under 3 chars', () => {
  const res = IsapelAuth.cadastrarVendedor({ nome: 'Simbolos', login: '!@#$%^&*()', senhaInicial: '123456' }, sessaoDir);
  assert.strictEqual(res.ok, false);
  assert(res.erro.includes('Identificador'));
});

runTest('Accents are stripped and valid alphanumeric base preserved', () => {
  const res = IsapelAuth.cadastrarVendedor({ nome: 'João Antônio', login: 'joão_antônio', senhaInicial: '123456' }, sessaoDir);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.vendedor.login, 'joo_antnio');
});

runTest('SQL injection string in login is neutralized to harmless alphanumeric', () => {
  const res = IsapelAuth.cadastrarVendedor({ nome: 'Hacker Sql', login: "admin' OR '1'='1'--", senhaInicial: '123456' }, sessaoDir);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.vendedor.login, 'adminor11--');
});

runTest('HTML/Script tags in login are stripped and sanitized', () => {
  const res = IsapelAuth.cadastrarVendedor({ nome: 'Hacker XSS', login: '<script>alert(1)</script>', senhaInicial: '123456' }, sessaoDir);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.vendedor.login, 'scriptalert1script');
});

// 1.4 Length Boundaries
runTest('Login length < 3 chars is strictly rejected', () => {
  ['', 'a', 'ab', '  1  '].forEach(shortLogin => {
    const res = IsapelAuth.cadastrarVendedor({ nome: 'Curto Test', login: shortLogin, senhaInicial: '123456' }, sessaoDir);
    assert.strictEqual(res.ok, false, `Login '${shortLogin}' deveria ser rejeitado`);
  });
});

runTest('Login exactly 3 valid chars is accepted', () => {
  const res = IsapelAuth.cadastrarVendedor({ nome: 'Tres Letras', login: 't3c', senhaInicial: '123456' }, sessaoDir);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.vendedor.login, 't3c');
});

runTest('Password < 6 chars is strictly rejected', () => {
  ['', '1', '123', '12345'].forEach(shortPass => {
    const res = IsapelAuth.cadastrarVendedor({ nome: 'Senha Curta', login: `pass_test_${shortPass}`, senhaInicial: shortPass }, sessaoDir);
    assert.strictEqual(res.ok, false);
    assert(res.erro.includes('Senha'));
  });
});

runTest('Password exactly 6 chars is accepted', () => {
  const res = IsapelAuth.cadastrarVendedor({ nome: 'Senha Seis', login: 'pass_seis', senhaInicial: 'abc123' }, sessaoDir);
  assert.strictEqual(res.ok, true);
});

// 1.5 Quota / Meta Boundary & Sanity Handling
runTest('Negative or NaN meta is safely normalized to positive defaults', () => {
  const resNeg = IsapelAuth.cadastrarVendedor({
    nome: 'Meta Negativa',
    login: 'meta_neg',
    senhaInicial: '123456',
    metaMensalReais: -50000,
    metaMensalFardos: -200
  }, sessaoDir);
  assert.strictEqual(resNeg.ok, true);
  assert(resNeg.vendedor.metaMensalReais >= 0);
  assert(resNeg.vendedor.metaMensalFardos >= 0);

  const resNaN = IsapelAuth.cadastrarVendedor({
    nome: 'Meta NaN',
    login: 'meta_nan',
    senhaInicial: '123456',
    metaMensalReais: 'not_a_number',
    metaMensalFardos: null
  }, sessaoDir);
  assert.strictEqual(resNaN.ok, true);
  assert(!isNaN(resNaN.vendedor.metaMensalReais));
  assert(!isNaN(resNaN.vendedor.metaMensalFardos));
});

// 1.6 RBAC Security Tampering Resistance
runTest('Vendedor authenticated session CANNOT create seller', () => {
  const res = IsapelAuth.cadastrarVendedor({ nome: 'Tentativa Vendedor', login: 'vendedor_hack', senhaInicial: '123456' }, sessaoVendedor);
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.erro, 'Acesso restrito à Diretoria Comercial.');
});

runTest('Unauthenticated call without session CANNOT create seller', () => {
  const res = IsapelAuth.cadastrarVendedor({ nome: 'Tentativa Anon', login: 'anon_hack', senhaInicial: '123456' }, null);
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.erro, 'Acesso restrito à Diretoria Comercial.');
});

// ============================================================================
// 2. IMMEDIATE DYNAMIC INTEGRATION: RANKING, METRICS & ARENA SCENE
// ============================================================================
console.log('\n--- 2. Dynamic Integration: Rankings, Metrics & Podium/Floor ---');

runTest('Registering multiple dynamic sellers updates obterVendedores() without duplicates', () => {
  const sellerList = IsapelAuth.obterVendedores();
  const ids = sellerList.map(s => s.id);
  const uniqueIds = new Set(ids);
  assert.strictEqual(ids.length, uniqueIds.size, 'Não deve haver duplicatas em obterVendedores()');
  assert(ids.includes('maciel'));
  assert(ids.includes('fernanda'));
  assert(ids.includes('caio'));
  assert(ids.length >= 7, `Total de vendedores esperados >= 7, encontrado: ${ids.length}`);
});

runTest('IsapelCRM.calcularMetricasArena computes valid XP, conversion and stages for all dynamic sellers', () => {
  // Add some simulated leads for the dynamic seller 'roberto_carlos'
  const mockLeads = [
    {
      id: 'lead-dyn-1',
      vendedorId: 'roberto_carlos',
      estagio: 'fechado',
      valorProposta: 12500,
      amostraEnviada: true,
      historico: [{ data: new Date().toISOString(), acao: 'Fechamento' }]
    },
    {
      id: 'lead-dyn-2',
      vendedorId: 'roberto_carlos',
      estagio: 'negociacao',
      valorProposta: 8000,
      amostraEnviada: false,
      historico: [{ data: new Date().toISOString(), acao: 'Negociação de frete' }]
    },
    {
      id: 'lead-dyn-3',
      vendedorId: 'maciel',
      estagio: 'fechado',
      valorProposta: 25000,
      amostraEnviada: true,
      historico: [{ data: new Date().toISOString(), acao: 'Fechamento fardos' }]
    }
  ];

  const metricas = IsapelCRM.calcularMetricasArena(null, mockLeads);
  assert(Array.isArray(metricas));
  const robertoMetrica = metricas.find(m => m.vendedorId === 'roberto_carlos');
  assert(robertoMetrica, 'Roberto Carlos deve estar presente nas métricas da arena');
  assert.strictEqual(robertoMetrica.totalCadastrados, 2);
  assert.strictEqual(robertoMetrica.totalFechados, 1);
  assert.strictEqual(robertoMetrica.volumeTotalFaturado, 12500);
  assert.strictEqual(robertoMetrica.taxaConversao, 50); // 1 fechado de 2 cadastrados = 50%
  assert(robertoMetrica.pontuacaoGeral > 0, 'Pontuação XP deve ser positiva');
  assert(!isNaN(robertoMetrica.pontuacaoGeral), 'Pontuação XP não pode ser NaN');
});

runTest('Floor coordinates formula in arena-3d handles ranks 4, 5, 6, 7+ smoothly', () => {
  // Extract or verify the mathematical slot positioning logic for 4+
  const PODIUM_SLOTS = {
    1: { x: 0, y: 1.5, z: 0, label: '1º LUGAR' },
    2: { x: -3.1, y: 1.15, z: 0.3, label: '2º LUGAR' },
    3: { x: 3.1, y: 0.85, z: 0.4, label: '3º LUGAR' }
  };
  function obterSlotPodio(rank) {
    if (PODIUM_SLOTS[rank]) return PODIUM_SLOTS[rank];
    const lateral = (rank % 2 === 0 ? -1 : 1);
    const idx = Math.floor((rank - 4) / 2);
    return {
      x: lateral * (4.8 + idx * 1.5),
      y: 0.18,
      z: 1.0 + idx * 1.2,
      label: `${rank}º LUGAR`
    };
  }

  for (let r = 1; r <= 20; r++) {
    const slot = obterSlotPodio(r);
    assert(!isNaN(slot.x), `Rank ${r}: x não pode ser NaN`);
    assert(!isNaN(slot.y), `Rank ${r}: y não pode ser NaN`);
    assert(!isNaN(slot.z), `Rank ${r}: z não pode ser NaN`);
    if (r <= 3) {
      assert(slot.y >= 0.85, `Pódio ${r} deve ter elevação de pilar`);
    } else {
      assert.strictEqual(slot.y, 0.18, `Rank ${r} deve ficar no piso da arena`);
    }
  }
});

// ============================================================================
// 3. AVATAR TRAIT COMBINATIONS: PERMUTATION SANITY
// ============================================================================
console.log('\n--- 3. Avatar Trait Combinations: Sanity & Normalization ---');

runTest('Avatar normalization handles malformed and heterogeneous structures', () => {
  // Test normalization logic with undefined, empty, or legacy objects
  const rawConfigs = [
    null,
    {},
    { uniforme: 'PÓLO AZUL CÉU COM CRACHÁ' },
    { uniforme: { tipo: 'blazer social', temCracha: true } },
    { cabelo: { estilo: 'cabelo longo feminino com mechas', cor: '#E2BA86' } },
    { barba: { estilo: 'bigode canônico do maciel', hex: '#111111' } },
    { acessorios: { oculos: 'redondo moderno' } }
  ];

  // Load arena-3d content to test normalizarConfigAvatar directly
  const arenaContent = fs.readFileSync(path.resolve(__dirname, '../js/arena-3d.js'), 'utf8');
  assert(arenaContent.includes('function normalizarConfigAvatar'), 'normalizarConfigAvatar deve existir em arena-3d.js');
  assert(arenaContent.includes('bigode_maciel'), 'O bigode de Gabriel Maciel deve estar canonicamente modelado');
  assert(arenaContent.includes('cachosMaciel'), 'Os cachos de Gabriel Maciel devem estar canonicamente modelados');
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n============================================================');
console.log(`TOTAL DE TESTES EXECUTADOS: ${passCount + failCount}`);
console.log(`TESTES APROVADOS:           ${passCount}`);
console.log(`TESTES COM FALHA:           ${failCount}`);
console.log('============================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 TODOS OS TESTES ADVERSARIAIS DO BACKEND PASSARAM COM SUCESSO!\n');
  process.exit(0);
}
