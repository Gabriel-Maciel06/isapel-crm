/**
 * Test Suite para crm-backend.js
 * Execução com Node.js
 */

const assert = require('assert');
const path = require('path');
const CRM = require('../js/crm-backend.js');

console.log('🧪 Iniciando Testes Automatizados do Backend CRM Isapel Papéis...\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Erro: ${err.message}`);
    console.error(err.stack);
  }
}

// ----------------------------------------------------------------------------
// 1. TESTES DA TABELA DE DDDS DO BRASIL E RESOLUÇÃO LOGÍSTICA
// ----------------------------------------------------------------------------
console.log('--- 1. Tabela de DDDs do Brasil e Logística ---');

test('Tabela de DDDs contém os principais polos de SP, RJ, MG, PR, SC, RS, Centro-Oeste, Norte e Nordeste', () => {
  const ddds = Object.keys(CRM.TABELA_DDDS_BRASIL).map(Number);
  assert(ddds.includes(11), 'DDD 11 SP deve existir');
  assert(ddds.includes(12), 'DDD 12 Vale do Paraíba deve existir');
  assert(ddds.includes(19), 'DDD 19 Campinas deve existir');
  assert(ddds.includes(21), 'DDD 21 RJ deve existir');
  assert(ddds.includes(31), 'DDD 31 BH deve existir');
  assert(ddds.includes(41), 'DDD 41 Curitiba deve existir');
  assert(ddds.includes(71), 'DDD 71 Salvador deve existir');
  assert(ddds.length >= 60, `Deve cobrir os DDDs oficiais brasileiros (encontrados ${ddds.length})`);
});

test('São Paulo e RMC possuem Rota Direta CIF (Frota Própria Isapel - 24/72h)', () => {
  [11, 12, 13, 14, 15, 16, 17, 18, 19].forEach(ddd => {
    const info = CRM.resolverInformacoesDDD(ddd);
    assert.strictEqual(info.uf, 'SP');
    assert.strictEqual(info.frotaPropria, true);
    assert(info.logistica.includes('Frota Própria Isapel'));
  });
});

test('Extração de DDD de números em diversos formatos (celular, fixo, com e sem DDI)', () => {
  assert.strictEqual(CRM.extrairDDDDeTelefone('(19) 98845-1234'), 19);
  assert.strictEqual(CRM.extrairDDDDeTelefone('+55 11 97120-4567'), 11);
  assert.strictEqual(CRM.extrairDDDDeTelefone('1239000000'), 12);
  assert.strictEqual(CRM.extrairDDDDeTelefone('41 987776543'), 41);
  assert.strictEqual(CRM.extrairDDDDeTelefone('5535988221100'), 35);
  assert.strictEqual(CRM.extrairDDDDeTelefone('invalid'), null);
});

test('Formatação de telefone para o padrão brasileiro', () => {
  assert.strictEqual(CRM.formatarTelefone('19988451234'), '(19) 98845-1234');
  assert.strictEqual(CRM.formatarTelefone('1133334444'), '(11) 3333-4444');
});

// ----------------------------------------------------------------------------
// 2. MODELAGEM DOS VENDEDORES
// ----------------------------------------------------------------------------
console.log('\n--- 2. Vendedores Padrão ---');

test('Vendedores Maciel, Fernanda e Caio configurados com características solicitadas', () => {
  const vendedores = CRM.obterVendedores();
  assert.strictEqual(vendedores.length, 3);

  const maciel = CRM.obterVendedorPorId('maciel');
  assert(maciel, 'Maciel deve existir');
  assert.strictEqual(maciel.nome, 'Gabriel Maciel');
  assert.strictEqual(maciel.cargo, 'Vendedor Sênior B2B');
  assert.strictEqual(maciel.idade, 22);
  assert(maciel.perfil.includes('Cabelo enrolado e bigode'));
  assert.strictEqual(maciel.avatarColor, '#003360');

  const fernanda = CRM.obterVendedorPorId('fernanda');
  assert(fernanda, 'Fernanda deve existir');
  assert.strictEqual(fernanda.nome, 'Fernanda');
  assert.strictEqual(fernanda.cargo, 'Consultora Comercial');
  assert.strictEqual(fernanda.idade, 21);
  assert(fernanda.perfil.includes('Menina loira'));
  assert.strictEqual(fernanda.avatarColor, '#0284C7');

  const caio = CRM.obterVendedorPorId('caio');
  assert(caio, 'Caio deve existir');
  assert.strictEqual(caio.nome, 'Caio');
  assert.strictEqual(caio.cargo, 'SDR & Hunter B2B');
  assert.strictEqual(caio.idade, 19);
  assert(caio.perfil.includes('Jovem cabelo enrolado'));
  assert.strictEqual(caio.avatarColor, '#38BDF8');
});

// ----------------------------------------------------------------------------
// 3. FUNIL DE VENDAS COMPLETO (6 ETAPAS)
// ----------------------------------------------------------------------------
console.log('\n--- 3. Funil de Vendas de 6 Etapas ---');

