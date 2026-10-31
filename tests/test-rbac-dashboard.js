/**
 * tests/test-rbac-dashboard.js
 * Teste Automatizado de Verificação do Dashboard RBAC & Supabase Data Isolation
 * CRM Isapel Papéis v1.1.0
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando Testes Automatizados de RBAC Dashboard & Data Isolation...\n');

const basePath = path.resolve(__dirname, '..');
const htmlPath = path.join(basePath, 'index.html');
const appJsPath = path.join(basePath, 'js/crm-app.js');
const syncJsPath = path.join(basePath, 'js/crm-sync.js');
const themeCssPath = path.join(basePath, 'css/crm-theme.css');
const authJsPath = path.join(basePath, 'js/crm-auth.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const syncJsContent = fs.readFileSync(syncJsPath, 'utf8');
const themeCssContent = fs.readFileSync(themeCssPath, 'utf8');
const authJsContent = fs.readFileSync(authJsPath, 'utf8');

// --- 1. Verificação do index.html ---
console.log('--- 1. Estrutura e Route Guard em index.html ---');

assert(htmlContent.includes('<script src="js/crm-auth.js"></script>'), 'Script crm-auth.js deve estar presente no index.html');
assert(htmlContent.includes('window.IsapelAuth.estaAutenticado()'), 'Guarda de rota deve verificar estaAutenticado()');
assert(htmlContent.includes("window.location.replace('login.html')"), 'Guarda de rota deve redirecionar para login.html se não autenticado');

assert(htmlContent.includes('id="header-user-profile"'), 'Perfil de usuário #header-user-profile deve existir no header');
assert(htmlContent.includes('id="header-user-avatar"'), 'Avatar #header-user-avatar deve existir no header');
assert(htmlContent.includes('id="header-user-name"'), 'Nome #header-user-name deve existir no header');
assert(htmlContent.includes('id="header-user-role-badge"'), 'Role badge #header-user-role-badge deve existir no header');
assert(htmlContent.includes('id="wrapper-vendedor-select"'), 'Container #wrapper-vendedor-select deve envolver o seletor');
assert(htmlContent.includes('id="vendedor-select"'), 'Seletor #vendedor-select original deve ser mantido');
assert(htmlContent.includes('id="btn-logout"'), 'Botão #btn-logout deve existir no header');

console.log('  ✅ [PASS] Route guard imediato no <head> e elementos de perfil e logout no header verificados');

// --- 2. Verificação de Estilos no crm-theme.css ---
console.log('\n--- 2. Estilos RBAC em crm-theme.css ---');

assert(themeCssContent.includes('.crm-header__user-profile'), 'Estilo .crm-header__user-profile deve existir');
assert(themeCssContent.includes('.crm-role-badge'), 'Estilo .crm-role-badge deve existir');
assert(themeCssContent.includes('.crm-role-badge--vendedor'), 'Estilo .crm-role-badge--vendedor deve existir');
assert(themeCssContent.includes('.crm-role-badge--diretoria'), 'Estilo .crm-role-badge--diretoria deve existir');
assert(themeCssContent.includes('#btn-logout'), 'Estilo #btn-logout deve existir');

console.log('  ✅ [PASS] Classes CSS de perfil, badges de papel e botão de logout verificados');

// --- 3. Verificação de Lógica em crm-app.js ---
console.log('\n--- 3. Lógica RBAC em crm-app.js ---');

assert(appJsContent.includes('window.IsapelAuth.obterSessao'), 'initApp deve consultar IsapelAuth.obterSessao()');
assert(appJsContent.includes('headerUserRoleBadge'), 'initApp deve atualizar o role badge');
assert(appJsContent.includes("sessao.perfil === 'vendedor'"), 'initApp deve verificar perfil vendedor');
assert(appJsContent.includes("sessao.perfil === 'diretoria'"), 'initApp deve verificar perfil diretoria');
assert(appJsContent.includes('AppState.vendedorAtivo = sessao.vendedorId'), 'Vendedor deve ter AppState.vendedorAtivo travado em seu vendedorId');
assert(appJsContent.includes("AppState.vendedorAtivo = 'todos'"), 'Diretoria deve ter AppState.vendedorAtivo inicializado em "todos"');
assert(appJsContent.includes('btn-logout'), 'initApp deve configurar listener para botão de logout');

console.log('  ✅ [PASS] Inicialização de RBAC, travamento de vendedor e liberação de diretoria verificados');

// --- 4. Verificação Funcional de Isolamento em crm-sync.js ---
console.log('\n--- 4. Isolamento PostgREST em crm-sync.js ---');

// Mock global environment para carregar crm-sync.js
const mockGlobal = {
  fetchCalls: [],
  currentSession: null,
  navigator: { onLine: true }
};

global.fetch = async (url, options) => {
  mockGlobal.fetchCalls.push({ url, options });
  return {
    ok: true,
    status: 200,
    json: async () => []
  };
};

global.window = {
  IsapelAuth: {
    obterSessao: () => mockGlobal.currentSession
  }
};

global.document = {
  getElementById: (id) => {
    if (id === 'vendedor-select') {
      return { value: mockGlobal.selectVendedorValue || 'todos' };
    }
    return null;
  }
};

// Carrega crm-sync
const syncModule = require('../js/crm-sync.js');

(async () => {
  // Teste 4.1: Vendedor Gabriel Maciel
  mockGlobal.currentSession = {
    usuario: 'maciel',
    nome: 'Gabriel Maciel',
    perfil: 'vendedor',
    vendedorId: 'maciel'
  };

  mockGlobal.fetchCalls = [];
  await syncModule.carregarLeadsNuvem();
  assert(mockGlobal.fetchCalls.length > 0, 'fetch deve ser chamado em carregarLeadsNuvem');
  const macielUrl = mockGlobal.fetchCalls[0].url;
  assert(macielUrl.includes('vendedor_id=eq.maciel'), `URL para maciel deve conter vendedor_id=eq.maciel. Obtido: ${macielUrl}`);
  console.log('  ✅ [PASS] Vendedor "maciel" gera requisição estritamente filtrada por vendedor_id=eq.maciel');

  // Teste 4.2: Vendedora Fernanda
  mockGlobal.currentSession = {
    usuario: 'fernanda',
    nome: 'Fernanda',
    perfil: 'vendedor',
    vendedorId: 'fernanda'
  };

  mockGlobal.fetchCalls = [];
  await syncModule.carregarLeadsNuvem();
  const fernandaUrl = mockGlobal.fetchCalls[0].url;
  assert(fernandaUrl.includes('vendedor_id=eq.fernanda'), `URL para fernanda deve conter vendedor_id=eq.fernanda. Obtido: ${fernandaUrl}`);
  console.log('  ✅ [PASS] Vendedora "fernanda" gera requisição estritamente filtrada por vendedor_id=eq.fernanda');

  // Teste 4.3: Diretoria com visão global
  mockGlobal.currentSession = {
    usuario: 'diretoria',
    nome: 'Diretoria Comercial',
    perfil: 'diretoria',
    vendedorId: null
  };
  mockGlobal.selectVendedorValue = 'todos';

  mockGlobal.fetchCalls = [];
  await syncModule.carregarLeadsNuvem();
  const diretoriaUrl = mockGlobal.fetchCalls[0].url;
  assert(!diretoriaUrl.includes('vendedor_id=eq.'), `URL para diretoria com "todos" NÃO deve conter filtro vendedor_id. Obtido: ${diretoriaUrl}`);
  console.log('  ✅ [PASS] Diretoria com "todos" gera requisição irrestrita para todos os leads da nuvem');

  // Teste 4.4: Diretoria filtrando vendedor específico (ex: Caio)
  mockGlobal.selectVendedorValue = 'caio';
  mockGlobal.fetchCalls = [];
  await syncModule.carregarLeadsNuvem();
  const diretoriaFiltroCaioUrl = mockGlobal.fetchCalls[0].url;
  assert(diretoriaFiltroCaioUrl.includes('vendedor_id=eq.caio'), `Diretoria filtrando caio deve conter vendedor_id=eq.caio. Obtido: ${diretoriaFiltroCaioUrl}`);
  console.log('  ✅ [PASS] Diretoria filtrando "caio" gera requisição refinada por vendedor_id=eq.caio');

  // Teste 4.5: Salvar Lead - Vendedor força seu próprio ID
  mockGlobal.currentSession = {
    usuario: 'caio',
    nome: 'Caio',
    perfil: 'vendedor',
    vendedorId: 'caio'
  };
  mockGlobal.fetchCalls = [];

  const leadFraudulento = {
    id: 'lead-test-01',
    nome: 'Empresa Teste',
    telefone: '19999999999',
    vendedorId: 'maciel', // Tentativa de salvar como outro vendedor
    vendedorNome: 'Gabriel Maciel'
  };

  await syncModule.salvarLeadNuvem(leadFraudulento);
  assert(mockGlobal.fetchCalls.length > 0, 'fetch deve ser chamado em salvarLeadNuvem');
  const payloadEnviado = JSON.parse(mockGlobal.fetchCalls[0].options.body);
  assert.strictEqual(payloadEnviado.vendedor_id, 'caio', 'salvarLeadNuvem deve forçar vendedor_id da sessão ativa');
  assert.strictEqual(payloadEnviado.vendedor_nome, 'Caio', 'salvarLeadNuvem deve forçar vendedor_nome da sessão ativa');
  console.log('  ✅ [PASS] Anti-bypass: salvarLeadNuvem força vendedor_id e vendedor_nome da sessão ativa');

  // Teste 4.6: Remover Lead - Vendedor tem query restrita por vendedor_id
  mockGlobal.fetchCalls = [];
  await syncModule.removerLeadNuvem('lead-test-01');
  const deleteUrl = mockGlobal.fetchCalls[0].url;
  assert(deleteUrl.includes('id=eq.lead-test-01'), 'Delete deve incluir id do lead');
  assert(deleteUrl.includes('vendedor_id=eq.caio'), `Delete de vendedor deve incluir &vendedor_id=eq.caio. Obtido: ${deleteUrl}`);
  console.log('  ✅ [PASS] Remover lead restringe exclusão pelo vendedor_id da sessão ativa');

  console.log('\n============================================================');
  console.log('🎉 TODOS OS TESTES DE RBAC & DATA ISOLATION PASSARAM COM SUCESSO!');
  console.log('============================================================\n');
})();
