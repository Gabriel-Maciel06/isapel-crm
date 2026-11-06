/**
 * tests/test-persistence-simulation.js
 * Teste End-to-End e Simulação de Ciclo de Vida:
 * Validação rigorosa dos Requisitos R1, R2, R3 e R4 no Isapel CRM.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('🧪 Iniciando Simulação End-to-End de Persistência (R1, R2, R3, R4)...\n');

// Mock localStorage para simular o comportamento exato do navegador
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
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

const mockLocalStorage = new MockLocalStorage();
global.window = {
  localStorage: mockLocalStorage
};
global.localStorage = mockLocalStorage;

const CRM = require('../js/crm-backend.js');
const Sync = require('../js/crm-sync.js');

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Erro: ${err.message}`);
    console.error(err.stack);
  }
}

async function runAsyncTest(name, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Erro: ${err.message}`);
    console.error(err.stack);
  }
}

(async function () {
  console.log('--- 1. R1: Persistência de Alteração de Etiqueta (Licitação / Consumidor) ---');

  runTest('Alternar etiqueta para "licitacao" e persistir no localStorage', () => {
    // 1. Inicializa base
    CRM.restaurarDadosOriginais();
    const lead = CRM.obterLeadPorId('lead-maciel-02');
    assert(lead, 'Lead deve existir');

    // 2. Altera a etiqueta
    const atualizado = CRM.atualizarLead('lead-maciel-02', { tipoCliente: 'licitacao' });
    assert.strictEqual(atualizado.tipoCliente, 'licitacao');

    // 3. Verifica se foi gravado na chave unificada 'isapel_crm_leads_v1'
    const doStorage = JSON.parse(mockLocalStorage.getItem('isapel_crm_leads_v1'));
    const leadStorage = doStorage.find(l => l.id === 'lead-maciel-02');
    assert.strictEqual(leadStorage.tipoCliente, 'licitacao', 'Deve estar gravado no localStorage como licitacao');
  });

  runTest('Etiqueta persiste após simulação de 15s de Auto-Polling com dados da nuvem', () => {
    // Simula resposta da nuvem onde lead veio com tipo_cliente vazio (ou latência de sync)
    const mockNuvem = [
      {
        id: 'lead-maciel-02',
        nome: 'Condomínio Empresarial Alpha Tower Barueri',
        telefone: '(11) 97120-4567',
        tipo_cliente: '', // Nuvem vazia
        estagio: 'fechado',
        data_atualizacao: '2026-10-29T11:00:00.000Z'
      }
    ];

    // Polling invoca mesclarLeadsNuvem / definirLeads
    CRM.mesclarLeadsNuvem(mockNuvem);

    const posPolling = CRM.obterLeadPorId('lead-maciel-02');
    assert.strictEqual(posPolling.tipoCliente, 'licitacao', 'Auto-polling NÃO deve apagar a etiqueta local');

    const doStorage = JSON.parse(mockLocalStorage.getItem('isapel_crm_leads_v1'));
    const leadStorage = doStorage.find(l => l.id === 'lead-maciel-02');
    assert.strictEqual(leadStorage.tipoCliente, 'licitacao', 'LocalStorage deve preservar a etiqueta licitacao');
  });

  console.log('\n--- 2. R2: Persistência de Movimentação no Funil Kanban ---');

  runTest('Arrastar card para novo estágio (negociacao -> fechado) e persistir', () => {
    CRM.restaurarDadosOriginais();
    const leadAntes = CRM.obterLeadPorId('lead-maciel-01');
    assert.strictEqual(leadAntes.estagio, 'negociacao');

    // Mover estágio
    CRM.moverEstagioLead('lead-maciel-01', 'fechado', 'Venda fechada com sucesso via simulação');

    const leadDepois = CRM.obterLeadPorId('lead-maciel-01');
    assert.strictEqual(leadDepois.estagio, 'fechado');

    const doStorage = JSON.parse(mockLocalStorage.getItem('isapel_crm_leads_v1'));
    const leadStorage = doStorage.find(l => l.id === 'lead-maciel-01');
    assert.strictEqual(leadStorage.estagio, 'fechado', 'Estágio no storage deve ser fechado');
  });

  runTest('Estágio do card persiste após simulação de Auto-Polling da Nuvem', () => {
    // Simula resposta da nuvem com estágio antigo (latência de rede do Supabase)
    const mockNuvemAntiga = [
      {
        id: 'lead-maciel-01',
        nome: 'Hospital Metropolitano Campinas',
        telefone: '(19) 98845-1234',
        estagio: 'negociacao', // Estágio antigo
        data_atualizacao: '2026-10-25T08:30:00.000Z' // Timestamp antigo
      }
    ];

    CRM.definirLeads(mockNuvemAntiga);

    const posPolling = CRM.obterLeadPorId('lead-maciel-01');
    assert.strictEqual(posPolling.estagio, 'fechado', 'Card NÃO deve retornar para negociacao');
  });

  console.log('\n--- 3. R3: Cadastro e Persistência de Novos Clientes ---');

  let novoLeadCriadoId = null;

  runTest('Cadastrar novo lead e persistir imediatamente no storage', () => {
    const novoLead = CRM.cadastrarLeadRapido({
      nome: 'Hospital Samaritano de Campinas Teste E2E',
      telefone: '(19) 98765-4321',
      vendedorId: 'maciel',
      tipoCliente: 'licitacao'
    });

    novoLeadCriadoId = novoLead.id;
    assert(novoLeadCriadoId, 'ID do lead gerado');
    assert.strictEqual(novoLead.ddd, 19);
    assert.strictEqual(novoLead.tipoCliente, 'licitacao');

    const doStorage = JSON.parse(mockLocalStorage.getItem('isapel_crm_leads_v1'));
    const encontrado = doStorage.find(l => l.id === novoLeadCriadoId);
    assert(encontrado, 'Lead cadastrado deve estar presente no localStorage');
  });

  runTest('Novo lead NÃO é apagado quando a nuvem retorna lista sem ele', () => {
    // Nuvem ainda não possui o novo lead
    const leadsNuvem = [
      {
        id: 'lead-maciel-01',
        nome: 'Hospital Metropolitano Campinas',
        telefone: '(19) 98845-1234',
        estagio: 'fechado'
      }
    ];

    CRM.definirLeads(leadsNuvem);

    const leadAindaPresente = CRM.obterLeadPorId(novoLeadCriadoId);
    assert(leadAindaPresente, 'Novo lead local NÃO pode ser excluído pela hidratação da nuvem');
    assert.strictEqual(leadAindaPresente.tipoCliente, 'licitacao');
  });

  console.log('\n--- 4. Preservação de Dados de Outros Vendedores (Isolamento de Filtro) ---');

  runTest('Filtrar vendedor não esvazia carteira dos demais vendedores do storage', () => {
    // Simula consulta restrita ao vendedor Caio
    const leadsCaio = [
      {
        id: 'lead-caio-01',
        nome: 'Rede OdontoCare Clínicas Especializadas',
        telefone: '(19) 99654-7711',
        vendedor_id: 'caio',
        estagio: 'novo'
      }
    ];

    // Reconcilia apenas Caio
    CRM.mesclarLeadsNuvem(leadsCaio);

    // Garante que leads de Maciel e Fernanda continuam intactos no CRM
    const leadsTotais = CRM.listarLeads();
    const macielLeads = leadsTotais.filter(l => l.vendedorId === 'maciel');
    const fernandaLeads = leadsTotais.filter(l => l.vendedorId === 'fernanda');

    assert(macielLeads.length > 0, 'Leads de Maciel devem permanecer');
    assert(fernandaLeads.length > 0, 'Leads de Fernanda devem permanecer');
  });

  console.log('\n--- 5. R4: Integridade do Banco Remoto & Verificação Supabase HTTP 200 OK ---');

  await runAsyncTest('Verificar se tabela remota crm_isapel_leads responde 200 OK com coluna tipo_cliente', async () => {
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwamhwc2tqZXRwY2dsa3hkamFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODQyMjMsImV4cCI6MjEwMDM2MDIyM30.nxFBM69wjrEOsz5HkSr9iDLmE9TpJi-eE_Yqq3oAI3s";
    const res = await fetch("https://xpjhpskjetpcglkxdjag.supabase.co/rest/v1/crm_isapel_leads?select=id,nome,tipo_cliente&limit=3", {
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`
      }
    });

    assert.strictEqual(res.status, 200, 'Supabase deve retornar status 200 OK');
    const data = await res.json();
    assert(Array.isArray(data), 'Retorno deve ser um array');
    assert(data.length > 0, 'Deve retornar registros existentes');
    assert('tipo_cliente' in data[0], 'A coluna tipo_cliente DEVE estar presente no objeto');
  });

  await runAsyncTest('Verificar se POST com tipo_cliente é aceito com status 201 Created (com tx=rollback)', async () => {
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwamhwc2tqZXRwY2dsa3hkamFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODQyMjMsImV4cCI6MjEwMDM2MDIyM30.nxFBM69wjrEOsz5HkSr9iDLmE9TpJi-eE_Yqq3oAI3s";
    const res = await fetch("https://xpjhpskjetpcglkxdjag.supabase.co/rest/v1/crm_isapel_leads", {
      method: "POST",
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates, tx=rollback"
      },
      body: JSON.stringify({
        id: "probe-verification-test",
        nome: "Probe Verification Test",
        telefone: "(19) 98888-7777",
        tipo_cliente: "licitacao",
        estagio: "fechado"
      })
    });

    assert([200, 201].includes(res.status), `POST com tipo_cliente deve retornar 200 ou 201 (retornou ${res.status})`);
  });

  await runAsyncTest('Verificar integridade do arquivo de backup validado (73 registros)', async () => {
    const backupPath = path.resolve(__dirname, '../data/supabase_backup_verified_2026-11-05.json');
    assert(fs.existsSync(backupPath), 'Arquivo de backup deve existir em data/');
    const raw = fs.readFileSync(backupPath, 'utf-8');
    const backup = JSON.parse(raw);
    assert(backup.metadata, 'Metadata do backup deve existir');
    assert.strictEqual(backup.metadata.total_rows, 73, 'Metadata deve confirmar 73 registros');
    assert(Array.isArray(backup.rows), 'Rows deve ser um array');
    assert.strictEqual(backup.rows.length, 73, 'Backup deve conter exatamente 73 registros');
  });

  console.log('\n============================================================');
  console.log(`TOTAL DE TESTES: ${total}`);
  console.log(`TESTES PASSADOS: ${passed}`);
  console.log(`FALHAS: ${total - passed}`);
  console.log('============================================================\n');

  if (passed === total) {
    console.log('🎉 TODOS OS TESTES DE PERSISTÊNCIA PASSARAM COM 100% DE SUCESSO!\n');
    process.exit(0);
  } else {
    console.error('❌ HOUVE FALHAS NA VALIDAÇÃO DE PERSISTÊNCIA!\n');
    process.exit(1);
  }
})();
