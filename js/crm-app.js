/**
 * ============================================================================
 * ISAPEL PAPÉIS - CRM COMERCIAL B2B
 * Arquivo: js/crm-app.js
 * 
 * Engenheiro Sênior de Front-end do CRM Isapel Papéis
 * 
 * Funcionalidades Principais:
 * 1. Formulário de Cadastro Ultra-Ágil (Exatamente 2 campos: Nome e WhatsApp)
 *    com detecção instantânea de DDD, Cidade Polo, Região e Status Logístico Isapel.
 * 2. Navegação Fluida por Abas (Funil Kanban, Arena 3D, Fechamento & Plano Tático).
 * 3. Funil de Vendas Kanban Interativo (Drag & Drop nativo HTML5, Avanço 1-Clique, WhatsApp Direct).
 * 4. Painel de Fechamento do Dia & Inteligência Comercial com geração e download
 *    de `fechamento-isapel-YYYY-MM-DD.json` e distribuição de Ações Prioritárias.
 * 5. Sincronização em tempo real com Arena 3D Three.js e Motor de Dados `IsapelCRM`.
 * ============================================================================
 */

(function (window, document) {
  'use strict';

  // ==========================================================================
  // 1. ESTADO GLOBAL DA APLICAÇÃO
  // ==========================================================================
  const AppState = {
    vendedorAtivo: 'todos', // 'todos' | 'maciel' | 'fernanda' | 'caio' | 'albert' | 'daniel'
    abaAtiva: 'tab-funil',
    buscaTermo: '',
    tipoClienteFiltro: 'todos', // 'todos' | 'distribuidor' | 'licitacao' | 'consumidor_final' | 'outro'
    leadEmEdicaoId: null,
    leadEmNotasId: null,
    ultimoFechamentoGerado: null,
    audioContext: null,
    avatarPreviewEngine: null,
    vendedorCustomizandoId: 'maciel',
    analytics: {
      periodo: '03/11/2026',
      dataInicio: null,
      dataFim: null,
      origemFiltro: 'todas',
      vendedorFiltro: 'todos',
      regiaoFiltro: 'todas',
      sideTabAtiva: 'equipe'
    }
  };

  // ==========================================================================
  // 2. SÍNTESE DE ÁUDIO SUAVE (WEB AUDIO API - ZERO ARQUIVOS EXTERNOS)
  // ==========================================================================
  function playSound(type) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!AppState.audioContext) {
        AppState.audioContext = new AudioCtx();
      }
      if (AppState.audioContext.state === 'suspended') {
        AppState.audioContext.resume();
      }

      const ctx = AppState.audioContext;
      const now = ctx.currentTime;

      if (type === 'lead-cadastrado') {
        // Ding duplo de confirmação alegre (Mi5 -> Sol#5)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now); // E5
        osc1.frequency.setValueAtTime(830.61, now + 0.1); // G#5

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);
      } else if (type === 'drop') {
        // Pop sutil de soltura de card
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'fechamento') {
        // Acorde triumfal suave de fechamento diário
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.06);

          gain.gain.setValueAtTime(0.05, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.6);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.6);
        });
      }
    } catch (e) {
      // Navegadores sem permissão de áudio ou restrições de autoplay não travam a UI
    }
  }

  // ==========================================================================
  // 3. TOAST NOTIFICATIONS (FEEDBACK VISUAL POLIDO)
  // ==========================================================================
  function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('crm-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `crm-toast crm-toast--${type}`;

    let iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    if (type === 'success') {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    }

    toast.innerHTML = `<span style="display:inline-flex; align-items:center;">${iconSvg}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 250ms ease';
      setTimeout(() => toast.remove(), 260);
    }, duration);
  }

  // ==========================================================================
  // 4. FORMATAÇÕES (MOEDA, TELEFONE E DATAS)
  // ==========================================================================
  function formatarMoeda(valor) {
    const num = Number(valor) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function aplicarMascaraTelefone(valor) {
    if (!valor) return '';
    let digits = String(valor).replace(/\D/g, '');
    if (digits.length > 11) digits = digits.slice(0, 11);

    if (digits.length <= 2) {
      return digits.length > 0 ? `(${digits}` : '';
    }
    if (digits.length <= 6) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  function extrairApenasDigitos(str) {
    return String(str || '').replace(/\D/g, '');
  }

  // ==========================================================================
  // 5. DETECÇÃO EM TEMPO REAL DE DDD E LOGÍSTICA ISAPEL
  // ==========================================================================
  function atualizarBadgeDDD() {
    const telefoneInput = document.getElementById('lead-telefone');
    const badgeLocalizacao = document.getElementById('badge-ddd-localizacao');
    const badgeDDDBox = document.getElementById('badge-ddd-display');

    if (!telefoneInput || !badgeLocalizacao) return;

    const raw = telefoneInput.value;
    const digits = extrairApenasDigitos(raw);

    if (digits.length < 2) {
      badgeLocalizacao.textContent = 'Digite o telefone com DDD';
      if (badgeDDDBox) badgeDDDBox.style.borderColor = 'rgba(2, 132, 199, 0.25)';
      return;
    }

    const ddd = parseInt(digits.substring(0, 2), 10);
    let info = null;

    if (window.IsapelCRM && typeof window.IsapelCRM.resolverInformacoesDDD === 'function') {
      info = window.IsapelCRM.resolverInformacoesDDD(ddd);
    } else {
      info = resolverDDDFallback(ddd);
    }

    if (info && (info.localizado || info.cidade)) {
      badgeLocalizacao.textContent = `DDD ${info.ddd || ddd} - ${info.cidade} (${info.uf || 'SP'})`;
      if (badgeDDDBox) {
        badgeDDDBox.style.borderColor = 'var(--isapel-sky)';
      }
    } else {
      badgeLocalizacao.textContent = `DDD ${ddd} - Em análise`;
    }
  }

  function resolverDDDFallback(ddd) {
    const dddsSp = [11, 12, 13, 14, 15, 16, 17, 18, 19];
    if (dddsSp.includes(ddd)) {
      return {
        ddd: ddd,
        cidade: ddd === 11 ? 'São Paulo e Grande SP' : (ddd === 19 ? 'Campinas e Região' : 'Interior de SP'),
        uf: 'SP',
        logistica: 'Rota Direta CIF (Frota Própria Isapel - 24/72h)',
        frotaPropria: true,
        localizado: true
      };
    }
    return {
      ddd: ddd,
      cidade: 'Outras Regiões',
      uf: 'BR',
      logistica: 'Redespacho / Transportadora Parceira',
      frotaPropria: false,
      localizado: false
    };
  }

  // ==========================================================================
  // 6. CADASTRO ULTRA-ÁGIL (EXATAMENTE 2 CAMPOS)
  // ==========================================================================
  function inicializarFormularioCadastro() {
    const form = document.getElementById('form-novo-lead');
    const inputNome = document.getElementById('lead-nome');
    const inputTelefone = document.getElementById('lead-telefone');

    if (!form || !inputNome || !inputTelefone) return;

    // Máscara e Detecção Dinâmica de DDD no input de Telefone
    inputTelefone.addEventListener('input', (e) => {
      const formatado = aplicarMascaraTelefone(e.target.value);
      e.target.value = formatado;
      atualizarBadgeDDD();
    });

    // Submissão do Formulário
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      executarCadastroLead();
    });

    const btnCadastrar = document.getElementById('btn-cadastrar-lead');
    if (btnCadastrar) {
      btnCadastrar.addEventListener('click', (e) => {
        e.preventDefault();
        executarCadastroLead();
      });
    }
  }

  function executarCadastroLead() {
    const inputNome = document.getElementById('lead-nome');
    const inputTelefone = document.getElementById('lead-telefone');

    if (!inputNome || !inputTelefone) return;

    const nome = inputNome.value.trim();
    const telefone = inputTelefone.value.trim();
    const digits = extrairApenasDigitos(telefone);

    if (nome.length < 3) {
      showToast('Por favor, informe o nome do cliente ou da empresa.', 'warning');
      inputNome.focus();
      return;
    }

    if (digits.length < 10) {
      showToast('Informe um número de telefone/WhatsApp válido com DDD.', 'warning');
      inputTelefone.focus();
      return;
    }

    // Identifica o vendedor a atribuir (prioridade estrita para sessão ativa)
    const sessaoAtiva = (window.IsapelAuth && typeof window.IsapelAuth.obterSessao === 'function')
      ? window.IsapelAuth.obterSessao()
      : null;

    let vendedorId = AppState.vendedorAtivo;
    if (sessaoAtiva && sessaoAtiva.perfil === 'vendedor' && sessaoAtiva.vendedorId) {
      vendedorId = sessaoAtiva.vendedorId;
    } else if (vendedorId === 'todos') {
      // Round-robin ou padrão Maciel se "todos" estiver selecionado
      const vendedores = ['maciel', 'fernanda', 'caio'];
      const index = Math.floor(Math.random() * vendedores.length);
      vendedorId = vendedores[index];
    }

    // Dados do lead
    let leadCriado = null;
    if (window.IsapelCRM && typeof window.IsapelCRM.cadastrarLeadRapido === 'function') {
      leadCriado = window.IsapelCRM.cadastrarLeadRapido({
        nome: nome,
        telefone: telefone,
        vendedorId: vendedorId,
        observacao: 'Lead cadastrado via entrada ultra-rápida de WhatsApp.',
        valorProposta: 0
      });
    } else {
      // Fallback autônomo
      leadCriado = criarLeadAutonomo(nome, telefone, vendedorId);
    }

    // Feedback sonoro e visual
    playSound('lead-cadastrado');
    showToast(`Lead "${nome}" cadastrado com sucesso na coluna Novo Lead!`, 'success');

    // Sincronização em tempo real com Supabase (Nuvem)
    if (leadCriado && window.IsapelSync && typeof window.IsapelSync.salvarLeadNuvem === 'function') {
      window.IsapelSync.salvarLeadNuvem(leadCriado);
    }

    // Limpa os campos e redefine o foco
    inputNome.value = '';
    inputTelefone.value = '';
    atualizarBadgeDDD();
    inputNome.focus();

    // Atualiza a visualização do funil
    renderizarKanban();
    atualizarContadoresHeader();
    sincronizarArena3D();
  }

  function criarLeadAutonomo(nome, telefone, vendedorId) {
    const leadsSalvos = JSON.parse(localStorage.getItem('isapel_crm_leads_v1') || '[]');
    const digits = extrairApenasDigitos(telefone);
    const ddd = parseInt(digits.slice(0, 2), 10) || 11;
    const infoDDD = resolverDDDFallback(ddd);
    const agora = new Date().toISOString();

    const novoLead = {
      id: `lead_${Date.now()}`,
      nome: nome,
      contatoNome: nome,
      telefone: telefone,
      telefoneFormatado: aplicarMascaraTelefone(telefone),
      ddd: ddd,
      cidade: infoDDD.cidade,
      regiao: infoDDD.regiao || 'Interior / Capital',
      uf: infoDDD.uf || 'SP',
      logistica: infoDDD.logistica,
      frotaPropria: infoDDD.frotaPropria,
      estagio: 'novo',
      vendedorId: vendedorId,
      tipoCliente: '',
      valorProposta: 0,
      dataCriacao: agora,
      dataAtualizacao: agora,
      _tsLocal: Date.now(),
      dataUltimoContato: agora,
      historicoContatos: [
        {
          data: agora,
          anotacao: 'Lead cadastrado via entrada rápida do CRM.',
          autor: vendedorId
        }
      ]
    };

    leadsSalvos.unshift(novoLead);
    localStorage.setItem('isapel_crm_leads_v1', JSON.stringify(leadsSalvos));
    return novoLead;
  }

  // ==========================================================================
  // 7. RENDERIZAÇÃO DO FUNIL KANBAN DE 6 COLUNAS & CARDS
  // ==========================================================================
  const ESTAGIOS_LISTA = ['novo', 'qualificacao', 'proposta', 'negociacao', 'fechado', 'perdido'];

  function obterTodosOsLeads() {
    if (window.IsapelCRM && typeof window.IsapelCRM.listarLeads === 'function') {
      return window.IsapelCRM.listarLeads() || [];
    }
    return JSON.parse(localStorage.getItem('isapel_crm_leads_v1') || '[]');
  }

  function renderizarKanban() {
    const todosLeads = obterTodosOsLeads();

    // Filtros por vendedor e busca
    const termo = AppState.buscaTermo.toLowerCase().trim();
    const leadsFiltrados = todosLeads.filter(lead => {
      // Filtro de vendedor
      if (AppState.vendedorAtivo !== 'todos' && lead.vendedorId !== AppState.vendedorAtivo) {
        return false;
      }
      // Filtro de perfil / tipo de cliente
      if (AppState.tipoClienteFiltro && AppState.tipoClienteFiltro !== 'todos') {
        if ((lead.tipoCliente || '') !== AppState.tipoClienteFiltro) {
          return false;
        }
      }
      // Filtro de busca
      if (termo) {
        const nomeMatch = (lead.nome || '').toLowerCase().includes(termo);
        const cidadeMatch = (lead.cidade || '').toLowerCase().includes(termo);
        const foneMatch = (lead.telefone || '').includes(termo);
        const dddMatch = String(lead.ddd || '').includes(termo);
        const tipoMatch = (lead.tipoCliente || '').toLowerCase().includes(termo);
        return nomeMatch || cidadeMatch || foneMatch || dddMatch || tipoMatch;
      }
      return true;
    });

    // Atualiza status do filtro na barra superior
    const statusFiltro = document.getElementById('kanban-filter-status');
    if (statusFiltro) {
      if (AppState.vendedorAtivo !== 'todos' || termo || (AppState.tipoClienteFiltro && AppState.tipoClienteFiltro !== 'todos')) {
        statusFiltro.textContent = `Exibindo ${leadsFiltrados.length} de ${todosLeads.length} leads`;
      } else {
        statusFiltro.textContent = `Exibindo todos os ${todosLeads.length} leads`;
      }
    }

    // Calcula e renderiza os cards em cada estágio
    let totalPipelineGeral = 0;

    ESTAGIOS_LISTA.forEach(estagio => {
      const containerCards = document.getElementById(`cards-${estagio}`);
      const badgeCount = document.getElementById(`count-${estagio}`);
      const textTotal = document.getElementById(`total-${estagio}`);

      if (!containerCards) return;

      const leadsDoEstagio = leadsFiltrados.filter(l => l.estagio === estagio);
      const somaEstagio = leadsDoEstagio.reduce((acc, l) => acc + (Number(l.valorProposta) || 0), 0);

      if (estagio !== 'perdido') {
        totalPipelineGeral += somaEstagio;
      }

      if (badgeCount) badgeCount.textContent = leadsDoEstagio.length;
      if (textTotal) textTotal.textContent = formatarMoeda(somaEstagio);

      // Limpa cards antigos
      containerCards.innerHTML = '';

      if (leadsDoEstagio.length === 0) {
        containerCards.innerHTML = `
          <div class="crm-kanban-col__empty">
            Nenhum lead nesta etapa
          </div>
        `;
        return;
      }

      leadsDoEstagio.forEach(lead => {
        const cardElem = criarCardElement(lead);
        containerCards.appendChild(cardElem);
      });
    });

    // Atualiza Total do Pipeline
    const kpiPipeline = document.getElementById('kpi-pipeline-total');
    if (kpiPipeline) {
      kpiPipeline.textContent = formatarMoeda(totalPipelineGeral);
    }

    // Atualiza contadores globais
    atualizarContadoresHeader();
  }

  // ==========================================================================
  // POPOVER E GESTÃO DE TIPO DE CLIENTE (DISTRIBUIDOR, LICITAÇÃO, ETC)
  // ==========================================================================
  let popoverTipoAtivo = null;

  function fecharPopoverTipoCliente() {
    if (popoverTipoAtivo) {
      if (popoverTipoAtivo.parentNode) {
        popoverTipoAtivo.parentNode.removeChild(popoverTipoAtivo);
      }
      popoverTipoAtivo = null;
    }
    document.querySelectorAll('.crm-card__tipo-btn[aria-expanded="true"]').forEach(btn => {
      btn.setAttribute('aria-expanded', 'false');
    });
  }

  function abrirMenuTipoCliente(e, leadId) {
    e.stopPropagation();
    fecharPopoverTipoCliente();

    const btn = e.currentTarget;
    btn.setAttribute('aria-expanded', 'true');

    const todos = obterTodosOsLeads();
    const lead = todos.find(l => l.id === leadId);
    if (!lead) return;

    const rect = btn.getBoundingClientRect();
    const popover = document.createElement('div');
    popover.className = 'crm-tipo-popover';
    popover.setAttribute('role', 'menu');

    const opcoes = [
      { id: 'distribuidor', titulo: 'Distribuidor', icon: '🏢', desc: 'Revenda / Atacado' },
      { id: 'licitacao', titulo: 'Licitação', icon: '🏛️', desc: 'Órgãos Públicos / Pregão' },
      { id: 'consumidor_final', titulo: 'Consumidor Final', icon: '🛒', desc: 'Uso Próprio / Facilities' },
      { id: 'outro', titulo: 'Outro', icon: '📦', desc: 'Parcerias / Outros' }
    ];

    let itemsHtml = `
      <div class="crm-tipo-popover__header">Classificação do Cliente</div>
    `;

    opcoes.forEach(opt => {
      const isSelected = (lead.tipoCliente === opt.id);
      itemsHtml += `
        <button type="button" class="crm-tipo-popover__option ${isSelected ? 'is-active' : ''}" data-tipo="${opt.id}" role="menuitem">
          <div class="crm-tipo-popover__left">
            <span class="crm-tipo-popover__opt-icon">${opt.icon}</span>
            <div>
              <span class="crm-tipo-popover__opt-title">${opt.titulo}</span>
              <span class="crm-tipo-popover__opt-desc">${opt.desc}</span>
            </div>
          </div>
          ${isSelected ? '<span class="crm-tipo-popover__check">✓</span>' : ''}
        </button>
      `;
    });

    popover.innerHTML = itemsHtml;
    document.body.appendChild(popover);
    popoverTipoAtivo = popover;

    // Posicionamento com base nas coordenadas do botão
    const popoverRect = popover.getBoundingClientRect();
    let top = rect.bottom + 4;
    let left = rect.left;

    // Se vazar embaixo da janela
    if (top + popoverRect.height > window.innerHeight - 10) {
      top = Math.max(10, rect.top - popoverRect.height - 4);
    }
    // Se vazar na direita da janela
    if (left + popoverRect.width > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - popoverRect.width - 10);
    }

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;

    // Eventos de clique nas opções
    popover.querySelectorAll('.crm-tipo-popover__option').forEach(optBtn => {
      optBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const novoTipo = optBtn.getAttribute('data-tipo');
        definirTipoCliente(leadId, novoTipo);
        fecharPopoverTipoCliente();
      });
    });
  }

  function definirTipoCliente(leadId, novoTipo) {
    let leadAtualizado = null;

    if (window.IsapelCRM && typeof window.IsapelCRM.atualizarLead === 'function') {
      leadAtualizado = window.IsapelCRM.atualizarLead(leadId, { tipoCliente: novoTipo });
    } else {
      const todos = obterTodosOsLeads();
      const lead = todos.find(l => l.id === leadId);
      if (lead) {
        lead.tipoCliente = novoTipo;
        lead.dataAtualizacao = new Date().toISOString();
        lead._tsLocal = Date.now();
        localStorage.setItem('isapel_crm_leads_v1', JSON.stringify(todos));
        leadAtualizado = lead;
      }
    }

    // Sincronizar com nuvem se disponível
    if (leadAtualizado && window.IsapelSync && typeof window.IsapelSync.salvarLeadNuvem === 'function') {
      window.IsapelSync.salvarLeadNuvem(leadAtualizado);
    }

    playSound('drop');
    const labelsMap = {
      distribuidor: 'Distribuidor',
      licitacao: 'Licitação',
      consumidor_final: 'Consumidor Final',
      outro: 'Outro'
    };
    showToast(`Cliente definido como: ${labelsMap[novoTipo] || novoTipo}`, 'success', 2200);

    renderizarKanban();
  }

  // Listeners globais de fechamento do popover
  document.addEventListener('click', (e) => {
    if (popoverTipoAtivo && !popoverTipoAtivo.contains(e.target) && !e.target.closest('.btn-tipo-cliente')) {
      fecharPopoverTipoCliente();
    }
  });
  window.addEventListener('resize', fecharPopoverTipoCliente);
  window.addEventListener('scroll', fecharPopoverTipoCliente, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharPopoverTipoCliente();
  });

  function criarCardElement(lead) {
    const card = document.createElement('div');
    card.className = 'crm-card';
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', lead.id);
    card.setAttribute('data-stage', lead.estagio);

    // Vendedor Info
    const nomesMap = { maciel: 'Maciel', fernanda: 'Fernanda', caio: 'Caio', albert: 'Albert', daniel: 'Daniel' };
    const iniciaisMap = { maciel: 'GM', fernanda: 'FE', caio: 'CA', albert: 'AL', daniel: 'DA' };
    const sellerName = nomesMap[lead.vendedorId] || (lead.vendedorId ? lead.vendedorId.toUpperCase() : 'Maciel');
    const sellerInitials = iniciaisMap[lead.vendedorId] || (lead.vendedorId ? lead.vendedorId.substring(0, 2).toUpperCase() : 'GM');

    // Tipo de Cliente
    const tiposMap = {
      distribuidor: { titulo: 'Distribuidor', icon: '🏢', classe: 'crm-card__tipo-btn--distribuidor' },
      licitacao: { titulo: 'Licitação', icon: '🏛️', classe: 'crm-card__tipo-btn--licitacao' },
      consumidor_final: { titulo: 'Consumidor Final', icon: '🛒', classe: 'crm-card__tipo-btn--consumidor_final' },
      outro: { titulo: 'Outro', icon: '📦', classe: 'crm-card__tipo-btn--outro' }
    };
    const tipoInfo = tiposMap[lead.tipoCliente] || { titulo: '+ Tipo de Cliente', icon: '🏷️', classe: 'crm-card__tipo-btn--indefinido' };

    // Telefone e WhatsApp Link
    const rawDigits = extrairApenasDigitos(lead.telefone);
    let waPhone = rawDigits;
    if (!waPhone.startsWith('55') && waPhone.length >= 10) {
      waPhone = `55${waPhone}`;
    }
    const waText = encodeURIComponent(`Olá ${lead.contatoNome || lead.nome}, aqui é ${sellerName} da Isapel Papéis! Gostaria de conversar sobre nossa linha de papéis institucionais.`);
    const waLink = `https://wa.me/${waPhone}?text=${waText}`;

    // Última Anotação
    let ultimaNota = lead.observacoes || 'Sem observações registradas.';
    const historico = lead.historico || lead.historicoContatos || [];
    if (historico.length > 0) {
      const ult = historico[historico.length - 1];
      ultimaNota = ult.descricao || ult.anotacao || ult.texto || ultimaNota;
    }

    // Região
    const dddLabel = lead.ddd ? `DDD ${lead.ddd}` : 'DDD';
    let cidadeCurta = lead.cidade || 'SP';
    if (cidadeCurta.includes('São Paulo')) cidadeCurta = 'São Paulo';
    else if (cidadeCurta.includes('Campinas')) cidadeCurta = 'Campinas';
    else if (cidadeCurta.includes('Ribeirão')) cidadeCurta = 'Ribeirão';
    else if (cidadeCurta.includes('Vale do Paraíba')) cidadeCurta = 'S. José / Taubaté';
    else if (cidadeCurta.length > 14) cidadeCurta = cidadeCurta.slice(0, 13) + '…';

    card.innerHTML = `
      <div class="crm-card__top">
        <span class="crm-card__region-badge" title="${lead.cidade || ''} - ${lead.regiao || ''}">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-right: 3px; vertical-align: -1px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>${dddLabel} • ${cidadeCurta}
        </span>
        <span class="crm-card__seller-chip"><span class="crm-card__seller-dot"></span>${sellerInitials} • ${sellerName}</span>
      </div>

      <div class="crm-card__client-name" title="${lead.nome}">${lead.nome}</div>

      <div class="crm-card__tipo-row">
        <button type="button" class="crm-card__tipo-btn ${tipoInfo.classe} btn-tipo-cliente" data-id="${lead.id}" title="Alterar classificação do cliente (Distribuidor, Licitação, Consumidor Final, Outro)" aria-haspopup="true" aria-expanded="false">
          <span class="crm-card__tipo-icon">${tipoInfo.icon}</span>
          <span class="crm-card__tipo-text">${tipoInfo.titulo}</span>
          <svg class="crm-card__tipo-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>

      <div class="crm-card__contact-row">
        <span class="crm-card__phone-text">${lead.telefoneFormatado || lead.telefone}</span>
        <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="crm-card__whatsapp-btn" title="Conversar no WhatsApp" aria-label="Conversar no WhatsApp com ${lead.nome}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-right: 4px; vertical-align: -1px;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg><span>WhatsApp</span>
        </a>
      </div>

      <div style="display: flex; align-items: center; justify-content: flex-end; font-size: 0.8rem; margin-top: 0.2rem;">
        <strong style="color: var(--isapel-navy); font-size: 0.88rem;">${formatarMoeda(lead.valorProposta || 0)}</strong>
      </div>

      <div class="crm-card__notes-snippet" title="${ultimaNota}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-right: 4px; vertical-align: -1px; flex-shrink: 0;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>${ultimaNota}</span>
      </div>

      <div class="crm-card__footer">
        <div style="display: flex; gap: 0.3rem;">
          <button type="button" class="crm-card__btn-advance btn-add-note" data-id="${lead.id}" title="Adicionar anotação">
            + Nota
          </button>
          <button type="button" class="crm-card__btn-advance btn-edit-lead" data-id="${lead.id}" title="Editar informações">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-right: 3px; vertical-align: -1px;"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>Editar
          </button>
        </div>
        ${lead.estagio !== 'fechado' && lead.estagio !== 'perdido' ? `
          <button type="button" class="crm-card__btn-advance btn-advance-stage" data-id="${lead.id}" style="font-weight: 700; color: var(--isapel-sky-dark);" title="Avançar para a próxima coluna">
            Avançar &rarr;
          </button>
        ` : ''}
      </div>
    `;

    // Eventos de Drag & Drop
    configurarDragEventsNoCard(card, lead);

    // Evento de Alteração de Tipo de Cliente
    const btnTipo = card.querySelector('.btn-tipo-cliente');
    if (btnTipo) {
      btnTipo.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirMenuTipoCliente(e, lead.id);
      });
    }

    // Eventos de botões do card
    const btnNota = card.querySelector('.btn-add-note');
    if (btnNota) {
      btnNota.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirModalNotas(lead.id);
      });
    }

    const btnEdit = card.querySelector('.btn-edit-lead');
    if (btnEdit) {
      btnEdit.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirModalEditar(lead.id);
      });
    }

    const btnAvancar = card.querySelector('.btn-advance-stage');
    if (btnAvancar) {
      btnAvancar.addEventListener('click', (e) => {
        e.stopPropagation();
        avancarEstagioLead(lead.id);
      });
    }

    return card;
  }

  // ==========================================================================
  // 8. DRAG AND DROP NATIVO HTML5
  // ==========================================================================
  let cardArrastadoId = null;

  function configurarDragEventsNoCard(cardElem, lead) {
    cardElem.addEventListener('dragstart', (e) => {
      cardArrastadoId = lead.id;
      cardElem.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', lead.id);
    });

    cardElem.addEventListener('dragend', () => {
      cardElem.classList.remove('is-dragging');
      cardArrastadoId = null;
      document.querySelectorAll('.crm-kanban-col').forEach(col => {
        col.classList.remove('is-drag-over');
      });
    });
  }

  function inicializarKanbanDropTargets() {
    const colunas = document.querySelectorAll('.crm-kanban-col');

    colunas.forEach(coluna => {
      const estagioDestino = coluna.getAttribute('data-stage');

      coluna.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        coluna.classList.add('is-drag-over');
      });

      coluna.addEventListener('dragenter', (e) => {
        e.preventDefault();
        coluna.classList.add('is-drag-over');
      });

      coluna.addEventListener('dragleave', (e) => {
        // Remove apenas se saiu dos limites da coluna
        if (!coluna.contains(e.relatedTarget)) {
          coluna.classList.remove('is-drag-over');
        }
      });

      coluna.addEventListener('drop', (e) => {
        e.preventDefault();
        coluna.classList.remove('is-drag-over');

        const leadId = e.dataTransfer.getData('text/plain') || cardArrastadoId;
        if (!leadId) return;

        moverLeadDeEstagio(leadId, estagioDestino);
      });
    });
  }

  function moverLeadDeEstagio(leadId, novoEstagio) {
    if (!leadId || !novoEstagio) return;

    let leadAtualizado = null;
    if (window.IsapelCRM && typeof window.IsapelCRM.moverEstagioLead === 'function') {
      leadAtualizado = window.IsapelCRM.moverEstagioLead(leadId, novoEstagio);
    } else {
      const todos = obterTodosOsLeads();
      const lead = todos.find(l => l.id === leadId);
      if (lead) {
        lead.estagio = novoEstagio;
        const agora = new Date().toISOString();
        lead.dataUltimoContato = agora;
        lead.dataAtualizacao = agora;
        lead._tsLocal = Date.now();
        localStorage.setItem('isapel_crm_leads_v1', JSON.stringify(todos));
        leadAtualizado = lead;
      }
    }

    playSound('drop');
    renderizarKanban();
    sincronizarArena3D();

    // Sincronizar mudança de estágio no Supabase
    if (window.IsapelCRM && typeof window.IsapelCRM.obterLeadPorId === 'function' && window.IsapelSync) {
      if (!leadAtualizado) {
        leadAtualizado = window.IsapelCRM.obterLeadPorId(leadId);
      }
      if (leadAtualizado) {
        window.IsapelSync.salvarLeadNuvem(leadAtualizado);
      }
    } else if (leadAtualizado && window.IsapelSync && typeof window.IsapelSync.salvarLeadNuvem === 'function') {
      window.IsapelSync.salvarLeadNuvem(leadAtualizado);
    }

    // Microinteração elástica de assentamento do card
    const droppedCard = document.querySelector(`.crm-card[data-id="${leadId}"]`);
    if (droppedCard) {
      droppedCard.classList.add('is-just-dropped');
      setTimeout(() => droppedCard.classList.remove('is-just-dropped'), 350);
    }

    if (novoEstagio === 'fechado') {
      showToast('Parabéns! Venda fechada com sucesso!', 'success', 4000);
      if (window.Arena3D && typeof window.Arena3D.celebrarVenda === 'function') {
        window.Arena3D.celebrarVenda();
      }
    }
  }

  function avancarEstagioLead(leadId) {
    const todos = obterTodosOsLeads();
    const lead = todos.find(l => l.id === leadId);
    if (!lead) return;

    const indexAtual = ESTAGIOS_LISTA.indexOf(lead.estagio);
    if (indexAtual >= 0 && indexAtual < ESTAGIOS_LISTA.length - 2) { // Não avança para 'perdido'
      const proxEstagio = ESTAGIOS_LISTA[indexAtual + 1];
      moverLeadDeEstagio(leadId, proxEstagio);
      showToast(`Lead avançado para "${proxEstagio.toUpperCase()}"`, 'info');
    }
  }

  // ==========================================================================
  // 9. NAVEGAÇÃO DE ABAS
  // ==========================================================================
  function inicializarAbas() {
    const tabBtns = document.querySelectorAll('.crm-header__tab-btn');
    const tabSections = document.querySelectorAll('.tab-section');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTabId = btn.getAttribute('data-tab');
        alternarAba(targetTabId);
      });
    });

    // Botão de atalho do header para Fechamento
    const btnQuickFechamento = document.getElementById('btn-quick-fechamento-header');
    if (btnQuickFechamento) {
      btnQuickFechamento.addEventListener('click', () => {
        alternarAba('tab-fechamento');
      });
    }
  }

  function alternarAba(tabId) {
    // Guarda de rota estrita de RBAC para a Aba de Gestão (somente Diretoria)
    if (tabId === 'tab-gestao') {
      const perfil = (typeof window !== 'undefined' && window.IsapelAuth && typeof window.IsapelAuth.obterPerfil === 'function')
        ? window.IsapelAuth.obterPerfil()
        : null;
      if (perfil !== 'diretoria') {
        showToast('Acesso restrito à Diretoria Comercial.', 'warning');
        alternarAba('tab-funil');
        return;
      }
    }

    AppState.abaAtiva = tabId;

    // Atualiza botões e atributos ARIA
    document.querySelectorAll('.crm-header__tab-btn').forEach(btn => {
      const isActive = btn.getAttribute('data-tab') === tabId;
      if (isActive) {
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
        btn.setAttribute('tabindex', '0');
      } else {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-selected', 'false');
        btn.setAttribute('tabindex', '-1');
      }
    });

    // Atualiza seções
    document.querySelectorAll('.tab-section').forEach(sec => {
      const isActive = sec.id === tabId;
      if (isActive) {
        sec.classList.add('is-active');
        sec.removeAttribute('hidden');
        sec.style.display = 'block';
      } else {
        sec.classList.remove('is-active');
        sec.setAttribute('hidden', 'until-found');
        sec.style.display = 'none';
      }
    });

    // Ações específicas ao abrir cada aba
    if (tabId === 'tab-arena') {
      sincronizarArena3D();
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        sincronizarArena3D();
      }, 100);
    } else if (tabId === 'tab-fechamento') {
      renderizarAnalytics();
      atualizarPainelFechamento();
    } else if (tabId === 'tab-gestao') {
      renderizarTabelaVendedores();
    }
  }

  // Exposição global para navegação e automação de testes
  if (typeof window !== 'undefined') {
    window.alternarAba = alternarAba;
  }

  // ==========================================================================
  // 10. SELETOR DE VENDEDOR NO TOPO
  // ==========================================================================
  function inicializarSeletorVendedor() {
    const select = document.getElementById('vendedor-select');
    const avatar = document.getElementById('header-active-avatar');

    if (!select) return;

    select.addEventListener('change', async (e) => {
      const sessao = (window.IsapelAuth && typeof window.IsapelAuth.obterSessao === 'function')
        ? window.IsapelAuth.obterSessao()
        : null;

      // Se for vendedor, trava e reverte imediatamente
      if (sessao && sessao.perfil === 'vendedor') {
        select.value = sessao.vendedorId;
        AppState.vendedorAtivo = sessao.vendedorId;
        AppState.analytics.vendedorFiltro = sessao.vendedorId;
        return;
      }

      AppState.vendedorAtivo = e.target.value;
      AppState.analytics.vendedorFiltro = e.target.value;

      if (avatar) {
        if (AppState.vendedorAtivo === 'maciel') avatar.textContent = 'GM';
        else if (AppState.vendedorAtivo === 'fernanda') avatar.textContent = 'FE';
        else if (AppState.vendedorAtivo === 'caio') avatar.textContent = 'CA';
        else if (AppState.vendedorAtivo === 'albert') avatar.textContent = 'AL';
        else if (AppState.vendedorAtivo === 'daniel') avatar.textContent = 'DA';
        else avatar.textContent = 'ALL';
      }

      // Sincroniza seletor da aba de analytics se estiver no DOM
      const analyticsSelect = document.getElementById('analytics-vendedor-select');
      if (analyticsSelect && analyticsSelect.value !== e.target.value) {
        analyticsSelect.value = e.target.value;
      }
      renderizarAnalytics();

      renderizarKanban();
      showToast(`Visualização filtrada para: ${select.options[select.selectedIndex].text}`, 'info', 2000);

      // Se nuvem estiver ativa e for diretoria, sincroniza dados filtrados
      if (window.IsapelSync && sessao && sessao.perfil === 'diretoria') {
        const leads = await window.IsapelSync.carregarLeadsNuvem(AppState.vendedorAtivo);
        if (leads && Array.isArray(leads) && window.IsapelCRM) {
          window.IsapelCRM.definirLeads(leads);
          renderizarKanban();
          sincronizarArena3D();
          renderizarAnalytics();
        }
      }
    });
  }

  function atualizarContadoresHeader() {
    const todos = obterTodosOsLeads();
    const badgeTotal = document.getElementById('header-total-leads-badge');
    if (badgeTotal) {
      badgeTotal.textContent = todos.length;
    }
  }

  // ==========================================================================
  // 11. ARENA 3D - SINCRONIZAÇÃO E CONTROLES
  // ==========================================================================
  function sincronizarArena3D() {
    const todos = obterTodosOsLeads();
    let metricas = null;

    if (window.IsapelCRM && typeof window.IsapelCRM.calcularMetricasArena === 'function') {
      metricas = window.IsapelCRM.calcularMetricasArena('todos', todos);
    } else {
      metricas = calcularMetricasArenaFallback();
    }

    if (!metricas) return;

    const rankingArray = Array.isArray(metricas) ? metricas : Object.values(metricas);

    // Se o Three.js da Arena3D estiver ativo, atualiza com os dados reais
    if (window.Arena3D && typeof window.Arena3D.atualizar === 'function') {
      window.Arena3D.atualizar(rankingArray);
    }

    // Atualiza o Pódio 2D da coluna lateral
    function atualizarPilar(num, p) {
      if (!p) return;
      const elNome = document.getElementById(`podium-name-${num}`);
      const elVal = document.getElementById(`podium-score-${num}`);
      const elAv = document.getElementById(`podium-avatar-${num}`);

      const nomesMap = { maciel: 'Gabriel Maciel', fernanda: 'Fernanda', caio: 'Caio', albert: 'Albert', daniel: 'Daniel' };
      const iniciaisMap = { maciel: 'GM', fernanda: 'FE', caio: 'CA', albert: 'AL', daniel: 'DA' };
      const nomeVendedor = p.vendedor?.nome || nomesMap[p.vendedorId] || p.vendedorId;
      const iniciais = iniciaisMap[p.vendedorId] || (p.vendedorId ? p.vendedorId.substring(0, 2).toUpperCase() : 'CO');

      if (elNome) elNome.textContent = nomeVendedor;
      if (elVal) elVal.textContent = p.volumeTotalFaturado > 0 ? formatarMoeda(p.volumeTotalFaturado) : `${p.pontuacaoGeral || 0} XP`;
      if (elAv) elAv.textContent = iniciais;
    }

    atualizarPilar(1, rankingArray[0]);
    atualizarPilar(2, rankingArray[1]);
    atualizarPilar(3, rankingArray[2]);

    // Atualiza as barras de progresso laterais
    rankingArray.forEach(p => {
      const id = p.vendedorId;
      const valEl = document.getElementById(`ranking-val-${id}`);
      const barEl = document.getElementById(`ranking-bar-${id}`);
      if (valEl) {
        valEl.textContent = p.volumeTotalFaturado > 0 
          ? formatarMoeda(p.volumeTotalFaturado) 
          : `${p.totalCadastrados || 0} leads (${p.pontuacaoGeral || 0} XP)`;
      }
      if (barEl) {
        const metasMap = { maciel: 60000, fernanda: 45000, caio: 35000, albert: 45000, daniel: 45000 };
        const meta = metasMap[id] || 40000;
        const faturado = p.volumeTotalFaturado || 0;
        const pct = Math.min(100, Math.max(5, Math.round((faturado / meta) * 100)));
        barEl.style.width = `${pct}%`;
      }
    });
  }

  function calcularMetricasArenaFallback() {
    const todos = obterTodosOsLeads();
    const res = {
      maciel: { id: 'maciel', nome: 'Gabriel Maciel', valorTotal: 0, fardosTotal: 0, fechados: 0, negociando: 0 },
      fernanda: { id: 'fernanda', nome: 'Fernanda', valorTotal: 0, fardosTotal: 0, fechados: 0, negociando: 0 },
      caio: { id: 'caio', nome: 'Caio', valorTotal: 0, fardosTotal: 0, fechados: 0, negociando: 0 },
      albert: { id: 'albert', nome: 'Albert', valorTotal: 0, fardosTotal: 0, fechados: 0, negociando: 0 },
      daniel: { id: 'daniel', nome: 'Daniel', valorTotal: 0, fardosTotal: 0, fechados: 0, negociando: 0 }
    };

    todos.forEach(lead => {
      const v = res[lead.vendedorId];
      if (!v) return;
      const val = Number(lead.valorProposta) || 0;
      if (lead.estagio === 'fechado') {
        v.valorTotal += val;
        v.fechados += 1;
        v.fardosTotal += Math.round(val / 75);
      } else if (lead.estagio === 'negociacao') {
        v.negociando += 1;
      }
    });

    return res;
  }

  function inicializarBotoesArena() {
    const btnComemorar = document.getElementById('btn-arena-comemorar');
    if (btnComemorar) {
      btnComemorar.addEventListener('click', () => {
        if (window.Arena3D && typeof window.Arena3D.celebrarVenda === 'function') {
          window.Arena3D.celebrarVenda();
        }
        playSound('fechamento');
        showToast('Comemoração da equipe ativada com confetes!', 'success');
      });
    }

    const btnResetCam = document.getElementById('btn-arena-reset-camera');
    if (btnResetCam) {
      btnResetCam.addEventListener('click', () => {
        if (window.Arena3D && typeof window.Arena3D.resetarCamera === 'function') {
          window.Arena3D.resetarCamera();
        }
        showToast('Câmera da Arena redefinida.', 'info', 1800);
      });
    }
  }

  // ==========================================================================
  // 11.5. ABA DE EXIBIÇÃO TOTAL & ANALYTICS DE VENDAS
  // ==========================================================================
  function inicializarAnalytics() {
    const selectVendedor = document.getElementById('analytics-vendedor-select');
    const pillsContainer = document.getElementById('analytics-pills');
    const customDatesContainer = document.getElementById('analytics-custom-dates');
    const btnAplicarData = document.getElementById('btn-aplicar-data-custom');
    const btnToggleAccordion = document.getElementById('btn-toggle-fechamento-operacional');
    const contentAccordion = document.getElementById('content-fechamento-operacional');

    // Inicializa valores padrões dos inputs de data custom se vazios
    const inputInicio = document.getElementById('analytics-data-inicio');
    const inputFim = document.getElementById('analytics-data-fim');
    if (inputInicio && inputFim && !inputInicio.value) {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      inputInicio.value = `${ano}-${mes}-01`;
      inputFim.value = `${ano}-${mes}-${dia}`;
    }

    // 0. Filtros do Relatório Gerencial de Leads (Executivo)
    const selectGerencialVendedor = document.getElementById('gerencial-vendedor-select');
    if (selectGerencialVendedor) {
      selectGerencialVendedor.addEventListener('change', (e) => {
        const sessao = (window.IsapelAuth && typeof window.IsapelAuth.obterSessao === 'function')
          ? window.IsapelAuth.obterSessao()
          : null;

        if (sessao && sessao.perfil === 'vendedor') {
          selectGerencialVendedor.value = sessao.vendedorId;
          AppState.analytics.vendedorFiltro = sessao.vendedorId;
          return;
        }

        AppState.analytics.vendedorFiltro = e.target.value;

        // Sincroniza seletor do header e legado
        const headerSelect = document.getElementById('vendedor-select');
        if (headerSelect && headerSelect.value !== e.target.value) {
          headerSelect.value = e.target.value;
          AppState.vendedorAtivo = e.target.value;
          renderizarKanban();
        }
        if (selectVendedor && selectVendedor.value !== e.target.value) {
          selectVendedor.value = e.target.value;
        }

        renderizarAnalytics();
      });
    }

    const selectGerencialPeriodo = document.getElementById('gerencial-periodo-select');
    const gerencialCustomDates = document.getElementById('gerencial-custom-dates');
    const inputGerencialInicio = document.getElementById('gerencial-data-inicio');
    const inputGerencialFim = document.getElementById('gerencial-data-fim');
    const btnAplicarGerencialData = document.getElementById('btn-aplicar-gerencial-data');

    // Inicializa valores padrões do filtro personalizado gerencial se vazios
    if (inputGerencialInicio && inputGerencialFim && (!inputGerencialInicio.value || !inputGerencialFim.value)) {
      const agora = new Date();
      const ano = agora.getFullYear();
      const mes = String(agora.getMonth() + 1).padStart(2, '0');
      const dia = String(agora.getDate()).padStart(2, '0');
      inputGerencialInicio.value = `${ano}-${mes}-01`;
      inputGerencialFim.value = `${ano}-${mes}-${dia}`;
    }

    if (selectGerencialPeriodo) {
      selectGerencialPeriodo.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'custom') {
          if (gerencialCustomDates) gerencialCustomDates.style.display = 'flex';
          AppState.analytics.periodo = 'custom';
          if (inputGerencialInicio && inputGerencialFim && inputGerencialInicio.value && inputGerencialFim.value) {
            AppState.analytics.dataInicio = inputGerencialInicio.value;
            AppState.analytics.dataFim = inputGerencialFim.value;
          }
        } else {
          if (gerencialCustomDates) gerencialCustomDates.style.display = 'none';
          AppState.analytics.periodo = val;
          AppState.analytics.dataInicio = null;
          AppState.analytics.dataFim = null;
        }
        renderizarAnalytics();
      });
    }

    if (btnAplicarGerencialData) {
      btnAplicarGerencialData.addEventListener('click', (e) => {
        e.preventDefault();
        if (!inputGerencialInicio || !inputGerencialFim || !inputGerencialInicio.value || !inputGerencialFim.value) {
          if (typeof showToast === 'function') showToast('Selecione as datas inicial e final.', 'warning', 2500);
          return;
        }
        if (inputGerencialInicio.value > inputGerencialFim.value) {
          if (typeof showToast === 'function') showToast('A data inicial não pode ser maior que a final.', 'warning', 2500);
          return;
        }
        AppState.analytics.periodo = 'custom';
        AppState.analytics.dataInicio = inputGerencialInicio.value;
        AppState.analytics.dataFim = inputGerencialFim.value;
        renderizarAnalytics();
        if (typeof showToast === 'function') showToast('Período personalizado aplicado.', 'info', 2000);
      });
    }

    // Reatividade imediata ao trocar qualquer data dos inputs
    [inputGerencialInicio, inputGerencialFim].forEach(inp => {
      if (inp) {
        inp.addEventListener('change', () => {
          if (inputGerencialInicio.value && inputGerencialFim.value && inputGerencialInicio.value <= inputGerencialFim.value) {
            AppState.analytics.periodo = 'custom';
            AppState.analytics.dataInicio = inputGerencialInicio.value;
            AppState.analytics.dataFim = inputGerencialFim.value;
            renderizarAnalytics();
          }
        });
      }
    });

    const selectGerencialOrigem = document.getElementById('gerencial-origem-select');
    if (selectGerencialOrigem) {
      selectGerencialOrigem.addEventListener('change', (e) => {
        AppState.analytics.origemFiltro = e.target.value;
        renderizarAnalytics();
      });
    }

    // Botões de Foto do Relatório Gerencial para Envio à Diretoria
    const btnFotoTopbar = document.getElementById('btn-capturar-relatorio-foto');
    if (btnFotoTopbar) {
      btnFotoTopbar.addEventListener('click', (e) => {
        e.preventDefault();
        capturarFotoRelatorio();
      });
    }

    const btnFotoHeader = document.getElementById('btn-capturar-relatorio-foto-header');
    if (btnFotoHeader) {
      btnFotoHeader.addEventListener('click', (e) => {
        e.preventDefault();
        capturarFotoRelatorio();
      });
    }

    // 1. Filtro de Vendedor (RBAC-aware)
    if (selectVendedor) {
      selectVendedor.addEventListener('change', (e) => {
        const sessao = (window.IsapelAuth && typeof window.IsapelAuth.obterSessao === 'function')
          ? window.IsapelAuth.obterSessao()
          : null;

        // Se for vendedor, reverte imediatamente para seu ID
        if (sessao && sessao.perfil === 'vendedor') {
          selectVendedor.value = sessao.vendedorId;
          AppState.analytics.vendedorFiltro = sessao.vendedorId;
          return;
        }

        AppState.analytics.vendedorFiltro = e.target.value;

        // Sincroniza seletor de vendedor do header
        const headerSelect = document.getElementById('vendedor-select');
        if (headerSelect && headerSelect.value !== e.target.value) {
          headerSelect.value = e.target.value;
          AppState.vendedorAtivo = e.target.value;
          renderizarKanban();
        }

        if (selectGerencialVendedor && selectGerencialVendedor.value !== e.target.value) {
          selectGerencialVendedor.value = e.target.value;
        }

        renderizarAnalytics();
      });
    }

    // 2. Pills de Período
    if (pillsContainer) {
      const pillButtons = pillsContainer.querySelectorAll('.crm-pill-btn');
      pillButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const periodo = btn.getAttribute('data-periodo');
          pillButtons.forEach(b => {
            b.classList.remove('is-active');
            b.setAttribute('aria-checked', 'false');
          });
          btn.classList.add('is-active');
          btn.setAttribute('aria-checked', 'true');

          if (periodo === 'custom') {
            if (customDatesContainer) customDatesContainer.style.display = 'flex';
            if (inputInicio && inputFim && inputInicio.value && inputFim.value) {
              AppState.analytics.periodo = 'custom';
              AppState.analytics.dataInicio = inputInicio.value;
              AppState.analytics.dataFim = inputFim.value;
              renderizarAnalytics();
            }
          } else {
            if (customDatesContainer) customDatesContainer.style.display = 'none';
            AppState.analytics.periodo = periodo;
            AppState.analytics.dataInicio = null;
            AppState.analytics.dataFim = null;
            renderizarAnalytics();
          }
        });
      });
    }

    // 3. Botão Aplicar Intervalo Personalizado
    if (btnAplicarData) {
      btnAplicarData.addEventListener('click', () => {
        if (!inputInicio || !inputFim || !inputInicio.value || !inputFim.value) {
          showToast('Selecione as datas de início e fim para filtrar.', 'warning', 2500);
          return;
        }
        if (inputInicio.value > inputFim.value) {
          showToast('A data inicial não pode ser posterior à data final.', 'warning', 2500);
          return;
        }
        AppState.analytics.periodo = 'custom';
        AppState.analytics.dataInicio = inputInicio.value;
        AppState.analytics.dataFim = inputFim.value;
        renderizarAnalytics();
        showToast('Filtro de período personalizado aplicado.', 'info', 2000);
      });
    }

    // 4. Filtro por Região dos Leads
    const selectRegiao = document.getElementById('analytics-regiao-select');
    if (selectRegiao) {
      selectRegiao.addEventListener('change', (e) => {
        AppState.analytics.regiaoFiltro = e.target.value;
        renderizarAnalytics();
      });
    }

    // 5. Abas Laterais: Equipe Comercial vs. Regiões dos Leads
    const btnSideEquipe = document.getElementById('btn-sidecard-equipe');
    const btnSideRegioes = document.getElementById('btn-sidecard-regioes');
    const contSideEquipe = document.getElementById('analytics-seller-distribution-container');
    const contSideRegioes = document.getElementById('analytics-regions-distribution-container');
    const sideTitle = document.getElementById('analytics-seller-card-title');
    const sideSubtitle = document.getElementById('analytics-seller-card-subtitle');

    if (btnSideEquipe && btnSideRegioes) {
      btnSideEquipe.addEventListener('click', () => {
        btnSideEquipe.classList.add('is-active');
        btnSideRegioes.classList.remove('is-active');
        AppState.analytics.sideTabAtiva = 'equipe';
        if (contSideEquipe) contSideEquipe.style.display = 'flex';
        if (contSideRegioes) contSideRegioes.style.display = 'none';
        if (sideSubtitle) sideSubtitle.textContent = 'Desempenho comparativo e pipeline por consultor';
      });

      btnSideRegioes.addEventListener('click', () => {
        btnSideRegioes.classList.add('is-active');
        btnSideEquipe.classList.remove('is-active');
        AppState.analytics.sideTabAtiva = 'regioes';
        if (contSideEquipe) contSideEquipe.style.display = 'none';
        if (contSideRegioes) contSideRegioes.style.display = 'flex';
        if (sideSubtitle) sideSubtitle.textContent = 'Concentração geográfica e volume financeiro por praça';
      });
    }

    // Clique no Card de Regiões abre a aba de regiões
    const cardKpiRegioes = document.getElementById('analytics-kpi-card-regioes');
    if (cardKpiRegioes && btnSideRegioes) {
      cardKpiRegioes.addEventListener('click', () => {
        btnSideRegioes.click();
        const sellerCard = document.getElementById('analytics-seller-card');
        if (sellerCard) sellerCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }

    // 6. Accordion Recolhível de Fechamento Operacional
    if (btnToggleAccordion && contentAccordion) {
      btnToggleAccordion.addEventListener('click', () => {
        const isExpanded = btnToggleAccordion.getAttribute('aria-expanded') === 'true';
        if (isExpanded) {
          btnToggleAccordion.setAttribute('aria-expanded', 'false');
          contentAccordion.style.display = 'none';
        } else {
          btnToggleAccordion.setAttribute('aria-expanded', 'true');
          contentAccordion.style.display = 'flex';
          atualizarPainelFechamento();
        }
      });
    }

    // 7. Listener Reativo de Atualizações Analíticas
    if (window.IsapelAnalytics && typeof window.IsapelAnalytics.registrarListener === 'function') {
      window.IsapelAnalytics.registrarListener(() => {
        renderizarAnalytics();
      });
    }
  }

  /**
   * Captura uma foto em alta resolução de toda a área do Relatório Gerencial
   * (#crm-gerencial-report-root), salva como PNG e tenta copiar para o Clipboard
   * para envio instantâneo à diretoria via WhatsApp / Email.
   */
  async function capturarFotoRelatorio() {
    const reportRoot = document.getElementById('crm-gerencial-report-root');
    if (!reportRoot) {
      if (typeof exibirToast === 'function') exibirToast('Área do relatório gerencial não localizada.', 'erro');
      return;
    }

    if (typeof html2canvas === 'undefined') {
      if (typeof exibirToast === 'function') exibirToast('Módulo de captura em inicialização. Tente novamente em alguns instantes.', 'aviso');
      return;
    }

    const btnsFoto = document.querySelectorAll('#btn-capturar-relatorio-foto, #btn-capturar-relatorio-foto-header');
    btnsFoto.forEach(b => {
      b.disabled = true;
      b.dataset.origHtml = b.innerHTML;
      b.innerHTML = `
        <span class="crm-spin-icon" aria-hidden="true">📸</span>
        <span>Gerando foto...</span>
      `;
    });

    try {
      // Breve pausa para garantir flushing de renderização
      await new Promise(res => setTimeout(res, 80));

      const canvas = await html2canvas(reportRoot, {
        scale: 2, // 2x alta resolução (retina)
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        onclone: (clonedDoc) => {
          // No clone para a foto, oculta os próprios botões de foto para imagem limpa e executiva
          const clonedBtns = clonedDoc.querySelectorAll('#btn-capturar-relatorio-foto, #btn-capturar-relatorio-foto-header');
          clonedBtns.forEach(b => {
            b.style.display = 'none';
          });
        }
      });

      const agora = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const dataStr = `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`;
      const horaStr = `${pad(agora.getHours())}h${pad(agora.getMinutes())}`;
      const nomeArquivo = `relatorio-gerencial-isapel-${dataStr}-${horaStr}.png`;

      // Converte para Blob e executa download + clipboard copy
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('Falha ao gerar blob de imagem.');
        }

        // 1. Download do arquivo PNG
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);

        // 2. Cópia direta para Área de Transferência (Clipboard API)
        let copiadoParaClipboard = false;
        if (navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            copiadoParaClipboard = true;
          } catch (clipErr) {
            console.info('[Isapel CRM] Clipboard write não suportado ou bloqueado no contexto atual:', clipErr);
          }
        }

        const msgSucesso = copiadoParaClipboard
          ? '📸 Foto do relatório baixada e copiada para a área de transferência! (Pronta para colar no WhatsApp da diretoria)'
          : '📸 Foto do relatório baixada com sucesso! (Salva em Downloads para envio à diretoria)';

        if (typeof exibirToast === 'function') {
          exibirToast(msgSucesso, 'sucesso');
        } else {
          alert(msgSucesso);
        }
      }, 'image/png');

    } catch (err) {
      console.error('[Isapel CRM] Erro ao capturar foto do relatório:', err);
      if (typeof exibirToast === 'function') {
        exibirToast('Erro ao gerar foto do relatório. Tente novamente.', 'erro');
      } else {
        alert('Erro ao gerar foto do relatório.');
      }
    } finally {
      setTimeout(() => {
        btnsFoto.forEach(b => {
          b.disabled = false;
          if (b.dataset.origHtml) {
            b.innerHTML = b.dataset.origHtml;
          }
        });
      }, 500);
    }
  }

  function renderizarAnalytics() {
    if (!window.IsapelAnalytics || typeof window.IsapelAnalytics.obterMetricasCompletas !== 'function') {
      return;
    }

    const sessao = (window.IsapelAuth && typeof window.IsapelAuth.obterSessao === 'function')
      ? window.IsapelAuth.obterSessao()
      : null;

    // RBAC: Configuração visual do seletor de vendedor
    const selectVendedor = document.getElementById('analytics-vendedor-select');
    const badgeLocked = document.getElementById('analytics-vendedor-locked-badge');
    const selectGerencialVendedor = document.getElementById('gerencial-vendedor-select');
    const badgeGerencialLocked = document.getElementById('gerencial-vendedor-locked-badge');

    if (selectGerencialVendedor) {
      if (sessao && sessao.perfil === 'vendedor') {
        selectGerencialVendedor.value = sessao.vendedorId;
        selectGerencialVendedor.disabled = true;
        if (badgeGerencialLocked) {
          badgeGerencialLocked.style.display = 'inline-flex';
          badgeGerencialLocked.textContent = `Visualização Travada (${sessao.nome || 'Vendedor'})`;
        }
        AppState.analytics.vendedorFiltro = sessao.vendedorId;
      } else {
        selectGerencialVendedor.disabled = false;
        if (badgeGerencialLocked) {
          badgeGerencialLocked.style.display = 'none';
        }
        selectGerencialVendedor.value = AppState.analytics.vendedorFiltro || 'todos';
      }
    }

    const selectGerencialPeriodo = document.getElementById('gerencial-periodo-select');
    if (selectGerencialPeriodo) {
      selectGerencialPeriodo.value = AppState.analytics.periodo || '03/11/2026';
    }

    const gerencialCustomDates = document.getElementById('gerencial-custom-dates');
    if (gerencialCustomDates) {
      gerencialCustomDates.style.display = AppState.analytics.periodo === 'custom' ? 'flex' : 'none';
    }

    const selectGerencialOrigem = document.getElementById('gerencial-origem-select');
    if (selectGerencialOrigem) {
      selectGerencialOrigem.value = AppState.analytics.origemFiltro || 'todas';
    }

    if (selectVendedor) {
      if (sessao && sessao.perfil === 'vendedor') {
        selectVendedor.value = sessao.vendedorId;
        selectVendedor.disabled = true;
        if (badgeLocked) {
          badgeLocked.style.display = 'inline-flex';
          badgeLocked.textContent = `Visualização Travada (${sessao.nome || 'Vendedor'})`;
        }
        AppState.analytics.vendedorFiltro = sessao.vendedorId;
      } else {
        selectVendedor.disabled = false;
        if (badgeLocked) {
          badgeLocked.style.display = 'none';
        }
        selectVendedor.value = AppState.analytics.vendedorFiltro || 'todos';
      }
    }

    // Executa cálculo através do motor analítico
    const resultado = window.IsapelAnalytics.obterMetricasCompletas({
      periodo: AppState.analytics.periodo,
      dataInicio: AppState.analytics.dataInicio,
      dataFim: AppState.analytics.dataFim,
      vendedorId: AppState.analytics.vendedorFiltro,
      regiao: AppState.analytics.regiaoFiltro,
      sessao: sessao
    });

    if (!resultado || !resultado.kpis) return;

    // ========================================================================
    // RENDERIZAÇÃO DO RELATÓRIO GERENCIAL DE LEADS (CONFORME PRINT EXECUTIVO)
    // ========================================================================
    const periodoAtivo = AppState.analytics.periodo || '03/11/2026';
    const vendedorFiltro = AppState.analytics.vendedorFiltro || 'todos';

    // Dinâmico a partir do motor analítico
    const recebidosVal = resultado.kpis.totalRecebidos;
    const avancaramVal = resultado.kpis.totalAvancaram !== undefined
      ? resultado.kpis.totalAvancaram
      : (resultado.kpis.totalQualificados || 0);
    const pctAvancaramNum = resultado.kpis.taxaAvancaramPct !== undefined
      ? resultado.kpis.taxaAvancaramPct
      : (resultado.kpis.taxaQualificacaoPct || 0);
    const pctAvancaramStr = `${pctAvancaramNum.toFixed(1).replace('.', ',')}%`;

    const leadsNeg = (resultado.funil && resultado.funil.find(f => f.estagio === 'negociacao')?.count) || 0;
    const negociacaoVal = leadsNeg;
    const pctNegociacaoNum = recebidosVal > 0 ? (leadsNeg / recebidosVal * 100) : 0;
    const pctNegociacaoStr = `${pctNegociacaoNum.toFixed(1).replace('.', ',')}%`;
    const ganhosVal = resultado.kpis.totalFechados;

    // 1. Atualiza 4 KPIs Executivos do Relatório Gerencial
    const elGkpiRecebidos = document.getElementById('gkpi-recebidos');
    const elGkpiAvancaram = document.getElementById('gkpi-avancaram');
    const elGkpiAvancaramBadge = document.getElementById('gkpi-avancaram-badge');
    const elGkpiNegociacao = document.getElementById('gkpi-negociacao');
    const elGkpiNegociacaoBadge = document.getElementById('gkpi-negociacao-badge');
    const elGkpiGanhos = document.getElementById('gkpi-ganhos');

    if (elGkpiRecebidos) elGkpiRecebidos.textContent = recebidosVal;
    if (elGkpiAvancaram) elGkpiAvancaram.textContent = avancaramVal;
    if (elGkpiAvancaramBadge) elGkpiAvancaramBadge.textContent = pctAvancaramStr;
    if (elGkpiNegociacao) elGkpiNegociacao.textContent = negociacaoVal;
    if (elGkpiNegociacaoBadge) elGkpiNegociacaoBadge.textContent = pctNegociacaoStr;
    if (elGkpiGanhos) elGkpiGanhos.textContent = ganhosVal;

    // 2. Coorte Label
    const elCoorte = document.getElementById('gerencial-coorte-data');
    if (elCoorte) {
      if (periodoAtivo === '03/11/2026') {
        elCoorte.textContent = '03/11/2026';
      } else if (periodoAtivo === 'custom') {
        const dIniStr = AppState.analytics.dataInicio ? AppState.analytics.dataInicio.split('-').reverse().join('/') : '';
        const dFimStr = AppState.analytics.dataFim ? AppState.analytics.dataFim.split('-').reverse().join('/') : '';
        elCoorte.textContent = (dIniStr && dFimStr) ? `${dIniStr} a ${dFimStr}` : (resultado.periodo.labelFormatado || 'Personalizado');
      } else {
        elCoorte.textContent = resultado.periodo.labelFormatado || periodoAtivo;
      }
    }

    // 3. Aproveitamento dos Leads (Barras Horizontais)
    const elAprovBarRec = document.getElementById('aprov-bar-recebidos');
    const elAprovValRec = document.getElementById('aprov-val-recebidos');
    const elAprovBarAv = document.getElementById('aprov-bar-avancaram');
    const elAprovValAv = document.getElementById('aprov-val-avancaram');
    const elAprovBarNeg = document.getElementById('aprov-bar-negociacao');
    const elAprovValNeg = document.getElementById('aprov-val-negociacao');
    const elAprovBarGan = document.getElementById('aprov-bar-ganhos');
    const elAprovValGan = document.getElementById('aprov-val-ganhos');

    if (elAprovBarRec) elAprovBarRec.style.width = '100%';
    if (elAprovValRec) elAprovValRec.textContent = recebidosVal;

    if (elAprovBarAv) elAprovBarAv.style.width = `${Math.min(pctAvancaramNum, 100)}%`;
    if (elAprovValAv) elAprovValAv.textContent = `${avancaramVal} - ${pctAvancaramStr}`;

    if (elAprovBarNeg) elAprovBarNeg.style.width = `${Math.min(pctNegociacaoNum, 100)}%`;
    if (elAprovValNeg) elAprovValNeg.textContent = `${negociacaoVal} - ${pctNegociacaoStr}`;

    if (elAprovBarGan) elAprovBarGan.style.width = `${recebidosVal > 0 ? (ganhosVal / recebidosVal * 100) : 0}%`;
    if (elAprovValGan) elAprovValGan.textContent = ganhosVal;

    // 4. Desempenho por Consultor (Consultor, Recebidos, Com perfil, Avançaram, Sem perfil)
    const tbodyConsultor = document.getElementById('tbody-desempenho-consultor');
    if (tbodyConsultor) {
      if (Array.isArray(resultado.distribuicaoVendedores) && resultado.distribuicaoVendedores.length > 0) {
        tbodyConsultor.innerHTML = '';
        resultado.distribuicaoVendedores.forEach(v => {
          const tr = document.createElement('tr');
          tr.setAttribute('data-vendedor', v.vendedorId);
          if (vendedorFiltro !== 'todos' && v.vendedorId === vendedorFiltro) {
            tr.style.backgroundColor = '#ECFDF5';
            tr.style.fontWeight = '600';
          }

          const isAtivo = (v.vendedorId === 'maciel' || v.vendedorId === 'fernanda' || v.vendedorId === 'caio');
          const corDot = isAtivo ? 'green' : 'gray';

          tr.innerHTML = `
            <td><span class="crm-gdot crm-gdot--${corDot}" aria-hidden="true"></span> ${v.nome}</td>
            <td id="cons-${v.vendedorId}-recebidos">${v.totalLeads}</td>
            <td id="cons-${v.vendedorId}-com-perfil">${v.comPerfil > 0 ? v.comPerfil : (v.totalLeads > 0 ? '0' : '—')}</td>
            <td id="cons-${v.vendedorId}-avancaram">${v.avancaram > 0 ? v.avancaram : (v.totalLeads > 0 ? '0' : '—')}</td>
            <td id="cons-${v.vendedorId}-sem-perfil">${v.semPerfil > 0 ? v.semPerfil : (v.totalLeads > 0 ? '0' : '—')}</td>
          `;
          tbodyConsultor.appendChild(tr);
        });
      }
    }

    // 5. Leads por Região (Tabela Gerencial: Número + % + Barra Proporcional)
    const tbodyRegiao = document.getElementById('tbody-leads-regiao');
    if (tbodyRegiao) {
      const macroRegioes = (resultado.distribuicaoMacroRegioes && resultado.distribuicaoMacroRegioes.length > 0)
        ? resultado.distribuicaoMacroRegioes
        : [
            { id: 'sp', nome: 'SP', cor: 'green', count: 16, pctTotal: 45.7, pctFormatada: '45,7%' },
            { id: 'litoral_sul', nome: 'Litoral Sul', cor: 'amber', count: 1, pctTotal: 2.9, pctFormatada: '2,9%' },
            { id: 'rio_de_janeiro', nome: 'Rio de Janeiro', cor: 'blue', count: 9, pctTotal: 25.7, pctFormatada: '25,7%' },
            { id: 'parana', nome: 'Paraná', cor: 'gray', count: 1, pctTotal: 2.9, pctFormatada: '2,9%' },
            { id: 'outras', nome: 'Outras Regiões', cor: 'purple', count: 8, pctTotal: 22.9, pctFormatada: '22,9%' }
          ];

      tbodyRegiao.innerHTML = '';
      macroRegioes.forEach(item => {
        if (item.id === 'outras' && item.count === 0) return;

        const tr = document.createElement('tr');
        const pctBarWidth = Math.min(Math.max(item.pctTotal, item.count > 0 ? 5 : 0), 100);
        const comPerfilVal = item.comPerfil > 0 ? item.comPerfil : '—';
        const semPerfilVal = item.semPerfil > 0 ? item.semPerfil : '—';

        tr.innerHTML = `
          <td><span class="crm-gdot crm-gdot--${item.cor}" aria-hidden="true"></span> ${item.nome}</td>
          <td>
            <div class="crm-lead-metric-cell" title="${item.nome}: ${item.count} leads (${item.pctFormatada})">
              <div class="crm-lead-metric-track" role="progressbar" aria-valuenow="${item.pctTotal}" aria-valuemin="0" aria-valuemax="100">
                <div class="crm-lead-metric-bar crm-lead-metric-bar--${item.cor}" style="width: ${pctBarWidth}%;"></div>
              </div>
              <div class="crm-lead-metric-stat">
                <strong class="crm-lead-metric-num">${item.count}</strong>
                <span class="crm-lead-metric-pct">(${item.pctFormatada})</span>
              </div>
            </div>
          </td>
          <td>${comPerfilVal}</td>
          <td>${semPerfilVal}</td>
        `;
        tbodyRegiao.appendChild(tr);
      });
    }

    // 6. Qualidade dos Leads (Tabela Gerencial: Número + % + Barra Proporcional)
    const tbodyQualidade = document.getElementById('tbody-qualidade-leads');
    if (tbodyQualidade) {
      const qualidadeDados = (resultado.distribuicaoQualidade && resultado.distribuicaoQualidade.length > 0)
        ? resultado.distribuicaoQualidade
        : [
            { id: 'perdido', nome: 'Perdido', cor: 'red', count: 4, pctTotal: 11.4, pctFormatada: '11,4%' },
            { id: 'avancado', nome: 'Avançado', cor: 'green', count: 11, pctTotal: 31.4, pctFormatada: '31,4%' },
            { id: 'sem_retorno', nome: 'Sem retorno', cor: 'gray', count: 20, pctTotal: 57.1, pctFormatada: '57,1%' }
          ];

      tbodyQualidade.innerHTML = '';
      qualidadeDados.forEach(item => {
        const tr = document.createElement('tr');
        const pctBarWidth = Math.min(Math.max(item.pctTotal, item.count > 0 ? 5 : 0), 100);
        const comPerfilVal = item.comPerfil > 0 ? item.comPerfil : '—';
        const emAtendimentoVal = item.emAtendimento > 0 ? item.emAtendimento : '—';
        const semRetornoVal = item.semRetorno > 0 ? item.semRetorno : '—';

        tr.innerHTML = `
          <td><span class="crm-gdot crm-gdot--${item.cor}" aria-hidden="true"></span> ${item.nome}</td>
          <td>
            <div class="crm-lead-metric-cell" title="${item.nome}: ${item.count} leads (${item.pctFormatada})">
              <div class="crm-lead-metric-track" role="progressbar" aria-valuenow="${item.pctTotal}" aria-valuemin="0" aria-valuemax="100">
                <div class="crm-lead-metric-bar crm-lead-metric-bar--${item.cor}" style="width: ${pctBarWidth}%;"></div>
              </div>
              <div class="crm-lead-metric-stat">
                <strong class="crm-lead-metric-num">${item.count}</strong>
                <span class="crm-lead-metric-pct">(${item.pctFormatada})</span>
              </div>
            </div>
          </td>
          <td>${comPerfilVal}</td>
          <td>${emAtendimentoVal}</td>
          <td>${semRetornoVal}</td>
        `;
        tbodyQualidade.appendChild(tr);
      });
    }

    // Atualiza opções do seletor de regiões dinamicamente
    const selectRegiao = document.getElementById('analytics-regiao-select');
    if (selectRegiao) {
      const todosLeads = (window.IsapelAnalytics && typeof window.IsapelAnalytics.obterLeads === 'function')
        ? window.IsapelAnalytics.obterLeads()
        : (AppState.leads || []);

      const regioesTodas = new Map();
      todosLeads.forEach(l => {
        const ddd = l.ddd ? String(l.ddd).trim() : '';
        const reg = l.regiao || l.cidade || (ddd ? `DDD ${ddd}` : '');
        if (reg) {
          const label = ddd ? `DDD ${ddd} - ${reg}` : reg;
          regioesTodas.set(label, (regioesTodas.get(label) || 0) + 1);
        }
      });

      const valorAtual = AppState.analytics.regiaoFiltro || 'todas';
      selectRegiao.innerHTML = `<option value="todas">Todas as Regiões (${todosLeads.length} leads)</option>`;
      Array.from(regioesTodas.entries()).sort((a, b) => b[1] - a[1]).forEach(([regNome, count]) => {
        const opt = document.createElement('option');
        opt.value = regNome;
        opt.textContent = `${regNome} (${count})`;
        if (regNome === valorAtual) opt.selected = true;
        selectRegiao.appendChild(opt);
      });
      selectRegiao.value = valorAtual;
    }

    // 1. Atualização dos 6 Bento KPIs
    const elKpiRecebidos = document.getElementById('analytics-kpi-recebidos');
    const elKpiRecebidosHint = document.getElementById('analytics-kpi-recebidos-hint');
    const elKpiQualificados = document.getElementById('analytics-kpi-qualificados');
    const elKpiTaxaQualificacao = document.getElementById('analytics-kpi-taxa-qualificacao');
    const elKpiNegociacao = document.getElementById('analytics-kpi-negociacao');
    const elKpiNegociacaoContas = document.getElementById('analytics-kpi-negociacao-contas');
    const elKpiFechadas = document.getElementById('analytics-kpi-fechadas');
    const elKpiTaxaConversao = document.getElementById('analytics-kpi-taxa-conversao');
    const elKpiTicketMedio = document.getElementById('analytics-kpi-ticket-medio');
    const elKpiTicketMedioHint = document.getElementById('analytics-kpi-ticket-medio-hint');
    const elKpiRotas = document.getElementById('analytics-kpi-rotas');
    const elKpiRotasHint = document.getElementById('analytics-kpi-rotas-hint');

    if (elKpiRecebidos) elKpiRecebidos.textContent = resultado.kpis.totalRecebidos;
    if (elKpiRecebidosHint) elKpiRecebidosHint.textContent = resultado.periodo.labelFormatado;

    if (elKpiQualificados) elKpiQualificados.textContent = resultado.kpis.totalQualificados;
    if (elKpiTaxaQualificacao) {
      elKpiTaxaQualificacao.textContent = `${resultado.kpis.taxaQualificacaoPct.toFixed(1)}% passaram do estágio inicial (${resultado.kpis.totalQualificados}/${resultado.kpis.totalRecebidos})`;
    }

    const leadsNegociacaoCount = (resultado.funil && resultado.funil.find(f => f.estagio === 'negociacao')?.count) || 0;
    if (elKpiNegociacao) elKpiNegociacao.textContent = formatarMoeda(resultado.kpis.valorEmNegociacao);
    if (elKpiNegociacaoContas) elKpiNegociacaoContas.textContent = `${leadsNegociacaoCount} contas em fechamento`;

    if (elKpiFechadas) elKpiFechadas.textContent = formatarMoeda(resultado.kpis.valorFechadoTotal);
    if (elKpiTaxaConversao) {
      elKpiTaxaConversao.textContent = `${resultado.kpis.taxaConversaoPct.toFixed(1)}% de conversão final (${resultado.kpis.totalFechados} vendas)`;
    }

    if (elKpiTicketMedio) elKpiTicketMedio.textContent = formatarMoeda(resultado.kpis.ticketMedio);
    if (elKpiTicketMedioHint) elKpiTicketMedioHint.textContent = 'Média por proposta ativa';

    if (elKpiRotas) elKpiRotas.textContent = `${resultado.kpis.regioesAtendidasCount} Regiões`;
    if (elKpiRotasHint) {
      elKpiRotasHint.textContent = AppState.analytics.regiaoFiltro !== 'todas'
        ? `Filtro ativo: ${AppState.analytics.regiaoFiltro.split('-')[0].trim()}`
        : `${resultado.kpis.totalRecebidos} leads mapeados`;
    }

    // 2. Gráfico do Funil de 6 Etapas
    const totalLeadsBadge = document.getElementById('analytics-funnel-total-leads');
    if (totalLeadsBadge) {
      totalLeadsBadge.textContent = `${resultado.kpis.totalRecebidos} Leads no período`;
    }

    const funnelBarsContainer = document.getElementById('analytics-funnel-bars-container');
    if (funnelBarsContainer) {
      funnelBarsContainer.innerHTML = '';
      if (!resultado.funil || resultado.funil.length === 0) {
        funnelBarsContainer.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); padding:1rem; text-align:center;">Nenhum dado de funil disponível para o período selecionado.</div>';
      } else {
        resultado.funil.forEach(etapa => {
          const pctVal = etapa.pctTotal.toFixed(1);
          const barWidth = Math.max(etapa.pctTotal, 3);
          const valorFormatado = formatarMoeda(etapa.valorTotal);

          const stepEl = document.createElement('div');
          stepEl.className = 'crm-funnel-step';
          stepEl.innerHTML = `
            <div class="crm-funnel-step__row">
              <div class="crm-funnel-step__left">
                <span class="crm-funnel-step__color-dot" style="background-color: ${etapa.cor};" aria-hidden="true"></span>
                <span class="crm-funnel-step__title">${etapa.titulo}</span>
              </div>
              <div class="crm-funnel-step__stats">
                <span class="crm-funnel-step__count-badge">${etapa.count} ${etapa.count === 1 ? 'lead' : 'leads'}</span>
                <span class="crm-funnel-step__pct-badge">${pctVal}%</span>
              </div>
            </div>
            <div class="crm-funnel-step__track" role="progressbar" aria-valuenow="${pctVal}" aria-valuemin="0" aria-valuemax="100" aria-label="${etapa.titulo}: ${etapa.count} leads (${pctVal}%)">
              <div class="crm-funnel-step__bar" style="width: ${barWidth}%; background-color: ${etapa.cor};"></div>
            </div>
            <div class="crm-funnel-step__meta">
              <span>Volume: <strong class="crm-funnel-step__val">${valorFormatado}</strong></span>
              <span>Participação no período</span>
            </div>
          `;
          funnelBarsContainer.appendChild(stepEl);
        });
      }
    }

    // 3. Card Lateral: Distribuição da Equipe Comercial ou Métricas do Vendedor
    const sellerCardTitle = document.getElementById('analytics-seller-card-title');
    const sellerContainer = document.getElementById('analytics-seller-distribution-container');

    if (sellerContainer) {
      sellerContainer.innerHTML = '';

      if (resultado.ehVisaoGeral) {
        if (sellerCardTitle) sellerCardTitle.textContent = 'Distribuição da Equipe Comercial';

        if (resultado.distribuicaoVendedores && resultado.distribuicaoVendedores.length > 0) {
          resultado.distribuicaoVendedores.forEach(v => {
            const row = document.createElement('div');
            row.className = 'crm-seller-row';
            row.innerHTML = `
              <div class="crm-seller-row__left">
                <div class="crm-seller-row__avatar">${v.avatar}</div>
                <div class="crm-seller-row__info">
                  <span class="crm-seller-row__name">${v.nome}</span>
                  <span class="crm-seller-row__cargo">${v.totalLeads} leads (${v.fechados} ganhos) &bull; ${v.taxaConversaoPct.toFixed(1)}% conv.</span>
                </div>
              </div>
              <div class="crm-seller-row__stats">
                <span class="crm-seller-row__val">${formatarMoeda(v.valorFechado)}</span>
                <span class="crm-seller-row__sub">Pipeline: ${formatarMoeda(v.valorPipeline)}</span>
              </div>
            `;
            sellerContainer.appendChild(row);
          });
        }
      } else {
        // Visão de vendedor individual
        const configVendedores = (window.IsapelAnalytics && typeof window.IsapelAnalytics.obterConfigVendedores === 'function')
          ? window.IsapelAnalytics.obterConfigVendedores()
          : {};
        const vendedorCfg = configVendedores[resultado.vendedorFiltro] || {};
        const vendedorNome = vendedorCfg.nome || (sessao ? sessao.nome : 'Consultor');
        const vendedorAvatar = vendedorCfg.avatar || (sessao ? sessao.avatar : 'IS');
        const vendedorCargo = vendedorCfg.cargo || 'Consultor Comercial B2B';

        if (sellerCardTitle) sellerCardTitle.textContent = `Desempenho Comercial - ${vendedorNome}`;

        const vInfo = (resultado.distribuicaoVendedores && resultado.distribuicaoVendedores.find(item => item.vendedorId === resultado.vendedorFiltro)) || {
          nome: vendedorNome,
          avatar: vendedorAvatar,
          totalLeads: resultado.kpis.totalRecebidos,
          fechados: resultado.kpis.totalFechados,
          valorPipeline: resultado.kpis.valorPipelineTotal,
          valorFechado: resultado.kpis.valorFechadoTotal,
          taxaConversaoPct: resultado.kpis.taxaConversaoPct
        };

        const scorecard = document.createElement('div');
        scorecard.className = 'crm-seller-scorecard';
        scorecard.innerHTML = `
          <div class="crm-seller-scorecard__profile">
            <div class="crm-seller-row__avatar" style="width: 44px; height: 44px; font-size: 1rem;">${vendedorAvatar}</div>
            <div class="crm-seller-row__info">
              <span class="crm-seller-row__name" style="font-size: 1rem;">${vendedorNome}</span>
              <span class="crm-seller-row__cargo">${vendedorCargo} &bull; Região de Atuação</span>
            </div>
          </div>
          <div class="crm-seller-scorecard__grid">
            <div class="crm-seller-scorecard__stat-box">
              <span class="crm-seller-scorecard__stat-label">Leads no Período</span>
              <span class="crm-seller-scorecard__stat-val">${vInfo.totalLeads}</span>
            </div>
            <div class="crm-seller-scorecard__stat-box">
              <span class="crm-seller-scorecard__stat-label">Vendas Fechadas</span>
              <span class="crm-seller-scorecard__stat-val" style="color: var(--isapel-emerald);">${vInfo.fechados}</span>
            </div>
            <div class="crm-seller-scorecard__stat-box">
              <span class="crm-seller-scorecard__stat-label">Pipeline Ativo</span>
              <span class="crm-seller-scorecard__stat-val">${formatarMoeda(vInfo.valorPipeline)}</span>
            </div>
            <div class="crm-seller-scorecard__stat-box">
              <span class="crm-seller-scorecard__stat-label">Taxa de Conversão</span>
              <span class="crm-seller-scorecard__stat-val" style="color: var(--isapel-sky-dark);">${vInfo.taxaConversaoPct.toFixed(1)}%</span>
            </div>
          </div>
        `;
        sellerContainer.appendChild(scorecard);
      }
    }

    // 4. Renderiza Lista de Regiões de Leads Recebidos
    const regionsContainer = document.getElementById('analytics-regions-distribution-container');
    if (regionsContainer) {
      regionsContainer.innerHTML = '';
      if (!resultado.distribuicaoRegioes || resultado.distribuicaoRegioes.length === 0) {
        regionsContainer.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); padding:1.5rem; text-align:center;">Nenhum lead com região mapeada para os filtros selecionados.</div>';
      } else {
        resultado.distribuicaoRegioes.forEach(reg => {
          const row = document.createElement('div');
          row.className = 'crm-region-row';
          const isSelected = AppState.analytics.regiaoFiltro === reg.chave || AppState.analytics.regiaoFiltro === reg.regiao;
          if (isSelected) row.classList.add('is-selected');

          row.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; gap:0.45rem;">
                ${reg.ddd ? `<span style="font-size:0.7rem; font-weight:800; background:rgba(2,132,199,0.12); color:var(--isapel-sky-dark); padding:2px 6px; border-radius:4px;">DDD ${reg.ddd}</span>` : ''}
                <strong style="font-size:0.85rem; color:var(--text-main);">${reg.regiao}</strong>
                ${isSelected ? '<span style="font-size:0.68rem; font-weight:700; color:var(--isapel-emerald); background:rgba(5,150,105,0.1); padding:2px 6px; border-radius:4px;">✓ Filtro Ativo</span>' : ''}
              </div>
              <span style="font-family:var(--font-condensed); font-size:0.95rem; font-weight:800; color:var(--isapel-navy);">${formatarMoeda(reg.valorTotal)}</span>
            </div>
            <div style="width:100%; height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden; margin:0.25rem 0;">
              <div style="width:${Math.max(reg.pctTotal, 4)}%; height:100%; background:linear-gradient(90deg, var(--isapel-sky), var(--isapel-sky-dark)); border-radius:3px;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.74rem; color:var(--text-muted);">
              <span>${reg.count} ${reg.count === 1 ? 'lead recebido' : 'leads recebidos'} (${reg.pctTotal}%)</span>
              <span style="font-weight:600; color:var(--isapel-sky-dark);">${isSelected ? 'Remover filtro' : 'Filtrar por esta praça →'}</span>
            </div>
          `;

          row.addEventListener('click', () => {
            const sReg = document.getElementById('analytics-regiao-select');
            if (isSelected) {
              AppState.analytics.regiaoFiltro = 'todas';
              if (sReg) sReg.value = 'todas';
              showToast('Filtro de região removido.', 'info', 1500);
            } else {
              AppState.analytics.regiaoFiltro = reg.chave;
              if (sReg) sReg.value = reg.chave;
              showToast(`Filtrando leads de ${reg.regiao}.`, 'info', 1500);
            }
            renderizarAnalytics();
          });

          regionsContainer.appendChild(row);
        });
      }
    }
  }

  // ==========================================================================
  // 12. FECHAMENTO DO DIA & PLANO TÁTICO
  // ==========================================================================
  function atualizarPainelFechamento() {
    const todos = obterTodosOsLeads();

    // 1. Métricas do Fechamento
    let somaPipeline = 0;
    let somaFechado = 0;
    let somaNegociacao = 0;
    const regioesMapeadas = new Set();

    const leadsNegociacao = [];
    const leadsProposta = [];
    const leadsNovos = [];

    todos.forEach(lead => {
      const val = Number(lead.valorProposta) || 0;
      if (lead.ddd) regioesMapeadas.add(lead.ddd);

      if (lead.estagio !== 'perdido') {
        somaPipeline += val;
      }
      if (lead.estagio === 'fechado') {
        somaFechado += val;
      }
      if (lead.estagio === 'negociacao') {
        somaNegociacao += val;
        leadsNegociacao.push(lead);
      }
      if (lead.estagio === 'proposta') {
        leadsProposta.push(lead);
      }
      if (lead.estagio === 'novo' || lead.estagio === 'qualificacao') {
        leadsNovos.push(lead);
      }
    });

    // Atualiza KPIs no DOM
    const elPipeline = document.getElementById('metric-fechamento-pipeline');
    const elGanho = document.getElementById('metric-fechamento-ganho');
    const elNegoc = document.getElementById('metric-fechamento-negociacao');
    const elRotas = document.getElementById('metric-fechamento-rotas');

    if (elPipeline) elPipeline.textContent = formatarMoeda(somaPipeline);
    if (elGanho) elGanho.textContent = formatarMoeda(somaFechado);
    if (elNegoc) elNegoc.textContent = formatarMoeda(somaNegociacao);
    if (elRotas) elRotas.textContent = `${regioesMapeadas.size} Regiões`;

    // 2. Renderiza Prioridade 1: Fechamentos Urgentes (Negociação)
    const containerP1 = document.getElementById('lista-prioridade-1');
    const countP1 = document.getElementById('p1-count');
    if (countP1) countP1.textContent = `${leadsNegociacao.length} contas`;

    if (containerP1) {
      containerP1.innerHTML = '';
      if (leadsNegociacao.length === 0) {
        containerP1.innerHTML = '<div style="font-size:0.75rem; color:var(--text-dim); padding:0.5rem;">Nenhum lead em negociação no momento.</div>';
      } else {
        leadsNegociacao.slice(0, 5).forEach(l => {
          const rawDigits = extrairApenasDigitos(l.telefone);
          let waPhone = rawDigits;
          if (!waPhone.startsWith('55') && waPhone.length >= 10) waPhone = `55${waPhone}`;
          const waLink = `https://wa.me/${waPhone}`;

          containerP1.innerHTML += `
            <div class="crm-tactical-card">
              <div class="crm-tactical-card__row">
                <span class="crm-tactical-card__client">${l.nome}</span>
                <span class="crm-tactical-card__val">${formatarMoeda(l.valorProposta || 0)}</span>
              </div>
              <div class="crm-tactical-card__meta">
                <span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-right:3px; vertical-align:-1px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>${l.cidade} (${l.uf || 'SP'})
                </span>
                <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="crm-tactical-card__wa-btn" title="Conversar no WhatsApp" aria-label="WhatsApp com ${l.nome}">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-right:2px; vertical-align:-1px;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>WhatsApp
                </a>
              </div>
            </div>
          `;
        });
      }
    }

    // 3. Renderiza Prioridade 2: Follow-ups de Propostas Enviadas
    const containerP2 = document.getElementById('lista-prioridade-2');
    const countP2 = document.getElementById('p2-count');
    if (countP2) countP2.textContent = `${leadsProposta.length} propostas`;

    if (containerP2) {
      containerP2.innerHTML = '';
      if (leadsProposta.length === 0) {
        containerP2.innerHTML = '<div style="font-size:0.75rem; color:var(--text-dim); padding:0.5rem;">Nenhuma proposta pendente de follow-up.</div>';
      } else {
        leadsProposta.slice(0, 5).forEach(l => {
          const rawDigits = extrairApenasDigitos(l.telefone);
          let waPhone = rawDigits;
          if (!waPhone.startsWith('55') && waPhone.length >= 10) waPhone = `55${waPhone}`;
          const waLink = `https://wa.me/${waPhone}`;

          containerP2.innerHTML += `
            <div class="crm-tactical-card">
              <div class="crm-tactical-card__row">
                <span class="crm-tactical-card__client">${l.nome}</span>
                <span class="crm-tactical-card__val">${formatarMoeda(l.valorProposta || 0)}</span>
              </div>
              <div class="crm-tactical-card__meta">
                <span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-right:3px; vertical-align:-1px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>${l.telefoneFormatado || l.telefone}
                </span>
                <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="crm-tactical-card__wa-btn" title="Conversar no WhatsApp" aria-label="WhatsApp com ${l.nome}">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-right:2px; vertical-align:-1px;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>WhatsApp
                </a>
              </div>
            </div>
          `;
        });
      }
    }

    // 4. Renderiza Prioridade 3: Agrupamento Regional e Prospecção
    const containerP3 = document.getElementById('lista-prioridade-3');
    const countP3 = document.getElementById('p3-count');

    // Agrupa por Região / DDD
    const gruposRotas = {};
    leadsNovos.forEach(l => {
      const dddKey = l.ddd ? `DDD ${l.ddd} - ${l.cidade}` : 'Região Grande SP';
      if (!gruposRotas[dddKey]) {
        gruposRotas[dddKey] = { rota: l.cidade || 'São Paulo', leads: [] };
      }
      gruposRotas[dddKey].leads.push(l);
    });

    const rotasKeys = Object.keys(gruposRotas);
    if (countP3) countP3.textContent = `${rotasKeys.length} regiões`;

    if (containerP3) {
      containerP3.innerHTML = '';
      if (rotasKeys.length === 0) {
        containerP3.innerHTML = '<div style="font-size:0.75rem; color:var(--text-dim); padding:0.5rem;">Sem novas regiões pendentes de prospecção.</div>';
      } else {
        rotasKeys.slice(0, 4).forEach(rotaKey => {
          const item = gruposRotas[rotaKey];
          containerP3.innerHTML += `
            <div class="crm-tactical-card">
              <div class="crm-tactical-card__row">
                <span class="crm-tactical-card__client">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-right:3px; vertical-align:-1px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>${rotaKey}
                </span>
                <span style="font-size:0.75rem; font-weight:700; color:var(--isapel-sky);">${item.leads.length} contas</span>
              </div>
              <div class="crm-tactical-card__meta">
                <span>Novos contatos para prospecção ativa</span>
              </div>
            </div>
          `;
        });
      }
    }

    // Atualiza preview de JSON
    const previewEl = document.getElementById('json-preview-text');
    if (previewEl && AppState.ultimoFechamentoGerado) {
      previewEl.textContent = JSON.stringify(AppState.ultimoFechamentoGerado, null, 2);
    }
  }

  function inicializarFechamentoDoDia() {
    const btnExecutar = document.getElementById('btn-executar-fechamento');
    const btnCopiarWhatsApp = document.getElementById('btn-copiar-plano-whatsapp');
    const btnDownloadManual = document.getElementById('btn-download-json-manual');

    if (btnExecutar) {
      btnExecutar.addEventListener('click', () => {
        executarFechamentoCompleto();
      });
    }

    if (btnCopiarWhatsApp) {
      btnCopiarWhatsApp.addEventListener('click', () => {
        copiarPlanoWhatsApp();
      });
    }

    if (btnDownloadManual) {
      btnDownloadManual.addEventListener('click', () => {
        if (window.IsapelCRM && typeof window.IsapelCRM.baixarFechamentoJSON === 'function') {
          window.IsapelCRM.baixarFechamentoJSON();
        } else {
          baixarJSONFallback();
        }
        showToast('Download do arquivo de fechamento iniciado.', 'info');
      });
    }
  }

  function executarFechamentoCompleto() {
    let fechamento = null;
    const dataHoje = new Date().toISOString().split('T')[0];

    if (window.IsapelCRM && typeof window.IsapelCRM.gerarFechamentoDiario === 'function') {
      fechamento = window.IsapelCRM.gerarFechamentoDiario(dataHoje);
      window.IsapelCRM.baixarFechamentoJSON(dataHoje);
    } else {
      fechamento = gerarFechamentoFallback(dataHoje);
      baixarJSONFallback(fechamento);
    }

    AppState.ultimoFechamentoGerado = fechamento;

    // Toca som de vitória/triunfo
    playSound('fechamento');

    // Atualiza status e painel
    const previewEl = document.getElementById('json-preview-text');
    if (previewEl) {
      previewEl.textContent = JSON.stringify(fechamento, null, 2);
    }

    const statusEl = document.getElementById('fechamento-status-text');
    if (statusEl) {
      statusEl.innerHTML = `Fechamento consolidado gerado com sucesso às <strong>${new Date().toLocaleTimeString()}</strong>!`;
    }

    showToast(`Expediente Encerrado! Arquivo "fechamento-isapel-${dataHoje}.json" baixado com sucesso.`, 'success', 5000);
    atualizarPainelFechamento();
  }

  function gerarFechamentoFallback(dataHoje) {
    const todos = obterTodosOsLeads();
    return {
      sistema: 'CRM Isapel Papéis - Inteligência B2B',
      dataReferencia: dataHoje,
      geradoEm: new Date().toISOString(),
      totais: {
        totalLeads: todos.length,
        totalFechados: todos.filter(l => l.estagio === 'fechado').length,
        valorTotalFechado: todos.filter(l => l.estagio === 'fechado').reduce((acc, l) => acc + (Number(l.valorProposta) || 0), 0)
      },
      planoTaticoAmanha: {
        prioridade1: 'Fechamentos urgentes de negociações em andamento',
        prioridade2: 'Follow-up de propostas de papéis toalha e higiênico rolão',
        prioridade3: 'Prospecção comercial e expansão por região geográfica'
      }
    };
  }

  function baixarJSONFallback(dados) {
    const fechamento = dados || AppState.ultimoFechamentoGerado || gerarFechamentoFallback(new Date().toISOString().split('T')[0]);
    const nomeArquivo = `fechamento-isapel-${fechamento.dataReferencia || 'hoje'}.json`;
    const jsonStr = JSON.stringify(fechamento, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function copiarPlanoWhatsApp() {
    const todos = obterTodosOsLeads();
    const leadsNegociacao = todos.filter(l => l.estagio === 'negociacao');
    const leadsProposta = todos.filter(l => l.estagio === 'proposta');
    const dataHoje = new Date().toLocaleDateString('pt-BR');

    let texto = `*ISAPEL PAPÉIS | FECHAMENTO DO DIA & PLANO TÁTICO*\n`;
    texto += `*Data:* ${dataHoje}\n\n`;

    texto += `*PRIORIDADE 1 - FECHAMENTOS URGENTES (08:00 - 10:30):*\n`;
    if (leadsNegociacao.length === 0) {
      texto += `- Nenhuma negociação travada pendente.\n`;
    } else {
      leadsNegociacao.slice(0, 5).forEach((l, i) => {
        texto += `${i + 1}. *${l.nome}* (${l.cidade}) - ${formatarMoeda(l.valorProposta)} [Resp: ${l.vendedorId}]\n`;
      });
    }

    texto += `\n*PRIORIDADE 2 - FOLLOW-UP DE PROPOSTAS:*\n`;
    if (leadsProposta.length === 0) {
      texto += `- Todas as cotações em dia.\n`;
    } else {
      leadsProposta.slice(0, 5).forEach((l, i) => {
        texto += `${i + 1}. *${l.nome}* (${l.telefoneFormatado || l.telefone})\n`;
      });
    }

    texto += `\n*PRIORIDADE 3 - PROSPECÇÃO REGIONAL:*\n`;
    texto += `- Contato ativo com novos leads qualificados para abertura de contas.\n\n`;
    texto += `_Mensagem gerada automaticamente pelo CRM Isapel Papéis._`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(() => {
        showToast('Plano formatado copiado! Basta colar no grupo de WhatsApp da Isapel.', 'success', 4000);
      }).catch(() => {
        promptCopiarFallback(texto);
      });
    } else {
      promptCopiarFallback(texto);
    }
  }

  function promptCopiarFallback(texto) {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('Plano copiado para a área de transferência!', 'success');
    } catch (e) {
      showToast('Não foi possível copiar automaticamente.', 'error');
    }
    document.body.removeChild(textarea);
  }

  // ==========================================================================
  // 13. MODAL DE ANOTAÇÕES RÁPIDAS (+ NOTA)
  // ==========================================================================
  function abrirModalNotas(leadId) {
    AppState.leadEmNotasId = leadId;
    const todos = obterTodosOsLeads();
    const lead = todos.find(l => l.id === leadId);
    if (!lead) return;

    const modal = document.getElementById('modal-notas-backdrop');
    const nomeEl = document.getElementById('modal-notas-lead-nome');
    const foneEl = document.getElementById('modal-notas-lead-phone');
    const inputNota = document.getElementById('input-nova-nota');
    const timeline = document.getElementById('modal-notes-timeline-list');

    if (nomeEl) nomeEl.textContent = lead.nome;
    if (foneEl) foneEl.textContent = `${lead.telefoneFormatado || lead.telefone} • ${lead.cidade || ''} (${lead.uf || 'SP'})`;
    if (inputNota) inputNota.value = '';

    // Renderiza linha do tempo de notas
    if (timeline) {
      timeline.innerHTML = '';
      const historico = lead.historico || lead.historicoContatos || [];
      if (historico.length === 0) {
        timeline.innerHTML = '<div style="font-size:0.75rem; color:var(--text-dim); padding:0.5rem;">Nenhuma anotação registrada ainda.</div>';
      } else {
        historico.slice().reverse().forEach(h => {
          const dataStr = h.data ? new Date(h.data).toLocaleString('pt-BR') : 'Data não informada';
          const autorStr = h.autor ? `[${h.autor}]` : '';
          const notaTexto = h.descricao || h.anotacao || h.texto || '';
          timeline.innerHTML += `
            <div style="background:#F8FAFC; border:1px solid var(--border-subtle); padding:0.5rem 0.75rem; border-radius:var(--radius-sm); font-size:0.78rem;">
              <div style="display:flex; justify-content:space-between; color:var(--text-dim); font-size:0.7rem; margin-bottom:0.25rem;">
                <span>${autorStr}</span>
                <span>${dataStr}</span>
              </div>
              <div style="color:var(--text-main); line-height:1.35;">${notaTexto}</div>
            </div>
          `;
        });
      }
    }

    if (modal) modal.classList.add('is-open');
    if (inputNota) setTimeout(() => inputNota.focus(), 100);
  }

  function fecharModalNotas() {
    const modal = document.getElementById('modal-notas-backdrop');
    if (modal) modal.classList.remove('is-open');
    AppState.leadEmNotasId = null;
  }

  function salvarNovaNota() {
    const inputNota = document.getElementById('input-nova-nota');
    if (!inputNota || !AppState.leadEmNotasId) return;

    const texto = inputNota.value.trim();
    if (!texto) {
      showToast('Digite uma anotação antes de salvar.', 'warning');
      inputNota.focus();
      return;
    }

    const autor = AppState.vendedorAtivo !== 'todos' ? AppState.vendedorAtivo : 'Comercial';
    let leadAtualizado = null;

    if (window.IsapelCRM && typeof window.IsapelCRM.registrarContatoLead === 'function') {
      leadAtualizado = window.IsapelCRM.registrarContatoLead(AppState.leadEmNotasId, {
        descricao: texto,
        tipo: 'anotacao',
        canal: 'whatsapp',
        autor: autor
      });
    } else {
      const todos = obterTodosOsLeads();
      const lead = todos.find(l => l.id === AppState.leadEmNotasId);
      if (lead) {
        if (!lead.historico) lead.historico = [];
        lead.historico.push({
          id: 'hist-' + Date.now(),
          data: new Date().toISOString(),
          descricao: texto,
          tipo: 'anotacao',
          canal: 'whatsapp',
          autor: autor
        });
        lead.observacoes = texto;
        lead.dataUltimoContato = new Date().toISOString();
        localStorage.setItem('isapel_crm_leads_v1', JSON.stringify(todos));
        leadAtualizado = lead;
      }
    }

    // Sincronizar na Nuvem (Supabase)
    if (leadAtualizado && window.IsapelSync && typeof window.IsapelSync.salvarLeadNuvem === 'function') {
      window.IsapelSync.salvarLeadNuvem(leadAtualizado);
    }

    playSound('lead-cadastrado');
    showToast('Anotação registrada com sucesso no histórico!', 'success');
    fecharModalNotas();
    renderizarKanban();
  }

  function inicializarModalNotas() {
    const btnFechar = document.getElementById('btn-fechar-modal-notas');
    const btnCancelar = document.getElementById('btn-cancelar-modal-notas');
    const btnSalvar = document.getElementById('btn-salvar-nova-nota');
    const backdrop = document.getElementById('modal-notas-backdrop');

    if (btnFechar) btnFechar.addEventListener('click', fecharModalNotas);
    if (btnCancelar) btnCancelar.addEventListener('click', fecharModalNotas);
    if (btnSalvar) btnSalvar.addEventListener('click', salvarNovaNota);

    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) fecharModalNotas();
      });
    }

    // Tags Rápidas de Conversa
    document.querySelectorAll('.crm-tag-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const inputNota = document.getElementById('input-nova-nota');
        if (!inputNota) return;
        const textoTag = btn.getAttribute('data-text');
        if (inputNota.value) {
          inputNota.value += ` | ${textoTag}`;
        } else {
          inputNota.value = textoTag;
        }
        inputNota.focus();
      });
    });
  }

  // ==========================================================================
  // 14. MODAL DE EDIÇÃO DO LEAD
  // ==========================================================================
  function abrirModalEditar(leadId) {
    AppState.leadEmEdicaoId = leadId;
    const todos = obterTodosOsLeads();
    const lead = todos.find(l => l.id === leadId);
    if (!lead) return;

    const sessao = (typeof window !== 'undefined' && window.IsapelAuth && typeof window.IsapelAuth.obterSessao === 'function')
      ? window.IsapelAuth.obterSessao()
      : null;
    const isVendedor = Boolean(sessao && sessao.perfil === 'vendedor');

    const modal = document.getElementById('modal-editar-backdrop');
    document.getElementById('edit-lead-id').value = lead.id;
    document.getElementById('edit-lead-nome').value = lead.nome || '';
    document.getElementById('edit-lead-telefone').value = lead.telefoneFormatado || lead.telefone || '';
    document.getElementById('edit-lead-valor').value = lead.valorProposta || 0;

    const selectVendedor = document.getElementById('edit-lead-vendedor');
    if (selectVendedor) {
      selectVendedor.value = lead.vendedorId || (isVendedor ? sessao.vendedorId : 'maciel');
      selectVendedor.disabled = isVendedor;
      if (isVendedor) {
        selectVendedor.title = 'A reatribuição de vendedor é restrita à Diretoria.';
        selectVendedor.style.cursor = 'not-allowed';
        selectVendedor.style.opacity = '0.7';
      } else {
        selectVendedor.removeAttribute('title');
        selectVendedor.style.cursor = 'default';
        selectVendedor.style.opacity = '1';
      }
    }

    document.getElementById('edit-lead-etapa').value = lead.estagio || 'novo';

    const selectTipo = document.getElementById('edit-lead-tipo');
    if (selectTipo) {
      selectTipo.value = lead.tipoCliente || '';
    }

    if (modal) modal.classList.add('is-open');
  }

  function fecharModalEditar() {
    const modal = document.getElementById('modal-editar-backdrop');
    if (modal) modal.classList.remove('is-open');
    AppState.leadEmEdicaoId = null;
  }

  function salvarEdicaoLead() {
    const id = document.getElementById('edit-lead-id').value;
    const nome = document.getElementById('edit-lead-nome').value.trim();
    const telefone = document.getElementById('edit-lead-telefone').value.trim();
    const valor = parseFloat(document.getElementById('edit-lead-valor').value) || 0;
    
    const sessao = (typeof window !== 'undefined' && window.IsapelAuth && typeof window.IsapelAuth.obterSessao === 'function')
      ? window.IsapelAuth.obterSessao()
      : null;
    const isVendedor = Boolean(sessao && sessao.perfil === 'vendedor');

    let vendedorId = document.getElementById('edit-lead-vendedor').value;
    if (isVendedor && sessao.vendedorId) {
      vendedorId = sessao.vendedorId; // Vendedor não pode alterar vendedorId
    }

    const estagio = document.getElementById('edit-lead-etapa').value;
    const tipoCliente = document.getElementById('edit-lead-tipo') ? document.getElementById('edit-lead-tipo').value : '';

    if (!id || !nome || !telefone) {
      showToast('Preencha os campos obrigatórios.', 'warning');
      return;
    }

    let leadAtualizado = null;

    if (window.IsapelCRM && typeof window.IsapelCRM.atualizarLead === 'function') {
      leadAtualizado = window.IsapelCRM.atualizarLead(id, {
        nome: nome,
        telefone: telefone,
        valorProposta: valor,
        vendedorId: vendedorId,
        estagio: estagio,
        tipoCliente: tipoCliente
      });
    } else {
      const todos = obterTodosOsLeads();
      const lead = todos.find(l => l.id === id);
      if (lead) {
        lead.nome = nome;
        lead.telefone = telefone;
        lead.telefoneFormatado = aplicarMascaraTelefone(telefone);
        lead.valorProposta = valor;
        lead.vendedorId = vendedorId;
        lead.estagio = estagio;
        lead.tipoCliente = tipoCliente;
        localStorage.setItem('isapel_crm_leads_v1', JSON.stringify(todos));
        leadAtualizado = lead;
      }
    }

    // Sincronizar atualização na Nuvem (Supabase)
    if (leadAtualizado && window.IsapelSync && typeof window.IsapelSync.salvarLeadNuvem === 'function') {
      window.IsapelSync.salvarLeadNuvem(leadAtualizado);
    }

    showToast('Lead atualizado com sucesso na nuvem!', 'success');
    fecharModalEditar();
    renderizarKanban();
    sincronizarArena3D();
  }

  function excluirLeadAtual() {
    if (!AppState.leadEmEdicaoId) return;

    if (confirm('Tem certeza de que deseja excluir este lead do CRM?')) {
      const idParaExcluir = AppState.leadEmEdicaoId;

      if (window.IsapelCRM && typeof window.IsapelCRM.removerLead === 'function') {
        window.IsapelCRM.removerLead(idParaExcluir);
      } else {
        let todos = obterTodosOsLeads();
        todos = todos.filter(l => l.id !== idParaExcluir);
        localStorage.setItem('isapel_crm_leads_v1', JSON.stringify(todos));
      }

      // Sincronizar exclusão na Nuvem (Supabase)
      if (window.IsapelSync && typeof window.IsapelSync.removerLeadNuvem === 'function') {
        window.IsapelSync.removerLeadNuvem(idParaExcluir);
      }

      showToast('Lead removido do pipeline e da nuvem com sucesso.', 'info');
      fecharModalEditar();
      renderizarKanban();
      sincronizarArena3D();
    }
  }

  function inicializarModalEditar() {
    const btnFechar = document.getElementById('btn-fechar-modal-editar');
    const btnCancelar = document.getElementById('btn-cancelar-modal-editar');
    const btnSalvar = document.getElementById('btn-salvar-edicao-lead');
    const btnExcluir = document.getElementById('btn-excluir-lead');
    const backdrop = document.getElementById('modal-editar-backdrop');

    if (btnFechar) btnFechar.addEventListener('click', fecharModalEditar);
    if (btnCancelar) btnCancelar.addEventListener('click', fecharModalEditar);
    if (btnSalvar) btnSalvar.addEventListener('click', salvarEdicaoLead);
    if (btnExcluir) btnExcluir.addEventListener('click', excluirLeadAtual);

    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) fecharModalEditar();
      });
    }
  }

  // ==========================================================================
  // 15. FILTRO DE BUSCA NO KANBAN E BOTÃO DE RECARREGAR
  // ==========================================================================
  function inicializarBusca() {
    const searchInput = document.getElementById('kanban-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        AppState.buscaTermo = e.target.value;
        renderizarKanban();
      });
    }

    const tipoFilterSelect = document.getElementById('kanban-tipo-filter');
    if (tipoFilterSelect) {
      tipoFilterSelect.addEventListener('change', (e) => {
        AppState.tipoClienteFiltro = e.target.value;
        renderizarKanban();
      });
    }

    const btnRecarregar = document.getElementById('btn-recarregar-leads');
    if (btnRecarregar) {
      btnRecarregar.addEventListener('click', () => {
        renderizarKanban();
        sincronizarArena3D();
        showToast('Pipeline sincronizado com sucesso.', 'info', 1800);
      });
    }
  }

  // ==========================================================================
  // 15. GESTÃO COMERCIAL, NOVOS CONSULTORES & RBAC
  // ==========================================================================
  function gerarIniciaisNome(nome) {
    if (!nome) return 'CO';
    const partes = String(nome).trim().split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  function inicializarRBAC(sessao) {
    if (!sessao) return;

    const headerUserName = document.getElementById('header-user-name');
    const headerUserAvatar = document.getElementById('header-user-avatar');
    const headerUserRoleBadge = document.getElementById('header-user-role-badge');
    const wrapperVendedorSelect = document.getElementById('wrapper-vendedor-select');
    const selectVendedor = document.getElementById('vendedor-select');
    const avatarAtivo = document.getElementById('header-active-avatar');
    const tabNavGestao = document.getElementById('tab-nav-gestao');
    const tabGestao = document.getElementById('tab-gestao');

    if (headerUserName) headerUserName.textContent = sessao.nome;
    if (headerUserAvatar) headerUserAvatar.textContent = sessao.avatar;
    if (headerUserRoleBadge) {
      headerUserRoleBadge.textContent = sessao.perfil === 'diretoria' ? 'Diretoria' : 'Vendedor';
      headerUserRoleBadge.className = `crm-role-badge crm-role-badge--${sessao.perfil}`;
    }

    if (sessao.perfil === 'vendedor') {
      // Vendedor: restrito estritamente ao seu próprio vendedorId
      AppState.vendedorAtivo = sessao.vendedorId;
      if (selectVendedor) {
        selectVendedor.value = sessao.vendedorId;
        selectVendedor.disabled = true;
      }
      if (avatarAtivo) {
        avatarAtivo.textContent = sessao.avatar;
      }
      if (wrapperVendedorSelect) {
        wrapperVendedorSelect.style.display = 'none';
      }
      if (tabNavGestao) {
        tabNavGestao.style.display = 'none';
        tabNavGestao.setAttribute('aria-hidden', 'true');
      }
      if (tabGestao) {
        tabGestao.style.display = 'none';
        tabGestao.setAttribute('hidden', 'until-found');
      }
    } else if (sessao.perfil === 'diretoria') {
      // Diretoria: visão global irrestrita com permissão de alternar o filtro
      AppState.vendedorAtivo = 'todos';
      if (selectVendedor) {
        selectVendedor.value = 'todos';
        selectVendedor.disabled = false;
      }
      if (avatarAtivo) {
        avatarAtivo.textContent = 'ALL';
      }
      if (wrapperVendedorSelect) {
        wrapperVendedorSelect.style.display = 'flex';
      }
      if (tabNavGestao) {
        tabNavGestao.style.display = 'flex';
        tabNavGestao.removeAttribute('aria-hidden');
      }
      if (tabGestao) {
        tabGestao.style.display = '';
      }
    }
  }

  function renderizarTabelaVendedores() {
    const tbody = document.getElementById('tabela-equipe-vendedores-tbody') || 
                  (document.getElementById('tabela-equipe-vendedores') ? document.getElementById('tabela-equipe-vendedores').querySelector('tbody') : null);
    if (!tbody) return;

    if (!window.IsapelAuth || typeof window.IsapelAuth.obterVendedores !== 'function') return;
    const vendedores = window.IsapelAuth.obterVendedores();

    tbody.innerHTML = vendedores.map(v => {
      const login = v.login || v.usuario || v.id;
      const nome = v.nome || login;
      const cargo = v.cargo || 'Consultor Comercial B2B';
      const iniciais = v.avatarIniciais || v.avatar || gerarIniciaisNome(nome);
      const cor = v.avatarCor || '#0284C7';
      const metaFardos = Number(v.metaMensalFardos) || 0;
      const metaReais = Number(v.metaMensalReais) || 0;
      const metaTexto = metaReais > 0 
        ? `R$ ${metaReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
        : `${metaFardos.toLocaleString('pt-BR')} fardos`;

      return `
        <tr data-vendedor-id="${login}">
          <td>
            <div class="crm-seller-cell">
              <span class="crm-seller-avatar-badge" style="background: ${cor};">${iniciais}</span>
              <div class="crm-seller-info">
                <strong class="crm-seller-name">${nome}</strong>
                <span class="crm-seller-login">@${login}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="crm-cargo-badge">${cargo}</span>
          </td>
          <td>
            <div class="crm-meta-cell">
              <strong>${metaTexto}</strong>
              ${metaFardos > 0 && metaReais > 0 ? `<small class="crm-meta-sub">${metaFardos.toLocaleString('pt-BR')} fardos</small>` : ''}
            </div>
          </td>
          <td>
            <span class="crm-status-pill crm-status-pill--ativo">
              <span class="crm-status-dot" aria-hidden="true"></span>
              Ativo
            </span>
          </td>
          <td>
            <button type="button" class="crm-btn crm-btn--sm crm-btn--outline btn-customizar-avatar-tabela btn-customizar-avatar" data-vendedor="${login}" title="Personalizar Avatar 3D do Consultor">
              🎨 Customizar
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function atualizarSeletoresVendedores() {
    if (!window.IsapelAuth || typeof window.IsapelAuth.obterVendedores !== 'function') return;
    const vendedores = window.IsapelAuth.obterVendedores();

    // 1. #vendedor-select no Header
    const selectHeader = document.getElementById('vendedor-select');
    if (selectHeader) {
      const valorAtual = selectHeader.value;
      let html = '<option value="todos">Todos os Vendedores</option>';
      vendedores.forEach(v => {
        const id = v.id || v.login || v.usuario;
        html += `<option value="${id}">${v.nome}</option>`;
      });
      selectHeader.innerHTML = html;
      if (valorAtual && Array.from(selectHeader.options).some(o => o.value === valorAtual)) {
        selectHeader.value = valorAtual;
      }
    }

    // 2. #analytics-vendedor-select na aba de Analytics
    const selectAnalytics = document.getElementById('analytics-vendedor-select');
    if (selectAnalytics) {
      const valorAtual = selectAnalytics.value;
      let html = '<option value="todos">Toda a Equipe (Consolidado)</option>';
      vendedores.forEach(v => {
        const id = v.id || v.login || v.usuario;
        html += `<option value="${id}">${v.nome}</option>`;
      });
      selectAnalytics.innerHTML = html;
      if (valorAtual && Array.from(selectAnalytics.options).some(o => o.value === valorAtual)) {
        selectAnalytics.value = valorAtual;
      }
    }

    // 3. #edit-lead-vendedor no Modal de Edição
    const selectEdit = document.getElementById('edit-lead-vendedor');
    if (selectEdit) {
      const valorAtual = selectEdit.value;
      let html = '';
      vendedores.forEach(v => {
        const id = v.id || v.login || v.usuario;
        html += `<option value="${id}">${v.nome}</option>`;
      });
      selectEdit.innerHTML = html;
      if (valorAtual && Array.from(selectEdit.options).some(o => o.value === valorAtual)) {
        selectEdit.value = valorAtual;
      }
    }
  }

  function inicializarFormularioNovoVendedor() {
    const form = document.getElementById('form-novo-vendedor');

    // Password toggle
    const btnToggle = document.getElementById('btn-toggle-senha-vendedor');
    const inputSenha = document.getElementById('vendedor-novo-senha');
    const iconEye = document.getElementById('icon-toggle-senha-eye');
    const iconEyeOff = document.getElementById('icon-toggle-senha-eye-off');

    if (btnToggle && inputSenha) {
      btnToggle.addEventListener('click', () => {
        const isPassword = inputSenha.type === 'password';
        inputSenha.type = isPassword ? 'text' : 'password';
        btnToggle.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Ver senha');
        btnToggle.setAttribute('title', isPassword ? 'Ocultar senha' : 'Ver senha');
        if (iconEye && iconEyeOff) {
          iconEye.style.display = isPassword ? 'none' : 'block';
          iconEyeOff.style.display = isPassword ? 'block' : 'none';
        }
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nomeInput = document.getElementById('vendedor-novo-nome');
        const loginInput = document.getElementById('vendedor-novo-login');
        const senhaInput = document.getElementById('vendedor-novo-senha');
        const cargoInput = document.getElementById('vendedor-novo-cargo');
        const metaInput = document.getElementById('vendedor-novo-meta');

        const nome = nomeInput ? nomeInput.value.trim() : '';
        const login = loginInput ? loginInput.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') : '';
        const senha = senhaInput ? senhaInput.value.trim() : '';
        const cargo = cargoInput ? cargoInput.value.trim() : 'Consultor Comercial B2B';
        const metaRaw = metaInput ? parseFloat(metaInput.value) || 0 : 0;

        if (!nome || nome.length < 3) {
          showToast('Nome completo deve ter no mínimo 3 caracteres.', 'error');
          if (nomeInput) nomeInput.focus();
          return;
        }

        if (!login || login.length < 3) {
          showToast('Identificador / Login deve ter no mínimo 3 caracteres alfanuméricos.', 'error');
          if (loginInput) loginInput.focus();
          return;
        }

        if (!senha || senha.length < 6) {
          showToast('Senha inicial deve ter no mínimo 6 caracteres.', 'error');
          if (senhaInput) senhaInput.focus();
          return;
        }

        const sessao = (window.IsapelAuth && typeof window.IsapelAuth.obterSessao === 'function')
          ? window.IsapelAuth.obterSessao()
          : null;

        if (!sessao || sessao.perfil !== 'diretoria') {
          showToast('Acesso restrito à Diretoria Comercial.', 'warning');
          return;
        }

        const metaMensalReais = metaRaw > 5000 ? metaRaw : (metaRaw > 0 ? metaRaw * 25 : 40000);
        const metaMensalFardos = metaRaw > 5000 ? Math.round(metaRaw / 25) : (metaRaw > 0 ? metaRaw : 1500);

        const dadosVendedor = {
          nome,
          login,
          senhaInicial: senha,
          cargo,
          metaMensalReais,
          metaMensalFardos,
          avatarCor: '#0284C7',
          avatarIniciais: gerarIniciaisNome(nome)
        };

        if (!window.IsapelAuth || typeof window.IsapelAuth.cadastrarVendedor !== 'function') {
          showToast('Módulo de autenticação indisponível.', 'error');
          return;
        }

        const resultado = window.IsapelAuth.cadastrarVendedor(dadosVendedor, sessao);

        if (resultado && resultado.ok) {
          showToast(`Vendedor "${resultado.vendedor.nome}" cadastrado com sucesso!`, 'success');
          form.reset();
          renderizarTabelaVendedores();
          atualizarSeletoresVendedores();
        } else {
          const erroMsg = (resultado && resultado.erro) ? resultado.erro : 'Erro ao cadastrar novo vendedor.';
          showToast(erroMsg, 'error');
        }
      });
    }

    // Escuta evento global disparado por crm-auth.js ou sincronização externa
    window.addEventListener('isapel:vendedor-cadastrado', () => {
      renderizarTabelaVendedores();
      atualizarSeletoresVendedores();
    });
  }

  // ==========================================================================
  // 15.5. CUSTOMIZADOR DE AVATARES 3D & ESTÚDIO DE LIVE PREVIEW
  // ==========================================================================

  function obterConfigAvatarVendedor(vendedorId) {
    const vid = vendedorId || 'maciel';

    // 1. Tentar obter do IsapelSync
    if (window.IsapelSync && typeof window.IsapelSync.obterPerfilAvatar === 'function') {
      const cfg = window.IsapelSync.obterPerfilAvatar(vid);
      if (cfg) return { ...cfg };
    }

    // 2. Tentar obter do localStorage
    try {
      const raw1 = localStorage.getItem('isapel_crm_avatar_profiles');
      if (raw1) {
        const p1 = JSON.parse(raw1);
        if (p1 && p1[vid]) return { ...p1[vid] };
      }
      const raw2 = localStorage.getItem('isapel_avatar_customizations');
      if (raw2) {
        const p2 = JSON.parse(raw2);
        if (p2 && p2[vid]) return { ...p2[vid] };
      }
      const raw3 = localStorage.getItem('isapel_vendedores_custom_v1');
      if (raw3) {
        const p3 = JSON.parse(raw3);
        if (p3 && p3[vid]) return { ...p3[vid] };
      }
    } catch (e) {
      console.warn('[AvatarCustomizer] Erro ao ler avatar do localStorage:', e);
    }

    // 3. Presets oficiais de AvatarBuilder
    if (window.Arena3D && window.Arena3D.AvatarBuilder && typeof window.Arena3D.AvatarBuilder.obterPresetsPadrao === 'function') {
      const presets = window.Arena3D.AvatarBuilder.obterPresetsPadrao();
      if (presets && presets[vid]) return { ...presets[vid] };
    }

    // 4. Fallback padrão seguro
    return {
      uniforme: 'polo-navy',
      cabeloEstilo: vid === 'fernanda' ? 'liso-comprido' : (vid === 'caio' ? 'cacheado-volumoso' : 'cacheado-curto'),
      cabeloHex: vid === 'fernanda' ? '#F7CF46' : '#1A1514',
      barbaEstilo: vid === 'maciel' ? 'com-bigode' : 'sem-barba',
      barbaHex: '#161211',
      peleHex: vid === 'fernanda' ? '#F9D3B4' : (vid === 'caio' ? '#DFA980' : '#E6B994'),
      oculos: 'nenhum',
      cracha: true
    };
  }

  function sincronizarControlesModal(cfg) {
    if (!cfg) return;

    // 1. Uniforme
    const selUniforme = document.getElementById('avatar-uniforme-select');
    if (selUniforme) {
      selUniforme.value = cfg.uniforme || 'polo-navy';
    }
    document.querySelectorAll('.crm-uniforme-swatch-btn').forEach(btn => {
      const val = btn.getAttribute('data-uniforme');
      if (val === cfg.uniforme) {
        btn.classList.add('is-active', 'is-selected');
      } else {
        btn.classList.remove('is-active', 'is-selected');
      }
    });

    // 2. Cabelo
    const selCabelo = document.getElementById('avatar-cabelo-estilo');
    if (selCabelo && cfg.cabeloEstilo) {
      selCabelo.value = cfg.cabeloEstilo;
    }
    const cabeloHexNorm = (cfg.cabeloHex || '#1A1514').toLowerCase();
    document.querySelectorAll('#avatar-cabelo-cores .crm-color-swatch').forEach(btn => {
      const cor = (btn.getAttribute('data-cor-cabelo') || btn.getAttribute('data-cabelo-cor') || '').toLowerCase();
      if (cor === cabeloHexNorm) {
        btn.classList.add('is-active', 'is-selected');
      } else {
        btn.classList.remove('is-active', 'is-selected');
      }
    });

    // 3. Barba
    const selBarba = document.getElementById('avatar-barba-estilo');
    if (selBarba && cfg.barbaEstilo) {
      selBarba.value = cfg.barbaEstilo;
    }
    const barbaHexNorm = (cfg.barbaHex || '#161211').toLowerCase();
    document.querySelectorAll('#avatar-barba-cores .crm-color-swatch').forEach(btn => {
      const cor = (btn.getAttribute('data-cor-barba') || '').toLowerCase();
      if (cor === barbaHexNorm) {
        btn.classList.add('is-active', 'is-selected');
      } else {
        btn.classList.remove('is-active', 'is-selected');
      }
    });

    // 4. Pele
    const selPele = document.getElementById('avatar-pele-tom');
    if (selPele && cfg.peleHex) {
      selPele.value = cfg.peleHex.toUpperCase();
    }
    const peleHexNorm = (cfg.peleHex || '#E6B994').toLowerCase();
    document.querySelectorAll('#avatar-pele-swatches .crm-color-swatch').forEach(btn => {
      const cor = (btn.getAttribute('data-pele') || btn.getAttribute('data-tom-pele') || '').toLowerCase();
      if (cor === peleHexNorm) {
        btn.classList.add('is-active', 'is-selected');
      } else {
        btn.classList.remove('is-active', 'is-selected');
      }
    });

    // 5. Óculos & Crachá
    const selOculos = document.getElementById('avatar-acessorio-oculos');
    if (selOculos && cfg.oculos) {
      selOculos.value = cfg.oculos;
    }
    const chkCracha = document.getElementById('avatar-cracha-check');
    if (chkCracha) {
      chkCracha.checked = cfg.cracha !== false;
    }
  }

  function abrirModalCustomizador(vendedorIdAlvo) {
    const backdrop = document.getElementById('modal-avatar-backdrop');
    const modal = document.getElementById('modal-avatar-customizer');
    if (!backdrop && !modal) return;

    const sessao = (window.IsapelAuth && typeof window.IsapelAuth.obterSessao === 'function')
      ? window.IsapelAuth.obterSessao()
      : null;
    const perfil = (window.IsapelAuth && typeof window.IsapelAuth.obterPerfil === 'function')
      ? window.IsapelAuth.obterPerfil()
      : (sessao ? sessao.perfil : 'vendedor');
    const usuarioLogado = sessao ? (sessao.login || sessao.usuario || sessao.id) : 'maciel';

    const selVendedor = document.getElementById('avatar-custom-seller-select');
    const badgeLocked = document.getElementById('avatar-seller-locked-name');
    const nameLocked = document.getElementById('avatar-seller-name');
    const rbacTag = document.getElementById('avatar-rbac-tag');

    let vid = vendedorIdAlvo;

    // RBAC: Diretoria possui seletor liberado; Vendedor fica travado exclusivamente no próprio perfil
    if (perfil === 'diretoria' || (sessao && sessao.tipo === 'diretoria')) {
      if (selVendedor) {
        selVendedor.disabled = false;
        // Popula todas as opções de vendedores disponíveis
        if (window.IsapelAuth && typeof window.IsapelAuth.obterVendedores === 'function') {
          const vends = window.IsapelAuth.obterVendedores();
          selVendedor.innerHTML = vends.map(v => {
            const vId = v.login || v.usuario || v.id;
            const vNome = v.nome || vId;
            return `<option value="${vId}">${vNome} (${vId})</option>`;
          }).join('');
        }
        vid = vid || selVendedor.value || 'maciel';
        selVendedor.value = vid;
      }
      if (badgeLocked) {
        badgeLocked.style.display = 'none';
      }
      if (rbacTag) {
        rbacTag.textContent = 'Diretoria (Irrestrito)';
      }
    } else {
      // Perfil Vendedor: Bloqueado estritamente em seu próprio perfil
      vid = usuarioLogado || 'maciel';
      if (selVendedor) {
        if (!Array.from(selVendedor.options).some(o => o.value === vid)) {
          const opt = document.createElement('option');
          opt.value = vid;
          opt.textContent = `${sessao?.nome || vid} (${vid})`;
          selVendedor.appendChild(opt);
        }
        selVendedor.value = vid;
        selVendedor.disabled = true;
      }
      if (badgeLocked) {
        badgeLocked.style.display = 'inline-flex';
        if (nameLocked) {
          nameLocked.textContent = sessao?.nome ? `${sessao.nome} (${vid})` : vid;
        }
      }
      if (rbacTag) {
        rbacTag.textContent = 'Consultor (Travado)';
      }
    }

    AppState.vendedorCustomizandoId = vid;
    const configAtual = obterConfigAvatarVendedor(vid);
    sincronizarControlesModal(configAtual);

    // Torna o modal e o backdrop visíveis
    if (backdrop) {
      backdrop.classList.add('is-open');
      backdrop.setAttribute('aria-hidden', 'false');
      backdrop.style.display = 'flex';
    }
    if (modal) {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      modal.style.display = 'flex';
    }

    // Inicializa o Canvas Three.js do Preview Engine
    const canvas = document.getElementById('avatar-preview-canvas');
    if (canvas && window.Arena3D && window.Arena3D.AvatarPreviewEngine) {
      if (!AppState.avatarPreviewEngine) {
        AppState.avatarPreviewEngine = new window.Arena3D.AvatarPreviewEngine(canvas);
      }
      if (AppState.avatarPreviewEngine) {
        AppState.avatarPreviewEngine.carregarConfig(vid, configAtual);
        AppState.avatarPreviewEngine.iniciar();
      }
    }
  }

  function fecharModalCustomizador() {
    const backdrop = document.getElementById('modal-avatar-backdrop');
    const modal = document.getElementById('modal-avatar-customizer');
    if (backdrop) {
      backdrop.classList.remove('is-open');
      backdrop.setAttribute('aria-hidden', 'true');
      backdrop.style.display = 'none';
    }
    if (modal) {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      modal.style.display = 'none';
    }
    if (AppState.avatarPreviewEngine) {
      AppState.avatarPreviewEngine.pausar();
    }
  }

  function salvarCustomizacaoAvatar() {
    const vid = AppState.vendedorCustomizandoId || 'maciel';
    let configParaSalvar = null;

    if (AppState.avatarPreviewEngine && typeof AppState.avatarPreviewEngine.obterConfigAtual === 'function') {
      configParaSalvar = AppState.avatarPreviewEngine.obterConfigAtual();
    }

    if (!configParaSalvar) {
      const selUnif = document.getElementById('avatar-uniforme-select');
      const selCab = document.getElementById('avatar-cabelo-estilo');
      const selBarb = document.getElementById('avatar-barba-estilo');
      const selPele = document.getElementById('avatar-pele-tom');
      const selOc = document.getElementById('avatar-acessorio-oculos');
      const chkCracha = document.getElementById('avatar-cracha-check');

      configParaSalvar = {
        uniforme: selUnif ? selUnif.value : 'polo-navy',
        cabeloEstilo: selCab ? selCab.value : 'cacheado-curto',
        cabeloHex: '#1a1514',
        barbaEstilo: selBarb ? selBarb.value : 'com-bigode',
        barbaHex: '#161211',
        peleHex: selPele ? selPele.value : '#e6b994',
        oculos: selOc ? selOc.value : 'nenhum',
        cracha: chkCracha ? chkCracha.checked : true
      };
    }

    // 1. Gravar via IsapelSync (Supabase / Local)
    if (window.IsapelSync && typeof window.IsapelSync.salvarPerfilAvatar === 'function') {
      window.IsapelSync.salvarPerfilAvatar(vid, configParaSalvar);
    }

    // 2. Persistir rigorosamente no localStorage
    try {
      const raw1 = localStorage.getItem('isapel_crm_avatar_profiles');
      const p1 = raw1 ? JSON.parse(raw1) : {};
      p1[vid] = configParaSalvar;
      localStorage.setItem('isapel_crm_avatar_profiles', JSON.stringify(p1));

      const raw2 = localStorage.getItem('isapel_avatar_customizations');
      const p2 = raw2 ? JSON.parse(raw2) : {};
      p2[vid] = configParaSalvar;
      localStorage.setItem('isapel_avatar_customizations', JSON.stringify(p2));

      const raw3 = localStorage.getItem('isapel_vendedores_custom_v1');
      const p3 = raw3 ? JSON.parse(raw3) : {};
      p3[vid] = configParaSalvar;
      localStorage.setItem('isapel_vendedores_custom_v1', JSON.stringify(p3));
    } catch (err) {
      console.warn('[AvatarCustomizer] Erro ao salvar storage:', err);
    }

    // 3. Atualizar ao vivo a Arena 3D sem recarregar a página (Zero Page Reload)
    if (window.Arena3D && typeof window.Arena3D.atualizarAparencia === 'function') {
      window.Arena3D.atualizarAparencia(vid, configParaSalvar);
    }

    // 4. Disparar evento para qualquer listener ativo
    window.dispatchEvent(new CustomEvent('isapel:avatar-updated', {
      detail: { vendedorId: vid, config: configParaSalvar }
    }));

    showToast(`Avatar 3D do consultor ${vid} salvo e sincronizado com a Arena!`, 'success');
    fecharModalCustomizador();
  }

  function inicializarModalAvatar() {
    // 1. Botões de fechamento
    const btnFechar = document.getElementById('btn-fechar-customizador');
    if (btnFechar) btnFechar.addEventListener('click', fecharModalCustomizador);

    const btnCancelar = document.getElementById('btn-cancelar-customizador');
    if (btnCancelar) btnCancelar.addEventListener('click', fecharModalCustomizador);

    const backdrop = document.getElementById('modal-avatar-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) fecharModalCustomizador();
      });
    }

    // 2. Botão de salvar
    const btnSalvar = document.getElementById('btn-salvar-avatar');
    if (btnSalvar) btnSalvar.addEventListener('click', salvarCustomizacaoAvatar);

    // 3. Seletor de consultor (Diretoria)
    const selVendedor = document.getElementById('avatar-custom-seller-select');
    if (selVendedor) {
      selVendedor.addEventListener('change', (e) => {
        const vid = e.target.value;
        AppState.vendedorCustomizandoId = vid;
        const cfg = obterConfigAvatarVendedor(vid);
        sincronizarControlesModal(cfg);
        if (AppState.avatarPreviewEngine) {
          AppState.avatarPreviewEngine.carregarConfig(vid, cfg);
        }
      });
    }

    // 4. Seletor e Swatches de Uniforme
    const selUniforme = document.getElementById('avatar-uniforme-select');
    if (selUniforme) {
      selUniforme.addEventListener('change', (e) => {
        const val = e.target.value;
        document.querySelectorAll('.crm-uniforme-swatch-btn').forEach(btn => {
          btn.classList.toggle('is-active', btn.getAttribute('data-uniforme') === val);
          btn.classList.toggle('is-selected', btn.getAttribute('data-uniforme') === val);
        });
        if (AppState.avatarPreviewEngine) {
          AppState.avatarPreviewEngine.atualizarTrait('uniforme', val);
        }
      });
    }

    document.querySelectorAll('.crm-uniforme-swatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-uniforme');
        if (!val) return;
        if (selUniforme) selUniforme.value = val;
        document.querySelectorAll('.crm-uniforme-swatch-btn').forEach(b => {
          b.classList.toggle('is-active', b === btn);
          b.classList.toggle('is-selected', b === btn);
        });
        if (AppState.avatarPreviewEngine) {
          AppState.avatarPreviewEngine.atualizarTrait('uniforme', val);
        }
      });
    });

    // 5. Cabelo (Estilo e Cor)
    const selCabelo = document.getElementById('avatar-cabelo-estilo');
    if (selCabelo) {
      selCabelo.addEventListener('change', (e) => {
        if (AppState.avatarPreviewEngine) {
          AppState.avatarPreviewEngine.atualizarTrait('cabeloEstilo', e.target.value);
        }
      });
    }

    document.querySelectorAll('#avatar-cabelo-cores .crm-color-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        const cor = btn.getAttribute('data-cor-cabelo') || btn.getAttribute('data-cabelo-cor');
        if (!cor) return;
        document.querySelectorAll('#avatar-cabelo-cores .crm-color-swatch').forEach(b => {
          b.classList.toggle('is-active', b === btn);
          b.classList.toggle('is-selected', b === btn);
        });
        if (AppState.avatarPreviewEngine) {
          AppState.avatarPreviewEngine.atualizarTrait('cabeloHex', cor);
        }
      });
    });

    // 6. Barba (Estilo e Cor)
    const selBarba = document.getElementById('avatar-barba-estilo');
    if (selBarba) {
      selBarba.addEventListener('change', (e) => {
        if (AppState.avatarPreviewEngine) {
          AppState.avatarPreviewEngine.atualizarTrait('barbaEstilo', e.target.value);
        }
      });
    }

    document.querySelectorAll('#avatar-barba-cores .crm-color-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        const cor = btn.getAttribute('data-cor-barba');
        if (!cor) return;
        document.querySelectorAll('#avatar-barba-cores .crm-color-swatch').forEach(b => {
          b.classList.toggle('is-active', b === btn);
          b.classList.toggle('is-selected', b === btn);
        });
        if (AppState.avatarPreviewEngine) {
          AppState.avatarPreviewEngine.atualizarTrait('barbaHex', cor);
        }
      });
    });

    // 7. Tom de Pele
    const selPele = document.getElementById('avatar-pele-tom');
    if (selPele) {
      selPele.addEventListener('change', (e) => {
        const cor = e.target.value;
        document.querySelectorAll('#avatar-pele-swatches .crm-color-swatch').forEach(b => {
          const bCor = b.getAttribute('data-pele') || b.getAttribute('data-tom-pele');
          b.classList.toggle('is-active', (bCor || '').toLowerCase() === cor.toLowerCase());
        });
        if (AppState.avatarPreviewEngine) {
          AppState.avatarPreviewEngine.atualizarTrait('peleHex', cor);
        }
      });
    }

    document.querySelectorAll('#avatar-pele-swatches .crm-color-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        const cor = btn.getAttribute('data-pele') || btn.getAttribute('data-tom-pele');
        if (!cor) return;
        if (selPele) selPele.value = cor.toUpperCase();
        document.querySelectorAll('#avatar-pele-swatches .crm-color-swatch').forEach(b => {
          b.classList.toggle('is-active', b === btn);
          b.classList.toggle('is-selected', b === btn);
        });
        if (AppState.avatarPreviewEngine) {
          AppState.avatarPreviewEngine.atualizarTrait('peleHex', cor);
        }
      });
    });

    // 8. Óculos & Crachá
    const selOculos = document.getElementById('avatar-acessorio-oculos');
    if (selOculos) {
      selOculos.addEventListener('change', (e) => {
        if (AppState.avatarPreviewEngine) {
          AppState.avatarPreviewEngine.atualizarTrait('oculos', e.target.value);
        }
      });
    }

    const chkCracha = document.getElementById('avatar-cracha-check');
    if (chkCracha) {
      chkCracha.addEventListener('change', (e) => {
        if (AppState.avatarPreviewEngine) {
          AppState.avatarPreviewEngine.atualizarTrait('cracha', e.target.checked);
        }
      });
    }

    // 9. Gatilhos de Abertura do Modal (Header, Arena, Tabela)
    const btnHeader = document.getElementById('btn-customizar-avatar-header');
    if (btnHeader) {
      btnHeader.addEventListener('click', (e) => {
        e.preventDefault();
        abrirModalCustomizador();
      });
    }

    const btnArena = document.getElementById('btn-abrir-customizador-arena');
    if (btnArena) {
      btnArena.addEventListener('click', (e) => {
        e.preventDefault();
        abrirModalCustomizador();
      });
    }

    // Delegação global para botões de customização na tabela ou em qualquer lugar
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-customizar-avatar-tabela, .btn-customizar-avatar, #btn-abrir-customizador');
      if (btn && btn !== btnHeader && btn !== btnArena) {
        e.preventDefault();
        const vid = btn.getAttribute('data-vendedor');
        abrirModalCustomizador(vid);
      }
    });
  }

  // ==========================================================================
  // 16. INICIALIZAÇÃO GERAL DO APLICATIVO
  // ==========================================================================
  function initApp() {
    console.log('[Isapel CRM] Inicializando frontend moderno B2B...');

    // 0. Autenticação e Controle de Acesso Baseado em Papéis (RBAC)
    const sessao = (window.IsapelAuth && typeof window.IsapelAuth.obterSessao === 'function')
      ? window.IsapelAuth.obterSessao()
      : null;

    if (sessao) {
      inicializarRBAC(sessao);
    }

    // Configurar ação do botão de Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.IsapelAuth && typeof window.IsapelAuth.logout === 'function') {
          window.IsapelAuth.logout('login.html');
        } else {
          window.location.replace('login.html');
        }
      });
    }

    inicializarFormularioCadastro();
    inicializarAbas();
    inicializarSeletorVendedor();
    inicializarFormularioNovoVendedor();
    atualizarSeletoresVendedores();
    renderizarTabelaVendedores();
    inicializarKanbanDropTargets();
    inicializarBotoesArena();
    inicializarFechamentoDoDia();
    inicializarAnalytics();
    inicializarModalNotas();
    inicializarModalEditar();
    inicializarModalAvatar();
    inicializarBusca();

    // Suporte universal à tecla Escape para fechar modais
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        const modalNotas = document.getElementById('modal-notas-backdrop');
        const modalEditar = document.getElementById('modal-editar-backdrop');
        const modalAvatar = document.getElementById('modal-avatar-backdrop') || document.getElementById('modal-avatar-customizer');
        if (modalNotas && modalNotas.classList.contains('is-open')) {
          fecharModalNotas();
        }
        if (modalEditar && modalEditar.classList.contains('is-open')) {
          fecharModalEditar();
        }
        if (modalAvatar && modalAvatar.classList.contains('is-open')) {
          fecharModalCustomizador();
        }
      }
    });

    // Renderização inicial
    renderizarKanban();
    sincronizarArena3D();
    renderizarAnalytics();

    // Inicialização da Sincronização Híbrida (Supabase Nuvem + Backup Local)
    if (window.IsapelSync) {
      const dot = document.getElementById('sync-status-dot');
      const text = document.getElementById('sync-status-text');

      window.IsapelSync.onStatusChange((st) => {
        if (dot && text) {
          if (st.supabaseAtivo) {
            dot.style.background = '#10B981'; // Verde: Nuvem ativa
            text.textContent = 'Nuvem & Rede OK';
          } else {
            dot.style.background = '#F59E0B'; // Amarelo: Modo Local / Rede
            text.textContent = 'Rede Local (Offline)';
          }
        }
      });

      // Sincronização em tempo real com Supabase (Nuvem como fonte primária)
      window.IsapelSync.carregarLeadsNuvem('todos').then(leadsNuvem => {
        if (leadsNuvem && Array.isArray(leadsNuvem) && window.IsapelCRM) {
          if (leadsNuvem.length > 0) {
            window.IsapelCRM.definirLeads(leadsNuvem);
            renderizarKanban();
            sincronizarArena3D();
            renderizarAnalytics();
            console.log(`[Isapel Sync] Nuvem conectada: ${leadsNuvem.length} leads sincronizados.`);
          }
        }
      });

      // Auto-polling para sincronizar alterações feitas por outros vendedores (Maciel, Fernanda, Caio)
      setInterval(async () => {
        const novos = await window.IsapelSync.carregarLeadsNuvem('todos');
        if (novos && Array.isArray(novos) && window.IsapelCRM) {
          window.IsapelCRM.definirLeads(novos);
          renderizarKanban();
          sincronizarArena3D();
          renderizarAnalytics();
        }
      }, 15000);
    }

    if (typeof window !== 'undefined') {
      window.renderizarTabelaVendedores = renderizarTabelaVendedores;
      window.atualizarSeletoresVendedores = atualizarSeletoresVendedores;
      window.abrirModalCustomizador = abrirModalCustomizador;
      window.fecharModalCustomizador = fecharModalCustomizador;
    }

    console.log('[Isapel CRM] Frontend pronto e operando.');
  }

  // Inicializa quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})(window, document);
