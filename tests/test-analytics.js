/**
 * ============================================================================
 * ISAPEL PAPÉIS - SUÍTE DE TESTES UNITÁRIOS E INTEGRAÇÃO DO MOTOR ANALÍTICO
 * Arquivo: tests/test-analytics.js
 *
 * Validações:
 * 1. API pública e contrato de interface (window.IsapelAnalytics)
 * 2. Controle de acesso baseado em papéis (RBAC estrito para vendedores e diretoria)
 * 3. Robustez de formatos e campos temporais (ISO, BR, timestamp, múltiplos campos)
 * 4. Filtros por período ('hoje', '7dias', 'mes', 'custom', 'todos')
 * 5. Apuração exata de KPIs e taxas percentuais
 * 6. Estrutura e integridade do Funil de 6 etapas
 * 7. Distribuição de desempenho por vendedor
 * 8. Reatividade e gerenciamento de listeners
 * 9. Ausência estrita de termos proibidos (anti-comissão monetária)
 * ============================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Carrega o módulo Analytics
const analyticsPath = path.join(__dirname, '../js/crm-analytics.js');
const IsapelAnalytics = require(analyticsPath);

let totalTestes = 0;
let testesPassados = 0;

function test(descricao, fn) {
  totalTestes++;
  try {
    fn();
    testesPassados++;
    console.log(`  ✅ [PASS] ${descricao}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${descricao}`);
    console.error(`     Erro: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('🧪 Iniciando Testes Automatizados do Motor Analítico Isapel CRM...');

// ----------------------------------------------------------------------------
// 1. CONTRATO DE INTERFACE E EXPOSIÇÃO PÚBLICA
// ----------------------------------------------------------------------------
console.log('\n--- 1. Contrato de Interface & API Pública ---');

test('O módulo IsapelAnalytics exporta todos os métodos e utilitários obrigatórios', () => {
  assert.strictEqual(typeof IsapelAnalytics.filtrarLeads, 'function');
  assert.strictEqual(typeof IsapelAnalytics.calcularMetricas, 'function');
  assert.strictEqual(typeof IsapelAnalytics.obterMetricasCompletas, 'function');
  assert.strictEqual(typeof IsapelAnalytics.obterLeadsAtuais, 'function');
  assert.strictEqual(typeof IsapelAnalytics.parsearData, 'function');
  assert.strictEqual(typeof IsapelAnalytics.extrairDataDeLead, 'function');
  assert.strictEqual(typeof IsapelAnalytics.formatarDataIso, 'function');
  assert.strictEqual(typeof IsapelAnalytics.formatarDataBr, 'function');
  assert.strictEqual(typeof IsapelAnalytics.formatarMoeda, 'function');
  assert.strictEqual(typeof IsapelAnalytics.formatarPercentual, 'function');
  assert.strictEqual(typeof IsapelAnalytics.registrarListener, 'function');
  assert.strictEqual(typeof IsapelAnalytics.notificarAtualizacao, 'function');
  assert.strictEqual(typeof IsapelAnalytics.obterConfigVendedores, 'function');
  assert.strictEqual(typeof IsapelAnalytics.obterEtapasFunil, 'function');
});

test('Etapas do funil contêm as 6 etapas estruturadas na ordem correta', () => {
  const etapas = IsapelAnalytics.obterEtapasFunil();
  assert.strictEqual(etapas.length, 6);
  const ids = etapas.map(e => e.estagio);
  assert.deepStrictEqual(ids, ['novo', 'qualificacao', 'proposta', 'negociacao', 'fechado', 'perdido']);
});

test('Catálogo de vendedores possui Maciel, Fernanda e Caio configurados', () => {
  const vendedores = IsapelAnalytics.obterConfigVendedores();
  assert.ok(vendedores.maciel && vendedores.maciel.nome.includes('Gabriel Maciel'));
  assert.ok(vendedores.fernanda && vendedores.fernanda.nome === 'Fernanda');
  assert.ok(vendedores.caio && vendedores.caio.nome === 'Caio');
});

// ----------------------------------------------------------------------------
// 2. ISOLAMENTO DE DADOS E RBAC ESTRITO
// ----------------------------------------------------------------------------
console.log('\n--- 2. Controle de Acesso e Isolamento RBAC ---');

const mockLeadsRBAC = [
  { id: '1', nome: 'Empresa A', vendedorId: 'maciel', estagio: 'novo', valorProposta: 10000, dataCriacao: '2026-11-03T10:00:00Z' },
  { id: '2', nome: 'Empresa B', vendedorId: 'maciel', estagio: 'fechado', valorProposta: 25000, dataCriacao: '2026-11-03T11:00:00Z' },
  { id: '3', nome: 'Empresa C', vendedorId: 'fernanda', estagio: 'proposta', valorProposta: 15000, dataCriacao: '2026-11-03T12:00:00Z' },
  { id: '4', nome: 'Empresa D', vendedorId: 'caio', estagio: 'negociacao', valorProposta: 30000, dataCriacao: '2026-11-03T13:00:00Z' }
];

test('Vendedor "maciel" autenticado tem o filtro travado e acessa estritamente seus próprios leads', () => {
  const sessaoMaciel = { usuario: 'maciel', perfil: 'vendedor', vendedorId: 'maciel' };
  // Mesmo requisitando 'todos' ou outro vendedor, o sistema deve blindar e forçar 'maciel'
  const filtrados = IsapelAnalytics.filtrarLeads({
    leads: mockLeadsRBAC,
    periodo: 'todos',
    vendedorId: 'todos',
    sessao: sessaoMaciel
  });

  assert.strictEqual(filtrados.length, 2);
  filtrados.forEach(l => assert.strictEqual(l.vendedorId, 'maciel'));

  // Tentativa de spoofing passando vendedorId: 'fernanda'
  const spoofing = IsapelAnalytics.filtrarLeads({
    leads: mockLeadsRBAC,
    periodo: 'todos',
    vendedorId: 'fernanda',
    sessao: sessaoMaciel
  });
  assert.strictEqual(spoofing.length, 2);
  spoofing.forEach(l => assert.strictEqual(l.vendedorId, 'maciel'));
});

test('Vendedora "fernanda" autenticada acessa estritamente seus próprios leads', () => {
  const sessaoFernanda = { usuario: 'fernanda', perfil: 'vendedor', vendedorId: 'fernanda' };
  const filtrados = IsapelAnalytics.filtrarLeads({
    leads: mockLeadsRBAC,
    periodo: 'todos',
    vendedorId: 'todos',
    sessao: sessaoFernanda
  });
  assert.strictEqual(filtrados.length, 1);
  assert.strictEqual(filtrados[0].vendedorId, 'fernanda');
});

test('Vendedor "caio" autenticado acessa estritamente seus próprios leads', () => {
  const sessaoCaio = { usuario: 'caio', perfil: 'vendedor', vendedorId: 'caio' };
  const filtrados = IsapelAnalytics.filtrarLeads({
    leads: mockLeadsRBAC,
    periodo: 'todos',
    vendedorId: 'maciel',
    sessao: sessaoCaio
  });
  assert.strictEqual(filtrados.length, 1);
  assert.strictEqual(filtrados[0].vendedorId, 'caio');
});

test('Perfil "diretoria" com filtro "todos" tem visão consolidada irrestrita', () => {
  const sessaoDiretoria = { usuario: 'diretoria', perfil: 'diretoria', vendedorId: null };
  const filtrados = IsapelAnalytics.filtrarLeads({
    leads: mockLeadsRBAC,
    periodo: 'todos',
    vendedorId: 'todos',
    sessao: sessaoDiretoria
  });
  assert.strictEqual(filtrados.length, 4);

  const metricas = IsapelAnalytics.calcularMetricas(filtrados, sessaoDiretoria, { vendedorId: 'todos' });
  assert.strictEqual(metricas.ehVisaoGeral, true);
  assert.strictEqual(metricas.vendedorFiltro, 'todos');
});

test('Perfil "diretoria" filtrando vendedor individual acessa apenas o vendedor selecionado', () => {
  const sessaoDiretoria = { usuario: 'diretoria', perfil: 'diretoria', vendedorId: null };
  const filtrados = IsapelAnalytics.filtrarLeads({
    leads: mockLeadsRBAC,
    periodo: 'todos',
    vendedorId: 'caio',
    sessao: sessaoDiretoria
  });
  assert.strictEqual(filtrados.length, 1);
  assert.strictEqual(filtrados[0].vendedorId, 'caio');

  const metricas = IsapelAnalytics.calcularMetricas(filtrados, sessaoDiretoria, { vendedorId: 'caio' });
  assert.strictEqual(metricas.ehVisaoGeral, false);
  assert.strictEqual(metricas.vendedorFiltro, 'caio');
});

// ----------------------------------------------------------------------------
// 3. PARSING DE DATAS E TRATAMENTO DE CAMPOS HETEROGÊNEOS
// ----------------------------------------------------------------------------
console.log('\n--- 3. Tratamento Resiliente de Datas e Campos Heterogêneos ---');

test('Converte com precisão formatos ISO, timestamps e datas brasileiras', () => {
  // ISO completo
  const dIso = IsapelAnalytics.parsearData('2026-11-03T15:30:00.000Z');
  assert.ok(dIso instanceof Date && !isNaN(dIso.getTime()));

  // ISO simples
  const dIsoSimples = IsapelAnalytics.parsearData('2026-11-03');
  assert.strictEqual(dIsoSimples.getFullYear(), 2026);
  assert.strictEqual(dIsoSimples.getMonth(), 10); // Novembro é índice 10
  assert.strictEqual(dIsoSimples.getDate(), 3);

  // Formato brasileiro DD/MM/YYYY
  const dBr = IsapelAnalytics.parsearData('03/11/2026');
  assert.strictEqual(dBr.getFullYear(), 2026);
  assert.strictEqual(dBr.getMonth(), 10);
  assert.strictEqual(dBr.getDate(), 3);

  // Formato brasileiro com hora
  const dBrHora = IsapelAnalytics.parsearData('03/11/2026 14:45:00');
  assert.strictEqual(dBrHora.getHours(), 14);
  assert.strictEqual(dBrHora.getMinutes(), 45);

  // Timestamp numérico
  const ts = new Date(2026, 10, 3, 10, 0, 0).getTime();
  const dTs = IsapelAnalytics.parsearData(ts);
  assert.strictEqual(dTs.getFullYear(), 2026);

  // Nulo e inválido
  assert.strictEqual(IsapelAnalytics.parsearData(null), null);
  assert.strictEqual(IsapelAnalytics.parsearData(''), null);
  assert.strictEqual(IsapelAnalytics.parsearData('invalido-xyz'), null);
});

test('Extrai datas com suporte a múltiplos campos (dataCriacao, dataCadastro, data_cadastro, dataAtualizacao, data_atualizacao)', () => {
  const l1 = { dataCriacao: '2026-11-01T10:00:00Z' };
  const l2 = { dataCadastro: '2026-11-02T10:00:00Z' };
  const l3 = { data_cadastro: '2026-11-03T10:00:00Z' };
  const l4 = { dataAtualizacao: '2026-11-04T10:00:00Z' };
  const l5 = { data_atualizacao: '2026-11-05T10:00:00Z' };

  assert.ok(IsapelAnalytics.extrairDataDeLead(l1) instanceof Date);
  assert.ok(IsapelAnalytics.extrairDataDeLead(l2) instanceof Date);
  assert.ok(IsapelAnalytics.extrairDataDeLead(l3) instanceof Date);
  assert.ok(IsapelAnalytics.extrairDataDeLead(l4) instanceof Date);
  assert.ok(IsapelAnalytics.extrairDataDeLead(l5) instanceof Date);
});

// ----------------------------------------------------------------------------
// 4. FILTROS TEMPORAIS ('hoje', '7dias', 'mes', 'custom')
// ----------------------------------------------------------------------------
console.log('\n--- 4. Filtros Dinâmicos Temporais ---');

const dataRefTest = new Date('2026-11-03T12:00:00.000Z');

const leadsTemporais = [
  { id: 't1', nome: 'Lead Hoje', dataCriacao: '2026-11-03T10:00:00Z', estagio: 'novo', vendedorId: 'maciel' },
  { id: 't2', nome: 'Lead Ontem', dataCriacao: '2026-11-02T15:00:00Z', estagio: 'qualificacao', vendedorId: 'maciel' },
  { id: 't3', nome: 'Lead 5 dias atras', dataCriacao: '2026-10-29T10:00:00Z', estagio: 'proposta', vendedorId: 'maciel' },
  { id: 't4', nome: 'Lead 15 dias atras (mes passado)', dataCriacao: '2026-10-19T10:00:00Z', estagio: 'negociacao', vendedorId: 'maciel' },
  { id: 't5', nome: 'Lead Outro Mes', dataCriacao: '2026-09-15T10:00:00Z', estagio: 'fechado', vendedorId: 'maciel' }
];

test('Filtro "hoje" retorna apenas leads registrados no dia de referência', () => {
  const filtrados = IsapelAnalytics.filtrarLeads({
    leads: leadsTemporais,
    periodo: 'hoje',
    dataReferencia: dataRefTest
  });
  assert.strictEqual(filtrados.length, 1);
  assert.strictEqual(filtrados[0].id, 't1');
});

test('Filtro "7dias" inclui leads dentro do intervalo de 7 dias', () => {
  const filtrados = IsapelAnalytics.filtrarLeads({
    leads: leadsTemporais,
    periodo: '7dias',
    dataReferencia: dataRefTest
  });
  // t1 (0 dias), t2 (1 dia atrás), t3 (5 dias atrás: 29/10 a 03/11 = 6 dias)
  const ids = filtrados.map(l => l.id);
  assert.ok(ids.includes('t1'));
  assert.ok(ids.includes('t2'));
  assert.ok(ids.includes('t3'));
  assert.ok(!ids.includes('t4'));
  assert.ok(!ids.includes('t5'));
});

test('Filtro "mes" inclui leads do mês de referência (Novembro/2026)', () => {
  const filtrados = IsapelAnalytics.filtrarLeads({
    leads: leadsTemporais,
    periodo: 'mes',
    dataReferencia: dataRefTest
  });
  const ids = filtrados.map(l => l.id);
  assert.ok(ids.includes('t1'));
  assert.ok(ids.includes('t2'));
  assert.ok(!ids.includes('t3')); // 29/10 é Outubro
  assert.ok(!ids.includes('t4')); // 19/10 é Outubro
  assert.ok(!ids.includes('t5')); // 15/09 é Setembro
});

test('Filtro "custom" respeita intervalo explícito de dataInicio e dataFim', () => {
  const filtrados = IsapelAnalytics.filtrarLeads({
    leads: leadsTemporais,
    periodo: 'custom',
    dataInicio: '2026-10-15',
    dataFim: '2026-10-31'
  });
  const ids = filtrados.map(l => l.id);
  assert.ok(ids.includes('t3')); // 29/10
  assert.ok(ids.includes('t4')); // 19/10
  assert.ok(!ids.includes('t1')); // 03/11
  assert.ok(!ids.includes('t5')); // 15/09
});

// ----------------------------------------------------------------------------
// 5. APURAÇÃO DE KPIS, FUNIL DE 6 ETAPAS E MÉTRICAS
// ----------------------------------------------------------------------------
console.log('\n--- 5. Cálculo Consolidado de KPIs e Funil ---');

const leadsParaMetricas = [
  { id: '1', nome: 'Hospital São Luiz', estagio: 'novo', valorProposta: 0, regiao: 'Grande SP', vendedorId: 'maciel' },
  { id: '2', nome: 'Hotel Fasano', estagio: 'qualificacao', valorProposta: 15000, regiao: 'Grande SP', vendedorId: 'maciel' },
  { id: '3', nome: 'Frigorífico Minerva', estagio: 'proposta', valorProposta: 35000, regiao: 'RMC Campinas', vendedorId: 'fernanda' },
  { id: '4', nome: 'Logística Rodonaves', estagio: 'negociacao', valorProposta: 20000, regiao: 'Ribeirão Preto', vendedorId: 'caio' },
  { id: '5', nome: 'Universidade São Judas', estagio: 'fechado', valorProposta: 50000, regiao: 'Grande SP', vendedorId: 'maciel' },
  { id: '6', nome: 'Academia Bio Ritmo', estagio: 'perdido', valorProposta: 8000, regiao: 'Santos', vendedorId: 'fernanda' }
];

test('Cálculo exato de KPIs: total recebidos, qualificados, conversão e pipeline', () => {
  const sessao = { usuario: 'diretoria', perfil: 'diretoria', vendedorId: null };
  const resultado = IsapelAnalytics.calcularMetricas(leadsParaMetricas, sessao, { periodo: 'todos', vendedorId: 'todos' });

  assert.strictEqual(resultado.kpis.totalRecebidos, 6);
  // Qualificados: todos exceto 'novo' (5 leads)
  assert.strictEqual(resultado.kpis.totalQualificados, 5);
  // Taxa de qualificação: (5 / 6) * 100 = 83.3%
  assert.strictEqual(resultado.kpis.taxaQualificacaoPct, 83.3);

  // Fechados: 1 lead
  assert.strictEqual(resultado.kpis.totalFechados, 1);
  // Taxa de conversão: (1 / 6) * 100 = 16.7%
  assert.strictEqual(resultado.kpis.taxaConversaoPct, 16.7);

  // Pipeline ativo: soma exceto 'perdido' (15000 + 35000 + 20000 + 50000 = 120000)
  assert.strictEqual(resultado.kpis.valorPipelineTotal, 120000);
  assert.strictEqual(resultado.kpis.valorFechadoTotal, 50000);
  assert.strictEqual(resultado.kpis.valorEmNegociacao, 20000);

  // Ticket Médio: 120000 / 4 contas com valor = 30000
  assert.strictEqual(resultado.kpis.ticketMedio, 30000);

  // Regiões atendidas distintas: 'Grande SP', 'RMC Campinas', 'Ribeirão Preto', 'Santos' = 4
  assert.strictEqual(resultado.kpis.regioesAtendidasCount, 4);
});

test('Funil de 6 etapas possui percentuais e somas financeiras corretas', () => {
  const sessao = { usuario: 'diretoria', perfil: 'diretoria', vendedorId: null };
  const resultado = IsapelAnalytics.calcularMetricas(leadsParaMetricas, sessao, { periodo: 'todos' });

  assert.strictEqual(resultado.funil.length, 6);

  const novo = resultado.funil.find(e => e.estagio === 'novo');
  const qual = resultado.funil.find(e => e.estagio === 'qualificacao');
  const prop = resultado.funil.find(e => e.estagio === 'proposta');
  const nego = resultado.funil.find(e => e.estagio === 'negociacao');
  const fech = resultado.funil.find(e => e.estagio === 'fechado');
  const perd = resultado.funil.find(e => e.estagio === 'perdido');

  assert.strictEqual(novo.count, 1);
  assert.strictEqual(qual.count, 1);
  assert.strictEqual(prop.count, 1);
  assert.strictEqual(nego.count, 1);
  assert.strictEqual(fech.count, 1);
  assert.strictEqual(perd.count, 1);

  assert.strictEqual(fech.valorTotal, 50000);
  assert.strictEqual(prop.valorTotal, 35000);

  // Soma das contagens de etapas deve igualar totalRecebidos
  const somaCounts = resultado.funil.reduce((acc, e) => acc + e.count, 0);
  assert.strictEqual(somaCounts, 6);
});

test('Distribuição por vendedor calcula métricas individuais para a diretoria', () => {
  const sessao = { usuario: 'diretoria', perfil: 'diretoria', vendedorId: null };
  const resultado = IsapelAnalytics.calcularMetricas(leadsParaMetricas, sessao, { periodo: 'todos' });

  assert.ok(resultado.distribuicaoVendedores.length >= 3);

  const maciel = resultado.distribuicaoVendedores.find(v => v.vendedorId === 'maciel');
  const fernanda = resultado.distribuicaoVendedores.find(v => v.vendedorId === 'fernanda');
  const caio = resultado.distribuicaoVendedores.find(v => v.vendedorId === 'caio');

  assert.strictEqual(maciel.totalLeads, 3);
  assert.strictEqual(maciel.fechados, 1);
  assert.strictEqual(maciel.valorFechado, 50000);
  assert.strictEqual(maciel.valorPipeline, 65000); // 15000 + 50000

  assert.strictEqual(fernanda.totalLeads, 2);
  assert.strictEqual(caio.totalLeads, 1);
});

// ----------------------------------------------------------------------------
// 6. REATIVIDADE E LISTENERS
// ----------------------------------------------------------------------------
console.log('\n--- 6. Reatividade e Eventos de Sincronização ---');

test('Listeners de atualização podem ser registrados e notificados com sucesso', () => {
  let eventoRecebido = null;
  const remover = IsapelAnalytics.registrarListener((dados) => {
    eventoRecebido = dados;
  });

  IsapelAnalytics.notificarAtualizacao({ tipo: 'teste', total: 10 });
  assert.deepStrictEqual(eventoRecebido, { tipo: 'teste', total: 10 });

  // Teste de desinscrição
  eventoRecebido = null;
  remover();
  IsapelAnalytics.notificarAtualizacao({ tipo: 'teste2' });
  assert.strictEqual(eventoRecebido, null);
});

// ----------------------------------------------------------------------------
// 7. SEGURANÇA E INTEGRIDADE (RESTRIÇÃO DE TERMOS PROIBIDOS)
// ----------------------------------------------------------------------------
console.log('\n--- 7. Auditoria de Integridade e Termos Proibidos ---');

test('Código fonte de js/crm-analytics.js NÃO contém termos proibidos de comissão', () => {
  const codigo = fs.readFileSync(analyticsPath, 'utf8').toLowerCase();
  assert.ok(!codigo.includes('comissão em dinheiro'), 'Violação detectada: termo "comissão em dinheiro" encontrado no código');
  assert.ok(!codigo.includes('comissão monetária'), 'Violação detectada: termo "comissão monetária" encontrado no código');
});

test('Formatação de valores e relatórios não inclui menção a comissão monetária', () => {
  const formatoMoeda = IsapelAnalytics.formatarMoeda(1500);
  assert.ok(formatoMoeda.includes('1.500') || formatoMoeda.includes('R$'));
  assert.ok(!formatoMoeda.toLowerCase().includes('comissão'));
});

// ----------------------------------------------------------------------------
// RESULTADO FINAL
// ----------------------------------------------------------------------------
console.log('\n============================================================');
console.log(`TOTAL DE TESTES: ${totalTestes}`);
console.log(`TESTES PASSADOS: ${testesPassados}`);
console.log(`FALHAS: ${totalTestes - testesPassados}`);
console.log('============================================================\n');

if (testesPassados === totalTestes) {
  console.log('🎉 TODOS OS TESTES DO MOTOR ANALÍTICO PASSARAM COM 100% DE SUCESSO!\n');
} else {
  console.error('❌ HOUVE FALHAS NA SUÍTE DE TESTES!\n');
  process.exit(1);
}
