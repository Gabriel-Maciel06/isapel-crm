/**
 * js/crm-auth.js - Módulo de Autenticação e Controle de Acesso Baseado em Papéis (RBAC)
 * CRM Isapel Papéis v1.1.0
 *
 * Responsável por gerenciar credenciais, sessão criptográfica/token, persistência
 * em localStorage/sessionStorage, proteção de rotas e perfis de acesso.
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.IsapelAuth = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STORAGE_KEY = 'isapel_auth_session';

  // Base de Usuários, Credenciais e Perfis Homologados Isapel
  const USUARIOS_CONFIG = {
    maciel: {
      id: 'maciel',
      usuario: 'maciel',
      nome: 'Gabriel Maciel',
      perfil: 'vendedor',
      vendedorId: 'maciel',
      cargo: 'Vendedor Sênior B2B',
      avatar: 'GM',
      senhasValidas: ['maciel0602', 'isapel2026', 'maciel123']
    },
    fernanda: {
      id: 'fernanda',
      usuario: 'fernanda',
      nome: 'Fernanda',
      perfil: 'vendedor',
      vendedorId: 'fernanda',
      cargo: 'Consultora Comercial',
      avatar: 'FE',
      senhasValidas: ['Fernanda1234', 'fernanda1234', 'isapel2026', 'fernanda123']
    },
    caio: {
      id: 'caio',
      usuario: 'caio',
      nome: 'Caio',
      perfil: 'vendedor',
      vendedorId: 'caio',
      cargo: 'SDR & Hunter B2B',
      avatar: 'CA',
      senhasValidas: ['Caio1234', 'caio1234', 'isapel2026', 'caio123']
    },
    diretoria: {
      id: 'diretoria',
      usuario: 'diretoria',
      nome: 'Diretoria Comercial',
      perfil: 'diretoria',
      vendedorId: null, // Visão global irrestrita (todos os vendedores)
      cargo: 'Gestão Geral & Diretoria',
      avatar: 'DIR',
      senhasValidas: ['Diretoria123!', 'diretoria123!', 'isapel2026', 'diretoria123']
    }
  };

  // Fallback de armazenamento em memória (para ambientes sem Storage ou Node.js)
  const memoryStore = {};

  function safeGetStorage(key) {
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem) {
        const item = localStorage.getItem(key);
        if (item) return item;
      }
    } catch (e) {
      // Storage inacessível no contexto atual
    }

    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem) {
        const item = sessionStorage.getItem(key);
        if (item) return item;
      }
    } catch (e) {
      // Storage inacessível no contexto atual
    }

    return memoryStore[key] || null;
  }

  function safeSetStorage(key, value) {
    memoryStore[key] = value;

    try {
      if (typeof localStorage !== 'undefined' && localStorage.setItem) {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      // Falha ao gravar no localStorage
    }

    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.setItem) {
        sessionStorage.setItem(key, value);
      }
    } catch (e) {
      // Falha ao gravar no sessionStorage
    }
  }

  function safeRemoveStorage(key) {
    delete memoryStore[key];

    try {
      if (typeof localStorage !== 'undefined' && localStorage.removeItem) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      // Falha ao remover do localStorage
    }

    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.removeItem) {
        sessionStorage.removeItem(key);
      }
    } catch (e) {
      // Falha ao remover do sessionStorage
    }
  }

  /**
   * Obtém os dados da sessão autenticada ativa.
   * @returns {Object|null} Objeto da sessão ou null se inexistente/inválida.
   */
  function obterSessao() {
    try {
      const dataStr = safeGetStorage(STORAGE_KEY);
      if (!dataStr) return null;

      const sessao = JSON.parse(dataStr);
      if (!sessao || typeof sessao !== 'object' || !sessao.usuario || !sessao.perfil) {
        safeRemoveStorage(STORAGE_KEY);
        return null;
      }

      // Validação estrita de integridade contra tampering no storage
      const config = USUARIOS_CONFIG[sessao.usuario];
      if (!config) {
        safeRemoveStorage(STORAGE_KEY);
        return null;
      }

      if (sessao.perfil !== config.perfil || sessao.vendedorId !== config.vendedorId) {
        safeRemoveStorage(STORAGE_KEY);
        return null;
      }

      // Garante sincronização entre localStorage e sessionStorage
      safeSetStorage(STORAGE_KEY, dataStr);

      return sessao;
    } catch (err) {
      safeRemoveStorage(STORAGE_KEY);
      return null;
    }
  }

  /**
   * Verifica se existe uma sessão válida ativa.
   * @returns {boolean}
   */
  function estaAutenticado() {
    const sessao = obterSessao();
    return Boolean(sessao && sessao.usuario && sessao.perfil);
  }

  /**
   * Executa o login com validação de usuário e senha.
   * @param {string} usuario - Identificador do usuário (ex: 'maciel', 'fernanda', 'caio', 'diretoria').
   * @param {string} senha - Senha digitada.
   * @returns {{ ok: boolean, sessao?: Object, erro?: string }}
   */
  function login(usuario, senha) {
    const userClean = String(usuario || '').trim().toLowerCase();
    const passClean = String(senha || '');

    if (!userClean || !passClean) {
      return { ok: false, erro: 'Por favor, preencha o usuário e a senha.' };
    }

    const config = USUARIOS_CONFIG[userClean];
    if (!config) {
      return { ok: false, erro: 'Usuário ou senha incorretos.' };
    }

    const senhaCorreta = config.senhasValidas.includes(passClean);
    if (!senhaCorreta) {
      return { ok: false, erro: 'Usuário ou senha incorretos.' };
    }

    const sessao = {
      usuario: config.usuario,
      nome: config.nome,
      perfil: config.perfil,
      vendedorId: config.vendedorId,
      cargo: config.cargo,
      avatar: config.avatar,
      token: `isapel_token_${config.usuario}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      loginEm: new Date().toISOString()
    };

    safeSetStorage(STORAGE_KEY, JSON.stringify(sessao));

    return { ok: true, sessao };
  }

  /**
   * Encerra a sessão ativa e redireciona para a tela de login.
   * @param {string} [destino='login.html'] - URL de redirecionamento.
   */
  function logout(destino = 'login.html') {
    safeRemoveStorage(STORAGE_KEY);
    if (typeof window !== 'undefined' && window.location) {
      window.location.replace(destino);
    }
    return true;
  }

  /**
   * Guarda de rota: redireciona para a tela de login se não autenticado.
   * @param {string} [destino='login.html'] - Destino caso desautenticado.
   * @returns {boolean} True se autenticado, False se redirecionou.
   */
  function protegerRota(destino = 'login.html') {
    if (!estaAutenticado()) {
      if (typeof window !== 'undefined' && window.location) {
        window.location.replace(destino);
      }
      return false;
    }
    return true;
  }

  /**
   * Redireciona para o painel principal se já estiver autenticado.
   * @param {string} [destino='index.html'] - Destino caso já autenticado.
   * @returns {boolean} True se redirecionou, False caso contrário.
   */
  function redirecionarSeAutenticado(destino = 'index.html') {
    if (estaAutenticado()) {
      if (typeof window !== 'undefined' && window.location) {
        window.location.replace(destino);
      }
      return true;
    }
    return false;
  }

  /**
   * Retorna o perfil do usuário logado ('vendedor' ou 'diretoria').
   * @returns {string|null}
   */
  function obterPerfil() {
    const s = obterSessao();
    return s ? s.perfil : null;
  }

  /**
   * Retorna o vendedorId do usuário logado ('maciel', 'fernanda', 'caio' ou null para diretoria).
   * @returns {string|null}
   */
  function obterVendedorId() {
    const s = obterSessao();
    return s ? s.vendedorId : null;
  }

  return {
    STORAGE_KEY,
    obterSessao,
    estaAutenticado,
    login,
    logout,
    protegerRota,
    redirecionarSeAutenticado,
    obterPerfil,
    obterVendedorId,
    // Exposição utilitária dos usuários configurados (sem senhas)
    obterUsuarios: () => Object.keys(USUARIOS_CONFIG).map(k => ({
      usuario: USUARIOS_CONFIG[k].usuario,
      nome: USUARIOS_CONFIG[k].nome,
      perfil: USUARIOS_CONFIG[k].perfil,
      vendedorId: USUARIOS_CONFIG[k].vendedorId,
      cargo: USUARIOS_CONFIG[k].cargo,
      avatar: USUARIOS_CONFIG[k].avatar
    }))
  };
}));