test('Funil possui exatamente as 6 etapas estruturadas solicitadas', () => {
  const etapas = Object.keys(CRM.ETAPAS_FUNIL);
  assert.strictEqual(etapas.length, 6);
  assert.strictEqual(CRM.ETAPAS_FUNIL.novo.titulo, 'Novo Lead');
  assert.strictEqual(CRM.ETAPAS_FUNIL.qualificacao.titulo, 'Contato Feito / Qualificação');
  assert.strictEqual(CRM.ETAPAS_FUNIL.proposta.titulo, 'Cotação / Proposta Enviada');
  assert.strictEqual(CRM.ETAPAS_FUNIL.negociacao.titulo, 'Negociação / Amostra');
  assert.strictEqual(CRM.ETAPAS_FUNIL.fechado.titulo, 'Fechado / Ganho');
  assert.strictEqual(CRM.ETAPAS_FUNIL.perdido.titulo, 'Perdido / Standby');
});

// ----------------------------------------------------------------------------
// 4. OPERAÇÕES DE LEADS & CADASTRO RÁPIDO
// ----------------------------------------------------------------------------
console.log('\n--- 4. Operações de Leads & Cadastro Rápido ---');

test('Cadastro Rápido deriva DDD, Cidade, Região, Estado e Logística apenas com Nome e Telefone', () => {
  const leadCriado = CRM.cadastrarLeadRapido({
    nome: 'Indústria Têxtil Santa Bárbara',
    telefone: '(19) 97111-2233',
    vendedorId: 'caio'
  });

  assert(leadCriado.id, 'ID deve ser gerado');
  assert.strictEqual(leadCriado.ddd, 19);
  assert.strictEqual(leadCriado.uf, 'SP');
  assert(leadCriado.cidade.includes('Campinas'));
  assert.strictEqual(leadCriado.frotaPropria, true);
  assert(leadCriado.logistica.includes('Frota Própria Isapel'));
  assert.strictEqual(leadCriado.estagio, 'novo');
});

test('Atualização e movimentação de estágio com histórico registrado', () => {
  const lead = CRM.cadastrarLeadRapido({
    nome: 'Clinica Médica Vale Sul',
    telefone: '(12) 99888-7766',
    vendedorId: 'fernanda'
  });

  // Mover de novo -> qualificacao
  CRM.moverEstagioLead(lead.id, 'qualificacao', 'Contato telefônico realizado com setor de compras', 'Fernanda');
  
  const leadAtualizado = CRM.obterLeadPorId(lead.id);
  assert.strictEqual(leadAtualizado.estagio, 'qualificacao');
  assert(leadAtualizado.historico.length >= 2, 'Histórico deve registrar avanço');
  const ultimoHistorico = leadAtualizado.historico[leadAtualizado.historico.length - 1];
  assert.strictEqual(ultimoHistorico.tipo, 'mudanca_estagio');
  assert.strictEqual(ultimoHistorico.estagioPara, 'qualificacao');
});

test('Registro de contato com anotações e envio de amostras', () => {
  const lead = CRM.cadastrarLeadRapido({
    nome: 'Supermercado Nova Estrela',
    telefone: '(15) 99777-1234',
    vendedorId: 'maciel'
  });

  CRM.registrarContatoLead(lead.id, {
    tipo: 'amostra',
    canal: 'visita',
    descricao: 'Entrega de 2 fardos de amostra de Papel Toalha Interfolha 100% Celulose Virgem',
    amostraEnviada: true,
    amostraDetalhe: 'Fardos de teste entregues para validação da diretoria'
  });

  const leadAposAmostra = CRM.obterLeadPorId(lead.id);
  assert.strictEqual(leadAposAmostra.amostraEnviada, true);
  assert(leadAposAmostra.amostraDetalhe.includes('Fardos de teste'));
});

// ----------------------------------------------------------------------------
// 5. ARENA DE COMPETIÇÃO & MÉTRICAS
// ----------------------------------------------------------------------------
console.log('\n--- 5. Arena de Competição & Métricas ---');

test('Cálculo exato de métricas para os vendedores na Arena', () => {
  const metricas = CRM.calcularMetricasArena();
  assert(Array.isArray(metricas), 'Retorno deve ser um array');
  assert.strictEqual(metricas.length, 3, 'Deve conter métricas para os 3 vendedores');

  metricas.forEach(m => {
    assert(m.vendedorId, 'Vendedor ID obrigatório');
    assert(typeof m.totalCadastrados === 'number', 'totalCadastrados numérico');
    assert(typeof m.totalContatos === 'number', 'totalContatos numérico');
    assert(typeof m.totalFechados === 'number', 'totalFechados numérico');
    assert(typeof m.taxaConversao === 'number', 'taxaConversao numérico');
    assert(typeof m.pontuacaoGeral === 'number', 'pontuacaoGeral numérico');
    assert(m.leadsPorEstagio, 'leadsPorEstagio obrigatório');
    assert.strictEqual(Object.keys(m.leadsPorEstagio).length, 6, 'Deve contabilizar os 6 estágios');
  });

  // Confirmação da ordenação do ranking por pontuação
  assert(metricas[0].pontuacaoGeral >= metricas[1].pontuacaoGeral, '1º lugar tem mais ou igual pontos que o 2º');
  assert(metricas[1].pontuacaoGeral >= metricas[2].pontuacaoGeral, '2º lugar tem mais ou igual pontos que o 3º');
});

