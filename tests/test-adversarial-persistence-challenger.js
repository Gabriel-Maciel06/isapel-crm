/**
 * tests/test-adversarial-persistence-challenger.js
 * Empirical Adversarial Test Harness: Persistence & Synchronization Stress-Testing
 *
 * Runs all tests strictly sequentially to prevent mock pollution and race conditions.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

console.log('🔥 =================================================================');
console.log('🔥 INICIANDO SUÍTE ADVERSARIAL DE PERSISTÊNCIA & SINCRONIZAÇÃO (M1)');
console.log('🔥 =================================================================\n');

// Mock localStorage
class ResilientLocalStorage {
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
  dump() {
    return JSON.parse(JSON.stringify(this.store));
  }
  restore(dump) {
    this.store = JSON.parse(JSON.stringify(dump));
  }
}

const mockLocalStorage = new ResilientLocalStorage();
global.window = {
  localStorage: mockLocalStorage
};
global.localStorage = mockLocalStorage;

// Load backend and sync modules
const CRM = require('../js/crm-backend.js');
const Sync = require('../js/crm-sync.js');

let passCount = 0;
let failCount = 0;
const failureDetails = [];

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Mensagem: ${err.message}`);
    failureDetails.push({ name, error: err.message, stack: err.stack });
    failCount++;
  }
}

function resetToBaseline() {
  mockLocalStorage.clear();
  return CRM.restaurarDadosOriginais();
}

async function runAll() {
  // ============================================================================
  // SUÍTE 1: RAPID SEQUENTIAL CARD MOVEMENTS + STALE POLLING ATTACK
  // ============================================================================
  console.log('--- 1. Movimentação Rápida de Cards no Funil Kanban & Polling Concorrente ---');

  await test('Card movido rapidamente por 5 estágios consecutivos mantém o estágio final após polling com dados obsoletos', async () => {
    const leads = resetToBaseline();
    const testLead = leads.find(l => l.vendedorId === 'maciel');
    assert(testLead, 'Lead de teste para Maciel deve existir');
    const leadId = testLead.id;

    const sequence = ['qualificacao', 'proposta', 'negociacao', 'fechado'];
    sequence.forEach(stage => {
      CRM.moverEstagioLead(leadId, stage, `Avanço rápido para ${stage}`, 'Gabriel Maciel');
    });

    const leadLocal = CRM.obterLeadPorId(leadId);
    assert.strictEqual(leadLocal.estagio, 'fechado', 'Lead local deve estar no estágio "fechado"');
    assert(leadLocal.historico.length >= 4, 'Histórico deve registrar todas as transições');

    // Ataque Adversarial: Supabase retorna payload atrasado com o lead ainda em 'novo' e timestamp de 30s atrás
    const staleTimestamp = new Date(Date.now() - 30000).toISOString();
    const payloadObsoleto = [
      {
        id: leadId,
        nome: testLead.nome,
        telefone: testLead.telefone,
        estagio: 'novo',
        vendedorId: 'maciel',
        tipoCliente: testLead.tipoCliente || '',
        data_atualizacao: staleTimestamp
      }
    ];

    const mesclados = CRM.mesclarLeadsNuvem(payloadObsoleto);
    const leadPosPolling = mesclados.find(l => l.id === leadId);

    assert.strictEqual(leadPosPolling.estagio, 'fechado', 'Estágio DEVE permanecer "fechado" e NÃO regredir para "novo"');
    const stored = JSON.parse(mockLocalStorage.getItem('isapel_crm_leads_v1')).find(l => l.id === leadId);
    assert.strictEqual(stored.estagio, 'fechado', 'LocalStorage DEVE preservar o estágio "fechado"');
  });

  await test('Flipping rápido de estágios (A -> B -> A -> B) preserva a última escolha determinística contra resposta desatualizada da nuvem', async () => {
    const leads = resetToBaseline();
    const lead = leads[0];
    const leadId = lead.id;

    CRM.moverEstagioLead(leadId, 'proposta');
    CRM.moverEstagioLead(leadId, 'negociacao');
    CRM.moverEstagioLead(leadId, 'proposta');
    CRM.moverEstagioLead(leadId, 'fechado');

    assert.strictEqual(CRM.obterLeadPorId(leadId).estagio, 'fechado');

    const staleResponse = [
      {
        id: leadId,
        nome: lead.nome,
        telefone: lead.telefone,
        estagio: 'negociacao',
        data_atualizacao: new Date(Date.now() - 5000).toISOString()
      }
    ];

    CRM.mesclarLeadsNuvem(staleResponse);
    assert.strictEqual(CRM.obterLeadPorId(leadId).estagio, 'fechado', 'Estágio deve se manter "fechado"');
  });

  // ============================================================================
  // SUÍTE 2: TAG TOGGLING (LICITAÇÃO <-> CONSUMIDOR_FINAL) & OVERWRITE DEFENSE
  // ============================================================================
  console.log('\n--- 2. Alternância de Etiquetas (Licitação vs Consumidor Final) & Proteção Contra Sobregravação ---');

  await test('Transição de "consumidor_final" para "licitacao" sobrevive a poll com "consumidor_final"', async () => {
    resetToBaseline();
    const lead = CRM.listarLeads()[0];
    const leadId = lead.id;

    CRM.atualizarLead(leadId, { tipoCliente: 'consumidor_final' });
    assert.strictEqual(CRM.obterLeadPorId(leadId).tipoCliente, 'consumidor_final');

    CRM.atualizarLead(leadId, { tipoCliente: 'licitacao' });
    assert.strictEqual(CRM.obterLeadPorId(leadId).tipoCliente, 'licitacao');

    const stalePoll = [
      {
        id: leadId,
        nome: lead.nome,
        tipo_cliente: 'consumidor_final',
        tipoCliente: 'consumidor_final',
        data_atualizacao: new Date(Date.now() - 10000).toISOString()
      }
    ];

    CRM.mesclarLeadsNuvem(stalePoll);
    const leadFinal = CRM.obterLeadPorId(leadId);
    assert.strictEqual(leadFinal.tipoCliente, 'licitacao', 'tipoCliente DEVE permanecer "licitacao"');
  });

  await test('Transição de "licitacao" para "consumidor_final" sobrevive a poll com "licitacao"', async () => {
    resetToBaseline();
    const lead = CRM.listarLeads()[1];
    const leadId = lead.id;

    CRM.atualizarLead(leadId, { tipoCliente: 'licitacao' });
    assert.strictEqual(CRM.obterLeadPorId(leadId).tipoCliente, 'licitacao');

    CRM.atualizarLead(leadId, { tipoCliente: 'consumidor_final' });
    assert.strictEqual(CRM.obterLeadPorId(leadId).tipoCliente, 'consumidor_final');

    const stalePoll = [
      {
        id: leadId,
        nome: lead.nome,
        tipo_cliente: 'licitacao',
        tipoCliente: 'licitacao',
        data_atualizacao: new Date(Date.now() - 8000).toISOString()
      }
    ];

    CRM.mesclarLeadsNuvem(stalePoll);
    const leadFinal = CRM.obterLeadPorId(leadId);
    assert.strictEqual(leadFinal.tipoCliente, 'consumidor_final', 'tipoCliente DEVE permanecer "consumidor_final"');
  });

  await test('Retorno da nuvem com tipo_cliente vazio ou nulo NUNCA apaga a etiqueta local', async () => {
    resetToBaseline();
    const lead = CRM.listarLeads()[2];
    const leadId = lead.id;

    CRM.atualizarLead(leadId, { tipoCliente: 'licitacao' });

    const nullPoll = [
      {
        id: leadId,
        nome: lead.nome,
        tipo_cliente: '',
        tipoCliente: '',
        data_atualizacao: new Date(Date.now() - 1000).toISOString()
      }
    ];

    CRM.mesclarLeadsNuvem(nullPoll);
    assert.strictEqual(CRM.obterLeadPorId(leadId).tipoCliente, 'licitacao', 'Etiqueta local "licitacao" não deve ser limpa');
  });

  await test('Toggling em alta frequência (12 alternâncias) mantém o último valor fixado sem corromper storage', async () => {
    resetToBaseline();
    const lead = CRM.listarLeads()[3];
    const leadId = lead.id;

    const tags = ['licitacao', 'consumidor_final', 'distribuidor', 'outro'];
    for (let i = 0; i < 12; i++) {
      const chosenTag = tags[i % tags.length];
      CRM.atualizarLead(leadId, { tipoCliente: chosenTag });
    }

    assert.strictEqual(CRM.obterLeadPorId(leadId).tipoCliente, 'outro');

    const stored = JSON.parse(mockLocalStorage.getItem('isapel_crm_leads_v1')).find(l => l.id === leadId);
    assert.strictEqual(stored.tipoCliente, 'outro');
  });

  // ============================================================================
  // SUÍTE 3: HIGH-CONCURRENCY LEAD CREATION & RELOAD / POLLING RESILIENCE
  // ============================================================================
  console.log('\n--- 3. Rajada de Novos Cadastros, Concorrência e Imunidade ao Auto-Polling ---');

  await test('Criação em rajada de 60 novos leads gera IDs únicos, persiste no storage e sobrevive a recarga', async () => {
    resetToBaseline();
    const initialCount = CRM.listarLeads().length;
    const createdIds = new Set();
    const burstCount = 60;

    for (let i = 1; i <= burstCount; i++) {
      const lead = CRM.cadastrarLeadRapido({
        nome: `Cliente Rajada ${i} - Hospital & Clínicas`,
        telefone: `(11) 98765-${String(1000 + i).padStart(4, '0')}`,
        vendedorId: i % 2 === 0 ? 'maciel' : 'fernanda',
        tipoCliente: i % 3 === 0 ? 'licitacao' : 'consumidor_final',
        valorProposta: 1500 + i * 10
      });
      assert(lead.id, 'Novo lead deve ter ID');
      assert(!createdIds.has(lead.id), 'ID do novo lead DEVE ser estritamente único');
      createdIds.add(lead.id);
    }

    assert.strictEqual(createdIds.size, burstCount, 'Todos os 60 IDs gerados devem ser únicos');
    assert.strictEqual(CRM.listarLeads().length, initialCount + burstCount);

    const rawStorage = mockLocalStorage.getItem('isapel_crm_leads_v1');
    const parsedStorage = JSON.parse(rawStorage);
    assert.strictEqual(parsedStorage.length, initialCount + burstCount, 'Storage deve conter todos os novos leads');

    const reloadedLeads = CRM.listarLeads();
    assert.strictEqual(reloadedLeads.length, initialCount + burstCount);
  });

  await test('Auto-polling da nuvem (sem conter os novos leads) NÃO remove os novos leads locais', async () => {
    const currentLeads = CRM.listarLeads();
    const initialLeadsBaseline = currentLeads.filter(l => !l.id.startsWith('lead-'));

    const remotePayloadWithoutNewLeads = initialLeadsBaseline.map(l => ({
      id: l.id,
      nome: l.nome,
      telefone: l.telefone,
      estagio: l.estagio,
      data_atualizacao: new Date(Date.now() - 60000).toISOString()
    }));

    const mesclados = CRM.mesclarLeadsNuvem(remotePayloadWithoutNewLeads);
    assert.strictEqual(mesclados.length, currentLeads.length, 'Contagem total de leads deve ser preservada');

    for (let c = 1; c <= 5; c++) {
      const posCiclo = CRM.mesclarLeadsNuvem(remotePayloadWithoutNewLeads);
      assert.strictEqual(posCiclo.length, currentLeads.length, `Ciclo ${c} de polling não deve apagar leads`);
    }
  });

  // ============================================================================
  // SUÍTE 4: NETWORK SIMULATION (OFFLINE DROPS, QUEUING & RECONNECTION)
  // ============================================================================
  console.log('\n--- 4. Simulação de Particionamento de Rede (Offline -> Mutações -> Reconexão) ---');

  await test('Operação estritamente offline: mutações locais persistem e se fundem pacificamente após retorno da rede', async () => {
    resetToBaseline();
    const leads = CRM.listarLeads();
    const leadA = leads[0];
    const leadB = leads[1];

    const originalFetch = global.fetch;
    let networkDropped = true;

    global.fetch = async (url, opts) => {
      if (networkDropped) {
        throw new Error('TypeError: Failed to fetch (Network unreachable)');
      }
      return {
        ok: true,
        status: 200,
        json: async () => []
      };
    };

    try {
      // 1. Mutações realizadas durante o blackout de rede
      CRM.moverEstagioLead(leadA.id, 'fechado', 'Venda realizada offline', 'Gabriel Maciel');
      CRM.atualizarLead(leadB.id, { tipoCliente: 'licitacao' });
      const novoOffline = CRM.cadastrarLeadRapido({
        nome: 'Prefeitura de Campinas - Licitação Emergencial',
        telefone: '(19) 3232-9000',
        vendedorId: 'maciel',
        tipoCliente: 'licitacao',
        valorProposta: 45000
      });

      // Tentativa de salvar na nuvem enquanto offline deve falhar graciosamente
      const statusSave = await Sync.salvarLeadNuvem(CRM.obterLeadPorId(leadA.id));
      assert.strictEqual(statusSave, false, 'salvarLeadNuvem deve retornar false em erro de rede');

      // 2. Polling durante a queda de rede deve falhar graciosamente sem resetar estado
      const pollResult = await Sync.carregarLeadsNuvem('todos');
      assert.strictEqual(pollResult, null, 'carregarLeadsNuvem deve retornar null em falha de rede');

      // Verifica que o estado local NÃO foi corrompido
      assert.strictEqual(CRM.obterLeadPorId(leadA.id).estagio, 'fechado');
      assert.strictEqual(CRM.obterLeadPorId(leadB.id).tipoCliente, 'licitacao');
      assert(CRM.obterLeadPorId(novoOffline.id), 'Novo lead offline deve estar presente');

      // 3. Simula reinício de página / fechamento de aba durante o modo offline
      const dumpStorage = mockLocalStorage.dump();
      const freshStorage = new ResilientLocalStorage();
      freshStorage.restore(dumpStorage);
      global.window.localStorage = freshStorage;
      global.localStorage = freshStorage;

      // 4. Reconexão da rede!
      networkDropped = false;

      // A nuvem responde com dados antigos para os leads (pois ainda não recebeu as alterações)
      const remoteReconnectedSnapshot = [
        {
          id: leadA.id,
          nome: leadA.nome,
          estagio: 'novo', // Estágio antigo na nuvem
          data_atualizacao: new Date(Date.now() - 3600000).toISOString() // 1 hora atrás
        },
        {
          id: leadB.id,
          nome: leadB.nome,
          tipo_cliente: 'consumidor_final', // Tipo antigo na nuvem
          data_atualizacao: new Date(Date.now() - 3600000).toISOString()
        }
      ];

      // Reconciliação não-destrutiva após reconexão
      const mesclados = CRM.mesclarLeadsNuvem(remoteReconnectedSnapshot);

      const leadAReconciliado = mesclados.find(l => l.id === leadA.id);
      const leadBReconciliado = mesclados.find(l => l.id === leadB.id);
      const leadNovoReconciliado = mesclados.find(l => l.id === novoOffline.id);

      assert.strictEqual(leadAReconciliado.estagio, 'fechado', 'Estágio do Lead A DEVE se manter "fechado"');
      assert.strictEqual(leadBReconciliado.tipoCliente, 'licitacao', 'Tipo do Lead B DEVE se manter "licitacao"');
      assert(leadNovoReconciliado, 'Lead criado offline DEVE ser mantido no CRM');
    } finally {
      global.fetch = originalFetch;
      global.window.localStorage = mockLocalStorage;
      global.localStorage = mockLocalStorage;
    }
  });

  // ============================================================================
  // SUÍTE 5: FUZZING, MALFORMED PAYLOADS & EDGE CASES
  // ============================================================================
  console.log('\n--- 5. Fuzzing, Entradas Malformadas & Casos de Borda ---');

  await test('mesclarLeadsNuvem lida com inputs não-array (null, undefined, objetos vazios, strings, números)', async () => {
    resetToBaseline();
    const baselineCount = CRM.listarLeads().length;

    assert.strictEqual(CRM.mesclarLeadsNuvem(null).length, baselineCount);
    assert.strictEqual(CRM.mesclarLeadsNuvem(undefined).length, baselineCount);
    assert.strictEqual(CRM.mesclarLeadsNuvem({}).length, baselineCount);
    assert.strictEqual(CRM.mesclarLeadsNuvem('invalid payload').length, baselineCount);
    assert.strictEqual(CRM.mesclarLeadsNuvem(12345).length, baselineCount);
  });

  await test('mesclarLeadsNuvem com array vazio [] NÃO limpa a base local', async () => {
    resetToBaseline();
    const baselineCount = CRM.listarLeads().length;
    const mesclados = CRM.mesclarLeadsNuvem([]);
    assert.strictEqual(mesclados.length, baselineCount, 'Array vazio não pode esvaziar a base de leads');
  });

  await test('mesclarLeadsNuvem lida com elementos nulos, indefinidos ou sem ID no array remoto', async () => {
    resetToBaseline();
    const baselineCount = CRM.listarLeads().length;

    const malformedArray = [
      null,
      undefined,
      {},
      { id: null },
      { id: '' },
      { nome: 'Sem ID' }
    ];

    const mesclados = CRM.mesclarLeadsNuvem(malformedArray);
    assert.strictEqual(mesclados.length, baselineCount, 'Elementos inválidos devem ser ignorados sem lançar exceção');
  });

  await test('Resiliência a timestamps remotos corrompidos ou no formato inválido', async () => {
    resetToBaseline();
    const lead = CRM.listarLeads()[0];
    const leadId = lead.id;

    CRM.moverEstagioLead(leadId, 'proposta');

    const corruptTimestamps = ['invalid-date', '', 'NaN', 9999999999999999, null, undefined];
    corruptTimestamps.forEach(ts => {
      const payload = [
        {
          id: leadId,
          nome: lead.nome,
          estagio: 'novo',
          data_atualizacao: ts
        }
      ];
      const mesclados = CRM.mesclarLeadsNuvem(payload);
      const atual = mesclados.find(l => l.id === leadId);
      assert.strictEqual(atual.estagio, 'proposta', `Estágio deve permanecer "proposta" mesmo com timestamp ${ts}`);
    });
  });

  await test('IDs numéricos vs IDs em string são harmonizados sem duplicar registros', async () => {
    resetToBaseline();
    const numericId = 99901;

    CRM.cadastrarLeadRapido({
      id: String(numericId),
      nome: 'Empresa Teste Numérico',
      telefone: '(11) 91111-2222',
      vendedorId: 'maciel'
    });

    const payloadComNumero = [
      {
        id: numericId,
        nome: 'Empresa Teste Numérico Atualizada',
        data_atualizacao: new Date().toISOString()
      }
    ];

    const mesclados = CRM.mesclarLeadsNuvem(payloadComNumero);
    const matches = mesclados.filter(l => String(l.id) === String(numericId));
    assert.strictEqual(matches.length, 1, 'Não deve criar registros duplicados ao harmonizar tipo de ID');
  });

  // ============================================================================
  // SUÍTE 6: LIVE SUPABASE API & BACKUP INTEGRITY (R4)
  // ============================================================================
  console.log('\n--- 6. Verificação de Saúde do Supabase & Integridade de Backup (R4) ---');

  await test('Verificação da integridade do arquivo de backup verificado (73 registros)', async () => {
    const backupPath = path.resolve(__dirname, '../data/supabase_backup_verified_2026-11-05.json');
    assert(fs.existsSync(backupPath), 'Arquivo de backup deve existir');

    const content = fs.readFileSync(backupPath, 'utf8');
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    const expectedHash = 'b5d54caab419833b6b8436c603f081d9db81df258d4f388a48dae26272932054';

    assert.strictEqual(hash, expectedHash, 'SHA256 do backup deve corresponder com precisão absoluta');

    const parsed = JSON.parse(content);
    assert.strictEqual(parsed.rows.length, 73, 'Backup deve conter exatamente 73 registros');
    assert.strictEqual(parsed.metadata.total_rows, 73, 'Metadata deve conter total_rows = 73');
  });

  await test('Supabase REST API responde 200 OK com coluna tipo_cliente na tabela crm_isapel_leads', async () => {
    const url = `${Sync.config.url}/rest/v1/${Sync.config.tableName}?select=id,nome,tipo_cliente&limit=5`;
    const res = await fetch(url, {
      headers: {
        'apikey': Sync.config.anonKey,
        'Authorization': `Bearer ${Sync.config.anonKey}`
      }
    });

    assert.strictEqual(res.status, 200, `Supabase deve responder HTTP 200, recebido ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data), 'Resposta deve ser um array');
    assert(data.length > 0, 'Deve retornar ao menos 1 registro');
    assert('tipo_cliente' in data[0], 'Objeto de lead remoto DEVE conter a coluna tipo_cliente');
  });

  await test('Supabase POST com tipo_cliente e Prefer tx=rollback confirma permissão de escrita e schema', async () => {
    const url = `${Sync.config.url}/rest/v1/${Sync.config.tableName}`;
    const testId = `challenger_probe_${Date.now()}`;
    const payload = {
      id: testId,
      nome: 'Challenger Probe Lead',
      telefone: '(11) 90000-0000',
      vendedor_id: 'maciel',
      vendedor_nome: 'Gabriel Maciel',
      tipo_cliente: 'licitacao',
      estagio: 'novo',
      data_atualizacao: new Date().toISOString()
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': Sync.config.anonKey,
        'Authorization': `Bearer ${Sync.config.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates, tx=rollback'
      },
      body: JSON.stringify(payload)
    });

    assert(
      res.status === 201 || res.status === 200,
      `POST com tx=rollback deve retornar HTTP 200 ou 201. Recebido: ${res.status}`
    );
  });

  // ============================================================================
  // RESULTADOS CONSOLIDADOS
  // ============================================================================
  console.log('\n=============================================================');
  console.log(`TOTAL DE TESTES EXECUTADOS: ${passCount + failCount}`);
  console.log(`TESTES APROVADOS:           ${passCount}`);
  console.log(`TESTES COM FALHA:           ${failCount}`);
  console.log('=============================================================');

  if (failCount > 0) {
    console.error('\n❌ DETALHES DAS FALHAS ENCONTRADAS:');
    failureDetails.forEach(f => {
      console.error(`- ${f.name}: ${f.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 TODOS OS TESTES ADVERSARIAIS DE PERSISTÊNCIA PASSARAM COM SUCESSO!');
    process.exit(0);
  }
}

runAll();
