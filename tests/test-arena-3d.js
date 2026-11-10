/**
 * Testes Unitários e de Integração da Arena 3D
 * Arquivo: tests/test-arena-3d.js
 */

const assert = require('assert');
const arena = require('../js/arena-3d.js');
const backend = require('../js/crm-backend.js');

console.log('🧪 Iniciando testes do módulo Arena 3D...');

// 1. Verificação de API pública
assert(typeof arena.init === 'function', 'arena.init deve ser uma função');
assert(typeof arena.atualizar === 'function', 'arena.atualizar deve ser uma função');
assert(typeof arena.dispararConfetes === 'function', 'arena.dispararConfetes deve ser uma função');
assert(typeof arena.celebrarVenda === 'function', 'arena.celebrarVenda deve ser uma função');
assert(typeof arena.obterRankingAtual === 'function', 'arena.obterRankingAtual deve ser uma função');
assert(typeof arena.obterDadosVendedores === 'function', 'arena.obterDadosVendedores deve ser uma função');
assert(typeof arena.definirCriterio === 'function', 'arena.definirCriterio deve ser uma função');
console.log('✅ 1. API pública validada com sucesso.');

// 2. Verificação dos 5 personagens cadastrados
const vendedores = arena.obterDadosVendedores();
assert.strictEqual(vendedores.length, 5, 'Devem existir 5 vendedores na equipe');
const ids = vendedores.map(v => v.id);
assert(ids.includes('fernanda'), 'Fernanda deve existir');
assert(ids.includes('caio'), 'Caio deve existir');
assert(ids.includes('maciel'), 'Maciel deve existir');
assert(ids.includes('albert'), 'Albert deve existir');
assert(ids.includes('daniel'), 'Daniel deve existir');
console.log('✅ 2. Os 5 personagens (Maciel, Fernanda, Caio, Albert, Daniel) existem no estado inicial.');

// 3. Atualização de métricas e reordenação do ranking
arena.atualizar([
  { id: 'caio', metricas: { pontos: 5000, contatos: 80, novosLeads: 40, fechados: 30 } },
  { id: 'fernanda', metricas: { pontos: 4200, contatos: 70, novosLeads: 35, fechados: 25 } },
  { id: 'maciel', metricas: { pontos: 3900, contatos: 65, novosLeads: 30, fechados: 20 } },
  { id: 'albert', metricas: { pontos: 3500, contatos: 55, novosLeads: 25, fechados: 15 } },
  { id: 'daniel', metricas: { pontos: 3100, contatos: 45, novosLeads: 20, fechados: 12 } }
]);

const ranking = arena.obterRankingAtual();
assert.deepStrictEqual(ranking, ['caio', 'fernanda', 'maciel', 'albert', 'daniel'], 'Caio deve ser 1º lugar após receber 5000 XP');
console.log('✅ 3. Reordenação reativa do ranking testada com sucesso.');

// 4. Integração com o motor do backend IsapelCRM
const metricasBackend = backend.calcularMetricasArena();
arena.atualizar(metricasBackend);
const rankingBackend = arena.obterRankingAtual();
assert(Array.isArray(rankingBackend) && rankingBackend.length === 5, 'Ranking gerado a partir do backend deve ter 5 posições');
console.log('✅ 4. Integração perfeita com IsapelCRM.calcularMetricasArena().');

// 5. Filtros por critérios
arena.definirCriterio('contatos');
const rankingContatos = arena.obterRankingAtual();
assert.strictEqual(rankingContatos[0], 'maciel', 'Maciel deve liderar em contatos');

arena.definirCriterio('pontos');
console.log('✅ 5. Filtro dinâmico por critérios validado com sucesso.');

console.log('🎉 TODOS OS TESTES DA ARENA 3D PASSARAM COM SUCESSO!');
