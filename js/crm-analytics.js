/**
 * ============================================================================
 * ISAPEL PAPÉIS - MOTOR ANALÍTICO & GESTÃO DE PERFORMANCE COMERCIAL B2B
 * Arquivo: js/crm-analytics.js
 * Versão: 2.1.0-analytics
 *
 * Responsabilidades:
 * 1. Filtragem dinâmica e temporal de leads ('hoje', '7dias', 'mes', 'custom')
 * 2. Controle de acesso baseado em papéis (RBAC) com isolamento estrito de vendedores
 * 3. Consolidação de KPIs executivos: leads recebidos, qualificação, conversão e pipeline
 * 4. Funil de vendas estruturado em 6 etapas com percentuais relativos e volumes financeiros
 * 5. Distribuição de desempenho por vendedor para visão executiva da diretoria
 * 6. Suporte a sincronização com Supabase (crm-sync.js) e resiliência offline (localStorage)
 * ============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.IsapelAnalytics = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ==========================================================================
  // 1. CONFIGURAÇÕES, CATÁLOGOS E DESIGN TOKENS
  // ==========================================================================

  // Catálogo Oficial de Vendedores Isapel CRM
  const VENDEDORES_CONFIG = {
    maciel: {
      id: 'maciel',
      nome: 'Gabriel Maciel',
      avatar: 'GM',
      cargo: 'Vendedor Sênior B2B',
      cor: '#003360'
    },
    fernanda: {
      id: 'fernanda',
      nome: 'Fernanda',
      avatar: 'FE',
      cargo: 'Consultora Comercial',
      cor: '#0284C7'
    },
    caio: {
      id: 'caio',
      nome: 'Caio',
      avatar: 'CA',
      cargo: 'SDR & Hunter B2B',
      cor: '#38BDF8'
    },
    albert: {
      id: 'albert',
      nome: 'Albert',
      avatar: 'AL',
      cargo: 'Consultor Comercial B2B',
      cor: '#0284C7'
    },
    daniel: {
      id: 'daniel',
      nome: 'Daniel',
      avatar: 'DA',
      cargo: 'Consultor Comercial B2B',
      cor: '#059669'
    }
  };

  // 6 Estágios Oficiais do Funil de Vendas Isapel B2B
  const ETAPAS_FUNIL = [
    {
      estagio: 'novo',
      titulo: 'Novo Lead',
      descricao: 'Lead recém-cadastrado via entrada rápida',
      cor: '#94A3B8'
    },
    {
      estagio: 'qualificacao',
      titulo: 'Contato Feito / Qualificação',
      descricao: 'Primeiro contato e levantamento de necessidades',
      cor: '#0284C7'
    },
    {
      estagio: 'proposta',
      titulo: 'Cotação / Proposta Enviada',
      descricao: 'Proposta comercial formalizada com frete CIF',
      cor: '#F59E0B'
    },
    {
      estagio: 'negociacao',
      titulo: 'Negociação / Amostra',
      descricao: 'Negociação de volumes ou envio de amostras',
      cor: '#8B5CF6'
    },
    {
      estagio: 'fechado',
      titulo: 'Fechado / Ganho',
      descricao: 'Cliente ativo faturado e entrega programada',
      cor: '#10B981'
    },
    {
      estagio: 'perdido',
      titulo: 'Perdido / Standby',
      descricao: 'Oportunidade encerrada ou em espera',
      cor: '#EF4444'
    }
  ];

  // Armazenamento de listeners para atualização reativa
  const listeners = [];

  // ==========================================================================
  // 2. FUNÇÕES AUXILIARES DE TRATAMENTO DE DATAS E PARSING
  // ==========================================================================

  /**
   * Converte múltiplos formatos de data em objeto Date válido.
   * Suporta: Date, timestamps em ms, ISO strings, formato brasileiro DD/MM/YYYY.
   * @param {*} valor
   * @returns {Date|null}
   */
  function parsearData(valor) {
    if (!valor) return null;

    if (valor instanceof Date) {
      return isNaN(valor.getTime()) ? null : valor;
    }

    if (typeof valor === 'number') {
      const d = new Date(valor);
      return isNaN(d.getTime()) ? null : d;
    }

    if (typeof valor === 'string') {
      const limpo = valor.trim();
      if (!limpo) return null;

      // Padrão brasileiro: DD/MM/YYYY ou DD/MM/YYYY HH:mm:ss
      const brMatch = limpo.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
      if (brMatch) {
        const dia = parseInt(brMatch[1], 10);
        const mes = parseInt(brMatch[2], 10) - 1;
        const ano = parseInt(brMatch[3], 10);
        const hora = brMatch[4] ? parseInt(brMatch[4], 10) : 0;
        const min = brMatch[5] ? parseInt(brMatch[5], 10) : 0;
        const seg = brMatch[6] ? parseInt(brMatch[6], 10) : 0;
        const d = new Date(ano, mes, dia, hora, min, seg);
        return isNaN(d.getTime()) ? null : d;
      }

      // Padrão ISO simples: YYYY-MM-DD
      const isoDateOnly = limpo.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoDateOnly) {
        const ano = parseInt(isoDateOnly[1], 10);
        const mes = parseInt(isoDateOnly[2], 10) - 1;
        const dia = parseInt(isoDateOnly[3], 10);
        return new Date(ano, mes, dia, 12, 0, 0);
      }

      // Padrão ISO com horário / UTC string
      const d = new Date(limpo);
      if (!isNaN(d.getTime())) {
        return d;
      }
    }

    return null;
  }

  /**
   * Extrai a data mais confiável de um lead com fallback resiliente.
   * @param {Object} lead
   * @returns {Date|null}
   */
  function extrairDataDeLead(lead) {
    if (!lead || typeof lead !== 'object') return null;

    const valor = lead.dataCriacao ||
                  lead.dataCadastro ||
                  lead.data_cadastro ||
                  lead.dataAtualizacao ||
                  lead.data_atualizacao ||
                  lead.data ||
                  lead.criadoEm ||
                  lead.created_at;

    return parsearData(valor);
  }

  /**
   * Formata uma data para string ISO 'YYYY-MM-DD'.
   * @param {Date} d
   * @returns {string}
   */
  function formatarDataIso(d) {
    if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  /**
   * Formata uma data para o padrão visual brasileiro 'DD/MM/YYYY'.
   * @param {Date} d
   * @returns {string}
   */
  function formatarDataBr(d) {
    if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  /**
   * Formata número para moeda corrente brasileira (BRL).
   * @param {number} val
   * @returns {string}
   */
  function formatarMoeda(val) {
    const num = Number(val) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /**
   * Formata taxa percentual com uma casa decimal e vírgula.
   * @param {number} val
   * @returns {string}
   */
  function formatarPercentual(val) {
    const num = Number(val) || 0;
    return `${num.toFixed(1).replace('.', ',')}%`;
  }

  // ==========================================================================
  // 3. CAMADA DE ACESSO A DADOS (LEITURA DO RUNTIME E FALLBACK)
  // ==========================================================================

  /**
   * Obtém os leads do estado atual da aplicação, com fallback gracioso.
   * @returns {Array<Object>}
   */
  function obterLeadsAtuais() {
    // 1. Tentar ler do módulo IsapelCRM se disponível
    try {
      if (typeof window !== 'undefined' && window.IsapelCRM && typeof window.IsapelCRM.listarLeads === 'function') {
        const leads = window.IsapelCRM.listarLeads();
        if (Array.isArray(leads) && leads.length > 0) {
          return leads;
        }
      }
    } catch (e) {
      // Continua para o próximo fallback
    }

    // 2. Tentar ler do localStorage do navegador
    try {
      if (typeof localStorage !== 'undefined') {
        const dadosCrm = localStorage.getItem('isapel_crm_leads_v1');
        if (dadosCrm) {
          const parsed = JSON.parse(dadosCrm);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }

        const dadosLeads = localStorage.getItem('isapel_leads_v1');
        if (dadosLeads) {
          const parsed = JSON.parse(dadosLeads);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      // Continua para o retorno vazio
    }

    return [];
  }

  /**
   * Obtém a sessão ativa de autenticação e RBAC.
   * @returns {Object|null}
   */
  function obterSessaoAtiva() {
    try {
      if (typeof window !== 'undefined' && window.IsapelAuth && typeof window.IsapelAuth.obterSessao === 'function') {
        return window.IsapelAuth.obterSessao();
      }
    } catch (e) {
      // Ignora erro de contexto
    }
    return null;
  }

  // ==========================================================================
  // 4. MOTOR DE FILTRAGEM (DATA + VENDEDOR COM RBAC ESTRITO)
  // ==========================================================================

  /**
   * Filtra uma lista de leads com base no período e no perfil de acesso (RBAC).
   *
   * @param {Object} opcoes
   * @param {Array<Object>} [opcoes.leads] - Lista de leads (default: obterLeadsAtuais())
   * @param {string} [opcoes.periodo='hoje'] - 'hoje' | '7dias' | 'mes' | 'custom' | 'todos'
   * @param {string} [opcoes.dataInicio] - ISO string 'YYYY-MM-DD' para filtro custom
   * @param {string} [opcoes.dataFim] - ISO string 'YYYY-MM-DD' para filtro custom
   * @param {string} [opcoes.vendedorId='todos'] - 'todos' | 'maciel' | 'fernanda' | 'caio'
   * @param {Object} [opcoes.sessao] - Objeto de sessão explícito (opcional, para testes ou override)
   * @param {Date|string} [opcoes.dataReferencia] - Data de referência (default: new Date())
   * @returns {Array<Object>} Lista de leads filtrados
   */
  function filtrarLeads(opcoes) {
    const opts = opcoes || {};
    const baseLeads = Array.isArray(opts.leads) ? opts.leads : obterLeadsAtuais();
    const sessao = opts.sessao !== undefined ? opts.sessao : obterSessaoAtiva();

    // ------------------------------------------------------------------------
    // A. Resolução e Isolamento de Vendedor (RBAC Estrito)
    // ------------------------------------------------------------------------
    let vendedorIdAlvo = opts.vendedorId || 'todos';

    if (sessao && sessao.perfil === 'vendedor' && sessao.vendedorId) {
      // VENDEDOR COMUM: Trava estrita no vendedor logado.
      // O vendedor JAMAIS tem acesso a leads de outros vendedores ou visão geral.
      vendedorIdAlvo = sessao.vendedorId;
    } else if (sessao && sessao.perfil === 'diretoria') {
      // DIRETORIA: Permite alternar livremente entre 'todos' e qualquer vendedor individual.
      vendedorIdAlvo = opts.vendedorId || 'todos';
    } else {
      // Sem sessão autenticada (ex: chamada de teste parametrizada)
      vendedorIdAlvo = opts.vendedorId || 'todos';
    }

    // ------------------------------------------------------------------------
    // B. Resolução do Intervalo Temporal
    // ------------------------------------------------------------------------
    const periodoTipo = opts.periodo || 'hoje';
    const refDate = opts.dataReferencia ? parsearData(opts.dataReferencia) : new Date();
    const dataRefSegura = (refDate && !isNaN(refDate.getTime())) ? refDate : new Date();

    let dataInicioLim = null;
    let dataFimLim = null;

    if (periodoTipo === 'hoje') {
      dataInicioLim = new Date(dataRefSegura.getFullYear(), dataRefSegura.getMonth(), dataRefSegura.getDate(), 0, 0, 0, 0);
      dataFimLim = new Date(dataRefSegura.getFullYear(), dataRefSegura.getMonth(), dataRefSegura.getDate(), 23, 59, 59, 999);
    } else if (periodoTipo === '7dias') {
      dataInicioLim = new Date(dataRefSegura.getFullYear(), dataRefSegura.getMonth(), dataRefSegura.getDate() - 6, 0, 0, 0, 0);
      dataFimLim = new Date(dataRefSegura.getFullYear(), dataRefSegura.getMonth(), dataRefSegura.getDate(), 23, 59, 59, 999);
    } else if (periodoTipo === 'mes') {
      dataInicioLim = new Date(dataRefSegura.getFullYear(), dataRefSegura.getMonth(), 1, 0, 0, 0, 0);
      dataFimLim = new Date(dataRefSegura.getFullYear(), dataRefSegura.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (periodoTipo === 'custom') {
      if (opts.dataInicio) {
        const dtIni = parsearData(opts.dataInicio);
        if (dtIni) {
          dataInicioLim = new Date(dtIni.getFullYear(), dtIni.getMonth(), dtIni.getDate(), 0, 0, 0, 0);
        }
      }
      if (opts.dataFim) {
        const dtFim = parsearData(opts.dataFim);
        if (dtFim) {
          dataFimLim = new Date(dtFim.getFullYear(), dtFim.getMonth(), dtFim.getDate(), 23, 59, 59, 999);
        }
      }
    }
    // Se periodoTipo for 'todos', dataInicioLim e dataFimLim permanecem null (sem restrição temporal)

    // ------------------------------------------------------------------------
    // C. Aplicação dos Filtros
    // ------------------------------------------------------------------------
    return baseLeads.filter(lead => {
      if (!lead || typeof lead !== 'object') return false;

      // 1. Filtro por Vendedor
      const leadVendedor = lead.vendedorId || lead.vendedor_id;
      if (vendedorIdAlvo !== 'todos' && leadVendedor !== vendedorIdAlvo) {
        return false;
      }

      // 2. Filtro por Região dos Leads
      const regiaoAlvo = opts.regiao || 'todas';
      if (regiaoAlvo && regiaoAlvo !== 'todas') {
        const leadDdd = lead.ddd ? String(lead.ddd).trim() : '';
        const leadReg = String(lead.regiao || '').trim().toLowerCase();
        const leadCid = String(lead.cidade || '').trim().toLowerCase();
        const alvo = String(regiaoAlvo).trim().toLowerCase();

        const matchDdd = alvo.startsWith('ddd ') ? alvo.replace('ddd ', '').trim() : alvo;
        const eDdd = /^\d+$/.test(matchDdd);

        if (eDdd) {
          if (leadDdd !== matchDdd) return false;
        } else {
          const combo = `${leadReg} ${leadCid} ddd ${leadDdd}`;
          if (!combo.includes(alvo) && !alvo.includes(leadReg)) {
            return false;
          }
        }
      }

      // 3. Filtro por Data
      if (periodoTipo !== 'todos' && (dataInicioLim || dataFimLim)) {
        const dataLead = extrairDataDeLead(lead);
        if (!dataLead) {
          return false;
        }

        const t = dataLead.getTime();

        // Caso especial 'hoje': tolerância para comparação direta por data ISO (fuso local/UTC)
        if (periodoTipo === 'hoje') {
          const diaLeadIso = formatarDataIso(dataLead);
          const diaRefIso = formatarDataIso(dataRefSegura);
          const estaDentroTs = t >= dataInicioLim.getTime() && t <= dataFimLim.getTime();
          if (!estaDentroTs && diaLeadIso !== diaRefIso) {
            return false;
          }
        } else {
          if (dataInicioLim && t < dataInicioLim.getTime()) {
            return false;
          }
          if (dataFimLim && t > dataFimLim.getTime()) {
            return false;
          }
        }
      }

      return true;
    });
  }

  // ==========================================================================
  // 5. MOTOR DE CÁLCULO DE MÉTRICAS, KPIS E FUNIL DE 6 ETAPAS
  // ==========================================================================

  /**
   * Consolida métricas executivas, taxas de qualificação/conversão e etapas do funil.
   *
   * @param {Array<Object>} leadsFiltrados - Leads resultantes da filtragem
   * @param {Object} [sessao] - Sessão do usuário
   * @param {Object} [opcoesContexto] - Parâmetros opcionais de contexto (período, vendedorFiltro)
   * @returns {Object} AnalyticsResult no formato especificado pelo contrato
   */
  function calcularMetricas(leadsFiltrados, sessao, opcoesContexto) {
    const leads = Array.isArray(leadsFiltrados) ? leadsFiltrados : [];
    const sessaoAtiva = sessao !== undefined ? sessao : obterSessaoAtiva();
    const opts = opcoesContexto || {};

    // ------------------------------------------------------------------------
    // A. Identificação do Filtro e Modo de Visão
    // ------------------------------------------------------------------------
    let vendedorFiltro = opts.vendedorId || 'todos';
    if (sessaoAtiva && sessaoAtiva.perfil === 'vendedor' && sessaoAtiva.vendedorId) {
      vendedorFiltro = sessaoAtiva.vendedorId;
    }

    const ehVisaoGeral = Boolean(
      (sessaoAtiva && sessaoAtiva.perfil === 'diretoria' && vendedorFiltro === 'todos') ||
      (!sessaoAtiva && vendedorFiltro === 'todos')
    );

    // ------------------------------------------------------------------------
    // B. Metadados do Período
    // ------------------------------------------------------------------------
    const periodoTipo = opts.periodo || 'hoje';
    const refDate = opts.dataReferencia ? parsearData(opts.dataReferencia) : new Date();
    const dataRefSegura = (refDate && !isNaN(refDate.getTime())) ? refDate : new Date();

    let dataInicioIso = '';
    let dataFimIso = '';
    let labelFormatado = '';

    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    if (periodoTipo === 'hoje') {
      dataInicioIso = formatarDataIso(dataRefSegura);
      dataFimIso = dataInicioIso;
      labelFormatado = `Hoje (${formatarDataBr(dataRefSegura)})`;
    } else if (periodoTipo === '7dias') {
      const dt7 = new Date(dataRefSegura.getFullYear(), dataRefSegura.getMonth(), dataRefSegura.getDate() - 6);
      dataInicioIso = formatarDataIso(dt7);
      dataFimIso = formatarDataIso(dataRefSegura);
      labelFormatado = `Últimos 7 dias (${formatarDataBr(dt7)} a ${formatarDataBr(dataRefSegura)})`;
    } else if (periodoTipo === 'mes') {
      const dtInicioMes = new Date(dataRefSegura.getFullYear(), dataRefSegura.getMonth(), 1);
      const dtFimMes = new Date(dataRefSegura.getFullYear(), dataRefSegura.getMonth() + 1, 0);
      dataInicioIso = formatarDataIso(dtInicioMes);
      dataFimIso = formatarDataIso(dtFimMes);
      labelFormatado = `Este Mês (${nomesMeses[dataRefSegura.getMonth()]}/${dataRefSegura.getFullYear()})`;
    } else if (periodoTipo === 'custom') {
      const dIni = opts.dataInicio ? parsearData(opts.dataInicio) : null;
      const dFim = opts.dataFim ? parsearData(opts.dataFim) : null;
      dataInicioIso = dIni ? formatarDataIso(dIni) : '';
      dataFimIso = dFim ? formatarDataIso(dFim) : '';
      labelFormatado = `Personalizado (${dIni ? formatarDataBr(dIni) : 'Início'} a ${dFim ? formatarDataBr(dFim) : 'Hoje'})`;
    } else {
      labelFormatado = 'Todo o Histórico';
    }

    // ------------------------------------------------------------------------
    // C. Apuração dos Indicadores Principais (KPIs)
    // ------------------------------------------------------------------------
    const totalRecebidos = leads.length;

    // Leads qualificados: passaram da etapa inicial 'novo'
    const totalQualificados = leads.filter(l => l.estagio && l.estagio !== 'novo').length;
    const taxaQualificacaoPct = totalRecebidos > 0
      ? Number(((totalQualificados / totalRecebidos) * 100).toFixed(1))
      : 0.0;

    // Leads fechados: etapa 'fechado'
    const totalFechados = leads.filter(l => l.estagio === 'fechado').length;
    const taxaConversaoPct = totalRecebidos > 0
      ? Number(((totalFechados / totalRecebidos) * 100).toFixed(1))
      : 0.0;

    // Valores financeiros
    let valorPipelineTotal = 0;
    let valorFechadoTotal = 0;
    let valorEmNegociacao = 0;
    let totalContasComValor = 0;
    const regioesUnicas = new Set();
    const regioesMap = new Map();

    leads.forEach(lead => {
      const valor = Number(lead.valorProposta || lead.valor_proposta || 0) || 0;

      // Pipeline ativo: todas as oportunidades exceto as encerradas como 'perdido'
      if (lead.estagio !== 'perdido') {
        valorPipelineTotal += valor;
        if (valor > 0) {
          totalContasComValor += 1;
        }
      }

      if (lead.estagio === 'fechado') {
        valorFechadoTotal += valor;
      }

      if (lead.estagio === 'negociacao') {
        valorEmNegociacao += valor;
      }

      const ddd = lead.ddd ? String(lead.ddd).trim() : '';
      let regiaoNome = lead.regiao || lead.cidade || (ddd ? `DDD ${ddd}` : 'Não informada');
      regiaoNome = String(regiaoNome).trim();
      if (regiaoNome) {
        regioesUnicas.add(regiaoNome);
        const chave = ddd ? `DDD ${ddd} - ${regiaoNome}` : regiaoNome;
        if (!regioesMap.has(chave)) {
          regioesMap.set(chave, {
            chave: chave,
            regiao: regiaoNome,
            ddd: ddd,
            count: 0,
            valorTotal: 0
          });
        }
        const item = regioesMap.get(chave);
        item.count += 1;
        item.valorTotal += valor;
      }
    });

    const distribuicaoRegioes = Array.from(regioesMap.values())
      .map(r => ({
        ...r,
        valorTotal: Number(r.valorTotal.toFixed(2)),
        pctTotal: totalRecebidos > 0 ? Number(((r.count / totalRecebidos) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.count - a.count);

    valorPipelineTotal = Number(valorPipelineTotal.toFixed(2));
    valorFechadoTotal = Number(valorFechadoTotal.toFixed(2));
    valorEmNegociacao = Number(valorEmNegociacao.toFixed(2));

    // Ticket Médio: média por proposta ativa com valor financeiro definido
    let ticketMedio = 0.0;
    if (totalContasComValor > 0) {
      ticketMedio = Number((valorPipelineTotal / totalContasComValor).toFixed(2));
    } else if (totalFechados > 0 && valorFechadoTotal > 0) {
      ticketMedio = Number((valorFechadoTotal / totalFechados).toFixed(2));
    }

    // ------------------------------------------------------------------------
    // D. Funil de Vendas de 6 Etapas
    // ------------------------------------------------------------------------
    const funil = ETAPAS_FUNIL.map(etapa => {
      const leadsDaEtapa = leads.filter(l => l.estagio === etapa.estagio);
      const count = leadsDaEtapa.length;
      const valorTotal = Number(
        leadsDaEtapa.reduce((acc, l) => acc + (Number(l.valorProposta || l.valor_proposta || 0) || 0), 0).toFixed(2)
      );
      const pctTotal = totalRecebidos > 0
        ? Number(((count / totalRecebidos) * 100).toFixed(1))
        : 0.0;

      return {
        estagio: etapa.estagio,
        titulo: etapa.titulo,
        cor: etapa.cor,
        count: count,
        valorTotal: valorTotal,
        pctTotal: pctTotal
      };
    });

    // ------------------------------------------------------------------------
    // E. Distribuição por Vendedor (Visão de Gestão da Diretoria)
    // ------------------------------------------------------------------------
    const distribuicaoVendedores = Object.keys(VENDEDORES_CONFIG).map(vId => {
      const vendedorCfg = VENDEDORES_CONFIG[vId];
      const leadsVendedor = leads.filter(l => (l.vendedorId || l.vendedor_id) === vId);
      const totalVendedor = leadsVendedor.length;
      const fechadosVendedor = leadsVendedor.filter(l => l.estagio === 'fechado').length;

      const valorPipeline = Number(
        leadsVendedor
          .filter(l => l.estagio !== 'perdido')
          .reduce((acc, l) => acc + (Number(l.valorProposta || l.valor_proposta || 0) || 0), 0)
          .toFixed(2)
      );

      const valorFechado = Number(
        leadsVendedor
          .filter(l => l.estagio === 'fechado')
          .reduce((acc, l) => acc + (Number(l.valorProposta || l.valor_proposta || 0) || 0), 0)
          .toFixed(2)
      );

      const taxaConversao = totalVendedor > 0
        ? Number(((fechadosVendedor / totalVendedor) * 100).toFixed(1))
        : 0.0;

      return {
        vendedorId: vId,
        nome: vendedorCfg.nome,
        avatar: vendedorCfg.avatar,
        totalLeads: totalVendedor,
        fechados: fechadosVendedor,
        valorPipeline: valorPipeline,
        valorFechado: valorFechado,
        taxaConversaoPct: taxaConversao
      };
    });

    // ------------------------------------------------------------------------
    // F. Retorno Estruturado Conforme Contrato de Interface
    // ------------------------------------------------------------------------
    return {
      periodo: {
        tipo: periodoTipo,
        dataInicio: dataInicioIso,
        dataFim: dataFimIso,
        labelFormatado: labelFormatado
      },
      vendedorFiltro: vendedorFiltro,
      ehVisaoGeral: ehVisaoGeral,
      kpis: {
        totalRecebidos: totalRecebidos,
        totalQualificados: totalQualificados,
        taxaQualificacaoPct: taxaQualificacaoPct,
        totalFechados: totalFechados,
        taxaConversaoPct: taxaConversaoPct,
        valorPipelineTotal: valorPipelineTotal,
        valorFechadoTotal: valorFechadoTotal,
        valorEmNegociacao: valorEmNegociacao,
        ticketMedio: ticketMedio,
        regioesAtendidasCount: regioesUnicas.size
      },
      funil: funil,
      distribuicaoVendedores: distribuicaoVendedores,
      distribuicaoRegioes: distribuicaoRegioes
    };
  }

  // ==========================================================================
  // 6. MÉTODO COMPLETO (ORQUESTRADOR DE FILTRO E CÁLCULO)
  // ==========================================================================

  /**
   * Executa a filtragem de leads e computação de métricas em uma única operação.
   *
   * @param {Object} [opcoes]
   * @returns {Object} AnalyticsResult
   */
  function obterMetricasCompletas(opcoes) {
    const opts = opcoes || {};
    const sessao = opts.sessao !== undefined ? opts.sessao : obterSessaoAtiva();
    const leadsFiltrados = filtrarLeads({ ...opts, sessao });
    return calcularMetricas(leadsFiltrados, sessao, opts);
  }

  // ==========================================================================
  // 7. EVENTOS REATIVOS & INTEGRAÇÃO COM SUPABASE SYNC
  // ==========================================================================

  /**
   * Registra um ouvinte para receber notificações quando houver atualização de leads.
   * @param {Function} callback
   * @returns {Function} Função para desinscrever o listener
   */
  function registrarListener(callback) {
    if (typeof callback === 'function') {
      listeners.push(callback);
    }
    return function remover() {
      const idx = listeners.indexOf(callback);
      if (idx !== -1) {
        listeners.splice(idx, 1);
      }
    };
  }

  /**
   * Notifica todos os ouvintes registrados com dados atualizados.
   * @param {Object} dados
   */
  function notificarAtualizacao(dados) {
    listeners.forEach(cb => {
      try {
        cb(dados);
      } catch (err) {
        console.warn('[IsapelAnalytics] Erro em callback de listener:', err);
      }
    });
  }

  // Hook automático: integração com IsapelSync se presente no navegador
  if (typeof window !== 'undefined' && window.IsapelSync && typeof window.IsapelSync.onStatusChange === 'function') {
    try {
      window.IsapelSync.onStatusChange(function (status) {
        notificarAtualizacao({ tipo: 'sync_status', status: status });
      });
    } catch (e) {
      // Ignora erro de binding
    }
  }

  // ==========================================================================
  // 8. EXPOSIÇÃO DA API PÚBLICA
  // ==========================================================================

  return {
    filtrarLeads: filtrarLeads,
    calcularMetricas: calcularMetricas,
    obterMetricasCompletas: obterMetricasCompletas,
    obterLeadsAtuais: obterLeadsAtuais,
    obterSessaoAtiva: obterSessaoAtiva,
    parsearData: parsearData,
    extrairDataDeLead: extrairDataDeLead,
    formatarDataIso: formatarDataIso,
    formatarDataBr: formatarDataBr,
    formatarMoeda: formatarMoeda,
    formatarPercentual: formatarPercentual,
    registrarListener: registrarListener,
    onUpdate: registrarListener, // Aliasing ergonômico
    notificarAtualizacao: notificarAtualizacao,
    obterConfigVendedores: () => ({ ...VENDEDORES_CONFIG }),
    obterEtapasFunil: () => ETAPAS_FUNIL.map(e => ({ ...e }))
  };
}));
