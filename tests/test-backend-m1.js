/**
 * tests/test-backend-m1.js
 * Teste Unitário Abrangente do Milestone M1 - Backend & Data Layer
 * CRM Isapel Papéis v1.2.0
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('🧪 Iniciando Testes Automatizados do Milestone M1 (Backend & Data Layer)...\n');

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

const authPath = path.resolve(__dirname, '../js/crm-auth.js');
const syncPath = path.resolve(__dirname, '../js/crm-sync.js');
const backendPath = path.resolve(__dirname, '../js/crm-backend.js');

const IsapelAuth = require(authPath);
const IsapelSync = require(syncPath);
const IsapelCRM = require(backendPath);

// Link globals for runtime integration
global.window.IsapelAuth = IsapelAuth;
global.window.IsapelSync = IsapelSync;
global.window.IsapelCRM = IsapelCRM;

// ----------------------------------------------------------------------------
// 1. ISAPEL AUTH & RBAC GATING
// ----------------------------------------------------------------------------
console.log('--- 1. IsapelAuth & Dynamic Seller RBAC ---');

// 1.1 Credenciais dos fundadores preservadas
const macielLogin = IsapelAuth.login('maciel', 'maciel0602');
assert.strictEqual(macielLogin.ok, true, 'Maciel deve conseguir autenticar com senha padrão');
assert.strictEqual(macielLogin.sessao.perfil, 'vendedor');

const fernandaLogin = IsapelAuth.login('fernanda', 'Fernanda1234');
assert.strictEqual(fernandaLogin.ok, true, 'Fernanda deve conseguir autenticar com senha padrão');

const caioLogin = IsapelAuth.login('caio', 'Caio1234');
assert.strictEqual(caioLogin.ok, true, 'Caio deve conseguir autenticar com senha padrão');

const diretoriaLogin = IsapelAuth.login('diretoria', 'Diretoria123!');
assert.strictEqual(diretoriaLogin.ok, true, 'Diretoria deve conseguir autenticar com senha padrão');
assert.strictEqual(diretoriaLogin.sessao.perfil, 'diretoria');

console.log('  ✅ [PASS] Credenciais dos fundadores (Maciel, Fernanda, Caio, Diretoria) preservadas');

// 1.2 RBAC: Vendedor NÃO pode cadastrar novo vendedor
const tentativaVendedor = IsapelAuth.cadastrarVendedor({
  nome: 'Intruso Não Autorizado',
  login: 'intruso',
  senhaInicial: '123456'
}, macielLogin.sessao);
assert.strictEqual(tentativaVendedor.ok, false, 'Vendedor não pode cadastrar novo consultor');
assert.strictEqual(tentativaVendedor.erro, 'Acesso restrito à Diretoria Comercial.');

console.log('  ✅ [PASS] RBAC estrito: Vendedor bloqueado de cadastrar novos consultores');

// 1.3 Validação de campos obrigatórios
const dadosInvalidos = [
  { dados: { nome: '', login: 'valido', senhaInicial: '123456' }, erroEsperado: 'Nome completo' },
  { dados: { nome: 'Mariana Souza', login: 'a', senhaInicial: '123456' }, erroEsperado: 'Identificador' },
  { dados: { nome: 'Mariana Souza', login: 'mariana_valida', senhaInicial: '123' }, erroEsperado: 'Senha inicial' }
];

dadosInvalidos.forEach(teste => {
  const res = IsapelAuth.cadastrarVendedor(teste.dados, diretoriaLogin.sessao);
  assert.strictEqual(res.ok, false);
  assert(res.erro.includes(teste.erroEsperado), `Erro esperado para ${teste.erroEsperado}`);
});
console.log('  ✅ [PASS] Validação de campos obrigatórios (nome min 3, login min 3, senha min 6)');

// 1.4 Diretoria cadastra vendedor com sucesso
const novoVendedor = {
  nome: 'Mariana Vasconcelos',
  login: 'mariana',
  senhaInicial: 'mariana2026',
  cargo: 'Consultora Comercial B2B Pleno',
  metaMensalReais: 55000,
  metaMensalFardos: 2200,
  avatarCor: '#0284C7'
};

const resCadastro = IsapelAuth.cadastrarVendedor(novoVendedor, diretoriaLogin.sessao);
assert.strictEqual(resCadastro.ok, true, 'Cadastro deve ter sucesso pela diretoria');
assert.strictEqual(resCadastro.vendedor.login, 'mariana');
assert.strictEqual(resCadastro.vendedor.avatarIniciais, 'MV');
assert.strictEqual(resCadastro.vendedor.metaMensalReais, 55000);
assert.strictEqual(resCadastro.vendedor.metaMensalFardos, 2200);

// Verifica evento disparado
const eventoCadastrado = eventLog.find(e => e.type === 'isapel:vendedor-cadastrado');
assert(eventoCadastrado, 'Evento isapel:vendedor-cadastrado deve ter sido disparado');
assert.strictEqual(eventoCadastrado.detail.login, 'mariana');

console.log('  ✅ [PASS] Diretoria cadastra vendedor com sucesso e evento DOM disparado');

// 1.5 Novo vendedor pode autenticar imediatamente
const loginMariana = IsapelAuth.login('mariana', 'mariana2026');
assert.strictEqual(loginMariana.ok, true, 'Novo vendedor deve logar com sua senha inicial');
assert.strictEqual(loginMariana.sessao.usuario, 'mariana');
assert.strictEqual(loginMariana.sessao.vendedorId, 'mariana');
assert.strictEqual(loginMariana.sessao.perfil, 'vendedor');

// Sessão ativa preservada
const sessaoAtiva = IsapelAuth.obterSessao();
assert.strictEqual(sessaoAtiva.usuario, 'mariana');
assert.strictEqual(IsapelAuth.estaAutenticado(), true);

// 1.6 obterVendedores retorna fundadores + dinâmicos
const todosVendedores = IsapelAuth.obterVendedores();
assert(todosVendedores.length >= 4, 'Deve conter pelo menos 4 vendedores');
assert(todosVendedores.some(v => v.login === 'maciel'));
assert(todosVendedores.some(v => v.login === 'mariana' && v.avatarIniciais === 'MV'));

console.log('  ✅ [PASS] Login imediato do novo vendedor e hidratação em obterVendedores()');

// ----------------------------------------------------------------------------
// 2. ISAPEL SYNC (PERSISTÊNCIA SUPABASE & FALLBACK)
// ----------------------------------------------------------------------------
console.log('\n--- 2. IsapelSync: Persistência de Vendedores e Avatares 3D ---');

(async () => {
  // 2.1 Salvar vendedor no Supabase
  mockFetchCalls.length = 0;
  const syncSaveRes = await IsapelSync.salvarVendedor(novoVendedor);
  assert.strictEqual(syncSaveRes.ok, true);
  assert(mockFetchCalls.length > 0, 'Fetch deve ter sido chamado para salvar vendedor');
  assert(mockFetchCalls[0].url.includes('crm_isapel_vendedores'));
  const bodyVendedor = JSON.parse(mockFetchCalls[0].options.body);
  assert.strictEqual(bodyVendedor.login, 'mariana');
  assert.strictEqual(bodyVendedor.meta_reais, 55000);

  console.log('  ✅ [PASS] IsapelSync.salvarVendedor persiste no Supabase com schema correto');

  // 2.2 Carregar vendedores da nuvem
  const carregados = await IsapelSync.carregarVendedores();
  assert(Array.isArray(carregados));
  assert(carregados.some(v => v.login === 'mariana'));
  console.log('  ✅ [PASS] IsapelSync.carregarVendedores carrega lista dinamicamente');

  // 2.3 Obter perfil de avatar padrão para fundadores
  const macielAvatar = IsapelSync.obterPerfilAvatar('maciel');
  assert.strictEqual(macielAvatar.uniforme.tipo, 'blazer_executivo_navy');
  assert.strictEqual(macielAvatar.barba.tipo, 'bigode_maciel');

  const fernandaAvatar = IsapelSync.obterPerfilAvatar('fernanda');
  assert.strictEqual(fernandaAvatar.uniforme.tipo, 'polo_isapel_cyan');
  assert.strictEqual(fernandaAvatar.cabelo.cor, '#F7CF46');

  console.log('  ✅ [PASS] IsapelSync.obterPerfilAvatar fornece traços oficiais padrão dos fundadores');

  // 2.4 Salvar perfil de avatar customizado para o novo vendedor
  const configAvatarMariana = {
    uniforme: {
      tipo: 'camisa_social_cracha',
      corPrimaria: '#FFFFFF',
      corGola: '#FFFFFF',
      tipoInferior: 'calca_social',
      corInferior: '#0A1829',
      temCracha: true
    },
    cabelo: {
      estilo: 'longo_feminino',
      cor: '#2C1D11'
    },
    barba: {
      tipo: 'nenhum',
      cor: '#161211'
    },
    pele: {
      tom: '#E6B994'
    },
    acessorios: {
      oculos: 'oculos_retangular',
      corArmacao: '#111827',
      gravata: 'nenhum'
    }
  };

  mockFetchCalls.length = 0;
  const avatarSaveRes = await IsapelSync.salvarPerfilAvatar('mariana', configAvatarMariana);
  assert.strictEqual(avatarSaveRes.ok, true);

  // Verifica chamada Supabase
  assert(mockFetchCalls.some(c => c.url.includes('crm_isapel_perfis_avatar')));

  // Verifica evento isapel:avatar-updated
  const eventoAvatar = eventLog.find(e => e.type === 'isapel:avatar-updated');
  assert(eventoAvatar, 'Evento isapel:avatar-updated deve ser disparado');
  assert.strictEqual(eventoAvatar.detail.vendedorId, 'mariana');
  assert.strictEqual(eventoAvatar.detail.config.uniforme.tipo, 'camisa_social_cracha');

  // Recupera avatar salvo
  const avatarRecuperado = IsapelSync.obterPerfilAvatar('mariana');
  assert.strictEqual(avatarRecuperado.uniforme.tipo, 'camisa_social_cracha');
  assert.strictEqual(avatarRecuperado.acessorios.oculos, 'oculos_retangular');

  console.log('  ✅ [PASS] IsapelSync.salvarPerfilAvatar persiste e sincroniza via isapel:avatar-updated');

  // ----------------------------------------------------------------------------
  // 3. ISAPEL CRM BACKEND & ARENA INTEGRATION
  // ----------------------------------------------------------------------------
  console.log('\n--- 3. IsapelCRM Backend & Arena 3D Ranking Hydration ---');

  // Registra vendedor no backend
  IsapelCRM.registrarVendedor(novoVendedor);
  const backendMariana = IsapelCRM.obterVendedorPorId('mariana');
  assert(backendMariana, 'Mariana deve estar registrada no VENDEDORES_CONFIG');
  assert.strictEqual(backendMariana.nome, 'Mariana Vasconcelos');

  // Simula leads para Mariana
  const leadsTeste = [
    {
      id: 'lead-mariana-01',
      nome: 'Hospital Samaritano',
      vendedorId: 'mariana',
      estagio: 'fechado',
      valorProposta: 12000,
      amostraEnviada: true,
      observacoes: 'Contrato fechado com sucesso'
    },
    {
      id: 'lead-mariana-02',
      nome: 'Clínica São Lucas',
      vendedorId: 'mariana',
      estagio: 'proposta',
      valorProposta: 4500,
      observacoes: 'Proposta enviada'
    }
  ];

  const metricas = IsapelCRM.calcularMetricasArena(null, leadsTeste);
  assert(Array.isArray(metricas));
  const metricaMariana = metricas.find(m => m.vendedorId === 'mariana');
  assert(metricaMariana, 'Métricas da Arena devem incluir o novo vendedor');
  assert.strictEqual(metricaMariana.totalCadastrados, 2);
  assert.strictEqual(metricaMariana.totalFechados, 1);
  assert.strictEqual(metricaMariana.volumeTotalFaturado, 12000);
  assert(metricaMariana.pontuacaoGeral > 0, 'Pontuação XP deve ser calculada');

  console.log('  ✅ [PASS] IsapelCRM.calcularMetricasArena calcula métricas, conversão e XP para o novo vendedor');

  console.log('\n============================================================');
  console.log('🎉 TODOS OS TESTES DO MILESTONE M1 PASSARAM COM 100% DE SUCESSO!');
  console.log('============================================================\n');
})();
