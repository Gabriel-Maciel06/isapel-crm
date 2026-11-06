/**
 * crm-sync.js - Sincronizador Híbrido Isapel CRM
 * Arquitetura Dual:
 * 1. Nuvem (Supabase): Sincronização em tempo real entre Gabriel Maciel, Fernanda e Caio
 * 2. Rede Local (Backup): Armazenamento no localStorage + download/export de backup automático
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.IsapelSync = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Configuração Oficial do Supabase Isapel CRM
  const SUPABASE_CONFIG = {
    url: 'https://xpjhpskjetpcglkxdjag.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwamhwc2tqZXRwY2dsa3hkamFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODQyMjMsImV4cCI6MjEwMDM2MDIyM30.nxFBM69wjrEOsz5HkSr9iDLmE9TpJi-eE_Yqq3oAI3s',
    tableName: 'crm_isapel_leads',
    tableVendedores: 'crm_isapel_vendedores',
    tableAvatarProfiles: 'crm_isapel_perfis_avatar',
    storageVendedoresKey: 'isapel_crm_vendedores_custom',
    storageAvatarKey: 'isapel_crm_avatar_profiles',
    syncIntervalMs: 15000 // Polling suave a cada 15s para manter vendedores sincronizados
  };

  // Fallback de armazenamento em memória resiliente
  const memoryStore = {};

  function safeGetStorage(key) {
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem) {
        const item = localStorage.getItem(key);
        if (item) return item;
      }
    } catch (e) {}

    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem) {
        const item = sessionStorage.getItem(key);
        if (item) return item;
      }
    } catch (e) {}

    return memoryStore[key] || null;
  }

  function safeSetStorage(key, value) {
    memoryStore[key] = value;
    try {
      if (typeof localStorage !== 'undefined' && localStorage.setItem) {
        localStorage.setItem(key, value);
      }
    } catch (e) {}
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.setItem) {
        sessionStorage.setItem(key, value);
      }
    } catch (e) {}
  }

  let statusConexao = {
    online: (typeof navigator !== 'undefined' && navigator && typeof navigator.onLine === 'boolean') ? navigator.onLine : true,
    supabaseAtivo: false,
    ultimoSync: null,
    leadsSincronizados: 0
  };

  let listenerCallbacks = [];

  function notificarStatus() {
    listenerCallbacks.forEach(cb => {
      try { cb(statusConexao); } catch (e) { console.warn(e); }
    });
  }

  function onStatusChange(callback) {
    if (typeof callback === 'function') {
      listenerCallbacks.push(callback);
      callback(statusConexao);
    }
  }

  // Converter formato do banco para formato do CRM JS
  function mapearParaApp(row) {
    return {
      id: row.id,
      nome: row.nome,
      telefone: row.telefone,
      telefoneFormatado: row.telefone_formatado || row.telefone,
      ddd: row.ddd,
      cidade: row.cidade,
      regiao: row.regiao,
      uf: row.uf || 'SP',
      estagio: row.estagio || 'novo',
      vendedorId: row.vendedor_id || 'maciel',
      vendedorNome: row.vendedor_nome || 'Gabriel Maciel',
      tipoCliente: row.tipo_cliente || row.tipoCliente || '',
      valorProposta: Number(row.valor_proposta || 0),
      observacoes: row.observacoes || '',
      historico: Array.isArray(row.historico) ? row.historico : (typeof row.historico === 'string' ? JSON.parse(row.historico) : []),
      dataCadastro: row.data_cadastro,
      dataAtualizacao: row.data_atualizacao
    };
  }

  // Converter formato do CRM JS para formato da tabela Supabase
  function mapearParaBanco(lead) {
    let vendedorNome = lead.vendedorNome;
    if (!vendedorNome) {
      if (lead.vendedorId === 'fernanda') vendedorNome = 'Fernanda';
      else if (lead.vendedorId === 'caio') vendedorNome = 'Caio';
      else vendedorNome = 'Gabriel Maciel';
    }

    return {
      id: lead.id,
      nome: lead.nome,
      telefone: lead.telefone,
      telefone_formatado: lead.telefoneFormatado || lead.telefone,
      ddd: lead.ddd || null,
      cidade: lead.cidade || '',
      regiao: lead.regiao || '',
      uf: lead.uf || 'SP',
      estagio: lead.estagio || 'novo',
      vendedor_id: lead.vendedorId || 'maciel',
      vendedor_nome: vendedorNome,
      tipo_cliente: lead.tipoCliente || lead.tipo_cliente || '',
      valor_proposta: Number(lead.valorProposta || 0),
      observacoes: lead.observacoes || '',
      historico: lead.historico || [],
      data_atualizacao: new Date().toISOString()
    };
  }

  // 1. Puxar Leads da Nuvem (Supabase com RBAC e Isolamento de Dados)
  async function carregarLeadsNuvem(filtroVendedorParam) {
    try {
      const sessao = (typeof window !== 'undefined' && window.IsapelAuth && typeof window.IsapelAuth.obterSessao === 'function')
        ? window.IsapelAuth.obterSessao()
        : null;

      let queryParams = ['select=*', 'order=data_atualizacao.desc'];

      if (sessao && sessao.perfil === 'vendedor' && sessao.vendedorId) {
        // Vendedor só puxa e enxerga estritamente os seus próprios leads pela rede
        queryParams.unshift(`vendedor_id=eq.${encodeURIComponent(sessao.vendedorId)}`);
      } else {
        // Diretoria ou sem sessão: se houver filtro específico selecionado
        const selectVendedor = (typeof document !== 'undefined') ? document.getElementById('vendedor-select') : null;
        const filtro = filtroVendedorParam || (selectVendedor ? selectVendedor.value : 'todos');
        if (filtro && filtro !== 'todos') {
          queryParams.unshift(`vendedor_id=eq.${encodeURIComponent(filtro)}`);
        }
      }

      const endpoint = `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.tableName}?${queryParams.join('&')}`;
      const res = await fetch(endpoint, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });

      if (!res.ok) {
        throw new Error(`Falha HTTP ${res.status}`);
      }

      const rows = await res.json();
      const leads = rows.map(mapearParaApp);

      statusConexao.online = true;
      statusConexao.supabaseAtivo = true;
      statusConexao.ultimoSync = new Date();
      statusConexao.leadsSincronizados = leads.length;
      notificarStatus();

      return leads;
    } catch (err) {
      console.warn('⚠️ [Isapel Sync] Falha ao sincronizar com Supabase, operando via Backup Local:', err.message);
      statusConexao.supabaseAtivo = false;
      notificarStatus();
      return null;
    }
  }

  // 2. Salvar / Atualizar Lead no Supabase
  async function salvarLeadNuvem(lead) {
    const sessao = (typeof window !== 'undefined' && window.IsapelAuth && typeof window.IsapelAuth.obterSessao === 'function')
      ? window.IsapelAuth.obterSessao()
      : null;

    if (sessao && sessao.perfil === 'vendedor' && sessao.vendedorId) {
      lead.vendedor_id = sessao.vendedorId;
      lead.vendedorId = sessao.vendedorId;
      lead.vendedor_nome = sessao.nome;
      lead.vendedorNome = sessao.nome;
    }

    const payload = mapearParaBanco(lead);
    if (sessao && sessao.perfil === 'vendedor' && sessao.vendedorId) {
      payload.vendedor_id = sessao.vendedorId;
      payload.vendedor_nome = sessao.nome;
    }

    try {
      const endpoint = `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.tableName}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Falha HTTP ${res.status}${errorText ? ': ' + errorText : ''}`);
      }

      statusConexao.supabaseAtivo = true;
      statusConexao.ultimoSync = new Date();
      notificarStatus();
      console.log(`[Isapel Sync] Lead salvo com sucesso no Supabase: ${lead.id} (${lead.nome || 'sem nome'})`);
      return true;
    } catch (err) {
      console.warn('⚠️ [Isapel Sync] Falha ao salvar no Supabase (salvo localmente no backup):', err.message);
      statusConexao.supabaseAtivo = false;
      notificarStatus();
      return false;
    }
  }

  // 3. Excluir Lead no Supabase
  async function removerLeadNuvem(leadId) {
    try {
      const sessao = (typeof window !== 'undefined' && window.IsapelAuth && typeof window.IsapelAuth.obterSessao === 'function')
        ? window.IsapelAuth.obterSessao()
        : null;

      let query = `id=eq.${encodeURIComponent(leadId)}`;
      if (sessao && sessao.perfil === 'vendedor' && sessao.vendedorId) {
        query += `&vendedor_id=eq.${encodeURIComponent(sessao.vendedorId)}`;
      }

      const endpoint = `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.tableName}?${query}`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });
      if (res.ok) {
        statusConexao.ultimoSync = new Date();
        notificarStatus();
      }
      return res.ok;
    } catch (err) {
      console.warn('⚠️ [Isapel Sync] Falha ao deletar do Supabase:', err.message);
      return false;
    }
  }

  // 4. Backup Automático para o Servidor de Arquivos (Download de Snapshot JSON)
  function gerarArquivoBackupRede(leads) {
    const backupData = {
      sistema: 'Isapel CRM Comercial B2B',
      geradoEm: new Date().toISOString(),
      versao: '2.0-hybrid',
      totalLeads: leads.length,
      leads: leads
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dataFmt = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `backup-crm-isapel-rede-${dataFmt}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ==========================================================================
  // 5. GESTÃO DE VENDEDORES (PERSISTÊNCIA HÍBRIDA SUPABASE + LOCALSTORAGE)
  // ==========================================================================

  /**
   * Salva um novo vendedor no Supabase e no localStorage de backup.
   * @param {Object} vendedor - Dados do vendedor
   * @returns {Promise<{ ok: boolean, vendedor: Object, offline?: boolean, erro?: string }>}
   */
  async function salvarVendedor(vendedor) {
    if (!vendedor || (!vendedor.id && !vendedor.login)) {
      return { ok: false, erro: 'Dados do vendedor inválidos.' };
    }

    const id = String(vendedor.id || vendedor.login).trim().toLowerCase();
    const login = String(vendedor.login || vendedor.id).trim().toLowerCase();
    const nome = String(vendedor.nome || login).trim();

    // 1. Persistência local prioritária (offline-first)
    let listaLocal = [];
    try {
      const raw = safeGetStorage(SUPABASE_CONFIG.storageVendedoresKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          listaLocal = parsed.filter(v => (v.id || v.login) !== login);
        }
      }
    } catch (e) {
      listaLocal = [];
    }

    const registroNormalizado = {
      id: id,
      login: login,
      usuario: login,
      nome: nome,
      senhaInicial: vendedor.senhaInicial || vendedor.senha_hash || 'isapel2026',
      cargo: vendedor.cargo || 'Consultor Comercial B2B',
      perfil: 'vendedor',
      vendedorId: login,
      metaMensalReais: Number(vendedor.metaMensalReais || vendedor.meta_reais) || 40000,
      metaMensalFardos: Number(vendedor.metaMensalFardos || vendedor.meta_fardos) || 1500,
      avatar: vendedor.avatarIniciais || vendedor.avatar || 'CO',
      avatarIniciais: vendedor.avatarIniciais || vendedor.avatar || 'CO',
      avatarCor: vendedor.avatarCor || vendedor.avatar_cor || '#0284C7',
      ativo: vendedor.ativo !== false,
      criadoEm: vendedor.criadoEm || vendedor.criado_em || new Date().toISOString(),
      criadoPor: vendedor.criadoPor || vendedor.criado_por || 'diretoria'
    };

    listaLocal.push(registroNormalizado);
    safeSetStorage(SUPABASE_CONFIG.storageVendedoresKey, JSON.stringify(listaLocal));

    // 2. Persistência na nuvem (Supabase)
    const payloadBanco = {
      id: id,
      nome: nome,
      login: login,
      senha_hash: registroNormalizado.senhaInicial,
      cargo: registroNormalizado.cargo,
      perfil: 'vendedor',
      meta_reais: registroNormalizado.metaMensalReais,
      meta_fardos: registroNormalizado.metaMensalFardos,
      avatar_iniciais: registroNormalizado.avatarIniciais,
      avatar_cor: registroNormalizado.avatarCor,
      ativo: registroNormalizado.ativo,
      criado_por: registroNormalizado.criadoPor,
      atualizado_em: new Date().toISOString()
    };

    try {
      const endpoint = `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.tableVendedores}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payloadBanco)
      });

      if (!res.ok) {
        console.warn(`[IsapelSync] Supabase retornou status ${res.status} para salvarVendedor (mantido no localStorage).`);
        return { ok: true, offline: true, vendedor: registroNormalizado };
      }

      statusConexao.ultimoSync = new Date();
      notificarStatus();
      return { ok: true, vendedor: registroNormalizado };
    } catch (err) {
      console.warn('[IsapelSync] Falha de rede ao salvar vendedor no Supabase (salvo no localStorage):', err.message);
      return { ok: true, offline: true, vendedor: registroNormalizado };
    }
  }

  /**
   * Carrega os vendedores dinâmicos da nuvem (Supabase) com fallback para localStorage.
   * @returns {Promise<Array<Object>>}
   */
  async function carregarVendedores() {
    let listaLocal = [];
    try {
      const raw = safeGetStorage(SUPABASE_CONFIG.storageVendedoresKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          listaLocal = parsed;
        }
      }
    } catch (e) {
      listaLocal = [];
    }

    try {
      const endpoint = `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.tableVendedores}?select=*&order=criado_em.asc`;
      const res = await fetch(endpoint, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });

      if (res && res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) {
          const vendedoresNuvem = rows
            .filter(r => !['maciel', 'fernanda', 'caio', 'diretoria'].includes(String(r.id || r.login).toLowerCase()))
            .map(r => ({
              id: r.id || r.login,
              login: r.login || r.id,
              usuario: r.login || r.id,
              nome: r.nome,
              senhaInicial: r.senha_hash,
              cargo: r.cargo || 'Consultor Comercial B2B',
              perfil: r.perfil || 'vendedor',
              vendedorId: r.id || r.login,
              metaMensalReais: Number(r.meta_reais || 40000),
              metaMensalFardos: Number(r.meta_fardos || 1500),
              avatar: r.avatar_iniciais || 'CO',
              avatarIniciais: r.avatar_iniciais || 'CO',
              avatarCor: r.avatar_cor || '#0284C7',
              ativo: r.ativo !== false,
              criadoEm: r.criado_em || new Date().toISOString(),
              criadoPor: r.criado_por || 'diretoria'
            }));

          // Se a nuvem retornou dados válidos, sincroniza no localStorage
          if (vendedoresNuvem.length > 0) {
            safeSetStorage(SUPABASE_CONFIG.storageVendedoresKey, JSON.stringify(vendedoresNuvem));
            return vendedoresNuvem;
          }
        }
      }
    } catch (err) {
      console.warn('[IsapelSync] Falha ao carregar vendedores da nuvem (utilizando backup local):', err.message);
    }

    return listaLocal;
  }

  // ==========================================================================
  // 6. PERSONALIZAÇÃO DE AVATARES 3D (SUPABASE + LOCALSTORAGE)
  // ==========================================================================

  const PERFIS_AVATAR_PADRAO = {
    maciel: {
      uniforme: {
        tipo: 'blazer_executivo_navy',
        corPrimaria: '#003360',
        corGola: '#FFFFFF',
        tipoInferior: 'calca_social',
        corInferior: '#0A1829',
        temCracha: true
      },
      cabelo: {
        estilo: 'cacheado_curto',
        cor: '#1A1514'
      },
      barba: {
        tipo: 'bigode_maciel',
        cor: '#161211'
      },
      pele: {
        tom: '#E6B994'
      },
      acessorios: {
        oculos: 'nenhum',
        corArmacao: '#111827',
        gravata: 'gravata_dourada'
      }
    },
    fernanda: {
      uniforme: {
        tipo: 'polo_isapel_cyan',
        corPrimaria: '#0284C7',
        corGola: '#FFFFFF',
        tipoInferior: 'calca_social',
        corInferior: '#0A1829',
        temCracha: true
      },
      cabelo: {
        estilo: 'longo_feminino',
        cor: '#F7CF46'
      },
      barba: {
        tipo: 'nenhum',
        cor: '#161211'
      },
      pele: {
        tom: '#F9D3B4'
      },
      acessorios: {
        oculos: 'nenhum',
        corArmacao: '#111827',
        gravata: 'nenhum'
      }
    },
    caio: {
      uniforme: {
        tipo: 'polo_isapel_navy',
        corPrimaria: '#003360',
        corGola: '#FFFFFF',
        tipoInferior: 'calca_social',
        corInferior: '#0A1829',
        temCracha: true
      },
      cabelo: {
        estilo: 'cacheado_volumoso',
        cor: '#1A1514'
      },
      barba: {
        tipo: 'cavanhaque',
        cor: '#161211'
      },
      pele: {
        tom: '#DFA980'
      },
      acessorios: {
        oculos: 'oculos_redondo',
        corArmacao: '#111827',
        gravata: 'nenhum'
      }
    }
  };

  const PERFIL_AVATAR_GENERICO = {
    uniforme: {
      tipo: 'polo_isapel_cyan',
      corPrimaria: '#0284C7',
      corGola: '#FFFFFF',
      tipoInferior: 'calca_social',
      corInferior: '#0A1829',
      temCracha: true
    },
    cabelo: {
      estilo: 'curto_social',
      cor: '#1A1514'
    },
    barba: {
      tipo: 'nenhum',
      cor: '#161211'
    },
    pele: {
      tom: '#E6B994'
    },
    acessorios: {
      oculos: 'nenhum',
      corArmacao: '#111827',
      gravata: 'nenhum'
    }
  };

  /**
   * Salva as preferências de personalização 3D do consultor no Supabase e localStorage.
   * @param {string} vendedorId - Identificador do vendedor
   * @param {Object} config - Configurações visuais do avatar
   * @returns {Promise<{ ok: boolean, offline?: boolean }>}
   */
  async function salvarPerfilAvatar(vendedorId, config) {
    if (!vendedorId || !config || typeof config !== 'object') {
      return { ok: false, erro: 'Parâmetros inválidos para salvarPerfilAvatar.' };
    }

    const vid = String(vendedorId).trim().toLowerCase();

    // 1. Persistência local no storage
    let perfis = {};
    try {
      const raw = safeGetStorage(SUPABASE_CONFIG.storageAvatarKey);
      if (raw) {
        perfis = JSON.parse(raw) || {};
      }
    } catch (e) {
      perfis = {};
    }

    perfis[vid] = {
      ...config,
      atualizadoEm: new Date().toISOString()
    };
    safeSetStorage(SUPABASE_CONFIG.storageAvatarKey, JSON.stringify(perfis));

    // 2. Dispara evento customizado para notificar live preview e arena 3D
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        const evt = (typeof CustomEvent === 'function')
          ? new CustomEvent('isapel:avatar-updated', { detail: { vendedorId: vid, config: perfis[vid] } })
          : { type: 'isapel:avatar-updated', detail: { vendedorId: vid, config: perfis[vid] } };
        window.dispatchEvent(evt);
      } catch (evtErr) {
        console.warn('[IsapelSync] Falha ao emitir isapel:avatar-updated:', evtErr);
      }
    }

    // 3. Persistência na nuvem (Supabase)
    const payloadBanco = {
      vendedor_id: vid,
      config: perfis[vid],
      atualizado_em: new Date().toISOString()
    };

    try {
      const endpoint = `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.tableAvatarProfiles}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payloadBanco)
      });

      if (!res.ok) {
        console.warn(`[IsapelSync] Supabase retornou status ${res.status} para salvarPerfilAvatar (salvo localmente).`);
        return { ok: true, offline: true };
      }

      return { ok: true };
    } catch (err) {
      console.warn('[IsapelSync] Falha de rede ao salvar perfil de avatar no Supabase (salvo localmente):', err.message);
      return { ok: true, offline: true };
    }
  }

  /**
   * Obtém a configuração de avatar para um vendedor com mesclagem sobre padrões.
   * @param {string} vendedorId - Identificador do vendedor
   * @returns {Object} Configuração completa do avatar
   */
  function obterPerfilAvatar(vendedorId) {
    const vid = String(vendedorId || '').trim().toLowerCase();
    const padraoBase = PERFIS_AVATAR_PADRAO[vid] || PERFIL_AVATAR_GENERICO;

    let perfilStorage = null;
    try {
      const raw = safeGetStorage(SUPABASE_CONFIG.storageAvatarKey);
      if (raw) {
        const perfis = JSON.parse(raw);
        if (perfis && typeof perfis === 'object' && perfis[vid]) {
          perfilStorage = perfis[vid];
        }
      }
    } catch (e) {}

    if (!perfilStorage) {
      return JSON.parse(JSON.stringify(padraoBase));
    }

    return {
      vendedorId: vid,
      uniforme: { ...padraoBase.uniforme, ...(perfilStorage.uniforme || {}) },
      cabelo: { ...padraoBase.cabelo, ...(perfilStorage.cabelo || {}) },
      barba: { ...padraoBase.barba, ...(perfilStorage.barba || {}) },
      pele: { ...padraoBase.pele, ...(perfilStorage.pele || {}) },
      acessorios: { ...padraoBase.acessorios, ...(perfilStorage.acessorios || {}) },
      atualizadoEm: perfilStorage.atualizadoEm || new Date().toISOString()
    };
  }

  /**
   * Carrega todos os perfis de avatar gravados no Supabase e atualiza o cache local.
   * @returns {Promise<Object|null>} Mapa { [vendedorId]: config }
   */
  async function carregarPerfisAvatarNuvem() {
    try {
      const endpoint = `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.tableAvatarProfiles}?select=*`;
      const res = await fetch(endpoint, {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      });
      if (res && res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) {
          let perfis = {};
          try {
            const raw = safeGetStorage(SUPABASE_CONFIG.storageAvatarKey);
            if (raw) perfis = JSON.parse(raw) || {};
          } catch (e) {}

          rows.forEach(r => {
            if (r.vendedor_id && r.config) {
              perfis[r.vendedor_id] = r.config;
            }
          });
          safeSetStorage(SUPABASE_CONFIG.storageAvatarKey, JSON.stringify(perfis));
          return perfis;
        }
      }
    } catch (err) {
      console.warn('[IsapelSync] Falha ao carregar perfis de avatar da nuvem:', err.message);
    }
    return null;
  }

  return {
    config: SUPABASE_CONFIG,
    carregarLeadsNuvem,
    salvarLeadNuvem,
    removerLeadNuvem,
    gerarArquivoBackupRede,
    onStatusChange,
    obterStatus: () => ({ ...statusConexao }),

    // Gestão de Vendedores (Supabase + localStorage)
    salvarVendedor,
    salvarVendedorNuvem: salvarVendedor,
    carregarVendedores,
    carregarVendedoresNuvem: carregarVendedores,

    // Personalização dos Avatares 3D (Supabase + localStorage)
    salvarPerfilAvatar,
    salvarAvatarPerfilNuvem: salvarPerfilAvatar,
    obterPerfilAvatar,
    carregarPerfisAvatarNuvem,
    PERFIS_AVATAR_PADRAO
  };
}));