// ----------------------------------------------------------------------------
// 6. FECHAMENTO DIÁRIO & PLANO TÁTICO COMERCIAL (SEM CÁLCULO DE COMISSÃO)
// ----------------------------------------------------------------------------
console.log('\n--- 6. Fechamento Diário & Plano Tático Comercial ---');

test('Fechamento Diário gera resumo executivo e 3 níveis de prioridades táticas', () => {
  const fechamento = CRM.gerarFechamentoDiario();

  assert(fechamento.resumoOperacionalDia, 'Deve conter resumo operacional do dia');
  assert(fechamento.planoAcoesTaticasProximoDia, 'Deve conter plano de ações táticas');

  const plano = fechamento.planoAcoesTaticasProximoDia;
  assert(Array.isArray(plano.prioridadeAltaFechamentos), 'Deve conter Prioridade Alta');
  assert(Array.isArray(plano.prioridadeMediaFollowUp), 'Deve conter Prioridade Média');
  assert(Array.isArray(plano.prioridadeEstrategicaRotasLogistica), 'Deve conter Prioridade Estratégica');

  // Verifica se Prioridade Alta contém leads em negociação
  assert(plano.prioridadeAltaFechamentos.length > 0, 'Deve ter ações de prioridade alta para leads em negociação');
  plano.prioridadeAltaFechamentos.forEach(a => {
    assert(a.tag.includes('Prioridade Alta'));
    assert(a.acaoRecomendada.length > 0);
  });

  // Verifica se Prioridade Média contém leads em proposta
  assert(plano.prioridadeMediaFollowUp.length > 0, 'Deve ter ações de prioridade média para follow-up de propostas');

  // Verifica se Prioridade Estratégica agrupa leads por rotas da frota
  assert(plano.prioridadeEstrategicaRotasLogistica.length > 0, 'Deve ter rotas agrupadas estrategicamente');
  plano.prioridadeEstrategicaRotasLogistica.forEach(r => {
    assert(r.rotaLogistica, 'Nome da rota obrigatório');
    assert(Array.isArray(r.leadsAssociados), 'Leads associados à rota');
  });
});

test('Validação estrita: Fechamento NÃO possui cálculo de comissão ou bonificação financeira monetária', () => {
  const fechamento = CRM.gerarFechamentoDiario();
  const fechamentoJSON = JSON.stringify(fechamento);

  // Proíbe menção a comissão monetária ou cálculo de bonificação financeira
  assert(!fechamentoJSON.includes('"comissao"'), 'NÃO deve conter cálculo de comissão no JSON');
  assert(!fechamentoJSON.includes('"bonificacao"'), 'NÃO deve conter cálculo de bonificação monetária no JSON');
  assert(!fechamentoJSON.includes('"comissaoVendedor"'), 'NÃO deve calcular comissão de vendedor');

  const md = CRM.gerarMarkdownFechamento(fechamento);
  assert(!md.toLowerCase().includes('comissão'), 'Markdown NÃO deve calcular comissão');
  assert(!md.toLowerCase().includes('bonificação'), 'Markdown NÃO deve calcular bonificação monetária');
});

test('Geração e integridade do Markdown e CSV', () => {
  const fechamento = CRM.gerarFechamentoDiario();
  const md = CRM.gerarMarkdownFechamento(fechamento);
  assert(md.includes('ISAPEL PAPÉIS'), 'Markdown deve ter cabeçalho da Isapel');
  assert(md.includes('Resumo Operacional do Dia'), 'Markdown deve ter resumo');
  assert(md.includes('Prioridade Alta'), 'Markdown deve ter seção de prioridade alta');
  assert(md.includes('Prioridade Média'), 'Markdown deve ter seção de prioridade média');
  assert(md.includes('Prioridade Estratégica'), 'Markdown deve ter agrupamento de rotas');

  const csv = CRM.exportarLeadsCSV();
  assert(csv.includes('Nome da Empresa;Contato / Decisor;Telefone'), 'CSV deve ter delimitador ponto-e-vírgula');
  assert(csv.startsWith('\uFEFF'), 'CSV deve conter BOM UTF-8 para compatibilidade perfeita com Excel');
});

// ----------------------------------------------------------------------------
// RESUMO DOS TESTES
// ----------------------------------------------------------------------------
console.log('\n============================================================');
console.log(`TOTAL DE TESTES: ${totalTests}`);
console.log(`TESTES PASSADOS: ${passedTests}`);
console.log(`FALHAS: ${totalTests - passedTests}`);
console.log('============================================================\n');

if (totalTests === passedTests) {
  console.log('🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
  process.exit(0);
} else {
  console.error('❌ ALGUNS TESTES FALHARAM.');
  process.exit(1);
}
