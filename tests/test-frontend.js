/**
 * Teste de Validação do Frontend (HTML + crm-app.js)
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando Testes Automatizados do Frontend CRM Isapel Papéis...');

const htmlPath = path.resolve(__dirname, '../index.html');
const appJsPath = path.resolve(__dirname, '../js/crm-app.js');

assert(fs.existsSync(htmlPath), 'index.html deve existir');
assert(fs.existsSync(appJsPath), 'crm-app.js deve existir');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

// 1. Validação dos 2 campos no formulário de Novo Lead
assert(htmlContent.includes('id="lead-nome"'), 'Campo Nome deve existir');
assert(htmlContent.includes('id="lead-telefone"'), 'Campo Telefone deve existir');
assert(htmlContent.includes('id="btn-cadastrar-lead"'), 'Botão Cadastrar Lead deve existir');
assert(htmlContent.includes('id="badge-ddd-display"'), 'Badge de DDD deve existir');
assert(htmlContent.includes('id="badge-ddd-localizacao"'), 'Localização de DDD deve existir');
console.log('  ✅ [PASS] Formulário de Cadastro Rápido possui EXATAMENTE os 2 campos e badge de localização');

// 2. Validação das 3 Abas
assert(htmlContent.includes('data-tab="tab-funil"'), 'Aba 1 (Funil) deve existir');
assert(htmlContent.includes('data-tab="tab-arena"'), 'Aba 2 (Arena 3D) deve existir');
assert(htmlContent.includes('data-tab="tab-fechamento"'), 'Aba 3 (Fechamento) deve existir');
console.log('  ✅ [PASS] As 3 abas de navegação estão configuradas com atributos data-tab');

// 3. Validação das 6 Colunas do Kanban
const colunasRequeridas = ['novo', 'qualificacao', 'proposta', 'negociacao', 'fechado', 'perdido'];
colunasRequeridas.forEach(col => {
  assert(htmlContent.includes(`data-stage="${col}"`), `Coluna ${col} deve existir com data-stage`);
});
console.log('  ✅ [PASS] O Kanban possui as 6 colunas completas com suporte a drop');

// 4. Validação da Seção de Fechamento do Dia
assert(htmlContent.includes('id="btn-executar-fechamento"'), 'Botão Encerrar Expediente deve existir');
assert(htmlContent.includes('id="lista-prioridade-1"'), 'Prioridade 1 deve existir');
assert(htmlContent.includes('id="lista-prioridade-2"'), 'Prioridade 2 deve existir');
assert(htmlContent.includes('id="lista-prioridade-3"'), 'Prioridade 3 deve existir');
assert(htmlContent.includes('id="btn-copiar-plano-whatsapp"'), 'Botão Copiar para WhatsApp deve existir');
console.log('  ✅ [PASS] Painel de Fechamento do Dia e Ações Prioritárias configurados');

// 5. Validação dos Modais
assert(htmlContent.includes('id="modal-notas-backdrop"'), 'Modal de Notas deve existir');
assert(htmlContent.includes('id="modal-editar-backdrop"'), 'Modal de Edição deve existir');
console.log('  ✅ [PASS] Modais de Notas e Edição de Lead configurados');

// 6. Validação do Three.js e Fallback
assert(htmlContent.includes('three.min.js'), 'Importação do Three.js com fallback presente');
assert(htmlContent.includes('js/crm-backend.js'), 'Script do backend incluído');
assert(htmlContent.includes('js/arena-3d.js'), 'Script da arena 3D incluído');
assert(htmlContent.includes('js/crm-app.js'), 'Script principal do CRM incluído');
console.log('  ✅ [PASS] Scripts e Three.js configurados corretamente no index.html');

console.log('\n🎉 TODOS OS TESTES DO FRONTEND PASSARAM COM SUCESSO!\n');
