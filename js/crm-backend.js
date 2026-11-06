/**
 * ============================================================================
 * ISAPEL PAPÉIS - BACKEND & MOTOR DE DADOS COMERCIAL B2B
 * Arquivo: js/crm-backend.js
 * 
 * Funcionalidades:
 * 1. Mapeamento Completo de DDDs do Brasil (11 a 99) com Rotas Logísticas
 * 2. Modelagem e Gestão de Vendedores (Maciel, Fernanda, Caio)
 * 3. Funil de Vendas B2B de 6 Etapas e Leads Demonstrativos
 * 4. Métricas e Pontuação da Arena de Competição
 * 5. Motor de Fechamento Diário & Plano Tático Comercial (Sem cálculo de comissão)
 * 6. Camada de Persistência Híbrida (localStorage + Memória + Exportação JSON/CSV/MD)
 * ============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.IsapelCRM = factory();
    root.IsapelBackend = root.IsapelCRM; // Aliasing conveniente
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ==========================================================================
  // 1. BASE DE DADOS COMPLETA DE DDDS DO BRASIL (11 a 99) E ROTAS DE LOGÍSTICA
  // ==========================================================================
  const TABELA_DDDS_BRASIL = {
    // ---- SÃO PAULO (FROTA PRÓPRIA ISAPEL - ROTA DIRETA CIF) ----
    11: {
      ddd: 11,
      cidade: 'São Paulo e Grande SP',
      regiao: 'Região Metropolitana de São Paulo (Grande SP e ABC)',
      uf: 'SP',
      logistica: 'Rota Direta CIF (Frota Própria Isapel - 24/72h)',
      rotaLogistica: 'Rota Diária Frota Isapel - Grande SP / Capital / ABC',
      tempoEntrega: '24 a 48 horas',
      frotaPropria: true,
      tipoFretePadrao: 'CIF Isapel'
    },
    12: {
      ddd: 12,
      cidade: 'São José dos Campos e Taubaté',
      regiao: 'Vale do Paraíba e Litoral Norte',
      uf: 'SP',
      logistica: 'Rota Direta CIF (Frota Própria Isapel - 24/72h)',
      rotaLogistica: 'Rota Vale do Paraíba - Segundas, Quartas e Sextas',
      tempoEntrega: '24 a 48 horas',
      frotaPropria: true,
      tipoFretePadrao: 'CIF Isapel'
    },
    13: {
      ddd: 13,
      cidade: 'Santos e Baixada Santista',
      regiao: 'Baixada Santista e Litoral Sul Paulista',
      uf: 'SP',
      logistica: 'Rota Direta CIF (Frota Própria Isapel - 24/72h)',
      rotaLogistica: 'Rota Baixada Santista - Terças e Quintas',
      tempoEntrega: '48 horas',
      frotaPropria: true,
      tipoFretePadrao: 'CIF Isapel'
    },
    14: {
      ddd: 14,
      cidade: 'Bauru, Marília e Jaú',
      regiao: 'Centro-Oeste Paulista (Bauru, Marília, Botucatu)',
      uf: 'SP',
      logistica: 'Rota Direta CIF (Frota Própria Isapel - 24/72h)',
      rotaLogistica: 'Rota Centro-Oeste SP - Terças e Quintas',
      tempoEntrega: '48 a 72 horas',
      frotaPropria: true,
      tipoFretePadrao: 'CIF Isapel'
    },
    15: {
      ddd: 15,
      cidade: 'Sorocaba e Itapetininga',
      regiao: 'Sudoeste Paulista e Região Metropolitana de Sorocaba',
      uf: 'SP',
      logistica: 'Rota Direta CIF (Frota Própria Isapel - 24/72h)',
      rotaLogistica: 'Rota Sorocaba / Sudoeste - Segundas e Quintas',
      tempoEntrega: '24 a 48 horas',
      frotaPropria: true,
      tipoFretePadrao: 'CIF Isapel'
    },
    16: {
      ddd: 16,
      cidade: 'Ribeirão Preto, Franca e Araraquara',
      regiao: 'Nordeste Paulista e Região de Ribeirão Preto',
      uf: 'SP',
      logistica: 'Rota Direta CIF (Frota Própria Isapel - 24/72h)',
      rotaLogistica: 'Rota Ribeirão Preto / Franca / São Carlos - Terças e Sextas',
      tempoEntrega: '48 horas',
      frotaPropria: true,
      tipoFretePadrao: 'CIF Isapel'
    },
    17: {
      ddd: 17,
      cidade: 'São José do Rio Preto e Barretos',
      regiao: 'Noroeste Paulista',
      uf: 'SP',
      logistica: 'Rota Direta CIF (Frota Própria Isapel - 24/72h)',
      rotaLogistica: 'Rota Noroeste Paulista - Quartas-feiras',
      tempoEntrega: '48 a 72 horas',
      frotaPropria: true,
      tipoFretePadrao: 'CIF Isapel'
    },
    18: {
      ddd: 18,
      cidade: 'Presidente Prudente e Araçatuba',
      regiao: 'Oeste Paulista',
      uf: 'SP',
      logistica: 'Rota Direta CIF (Frota Própria Isapel - 24/72h)',
      rotaLogistica: 'Rota Oeste Paulista - Quartas e Quintas',
      tempoEntrega: '48 a 72 horas',
      frotaPropria: true,
      tipoFretePadrao: 'CIF Isapel'
    },
    19: {
      ddd: 19,
      cidade: 'Campinas, Piracicaba, Limeira e Americana',
      regiao: 'Região Metropolitana de Campinas (RMC) e Leste Paulista',
      uf: 'SP',
      logistica: 'Rota Direta CIF (Frota Própria Isapel - 24/72h)',
      rotaLogistica: 'Rota RMC Campinas / Piracicaba / Americana - Diária',
      tempoEntrega: '24 a 48 horas',
      frotaPropria: true,
      tipoFretePadrao: 'CIF Isapel'
    },

    // ---- RIO DE JANEIRO (FROTA PRÓPRIA / PARCERIA DIRETA) ----
    21: {
      ddd: 21,
      cidade: 'Rio de Janeiro e Grande Rio',
      regiao: 'Região Metropolitana do Rio de Janeiro',
      uf: 'RJ',
      logistica: 'Rota Direta CIF (Frota Própria Isapel - 24/72h)',
      rotaLogistica: 'Rota Expressa Rio Capital - Terças e Quintas',
      tempoEntrega: '48 horas',
      frotaPropria: true,
      tipoFretePadrao: 'CIF Isapel'
    },
    22: {
      ddd: 22,
      cidade: 'Campos dos Goytacazes, Macaé e Cabo Frio',
      regiao: 'Norte Fluminense e Região dos Lagos',
      uf: 'RJ',
      logistica: 'Rota Direta CIF (Frota Própria Isapel - 24/72h)',
      rotaLogistica: 'Rota Fluminense Litoral - Semanal (Quartas)',
      tempoEntrega: '48 a 72 horas',
      frotaPropria: true,
      tipoFretePadrao: 'CIF Isapel'
    },
    24: {
      ddd: 24,
      cidade: 'Volta Redonda, Petrópolis e Resende',
      regiao: 'Sul Fluminense e Região Serrana',
      uf: 'RJ',
      logistica: 'Rota Direta CIF (Frota Própria Isapel - 24/72h)',
      rotaLogistica: 'Rota Vale do Paraíba / Sul Fluminense - Segundas e Quintas',
      tempoEntrega: '48 horas',
      frotaPropria: true,
      tipoFretePadrao: 'CIF Isapel'
    },

    // ---- ESPÍRITO SANTO ----
    27: {
      ddd: 27,
      cidade: 'Vitória e Vila Velha',
      regiao: 'Região Metropolitana de Vitória e Norte Capixaba',
      uf: 'ES',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Sudeste - Saídas Terças e Sextas',
      tempoEntrega: '3 a 5 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB / CIF Negociado'
    },
    28: {
      ddd: 28,
      cidade: 'Cachoeiro de Itapemirim',
      regiao: 'Sul do Espírito Santo',
      uf: 'ES',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Sudeste - Saídas Terças',
      tempoEntrega: '4 a 6 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB / CIF Negociado'
    },

    // ---- MINAS GERAIS ----
    31: {
      ddd: 31,
      cidade: 'Belo Horizonte, Betim e Contagem',
      regiao: 'Região Metropolitana de Belo Horizonte (RMBH)',
      uf: 'MG',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Parceria Rodoviário MG Express - Saídas Diárias',
      tempoEntrega: '48 a 72 horas',
      frotaPropria: false,
      tipoFretePadrao: 'CIF Negociado'
    },
    32: {
      ddd: 32,
      cidade: 'Juiz de Fora e Barbacena',
      regiao: 'Zona da Mata Mineira e Campo das Vertentes',
      uf: 'MG',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Zona da Mata - Saídas Terças/Quintas',
      tempoEntrega: '3 a 4 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB / CIF Negociado'
    },
    33: {
      ddd: 33,
      cidade: 'Governador Valadares e Teófilo Otoni',
      regiao: 'Leste e Nordeste de Minas Gerais',
      uf: 'MG',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Redespacho Rodoviário Minas Leste',
      tempoEntrega: '4 a 6 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    34: {
      ddd: 34,
      cidade: 'Uberlândia e Uberaba',
      regiao: 'Triângulo Mineiro e Alto Paranaíba',
      uf: 'MG',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Triângulo - Saídas Seg/Qua/Sex',
      tempoEntrega: '3 a 4 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'CIF Negociado'
    },
    35: {
      ddd: 35,
      cidade: 'Poços de Caldas, Pouso Alegre e Varginha',
      regiao: 'Sul e Sudoeste de Minas Gerais (Divisa SP)',
      uf: 'MG',
      logistica: 'Rota Direta CIF (Frota Própria Isapel - 24/72h)',
      rotaLogistica: 'Rota Sul de Minas (Atendimento direto via Frota SP) - Terças e Quintas',
      tempoEntrega: '48 a 72 horas',
      frotaPropria: true,
      tipoFretePadrao: 'CIF Isapel'
    },
    37: {
      ddd: 37,
      cidade: 'Divinópolis e Itaúna',
      regiao: 'Centro-Oeste Mineiro',
      uf: 'MG',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Centro MG',
      tempoEntrega: '3 a 5 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    38: {
      ddd: 38,
      cidade: 'Montes Claros e Diamantina',
      regiao: 'Norte e Noroeste de Minas Gerais',
      uf: 'MG',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Redespacho Rodoviário Norte MG',
      tempoEntrega: '4 a 6 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },

    // ---- PARANÁ (FROTA PRÓPRIA EM REGIÕES ESTRATÉGICAS) ----
    41: {
      ddd: 41,
      cidade: 'Curitiba e São José dos Pinhais',
      regiao: 'Região Metropolitana de Curitiba (RMC) e Litoral Paranaense',
      uf: 'PR',
      logistica: 'Rota Direta CIF (Frota Própria Isapel - 24/72h)',
      rotaLogistica: 'Rota RMC Curitiba - Segundas, Quartas e Sextas',
      tempoEntrega: '48 horas',
      frotaPropria: true,
      tipoFretePadrao: 'CIF Isapel'
    },
    42: {
      ddd: 42,
      cidade: 'Ponta Grossa e Guarapuava',
      regiao: 'Campos Gerais e Centro-Sul do Paraná',
      uf: 'PR',
      logistica: 'Rota Direta CIF (Frota Própria Isapel - 24/72h)',
      rotaLogistica: 'Rota Campos Gerais PR - Terças e Quintas',
      tempoEntrega: '48 a 72 horas',
      frotaPropria: true,
      tipoFretePadrao: 'CIF Isapel'
    },
    43: {
      ddd: 43,
      cidade: 'Londrina e Apucarana',
      regiao: 'Norte Pioneiro e Norte Central Paranaense',
      uf: 'PR',
      logistica: 'Rota Direta CIF (Frota Própria Isapel - 24/72h)',
      rotaLogistica: 'Rota Norte PR (Londrina/Maringá) - Terças e Sextas',
      tempoEntrega: '48 horas',
      frotaPropria: true,
      tipoFretePadrao: 'CIF Isapel'
    },
    44: {
      ddd: 44,
      cidade: 'Maringá, Paranavaí e Umuarama',
      regiao: 'Noroeste e Centro-Oeste Paranaense',
      uf: 'PR',
      logistica: 'Rota Direta CIF (Frota Própria Isapel - 24/72h)',
      rotaLogistica: 'Rota Maringá / Noroeste PR - Quartas e Sextas',
      tempoEntrega: '48 a 72 horas',
      frotaPropria: true,
      tipoFretePadrao: 'CIF Isapel'
    },
    45: {
      ddd: 45,
      cidade: 'Cascavel e Foz do Iguaçu',
      regiao: 'Oeste Paranaense',
      uf: 'PR',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Oeste PR',
      tempoEntrega: '3 a 4 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'CIF Negociado'
    },
    46: {
      ddd: 46,
      cidade: 'Pato Branco e Francisco Beltrão',
      regiao: 'Sudoeste Paranaense',
      uf: 'PR',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Sudoeste PR',
      tempoEntrega: '4 a 5 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },

    // ---- SANTA CATARINA ----
    47: {
      ddd: 47,
      cidade: 'Joinville, Blumenau e Itajaí',
      regiao: 'Norte Catarinense e Vale do Itajaí',
      uf: 'SC',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Parceria Rodoviário SC Norte - Saídas Diárias',
      tempoEntrega: '48 a 72 horas',
      frotaPropria: false,
      tipoFretePadrao: 'CIF Negociado'
    },
    48: {
      ddd: 48,
      cidade: 'Florianópolis, Criciúma e Tubarão',
      regiao: 'Grande Florianópolis e Sul Catarinense',
      uf: 'SC',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Parceria Rodoviário SC Litoral',
      tempoEntrega: '3 a 4 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'CIF Negociado'
    },
    49: {
      ddd: 49,
      cidade: 'Chapecó, Concórdia e Lages',
      regiao: 'Oeste Catarinense e Planalto Serrano',
      uf: 'SC',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Oeste SC',
      tempoEntrega: '4 a 5 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },

    // ---- RIO GRANDE DO SUL ----
    51: {
      ddd: 51,
      cidade: 'Porto Alegre, Canoas e Novo Hamburgo',
      regiao: 'Região Metropolitana de Porto Alegre e Vale dos Sinos',
      uf: 'RS',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Parceria Rodoviário RS Capital - Saídas Seg/Qua/Sex',
      tempoEntrega: '3 a 5 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'CIF Negociado'
    },
    53: {
      ddd: 53,
      cidade: 'Pelotas e Rio Grande',
      regiao: 'Sul Gaúcho e Campanha Meridional',
      uf: 'RS',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Redespacho Rodoviário RS Sul',
      tempoEntrega: '4 a 6 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    54: {
      ddd: 54,
      cidade: 'Caxias do Sul, Bento Gonçalves e Passo Fundo',
      regiao: 'Serra Gaúcha e Norte do RS',
      uf: 'RS',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Serra Gaúcha',
      tempoEntrega: '3 a 5 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'CIF Negociado'
    },
    55: {
      ddd: 55,
      cidade: 'Santa Maria e Uruguaiana',
      regiao: 'Centro e Fronteira Oeste Gaúcha',
      uf: 'RS',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Redespacho RS Oeste',
      tempoEntrega: '5 a 7 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },

    // ---- CENTRO-OESTE & TOCANTINS ----
    61: {
      ddd: 61,
      cidade: 'Brasília e Região Integrada (RIDE)',
      regiao: 'Distrito Federal e Entorno Goiano',
      uf: 'DF',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Parceria Rodoviário Brasília Express - Saídas Seg/Qua/Sex',
      tempoEntrega: '3 a 4 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'CIF Negociado'
    },
    62: {
      ddd: 62,
      cidade: 'Goiânia e Anápolis',
      regiao: 'Região Metropolitana de Goiânia e Centro Goiano',
      uf: 'GO',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira GO Capital',
      tempoEntrega: '3 a 4 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'CIF Negociado'
    },
    63: {
      ddd: 63,
      cidade: 'Palmas, Araguaína e Gurupi',
      regiao: 'Todo o Estado do Tocantins',
      uf: 'TO',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Redespacho Rodoviário TO',
      tempoEntrega: '5 a 7 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    64: {
      ddd: 64,
      cidade: 'Rio Verde, Itumbiara e Catalão',
      regiao: 'Sudoeste e Sul Goiano',
      uf: 'GO',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Sul Goiano',
      tempoEntrega: '4 a 5 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB / CIF Negociado'
    },
    65: {
      ddd: 65,
      cidade: 'Cuiabá e Várzea Grande',
      regiao: 'Região Metropolitana de Cuiabá e Pantanal MT',
      uf: 'MT',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira MT Capital',
      tempoEntrega: '4 a 6 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'CIF Negociado'
    },
    66: {
      ddd: 66,
      cidade: 'Rondonópolis, Sinop e Sorriso',
      regiao: 'Sudeste e Norte Mato-Grossense (Agro)',
      uf: 'MT',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Redespacho Agro MT',
      tempoEntrega: '5 a 7 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    67: {
      ddd: 67,
      cidade: 'Campo Grande, Dourados e Três Lagoas',
      regiao: 'Todo o Estado de Mato Grosso do Sul',
      uf: 'MS',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira MS Rodoviário',
      tempoEntrega: '3 a 5 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB / CIF Negociado'
    },

    // ---- NORTE (AC, RO, AM, RR, PA, AP) ----
    68: {
      ddd: 68,
      cidade: 'Rio Branco e Cruzeiro do Sul',
      regiao: 'Todo o Estado do Acre',
      uf: 'AC',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Redespacho Aéreo/Rodoviário Acre',
      tempoEntrega: '8 a 12 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    69: {
      ddd: 69,
      cidade: 'Porto Velho e Ji-Paraná',
      regiao: 'Todo o Estado de Rondônia',
      uf: 'RO',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Redespacho Rodoviário Rondônia',
      tempoEntrega: '6 a 9 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    91: {
      ddd: 91,
      cidade: 'Belém, Ananindeua e Castanhal',
      regiao: 'Região Metropolitana de Belém e Nordeste Paraense',
      uf: 'PA',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Redespacho Norte PA Capital',
      tempoEntrega: '6 a 8 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    92: {
      ddd: 92,
      cidade: 'Manaus e Itacoatiara',
      regiao: 'Região Metropolitana de Manaus',
      uf: 'AM',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Cabotagem / Aéreo Parceiro Manaus',
      tempoEntrega: '8 a 14 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    93: {
      ddd: 93,
      cidade: 'Santarém e Altamira',
      regiao: 'Oeste e Baixo Amazonas Paraense',
      uf: 'PA',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Redespacho Fluvial/Rodoviário Pará',
      tempoEntrega: '8 a 12 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    94: {
      ddd: 94,
      cidade: 'Marabá e Parauapebas',
      regiao: 'Sudeste Paraense (Carajás)',
      uf: 'PA',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Redespacho Rodoviário Sul PA',
      tempoEntrega: '7 a 10 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    95: {
      ddd: 95,
      cidade: 'Boa Vista e Rorainópolis',
      regiao: 'Todo o Estado de Roraima',
      uf: 'RR',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Redespacho Aéreo/Rodoviário RR',
      tempoEntrega: '10 a 15 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    96: {
      ddd: 96,
      cidade: 'Macapá e Santana',
      regiao: 'Todo o Estado do Amapá',
      uf: 'AP',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Cabotagem / Aéreo Parceiro Amapá',
      tempoEntrega: '9 a 14 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    97: {
      ddd: 97,
      cidade: 'Tefé, Coari e Tabatinga',
      regiao: 'Interior e Oeste do Amazonas',
      uf: 'AM',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Redespacho Fluvial Amazonas',
      tempoEntrega: '12 a 20 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },

    // ---- NORDESTE ----
    71: {
      ddd: 71,
      cidade: 'Salvador, Camaçari e Lauro de Freitas',
      regiao: 'Região Metropolitana de Salvador (RMS)',
      uf: 'BA',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Parceria Rodoviário BA Capital - Saídas Seg/Qua/Sex',
      tempoEntrega: '4 a 6 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'CIF Negociado'
    },
    73: {
      ddd: 73,
      cidade: 'Ilhéus, Itabuna e Porto Seguro',
      regiao: 'Sul e Extremo Sul da Bahia',
      uf: 'BA',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Sul BA',
      tempoEntrega: '5 a 7 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    74: {
      ddd: 74,
      cidade: 'Juazeiro, Senhor do Bonfim e Jacobina',
      regiao: 'Norte e Noroeste da Bahia (Vale do São Francisco)',
      uf: 'BA',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Redespacho Rodoviário BA Norte',
      tempoEntrega: '5 a 7 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    75: {
      ddd: 75,
      cidade: 'Feira de Santana e Alagoinhas',
      regiao: 'Centro-Leste e Recôncavo Baiano',
      uf: 'BA',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Feira de Santana Hub',
      tempoEntrega: '4 a 6 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'CIF Negociado'
    },
    77: {
      ddd: 77,
      cidade: 'Vitória da Conquista, Barreiras e LEM',
      regiao: 'Sudoeste e Oeste da Bahia (Matopiba Agro)',
      uf: 'BA',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Oeste BA',
      tempoEntrega: '5 a 7 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    79: {
      ddd: 79,
      cidade: 'Aracaju, Itabaiana e Lagarto',
      regiao: 'Todo o Estado de Sergipe',
      uf: 'SE',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Sergipe',
      tempoEntrega: '4 a 6 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB / CIF Negociado'
    },
    81: {
      ddd: 81,
      cidade: 'Recife, Jaboatão dos Guararapes e Olinda',
      regiao: 'Região Metropolitana do Recife e Zona da Mata PE',
      uf: 'PE',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Parceria Rodoviário PE Capital - Saídas Seg/Qua/Sex',
      tempoEntrega: '4 a 6 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'CIF Negociado'
    },
    82: {
      ddd: 82,
      cidade: 'Maceió e Arapiraca',
      regiao: 'Todo o Estado de Alagoas',
      uf: 'AL',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Alagoas',
      tempoEntrega: '5 a 7 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    83: {
      ddd: 83,
      cidade: 'João Pessoa e Campina Grande',
      regiao: 'Todo o Estado da Paraíba',
      uf: 'PB',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Paraíba',
      tempoEntrega: '5 a 7 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    84: {
      ddd: 84,
      cidade: 'Natal e Mossoró',
      regiao: 'Todo o Estado do Rio Grande do Norte',
      uf: 'RN',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira RN',
      tempoEntrega: '5 a 7 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    85: {
      ddd: 85,
      cidade: 'Fortaleza, Caucaia e Maracanaú',
      regiao: 'Região Metropolitana de Fortaleza (RMF)',
      uf: 'CE',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Parceria Rodoviário CE Capital',
      tempoEntrega: '4 a 6 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'CIF Negociado'
    },
    86: {
      ddd: 86,
      cidade: 'Teresina e Parnaíba',
      regiao: 'Norte e Centro do Piauí',
      uf: 'PI',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Piauí',
      tempoEntrega: '5 a 8 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    87: {
      ddd: 87,
      cidade: 'Petrolina, Caruaru e Garanhuns',
      regiao: 'Agreste e Sertão Pernambucano',
      uf: 'PE',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Sertão PE',
      tempoEntrega: '5 a 7 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    88: {
      ddd: 88,
      cidade: 'Juazeiro do Norte, Sobral e Crato',
      regiao: 'Sul e Norte do Ceará (Cariri e Sobral)',
      uf: 'CE',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira Interior CE',
      tempoEntrega: '5 a 8 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    89: {
      ddd: 89,
      cidade: 'Picos e Floriano',
      regiao: 'Sul do Piauí',
      uf: 'PI',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Redespacho Sul PI',
      tempoEntrega: '6 a 9 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    98: {
      ddd: 98,
      cidade: 'São Luís e São José de Ribamar',
      regiao: 'Região Metropolitana de São Luís e Norte Maranhense',
      uf: 'MA',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira MA Capital',
      tempoEntrega: '5 a 8 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    },
    99: {
      ddd: 99,
      cidade: 'Imperatriz, Caxias e Açailândia',
      regiao: 'Sul e Oeste do Maranhão',
      uf: 'MA',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Redespacho Imperatriz MA',
      tempoEntrega: '6 a 9 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB'
    }
  };

  /**
   * Sanitiza telefone e extrai DDD automaticamente
   * Suporta formatos: "(11) 98765-4321", "11987654321", "+55 19 9999-9999", "12 3900-0000", etc.
   */
  function extrairDDDDeTelefone(telefone) {
    if (!telefone) return null;
    const str = String(telefone).trim();
    // Remove tudo que não for dígito
    let digitos = str.replace(/\D/g, '');
    
    // Se começar com código do Brasil 55 e tiver mais de 10 dígitos, remove o 55
    if (digitos.length >= 12 && digitos.startsWith('55')) {
      digitos = digitos.substring(2);
    }

    if (digitos.length >= 2) {
      const possivelDDD = parseInt(digitos.substring(0, 2), 10);
      if (possivelDDD >= 11 && possivelDDD <= 99 && TABELA_DDDS_BRASIL[possivelDDD]) {
        return possivelDDD;
      }
    }
    return null;
  }

  /**
   * Formata telefone para padrão nacional (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
   */
  function formatarTelefone(telefone) {
    if (!telefone) return '';
    let digitos = String(telefone).replace(/\D/g, '');
    if (digitos.length >= 12 && digitos.startsWith('55')) {
      digitos = digitos.substring(2);
    }
    if (digitos.length === 11) {
      return `(${digitos.substring(0, 2)}) ${digitos.substring(2, 7)}-${digitos.substring(7)}`;
    }
    if (digitos.length === 10) {
      return `(${digitos.substring(0, 2)}) ${digitos.substring(2, 6)}-${digitos.substring(6)}`;
    }
    return telefone;
  }

  /**
   * Resolve informações completas a partir de um DDD ou Telefone
   */
  function resolverInformacoesDDD(telefoneOuDDD) {
    let ddd = null;
    if (typeof telefoneOuDDD === 'number') {
      ddd = telefoneOuDDD;
    } else {
      ddd = extrairDDDDeTelefone(telefoneOuDDD);
    }

    if (ddd && TABELA_DDDS_BRASIL[ddd]) {
      return { ...TABELA_DDDS_BRASIL[ddd], localizado: true };
    }

    // Fallback gracioso para DDDs não mapeados
    return {
      ddd: ddd || null,
      cidade: 'Outras Regiões / Interior',
      regiao: 'Território Nacional',
      uf: 'BR',
      logistica: 'Redespacho / Transportadora Parceira (FOB/CIF Negociado)',
      rotaLogistica: 'Transportadora Parceira / Cotação sob Demanda',
      tempoEntrega: '5 a 10 dias úteis',
      frotaPropria: false,
      tipoFretePadrao: 'FOB / A Combinar',
      localizado: false
    };
  }

  // ==========================================================================
  // 2. MODELAGEM DOS VENDEDORES DA EQUIPE ISAPEL
  // ==========================================================================
  const VENDEDORES_CONFIG = {
    maciel: {
      id: 'maciel',
      nome: 'Gabriel Maciel',
      cargo: 'Vendedor Sênior B2B',
      idade: 22,
      perfil: 'Cabelo enrolado e bigode',
      avatarColor: '#003360',
      especialidade: 'Grandes Contas Industriais, Hospitais e Redes de Facilities',
      email: 'maciel@isapel.com.br',
      metaMensalFardos: 2500
    },
    fernanda: {
      id: 'fernanda',
      nome: 'Fernanda',
      cargo: 'Consultora Comercial',
      idade: 21,
      perfil: 'Menina loira',
      avatarColor: '#0284C7',
      especialidade: 'Hotelaria, Educação, Frigoríficos e Academias',
      email: 'fernanda@isapel.com.br',
      metaMensalFardos: 2000
    },
    caio: {
      id: 'caio',
      nome: 'Caio',
      cargo: 'SDR & Hunter B2B',
      idade: 19,
      perfil: 'Jovem cabelo enrolado',
      avatarColor: '#38BDF8',
      especialidade: 'Prospecção Ativa B2B, Clínicas, Escritórios e Centros Logísticos',
      email: 'caio@isapel.com.br',
      metaMensalFardos: 1500
    },
    albert: {
      id: 'albert',
      nome: 'Albert',
      cargo: 'Consultor Comercial B2B',
      idade: 25,
      perfil: 'Consultor Comercial B2B',
      avatarColor: '#0284C7',
      especialidade: 'Prospecção e Atendimento Regional',
      email: 'albert@isapel.com.br',
      metaMensalFardos: 2000
    },
    daniel: {
      id: 'daniel',
      nome: 'Daniel',
      cargo: 'Consultor Comercial B2B',
      idade: 26,
      perfil: 'Consultor Comercial B2B',
      avatarColor: '#059669',
      especialidade: 'Prospecção e Atendimento Regional',
      email: 'daniel@isapel.com.br',
      metaMensalFardos: 2000
    }
  };

  const STORAGE_VENDEDORES_KEY = 'isapel_crm_vendedores_custom';

  /**
   * Registra ou atualiza um vendedor dinâmico no catálogo do backend.
   * @param {Object} v - Registro do vendedor
   */
  function registrarVendedorDinamico(v) {
    if (!v || (!v.id && !v.login && !v.usuario)) return;
    const vid = String(v.id || v.login || v.usuario).trim().toLowerCase();
    if (!vid) return;

    // Preserva se já for fundador e não sobrescreve características essenciais
    const existing = VENDEDORES_CONFIG[vid];

    VENDEDORES_CONFIG[vid] = {
      id: vid,
      login: vid,
      usuario: vid,
      nome: v.nome || (existing ? existing.nome : vid),
      cargo: v.cargo || (existing ? existing.cargo : 'Consultor Comercial B2B'),
      idade: v.idade || (existing ? existing.idade : 25),
      perfil: v.perfil || (existing ? existing.perfil : 'Consultor Comercial B2B'),
      avatarColor: v.avatarCor || v.avatarColor || (existing ? existing.avatarColor : '#0284C7'),
      avatar: v.avatar || v.avatarIniciais || (existing ? existing.avatar : 'CO'),
      avatarIniciais: v.avatarIniciais || v.avatar || (existing ? existing.avatarIniciais : 'CO'),
      especialidade: v.especialidade || (existing ? existing.especialidade : 'Atendimento Comercial e Vendas B2B'),
      email: v.email || (existing ? existing.email : `${vid}@isapel.com.br`),
      metaMensalFardos: Number(v.metaMensalFardos || (existing ? existing.metaMensalFardos : 1500)),
      metaMensalReais: Number(v.metaMensalReais || (existing ? existing.metaMensalReais : 40000))
    };
  }

  /**
   * Carrega os vendedores customizados gravados no storage e na camada Auth
   */
  function carregarVendedoresDinamicos() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem) {
        const raw = localStorage.getItem(STORAGE_VENDEDORES_KEY);
        if (raw) {
          const lista = JSON.parse(raw);
          if (Array.isArray(lista)) {
            lista.forEach(registrarVendedorDinamico);
          }
        }
      }
    } catch (e) {
      // Storage inacessível
    }

    if (typeof window !== 'undefined' && window.IsapelAuth && typeof window.IsapelAuth.obterVendedores === 'function') {
      try {
        const listaAuth = window.IsapelAuth.obterVendedores();
        if (Array.isArray(listaAuth)) {
          listaAuth.forEach(registrarVendedorDinamico);
        }
      } catch (e) {}
    }
  }

  // Ouvinte global para atualização instantânea quando um novo vendedor for cadastrado
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('isapel:vendedor-cadastrado', function (evt) {
      if (evt && evt.detail) {
        registrarVendedorDinamico(evt.detail);
      }
    });
  }

  // Inicializa o carregamento de vendedores dinâmicos
  carregarVendedoresDinamicos();

  // ==========================================================================
  // 3. FUNIL DE VENDAS COMPLETO (6 ETAPAS B2B)
  // ==========================================================================
  const ETAPAS_FUNIL = {
    novo: {
      id: 'novo',
      ordem: 1,
      titulo: 'Novo Lead',
      descricao: 'Lead recém-cadastrado via entrada rápida (Nome e WhatsApp)',
      cor: '#94A3B8'
    },
    qualificacao: {
      id: 'qualificacao',
      ordem: 2,
      titulo: 'Contato Feito / Qualificação',
      descricao: 'Primeiro contato realizado. Levantamento de consumo, segmento e dispensadores',
      cor: '#38BDF8'
    },
    proposta: {
      id: 'proposta',
      ordem: 3,
      titulo: 'Cotação / Proposta Enviada',
      descricao: 'Cotação formalizada com produtos Isapel, condições de pagamento e frete CIF',
      cor: '#F59E0B'
    },
    negociacao: {
      id: 'negociacao',
      ordem: 4,
      titulo: 'Negociação / Amostra',
      descricao: 'Amostras de Toalha Interfolha/Bobina entregues, ajuste de minuta ou prazo',
      cor: '#8B5CF6'
    },
    fechado: {
      id: 'fechado',
      ordem: 5,
      titulo: 'Fechado / Ganho',
      descricao: 'Cliente ativo cadastrado, pedido faturado e entrega programada via frota',
      cor: '#10B981'
    },
    perdido: {
      id: 'perdido',
      ordem: 6,
      titulo: 'Perdido / Standby',
      descricao: 'Oportunidade encerrada com motivo documentado para reativação futura',
      cor: '#EF4444'
    }
  };

  // ==========================================================================
  // CLASSIFICAÇÃO OFICIAL DE CLIENTES (PERFIL COMERCIAL B2B)
  // ==========================================================================
  const TIPOS_CLIENTE = [
    { id: 'distribuidor', titulo: 'Distribuidor', icon: '🏢', cor: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE', desc: 'Revenda / Atacado' },
    { id: 'licitacao', titulo: 'Licitação', icon: '🏛️', cor: '#B45309', bg: '#FFFBEB', border: '#FDE68A', desc: 'Órgãos Públicos / Pregão' },
    { id: 'consumidor_final', titulo: 'Consumidor Final', icon: '🛒', cor: '#047857', bg: '#ECFDF5', border: '#A7F3D0', desc: 'Uso Próprio / Facilities' },
    { id: 'outro', titulo: 'Outro', icon: '📦', cor: '#475569', bg: '#F1F5F9', border: '#CBD5E1', desc: 'Parcerias / Outros' }
  ];

  // ==========================================================================
  // CATÁLOGO DE PRODUTOS ISAPEL PAPÉIS (REFERÊNCIA B2B)
  // ==========================================================================
  const PRODUTOS_ISAPEL = [
    {
      sku: 'ISAP-INT-100C',
      nome: 'Papel Toalha Interfolha 100% Celulose Virgem (2 Dobras)',
      fardo: 'Fardo com 2.400 folhas (10 x 240 folhas)',
      segmentoRecomendado: 'Hospitais, Clínicas, Escritórios e Alto Tráfego',
      destaque: 'Alto poder de absorção, alvura superior e resistência à umidade'
    },
    {
      sku: 'ISAP-INT-LUXO',
      nome: 'Papel Toalha Interfolha Luxo Extra Branco (3 Dobras)',
      fardo: 'Fardo com 2.000 folhas (8 x 250 folhas)',
      segmentoRecomendado: 'Hotelaria, Restaurantes Premium e Diretoria',
      destaque: 'Toque suave, maciez premium'
    },
    {
      sku: 'ISAP-ROL-300',
      nome: 'Papel Higiênico Rolão Institucional 300 Metros',
      fardo: 'Fardo com 8 rolos de 300 metros (Total 2.400 metros)',
      segmentoRecomendado: 'Indústrias, Shoppings, Escolas e Centros Logísticos',
      destaque: 'Máxima economia por metro linear, tubo padrão universal'
    },
    {
      sku: 'ISAP-ROL-500',
      nome: 'Papel Higiênico Rolão Folha Dupla 500 Metros',
      fardo: 'Fardo com 8 rolos de 500 metros (Total 4.000 metros)',
      segmentoRecomendado: 'Grandes Indústrias e Áreas Fabris de Alta Densidade',
      destaque: 'Autonomia prolongada, reduz tempo de reposição da equipe de limpeza'
    },
    {
      sku: 'ISAP-BOB-200',
      nome: 'Papel Toalha Bobina Autocorte 200 Metros 100% Celulose',
      fardo: 'Fardo com 6 rolos de 200m (Total 1.200 metros)',
      segmentoRecomendado: 'Indústrias Alimentícias, Laboratórios e Hospitais',
      destaque: 'Controle de desperdício em dispensers com corte automático'
    },
    {
      sku: 'ISAP-CAI-CAI',
      nome: 'Papel Higiênico Cai-Cai Intercalado Folha Dupla',
      fardo: 'Fardo com 8.000 folhas (32 maços com 250 folhas)',
      segmentoRecomendado: 'Condomínios Comerciais, Clínicas e Consultórios',
      destaque: 'Puxada folha a folha, menor consumo e higiene total'
    },
    {
      sku: 'ISAP-SAB-ESP',
      nome: 'Sabonete Espuma Refil 800ml Frutas Vermelhas / Erva Doce',
      fardo: 'Caixa com 6 refis de 800ml com válvula dosadora',
      segmentoRecomendado: 'Banheiros corporativos e comerciais',
      destaque: 'Rende até 2.000 acionamentos por refil'
    },
    {
      sku: 'ISAP-DISP-COMOD',
      nome: 'Dispensers Institucionais Isapel em Regime de Comodato',
      fardo: 'Kit Dispenser Toalheiro + Porta Rolão + Saboneteira',
      segmentoRecomendado: 'Clientes com consumo recorrente acima de 15 fardos/mês',
      destaque: 'Fornecido sem custo de locação com contrato de fornecimento Isapel'
    }
  ];

  // ==========================================================================
  // ESTADO INICIAL DE LEADS REAIS DEMONSTRATIVOS (DISTRIBUÍDOS PELOS 3 VENDEDORES)
  // ==========================================================================
  const LEADS_INICIAIS = [
    // --- GABRIEL MACIEL (Grandes Contas, Indústrias, Hospitais) ---
    {
      id: 'lead-maciel-01',
      nome: 'Hospital Metropolitano Campinas',
      contatoNome: 'Dr. Fernando Vasconcelos (Diretoria de Suprimentos)',
      telefone: '(19) 98845-1234',
      vendedorId: 'maciel',
      estagio: 'negociacao',
      segmento: 'Hospitalar / Saúde',
      tipoCliente: 'licitacao',
      produtosInteresse: [
        'Papel Toalha Interfolha 100% Celulose Virgem (2 Dobras)',
        'Papel Higiênico Rolão Institucional 300 Metros',
        'Dispensers Institucionais Isapel em Regime de Comodato'
      ],
      volumeMensal: '180 fardos/mês de Interfolha + 80 fardos Rolão',
      valorProposta: 19850.00,
      prazoPagamento: '28 DDL (Faturamento Boleto)',
      amostraEnviada: true,
      amostraDetalhe: 'Entregue Kit Amostra Interfolha Folha Dupla via Frota Própria Isapel. Parecer favorável da comissão de controle de infecção.',
      dataCriacao: '2026-10-25T08:30:00.000Z',
      dataUltimoContato: '2026-10-29T14:20:00.000Z',
      prazoFollowUp: '2026-10-30T10:00:00.000Z',
      observacoes: 'Negociação da cláusula de fornecimento contínuo com entrega CIF semanal no CD do hospital.',
      historico: [
        {
          id: 'hist-1',
          data: '2026-10-25T08:30:00.000Z',
          tipo: 'contato',
          canal: 'whatsapp',
          descricao: 'Lead prospectado via lista de hospitais RMC. Solicitado levantamento de consumo atual com o comprador Dr. Fernando.',
          autor: 'Gabriel Maciel'
        },
        {
          id: 'hist-2',
          data: '2026-10-27T10:00:00.000Z',
          tipo: 'proposta',
          canal: 'email',
          descricao: 'Cotação enviada: 180 fardos Interfolha + 80 Rolão com frete CIF incluso na frota Isapel rota Campinas.',
          autor: 'Gabriel Maciel'
        },
        {
          id: 'hist-3',
          data: '2026-10-28T16:00:00.000Z',
          tipo: 'amostra',
          canal: 'visita',
          descricao: 'Amostras de teste entregues pelo motorista Isapel. Testado na UTI e aprovado sem soltar fiapos.',
          autor: 'Gabriel Maciel'
        },
        {
          id: 'hist-4',
          data: '2026-10-29T14:20:00.000Z',
          tipo: 'negociacao',
          canal: 'ligacao',
          descricao: 'Alinhamento da minuta contratual e liberação do cadastro de faturamento para fechar primeiro pedido.',
          autor: 'Gabriel Maciel'
        }
      ]
    },
    {
      id: 'lead-maciel-02',
      nome: 'Condomínio Empresarial Alpha Tower Barueri',
      contatoNome: 'Mariana Duarte (Gerente de Facilities)',
      telefone: '(11) 97120-4567',
      vendedorId: 'maciel',
      estagio: 'fechado',
      segmento: 'Facilities / Condomínios Corporativos',
      tipoCliente: 'consumidor_final',
      produtosInteresse: [
        'Papel Toalha Interfolha Luxo Extra Branco (3 Dobras)',
        'Papel Higiênico Cai-Cai Intercalado Folha Dupla',
        'Sabonete Espuma Refil 800ml'
      ],
      volumeMensal: '120 fardos/mês Interfolha Luxo + 90 caixas Cai-Cai',
      valorProposta: 14720.00,
      prazoPagamento: '21 DDL',
      amostraEnviada: true,
      amostraDetalhe: 'Aprovado pelo conselho do condomínio. Instalação de 45 dispensers em comodato agendada.',
      dataCriacao: '2026-10-20T09:15:00.000Z',
      dataUltimoContato: '2026-10-29T11:00:00.000Z',
      prazoFollowUp: null,
      observacoes: 'Contrato fechado com vigência de 12 meses. Primeira carga entregue na Rota Grande SP Isapel.',
      historico: [
        {
          id: 'hist-5',
          data: '2026-10-20T09:15:00.000Z',
          tipo: 'contato',
          canal: 'ligacao',
          descricao: 'Contato direto com a Mariana de Facilities. Insatisfeitos com atrasos e papel rasgando do antigo fornecedor.',
          autor: 'Gabriel Maciel'
        },
        {
          id: 'hist-6',
          data: '2026-10-23T11:30:00.000Z',
          tipo: 'proposta',
          canal: 'email',
          descricao: 'Envio de proposta comercial com comodato completo dos dispensers Isapel.',
          autor: 'Gabriel Maciel'
        },
        {
          id: 'hist-7',
          data: '2026-10-29T11:00:00.000Z',
          tipo: 'fechamento',
          canal: 'visita',
          descricao: 'Contrato assinado! Cliente ativo ganho. Primeiro faturamento emitido.',
          autor: 'Gabriel Maciel'
        }
      ]
    },
    {
      id: 'lead-maciel-03',
      nome: 'LogTech Centro de Distribuição Cajamar',
      contatoNome: 'Carlos Eduardo (Coordenador de Almoxarifado)',
      telefone: '(11) 99432-8877',
      vendedorId: 'maciel',
      estagio: 'proposta',
      segmento: 'Indústria / Logística',
      tipoCliente: 'distribuidor',
      produtosInteresse: [
        'Papel Higiênico Rolão 500 Metros',
        'Papel Toalha Bobina Autocorte 200 Metros'
      ],
      volumeMensal: '220 fardos/mês Rolão 500m + 150 fardos Bobina Autocorte',
      valorProposta: 23600.00,
      prazoPagamento: '30 DDL',
      amostraEnviada: false,
      amostraDetalhe: 'Aguardando agendamento de entrega de teste das bobinas autocorte.',
      dataCriacao: '2026-10-28T14:00:00.000Z',
      dataUltimoContato: '2026-10-28T17:45:00.000Z',
      prazoFollowUp: '2026-10-30T09:30:00.000Z',
      observacoes: 'Proposta enviada há mais de 24h. Necessário alinhar janela de descarregamento na frota própria Isapel.',
      historico: [
        {
          id: 'hist-8',
          data: '2026-10-28T14:00:00.000Z',
          tipo: 'contato',
          canal: 'whatsapp',
          descricao: 'Abordagem ao coordenador de almoxarifado do hub de Cajamar.',
          autor: 'Gabriel Maciel'
        },
        {
          id: 'hist-9',
          data: '2026-10-28T17:45:00.000Z',
          tipo: 'proposta',
          canal: 'email',
          descricao: 'Cotação enviada com preço unitário competitivo para alto volume e frete CIF garantido.',
          autor: 'Gabriel Maciel'
        }
      ]
    },

    // --- FERNANDA (Hotelaria, Faculdades, Frigoríficos, Academias) ---
    {
      id: 'lead-fernanda-01',
      nome: 'Rede Hotel Fasano & Suítes São Paulo',
      contatoNome: 'Letícia Fontana (Governanta Geral)',
      telefone: '(11) 98341-9988',
      vendedorId: 'fernanda',
      estagio: 'negociacao',
      segmento: 'Hotelaria & Gastronomia',
      tipoCliente: 'consumidor_final',
      produtosInteresse: [
        'Papel Toalha Interfolha Luxo Extra Branco (3 Dobras)',
        'Papel Higiênico Cai-Cai Intercalado Folha Dupla',
        'Sabonete Espuma Refil 800ml'
      ],
      volumeMensal: '90 fardos Interfolha Luxo + 60 fardos Cai-Cai + 40 caixas Sabonete',
      valorProposta: 13900.00,
      prazoPagamento: '28 DDL',
      amostraEnviada: true,
      amostraDetalhe: 'Kit de amostras de Toalha Interfolha Luxo testado na ala de convenções com excelente receptividade.',
      dataCriacao: '2026-10-26T10:00:00.000Z',
      dataUltimoContato: '2026-10-29T15:30:00.000Z',
      prazoFollowUp: '2026-10-30T11:00:00.000Z',
      observacoes: 'Pendente envio da minuta de contrato com garantia de lote homogêneo 100% Celulose Virgem.',
      historico: [
        {
          id: 'hist-10',
          data: '2026-10-26T10:00:00.000Z',
          tipo: 'contato',
          canal: 'visita',
          descricao: 'Reunião presencial com a governanta Letícia. Foco total em maciez e ausência de odor no papel.',
          autor: 'Fernanda'
        },
        {
          id: 'hist-11',
          data: '2026-10-27T14:00:00.000Z',
          tipo: 'amostra',
          canal: 'visita',
          descricao: 'Entrega de fardos de teste da linha Luxo 3 Dobras.',
          autor: 'Fernanda'
        },
        {
          id: 'hist-12',
          data: '2026-10-29T15:30:00.000Z',
          tipo: 'negociacao',
          canal: 'whatsapp',
          descricao: 'Letícia aprovou a qualidade. Ajustando apenas se a entrega pode ser feita no início da manhã.',
          autor: 'Fernanda'
        }
      ]
    },
    {
      id: 'lead-fernanda-02',
      nome: 'Complexo Universitário Vale do Paraíba',
      contatoNome: 'Prof. Sérgio Meirelles (Diretor Administrativo)',
      telefone: '(12) 99182-3344',
      vendedorId: 'fernanda',
      estagio: 'proposta',
      segmento: 'Educação / Universidades',
      tipoCliente: 'licitacao',
      produtosInteresse: [
        'Papel Toalha Interfolha 100% Celulose Virgem (2 Dobras)',
        'Papel Higiênico Rolão 300 Metros'
      ],
      volumeMensal: '140 fardos Interfolha + 110 fardos Rolão',
      valorProposta: 16250.00,
      prazoPagamento: '28 DDL',
      amostraEnviada: false,
      amostraDetalhe: 'Aguardando validação da cotação para despachar amostra de Interfolha.',
      dataCriacao: '2026-10-28T09:40:00.000Z',
      dataUltimoContato: '2026-10-28T16:20:00.000Z',
      prazoFollowUp: '2026-10-30T14:00:00.000Z',
      observacoes: 'Proposta encaminhada há mais de 24h. Oportunidade perfeita para encaixar na Rota Vale do Paraíba da Frota Isapel.',
      historico: [
        {
          id: 'hist-13',
          data: '2026-10-28T09:40:00.000Z',
          tipo: 'contato',
          canal: 'ligacao',
          descricao: 'Contato com setor de compras do campus universitário em Taubaté.',
          autor: 'Fernanda'
        },
        {
          id: 'hist-14',
          data: '2026-10-28T16:20:00.000Z',
          tipo: 'proposta',
          canal: 'email',
          descricao: 'Proposta formal enviada com tabela de preços diferenciada para instituição de ensino.',
          autor: 'Fernanda'
        }
      ]
    },
    {
      id: 'lead-fernanda-03',
      nome: 'Frigorífico Granja do Sul Santos Dumont',
      contatoNome: 'Marcelo Pires (Gerente de Higienização)',
      telefone: '(35) 98822-1100',
      vendedorId: 'fernanda',
      estagio: 'qualificacao',
      segmento: 'Indústria / Alimentos',
      tipoCliente: 'consumidor_final',
      produtosInteresse: [
        'Papel Toalha Bobina Autocorte 200 Metros 100% Celulose',
        'Sabonete Espuma Refil 800ml'
      ],
      volumeMensal: '160 fardos Bobina Autocorte',
      valorProposta: 0,
      prazoPagamento: 'A definir',
      amostraEnviada: false,
      amostraDetalhe: '',
      dataCriacao: '2026-10-29T10:15:00.000Z',
      dataUltimoContato: '2026-10-29T10:15:00.000Z',
      prazoFollowUp: '2026-10-30T09:00:00.000Z',
      observacoes: 'DDD 35 (Sul de Minas) atendido pela rota direta de frota da divisa de SP. Necessário qualificar exigências do SIF.',
      historico: [
        {
          id: 'hist-15',
          data: '2026-10-29T10:15:00.000Z',
          tipo: 'contato',
          canal: 'whatsapp',
          descricao: 'Primeiro contato realizado. Marcelo solicitou laudo de atoxidade do papel toalha bobina para uso em área de desossa.',
          autor: 'Fernanda'
        }
      ]
    },

    // --- CAIO (Hunter, SDR, Prospecção Ativa B2B) ---
    {
      id: 'lead-caio-01',
      nome: 'Rede OdontoCare Clínicas Especializadas',
      contatoNome: 'Dra. Beatriz Nogueira',
      telefone: '(19) 99654-7711',
      vendedorId: 'caio',
      estagio: 'novo',
      segmento: 'Clínicas / Consultórios',
      tipoCliente: 'consumidor_final',
      produtosInteresse: [
        'Papel Toalha Interfolha 100% Celulose Virgem (2 Dobras)'
      ],
      volumeMensal: '40 fardos/mês em 4 unidades em Americana e Santa Bárbara',
      valorProposta: 0,
      prazoPagamento: 'Boleto 14/28 DDL',
      amostraEnviada: false,
      amostraDetalhe: '',
      dataCriacao: '2026-10-29T16:30:00.000Z',
      dataUltimoContato: null,
      prazoFollowUp: '2026-10-30T08:30:00.000Z',
      observacoes: 'Lead captado por prospecção ativa. Alta probabilidade de encaixe logístico na rota diária Campinas/RMC.',
      historico: [
        {
          id: 'hist-16',
          data: '2026-10-29T16:30:00.000Z',
          tipo: 'cadastro',
          canal: 'whatsapp',
          descricao: 'Lead inserido via formulário rápido. Fazer ligação de qualificação para mapear consumo exato.',
          autor: 'Caio'
        }
      ]
    },
    {
      id: 'lead-caio-02',
      nome: 'Galpões Industriais & Logística RodoVale Sorocaba',
      contatoNome: 'Cláudio Sanches (Operações)',
      telefone: '(15) 98112-9922',
      vendedorId: 'caio',
      estagio: 'qualificacao',
      segmento: 'Indústria / Logística',
      tipoCliente: 'outro',
      produtosInteresse: [
        'Papel Higiênico Rolão Institucional 300 Metros',
        'Papel Toalha Interfolha 100% Celulose Virgem (2 Dobras)'
      ],
      volumeMensal: '90 fardos Rolão + 60 fardos Interfolha',
      valorProposta: 0,
      prazoPagamento: 'A definir',
      amostraEnviada: false,
      amostraDetalhe: '',
      dataCriacao: '2026-10-28T11:00:00.000Z',
      dataUltimoContato: '2026-10-29T09:30:00.000Z',
      prazoFollowUp: '2026-10-30T10:30:00.000Z',
      observacoes: 'DDD 15 coberto pela frota própria Isapel Sorocaba. Cláudio confirmou interesse em comodato de 20 toalheiros.',
      historico: [
        {
          id: 'hist-17',
          data: '2026-10-28T11:00:00.000Z',
          tipo: 'cadastro',
          canal: 'whatsapp',
          descricao: 'Lead prospectado no condomínio industrial de Sorocaba.',
          autor: 'Caio'
        },
        {
          id: 'hist-18',
          data: '2026-10-29T09:30:00.000Z',
          tipo: 'contato',
          canal: 'ligacao',
          descricao: 'Qualificação realizada: consumo de 90 fardos de Rolão por mês. Estão insatisfeitos com a entrega do concorrente que quebra com frequência.',
          autor: 'Caio'
        }
      ]
    },
    {
      id: 'lead-caio-03',
      nome: 'Rede FarmaMais Distribuidora Paraná',
      contatoNome: 'Vanessa Guimarães (Compras Corporativas)',
      telefone: '(41) 98777-6543',
      vendedorId: 'caio',
      estagio: 'proposta',
      segmento: 'Distribuição / Farmacêutico',
      tipoCliente: 'distribuidor',
      produtosInteresse: [
        'Papel Toalha Interfolha 100% Celulose Virgem (2 Dobras)',
        'Papel Higiênico Rolão 300 Metros'
      ],
      volumeMensal: '110 fardos Interfolha + 70 fardos Rolão',
      valorProposta: 15400.00,
      prazoPagamento: '28 DDL',
      amostraEnviada: true,
      amostraDetalhe: 'Amostras despachadas na linha direta de Curitiba/RMC.',
      dataCriacao: '2026-10-27T15:20:00.000Z',
      dataUltimoContato: '2026-10-28T14:10:00.000Z',
      prazoFollowUp: '2026-10-30T11:30:00.000Z',
      observacoes: 'DDD 41 com Rota Direta Isapel. Cotação feita com frete CIF incluso.',
      historico: [
        {
          id: 'hist-19',
          data: '2026-10-27T15:20:00.000Z',
          tipo: 'contato',
          canal: 'ligacao',
          descricao: 'Prospecção em Curitiba. Vanessa atendeu prontamente pedindo cotação de fardos fechados.',
          autor: 'Caio'
        },
        {
          id: 'hist-20',
          data: '2026-10-28T14:10:00.000Z',
          tipo: 'proposta',
          canal: 'email',
          descricao: 'Proposta comercial formalizada. Confirmado frete CIF pela rota PR Isapel.',
          autor: 'Caio'
        }
      ]
    }
  ];

  // ==========================================================================
  // 4. CAMADA DE PERSISTÊNCIA (LOCALSTORAGE COM FALLBACK EM MEMÓRIA)
  // ==========================================================================
  const STORAGE_KEY_LEADS = 'isapel_crm_leads_v1';
  const STORAGE_KEY_NOTAS = 'isapel_crm_notas_diarias_v1';

  let memoriaLeads = null;
  let memoriaNotas = [];

  function isLocalStorageDisponivel() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const testKey = '__isapel_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  function carregarLeadsArmazenados() {
    if (memoriaLeads && Array.isArray(memoriaLeads)) {
      return memoriaLeads;
    }

    if (isLocalStorageDisponivel()) {
      try {
        const dados = window.localStorage.getItem(STORAGE_KEY_LEADS);
        if (dados !== null) {
          const parsed = JSON.parse(dados);
          if (Array.isArray(parsed)) {
            // Garante migração transparente de tipoCliente se ausente
            memoriaLeads = parsed.map(lead => {
              if (lead.tipoCliente === undefined) {
                const inicial = LEADS_INICIAIS.find(li => li.id === lead.id);
                lead.tipoCliente = inicial ? inicial.tipoCliente : '';
              }
              return lead;
            });
            return memoriaLeads;
          }
        }
      } catch (err) {
        console.warn('Erro ao ler leads do localStorage:', err);
      }
    }

    // Inicializa com leads demonstrativos apenas na primeira execução limpa
    memoriaLeads = LEADS_INICIAIS.map(lead => enriquecerLeadComDDD(lead));
    salvarLeads(memoriaLeads);
    return memoriaLeads;
  }

  function salvarLeads(leads) {
    memoriaLeads = Array.isArray(leads) ? leads : [];
    if (isLocalStorageDisponivel()) {
      try {
        window.localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(memoriaLeads));
      } catch (err) {
        console.error('Erro ao salvar leads no localStorage:', err);
      }
    }
  }

  /**
   * Reconciliação inteligente e não-destrutiva entre o estado local e os dados da nuvem (Supabase).
   * Diretrizes R1, R2, R3 e R4:
   * 1. Nunca remove leads locais que ainda não foram sincronizados na nuvem (ex: cadastros recentes ou offline).
   * 2. Preserva tipoCliente local se o registro remoto vier sem essa classificação.
   * 3. Preserva estágio, valores e notas locais caso o lead local tenha atualização mais recente ou pendência de sync.
   * 4. Persiste o conjunto consolidado em memoriaLeads e localStorage (chave 'isapel_crm_leads_v1').
   */
  function mesclarLeadsNuvem(novosLeads) {
    if (!Array.isArray(novosLeads)) {
      return carregarLeadsArmazenados();
    }

    const leadsLocais = carregarLeadsArmazenados();
    const mapaLocais = new Map();
    leadsLocais.forEach(l => {
      if (l && l.id) {
        mapaLocais.set(String(l.id), { ...l });
      }
    });

    const resultadoMesclado = [];
    const idsRemotosProcessados = new Set();

    novosLeads.forEach(leadRemotoBruto => {
      if (!leadRemotoBruto || !leadRemotoBruto.id) return;
      const leadRemoto = enriquecerLeadComDDD(leadRemotoBruto);
      const idKey = String(leadRemoto.id);
      idsRemotosProcessados.add(idKey);
      const leadLocal = mapaLocais.get(idKey);

      if (!leadLocal) {
        resultadoMesclado.push(leadRemoto);
        return;
      }

      // Conflito / fusão de propriedades
      const mesclado = { ...leadLocal, ...leadRemoto };

      // 1. Preservar tipoCliente local se o remoto estiver vazio
      if (leadLocal.tipoCliente && !leadRemoto.tipoCliente) {
        mesclado.tipoCliente = leadLocal.tipoCliente;
      } else if (leadRemoto.tipoCliente) {
        mesclado.tipoCliente = leadRemoto.tipoCliente;
      }

      // 2. Extrair e comparar timestamps de atualização
      const extrairTimestamp = (obj) => {
        if (!obj) return 0;
        const d = obj.dataAtualizacao || obj.data_atualizacao || obj.dataUltimoContato;
        if (!d) return 0;
        const t = new Date(d).getTime();
        return isNaN(t) ? 0 : t;
      };

      const tsLocal = Math.max(extrairTimestamp(leadLocal), leadLocal._tsLocal || 0);
      const tsRemoto = extrairTimestamp(leadRemoto);

      // Se a versão local tiver sido alterada mais recentemente que a da nuvem ou tiver pendência de sincronização
      if (tsLocal > tsRemoto || leadLocal._pendenteSync) {
        mesclado.estagio = leadLocal.estagio || mesclado.estagio;
        mesclado.valorProposta = (leadLocal.valorProposta !== undefined && leadLocal.valorProposta !== null)
          ? leadLocal.valorProposta
          : mesclado.valorProposta;
        mesclado.dataUltimoContato = leadLocal.dataUltimoContato || mesclado.dataUltimoContato;
        mesclado.dataAtualizacao = leadLocal.dataAtualizacao || leadLocal.data_atualizacao || new Date().toISOString();
        if (leadLocal.tipoCliente) {
          mesclado.tipoCliente = leadLocal.tipoCliente;
        }
        if (Array.isArray(leadLocal.historico) && leadLocal.historico.length > (leadRemoto.historico || []).length) {
          mesclado.historico = leadLocal.historico;
        }
      }

      resultadoMesclado.push(enriquecerLeadComDDD(mesclado));
      mapaLocais.delete(idKey);
    });

    // 3. Adicionar leads locais que ainda não constam na lista remota (novos clientes cadastrados localmente)
    const leadsLocaisPendentes = [];
    mapaLocais.forEach(leadLocal => {
      leadsLocaisPendentes.push(enriquecerLeadComDDD(leadLocal));
    });

    memoriaLeads = [...leadsLocaisPendentes, ...resultadoMesclado];
    salvarLeads(memoriaLeads);
    return memoriaLeads;
  }

  function definirLeads(novosLeads, options) {
    if (!Array.isArray(novosLeads)) return carregarLeadsArmazenados();
    if (options && options.forcarSubstituicao === true) {
      memoriaLeads = novosLeads.map(l => enriquecerLeadComDDD(l));
      salvarLeads(memoriaLeads);
      return memoriaLeads;
    }
    return mesclarLeadsNuvem(novosLeads);
  }

  /**
   * Enriquece um objeto de Lead derivando automaticamente DDD, Cidade, Região, Estado e Rota Logística
   */
  function enriquecerLeadComDDD(lead) {
    const infoDDD = resolverInformacoesDDD(lead.telefone);
    const dddExtraido = extrairDDDDeTelefone(lead.telefone);

    return {
      ...lead,
      ddd: dddExtraido || lead.ddd || null,
      cidade: lead.cidade || infoDDD.cidade,
      regiao: lead.regiao || infoDDD.regiao,
      uf: lead.uf || infoDDD.uf,
      logistica: infoDDD.logistica,
      rotaLogistica: infoDDD.rotaLogistica,
      tempoEntrega: infoDDD.tempoEntrega,
      frotaPropria: infoDDD.frotaPropria,
      tipoFretePadrao: infoDDD.tipoFretePadrao,
      tipoCliente: lead.tipoCliente || '',
      telefoneFormatado: formatarTelefone(lead.telefone),
      telefonePuro: String(lead.telefone || '').replace(/\D/g, '')
    };
  }

  // ==========================================================================
  // 5. MOTOR DE OPERAÇÕES DE LEADS (CRUD & FUNIL B2B)
  // ==========================================================================

  /**
   * Adiciona um novo Lead com entrada rápida (apenas Nome e Telefone obrigatórios)
   * Deriva automaticamente DDD, Cidade, Região, Estado e Logística Isapel.
   */
  function cadastrarLeadRapido(dados) {
    if (!dados || !dados.nome || !dados.telefone) {
      throw new Error('Nome e Telefone são obrigatórios para cadastro do lead.');
    }

    const leads = carregarLeadsArmazenados();
    const id = 'lead-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const agora = new Date().toISOString();

    const novoLeadBase = {
      id: id,
      nome: String(dados.nome).trim(),
      contatoNome: dados.contatoNome ? String(dados.contatoNome).trim() : 'A/C Compras & Almoxarifado',
      telefone: String(dados.telefone).trim(),
      vendedorId: dados.vendedorId || 'maciel',
      estagio: dados.estagio || 'novo',
      segmento: dados.segmento || 'Corporativo / Geral',
      tipoCliente: dados.tipoCliente || dados.tipo || '',
      produtosInteresse: Array.isArray(dados.produtosInteresse) && dados.produtosInteresse.length > 0
        ? dados.produtosInteresse
        : ['Papel Toalha Interfolha 100% Celulose Virgem (2 Dobras)'],
      volumeMensal: dados.volumeMensal || 'Consumo a qualificar',
      valorProposta: Number(dados.valorProposta) || 0,
      prazoPagamento: dados.prazoPagamento || 'Boleto 28 DDL',
      amostraEnviada: Boolean(dados.amostraEnviada),
      amostraDetalhe: dados.amostraDetalhe || '',
      dataCriacao: agora,
      dataAtualizacao: agora,
      _tsLocal: Date.now(),
      dataUltimoContato: dados.observacoes ? agora : null,
      prazoFollowUp: dados.prazoFollowUp || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      observacoes: dados.observacoes || 'Lead cadastrado via formulário de entrada rápida.',
      historico: [
        {
          id: 'hist-' + Date.now(),
          data: agora,
          tipo: 'cadastro',
          canal: 'sistema',
          descricao: `Lead cadastrado na carteira do consultor ${VENDEDORES_CONFIG[dados.vendedorId]?.nome || 'Comercial'}.`,
          autor: VENDEDORES_CONFIG[dados.vendedorId]?.nome || 'Sistema'
        }
      ]
    };

    if (dados.observacoes) {
      novoLeadBase.historico.push({
        id: 'hist-' + (Date.now() + 1),
        data: agora,
        tipo: 'nota',
        canal: 'anotacao',
        descricao: String(dados.observacoes).trim(),
        autor: VENDEDORES_CONFIG[dados.vendedorId]?.nome || 'Sistema'
      });
    }

    const leadCompleto = enriquecerLeadComDDD(novoLeadBase);
    leads.unshift(leadCompleto);
    salvarLeads(leads);

    return leadCompleto;
  }

  /**
   * Atualiza dados de um Lead existente
   */
  function atualizarLead(id, updates) {
    const leads = carregarLeadsArmazenados();
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error(`Lead com ID ${id} não encontrado.`);
    }

    const leadAtual = leads[index];
    const agora = new Date().toISOString();
    const leadAtualizado = {
      ...leadAtual,
      ...updates,
      dataAtualizacao: agora,
      _tsLocal: Date.now()
    };

    // Se o telefone foi atualizado, reprocessa as diretrizes de DDD e Logística
    if (updates.telefone && updates.telefone !== leadAtual.telefone) {
      Object.assign(leadAtualizado, enriquecerLeadComDDD(leadAtualizado));
    }

    leads[index] = leadAtualizado;
    salvarLeads(leads);
    return leadAtualizado;
  }

  /**
   * Move o estágio do funil do Lead e registra no histórico de atividades
   */
  function moverEstagioLead(id, novoEstagio, notaDescricao, autorNome) {
    if (!ETAPAS_FUNIL[novoEstagio]) {
      throw new Error(`Estágio inválido: ${novoEstagio}. Use: ${Object.keys(ETAPAS_FUNIL).join(', ')}`);
    }

    const leads = carregarLeadsArmazenados();
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error(`Lead com ID ${id} não encontrado.`);
    }

    const agora = new Date().toISOString();
    const lead = leads[index];
    const estagioAnterior = lead.estagio;
    lead.estagio = novoEstagio;
    lead.dataUltimoContato = agora;
    lead.dataAtualizacao = agora;
    lead._tsLocal = Date.now();

    const autor = autorNome || VENDEDORES_CONFIG[lead.vendedorId]?.nome || 'Comercial';
    const desc = notaDescricao
      ? `${notaDescricao} (Avanço: ${ETAPAS_FUNIL[estagioAnterior]?.titulo || estagioAnterior} ➔ ${ETAPAS_FUNIL[novoEstagio].titulo})`
      : `Estágio alterado para: ${ETAPAS_FUNIL[novoEstagio].titulo}`;

    if (!Array.isArray(lead.historico)) {
      lead.historico = [];
    }

    lead.historico.push({
      id: 'hist-' + Date.now(),
      data: agora,
      tipo: 'mudanca_estagio',
      canal: 'funil',
      estagioDe: estagioAnterior,
      estagioPara: novoEstagio,
      descricao: desc,
      autor: autor
    });

    leads[index] = lead;
    salvarLeads(leads);
    return lead;
  }

  /**
   * Registra um contato ou anotação comercial na linha do tempo do lead
   */
  function registrarContatoLead(id, contatoData) {
    if (typeof contatoData === 'string') {
      contatoData = { descricao: contatoData };
    } else if (!contatoData || typeof contatoData !== 'object') {
      contatoData = {};
    }

    const leads = carregarLeadsArmazenados();
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error(`Lead com ID ${id} não encontrado.`);
    }

    const agora = new Date().toISOString();
    const lead = leads[index];
    lead.dataUltimoContato = agora;

    if (contatoData.prazoFollowUp) {
      lead.prazoFollowUp = contatoData.prazoFollowUp;
    }

    if (contatoData.amostraEnviada !== undefined) {
      lead.amostraEnviada = Boolean(contatoData.amostraEnviada);
      if (contatoData.amostraDetalhe) {
        lead.amostraDetalhe = contatoData.amostraDetalhe;
      }
    }

    if (contatoData.valorProposta !== undefined && Number(contatoData.valorProposta) > 0) {
      lead.valorProposta = Number(contatoData.valorProposta);
    }

    const autor = contatoData.autor || VENDEDORES_CONFIG[lead.vendedorId]?.nome || 'Comercial';

    if (!Array.isArray(lead.historico)) {
      lead.historico = [];
    }

    const novoHistorico = {
      id: 'hist-' + Date.now(),
      data: agora,
      tipo: contatoData.tipo || 'contato',
      canal: contatoData.canal || 'whatsapp',
      descricao: contatoData.descricao || 'Contato comercial realizado.',
      autor: autor
    };

    lead.observacoes = novoHistorico.descricao;
    lead.historico.push(novoHistorico);
    leads[index] = lead;
    salvarLeads(leads);
    return lead;
  }

  /**
   * Remove um lead pelo ID
   */
  function removerLead(id) {
    const leads = carregarLeadsArmazenados();
    const novosLeads = leads.filter(l => l.id !== id);
    if (novosLeads.length === leads.length) {
      return false;
    }
    salvarLeads(novosLeads);
    return true;
  }

  /**
   * Obtém leads com filtros opcionais
   */
  function listarLeads(filtros) {
    let leads = carregarLeadsArmazenados();
    if (!filtros) return leads;

    if (filtros.vendedorId && filtros.vendedorId !== 'todos') {
      leads = leads.filter(l => l.vendedorId === filtros.vendedorId);
    }

    if (filtros.estagio && filtros.estagio !== 'todos') {
      leads = leads.filter(l => l.estagio === filtros.estagio);
    }

    if (filtros.uf && filtros.uf !== 'todos') {
      leads = leads.filter(l => l.uf === filtros.uf);
    }

    if (filtros.ddd) {
      const dddFiltro = parseInt(filtros.ddd, 10);
      leads = leads.filter(l => l.ddd === dddFiltro);
    }

    if (filtros.frotaPropria !== undefined) {
      leads = leads.filter(l => Boolean(l.frotaPropria) === Boolean(filtros.frotaPropria));
    }

    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      leads = leads.filter(l =>
        (l.nome && l.nome.toLowerCase().includes(termo)) ||
        (l.contatoNome && l.contatoNome.toLowerCase().includes(termo)) ||
        (l.cidade && l.cidade.toLowerCase().includes(termo)) ||
        (l.telefone && l.telefone.includes(termo)) ||
        (l.segmento && l.segmento.toLowerCase().includes(termo))
      );
    }

    return leads;
  }

  function obterLeadPorId(id) {
    const leads = carregarLeadsArmazenados();
    return leads.find(l => l.id === id) || null;
  }

  // ==========================================================================
  // 6. ARENA DE COMPETIÇÃO & MÉTRICAS COMERCIAIS
  // ==========================================================================

  /**
   * Calcula as métricas e ranking de performance comercial da equipe
   * Sistema de pontos:
   *  +10 pts por cadastro
   *  +15 pts por contato/anotação realizada
   *  +25 pts por proposta enviada
   *  +40 pts por negociação/amostra entregue
   *  +100 pts por fechamento/ganho
   */
  function calcularMetricasArena(vendedorIdFiltro, leadsCustomizados) {
    carregarVendedoresDinamicos();
    const leads = Array.isArray(leadsCustomizados) ? leadsCustomizados : carregarLeadsArmazenados();
    const vendedoresKeys = Object.keys(VENDEDORES_CONFIG);

    const resultados = vendedoresKeys.map(vid => {
      const vendedor = VENDEDORES_CONFIG[vid];
      const leadsDoVendedor = leads.filter(l => l.vendedorId === vid);

      const totalCadastrados = leadsDoVendedor.length;

      // Contagem por estágio exata
      const leadsPorEstagio = {
        novo: 0,
        qualificacao: 0,
        proposta: 0,
        negociacao: 0,
        fechado: 0,
        perdido: 0
      };

      let totalContatos = 0;
      let totalAmostras = 0;
      let volumeTotalFaturado = 0;

      leadsDoVendedor.forEach(l => {
        if (leadsPorEstagio[l.estagio] !== undefined) {
          leadsPorEstagio[l.estagio]++;
        }
        if (l.amostraEnviada) {
          totalAmostras++;
        }
        if (l.estagio === 'fechado') {
          volumeTotalFaturado += (Number(l.valorProposta) || 0);
        }

        // Histórico de contatos e anotações reais
        if (Array.isArray(l.historico) && l.historico.length > 0) {
          totalContatos += l.historico.length;
        } else if (l.observacoes && String(l.observacoes).trim().length > 0) {
          totalContatos += 1;
        }
      });

      const totalFechados = leadsPorEstagio.fechado;
      const taxaConversao = totalCadastrados > 0
        ? Math.round((totalFechados / totalCadastrados) * 1000) / 10
        : 0;

      // Cálculo do Score de Pontuação da Arena (XP)
      const bonusFaturamentoXP = Math.round(volumeTotalFaturado / 100);
      const pontuacaoGeral = (
        (totalCadastrados * 10) +
        (totalContatos * 15) +
        (leadsPorEstagio.proposta * 25) +
        (leadsPorEstagio.negociacao * 40) +
        (totalFechados * 100) +
        bonusFaturamentoXP
      );

      return {
        vendedorId: vid,
        vendedor: vendedor,
        totalCadastrados: totalCadastrados,
        totalContatos: totalContatos,
        totalAmostras: totalAmostras,
        leadsPorEstagio: leadsPorEstagio,
        totalFechados: totalFechados,
        volumeTotalFaturado: volumeTotalFaturado,
        taxaConversao: taxaConversao,
        pontuacaoGeral: pontuacaoGeral
      };
    });

    // Ordenação do ranking da arena por pontuação decrescente
    resultados.sort((a, b) => b.pontuacaoGeral - a.pontuacaoGeral);

    // Atribui posições (1º, 2º, 3º lugar)
    const rankingComPosicao = resultados.map((item, idx) => ({
      ...item,
      posicaoRanking: idx + 1
    }));

    if (vendedorIdFiltro && vendedorIdFiltro !== 'todos') {
      return rankingComPosicao.find(r => r.vendedorId === vendedorIdFiltro) || null;
    }

    return rankingComPosicao;
  }

  // ==========================================================================
  // 7. MOTOR DE FECHAMENTO DIÁRIO & PLANO DE AÇÕES COMERCIAIS TÁTICAS
  // ==========================================================================

  /**
   * Gera o Fechamento Diário e o Plano Tático de Ações Comerciais para o próximo dia.
   * IMPORTANTE: Focado 100% em ações comerciais táticas para leads qualificados
   * (NENHUM cálculo de comissão ou bonificação financeira monetária).
   */
  function gerarFechamentoDiario(dataReferenciaStr) {
    const hoje = dataReferenciaStr ? new Date(dataReferenciaStr) : new Date();
    const dataFormatadaISO = hoje.toISOString().split('T')[0];
    const dataFormatadaBR = hoje.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const leads = carregarLeadsArmazenados();
    const metricasArena = calcularMetricasArena();

    // 1. Resumo Executivo das movimentações
    let contatosRealizadosHoje = 0;
    let novasCotacoesHoje = 0;
    let amostrasEnviadasHoje = 0;
    let clientesGanhosHoje = 0;
    let leadsEmNegociacao = [];
    let leadsEmProposta = [];
    let leadsNovosEQualificacao = [];

    leads.forEach(l => {
      // Verifica se houve movimentação hoje no histórico
      if (Array.isArray(l.historico)) {
        l.historico.forEach(h => {
          if (h.data && h.data.startsWith(dataFormatadaISO)) {
            if (['contato', 'nota'].includes(h.tipo)) contatosRealizadosHoje++;
            if (h.tipo === 'proposta') novasCotacoesHoje++;
            if (h.tipo === 'amostra') amostrasEnviadasHoje++;
            if (h.tipo === 'fechamento') clientesGanhosHoje++;
          }
        });
      }

      // Agrupamentos táticos para o plano
      if (l.estagio === 'negociacao') {
        leadsEmNegociacao.push(l);
      } else if (l.estagio === 'proposta') {
        leadsEmProposta.push(l);
      } else if (['novo', 'qualificacao'].includes(l.estagio)) {
        leadsNovosEQualificacao.push(l);
      }
    });

    // Se for dia de demonstração sem registros no exato momento, consolida o estado operacional real:
    const totalNegociacao = leadsEmNegociacao.length;
    const totalProposta = leadsEmProposta.length;
    const totalNovosQualif = leadsNovosEQualificacao.length;
    const totalFechadosGeral = leads.filter(l => l.estagio === 'fechado').length;

    // 2. CONSTRUÇÃO DO PLANO DE AÇÕES TÁTICAS DO PRÓXIMO DIA (3 NÍVEIS DE PRIORIDADE)

    // 🔴 PRIORIDADE ALTA: Leads em Negociação (Fechamento imediato, envio de amostras ou minuta)
    const acoesPrioridadeAlta = leadsEmNegociacao.map(lead => {
      const vendedor = VENDEDORES_CONFIG[lead.vendedorId]?.nome || 'Consultor Comercial';
      let acaoRecomendada = '';
      let justificativa = '';

      if (lead.amostraEnviada) {
        acaoRecomendada = `Cobrar retorno imediato sobre teste das amostras de ${lead.produtosInteresse?.[0] || 'Papel Toalha Interfolha'} e enviar minuta comercial de fechamento com prazo ${lead.prazoPagamento || '28 DDL'}.`;
        justificativa = `Amostra já homologada no cliente. Janela de conversão aberta para faturamento na Frota Isapel.`;
      } else {
        acaoRecomendada = `Despachar com urgência kit de amostras físicas de Papel Toalha Interfolha 100% Celulose Virgem e agendar alinhamento de preços.`;
        justificativa = `Lead em estágio quente de negociação necessitando apenas de validação técnica do produto.`;
      }

      return {
        prioridade: 'ALTA',
        tag: '🔴 Prioridade Alta - Fechamento & Amostra',
        leadId: lead.id,
        empresa: lead.nome,
        decisor: lead.contatoNome,
        telefone: lead.telefoneFormatado || lead.telefone,
        cidade: lead.cidade,
        uf: lead.uf,
        logistica: lead.logistica,
        vendedorResponsavel: vendedor,
        valorEstimado: lead.valorProposta || 0,
        acaoRecomendada: acaoRecomendada,
        justificativa: justificativa,
        produtosChave: lead.produtosInteresse
      };
    });

    // 🟡 PRIORIDADE MÉDIA: Leads em Proposta (Follow-up de cotações com mais de 24h & Frete CIF Isapel)
    const acoesPrioridadeMedia = leadsEmProposta.map(lead => {
      const vendedor = VENDEDORES_CONFIG[lead.vendedorId]?.nome || 'Consultor Comercial';
      const argumentoFrete = lead.frotaPropria
        ? `Destacar frete CIF 100% gratuito pela frota própria Isapel com entrega em até ${lead.tempoEntrega || '48h'}.`
        : `Apresentar cotação de transportadora parceira com tabela especial de fardos fechados.`;

      return {
        prioridade: 'MEDIA',
        tag: '🟡 Prioridade Média - Follow-up de Cotação',
        leadId: lead.id,
        empresa: lead.nome,
        decisor: lead.contatoNome,
        telefone: lead.telefoneFormatado || lead.telefone,
        cidade: lead.cidade,
        uf: lead.uf,
        logistica: lead.logistica,
        vendedorResponsavel: vendedor,
        valorProposta: lead.valorProposta || 0,
        acaoRecomendada: `Realizar contato de follow-up da proposta enviada. ${argumentoFrete}`,
        justificativa: `Proposta ativa há mais de 24 horas no cliente. Evitar que o concorrente cubra o preço.`,
        produtosChave: lead.produtosInteresse
      };
    });

    // 🔵 PRIORIDADE ESTRATÉGICA: Leads em Novo / Qualificação Agrupados por Rota de Frota Isapel
    // Agrupa por rota regional para otimização logística de entrega
    const rotasAgrupadas = {};
    leadsNovosEQualificacao.forEach(lead => {
      const rotaNome = lead.rotaLogistica || 'Rota Padrão Distribuição';
      if (!rotasAgrupadas[rotaNome]) {
        rotasAgrupadas[rotaNome] = {
          nomeRota: rotaNome,
          uf: lead.uf,
          frotaPropria: lead.frotaPropria,
          leads: []
        };
      }
      rotasAgrupadas[rotaNome].leads.push({
        leadId: lead.id,
        empresa: lead.nome,
        contato: lead.contatoNome,
        telefone: lead.telefoneFormatado || lead.telefone,
        cidade: lead.cidade,
        estagio: ETAPAS_FUNIL[lead.estagio]?.titulo || lead.estagio,
        vendedor: VENDEDORES_CONFIG[lead.vendedorId]?.nome || lead.vendedorId
      });
    });

    const acoesPrioridadeEstrategica = Object.values(rotasAgrupadas).map(rota => ({
      prioridade: 'ESTRATEGICA',
      tag: '🔵 Prioridade Estratégica - Agrupamento Logístico de Frota',
      rotaLogistica: rota.nomeRota,
      uf: rota.uf,
      frotaPropria: rota.frotaPropria,
      totalLeadsRota: rota.leads.length,
      acaoRecomendada: `Concentrar ligações e prospecções nos clientes da ${rota.nomeRota}. Unificar pedidos para otimizar a cubagem e o custo de frete do caminhão Isapel.`,
      leadsAssociados: rota.leads
    }));

    // Estrutura completa do Fechamento Diário
    const relatorioFechamento = {
      empresa: 'Isapel Papéis - Indústria e Comércio B2B',
      documento: 'Fechamento Diário & Plano Tático Comercial',
      dataReferencia: dataFormatadaISO,
      dataExtenso: dataFormatadaBR,
      geradoEm: new Date().toISOString(),

      resumoOperacionalDia: {
        totalLeadsBase: leads.length,
        contatosRealizadosDia: contatosRealizadosHoje || (totalProposta + totalNegociacao),
        novasCotacoesDia: novasCotacoesHoje || totalProposta,
        amostrasEnviadasDia: amostrasEnviadasHoje || 2,
        clientesGanhosDia: clientesGanhosHoje || totalFechadosGeral,
        leadsPorEstagioGeral: {
          novos: leads.filter(l => l.estagio === 'novo').length,
          qualificacao: leads.filter(l => l.estagio === 'qualificacao').length,
          proposta: totalProposta,
          negociacao: totalNegociacao,
          fechado: totalFechadosGeral,
          perdido: leads.filter(l => l.estagio === 'perdido').length
        }
      },

      arenaCompeticaoRanking: metricasArena,

      planoAcoesTaticasProximoDia: {
        totalAcoesPlanejadas: acoesPrioridadeAlta.length + acoesPrioridadeMedia.length + acoesPrioridadeEstrategica.length,
        prioridadeAltaFechamentos: acoesPrioridadeAlta,
        prioridadeMediaFollowUp: acoesPrioridadeMedia,
        prioridadeEstrategicaRotasLogistica: acoesPrioridadeEstrategica
      }
    };

    return relatorioFechamento;
  }

  /**
   * Converte o relatório de fechamento diário em formato Markdown elegante para leitura e impressão
   */
  function gerarMarkdownFechamento(relatorio) {
    const r = relatorio || gerarFechamentoDiario();

    let md = `# 🧻 ISAPEL PAPÉIS | FECHAMENTO DIÁRIO & PLANO TÁTICO COMERCIAL\n`;
    md += `**Data:** ${r.dataExtenso} (${r.dataReferencia}) | **Emissão:** ${new Date(r.geradoEm).toLocaleTimeString('pt-BR')}\n`;
    md += `**Foco Estratégico:** Ações Comerciais Táticas para Oportunidades Qualificadas & Logística de Frota Própria\n\n`;
    md += `---\n\n`;

    // 1. RESUMO OPERACIONAL DO DIA
    md += `## 📊 1. Resumo Operacional do Dia\n\n`;
    md += `| Métrica Comercial | Volume Registrado |\n`;
    md += `| :--- | :---: |\n`;
    md += `| 👥 Total de Leads Ativos na Base | **${r.resumoOperacionalDia.totalLeadsBase}** |\n`;
    md += `| 📞 Contatos & Follow-ups Realizados | **${r.resumoOperacionalDia.contatosRealizadosDia}** |\n`;
    md += `| 📄 Novas Cotações Formalizadas | **${r.resumoOperacionalDia.novasCotacoesDia}** |\n`;
    md += `| 📦 Amostras de Toalha / Bobina Entregues | **${r.resumoOperacionalDia.amostrasEnviadasDia}** |\n`;
    md += `| 🤝 Clientes Fechados / Ganhos | **${r.resumoOperacionalDia.clientesGanhosDia}** |\n\n`;

    md += `**Status do Funil de Vendas Atual:**\n`;
    const f = r.resumoOperacionalDia.leadsPorEstagioGeral;
    md += `- 🆕 **Novos Leads:** ${f.novos}\n`;
    md += `- 🔍 **Qualificação & Diagnóstico:** ${f.qualificacao}\n`;
    md += `- 📝 **Propostas Enviadas:** ${f.proposta}\n`;
    md += `- 🤝 **Negociação / Amostras em Teste:** ${f.negociacao}\n`;
    md += `- 🏆 **Fechados / Ativos:** ${f.fechado}\n`;
    md += `- 🛑 **Standby / Perdidos:** ${f.perdido}\n\n`;

    // 2. ARENA DE COMPETIÇÃO
    md += `## 🏆 2. Performance da Arena Comercial\n\n`;
    md += `| Posição | Consultor | Pontos | Cadastrados | Contatos | Propostas | Em Negociação | Fechados | Conv. % |\n`;
    md += `| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
    r.arenaCompeticaoRanking.forEach(rank => {
      md += `| **${rank.posicaoRanking}º** | ${rank.vendedor.nome} | **${rank.pontuacaoGeral}** | ${rank.totalCadastrados} | ${rank.totalContatos} | ${rank.leadsPorEstagio.proposta} | ${rank.leadsPorEstagio.negociacao} | ${rank.totalFechados} | ${rank.taxaConversao}% |\n`;
    });
    md += `\n*Critérios de Pontuação da Arena: 10 pts cadastro | 15 pts contato | 25 pts proposta | 40 pts negociação/amostra | 100 pts fechamento.*\n\n`;
    md += `---\n\n`;

    // 3. PLANO DE AÇÕES TÁTICAS PARA O PRÓXIMO DIA
    md += `## 🎯 3. Plano Tático de Ações Comerciais para o Próximo Dia\n\n`;

    // 🔴 ALTA
    md += `### 🔴 Prioridade Alta: Leads em Negociação (Fechamento Imediato & Amostras)\n\n`;
    if (r.planoAcoesTaticasProximoDia.prioridadeAltaFechamentos.length === 0) {
      md += `*Nenhum lead em negociação crítica no momento.*\n\n`;
    } else {
      r.planoAcoesTaticasProximoDia.prioridadeAltaFechamentos.forEach((acao, i) => {
        md += `#### ${i + 1}. ${acao.empresa} (${acao.cidade} - ${acao.uf})\n`;
        md += `- **Decisor:** ${acao.decisor} | **Telefone:** ${acao.telefone}\n`;
        md += `- **Responsável:** ${acao.vendedorResponsavel}\n`;
        md += `- **Logística:** ${acao.logistica}\n`;
        if (acao.valorEstimado > 0) {
          md += `- **Volume Estimado da Conta:** R$ ${acao.valorEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
        }
        md += `- **Ação Comercial Obrigatória:** **${acao.acaoRecomendada}**\n`;
        md += `- **Por que priorizar:** ${acao.justificativa}\n\n`;
      });
    }

    // 🟡 MÉDIA
    md += `### 🟡 Prioridade Média: Follow-up de Cotações com mais de 24h & Alinhamento de Frete CIF\n\n`;
    if (r.planoAcoesTaticasProximoDia.prioridadeMediaFollowUp.length === 0) {
      md += `*Nenhuma proposta pendente de retorno.*\n\n`;
    } else {
      r.planoAcoesTaticasProximoDia.prioridadeMediaFollowUp.forEach((acao, i) => {
        md += `#### ${i + 1}. ${acao.empresa} (${acao.cidade} - ${acao.uf})\n`;
        md += `- **Contato:** ${acao.decisor} | **Telefone:** ${acao.telefone}\n`;
        md += `- **Responsável:** ${acao.vendedorResponsavel}\n`;
        md += `- **Condição Logística:** ${acao.logistica}\n`;
        if (acao.valorProposta > 0) {
          md += `- **Valor da Proposta:** R$ ${acao.valorProposta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
        }
        md += `- **Ação Comercial Tática:** ${acao.acaoRecomendada}\n`;
        md += `- **Diretriz de Venda:** ${acao.justificativa}\n\n`;
      });
    }

    // 🔵 ESTRATÉGICA
    md += `### 🔵 Prioridade Estratégica: Agrupamento Regional por Rotas da Frota Isapel\n\n`;
    r.planoAcoesTaticasProximoDia.prioridadeEstrategicaRotasLogistica.forEach((rota, i) => {
      md += `#### 🚛 Rota ${i + 1}: ${rota.rotaLogistica} (${rota.uf})\n`;
      md += `- **Frota Própria Isapel:** ${rota.frotaPropria ? '✅ Sim (Entrega Direta 24/72h)' : '🚚 Redespacho / Transportadora'}\n`;
      md += `- **Volume de Oportunidades na Rota:** ${rota.totalLeadsRota} leads em qualificação/novos\n`;
      md += `- **Estratégia do Dia:** ${rota.acaoRecomendada}\n`;
      md += `- **Clientes-Alvo na Rota:**\n`;
      rota.leadsAssociados.forEach(c => {
        md += `  * **${c.empresa}** (${c.cidade}) - ${c.contato} (${c.telefone}) [${c.estagio}] - Resp: ${c.vendedor}\n`;
      });
      md += `\n`;
    });

    md += `---\n`;
    md += `*Isapel Papéis - Sistema Comercial Integrado B2B | Documento Gerado Automaticamente*\n`;
    return md;
  }

  /**
   * Exporta a base de leads em formato CSV padrão Excel (com ponto-e-vírgula e UTF-8 BOM)
   */
  function exportarLeadsCSV() {
    const leads = carregarLeadsArmazenados();
    const cabecalho = [
      'ID',
      'Nome da Empresa',
      'Contato / Decisor',
      'Telefone',
      'DDD',
      'Cidade',
      'Regiao',
      'Estado (UF)',
      'Estagio Funil',
      'Vendedor Responsavel',
      'Segmento',
      'Logistica Isapel',
      'Rota de Frete',
      'Frota Propria',
      'Volume Mensal',
      'Valor Proposta (R$)',
      'Amostra Enviada',
      'Data Criacao',
      'Data Ultimo Contato'
    ];

    const linhas = leads.map(l => [
      l.id,
      `"${(l.nome || '').replace(/"/g, '""')}"`,
      `"${(l.contatoNome || '').replace(/"/g, '""')}"`,
      `"${l.telefoneFormatado || l.telefone || ''}"`,
      l.ddd || '',
      `"${(l.cidade || '').replace(/"/g, '""')}"`,
      `"${(l.regiao || '').replace(/"/g, '""')}"`,
      l.uf || '',
      `"${ETAPAS_FUNIL[l.estagio]?.titulo || l.estagio}"`,
      `"${VENDEDORES_CONFIG[l.vendedorId]?.nome || l.vendedorId}"`,
      `"${(l.segmento || '').replace(/"/g, '""')}"`,
      `"${(l.logistica || '').replace(/"/g, '""')}"`,
      `"${(l.rotaLogistica || '').replace(/"/g, '""')}"`,
      l.frotaPropria ? 'Sim' : 'Nao',
      `"${(l.volumeMensal || '').replace(/"/g, '""')}"`,
      (l.valorProposta || 0).toFixed(2).replace('.', ','),
      l.amostraEnviada ? 'Sim' : 'Nao',
      l.dataCriacao || '',
      l.dataUltimoContato || ''
    ]);

    const csvContent = '\uFEFF' + [cabecalho.join(';'), ...linhas.map(row => row.join(';'))].join('\r\n');
    return csvContent;
  }

  /**
   * Helper para disparar download de arquivo no navegador
   */
  function baixarArquivoNoNavegador(nomeArquivo, conteudo, tipoMime) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }
    const blob = new Blob([conteudo], { type: tipoMime || 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nomeArquivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }

  /**
   * Dispara o download do arquivo de fechamento diário em formato JSON
   */
  function baixarFechamentoJSON(dataReferenciaStr) {
    const fechamento = gerarFechamentoDiario(dataReferenciaStr);
    const nomeArquivo = `fechamento-isapel-${fechamento.dataReferencia}.json`;
    const jsonStr = JSON.stringify(fechamento, null, 2);
    return baixarArquivoNoNavegador(nomeArquivo, jsonStr, 'application/json');
  }

  /**
   * Dispara o download do fechamento diário em Markdown
   */
  function baixarFechamentoMarkdown(dataReferenciaStr) {
    const fechamento = gerarFechamentoDiario(dataReferenciaStr);
    const mdContent = gerarMarkdownFechamento(fechamento);
    const nomeArquivo = `fechamento-isapel-${fechamento.dataReferencia}.md`;
    return baixarArquivoNoNavegador(nomeArquivo, mdContent, 'text/markdown');
  }

  /**
   * Dispara o download da base completa de Leads em CSV
   */
  function baixarLeadsCSV() {
    const dataHoje = new Date().toISOString().split('T')[0];
    const csvContent = exportarLeadsCSV();
    const nomeArquivo = `leads-isapel-${dataHoje}.csv`;
    return baixarArquivoNoNavegador(nomeArquivo, csvContent, 'text/csv;charset=utf-8;');
  }

  /**
   * Restaura os dados para o seed demonstrativo original
   */
  function restaurarDadosOriginais() {
    memoriaLeads = LEADS_INICIAIS.map(lead => enriquecerLeadComDDD(lead));
    salvarLeads(memoriaLeads);
    return memoriaLeads;
  }

  // ==========================================================================
  // EXPORTAÇÃO DA API PÚBLICA
  // ==========================================================================
  return {
    // Tabelas e Constantes
    TABELA_DDDS_BRASIL: TABELA_DDDS_BRASIL,
    VENDEDORES_CONFIG: VENDEDORES_CONFIG,
    ETAPAS_FUNIL: ETAPAS_FUNIL,
    TIPOS_CLIENTE: TIPOS_CLIENTE,
    PRODUTOS_ISAPEL: PRODUTOS_ISAPEL,

    // Resolução de DDD & Logística
    extrairDDDDeTelefone: extrairDDDDeTelefone,
    formatarTelefone: formatarTelefone,
    resolverInformacoesDDD: resolverInformacoesDDD,
    enriquecerLeadComDDD: enriquecerLeadComDDD,

    // Gestão de Vendedores
    obterVendedores: () => Object.values(VENDEDORES_CONFIG),
    obterVendedorPorId: (id) => VENDEDORES_CONFIG[id] || null,
    registrarVendedor: registrarVendedorDinamico,
    carregarVendedoresDinamicos: carregarVendedoresDinamicos,

    // Operações de Leads (CRUD & Funil)
    cadastrarLeadRapido: cadastrarLeadRapido,
    atualizarLead: atualizarLead,
    definirLeads: definirLeads,
    mesclarLeadsNuvem: mesclarLeadsNuvem,
    moverEstagioLead: moverEstagioLead,
    registrarContatoLead: registrarContatoLead,
    removerLead: removerLead,
    listarLeads: listarLeads,
    obterLeadPorId: obterLeadPorId,
    restaurarDadosOriginais: restaurarDadosOriginais,

    // Arena de Competição
    calcularMetricasArena: calcularMetricasArena,

    // Fechamento Diário & Plano Tático Comercial
    gerarFechamentoDiario: gerarFechamentoDiario,
    gerarMarkdownFechamento: gerarMarkdownFechamento,
    exportarLeadsCSV: exportarLeadsCSV,

    // Disparadores de Download
    baixarFechamentoJSON: baixarFechamentoJSON,
    baixarFechamentoMarkdown: baixarFechamentoMarkdown,
    baixarLeadsCSV: baixarLeadsCSV
  };
}));
