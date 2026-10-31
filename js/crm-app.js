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
    vendedorAtivo: 'todos', // 'todos' | 'maciel' | 'fernanda' | 'caio'
    abaAtiva: 'tab-funil',
    buscaTermo: '',
    leadEmEdicaoId: null,
    leadEmNotasId: null,
    ultimoFechamentoGerado: null,
    audioContext: null
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
    const leadsSalvos = JSON.parse(localStorage.getItem('isapel_leads_v1') || '[]');
    const digits = extrairApenasDigitos(telefone);
    const ddd = parseInt(digits.slice(0, 2), 10) || 11;
    const infoDDD = resolverDDDFallback(ddd);

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
      valorProposta: 0,
      dataCriacao: new Date().toISOString(),
      dataUltimoContato: new Date().toISOString(),
      historicoContatos: [
        {
          data: new Date().toISOString(),
          anotacao: 'Lead cadastrado via entrada rápida do CRM.',
          autor: vendedorId
        }
      ]
    };

    leadsSalvos.unshift(novoLead);
    localStorage.setItem('isapel_leads_v1', JSON.stringify(leadsSalvos));
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
    return JSON.parse(localStorage.getItem('isapel_leads_v1') || '[]');
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
      // Filtro de busca
      if (termo) {
        const nomeMatch = (lead.nome || '').toLowerCase().includes(termo);
        const cidadeMatch = (lead.cidade || '').toLowerCase().includes(termo);
        const foneMatch = (lead.telefone || '').includes(termo);
        const dddMatch = String(lead.ddd || '').includes(termo);
        return nomeMatch || cidadeMatch || foneMatch || dddMatch;
      }
      return true;
    });

    // Atualiza status do filtro na barra superior
    const statusFiltro = document.getElementById('kanban-filter-status');
    if (statusFiltro) {
      if (AppState.vendedorAtivo !== 'todos' || termo) {
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

  function criarCardElement(lead) {
    const card = document.createElement('div');
    card.className = 'crm-card';
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', lead.id);
    card.setAttribute('data-stage', lead.estagio);

    // Vendedor Info
    let sellerName = 'Maciel';
    let sellerInitials = 'GM';
    if (lead.vendedorId === 'fernanda') {
      sellerName = 'Fernanda';
      sellerInitials = 'FE';
    } else if (lead.vendedorId === 'caio') {
      sellerName = 'Caio';
      sellerInitials = 'CA';
    }

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

    if (window.IsapelCRM && typeof window.IsapelCRM.moverEstagioLead === 'function') {
      window.IsapelCRM.moverEstagioLead(leadId, novoEstagio);
    } else {
      const todos = obterTodosOsLeads();
      const lead = todos.find(l => l.id === leadId);
      if (lead) {
        lead.estagio = novoEstagio;
        lead.dataUltimoContato = new Date().toISOString();
        localStorage.setItem('isapel_leads_v1', JSON.stringify(todos));
      }
    }

    playSound('drop');
    renderizarKanban();
    sincronizarArena3D();

    // Sincronizar mudança de estágio no Supabase
    if (window.IsapelCRM && typeof window.IsapelCRM.obterLeadPorId === 'function' && window.IsapelSync) {
      const leadAtualizado = window.IsapelCRM.obterLeadPorId(leadId);
      if (leadAtualizado) {
        window.IsapelSync.salvarLeadNuvem(leadAtualizado);
      }
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
      } else {
        sec.classList.remove('is-active');
        sec.setAttribute('hidden', 'until-found');
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
      atualizarPainelFechamento();
    }
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
        return;
      }

      AppState.vendedorAtivo = e.target.value;

      if (avatar) {
        if (AppState.vendedorAtivo === 'maciel') avatar.textContent = 'GM';
        else if (AppState.vendedorAtivo === 'fernanda') avatar.textContent = 'FE';
        else if (AppState.vendedorAtivo === 'caio') avatar.textContent = 'CA';
        else avatar.textContent = 'ALL';
      }

      renderizarKanban();
      showToast(`Visualização filtrada para: ${select.options[select.selectedIndex].text}`, 'info', 2000);

      // Se nuvem estiver ativa e for diretoria, sincroniza dados filtrados
      if (window.IsapelSync && sessao && sessao.perfil === 'diretoria') {
        const leads = await window.IsapelSync.carregarLeadsNuvem(AppState.vendedorAtivo);
        if (leads && Array.isArray(leads) && window.IsapelCRM) {
          window.IsapelCRM.definirLeads(leads);
          renderizarKanban();
          sincronizarArena3D();
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

      const nomeVendedor = p.vendedor?.nome || (p.vendedorId === 'maciel' ? 'Gabriel Maciel' : (p.vendedorId === 'fernanda' ? 'Fernanda' : 'Caio'));
      const iniciais = p.vendedorId === 'maciel' ? 'GM' : (p.vendedorId === 'fernanda' ? 'FE' : 'CA');

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
        const meta = id === 'maciel' ? 60000 : (id === 'fernanda' ? 45000 : 35000);
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
      caio: { id: 'caio', nome: 'Caio', valorTotal: 0, fardosTotal: 0, fechados: 0, negociando: 0 }
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
        estagio: estagio
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
  // 16. INICIALIZAÇÃO GERAL DO APLICATIVO
  // ==========================================================================
  function initApp() {
    console.log('[Isapel CRM] Inicializando frontend moderno B2B...');

    // 0. Autenticação e Controle de Acesso Baseado em Papéis (RBAC)
    const sessao = (window.IsapelAuth && typeof window.IsapelAuth.obterSessao === 'function')
      ? window.IsapelAuth.obterSessao()
      : null;

    if (sessao) {
      const headerUserName = document.getElementById('header-user-name');
      const headerUserAvatar = document.getElementById('header-user-avatar');
      const headerUserRoleBadge = document.getElementById('header-user-role-badge');
      const wrapperVendedorSelect = document.getElementById('wrapper-vendedor-select');
      const selectVendedor = document.getElementById('vendedor-select');
      const avatarAtivo = document.getElementById('header-active-avatar');

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
      }
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
    inicializarKanbanDropTargets();
    inicializarBotoesArena();
    inicializarFechamentoDoDia();
    inicializarModalNotas();
    inicializarModalEditar();
    inicializarBusca();

    // Suporte universal à tecla Escape para fechar modais
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        const modalNotas = document.getElementById('modal-notas-backdrop');
        const modalEditar = document.getElementById('modal-editar-backdrop');
        if (modalNotas && modalNotas.classList.contains('is-open')) {
          fecharModalNotas();
        }
        if (modalEditar && modalEditar.classList.contains('is-open')) {
          fecharModalEditar();
        }
      }
    });

    // Renderização inicial
    renderizarKanban();
    sincronizarArena3D();

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
      window.IsapelSync.carregarLeadsNuvem().then(leadsNuvem => {
        if (leadsNuvem && Array.isArray(leadsNuvem) && window.IsapelCRM) {
          if (leadsNuvem.length > 0) {
            window.IsapelCRM.definirLeads(leadsNuvem);
            renderizarKanban();
            sincronizarArena3D();
            console.log(`[Isapel Sync] Nuvem conectada: ${leadsNuvem.length} leads sincronizados.`);
          }
        }
      });

      // Auto-polling para sincronizar alterações feitas por outros vendedores (Maciel, Fernanda, Caio)
      setInterval(async () => {
        const novos = await window.IsapelSync.carregarLeadsNuvem();
        if (novos && Array.isArray(novos) && window.IsapelCRM) {
          window.IsapelCRM.definirLeads(novos);
          renderizarKanban();
          sincronizarArena3D();
        }
      }, 15000);
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
