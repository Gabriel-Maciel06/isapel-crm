/**
 * tests/test_adversarial_challenger_backend.js
 * Adversarial Empirical Verification Suite for Isapel CRM (R1, R2, R3, R4)
 * Challenger Agent: challenger_m1_2
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

console.log('🔥 ============================================================');
console.log('🔥 INICIANDO SUÍTE ADVERSARIAL EMPÍRICA (CHALLENGER M1_2)');
console.log('🔥 ============================================================\n');

// 1. In-memory Mock LocalStorage
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();
global.window = {
  localStorage: mockStorage,
  dispatchEvent: () => true
};
global.localStorage = mockStorage;

const CRM = require('../js/crm-backend.js');
const Sync = require('../js/crm-sync.js');

let totalTests = 0;
let passedTests = 0;
const failures = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Erro: ${err.message}`);
    failures.push({ name, error: err });
  }
}

async function asyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Erro: ${err.message}`);
    failures.push({ name, error: err });
  }
}

// Baseline leads setup
function resetLeadsToBaseline() {
  const initialLeads = [
    {
      id: 'lead-maciel-01',
      nome: 'Hospital Samaritano Campinas',
      telefone: '19987654321',
      vendedorId: 'maciel',
      vendedorNome: 'Gabriel Maciel',
      estagio: 'novo',
      tipoCliente: 'consumidor_final',
      valorProposta: 15000,
      dataAtualizacao: '2026-11-05T10:00:00.000Z',
      _tsLocal: 1793872800000
    },
    {
      id: 'lead-fernanda-01',
      nome: 'Distribuidora Papéis Sorocaba',
      telefone: '15981234567',
      vendedorId: 'fernanda',
      vendedorNome: 'Fernanda',
      estagio: 'qualificacao',
      tipoCliente: 'distribuidor',
      valorProposta: 25000,
      dataAtualizacao: '2026-11-05T10:00:00.000Z',
      _tsLocal: 1793872800000
    },
    {
      id: 'lead-caio-01',
      nome: 'Prefeitura Municipal de Paulínia',
      telefone: '1938741000',
      vendedorId: 'caio',
      vendedorNome: 'Caio',
      estagio: 'proposta',
      tipoCliente: 'licitacao',
      valorProposta: 45000,
      dataAtualizacao: '2026-11-05T10:00:00.000Z',
      _tsLocal: 1793872800000
    }
  ];
  mockStorage.setItem('isapel_crm_leads_v1', JSON.stringify(initialLeads));
  CRM.definirLeads(initialLeads, { forcarSubstituicao: true });
}

async function runAllChallengerTests() {
  console.log('--- 1. TESTES ADVERSARIAIS DE CARACTERES ESPECIAIS E INJEÇÕES ---');

  test('Lead com XSS, emojis, aspas e caracteres especiais no nome', () => {
    resetLeadsToBaseline();
    const maliciousName = '<script>alert("XSS")</script> José & Cia. "Super" Papéis \'Ltda\' 🚀🏢';
    const lead = CRM.cadastrarLeadRapido({
      nome: maliciousName,
      telefone: '19988776655',
      vendedorId: 'maciel',
      tipoCliente: 'licitacao'
    });

    assert.strictEqual(lead.nome, maliciousName);
    const stored = JSON.parse(mockStorage.getItem('isapel_crm_leads_v1'));
    const found = stored.find(l => l.id === lead.id);
    assert(found, 'Lead com caracteres especiais deve estar no storage');
    assert.strictEqual(found.nome, maliciousName);
    assert.strictEqual(found.tipoCliente, 'licitacao');
  });

  test('Lead com ID incomum (numérico, caracteres pontuados, uuid)', () => {
    resetLeadsToBaseline();
    const oddLead = {
      id: 999999, // ID numérico
      nome: 'Indústria Química Paulínia',
      telefone: '1938749999',
      vendedorId: 'caio',
      estagio: 'novo',
      tipoCliente: 'consumidor_final',
      valorProposta: 8000,
      dataAtualizacao: '2026-11-05T11:00:00.000Z'
    };

    CRM.mesclarLeadsNuvem([oddLead]);
    const stored = JSON.parse(mockStorage.getItem('isapel_crm_leads_v1'));
    const found = stored.find(l => String(l.id) === '999999');
    assert(found, 'Lead com ID numérico deve ser preservado e consultável por string id');
    assert.strictEqual(found.nome, 'Indústria Química Paulínia');
  });

  test('Lead com proposta zero (valorProposta: 0)', () => {
    resetLeadsToBaseline();
    const lead = CRM.cadastrarLeadRapido({
      nome: 'Padaria Modelo Campinas',
      telefone: '19971234567',
      vendedorId: 'maciel',
      valorProposta: 0
    });

    assert.strictEqual(lead.valorProposta, 0);

    // Simula sincronização remota onde o lead ainda tem proposta 0
    CRM.mesclarLeadsNuvem([{
      id: lead.id,
      nome: lead.nome,
      telefone: lead.telefone,
      vendedorId: 'maciel',
      valorProposta: 0,
      tipoCliente: 'consumidor_final',
      dataAtualizacao: new Date().toISOString()
    }]);

    const stored = JSON.parse(mockStorage.getItem('isapel_crm_leads_v1'));
    const found = stored.find(l => l.id === lead.id);
    assert.strictEqual(found.valorProposta, 0, 'Valor zero não pode virar null ou NaN');
  });

  test('Lead com valores extremos (999.999.999,99 e propostas altas)', () => {
    resetLeadsToBaseline();
    const extremeVal = 999999999.99;
    const lead = CRM.cadastrarLeadRapido({
      nome: 'Mega Corp Celulose Global',
      telefone: '11999998888',
      vendedorId: 'fernanda',
      valorProposta: extremeVal
    });

    assert.strictEqual(lead.valorProposta, extremeVal);
    const stored = JSON.parse(mockStorage.getItem('isapel_crm_leads_v1'));
    const found = stored.find(l => l.id === lead.id);
    assert.strictEqual(found.valorProposta, extremeVal);
  });

  console.log('\n--- 2. TESTES DE FILTRO DE VENDEDORES E IMUNIDADE A PERDA DE DADOS NO RELOAD ---');

  test('Filtro por Maciel seguido de cloud sync não descarta leads de Fernanda e Caio', () => {
    resetLeadsToBaseline();
    const initialStored = JSON.parse(mockStorage.getItem('isapel_crm_leads_v1'));
    assert.strictEqual(initialStored.length, 3);

    // Simula resposta do Supabase quando o filtro está em "maciel"
    // O Supabase retorna apenas os leads do Maciel
    const retornoRemotoMacielApenas = [
      {
        id: 'lead-maciel-01',
        nome: 'Hospital Samaritano Campinas',
        telefone: '19987654321',
        vendedorId: 'maciel',
        vendedorNome: 'Gabriel Maciel',
        estagio: 'novo',
        tipoCliente: 'consumidor_final',
        valorProposta: 15000,
        dataAtualizacao: '2026-11-05T10:00:00.000Z'
      }
    ];

    CRM.mesclarLeadsNuvem(retornoRemotoMacielApenas);

    const storedAposSync = JSON.parse(mockStorage.getItem('isapel_crm_leads_v1'));
    assert.strictEqual(storedAposSync.length, 3, 'O storage DEVE manter os 3 leads!');
    
    const fernandaLead = storedAposSync.find(l => l.vendedorId === 'fernanda');
    const caioLead = storedAposSync.find(l => l.vendedorId === 'caio');
    const macielLead = storedAposSync.find(l => l.vendedorId === 'maciel');

    assert(fernandaLead, 'Lead da Fernanda NÃO pode ter sido apagado pelo filtro do Maciel');
    assert(caioLead, 'Lead do Caio NÃO pode ter sido apagado pelo filtro do Maciel');
    assert(macielLead, 'Lead do Maciel deve estar presente');
  });

  test('Simulação de F5 (recarregamento de página) após múltiplos ciclos de filtro preserva carteira global', () => {
    resetLeadsToBaseline();

    // 1. Simula ciclo de polling filtrado para Fernanda
    CRM.mesclarLeadsNuvem([
      {
        id: 'lead-fernanda-01',
        nome: 'Distribuidora Papéis Sorocaba',
        telefone: '15981234567',
        vendedorId: 'fernanda',
        estagio: 'proposta',
        tipoCliente: 'distribuidor',
        valorProposta: 28000,
        dataAtualizacao: '2026-11-05T11:15:00.000Z'
      }
    ]);

    // 2. Simula ciclo de polling filtrado para Caio
    CRM.mesclarLeadsNuvem([
      {
        id: 'lead-caio-01',
        nome: 'Prefeitura Municipal de Paulínia',
        telefone: '1938741000',
        vendedorId: 'caio',
        estagio: 'negociacao',
        tipoCliente: 'licitacao',
        valorProposta: 50000,
        dataAtualizacao: '2026-11-05T11:16:00.000Z'
      }
    ]);

    // 3. Simula Reload de Página (lê do localStorage diretamente)
    const rawStorage = mockStorage.getItem('isapel_crm_leads_v1');
    assert(rawStorage, 'LocalStorage deve existir');
    const leadsRecarregados = JSON.parse(rawStorage);

    assert.strictEqual(leadsRecarregados.length, 3, 'A base recarregada deve conter exatamente 3 leads');
    assert(leadsRecarregados.some(l => l.vendedorId === 'maciel'), 'Maciel presente');
    assert(leadsRecarregados.some(l => l.vendedorId === 'fernanda'), 'Fernanda presente');
    assert(leadsRecarregados.some(l => l.vendedorId === 'caio'), 'Caio presente');
  });

  console.log('\n--- 3. TESTE DE CONCORRÊNCIA E RACE CONDITION (15s POLLING VS USER INTERACTION) ---');

  test('Edição de etiqueta (R1) feita durante atraso de polling remoto sobrevive sem regressão', () => {
    resetLeadsToBaseline();

    // Snapshot remoto tirado no tempo T0 (com tipoCliente vazio ou antigo)
    const snapshotRemotoAntigo = [
      {
        id: 'lead-maciel-01',
        nome: 'Hospital Samaritano Campinas',
        telefone: '19987654321',
        vendedorId: 'maciel',
        estagio: 'novo',
        tipoCliente: '', // remoto ainda sem etiqueta
        dataAtualizacao: '2026-11-05T10:00:00.000Z'
      }
    ];

    // No tempo T1, usuário altera etiqueta para "licitacao"
    const leadEditado = CRM.atualizarLead('lead-maciel-01', { tipoCliente: 'licitacao' });
    assert.strictEqual(leadEditado.tipoCliente, 'licitacao');

    // No tempo T2 (depois da edição), o polling antigo do T0 responde e chama mesclarLeadsNuvem
    CRM.mesclarLeadsNuvem(snapshotRemotoAntigo);

    const stored = JSON.parse(mockStorage.getItem('isapel_crm_leads_v1'));
    const leadFinal = stored.find(l => l.id === 'lead-maciel-01');
    assert.strictEqual(leadFinal.tipoCliente, 'licitacao', 'A etiqueta local "licitacao" NÃO pode ser resetada pelo polling atrasado!');
  });

  test('Movimentação de estágio Kanban (R2) feita durante polling atrasado sobrevive sem regressão', () => {
    resetLeadsToBaseline();

    // Snapshot remoto antigo com estágio "novo"
    const snapshotRemotoAntigo = [
      {
        id: 'lead-maciel-01',
        nome: 'Hospital Samaritano Campinas',
        telefone: '19987654321',
        vendedorId: 'maciel',
        estagio: 'novo',
        dataAtualizacao: '2026-11-05T10:00:00.000Z'
      }
    ];

    // Usuário arrasta card para "fechado"
    const leadMovido = CRM.moverEstagioLead('lead-maciel-01', 'fechado', 'Contrato assinado', 'Gabriel Maciel');
    assert.strictEqual(leadMovido.estagio, 'fechado');

    // Polling antigo responde com estágio "novo"
    CRM.mesclarLeadsNuvem(snapshotRemotoAntigo);

    const stored = JSON.parse(mockStorage.getItem('isapel_crm_leads_v1'));
    const leadFinal = stored.find(l => l.id === 'lead-maciel-01');
    assert.strictEqual(leadFinal.estagio, 'fechado', 'O estágio "fechado" DEVE prevalecer sobre o snapshot remoto obsoleto');
  });

  test('Novo cliente cadastrado (R3) enquanto a nuvem retorna lista sem ele NÃO é deletado', () => {
    resetLeadsToBaseline();

    // Novo cliente cadastrado no app
    const novoLead = CRM.cadastrarLeadRapido({
      nome: 'Clínica Odontológica Americana',
      telefone: '19987659999',
      vendedorId: 'maciel',
      tipoCliente: 'consumidor_final'
    });

    // Nuvem responde sem o novo lead
    CRM.mesclarLeadsNuvem([
      {
        id: 'lead-maciel-01',
        nome: 'Hospital Samaritano Campinas',
        telefone: '19987654321',
        vendedorId: 'maciel',
        estagio: 'qualificacao',
        dataAtualizacao: '2026-11-05T10:00:00.000Z'
      }
    ]);

    const stored = JSON.parse(mockStorage.getItem('isapel_crm_leads_v1'));
    const foundNovo = stored.find(l => l.id === novoLead.id);
    assert(foundNovo, 'Novo lead cadastrado localmente NÃO pode ser excluído pelo polling');
    assert.strictEqual(foundNovo.nome, 'Clínica Odontológica Americana');
  });

  console.log('\n--- 4. INTEGRIDADE DO BACKUP E COMANDOS REMOTOS SUPABASE ---');

  test('Backup verificado possui hash criptográfico idêntico e 73 registros intactos', () => {
    const backupPath = path.resolve(__dirname, '../data/supabase_backup_verified_2026-11-05.json');
    assert(fs.existsSync(backupPath), 'Arquivo de backup deve existir');
    const content = fs.readFileSync(backupPath, 'utf-8');
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    assert.strictEqual(hash, 'b5d54caab419833b6b8436c603f081d9db81df258d4f388a48dae26272932054');
    const parsed = JSON.parse(content);
    assert.strictEqual(parsed.rows.length, 73);
    assert.strictEqual(parsed.metadata.total_rows, 73);
  });

  await asyncTest('Chamada remota Supabase GET retorna HTTP 200 com coluna tipo_cliente', async () => {
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwamhwc2tqZXRwY2dsa3hkamFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODQyMjMsImV4cCI6MjEwMDM2MDIyM30.nxFBM69wjrEOsz5HkSr9iDLmE9TpJi-eE_Yqq3oAI3s";
    const base = "https://xpjhpskjetpcglkxdjag.supabase.co/rest/v1/crm_isapel_leads";
    const res = await fetch(base + "?select=id,nome,tipo_cliente&limit=1", {
      headers: { "apikey": key, "Authorization": "Bearer " + key }
    });
    assert.strictEqual(res.status, 200, 'Supabase GET deve responder 200 OK');
    const data = await res.json();
    assert(Array.isArray(data) && data.length > 0, 'Deve retornar registros');
    assert('tipo_cliente' in data[0], 'A coluna tipo_cliente deve estar presente no resultado');
  });

  await asyncTest('Chamada remota Supabase POST com tipo_cliente retorna HTTP 201 (com tx=rollback)', async () => {
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwamhwc2tqZXRwY2dsa3hkamFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODQyMjMsImV4cCI6MjEwMDM2MDIyM30.nxFBM69wjrEOsz5HkSr9iDLmE9TpJi-eE_Yqq3oAI3s";
    const base = "https://xpjhpskjetpcglkxdjag.supabase.co/rest/v1/crm_isapel_leads";
    const testId = 'test-rollback-' + Date.now();
    const res = await fetch(base, {
      method: 'POST',
      headers: {
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
        "Prefer": "return=representation, tx=rollback"
      },
      body: JSON.stringify({
        id: testId,
        nome: "Adversarial Probe Test",
        telefone: "19999998888",
        tipo_cliente: "licitacao",
        vendedor_id: "maciel",
        estagio: "novo"
      })
    });
    assert.strictEqual(res.status, 201, 'POST deve retornar 201 Created');
    const resData = await res.json();
    assert.strictEqual(resData[0].tipo_cliente, 'licitacao');
  });

  console.log('\n============================================================');
  console.log(`TOTAL DE TESTES EXECUTADOS: ${totalTests}`);
  console.log(`TESTES APROVADOS:          ${passedTests}`);
  console.log(`FALHAS:                    ${failures.length}`);
  console.log('============================================================\n');

  if (failures.length > 0) {
    console.error('❌ Falhas encontradas na suíte:');
    failures.forEach(f => console.error(` - ${f.name}: ${f.error.message}`));
    process.exit(1);
  } else {
    console.log('🎉 TODAS AS PROVAS ADVERSARIAIS DE BACKEND FORAM APROVADAS COM SUCESSO!');
  }
}

runAllChallengerTests().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
