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
    syncIntervalMs: 15000 // Polling suave a cada 15s para manter vendedores sincronizados
  };

  let statusConexao = {
    online: navigator.onLine !== false,
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
      valor_proposta: Number(lead.valorProposta || 0),
      observacoes: lead.observacoes || '',
      historico: lead.historico || [],
      data_atualizacao: new Date().toISOString()
    };
  }

  // 1. Puxar Leads da Nuvem (Supabase)
  async function carregarLeadsNuvem() {
    try {
      const endpoint = `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.tableName}?select=*&order=data_atualizacao.desc`;
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
    const payload = mapearParaBanco(lead);
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
        throw new Error(`Falha HTTP ${res.status}`);
      }

      statusConexao.supabaseAtivo = true;
      statusConexao.ultimoSync = new Date();
      notificarStatus();
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
      const endpoint = `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.tableName}?id=eq.${encodeURIComponent(leadId)}`;
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

  return {
    config: SUPABASE_CONFIG,
    carregarLeadsNuvem,
    salvarLeadNuvem,
    removerLeadNuvem,
    gerarArquivoBackupRede,
    onStatusChange,
    obterStatus: () => ({ ...statusConexao })
  };
}));
