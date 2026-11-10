/**
 * ============================================================================
 * ARENA DE COMPETIÇÃO 3D - ISAPEL PAPÉIS & BIA PAPER
 * ============================================================================
 * Módulo de Gamificação Comercial em Tempo Real
 * 
 * Personagens Estilizados (Low-Poly / Voxel Corporativo de Alta Elegância):
 *   1. Fernanda: 21 anos, loira, cabelos compridos, polo Isapel Azul Claro (#38BDF8)
 *   2. Caio: 19 anos, cabelos escuros enrolados volumosos, postura jovem e dinâmica
 *   3. Maciel (Gabriel Maciel): Cabelos escuros enrolados, BIGODE nítido e característico,
 *      blazer azul marinho Isapel (#003360), crachá executivo e liderança
 * 
 * Pódio Tridimensional:
 *   - 1º Lugar (Centro): Ouro Bia Paper (#E3A52B) com Troféu 3D Flutuante
 *   - 2º Lugar (Esquerda): Prata Polida Metálica
 *   - 3º Lugar (Direita): Bronze Nobre Metálico
 * 
 * Mecânicas:
 *   - Animação contínua: Vitória/comemoração pro 1º, aplausos/respiração pros demais
 *   - Transição suave (Lerp/Parábola) entre posições ao mudar o ranking
 *   - Controle orbital 360º com mouse/toque
 *   - Sistema de confetes 3D para celebração de fechamentos
 *   - Chime sintetizado Web Audio API
 *   - Placares visuais com estatísticas reativas
 * ============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Arena3D = factory();
    root.atualizarArena3D = root.Arena3D.atualizar;
    root.initArena3D = root.Arena3D.init;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ==========================================================================
  // PALETA DE CORES OFICIAIS ISAPEL & BIA PAPER
  // ==========================================================================
  const CORES = {
    isapelNavy: 0x003360,      // Azul Fábrica Isapel Profundo
    isapelCyan: 0x38bdf8,      // Azul Claro / Destaque Isapel
    isapelBlue: 0x0284c7,      // Azul Corporativo Isapel
    biaPaperGold: 0xe3a52b,    // Dourado Nobre Bia Paper
    biaPaperGoldGlow: 0xf59e0b,// Ouro Brilho
    prata: 0xcbd5e1,           // Prata Metálica 2º Lugar
    bronze: 0xcd7f32,          // Bronze Metálico 3º Lugar
    fundoEscuro: 0x07111e,     // Slate Navy Studio Background
    pisoGrid: 0x0c1e34,        // Piso da Arena
    branco: 0xffffff,
    pelePadrao: 0xf6cbab,      // Tom de pele estilizado
    peleFernanda: 0xf9d3b4,
    peleCaio: 0xdfa980,
    peleMaciel: 0xe6b994,
    cabeloFernanda: 0xf7cf46,  // Loiro luminoso
    cabeloFernandaDark: 0xdfab1b,
    cabeloCaio: 0x1f1917,      // Cabelo preto cacheado
    cabeloMaciel: 0x1a1514,    // Cabelo e bigode do Maciel
    bigodeMaciel: 0x161211,    // Bigode marcante
    verdeVenda: 0x10b981,      // Sucesso / Ganho
    laranjaAviso: 0xf97316
  };

  // ==========================================================================
  // DADOS INICIAIS DA EQUIPE COMERCIAL ISAPEL (OS 5 CONSULTORES)
  // ==========================================================================
  const DADOS_INICIAIS = [
    {
      id: 'maciel',
      nome: 'Gabriel Maciel',
      nomeCurto: 'Gabriel Maciel',
      cargo: 'Comercial',
      corPrimaria: '#6BA4E8',
      corAcento: '#E3A52B',
      avatarIcone: 'GM',
      descricao: 'Gabriel Maciel',
      metricas: {
        contatos: 0,
        novosLeads: 0,
        emNegociacao: 0,
        fechados: 0,
        taxaConversao: 0,
        valorTotal: 0,
        pontos: 0
      }
    },
    {
      id: 'fernanda',
      nome: 'Fernanda',
      nomeCurto: 'Fernanda',
      cargo: 'Comercial',
      corPrimaria: '#2563EB',
      corAcento: '#38BDF8',
      avatarIcone: 'FE',
      descricao: 'Fernanda',
      metricas: {
        contatos: 0,
        novosLeads: 0,
        emNegociacao: 0,
        fechados: 0,
        taxaConversao: 0,
        valorTotal: 0,
        pontos: 0
      }
    },
    {
      id: 'caio',
      nome: 'Caio',
      nomeCurto: 'Caio',
      cargo: 'Comercial',
      corPrimaria: '#0F2547',
      corAcento: '#38BDF8',
      avatarIcone: 'CA',
      descricao: 'Caio',
      metricas: {
        contatos: 0,
        novosLeads: 0,
        emNegociacao: 0,
        fechados: 0,
        taxaConversao: 0,
        valorTotal: 0,
        pontos: 0
      }
    },
    {
      id: 'albert',
      nome: 'Albert',
      nomeCurto: 'Albert',
      cargo: 'Comercial',
      corPrimaria: '#18181B',
      corAcento: '#38BDF8',
      avatarIcone: 'AL',
      descricao: 'Albert',
      metricas: {
        contatos: 0,
        novosLeads: 0,
        emNegociacao: 0,
        fechados: 0,
        taxaConversao: 0,
        valorTotal: 0,
        pontos: 0
      }
    },
    {
      id: 'daniel',
      nome: 'Daniel',
      nomeCurto: 'Daniel',
      cargo: 'Comercial',
      corPrimaria: '#EFE6DD',
      corAcento: '#059669',
      avatarIcone: 'DA',
      descricao: 'Daniel',
      metricas: {
        contatos: 0,
        novosLeads: 0,
        emNegociacao: 0,
        fechados: 0,
        taxaConversao: 0,
        valorTotal: 0,
        pontos: 0
      }
    }
  ];

  // Posições geométricas dos 5 degraus da Arena (1º ao 5º Lugar)
  const PODIUM_SLOTS = {
    1: { x: 0, y: 2.2, z: 0, height: 2.2, radius: 1.45, cor: CORES.biaPaperGold, label: '1º LUGAR' },
    2: { x: -2.85, y: 1.48, z: 0.35, height: 1.48, radius: 1.28, cor: CORES.prata, label: '2º LUGAR' },
    3: { x: 2.85, y: 0.92, z: 0.35, height: 0.92, radius: 1.28, cor: CORES.bronze, label: '3º LUGAR' },
    4: { x: -5.35, y: 0.48, z: 0.85, height: 0.48, radius: 1.15, cor: CORES.isapelBlue, label: '4º LUGAR' },
    5: { x: 5.35, y: 0.48, z: 0.85, height: 0.48, radius: 1.15, cor: CORES.isapelNavy, label: '5º LUGAR' }
  };

  /**
   * Obtém as coordenadas do pódio ou piso da arena para qualquer colocação (1º a 5º+)
   */
  function obterSlotPodio(rank) {
    if (PODIUM_SLOTS[rank]) return PODIUM_SLOTS[rank];
    const lateral = (rank % 2 === 0 ? -1 : 1);
    const idx = Math.floor((rank - 6) / 2);
    return {
      x: lateral * (7.2 + idx * 1.5),
      y: 0.22,
      z: 1.2 + idx * 1.0,
      height: 0.22,
      radius: 1.0,
      cor: CORES.isapelNavy,
      label: `${rank}º LUGAR`
    };
  }

  // ==========================================================================
  // ESTADO INTERNO DO MÓDULO
  // ==========================================================================
  let THREE = null;
  let canvas = null;
  let container = null;
  let renderer = null;
  let scene = null;
  let camera = null;
  let animFrameId = null;
  let isInitialized = false;

  // Entidades 3D
  const characterMeshes = {}; // { 'fernanda': Group, 'caio': Group, 'maciel': Group }
  let podiumGroup = null;
  let trophyGroup = null;
  let confettiSystem = null;
  let sparkParticles = null;
  let winnerSpotlight = null;

  // Estado dos vendedores e animação
  let rankingAtual = []; // Array ordenado [id1, id2, id3]
  let vendedoresData = JSON.parse(JSON.stringify(DADOS_INICIAIS));
  let criterioOrdenacao = 'pontos'; // 'pontos' | 'contatos' | 'novosLeads' | 'fechados'

  // Controles de interação da câmera
  const mouse = { x: 0, y: 0 };
  const cameraControl = {
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    targetTheta: 0,
    targetPhi: 0.26,
    theta: 0,
    phi: 0.26,
    radius: 14.5,
    targetRadius: 14.5
  };

  // Raycaster para interações de clique/hover nos personagens
  let raycaster = null;
  let mousePointer = null;
  let hoveredCharacter = null;

  // ==========================================================================
  // SÍNTESE DE ÁUDIO PROCEDURAL (Web Audio API - Sem arquivos externos)
  // ==========================================================================
  let audioCtx = null;
  function getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playVictoryChime() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Arpeggio de Vitória)
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.6);
      });
    } catch (e) {
      // Audio feedback opcional resiliente
    }
  }

  function playPopChime() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch (e) {}
  }

  // ==========================================================================
  // MODELAGEM PROCEDURAL DOS PERSONAGENS 3D (LOW-POLY CORPORATIVO)
  // ==========================================================================

  /**
   * Construtor de Materiais Compartilhados
   */
  function criarMateriaisPersonagens() {
    return {
      peleFernanda: new THREE.MeshStandardMaterial({ color: CORES.peleFernanda, roughness: 0.5 }),
      peleCaio: new THREE.MeshStandardMaterial({ color: CORES.peleCaio, roughness: 0.5 }),
      peleMaciel: new THREE.MeshStandardMaterial({ color: CORES.peleMaciel, roughness: 0.5 }),
      olhos: new THREE.MeshBasicMaterial({ color: 0x111827 }),
      brilhoOlho: new THREE.MeshBasicMaterial({ color: 0xffffff }),
      sorriso: new THREE.MeshBasicMaterial({ color: 0xbe123c }),
      // Fernanda: Polo Isapel Azul Claro (#38BDF8) + Saia/Calça Navy
      poloFernanda: new THREE.MeshStandardMaterial({ color: CORES.isapelCyan, roughness: 0.45 }),
      golaFernanda: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }),
      saiaFernanda: new THREE.MeshStandardMaterial({ color: CORES.isapelNavy, roughness: 0.4 }),
      cabeloFernanda: new THREE.MeshStandardMaterial({ color: CORES.cabeloFernanda, roughness: 0.35 }),
      cabeloFernandaDark: new THREE.MeshStandardMaterial({ color: CORES.cabeloFernandaDark, roughness: 0.4 }),
      // Caio: Polo Isapel (#0284C7) com detalhes Cyan, Cabelo enrolado escuro volumoso
      poloCaio: new THREE.MeshStandardMaterial({ color: CORES.isapelBlue, roughness: 0.4 }),
      acentoCaio: new THREE.MeshStandardMaterial({ color: CORES.isapelCyan, roughness: 0.3 }),
      calcaCaio: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }),
      tenisBranco: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }),
      cabeloCaio: new THREE.MeshStandardMaterial({ color: CORES.cabeloCaio, roughness: 0.8 }),
      // Maciel: Blazer Azul Marinho (#003360), crachá dourado Bia Paper (#E3A52B), bigode
      blazerMaciel: new THREE.MeshStandardMaterial({ color: CORES.isapelNavy, roughness: 0.35 }),
      camisaMaciel: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }),
      calcaMaciel: new THREE.MeshStandardMaterial({ color: 0x0a1829, roughness: 0.4 }),
      sapatoMaciel: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25 }),
      bigodeMaciel: new THREE.MeshStandardMaterial({ color: CORES.bigodeMaciel, roughness: 0.6 }),
      cabeloMaciel: new THREE.MeshStandardMaterial({ color: CORES.cabeloMaciel, roughness: 0.75 }),
      ouroBiaPaper: new THREE.MeshStandardMaterial({ color: CORES.biaPaperGold, metalness: 0.85, roughness: 0.25 }),
      crachaCard: new THREE.MeshBasicMaterial({ color: 0xffffff })
    };
  }

  // ==========================================================================
  // CONFIGURAÇÃO, PARSERS E NORMALIZADORES DE AVATARES
  // ==========================================================================
  function parseColor(val, fallback) {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const clean = val.trim();
      if (clean.startsWith('#')) return parseInt(clean.slice(1), 16);
      if (clean.startsWith('0x')) return parseInt(clean, 16);
      if (/^[0-9a-fA-F]{6}$/.test(clean)) return parseInt(clean, 16);
    }
    return fallback;
  }

  const VENDEDORES_DEFAULT_AVATARS = {
    // Print 1: Gabriel Maciel — Polo Azul Claro Isapel (#5A98E0), Cabelo Cacheado Curto Escuro, Bigode Cheio, Sem Óculos
    maciel: {
      id: 'maciel',
      uniforme: 'polo-sky',
      peleHex: 0xd49b72,
      cabeloEstilo: 'cacheado-curto',
      cabeloHex: 0x1b130f,
      barbaEstilo: 'com-bigode',
      barbaHex: 0x14100e,
      oculos: 'nenhum',
      cracha: false
    },
    // Print 2: Daniel (Mateus) — Moletom Creme/Off-White com Capuz e Cordões, Cabelo Cacheado Volumoso no Topo, Bigode + Mosca + Cavanhaque
    daniel: {
      id: 'daniel',
      uniforme: 'moletom-creme',
      peleHex: 0xc68a62,
      cabeloEstilo: 'cacheado-volumoso',
      cabeloHex: 0x16110f,
      barbaEstilo: 'cavanhaque',
      barbaHex: 0x14100e,
      oculos: 'nenhum',
      cracha: false
    },
    // Print 3: Caio — Camisa Azul Marinho Isapel (#0F2547) c/ Logo Branco, Cabelo Cacheado Curto Jovem, Cavanhaque Fino na Ponta do Queixo
    caio: {
      id: 'caio',
      uniforme: 'polo-navy',
      peleHex: 0xcf966e,
      cabeloEstilo: 'cacheado-jovem',
      cabeloHex: 0x18120f,
      barbaEstilo: 'cavanhaque-fino',
      barbaHex: 0x18120f,
      oculos: 'nenhum',
      cracha: false
    },
    // Print 4: Fernanda — Blusa Rosa (#EC4899) + Colar Prateado, Cabelo Loiro Dourado Longo Liso c/ Raiz Esfumada, Lábios Rosados
    fernanda: {
      id: 'fernanda',
      uniforme: 'blusa-rosa',
      peleHex: 0xe6b896,
      cabeloEstilo: 'liso-comprido',
      cabeloHex: 0xd6b254,
      barbaEstilo: 'sem-barba',
      barbaHex: 0x161211,
      oculos: 'nenhum',
      cracha: false
    },
    // Print 5: Albert — Jaqueta Preta Aberta sobre Camiseta Azul Marinho Isapel, Cabelo Buzz Curto, Barba Cheia + Sorriso Aberto, Óculos Metálico Prateado
    albert: {
      id: 'albert',
      uniforme: 'jaqueta-preta',
      peleHex: 0xa86b42,
      cabeloEstilo: 'raspado-buzz',
      cabeloHex: 0x121010,
      barbaEstilo: 'barba-cheia',
      barbaHex: 0x121010,
      oculos: 'executivo-prata',
      cracha: false
    }
  };

  function normalizarConfigAvatar(raw, fallbackId) {
    let vid = String(fallbackId || (raw && (raw.id || raw.vendedorId)) || 'custom').trim().toLowerCase();
    if (vid === 'mateus') vid = 'daniel';
    const def = VENDEDORES_DEFAULT_AVATARS[vid] || {
      id: vid,
      uniforme: 'polo-sky',
      peleHex: 0xe6b994,
      cabeloEstilo: 'curto-executivo',
      cabeloHex: 0x1a1514,
      barbaEstilo: 'sem-barba',
      barbaHex: 0x161211,
      oculos: 'nenhum',
      cracha: false
    };

    const norm = { ...def, id: vid };
    if (!raw || typeof raw !== 'object') return norm;

    // 1. Uniforme
    if (typeof raw.uniforme === 'string') {
      const u = raw.uniforme.toLowerCase();
      if (u.includes('moletom') || u.includes('creme') || u.includes('hoodie')) {
        norm.uniforme = 'moletom-creme';
      } else if (u.includes('jaqueta') || u.includes('preta') || u.includes('casaco')) {
        norm.uniforme = 'jaqueta-preta';
      } else if (u.includes('blusa') || u.includes('rosa') || u.includes('royal') || u.includes('regata')) {
        norm.uniforme = 'blusa-rosa';
      } else if (u.includes('sky') || u.includes('cyan') || u.includes('ceu') || u.includes('céu')) {
        norm.uniforme = 'polo-sky';
      } else if (u.includes('social') || u.includes('blazer') || u.includes('branca') || u.includes('gravata')) {
        norm.uniforme = 'camisa-social';
      } else if (u.includes('navy') || u.includes('marinho')) {
        norm.uniforme = 'polo-navy';
      } else {
        norm.uniforme = def.uniforme;
      }
    } else if (raw.uniforme && typeof raw.uniforme === 'object') {
      const tipo = (raw.uniforme.tipo || '').toLowerCase();
      if (tipo.includes('moletom') || tipo.includes('creme') || tipo.includes('hoodie')) {
        norm.uniforme = 'moletom-creme';
      } else if (tipo.includes('jaqueta') || tipo.includes('preta')) {
        norm.uniforme = 'jaqueta-preta';
      } else if (tipo.includes('blusa') || tipo.includes('rosa') || tipo.includes('royal')) {
        norm.uniforme = 'blusa-rosa';
      } else if (tipo.includes('cyan') || tipo.includes('sky')) {
        norm.uniforme = 'polo-sky';
      } else if (tipo.includes('social') || tipo.includes('blazer') || tipo.includes('branca')) {
        norm.uniforme = 'camisa-social';
      } else if (tipo.includes('navy') || tipo.includes('marinho')) {
        norm.uniforme = 'polo-navy';
      } else {
        norm.uniforme = def.uniforme;
      }
      if (raw.uniforme.temCracha !== undefined) {
        norm.cracha = Boolean(raw.uniforme.temCracha);
      }
    }

    // 2. Pele
    if (raw.peleHex !== undefined) {
      norm.peleHex = parseColor(raw.peleHex, norm.peleHex);
    } else if (raw.pele && (raw.pele.tom || raw.pele.cor || raw.pele.hex)) {
      norm.peleHex = parseColor(raw.pele.tom || raw.pele.cor || raw.pele.hex, norm.peleHex);
    }

    // 3. Cabelo
    if (raw.cabeloEstilo) {
      norm.cabeloEstilo = String(raw.cabeloEstilo);
    } else if (raw.cabelo && (raw.cabelo.estilo || raw.cabelo.tipo)) {
      const est = (raw.cabelo.estilo || raw.cabelo.tipo).toLowerCase();
      if (est.includes('longo') || est.includes('feminino') || est.includes('franja') || est.includes('liso')) norm.cabeloEstilo = 'liso-comprido';
      else if (est.includes('jovem')) norm.cabeloEstilo = 'cacheado-jovem';
      else if (est.includes('volumoso') || est.includes('afro')) norm.cabeloEstilo = 'cacheado-volumoso';
      else if (est.includes('curto') && est.includes('social')) norm.cabeloEstilo = 'curto-executivo';
      else if (est.includes('curto') || est.includes('cacheado')) norm.cabeloEstilo = 'cacheado-curto';
      else if (est.includes('ondulado') || est.includes('bob')) norm.cabeloEstilo = 'ondulado-medio';
      else if (est.includes('raspado') || est.includes('buzz')) norm.cabeloEstilo = 'raspado-buzz';
      else norm.cabeloEstilo = raw.cabelo.estilo;
    }

    if (raw.cabeloHex !== undefined) {
      norm.cabeloHex = parseColor(raw.cabeloHex, norm.cabeloHex);
    } else if (raw.cabelo && (raw.cabelo.cor || raw.cabelo.hex)) {
      norm.cabeloHex = parseColor(raw.cabelo.cor || raw.cabelo.hex, norm.cabeloHex);
    }

    // 4. Barba / Bigode
    if (raw.barbaEstilo) {
      norm.barbaEstilo = String(raw.barbaEstilo);
    } else if (raw.barba && (raw.barba.tipo || raw.barba.estilo)) {
      const b = (raw.barba.tipo || raw.barba.estilo).toLowerCase();
      if (b.includes('bigode')) norm.barbaEstilo = 'com-bigode';
      else if (b.includes('fino')) norm.barbaEstilo = 'cavanhaque-fino';
      else if (b.includes('cavanhaque')) norm.barbaEstilo = 'cavanhaque';
      else if (b.includes('cheia') || b.includes('barba')) norm.barbaEstilo = 'barba-cheia';
      else norm.barbaEstilo = 'sem-barba';
    }

    if (raw.barbaHex !== undefined) {
      norm.barbaHex = parseColor(raw.barbaHex, norm.barbaHex);
    } else if (raw.barba && (raw.barba.cor || raw.barba.hex)) {
      norm.barbaHex = parseColor(raw.barba.cor || raw.barba.hex, norm.barbaHex);
    }

    // 5. Óculos
    if (raw.oculos) {
      norm.oculos = String(raw.oculos);
    } else if (raw.acessorios && raw.acessorios.oculos) {
      const oc = String(raw.acessorios.oculos).toLowerCase();
      if (oc.includes('prata') || oc.includes('metal')) norm.oculos = 'executivo-prata';
      else if (oc.includes('redondo')) norm.oculos = 'redondo-moderno';
      else if (oc.includes('dourado')) norm.oculos = 'executivo-dourado';
      else if (oc.includes('retangular') || oc.includes('executivo') || oc.includes('preto')) norm.oculos = 'executivo-preto';
      else if (oc !== 'nenhum') norm.oculos = oc;
      else norm.oculos = 'nenhum';
    }

    // 6. Crachá
    if (raw.cracha !== undefined) {
      norm.cracha = Boolean(raw.cracha);
    }

    return norm;
  }

  function obterConfigAvatarSalva(vendedorId) {
    const vid = String(vendedorId || '').trim().toLowerCase();

    // 1. Consulta IsapelSync se disponível
    if (typeof window !== 'undefined' && window.IsapelSync && typeof window.IsapelSync.obterPerfilAvatar === 'function') {
      try {
        const cfgSync = window.IsapelSync.obterPerfilAvatar(vid);
        if (cfgSync && (cfgSync.uniforme || cfgSync.cabeloEstilo || cfgSync.cabelo)) {
          return normalizarConfigAvatar(cfgSync, vid);
        }
      } catch (e) {}
    }

    // 2. Consulta localStorage (chaves oficiais e legadas de fallback)
    if (typeof localStorage !== 'undefined') {
      try {
        const chaves = ['isapel_crm_avatar_profiles', 'isapel_avatar_customizations', 'isapel_vendedores_custom_v1'];
        for (const k of chaves) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed[vid]) {
              return normalizarConfigAvatar(parsed[vid], vid);
            }
          }
        }
      } catch (e) {}
    }

    // 3. Fallback canônico
    return normalizarConfigAvatar({}, vid);
  }

  // ==========================================================================
  // CONSTRUTOR MODULAR PARAMÉTRICO DE AVATARES 3D (AVATARBUILDER)
  // Modelagem de Alta Fidelidade Baseada nas Fotos Oficiais dos 5 Consultores
  // ==========================================================================
  const AvatarBuilder = {
    obterPresetsPadrao: function () {
      return JSON.parse(JSON.stringify(VENDEDORES_DEFAULT_AVATARS));
    },

    construirAvatar: function (config, THREE_LIB) {
      const T = THREE_LIB || THREE;
      if (!T) {
        console.error('[AvatarBuilder] Three.js não fornecido!');
        return null;
      }

      const cfg = normalizarConfigAvatar(config, (config && config.id) || 'custom');
      const root = new T.Group();
      root.name = 'char_' + cfg.id;

      const bodyGroup = new T.Group();
      bodyGroup.name = 'body_pivot';
      root.add(bodyGroup);

      // Sombra de contato circular suave no piso
      const shadowGeo = new T.CircleGeometry(0.56, 24);
      const shadowMat = new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
      const shadowMesh = new T.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.y = 0.02;
      root.add(shadowMesh);

      // Materiais reativos principais
      const matPele = new T.MeshStandardMaterial({
        color: parseColor(cfg.peleHex, 0xd8a37e),
        roughness: 0.65,
        metalness: 0.0
      });
      matPele.userData = { tipo: 'pele' };

      const matCabelo = new T.MeshStandardMaterial({
        color: parseColor(cfg.cabeloHex, 0x1e1612),
        roughness: cfg.cabeloEstilo === 'liso-comprido' ? 0.55 : 0.78,
        metalness: 0.0
      });
      matCabelo.userData = { tipo: 'cabelo' };

      const matBarba = new T.MeshStandardMaterial({
        color: parseColor(cfg.barbaHex, 0x161211),
        roughness: 0.75,
        metalness: 0.0
      });
      matBarba.userData = { tipo: 'barba' };

      const matOuro = new T.MeshStandardMaterial({
        color: 0xe3a52b,
        metalness: 0.85,
        roughness: 0.25
      });

      // 1. Pernas e Calçados
      this._adicionarPernas(bodyGroup, cfg, T);

      // 2. Torso e Uniforme personalizado por consultor
      const infoManga = this._adicionarTorsoUniforme(bodyGroup, cfg, matPele, matOuro, T);

      // 3. Braços Articulados (com manga longa para jaqueta/moletom ou curta para polo/blusa)
      const matManga = new T.MeshStandardMaterial({
        color: infoManga.cor,
        roughness: infoManga.roughness || 0.55
      });
      const armPosX = (cfg.id === 'fernanda' || cfg.uniforme === 'blusa-rosa' || cfg.uniforme === 'blusa-royal' || cfg.id === 'caio') ? 0.39 : 0.42;
      const armLeft = this._criarBracoArticulado(matManga, matPele, true, infoManga, T);
      armLeft.position.set(-armPosX, 1.52, 0);
      const armRight = this._criarBracoArticulado(matManga, matPele, false, infoManga, T);
      armRight.position.set(armPosX, 1.52, 0);
      bodyGroup.add(armLeft, armRight);

      // 4. Pescoço anatômico
      const pescGeo = new T.CylinderGeometry(0.122, 0.136, 0.20, 14);
      const pescMesh = new T.Mesh(pescGeo, matPele);
      pescMesh.position.y = 1.69;
      bodyGroup.add(pescMesh);

      // 5. Cabeça e Feições Esculpidas (Nariz 3D, Orelhas, Olhos em Camadas, Sobrancelhas, Boca)
      const headGroup = new T.Group();
      headGroup.name = 'head_group';
      headGroup.position.set(0, 2.0, 0);
      bodyGroup.add(headGroup);

      this._adicionarRosto(headGroup, cfg, matPele, matCabelo, T);
      this._adicionarCabelo(headGroup, cfg, matCabelo, T);
      this._adicionarBarba(headGroup, cfg, matBarba, T);
      this._adicionarAcessorios(headGroup, cfg, matOuro, T);

      root.userData = {
        id: cfg.id,
        bodyGroup,
        headGroup,
        armLeft,
        armRight,
        rank: (config && config.rank) || 2,
        baseY: 0,
        targetPos: new T.Vector3(),
        animTimeOffset: Math.random() * 2
      };

      return root;
    },

    _adicionarPernas: function (bodyGroup, cfg, T) {
      const isDaniel = cfg.id === 'daniel' || cfg.uniforme === 'moletom-creme';
      const isFernanda = cfg.id === 'fernanda' || cfg.uniforme === 'blusa-rosa' || cfg.uniforme === 'blusa-royal';
      const corCalca = isDaniel ? 0x1e293b : (isFernanda ? 0x0f172a : 0x0a1829);
      const matCalca = new T.MeshStandardMaterial({ color: corCalca, roughness: 0.45 });
      const matSapato = new T.MeshStandardMaterial({
        color: (cfg.id === 'caio' || isDaniel) ? 0x1e293b : 0x0f172a,
        roughness: 0.28
      });
      const matSola = new T.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });

      const pernaGeo = new T.CylinderGeometry(0.115, 0.095, 0.88, 12);
      const pernaEsq = new T.Mesh(pernaGeo, matCalca);
      pernaEsq.position.set(-0.155, 0.46, 0);
      const pernaDir = pernaEsq.clone();
      pernaDir.position.x = 0.155;
      bodyGroup.add(pernaEsq, pernaDir);

      const sapatoGeo = new T.BoxGeometry(0.175, 0.10, 0.31);
      const sapatoEsq = new T.Mesh(sapatoGeo, matSapato);
      sapatoEsq.position.set(-0.155, 0.055, 0.055);
      const sapatoDir = sapatoEsq.clone();
      sapatoDir.position.x = 0.155;
      bodyGroup.add(sapatoEsq, sapatoDir);

      // Sola branca esportiva para Caio e Daniel
      if (cfg.id === 'caio' || isDaniel) {
        const solaGeo = new T.BoxGeometry(0.18, 0.025, 0.32);
        const solaEsq = new T.Mesh(solaGeo, matSola);
        solaEsq.position.set(-0.155, 0.015, 0.055);
        const solaDir = solaEsq.clone();
        solaDir.position.x = 0.155;
        bodyGroup.add(solaEsq, solaDir);
      }
    },

    _adicionarLogoIsapelPeito: function (parent, posX, posY, posZ, corTextoHex, T) {
      const logoGroup = new T.Group();
      logoGroup.name = 'logo_isapel_peito';
      logoGroup.position.set(posX, posY, posZ);

      const matBranco = new T.MeshBasicMaterial({ color: 0xffffff });
      const matTexto = new T.MeshBasicMaterial({ color: corTextoHex });

      // Ícone das 2 bobinas de papel Isapel
      const rolo1 = new T.Mesh(new T.BoxGeometry(0.036, 0.014, 0.01), matBranco);
      rolo1.position.set(-0.045, 0.012, 0);
      const rolo2 = new T.Mesh(new T.BoxGeometry(0.036, 0.014, 0.01), matBranco);
      rolo2.position.set(-0.045, -0.008, 0);

      // Letras estilizadas "isapel" ao lado do ícone
      const barraTexto = new T.Mesh(new T.BoxGeometry(0.085, 0.022, 0.008), matTexto);
      barraTexto.position.set(0.018, -0.002, 0);

      logoGroup.add(rolo1, rolo2, barraTexto);
      parent.add(logoGroup);
    },

    _adicionarTorsoUniforme: function (bodyGroup, cfg, matPele, matOuro, T) {
      const tipo = cfg.uniforme || 'polo-navy';
      const torsoGroup = new T.Group();
      torsoGroup.name = 'torso_uniforme';

      let infoManga = { cor: 0x0f2547, mangaLonga: false, semManga: false, roughness: 0.45 };

      if (tipo === 'polo-sky') {
        // ====================================================================
        // PRINT 1: GABRIEL MACIEL — Camisa Polo Azul Claro Isapel (#6BA4E8)
        // com gola polo azul claro, 2 botões brancos e logo Isapel no peito
        // ====================================================================
        const corSky = 0x6ba4e8;
        const corSkyDark = 0x528fd9;
        infoManga = { cor: corSky, mangaLonga: false, semManga: false, roughness: 0.42 };

        const matPolo = new T.MeshStandardMaterial({ color: corSky, roughness: 0.42 });
        const matGola = new T.MeshStandardMaterial({ color: corSkyDark, roughness: 0.38 });
        const matBotao = new T.MeshBasicMaterial({ color: 0xffffff });

        const torsoMesh = new T.Mesh(new T.CylinderGeometry(0.355, 0.34, 0.75, 18), matPolo);
        torsoMesh.position.y = 1.25;
        torsoGroup.add(torsoMesh);

        // Colarinho Polo dobrado
        const gola = new T.Mesh(new T.TorusGeometry(0.215, 0.042, 10, 20, Math.PI * 1.65), matGola);
        gola.rotation.x = Math.PI / 2;
        gola.rotation.z = Math.PI * 0.68;
        gola.position.set(0, 1.61, 0);
        torsoGroup.add(gola);

        // Peitilho com os 2 botões brancos da foto
        const peitilho = new T.Mesh(new T.BoxGeometry(0.065, 0.21, 0.02), matGola);
        peitilho.position.set(0, 1.47, 0.348);
        const b1 = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, 0.012, 10), matBotao);
        b1.rotation.x = Math.PI / 2;
        b1.position.set(0, 1.52, 0.36);
        const b2 = b1.clone();
        b2.position.y = 1.43;
        torsoGroup.add(peitilho, b1, b2);

        // Logo Isapel no lado esquerdo do peito (azul marinho + ícone branco)
        this._adicionarLogoIsapelPeito(torsoGroup, 0.145, 1.41, 0.345, 0x0a2540, T);

      } else if (tipo === 'moletom-creme') {
        // ====================================================================
        // PRINT 2: DANIEL (MATEUS) — Moletom Creme/Off-White (#EFE6DD)
        // com Capuz 3D volumoso ao redor do pescoço, ilhoses e cordões
        // ====================================================================
        const corCreme = 0xdecfc1;
        const corCordao = 0xbda793;
        infoManga = { cor: corCreme, mangaLonga: true, semManga: false, roughness: 0.72 };

        const matMoletom = new T.MeshStandardMaterial({ color: corCreme, roughness: 0.72 });
        const matCapuz = new T.MeshStandardMaterial({ color: 0xcab8a7, roughness: 0.74 });
        const matIlhos = new T.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
        const matCordao = new T.MeshStandardMaterial({ color: corCordao, roughness: 0.72 });

        const torsoMesh = new T.Mesh(new T.CylinderGeometry(0.375, 0.355, 0.76, 18), matMoletom);
        torsoMesh.position.y = 1.25;
        torsoGroup.add(torsoMesh);

        // Barra canelada inferior do moletom
        const barra = new T.Mesh(new T.CylinderGeometry(0.358, 0.352, 0.08, 18), matCapuz);
        barra.position.y = 0.90;
        torsoGroup.add(barra);

        // Capuz 3D dobrado ao redor dos ombros/pescoço (como na foto 2)
        const capuzAnel = new T.Mesh(new T.TorusGeometry(0.255, 0.075, 12, 24), matCapuz);
        capuzAnel.rotation.x = Math.PI / 2 - 0.12;
        capuzAnel.position.set(0, 1.61, -0.02);
        torsoGroup.add(capuzAnel);

        // Ilhoses metálicos escuros + Cordões bege caindo no peito
        [-0.085, 0.085].forEach(posX => {
          const ilhos = new T.Mesh(new T.TorusGeometry(0.020, 0.006, 8, 12), matIlhos);
          ilhos.position.set(posX, 1.54, 0.365);
          const cordao = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, 0.24, 8), matCordao);
          cordao.position.set(posX, 1.42, 0.372);
          cordao.rotation.z = posX < 0 ? 0.05 : -0.05;
          torsoGroup.add(ilhos, cordao);
        });

      } else if (tipo === 'polo-navy') {
        // ====================================================================
        // PRINT 3: CAIO — Camisa Azul Marinho Profundo Isapel (#0F2547)
        // com gola careca/polo marinho e logo Isapel branco no peito
        // ====================================================================
        const corNavy = 0x0f2547;
        infoManga = { cor: corNavy, mangaLonga: false, semManga: false, roughness: 0.45 };

        const matNavy = new T.MeshStandardMaterial({ color: corNavy, roughness: 0.45 });
        const torsoMesh = new T.Mesh(new T.CylinderGeometry(0.345, 0.33, 0.75, 18), matNavy);
        torsoMesh.position.y = 1.25;
        torsoGroup.add(torsoMesh);

        // Gola redonda canelada azul marinho
        const gola = new T.Mesh(new T.TorusGeometry(0.205, 0.035, 10, 20), matNavy);
        gola.rotation.x = Math.PI / 2;
        gola.position.set(0, 1.61, 0);
        torsoGroup.add(gola);

        // Logo Isapel branco no peito esquerdo (exatamente como na foto 3)
        this._adicionarLogoIsapelPeito(torsoGroup, 0.14, 1.38, 0.335, 0xffffff, T);

      } else if (tipo === 'blusa-rosa' || tipo === 'blusa-royal') {
        // ====================================================================
        // PRINT 4: FERNANDA — Camisa / Blusa Rosa (#EC4899) + Colar Prateado
        // ====================================================================
        const corRosa = 0xec4899;
        infoManga = { cor: corRosa, mangaLonga: false, semManga: true, roughness: 0.38 };

        const matRosa = new T.MeshStandardMaterial({ color: corRosa, roughness: 0.38 });
        const matPrata = new T.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });

        const torsoMesh = new T.Mesh(new T.CylinderGeometry(0.32, 0.30, 0.68, 18), matRosa);
        torsoMesh.position.y = 1.21;
        torsoGroup.add(torsoMesh);

        // Colo feminino em tom de pele acima do decote da blusa rosa
        const coloMesh = new T.Mesh(new T.CylinderGeometry(0.23, 0.30, 0.12, 16), matPele);
        coloMesh.position.y = 1.58;
        torsoGroup.add(coloMesh);

        // Alças da blusa rosa sobre os ombros
        [-0.20, 0.20].forEach(posX => {
          const alca = new T.Mesh(new T.BoxGeometry(0.075, 0.13, 0.28), matRosa);
          alca.position.set(posX, 1.58, 0);
          torsoGroup.add(alca);
        });

        // Colar delicado prateado com pequeno pingente (visível na foto 4)
        const colar = new T.Mesh(new T.TorusGeometry(0.165, 0.008, 8, 24, Math.PI), matPrata);
        colar.rotation.x = Math.PI / 2 + 0.35;
        colar.rotation.z = Math.PI;
        colar.position.set(0, 1.60, 0.08);
        const pingente = new T.Mesh(new T.SphereGeometry(0.016, 8, 8), matPrata);
        pingente.position.set(0, 1.54, 0.245);
        torsoGroup.add(colar, pingente);

      } else if (tipo === 'jaqueta-preta') {
        // ====================================================================
        // PRINT 5: ALBERT — Jaqueta Preta Aberta de Gola Alta (#18181B)
        // sobre Camiseta Azul Marinho Isapel (#14284B) com Logo Branco no Peito
        // ====================================================================
        const corJaqueta = 0x18181b;
        const corCamiseta = 0x14284b;
        infoManga = { cor: corJaqueta, mangaLonga: true, semManga: false, roughness: 0.42 };

        const matJaqueta = new T.MeshStandardMaterial({ color: corJaqueta, roughness: 0.42 });
        const matCamiseta = new T.MeshStandardMaterial({ color: corCamiseta, roughness: 0.48 });
        const matBotao = new T.MeshStandardMaterial({ color: 0x27272a, metalness: 0.6, roughness: 0.3 });
        const matAlca = new T.MeshStandardMaterial({ color: 0xd6c7b2, roughness: 0.55 });

        // Camiseta interna Azul Marinho Isapel
        const camisetaMesh = new T.Mesh(new T.CylinderGeometry(0.35, 0.34, 0.75, 18), matCamiseta);
        camisetaMesh.position.y = 1.25;
        torsoGroup.add(camisetaMesh);

        // Gola redonda da camiseta azul marinho
        const golaCamiseta = new T.Mesh(new T.TorusGeometry(0.20, 0.028, 8, 18), matCamiseta);
        golaCamiseta.rotation.x = Math.PI / 2;
        golaCamiseta.position.set(0, 1.61, 0);
        torsoGroup.add(golaCamiseta);

        // Logo Isapel branco na camiseta interna (lado esquerdo do peito, visível pela abertura da jaqueta)
        this._adicionarLogoIsapelPeito(torsoGroup, 0.105, 1.35, 0.348, 0xffffff, T);

        // Painéis laterais e traseiro da Jaqueta Preta Aberta na frente
        const jaquetaCasco = new T.Mesh(
          new T.CylinderGeometry(0.378, 0.368, 0.77, 18, 1, false, Math.PI * 0.20, Math.PI * 1.60),
          matJaqueta
        );
        jaquetaCasco.position.y = 1.25;
        torsoGroup.add(jaquetaCasco);

        // Lapelas frontais estruturadas da jaqueta preta + botões laterais
        const lapelaEsq = new T.Mesh(new T.BoxGeometry(0.12, 0.76, 0.045), matJaqueta);
        lapelaEsq.position.set(-0.20, 1.25, 0.325);
        lapelaEsq.rotation.y = -0.22;
        const lapelaDir = new T.Mesh(new T.BoxGeometry(0.12, 0.76, 0.045), matJaqueta);
        lapelaDir.position.set(0.20, 1.25, 0.325);
        lapelaDir.rotation.y = 0.22;
        torsoGroup.add(lapelaEsq, lapelaDir);

        // Botões escuros na lapela direita da jaqueta (como na foto 5)
        [1.36, 1.18].forEach(posY => {
          const btn = new T.Mesh(new T.CylinderGeometry(0.022, 0.022, 0.015, 10), matBotao);
          btn.rotation.x = Math.PI / 2;
          btn.position.set(-0.21, posY, 0.352);
          torsoGroup.add(btn);
        });

        // Gola alta estruturada da jaqueta preta
        const golaAlta = new T.Mesh(
          new T.CylinderGeometry(0.255, 0.245, 0.14, 16, 1, true, Math.PI * 0.22, Math.PI * 1.56),
          matJaqueta
        );
        golaAlta.position.y = 1.64;
        torsoGroup.add(golaAlta);

        // Detalhe das alças bege nos ombros (como na foto 5)
        [-0.27, 0.27].forEach(posX => {
          const alca = new T.Mesh(new T.BoxGeometry(0.025, 0.42, 0.03), matAlca);
          alca.position.set(posX, 1.40, 0.31);
          torsoGroup.add(alca);
        });

      } else {
        // Camisa social branca executiva com gravata dourada Bia Paper (#E3A52B)
        infoManga = { cor: 0xf8fafc, mangaLonga: false, semManga: false, roughness: 0.30 };
        const matCamisa = new T.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.30 });
        const torsoMesh = new T.Mesh(new T.BoxGeometry(0.70, 0.76, 0.40), matCamisa);
        torsoMesh.position.y = 1.28;
        torsoGroup.add(torsoMesh);

        const colEsq = new T.Mesh(new T.BoxGeometry(0.14, 0.06, 0.03), matCamisa);
        colEsq.position.set(-0.08, 1.63, 0.205);
        colEsq.rotation.z = -0.35;
        const colDir = colEsq.clone();
        colDir.position.x = 0.08;
        colDir.rotation.z = 0.35;
        torsoGroup.add(colEsq, colDir);

        const carcela = new T.Mesh(new T.BoxGeometry(0.04, 0.70, 0.015), new T.MeshBasicMaterial({ color: 0xffffff }));
        carcela.position.set(0, 1.28, 0.208);
        torsoGroup.add(carcela);

        const gravata = new T.Mesh(new T.BoxGeometry(0.065, 0.38, 0.025), matOuro);
        gravata.position.set(0, 1.42, 0.218);
        const noGravata = new T.Mesh(new T.ConeGeometry(0.045, 0.06, 4), matOuro);
        noGravata.position.set(0, 1.60, 0.222);
        torsoGroup.add(gravata, noGravata);
      }

      // Crachá Isapel opcional (se habilitado no customizador)
      if (cfg.cracha === true) {
        this._adicionarCrachaIsapel(torsoGroup, matOuro, T);
      }

      bodyGroup.add(torsoGroup);
      return infoManga;
    },

    _adicionarCrachaIsapel: function (parent, matOuro, T) {
      const crachaGroup = new T.Group();
      crachaGroup.name = 'cracha_isapel';

      const fita = new T.Mesh(new T.BoxGeometry(0.05, 0.24, 0.015), new T.MeshStandardMaterial({ color: 0x003360 }));
      fita.position.set(0.14, 1.42, 0.35);

      const card = new T.Mesh(new T.BoxGeometry(0.13, 0.17, 0.02), new T.MeshBasicMaterial({ color: 0xffffff }));
      card.position.set(0.14, 1.24, 0.36);

      const cardHeader = new T.Mesh(new T.BoxGeometry(0.13, 0.04, 0.022), new T.MeshBasicMaterial({ color: 0x0284c7 }));
      cardHeader.position.set(0.14, 1.30, 0.362);

      const clip = new T.Mesh(new T.BoxGeometry(0.03, 0.025, 0.025), matOuro);
      clip.position.set(0.14, 1.33, 0.364);

      crachaGroup.add(fita, card, cardHeader, clip);
      parent.add(crachaGroup);
    },

    _criarBracoArticulado: function (matManga, matPele, isLeft, infoManga, T) {
      const shoulderPivot = new T.Group();
      shoulderPivot.name = isLeft ? 'shoulder_left' : 'shoulder_right';

      const semManga = infoManga && infoManga.semManga;
      const mangaLonga = infoManga && infoManga.mangaLonga;

      const matSuperior = semManga ? matPele : matManga;
      const matInferior = mangaLonga ? matManga : matPele;

      const mangaGeo = new T.CylinderGeometry(0.115, 0.098, 0.40, 12);
      const mangaMesh = new T.Mesh(mangaGeo, matSuperior);
      mangaMesh.position.y = -0.19;
      shoulderPivot.add(mangaMesh);

      const antebracoGeo = new T.CylinderGeometry(0.092, 0.078, 0.35, 12);
      const antebracoMesh = new T.Mesh(antebracoGeo, matInferior);
      antebracoMesh.position.y = -0.51;
      shoulderPivot.add(antebracoMesh);

      const maoGeo = new T.SphereGeometry(0.082, 12, 12);
      maoGeo.scale(1, 1.18, 0.88);
      const maoMesh = new T.Mesh(maoGeo, matPele);
      maoMesh.position.y = -0.71;
      shoulderPivot.add(maoMesh);

      return shoulderPivot;
    },

    _adicionarRosto: function (headGroup, cfg, matPele, matCabelo, T) {
      const isFernanda = cfg.id === 'fernanda' || cfg.cabeloEstilo === 'liso-comprido';
      const isCaio = cfg.id === 'caio' || cfg.cabeloEstilo === 'cacheado-jovem';
      const isAlbert = cfg.id === 'albert' || cfg.barbaEstilo === 'barba-cheia';

      // 1. Formato anatômico da cabeça (mais delicado para Fernanda, mais esguio para Caio)
      const faceGeo = new T.SphereGeometry(0.355, 24, 24);
      if (isFernanda) {
        faceGeo.scale(0.95, 1.06, 0.95);
      } else if (isCaio) {
        faceGeo.scale(0.94, 1.07, 0.96);
      } else {
        faceGeo.scale(1.0, 1.05, 0.98);
      }
      const faceMesh = new T.Mesh(faceGeo, matPele);
      headGroup.add(faceMesh);

      // 2. Orelhas 3D esculpidas nas laterais
      const orelhaGeo = new T.SphereGeometry(0.068, 12, 12);
      orelhaGeo.scale(0.45, 1.15, 0.75);
      const posXOr = isFernanda || isCaio ? 0.335 : 0.355;
      const orelhaEsq = new T.Mesh(orelhaGeo, matPele);
      orelhaEsq.position.set(-posXOr, 0.0, -0.02);
      const orelhaDir = orelhaEsq.clone();
      orelhaDir.position.x = posXOr;
      headGroup.add(orelhaEsq, orelhaDir);

      // 3. Nariz 3D esculpido (ponte nasal + ponta arredondada)
      const narizPonte = new T.Mesh(new T.CylinderGeometry(0.024, 0.036, 0.11, 10), matPele);
      narizPonte.position.set(0, 0.02, 0.345);
      narizPonte.rotation.x = -0.18;
      const narizPonta = new T.Mesh(new T.SphereGeometry(0.042, 12, 12), matPele);
      narizPonta.scale.set(1.08, 0.85, 0.95);
      narizPonta.position.set(0, -0.022, 0.365);
      headGroup.add(narizPonte, narizPonta);

      // 4. Olhos em Camadas (Esclera branca + Íris castanha + Pupila + Duplo Brilho)
      const matEsclera = new T.MeshBasicMaterial({ color: 0xf8fafc });
      const matIris = new T.MeshBasicMaterial({ color: 0x3b2314 });
      const matPupila = new T.MeshBasicMaterial({ color: 0x090d16 });
      const matBrilho = new T.MeshBasicMaterial({ color: 0xffffff });

      [-1, 1].forEach(dir => {
        const ox = dir * 0.125;
        const escr = new T.Mesh(new T.SphereGeometry(0.052, 14, 14), matEsclera);
        escr.scale.set(1.12, 0.88, 0.65);
        escr.position.set(ox, 0.062, 0.318);

        const iris = new T.Mesh(new T.SphereGeometry(0.034, 12, 12), matIris);
        iris.scale.set(1.0, 1.0, 0.55);
        iris.position.set(ox, 0.062, 0.340);

        const pupila = new T.Mesh(new T.SphereGeometry(0.021, 10, 10), matPupila);
        pupila.scale.set(1.0, 1.0, 0.55);
        pupila.position.set(ox, 0.062, 0.350);

        const brilho = new T.Mesh(new T.SphereGeometry(0.011, 8, 8), matBrilho);
        brilho.position.set(ox + 0.014, 0.075, 0.362);

        headGroup.add(escr, iris, pupila, brilho);

        // Cílios delineados para Fernanda
        if (isFernanda) {
          const cilios = new T.Mesh(
            new T.BoxGeometry(0.115, 0.014, 0.02),
            new T.MeshBasicMaterial({ color: 0x1e1612 })
          );
          cilios.position.set(ox, 0.098, 0.342);
          cilios.rotation.z = dir * -0.08;
          headGroup.add(cilios);
        }
      });

      // 5. Sobrancelhas expressivas (mais escuras para loiros como na foto 4 da Fernanda)
      const corSobrancelha = isFernanda ? 0x5c4328 : parseColor(cfg.cabeloHex, 0x1a1514);
      const matSobrancelha = new T.MeshStandardMaterial({ color: corSobrancelha, roughness: 0.6 });
      const espessuraSobr = (cfg.id === 'maciel' || cfg.id === 'daniel') ? 0.032 : 0.024;
      const sobrancGeo = new T.BoxGeometry(0.118, espessuraSobr, 0.032);

      const sobrancEsq = new T.Mesh(sobrancGeo, matSobrancelha);
      sobrancEsq.position.set(-0.125, 0.138, 0.335);
      sobrancEsq.rotation.z = isFernanda ? 0.10 : 0.05;
      const sobrancDir = sobrancEsq.clone();
      sobrancDir.position.x = 0.125;
      sobrancDir.rotation.z = isFernanda ? -0.10 : -0.05;
      headGroup.add(sobrancEsq, sobrancDir);

      // 6. Boca / Sorriso personalizado conforme cada foto
      if (isFernanda) {
        // Fernanda (Print 4): Lábios rosados/malva desenhados + blush suave
        const matLabio = new T.MeshStandardMaterial({ color: 0xd96b78, roughness: 0.35 });
        const labioSup = new T.Mesh(new T.BoxGeometry(0.105, 0.022, 0.028), matLabio);
        labioSup.position.set(0, -0.115, 0.338);
        const labioInf = new T.Mesh(new T.BoxGeometry(0.095, 0.026, 0.030), matLabio);
        labioInf.position.set(0, -0.136, 0.338);
        headGroup.add(labioSup, labioInf);

        const bochechaGeo = new T.CircleGeometry(0.055, 12);
        const bochechaMat = new T.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.22 });
        const bEsq = new T.Mesh(bochechaGeo, bochechaMat);
        bEsq.position.set(-0.20, -0.03, 0.31);
        bEsq.rotation.y = -0.35;
        const bDir = bEsq.clone();
        bDir.position.x = 0.20;
        bDir.rotation.y = 0.35;
        headGroup.add(bEsq, bDir);
      } else if (isAlbert) {
        // Albert (Print 5): Sorriso largo alegre com dentes brancos visíveis
        const matFundoBoca = new T.MeshBasicMaterial({ color: 0x450a0a });
        const matDentes = new T.MeshBasicMaterial({ color: 0xffffff });
        const fundoBoca = new T.Mesh(new T.BoxGeometry(0.155, 0.052, 0.025), matFundoBoca);
        fundoBoca.position.set(0, -0.118, 0.338);
        const dentes = new T.Mesh(new T.BoxGeometry(0.138, 0.032, 0.028), matDentes);
        dentes.position.set(0, -0.115, 0.344);
        headGroup.add(fundoBoca, dentes);
      } else if (isCaio) {
        // Caio (Print 3): Sorriso jovem simpático com leve linha de dentes
        const matLabioCaio = new T.MeshBasicMaterial({ color: 0x9f4242 });
        const matDentes = new T.MeshBasicMaterial({ color: 0xffffff });
        const boca = new T.Mesh(new T.BoxGeometry(0.105, 0.028, 0.022), matLabioCaio);
        boca.position.set(0, -0.122, 0.338);
        const dentes = new T.Mesh(new T.BoxGeometry(0.082, 0.014, 0.025), matDentes);
        dentes.position.set(0, -0.118, 0.342);
        headGroup.add(boca, dentes);
      } else {
        // Maciel (Print 1) & Daniel (Print 2): Sorriso confiante sob o bigode
        const matLabio = new T.MeshBasicMaterial({ color: 0xa34848 });
        const bocaMesh = new T.Mesh(new T.BoxGeometry(0.105, 0.022, 0.024), matLabio);
        bocaMesh.position.set(0, -0.120, 0.342);
        headGroup.add(bocaMesh);
      }
    },

    _adicionarCabelo: function (headGroup, cfg, matCabelo, T) {
      const cabeloExistente = headGroup.getObjectByName('cabelo_group');
      if (cabeloExistente) headGroup.remove(cabeloExistente);

      const cabeloGroup = new T.Group();
      cabeloGroup.name = 'cabelo_group';

      const est = (cfg.cabeloEstilo || 'cacheado-curto').toLowerCase();

      if (est.includes('curto-executivo') || est.includes('curto_social')) {
        const topo = new T.Mesh(new T.SphereGeometry(0.375, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), matCabelo);
        topo.position.set(0, 0.02, -0.02);
        const franja = new T.Mesh(new T.BoxGeometry(0.32, 0.08, 0.14), matCabelo);
        franja.position.set(0.04, 0.28, 0.25);
        franja.rotation.z = -0.12;
        cabeloGroup.add(topo, franja);

      } else if (est.includes('cacheado-curto')) {
        // ====================================================================
        // PRINT 1: GABRIEL MACIEL — Cabelo Cacheado Curto/Médio Castanho Escuro
        // com volume lateral e cachinhos soltos na testa (sem cobrir os olhos)
        // ====================================================================
        const baseCalota = new T.Mesh(new T.SphereGeometry(0.362, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.45), matCabelo);
        baseCalota.position.set(0, 0.04, -0.02);
        cabeloGroup.add(baseCalota);

        const cachosMaciel = [
          [0, 0.32, 0.02, 0.135],
          [-0.14, 0.30, 0.06, 0.125],
          [0.14, 0.30, 0.06, 0.125],
          [-0.22, 0.25, 0.02, 0.125],
          [0.22, 0.25, 0.02, 0.125],
          [-0.18, 0.26, -0.12, 0.135],
          [0.18, 0.26, -0.12, 0.135],
          [0, 0.28, -0.16, 0.145],
          // Cachos frontais e mechas na testa (como na foto 1)
          [-0.08, 0.26, 0.21, 0.095],
          [0.09, 0.26, 0.21, 0.095],
          [-0.01, 0.24, 0.26, 0.068],
          [-0.17, 0.24, 0.18, 0.092],
          [0.18, 0.24, 0.18, 0.092],
          // Laterais cacheadas
          [-0.31, 0.15, 0.05, 0.11],
          [0.31, 0.15, 0.05, 0.11],
          [-0.32, 0.07, -0.08, 0.115],
          [0.32, 0.07, -0.08, 0.115],
          [0, 0.13, -0.25, 0.145],
          [-0.14, 0.09, -0.22, 0.125],
          [0.14, 0.09, -0.22, 0.125]
        ];
        cachosMaciel.forEach(([cx, cy, cz, cr]) => {
          const c = new T.Mesh(new T.SphereGeometry(cr, 10, 10), matCabelo);
          c.position.set(cx, cy, cz);
          cabeloGroup.add(c);
        });

      } else if (est.includes('cacheado-volumoso')) {
        // ====================================================================
        // PRINT 2: DANIEL (MATEUS) — Cachos Escuros Volumosos no Topo da Cabeça
        // ====================================================================
        const baseCalota = new T.Mesh(new T.SphereGeometry(0.362, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.44), matCabelo);
        baseCalota.position.set(0, 0.05, -0.02);
        cabeloGroup.add(baseCalota);

        const cachosDaniel = [
          [0, 0.37, 0.02, 0.165],
          [-0.16, 0.36, 0.07, 0.145],
          [0.16, 0.36, 0.07, 0.145],
          [-0.24, 0.30, 0.0, 0.14],
          [0.24, 0.30, 0.0, 0.14],
          [-0.20, 0.33, -0.12, 0.155],
          [0.20, 0.33, -0.12, 0.155],
          [0, 0.35, -0.16, 0.165],
          [-0.10, 0.40, -0.04, 0.135],
          [0.10, 0.40, -0.04, 0.135],
          // Frente cacheada alta
          [-0.13, 0.29, 0.21, 0.105],
          [0.13, 0.29, 0.21, 0.105],
          [0, 0.30, 0.22, 0.11],
          [-0.23, 0.26, 0.15, 0.105],
          [0.23, 0.26, 0.15, 0.105],
          // Laterais equilibradas
          [-0.32, 0.16, 0.04, 0.115],
          [0.32, 0.16, 0.04, 0.115],
          [-0.31, 0.08, -0.10, 0.12],
          [0.31, 0.08, -0.10, 0.12],
          [0, 0.16, -0.26, 0.155]
        ];
        cachosDaniel.forEach(([cx, cy, cz, cr]) => {
          const c = new T.Mesh(new T.SphereGeometry(cr, 10, 10), matCabelo);
          c.position.set(cx, cy, cz);
          cabeloGroup.add(c);
        });

      } else if (est.includes('cacheado-jovem')) {
        // ====================================================================
        // PRINT 3: CAIO — Cabelo Cacheado Curto Jovem no Topo com Laterais Baixas
        // ====================================================================
        const baseCalota = new T.Mesh(new T.SphereGeometry(0.348, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), matCabelo);
        baseCalota.position.set(0, 0.05, -0.01);
        cabeloGroup.add(baseCalota);

        const cachosCaio = [
          [0, 0.34, 0.03, 0.13],
          [-0.12, 0.33, 0.07, 0.12],
          [0.12, 0.33, 0.07, 0.12],
          [-0.18, 0.29, -0.02, 0.115],
          [0.18, 0.29, -0.02, 0.115],
          [0, 0.32, -0.10, 0.13],
          [-0.14, 0.30, -0.12, 0.12],
          [0.14, 0.30, -0.12, 0.12],
          // Franja cacheada curta no topo da testa (como na foto 3)
          [-0.09, 0.28, 0.19, 0.092],
          [0.09, 0.28, 0.19, 0.092],
          [0, 0.29, 0.21, 0.095],
          [-0.18, 0.25, 0.14, 0.088],
          [0.18, 0.25, 0.14, 0.088],
          // Laterais mais baixas (fade jovem)
          [-0.27, 0.17, 0.04, 0.09],
          [0.27, 0.17, 0.04, 0.09],
          [0, 0.17, -0.23, 0.125]
        ];
        cachosCaio.forEach(([cx, cy, cz, cr]) => {
          const c = new T.Mesh(new T.SphereGeometry(cr, 10, 10), matCabelo);
          c.position.set(cx, cy, cz);
          cabeloGroup.add(c);
        });

      } else if (est.includes('liso-comprido') || est.includes('longo_feminino')) {
        // ====================================================================
        // PRINT 4: FERNANDA — Cabelo Loiro Dourado Longo Liso (#D6B254)
        // com raiz esfumada, repartido ao meio e mechas longas sobre os ombros e peito
        // ====================================================================
        const matRaiz = new T.MeshStandardMaterial({ color: 0x8f7032, roughness: 0.68 });

        // Calota superior lisa elegante
        const calota = new T.Mesh(new T.SphereGeometry(0.366, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.46), matCabelo);
        calota.scale.set(0.97, 1.05, 0.97);
        calota.position.set(0, 0.04, -0.015);

        // Raiz esfumada sutil na risca central do cabelo
        const raizTopo = new T.Mesh(new T.BoxGeometry(0.055, 0.018, 0.22), matRaiz);
        raizTopo.position.set(-0.01, 0.375, 0.06);

        // Mechas longas lisas contínuas descendo suavemente pelos lados do rosto até o peito
        const mechaLongaGeo = new T.CylinderGeometry(0.052, 0.082, 0.88, 16);
        mechaLongaGeo.scale(0.85, 1.0, 0.70);
        const mechaEsq = new T.Mesh(mechaLongaGeo, matCabelo);
        mechaEsq.position.set(-0.265, -0.24, 0.12);
        mechaEsq.rotation.z = -0.05;
        mechaEsq.rotation.x = 0.06;

        const mechaDir = new T.Mesh(mechaLongaGeo, matCabelo);
        mechaDir.position.set(0.265, -0.24, 0.12);
        mechaDir.rotation.z = 0.05;
        mechaDir.rotation.x = 0.06;

        // Topo arredondado conectando as mechas à calota sem quina visível
        const topoMechaGeo = new T.SphereGeometry(0.058, 12, 12);
        topoMechaGeo.scale(0.85, 1.2, 0.75);
        const topoMechaEsq = new T.Mesh(topoMechaGeo, matCabelo);
        topoMechaEsq.position.set(-0.245, 0.18, 0.095);
        const topoMechaDir = new T.Mesh(topoMechaGeo, matCabelo);
        topoMechaDir.position.set(0.245, 0.18, 0.095);

        // Cabelo longo liso nas costas e atrás dos ombros
        const costas = new T.Mesh(new T.BoxGeometry(0.58, 0.96, 0.20), matCabelo);
        costas.position.set(0, -0.24, -0.18);

        cabeloGroup.add(calota, raizTopo, topoMechaEsq, topoMechaDir, mechaEsq, mechaDir, costas);

      } else if (est.includes('ondulado-medio')) {
        const calota = new T.Mesh(new T.SphereGeometry(0.38, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), matCabelo);
        calota.position.set(0, 0.02, -0.02);
        const ondas = [
          [-0.26, -0.04, 0.08, 0.13],
          [0.26, -0.04, 0.08, 0.13],
          [-0.28, -0.15, -0.02, 0.14],
          [0.28, -0.15, -0.02, 0.14],
          [0, -0.12, -0.24, 0.16]
        ];
        ondas.forEach(([ox, oy, oz, or]) => {
          const o = new T.Mesh(new T.SphereGeometry(or, 8, 8), matCabelo);
          o.position.set(ox, oy, oz);
          cabeloGroup.add(o);
        });
        cabeloGroup.add(calota);

      } else {
        // ====================================================================
        // PRINT 5: ALBERT — Corte Curto / Buzz Fade Escuro Alinhado
        // ====================================================================
        const buzz = new T.Mesh(new T.SphereGeometry(0.362, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.42), matCabelo);
        buzz.scale.set(0.99, 1.03, 0.98);
        buzz.position.set(0, 0.04, -0.02);

        const topoTextura = new T.Mesh(new T.CylinderGeometry(0.23, 0.30, 0.08, 16), matCabelo);
        topoTextura.position.set(0, 0.33, 0.0);

        cabeloGroup.add(buzz, topoTextura);
      }

      headGroup.add(cabeloGroup);
    },

    _adicionarBarba: function (headGroup, cfg, matBarba, T) {
      const barbaExistente = headGroup.getObjectByName('barba_group') || headGroup.getObjectByName('bigode_maciel');
      if (barbaExistente) headGroup.remove(barbaExistente);

      const est = (cfg.barbaEstilo || 'sem-barba').toLowerCase();
      if (est === 'sem-barba' || est === 'nenhum') return;

      const barbaGroup = new T.Group();
      barbaGroup.name = est.includes('bigode') ? 'bigode_maciel' : 'barba_group';

      if (est.includes('bigode')) {
        // ====================================================================
        // PRINT 1: GABRIEL MACIEL — Bigode Cheio e Marcante 3D (Chevron)
        // ====================================================================
        const bigodeLadoGeo = new T.BoxGeometry(0.125, 0.048, 0.062);
        const bEsq = new T.Mesh(bigodeLadoGeo, matBarba);
        bEsq.position.set(-0.064, -0.072, 0.352);
        bEsq.rotation.z = -0.16;

        const pontaGeo = new T.ConeGeometry(0.026, 0.058, 8);
        const pEsq = new T.Mesh(pontaGeo, matBarba);
        pEsq.position.set(-0.135, -0.088, 0.345);
        pEsq.rotation.z = Math.PI / 2 + 0.32;

        const bDir = bEsq.clone();
        bDir.position.x = 0.064;
        bDir.rotation.z = 0.16;

        const pDir = pEsq.clone();
        pDir.position.x = 0.135;
        pDir.rotation.z = -(Math.PI / 2 + 0.32);

        const centro = new T.Mesh(new T.BoxGeometry(0.045, 0.042, 0.055), matBarba);
        centro.position.set(0, -0.064, 0.358);

        barbaGroup.add(bEsq, bDir, pEsq, pDir, centro);

      } else if (est.includes('cavanhaque-fino')) {
        // ====================================================================
        // PRINT 3: CAIO — Cavanhaque Fino Discreto na Ponta do Queixo
        // ====================================================================
        const queixoFino = new T.Mesh(new T.SphereGeometry(0.068, 12, 12), matBarba);
        queixoFino.scale.set(1.25, 0.55, 0.58);
        queixoFino.position.set(0, -0.328, 0.238);
        barbaGroup.add(queixoFino);

      } else if (est.includes('cavanhaque')) {
        // ====================================================================
        // PRINT 2: DANIEL (MATEUS) — Bigode Cheio + Mosca + Cavanhaque no Queixo
        // ====================================================================
        const bEsq = new T.Mesh(new T.BoxGeometry(0.118, 0.044, 0.058), matBarba);
        bEsq.position.set(-0.058, -0.072, 0.352);
        bEsq.rotation.z = -0.15;
        const bDir = bEsq.clone();
        bDir.position.x = 0.058;
        bDir.rotation.z = 0.15;
        const bCentro = new T.Mesh(new T.BoxGeometry(0.04, 0.04, 0.054), matBarba);
        bCentro.position.set(0, -0.066, 0.356);

        // Mosca (soul patch) logo abaixo do lábio inferior
        const mosca = new T.Mesh(new T.BoxGeometry(0.042, 0.042, 0.045), matBarba);
        mosca.position.set(0, -0.165, 0.338);

        // Cavanhaque denso arredondado no queixo
        const queixo = new T.Mesh(new T.SphereGeometry(0.10, 14, 14), matBarba);
        queixo.scale.set(1.32, 0.82, 0.68);
        queixo.position.set(0, -0.285, 0.275);

        barbaGroup.add(bEsq, bDir, bCentro, mosca, queixo);

      } else if (est.includes('barba-cheia') || est.includes('barba_cheia')) {
        // ====================================================================
        // PRINT 5: ALBERT — Barba Cheia Curta Alinhada Emoldurando o Sorriso
        // ====================================================================
        const bEsq = new T.Mesh(new T.BoxGeometry(0.105, 0.035, 0.050), matBarba);
        bEsq.position.set(-0.052, -0.068, 0.350);
        bEsq.rotation.z = -0.14;
        const bDir = bEsq.clone();
        bDir.position.x = 0.052;
        bDir.rotation.z = 0.14;
        const bCentro = new T.Mesh(new T.BoxGeometry(0.038, 0.032, 0.048), matBarba);
        bCentro.position.set(0, -0.062, 0.354);

        // Barba curta rente ao queixo e mandíbula (como na foto 5 do Albert)
        const queixo = new T.Mesh(new T.SphereGeometry(0.142, 16, 16), matBarba);
        queixo.scale.set(1.65, 0.65, 0.82);
        queixo.position.set(0, -0.265, 0.232);

        // Costeletas finas rentes ao rosto conectando até o queixo
        const costEsq = new T.Mesh(new T.BoxGeometry(0.036, 0.23, 0.085), matBarba);
        costEsq.position.set(-0.322, -0.09, 0.10);
        costEsq.rotation.z = 0.22;
        const costDir = costEsq.clone();
        costDir.position.x = 0.322;
        costDir.rotation.z = -0.22;

        // Conectores laterais do bigode à barba ao redor do sorriso
        const conectorEsq = new T.Mesh(new T.BoxGeometry(0.036, 0.115, 0.046), matBarba);
        conectorEsq.position.set(-0.095, -0.125, 0.336);
        const conectorDir = conectorEsq.clone();
        conectorDir.position.x = 0.095;

        barbaGroup.add(bEsq, bDir, bCentro, queixo, costEsq, costDir, conectorEsq, conectorDir);
      }

      headGroup.add(barbaGroup);
    },

    _adicionarAcessorios: function (headGroup, cfg, matOuro, T) {
      const oculosExistente = headGroup.getObjectByName('oculos_group');
      if (oculosExistente) headGroup.remove(oculosExistente);

      const oc = (cfg.oculos || 'nenhum').toLowerCase();
      if (oc === 'nenhum') return;

      const oculosGroup = new T.Group();
      oculosGroup.name = 'oculos_group';

      if (oc.includes('executivo-prata') || oc.includes('executivo-dourado') || oc.includes('executivo-preto')) {
        // ====================================================================
        // PRINT 5: ALBERT — Óculos Retangular Metálico Prateado c/ Lente Antirreflexo
        // ====================================================================
        const isGold = oc.includes('dourado');
        const isSilver = oc.includes('prata');
        const matArmacao = isGold
          ? matOuro
          : (isSilver
            ? new T.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.2 })
            : new T.MeshStandardMaterial({ color: 0x111827, roughness: 0.35 }));

        const matLente = new T.MeshBasicMaterial({
          color: 0x818cf8,
          transparent: true,
          opacity: 0.20
        });

        [-1, 1].forEach(dir => {
          const cx = dir * 0.128;
          // Lente translúcida com reflexo azulado sutil (permite ver os olhos perfeitamente)
          const lente = new T.Mesh(new T.BoxGeometry(0.132, 0.076, 0.006), matLente);
          lente.position.set(cx, 0.062, 0.358);

          // Aros finos superior, inferior e laterais da armação retangular
          const aroSup = new T.Mesh(new T.BoxGeometry(0.142, 0.012, 0.016), matArmacao);
          aroSup.position.set(cx, 0.102, 0.360);
          const aroInf = new T.Mesh(new T.BoxGeometry(0.142, 0.010, 0.016), matArmacao);
          aroInf.position.set(cx, 0.022, 0.360);
          const aroExt = new T.Mesh(new T.BoxGeometry(0.012, 0.088, 0.016), matArmacao);
          aroExt.position.set(cx + dir * 0.068, 0.062, 0.360);
          const aroInt = new T.Mesh(new T.BoxGeometry(0.010, 0.088, 0.016), matArmacao);
          aroInt.position.set(cx - dir * 0.066, 0.062, 0.360);

          oculosGroup.add(lente, aroSup, aroInf, aroExt, aroInt);
        });

        // Ponte central metálica
        const ponte = new T.Mesh(new T.BoxGeometry(0.056, 0.014, 0.018), matArmacao);
        ponte.position.set(0, 0.072, 0.362);

        // Hastes laterais até as orelhas
        const hasteEsq = new T.Mesh(new T.BoxGeometry(0.014, 0.014, 0.32), matArmacao);
        hasteEsq.position.set(-0.205, 0.068, 0.20);
        const hasteDir = hasteEsq.clone();
        hasteDir.position.x = 0.205;

        oculosGroup.add(ponte, hasteEsq, hasteDir);

      } else if (oc.includes('redondo')) {
        const matArmacao = new T.MeshStandardMaterial({ color: 0x2b1e16, roughness: 0.3 });

        const aroEsq = new T.Mesh(new T.TorusGeometry(0.055, 0.01, 8, 16), matArmacao);
        aroEsq.position.set(-0.128, 0.062, 0.358);
        const aroDir = aroEsq.clone();
        aroDir.position.x = 0.128;

        const ponte = new T.Mesh(new T.BoxGeometry(0.065, 0.014, 0.018), matArmacao);
        ponte.position.set(0, 0.065, 0.358);

        oculosGroup.add(aroEsq, aroDir, ponte);
      }

      headGroup.add(oculosGroup);
    }
  };

  // ==========================================================================
  // ENGINE DE LIVE PREVIEW TRIDIMENSIONAL (AVATARPREVIEWENGINE)
  // ==========================================================================
  class AvatarPreviewEngine {
    constructor(canvasOrId) {
      let canvasEl = typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
      if (!canvasEl) {
        console.warn('[AvatarPreviewEngine] Elemento de canvas não encontrado para id:', canvasOrId);
        return;
      }
      this.canvas = canvasEl;
      const w = canvasEl.clientWidth || 380;
      const h = canvasEl.clientHeight || 440;

      const T = (typeof window !== 'undefined' && window.THREE) ? window.THREE : THREE;
      this.THREE = T;

      this.renderer = new T.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min((typeof window !== 'undefined' ? window.devicePixelRatio : 1), 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = T.PCFSoftShadowMap;

      this.scene = new T.Scene();
      this.scene.background = null;

      this.camera = new T.PerspectiveCamera(34, w / h, 0.1, 50);
      this.camera.position.set(0, 1.55, 4.1);
      this.camera.lookAt(0, 1.38, 0);

      // Iluminação de estúdio profissional balanceada (sem estourar tons claros)
      const amb = new T.AmbientLight(0xdbeafe, 0.58);
      const key = new T.DirectionalLight(0xffffff, 0.78);
      key.position.set(3.5, 5.5, 4.5);
      key.castShadow = true;
      const fill = new T.DirectionalLight(0x38bdf8, 0.42);
      fill.position.set(-4, 3, 3);
      const rim = new T.DirectionalLight(0xffffff, 0.55);
      rim.position.set(0, 4.5, -4);
      this.scene.add(amb, key, fill, rim);

      // Pedestal circular elegante com borda em Ouro Bia Paper (#E3A52B)
      const baseGeo = new T.CylinderGeometry(1.25, 1.3, 0.14, 32);
      const baseMat = new T.MeshStandardMaterial({
        color: 0x0c1e34,
        metalness: 0.8,
        roughness: 0.25
      });
      this.pedestal = new T.Mesh(baseGeo, baseMat);
      this.pedestal.position.y = -0.07;
      const ringGeo = new T.TorusGeometry(1.26, 0.025, 8, 32);
      const ringMat = new T.MeshStandardMaterial({
        color: 0xe3a52b,
        metalness: 0.9,
        roughness: 0.2
      });
      const ring = new T.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.01;
      this.scene.add(this.pedestal, ring);

      this.currentMesh = null;
      this.currentConfig = null;
      this.currentVendedorId = 'maciel';
      this.isAutoRotating = true;
      this.isRunning = false;
      this.rotSpeed = 0.007;

      this._setupOrbitControls();
      this.animar = this.animar.bind(this);
    }

    carregarConfig(vendedorId, config) {
      this.currentVendedorId = vendedorId || this.currentVendedorId || 'maciel';
      this.currentConfig = normalizarConfigAvatar(config || {}, this.currentVendedorId);

      if (this.currentMesh) {
        this.scene.remove(this.currentMesh);
        this.currentMesh = null;
      }

      this.currentMesh = AvatarBuilder.construirAvatar(this.currentConfig, this.THREE);
      if (this.currentMesh) {
        this.currentMesh.position.set(0, 0, 0);
        this.scene.add(this.currentMesh);
      }

      if (this.canvas) {
        const w = this.canvas.clientWidth || 380;
        const h = this.canvas.clientHeight || 440;
        if (w > 0 && h > 0) {
          this.renderer.setSize(w, h, false);
          this.camera.aspect = w / h;
          this.camera.updateProjectionMatrix();
        }
      }
    }

    atualizarTrait(chave, valor) {
      if (!this.currentConfig) {
        this.currentConfig = normalizarConfigAvatar({}, this.currentVendedorId);
      }
      this.currentConfig[chave] = valor;

      // Se for alteração de cor, atualiza materiais existentes sem recriar malhas
      if (chave === 'peleHex' && this.currentMesh) {
        const c = parseColor(valor, 0xe6b994);
        this.currentMesh.traverse(child => {
          if (child.material && child.material.userData && child.material.userData.tipo === 'pele') {
            child.material.color.set(c);
          }
        });
        return;
      }

      if (chave === 'cabeloHex' && this.currentMesh) {
        const c = parseColor(valor, 0x1a1514);
        this.currentMesh.traverse(child => {
          if (child.material && child.material.userData && child.material.userData.tipo === 'cabelo') {
            child.material.color.set(c);
          }
        });
        return;
      }

      if (chave === 'barbaHex' && this.currentMesh) {
        const c = parseColor(valor, 0x161211);
        this.currentMesh.traverse(child => {
          if (child.material && child.material.userData && child.material.userData.tipo === 'barba') {
            child.material.color.set(c);
          }
        });
        return;
      }

      // Mudança estrutural (uniforme, corte de cabelo, estilo de barba, óculos, crachá):
      // Preserva a rotação atual para experiência fluida sem saltos
      const rotY = this.currentMesh ? this.currentMesh.rotation.y : 0;
      if (this.currentMesh) {
        this.scene.remove(this.currentMesh);
      }
      this.currentMesh = AvatarBuilder.construirAvatar(this.currentConfig, this.THREE);
      if (this.currentMesh) {
        this.currentMesh.rotation.y = rotY;
        this.scene.add(this.currentMesh);
      }
    }

    obterConfigAtual() {
      return { ...this.currentConfig };
    }

    iniciar() {
      if (this.isRunning) return;
      this.isRunning = true;
      if (this.canvas) {
        const w = this.canvas.clientWidth || 380;
        const h = this.canvas.clientHeight || 440;
        if (w > 0 && h > 0) {
          this.renderer.setSize(w, h, false);
          this.camera.aspect = w / h;
          this.camera.updateProjectionMatrix();
        }
      }
      requestAnimationFrame(this.animar);
    }

    pausar() {
      this.isRunning = false;
    }

    destruir() {
      this.pausar();
      if (this.currentMesh) {
        this.scene.remove(this.currentMesh);
        this.currentMesh = null;
      }
      if (this.renderer) {
        this.renderer.dispose();
      }
    }

    animar() {
      if (!this.isRunning) return;
      requestAnimationFrame(this.animar);

      if (this.currentMesh && this.isAutoRotating) {
        this.currentMesh.rotation.y += this.rotSpeed;
      }

      this.renderer.render(this.scene, this.camera);
    }

    _setupOrbitControls() {
      let isDown = false;
      let prevX = 0;
      let idleTimeout = null;

      const onPointerDown = (clientX) => {
        isDown = true;
        prevX = clientX;
        this.isAutoRotating = false;
        if (idleTimeout) clearTimeout(idleTimeout);
      };

      const onPointerMove = (clientX) => {
        if (!isDown || !this.currentMesh) return;
        const dx = clientX - prevX;
        prevX = clientX;
        this.currentMesh.rotation.y += dx * 0.018;
      };

      const onPointerUp = () => {
        isDown = false;
        idleTimeout = setTimeout(() => {
          this.isAutoRotating = true;
        }, 3500);
      };

      this.canvas.addEventListener('mousedown', e => onPointerDown(e.clientX));
      window.addEventListener('mousemove', e => onPointerMove(e.clientX));
      window.addEventListener('mouseup', onPointerUp);

      this.canvas.addEventListener('touchstart', e => {
        if (e.touches.length > 0) onPointerDown(e.touches[0].clientX);
      }, { passive: true });
      window.addEventListener('touchmove', e => {
        if (e.touches.length > 0) onPointerMove(e.touches[0].clientX);
      }, { passive: true });
      window.addEventListener('touchend', onPointerUp);
    }
  }

  // ==========================================================================
  // SINCRONIZAÇÃO EM TEMPO REAL COM A ARENA 3D PRINCIPAL (ZERO RELOAD)
  // ==========================================================================
  function atualizarAparencia(vendedorId, novaConfig) {
    if (!vendedorId) return;
    const vid = String(vendedorId).trim().toLowerCase();
    const cfg = normalizarConfigAvatar(novaConfig || {}, vid);

    const meshAntigo = characterMeshes[vid];
    if (!meshAntigo) {
      if (scene && THREE) {
        const novoMesh = AvatarBuilder.construirAvatar(cfg, THREE);
        characterMeshes[vid] = novoMesh;
        scene.add(novoMesh);
        const ordenados = calcularRanking(vendedoresData, criterioOrdenacao);
        sincronizarPosicoesPersonagens(ordenados);
      }
      return;
    }

    const posicaoAtual = meshAntigo.position.clone();
    const rotacaoAtual = meshAntigo.rotation.y;
    const userDataPreservado = { ...meshAntigo.userData };

    scene.remove(meshAntigo);

    const novoMesh = AvatarBuilder.construirAvatar(cfg, THREE);
    novoMesh.position.copy(posicaoAtual);
    novoMesh.rotation.y = rotacaoAtual;
    novoMesh.userData = userDataPreservado;

    characterMeshes[vid] = novoMesh;
    scene.add(novoMesh);

    // Feedback visual imediato com salto de comemoração
    focarAnimacaoPersonagem(vid);
  }

  // Listener global de evento de sincronização
  if (typeof window !== 'undefined') {
    window.addEventListener('isapel:avatar-updated', function (e) {
      if (e && e.detail && e.detail.vendedorId && e.detail.config) {
        atualizarAparencia(e.detail.vendedorId, e.detail.config);
      }
    });
  }

  /**
   * Constrói o modelo 3D estilizado de FERNANDA
   * Menina loira de 21 anos, cabelos loiros compridos estilizados, camisa pólo Isapel Azul Claro
   */
  function criarModeloFernanda(materiais) {
    const config = obterConfigAvatarSalva('fernanda');
    return AvatarBuilder.construirAvatar(config, THREE);

    // Sombra de contato no piso do pódio
    const shadowGeo = new THREE.CircleGeometry(0.55, 24);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.02;
    root.add(shadowMesh);

    // Pernas / Saia Executiva Navy
    const saiaGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.65, 12);
    const saiaMesh = new THREE.Mesh(saiaGeo, materiais.saiaFernanda);
    saiaMesh.position.y = 0.65;
    bodyGroup.add(saiaMesh);

    // Pernas sob a saia
    const pernaGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.5, 10);
    const pernaEsq = new THREE.Mesh(pernaGeo, materiais.peleFernanda);
    pernaEsq.position.set(-0.14, 0.25, 0);
    const pernaDir = pernaEsq.clone();
    pernaDir.position.x = 0.14;
    bodyGroup.add(pernaEsq, pernaDir);

    // Sapatos executivos elegantes
    const sapatoGeo = new THREE.BoxGeometry(0.16, 0.1, 0.26);
    const sapatoEsq = new THREE.Mesh(sapatoGeo, materiais.saiaFernanda);
    sapatoEsq.position.set(-0.14, 0.05, 0.05);
    const sapatoDir = sapatoEsq.clone();
    sapatoDir.position.x = 0.14;
    bodyGroup.add(sapatoEsq, sapatoDir);

    // Torso / Camisa Pólo Isapel Azul Claro (#38BDF8)
    const torsoGeo = new THREE.CylinderGeometry(0.34, 0.36, 0.72, 12);
    const torsoMesh = new THREE.Mesh(torsoGeo, materiais.poloFernanda);
    torsoMesh.position.y = 1.25;
    bodyGroup.add(torsoMesh);

    // Colarinho branco da pólo
    const colarinhoGeo = new THREE.TorusGeometry(0.24, 0.05, 8, 16);
    const colarinhoMesh = new THREE.Mesh(colarinhoGeo, materiais.golaFernanda);
    colarinhoMesh.rotation.x = Math.PI / 2;
    colarinhoMesh.position.set(0, 1.58, 0);
    bodyGroup.add(colarinhoMesh);

    // Crachá executivo com fita azul Isapel
    const crachaFita = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.02), materiais.saiaFernanda);
    crachaFita.position.set(0.12, 1.38, 0.34);
    const crachaPlaca = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.02), materiais.crachaCard);
    crachaPlaca.position.set(0.12, 1.22, 0.35);
    bodyGroup.add(crachaFita, crachaPlaca);

    // Pescoço
    const pescGeo = new THREE.CylinderGeometry(0.12, 0.13, 0.18, 10);
    const pescMesh = new THREE.Mesh(pescGeo, materiais.peleFernanda);
    pescMesh.position.y = 1.66;
    bodyGroup.add(pescMesh);

    // Cabeça
    const headGroup = new THREE.Group();
    headGroup.name = 'head_group';
    headGroup.position.set(0, 1.95, 0);
    bodyGroup.add(headGroup);

    const faceGeo = new THREE.SphereGeometry(0.35, 20, 20);
    faceGeo.scale(1, 1.1, 0.95);
    const faceMesh = new THREE.Mesh(faceGeo, materiais.peleFernanda);
    headGroup.add(faceMesh);

    // Olhos expressivos com brilho
    const olhoGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const olhoEsq = new THREE.Mesh(olhoGeo, materiais.olhos);
    olhoEsq.position.set(-0.13, 0.06, 0.32);
    const olhoDir = olhoEsq.clone();
    olhoDir.position.x = 0.13;
    const brilhoGeo = new THREE.SphereGeometry(0.015, 8, 8);
    const brilhoEsq = new THREE.Mesh(brilhoGeo, materiais.brilhoOlho);
    brilhoEsq.position.set(-0.11, 0.08, 0.355);
    const brilhoDir = brilhoEsq.clone();
    brilhoDir.position.x = 0.15;
    headGroup.add(olhoEsq, olhoDir, brilhoEsq, brilhoDir);

    // Bochechas rosadas sutis (charme jovem)
    const bochechaGeo = new THREE.CircleGeometry(0.06, 12);
    const bochechaMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.35 });
    const bochechaEsq = new THREE.Mesh(bochechaGeo, bochechaMat);
    bochechaEsq.position.set(-0.2, -0.05, 0.31);
    bochechaEsq.rotation.y = -0.3;
    const bochechaDir = bochechaEsq.clone();
    bochechaDir.position.x = 0.2;
    bochechaDir.rotation.y = 0.3;
    headGroup.add(bochechaEsq, bochechaDir);

    // Sorriso alegre e acolhedor
    const sorrisoGeo = new THREE.TorusGeometry(0.08, 0.02, 8, 12, Math.PI);
    const sorrisoMesh = new THREE.Mesh(sorrisoGeo, materiais.sorriso);
    sorrisoMesh.rotation.x = Math.PI;
    sorrisoMesh.position.set(0, -0.12, 0.33);
    headGroup.add(sorrisoMesh);

    // CABELO LOIRO COMPRIDO ESTILIZADO (Volume topo, franja e mechas longas caindo nos ombros e costas)
    const cabeloGroup = new THREE.Group();
    // Topo volumoso
    const cabeloTopo = new THREE.Mesh(new THREE.SphereGeometry(0.39, 16, 16), materiais.cabeloFernanda);
    cabeloTopo.position.set(0, 0.08, -0.04);
    cabeloTopo.scale.set(1.02, 1.05, 1.05);
    cabeloGroup.add(cabeloTopo);

    // Franja estilizada
    const franjaGeo = new THREE.CylinderGeometry(0.37, 0.4, 0.18, 12, 1, false, 0, Math.PI);
    const franjaMesh = new THREE.Mesh(franjaGeo, materiais.cabeloFernandaDark);
    franjaMesh.position.set(0, 0.22, 0.05);
    franjaMesh.rotation.x = 0.25;
    cabeloGroup.add(franjaMesh);

    // Mechas longas frontais descendo pelos ombros (Esquerda e Direita)
    const mechaFrenteGeo = new THREE.CylinderGeometry(0.09, 0.05, 0.85, 10);
    const mechaEsq = new THREE.Mesh(mechaFrenteGeo, materiais.cabeloFernanda);
    mechaEsq.position.set(-0.32, -0.25, 0.18);
    mechaEsq.rotation.z = -0.12;
    const mechaDir = mechaEsq.clone();
    mechaDir.position.x = 0.32;
    mechaDir.rotation.z = 0.12;
    cabeloGroup.add(mechaEsq, mechaDir);

    // Mechas longas nas costas descendo até a cintura
    const mechasCostasGeo = new THREE.BoxGeometry(0.55, 0.95, 0.22);
    const mechasCostas = new THREE.Mesh(mechasCostasGeo, materiais.cabeloFernanda);
    mechasCostas.position.set(0, -0.32, -0.25);
    cabeloGroup.add(mechasCostas);

    headGroup.add(cabeloGroup);

    // Braços com articulação de ombro (para animação)
    const armLeft = criarBraco(materiais.poloFernanda, materiais.peleFernanda, true);
    armLeft.position.set(-0.42, 1.5, 0);
    const armRight = criarBraco(materiais.poloFernanda, materiais.peleFernanda, false);
    armRight.position.set(0.42, 1.5, 0);
    bodyGroup.add(armLeft, armRight);

    // Registra referências de animação
    root.userData = {
      id: 'fernanda',
      bodyGroup,
      headGroup,
      armLeft,
      armRight,
      rank: 2,
      baseY: 0,
      targetPos: new THREE.Vector3(),
      animTimeOffset: 0.5
    };

    return root;
  }

  /**
   * Constrói o modelo 3D estilizado de CAIO
   * Jovem de 19 anos, cabelos escuros enrolados/cacheados volumosos, postura jovem e dinâmica
   */
  function criarModeloCaio(materiais) {
    const config = obterConfigAvatarSalva('caio');
    return AvatarBuilder.construirAvatar(config, THREE);

    // Sombra de contato
    const shadowGeo = new THREE.CircleGeometry(0.55, 24);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.02;
    root.add(shadowMesh);

    // Pernas / Calça Chino Moderna
    const pernaGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.85, 10);
    const pernaEsq = new THREE.Mesh(pernaGeo, materiais.calcaCaio);
    pernaEsq.position.set(-0.16, 0.45, 0);
    const pernaDir = pernaEsq.clone();
    pernaDir.position.x = 0.16;
    bodyGroup.add(pernaEsq, pernaDir);

    // Sneakers corporativos modernos (Branco com detalhes azul claro Isapel)
    const tenisGeo = new THREE.BoxGeometry(0.18, 0.12, 0.32);
    const tenisEsq = new THREE.Mesh(tenisGeo, materiais.tenisBranco);
    tenisEsq.position.set(-0.16, 0.06, 0.06);
    const faixaGeo = new THREE.BoxGeometry(0.185, 0.03, 0.14);
    const faixaEsq = new THREE.Mesh(faixaGeo, materiais.acentoCaio);
    faixaEsq.position.set(0, 0, 0);
    tenisEsq.add(faixaEsq);

    const tenisDir = tenisEsq.clone();
    tenisDir.position.x = 0.16;
    bodyGroup.add(tenisEsq, tenisDir);

    // Torso / Pólo Isapel Azul (#0284C7) com detalhes Cyan (#38BDF8)
    const torsoGeo = new THREE.CylinderGeometry(0.36, 0.34, 0.76, 12);
    const torsoMesh = new THREE.Mesh(torsoGeo, materiais.poloCaio);
    torsoMesh.position.y = 1.25;
    bodyGroup.add(torsoMesh);

    // Faixa no peito estilizada
    const faixaPeitoGeo = new THREE.CylinderGeometry(0.365, 0.365, 0.12, 12);
    const faixaPeito = new THREE.Mesh(faixaPeitoGeo, materiais.acentoCaio);
    faixaPeito.position.y = 1.35;
    bodyGroup.add(faixaPeito);

    // Colarinho da pólo
    const colarinhoGeo = new THREE.TorusGeometry(0.25, 0.045, 8, 16);
    const colarinhoMesh = new THREE.Mesh(colarinhoGeo, materiais.acentoCaio);
    colarinhoMesh.rotation.x = Math.PI / 2;
    colarinhoMesh.position.set(0, 1.6, 0);
    bodyGroup.add(colarinhoMesh);

    // Pescoço
    const pescGeo = new THREE.CylinderGeometry(0.13, 0.14, 0.18, 10);
    const pescMesh = new THREE.Mesh(pescGeo, materiais.peleCaio);
    pescMesh.position.y = 1.68;
    bodyGroup.add(pescMesh);

    // Cabeça
    const headGroup = new THREE.Group();
    headGroup.name = 'head_group';
    headGroup.position.set(0, 1.98, 0);
    bodyGroup.add(headGroup);

    const faceGeo = new THREE.SphereGeometry(0.36, 20, 20);
    faceGeo.scale(1, 1.05, 0.98);
    const faceMesh = new THREE.Mesh(faceGeo, materiais.peleCaio);
    headGroup.add(faceMesh);

    // Olhos dinâmicos
    const olhoGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const olhoEsq = new THREE.Mesh(olhoGeo, materiais.olhos);
    olhoEsq.position.set(-0.13, 0.05, 0.33);
    const olhoDir = olhoEsq.clone();
    olhoDir.position.x = 0.13;
    const brilhoGeo = new THREE.SphereGeometry(0.015, 8, 8);
    const brilhoEsq = new THREE.Mesh(brilhoGeo, materiais.brilhoOlho);
    brilhoEsq.position.set(-0.11, 0.07, 0.365);
    const brilhoDir = brilhoEsq.clone();
    brilhoDir.position.x = 0.15;
    headGroup.add(olhoEsq, olhoDir, brilhoEsq, brilhoDir);

    // Sorriso confiante jovem
    const sorrisoGeo = new THREE.TorusGeometry(0.075, 0.018, 8, 12, Math.PI * 0.85);
    const sorrisoMesh = new THREE.Mesh(sorrisoGeo, materiais.sorriso);
    sorrisoMesh.rotation.x = Math.PI;
    sorrisoMesh.rotation.z = -0.1;
    sorrisoMesh.position.set(0.02, -0.11, 0.34);
    headGroup.add(sorrisoMesh);

    // CABELO ESCURO ENROLADO / CACHEADO VOLUMOSO
    // Construído com múltiplos nós tridimensionais criando textura autêntica de cachos volumosos
    const cabeloCachosGroup = new THREE.Group();
    const clusterCoords = [
      // Topo e coroa (volume elevado)
      [0, 0.32, 0.02, 0.17],
      [-0.15, 0.31, 0.08, 0.15],
      [0.15, 0.31, 0.08, 0.15],
      [-0.22, 0.25, -0.06, 0.16],
      [0.22, 0.25, -0.06, 0.16],
      [0, 0.28, -0.18, 0.18],
      // Frente e topo frontal (cachos caindo suavemente perto da testa)
      [-0.12, 0.24, 0.22, 0.13],
      [0.12, 0.24, 0.22, 0.13],
      [0, 0.26, 0.25, 0.14],
      // Laterais volumosas e têmporas
      [-0.28, 0.12, 0.1, 0.15],
      [0.28, 0.12, 0.1, 0.15],
      [-0.3, 0.05, -0.08, 0.16],
      [0.3, 0.05, -0.08, 0.16],
      // Nuca e traseira
      [-0.15, 0.08, -0.24, 0.16],
      [0.15, 0.08, -0.24, 0.16],
      [0, 0.1, -0.27, 0.17]
    ];

    clusterCoords.forEach(([cx, cy, cz, cr]) => {
      const cachoMesh = new THREE.Mesh(new THREE.SphereGeometry(cr, 10, 10), materiais.cabeloCaio);
      cachoMesh.position.set(cx, cy, cz);
      cabeloCachosGroup.add(cachoMesh);
    });

    headGroup.add(cabeloCachosGroup);

    // Braços
    const armLeft = criarBraco(materiais.poloCaio, materiais.peleCaio, true);
    armLeft.position.set(-0.44, 1.52, 0);
    const armRight = criarBraco(materiais.poloCaio, materiais.peleCaio, false);
    armRight.position.set(0.44, 1.52, 0);
    bodyGroup.add(armLeft, armRight);

    root.userData = {
      id: 'caio',
      bodyGroup,
      headGroup,
      armLeft,
      armRight,
      rank: 3,
      baseY: 0,
      targetPos: new THREE.Vector3(),
      animTimeOffset: 1.2
    };

    return root;
  }

  /**
   * Constrói o modelo 3D estilizado de MACIEL (Gabriel Maciel)
   * Cabelos escuros enrolados/texturizados, BIGODE nítido e característico no rosto,
   * blazer azul marinho Isapel (#003360), crachá executivo dourado Bia Paper, visual líder
   */
  function criarModeloMaciel(materiais) {
    const config = obterConfigAvatarSalva('maciel');
    return AvatarBuilder.construirAvatar(config, THREE);

    // Sombra de contato
    const shadowGeo = new THREE.CircleGeometry(0.55, 24);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.02;
    root.add(shadowMesh);

    // Pernas / Calça Social Alfaiataria Azul Marinho
    const pernaGeo = new THREE.CylinderGeometry(0.115, 0.095, 0.88, 10);
    const pernaEsq = new THREE.Mesh(pernaGeo, materiais.calcaMaciel);
    pernaEsq.position.set(-0.16, 0.46, 0);
    const pernaDir = pernaEsq.clone();
    pernaDir.position.x = 0.16;
    bodyGroup.add(pernaEsq, pernaDir);

    // Sapatos executivos de couro escuro polido
    const sapatoGeo = new THREE.BoxGeometry(0.18, 0.11, 0.32);
    const sapatoEsq = new THREE.Mesh(sapatoGeo, materiais.sapatoMaciel);
    sapatoEsq.position.set(-0.16, 0.055, 0.06);
    const sapatoDir = sapatoEsq.clone();
    sapatoDir.position.x = 0.16;
    bodyGroup.add(sapatoEsq, sapatoDir);

    // Torso / Blazer Executivo Isapel Navy (#003360) + Camisa Branca + Gravata Dourada Bia Paper
    const torsoGeo = new THREE.BoxGeometry(0.72, 0.78, 0.42);
    const torsoMesh = new THREE.Mesh(torsoGeo, materiais.blazerMaciel);
    torsoMesh.position.y = 1.28;
    bodyGroup.add(torsoMesh);

    // Abertura em "V" da camisa branca sob o blazer
    const camisaVGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -0.12, 1.62, 0.215,
       0.12, 1.62, 0.215,
       0.0,  1.22, 0.215
    ]);
    camisaVGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    camisaVGeo.computeVertexNormals();
    const camisaVMesh = new THREE.Mesh(camisaVGeo, materiais.camisaMaciel);
    bodyGroup.add(camisaVMesh);

    // Gravata executiva Dourada Bia Paper (#E3A52B)
    const gravataGeo = new THREE.BoxGeometry(0.065, 0.35, 0.025);
    const gravataMesh = new THREE.Mesh(gravataGeo, materiais.ouroBiaPaper);
    gravataMesh.position.set(0, 1.44, 0.22);
    bodyGroup.add(gravataMesh);

    // Crachá Executivo Dourado Bia Paper no peito
    const badgeGeo = new THREE.BoxGeometry(0.12, 0.16, 0.03);
    const badgeMesh = new THREE.Mesh(badgeGeo, materiais.ouroBiaPaper);
    badgeMesh.position.set(-0.22, 1.38, 0.22);
    const badgeInner = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.035), materiais.camisaMaciel);
    badgeInner.position.set(-0.22, 1.38, 0.225);
    bodyGroup.add(badgeMesh, badgeInner);

    // Pescoço
    const pescGeo = new THREE.CylinderGeometry(0.13, 0.14, 0.18, 10);
    const pescMesh = new THREE.Mesh(pescGeo, materiais.peleMaciel);
    pescMesh.position.y = 1.7;
    bodyGroup.add(pescMesh);

    // Cabeça
    const headGroup = new THREE.Group();
    headGroup.name = 'head_group';
    headGroup.position.set(0, 2.0, 0);
    bodyGroup.add(headGroup);

    const faceGeo = new THREE.SphereGeometry(0.36, 20, 20);
    faceGeo.scale(1, 1.05, 0.98);
    const faceMesh = new THREE.Mesh(faceGeo, materiais.peleMaciel);
    headGroup.add(faceMesh);

    // Olhos determinados de líder
    const olhoGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const olhoEsq = new THREE.Mesh(olhoGeo, materiais.olhos);
    olhoEsq.position.set(-0.13, 0.06, 0.33);
    const olhoDir = olhoEsq.clone();
    olhoDir.position.x = 0.13;
    const brilhoGeo = new THREE.SphereGeometry(0.015, 8, 8);
    const brilhoEsq = new THREE.Mesh(brilhoGeo, materiais.brilhoOlho);
    brilhoEsq.position.set(-0.11, 0.08, 0.365);
    const brilhoDir = brilhoEsq.clone();
    brilhoDir.position.x = 0.15;
    headGroup.add(olhoEsq, olhoDir, brilhoEsq, brilhoDir);

    // Sobrancelhas confiantes
    const sobrancGeo = new THREE.BoxGeometry(0.11, 0.025, 0.03);
    const sobrancEsq = new THREE.Mesh(sobrancGeo, materiais.cabeloMaciel);
    sobrancEsq.position.set(-0.13, 0.13, 0.34);
    sobrancEsq.rotation.z = 0.06;
    const sobrancDir = sobrancEsq.clone();
    sobrancDir.position.x = 0.13;
    sobrancDir.rotation.z = -0.06;
    headGroup.add(sobrancEsq, sobrancDir);

    // ========================================================================
    // O BIGODE NÍTIDO E CARACTERÍSTICO DE GABRIEL MACIEL (Modelado em 3D)
    // ========================================================================
    const bigodeGroup = new THREE.Group();
    bigodeGroup.name = 'bigode_maciel';

    // Asa esquerda do bigode com curvatura elegante
    const bigodeLadoGeo = new THREE.BoxGeometry(0.12, 0.045, 0.06);
    const bigodeEsq = new THREE.Mesh(bigodeLadoGeo, materiais.bigodeMaciel);
    bigodeEsq.position.set(-0.065, -0.07, 0.355);
    bigodeEsq.rotation.z = -0.15;

    // Ponta esquerda estilizada curvada sutilmente
    const pontaGeo = new THREE.ConeGeometry(0.025, 0.06, 6);
    const pontaEsq = new THREE.Mesh(pontaGeo, materiais.bigodeMaciel);
    pontaEsq.position.set(-0.135, -0.085, 0.35);
    pontaEsq.rotation.z = Math.PI / 2 + 0.3;

    // Asa direita do bigode
    const bigodeDir = bigodeEsq.clone();
    bigodeDir.position.x = 0.065;
    bigodeDir.rotation.z = 0.15;

    const pontaDir = pontaEsq.clone();
    pontaDir.position.x = 0.135;
    pontaDir.rotation.z = -(Math.PI / 2 + 0.3);

    // Nó central conectando o bigode
    const centroBigode = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.05), materiais.bigodeMaciel);
    centroBigode.position.set(0, -0.062, 0.36);

    bigodeGroup.add(bigodeEsq, bigodeDir, pontaEsq, pontaDir, centroBigode);
    headGroup.add(bigodeGroup);

    // Boca sutil logo abaixo do bigode
    const bocaGeo = new THREE.BoxGeometry(0.09, 0.02, 0.02);
    const bocaMesh = new THREE.Mesh(bocaGeo, materiais.sorriso);
    bocaMesh.position.set(0, -0.13, 0.34);
    headGroup.add(bocaMesh);

    // CABELO ESCURO ENROLADO / TEXTURIZADO EXECUTIVO
    const cabeloMacielGroup = new THREE.Group();
    const cachosMaciel = [
      // Topo executivo texturizado
      [0, 0.3, 0.0, 0.16],
      [-0.14, 0.28, 0.06, 0.14],
      [0.14, 0.28, 0.06, 0.14],
      [-0.18, 0.24, -0.1, 0.15],
      [0.18, 0.24, -0.1, 0.15],
      [0, 0.26, -0.16, 0.16],
      // Linha frontal dos cachos
      [-0.1, 0.24, 0.2, 0.12],
      [0.1, 0.24, 0.2, 0.12],
      [0, 0.25, 0.22, 0.13],
      // Laterais alinhadas (corte degradê executivo)
      [-0.26, 0.14, 0.05, 0.13],
      [0.26, 0.14, 0.05, 0.13],
      [-0.27, 0.06, -0.1, 0.14],
      [0.27, 0.06, -0.1, 0.14],
      // Traseira
      [0, 0.12, -0.25, 0.15],
      [-0.12, 0.08, -0.22, 0.14],
      [0.12, 0.08, -0.22, 0.14]
    ];

    cachosMaciel.forEach(([cx, cy, cz, cr]) => {
      const c = new THREE.Mesh(new THREE.SphereGeometry(cr, 8, 8), materiais.cabeloMaciel);
      c.position.set(cx, cy, cz);
      cabeloMacielGroup.add(c);
    });

    headGroup.add(cabeloMacielGroup);

    // Braços em blazer azul marinho
    const armLeft = criarBraco(materiais.blazerMaciel, materiais.peleMaciel, true);
    armLeft.position.set(-0.48, 1.54, 0);
    const armRight = criarBraco(materiais.blazerMaciel, materiais.peleMaciel, false);
    armRight.position.set(0.48, 1.54, 0);
    bodyGroup.add(armLeft, armRight);

    root.userData = {
      id: 'maciel',
      bodyGroup,
      headGroup,
      armLeft,
      armRight,
      rank: 1,
      baseY: 0,
      targetPos: new THREE.Vector3(),
      animTimeOffset: 0
    };

    return root;
  }

  /**
   * Constrói braço com articulação no ombro e mão
   */
  function criarBraco(mangaMaterial, peleMaterial, isLeft) {
    const shoulderPivot = new THREE.Group();
    shoulderPivot.name = isLeft ? 'shoulder_left' : 'shoulder_right';

    // Ombreira / Manga superior
    const mangaGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.42, 10);
    const mangaMesh = new THREE.Mesh(mangaGeo, mangaMaterial);
    mangaMesh.position.y = -0.2;
    shoulderPivot.add(mangaMesh);

    // Antebraço / Punho com pele
    const antebracoGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.35, 10);
    const antebracoMesh = new THREE.Mesh(antebracoGeo, peleMaterial);
    antebracoMesh.position.y = -0.52;
    shoulderPivot.add(antebracoMesh);

    // Mão
    const maoGeo = new THREE.SphereGeometry(0.085, 10, 10);
    maoGeo.scale(1, 1.2, 0.9);
    const maoMesh = new THREE.Mesh(maoGeo, peleMaterial);
    maoMesh.position.y = -0.72;
    shoulderPivot.add(maoMesh);

    return shoulderPivot;
  }

  // ==========================================================================
  // CENÁRIO 3D: PÓDIO METÁLICO, PLATAFORMA ARENA & TROFÉU DOURADO
  // ==========================================================================

  /**
   * Constrói a arena, o pódio dos 3 colocados e o troféu flutuante
   */
  function criarCenario3D() {
    podiumGroup = new THREE.Group();
    podiumGroup.name = 'podium_stage';
    scene.add(podiumGroup);

    // 1. Grande Plataforma Circular da Arena (Piso corporativo espelhado Isapel)
    const arenaPisoGeo = new THREE.CylinderGeometry(7.6, 8.0, 0.35, 48);
    const arenaPisoMat = new THREE.MeshStandardMaterial({
      color: CORES.pisoGrid,
      roughness: 0.25,
      metalness: 0.65
    });
    const arenaPiso = new THREE.Mesh(arenaPisoGeo, arenaPisoMat);
    arenaPiso.position.y = -0.18;
    arenaPiso.receiveShadow = true;
    podiumGroup.add(arenaPiso);

    // Anel externo iluminado Azul Claro Isapel (#38BDF8)
    const ringGeo = new THREE.TorusGeometry(7.4, 0.08, 12, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: CORES.isapelCyan });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.01;
    podiumGroup.add(ringMesh);

    // Anel interno Dourado Bia Paper (#E3A52B)
    const ringGoldGeo = new THREE.TorusGeometry(6.0, 0.06, 12, 64);
    const ringGoldMat = new THREE.MeshBasicMaterial({ color: CORES.biaPaperGoldGlow });
    const ringGoldMesh = new THREE.Mesh(ringGoldGeo, ringGoldMat);
    ringGoldMesh.rotation.x = Math.PI / 2;
    ringGoldMesh.position.y = 0.015;
    podiumGroup.add(ringGoldMesh);

    // 2. Os 5 Pilares do Pódio (1º Ouro, 2º Prata, 3º Bronze, 4º e 5º Azul Isapel)
    Object.keys(PODIUM_SLOTS).forEach(rankStr => {
      const slot = PODIUM_SLOTS[rankStr];
      const pilarGroup = new THREE.Group();
      pilarGroup.position.set(slot.x, 0, slot.z);

      // Cilindro do Degrau
      const pilarGeo = new THREE.CylinderGeometry(slot.radius, slot.radius * 1.05, slot.height, 32);
      let pilarMat;
      if (rankStr === '1') {
        pilarMat = new THREE.MeshStandardMaterial({
          color: CORES.biaPaperGold,
          roughness: 0.22,
          metalness: 0.88
        });
      } else if (rankStr === '2') {
        pilarMat = new THREE.MeshStandardMaterial({
          color: CORES.prata,
          roughness: 0.28,
          metalness: 0.82
        });
      } else if (rankStr === '3') {
        pilarMat = new THREE.MeshStandardMaterial({
          color: CORES.bronze,
          roughness: 0.32,
          metalness: 0.78
        });
      } else if (rankStr === '4') {
        pilarMat = new THREE.MeshStandardMaterial({
          color: CORES.isapelBlue,
          roughness: 0.35,
          metalness: 0.72
        });
      } else {
        pilarMat = new THREE.MeshStandardMaterial({
          color: CORES.isapelNavy,
          roughness: 0.38,
          metalness: 0.68
        });
      }

      const pilarMesh = new THREE.Mesh(pilarGeo, pilarMat);
      pilarMesh.position.y = slot.height / 2;
      pilarMesh.receiveShadow = true;
      pilarGroup.add(pilarMesh);

      // Friso superior brilhante metálico
      const frisoGeo = new THREE.TorusGeometry(slot.radius, 0.05, 8, 32);
      const frisoMat = new THREE.MeshBasicMaterial({
        color: rankStr === '1'
          ? CORES.biaPaperGoldGlow
          : (rankStr === '2' ? 0xffffff : (rankStr === '3' ? 0xf59e0b : CORES.isapelCyan))
      });
      const frisoMesh = new THREE.Mesh(frisoGeo, frisoMat);
      frisoMesh.rotation.x = Math.PI / 2;
      frisoMesh.position.y = slot.height;
      pilarGroup.add(frisoMesh);

      // Placa frontal com o número (1 a 5) em relevo
      const placaH = Math.min(0.66, slot.height * 0.78);
      const placaGeo = new THREE.BoxGeometry(0.64, placaH, 0.06);
      const placaMat = new THREE.MeshStandardMaterial({
        color: 0x07111e,
        roughness: 0.3,
        metalness: 0.5
      });
      const placaMesh = new THREE.Mesh(placaGeo, placaMat);
      placaMesh.position.set(0, slot.height * 0.5, slot.radius * 1.02);
      pilarGroup.add(placaMesh);

      // Número tridimensional esculpido
      const numScale = slot.height < 0.9 ? 0.75 : 1.0;
      const cy = slot.height * 0.5;
      const cz = slot.radius * 1.05;

      if (rankStr === '1' || rankStr === '2' || rankStr === '3') {
        const numGeo = new THREE.BoxGeometry(0.11 * numScale, 0.38 * numScale, 0.08);
        const numMesh = new THREE.Mesh(numGeo, frisoMat);
        numMesh.position.set(0, cy, cz);
        pilarGroup.add(numMesh);

        if (rankStr === '2') {
          const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.28 * numScale, 0.09 * numScale, 0.08), frisoMat);
          h1.position.set(0, cy + 0.14 * numScale, cz);
          const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.28 * numScale, 0.09 * numScale, 0.08), frisoMat);
          h2.position.set(0, cy - 0.14 * numScale, cz);
          pilarGroup.add(h1, h2);
        } else if (rankStr === '3') {
          const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.24 * numScale, 0.08 * numScale, 0.08), frisoMat);
          b1.position.set(0.03, cy + 0.14 * numScale, cz);
          const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.24 * numScale, 0.08 * numScale, 0.08), frisoMat);
          b2.position.set(0.03, cy, cz);
          const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.24 * numScale, 0.08 * numScale, 0.08), frisoMat);
          b3.position.set(0.03, cy - 0.14 * numScale, cz);
          pilarGroup.add(b1, b2, b3);
        }
      } else if (rankStr === '4') {
        const vRight = new THREE.Mesh(new THREE.BoxGeometry(0.09 * numScale, 0.36 * numScale, 0.08), frisoMat);
        vRight.position.set(0.08 * numScale, cy, cz);
        const vLeft = new THREE.Mesh(new THREE.BoxGeometry(0.09 * numScale, 0.20 * numScale, 0.08), frisoMat);
        vLeft.position.set(-0.08 * numScale, cy + 0.08 * numScale, cz);
        const hMid = new THREE.Mesh(new THREE.BoxGeometry(0.25 * numScale, 0.08 * numScale, 0.08), frisoMat);
        hMid.position.set(0, cy, cz);
        pilarGroup.add(vRight, vLeft, hMid);
      } else if (rankStr === '5') {
        const hTop = new THREE.Mesh(new THREE.BoxGeometry(0.24 * numScale, 0.07 * numScale, 0.08), frisoMat);
        hTop.position.set(0, cy + 0.13 * numScale, cz);
        const hMid = new THREE.Mesh(new THREE.BoxGeometry(0.24 * numScale, 0.07 * numScale, 0.08), frisoMat);
        hMid.position.set(0, cy, cz);
        const hBot = new THREE.Mesh(new THREE.BoxGeometry(0.24 * numScale, 0.07 * numScale, 0.08), frisoMat);
        hBot.position.set(0, cy - 0.13 * numScale, cz);
        const vTopL = new THREE.Mesh(new THREE.BoxGeometry(0.08 * numScale, 0.14 * numScale, 0.08), frisoMat);
        vTopL.position.set(-0.08 * numScale, cy + 0.065 * numScale, cz);
        const vBotR = new THREE.Mesh(new THREE.BoxGeometry(0.08 * numScale, 0.14 * numScale, 0.08), frisoMat);
        vBotR.position.set(0.08 * numScale, cy - 0.065 * numScale, cz);
        pilarGroup.add(hTop, hMid, hBot, vTopL, vBotR);
      }

      podiumGroup.add(pilarGroup);
    });

    // 3. Troféu 3D Dourado Flutuante sobre o 1º Colocado
    criarTrofeu3D();

    // 4. Sistema de Partículas de Brilho Dourado (Sparkles)
    criarSparkles();

    // 5. Sistema de Confetes 3D para Fechamento de Vendas
    criarSistemaConfetes();
  }

  /**
   * Constrói o Troféu 3D Flutuante com Cálice, Alças Curvas e Estrela
   */
  function criarTrofeu3D() {
    trophyGroup = new THREE.Group();
    trophyGroup.name = 'trophy_3d';

    const goldMat = new THREE.MeshStandardMaterial({
      color: CORES.biaPaperGold,
      metalness: 0.92,
      roughness: 0.18,
      emissive: 0x78350f,
      emissiveIntensity: 0.25
    });

    // Base octagonal do troféu
    const baseGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.22, 8);
    const baseMesh = new THREE.Mesh(baseGeo, goldMat);
    trophyGroup.add(baseMesh);

    // Haste
    const hasteGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.26, 12);
    const hasteMesh = new THREE.Mesh(hasteGeo, goldMat);
    hasteMesh.position.y = 0.22;
    trophyGroup.add(hasteMesh);

    // Cálice principal
    const caliceGeo = new THREE.CylinderGeometry(0.42, 0.18, 0.55, 16);
    const caliceMesh = new THREE.Mesh(caliceGeo, goldMat);
    caliceMesh.position.y = 0.55;
    trophyGroup.add(caliceMesh);

    // Alça esquerda (Torus semi-circular)
    const alcaGeo = new THREE.TorusGeometry(0.22, 0.045, 8, 16, Math.PI * 1.2);
    const alcaEsq = new THREE.Mesh(alcaGeo, goldMat);
    alcaEsq.position.set(-0.35, 0.55, 0);
    alcaEsq.rotation.z = Math.PI * 0.4;

    const alcaDir = new THREE.Mesh(alcaGeo, goldMat);
    alcaDir.position.set(0.35, 0.55, 0);
    alcaDir.rotation.z = -Math.PI * 0.4;
    trophyGroup.add(alcaEsq, alcaDir);

    // Estrela de ouro Bia Paper no topo do troféu
    const starGeo = new THREE.OctahedronGeometry(0.16, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    const starMesh = new THREE.Mesh(starGeo, starMat);
    starMesh.position.y = 0.95;
    trophyGroup.add(starMesh);

    // Posição inicial: acima do 1º colocado (Degrau 1: y = 2.2 + altura do boneco ~2.2 + 0.8)
    trophyGroup.position.set(0, 5.4, 0);
    trophyGroup.scale.set(1.1, 1.1, 1.1);
    scene.add(trophyGroup);
  }

  /**
   * Partículas ambientais douradas cintilantes ao redor do troféu
   */
  function criarSparkles() {
    const particleCount = 60;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 4.5;
      positions[i * 3 + 1] = 2.5 + Math.random() * 4.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4.5;
      scales[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    // Canvas procedural de textura para partícula suave
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d');
    const grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 235, 150, 1)');
    grad.addColorStop(0.4, 'rgba(227, 165, 43, 0.7)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 32, 32);

    const pTex = new THREE.CanvasTexture(pCanvas);
    const pMat = new THREE.PointsMaterial({
      size: 0.24,
      map: pTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    sparkParticles = new THREE.Points(geometry, pMat);
    scene.add(sparkParticles);
  }

  /**
   * Sistema de Confetes 3D volumétricos com física de explosão e rotação
   */
  function criarSistemaConfetes() {
    const confettiCount = 180;
    const confettiMeshes = [];
    const confettiGroup = new THREE.Group();
    confettiGroup.name = 'confetti_system';

    const confettiColors = [
      CORES.isapelCyan,
      CORES.biaPaperGold,
      CORES.isapelBlue,
      CORES.isapelNavy,
      CORES.verdeVenda,
      0xffffff
    ];

    const cGeos = [
      new THREE.PlaneGeometry(0.12, 0.08),
      new THREE.CircleGeometry(0.06, 6)
    ];

    for (let i = 0; i < confettiCount; i++) {
      const geo = cGeos[i % cGeos.length];
      const mat = new THREE.MeshBasicMaterial({
        color: confettiColors[i % confettiColors.length],
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;

      mesh.userData = {
        velocity: new THREE.Vector3(),
        rotSpeed: new THREE.Vector3(),
        life: 0,
        maxLife: 1
      };

      confettiMeshes.push(mesh);
      confettiGroup.add(mesh);
    }

    scene.add(confettiGroup);
    confettiSystem = { group: confettiGroup, meshes: confettiMeshes, active: false };
  }

  /**
   * Dispara a explosão de confetes a partir da posição de um vendedor ou do topo
   */
  function dispararConfetes3D(origemX = 0, origemY = 3.5, origemZ = 0) {
    if (!confettiSystem) return;
    confettiSystem.active = true;
    playVictoryChime();

    confettiSystem.meshes.forEach(mesh => {
      mesh.visible = true;
      mesh.position.set(
        origemX + (Math.random() - 0.5) * 0.8,
        origemY + (Math.random() - 0.5) * 0.5,
        origemZ + (Math.random() - 0.5) * 0.8
      );

      // Velocidade de explosão em leque vertical
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 5.5;
      const upwardSpeed = 4.0 + Math.random() * 6.5;

      mesh.userData.velocity.set(
        Math.cos(angle) * speed,
        upwardSpeed,
        Math.sin(angle) * speed
      );

      mesh.userData.rotSpeed.set(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      );

      mesh.userData.life = 0;
      mesh.userData.maxLife = 2.8 + Math.random() * 1.5;
    });
  }

  // ==========================================================================
  // ILUMINAÇÃO DE ESTÚDIO CORPORATIVO
  // ==========================================================================
  function configurarIluminacao() {
    // 1. Luz Ambiente Suave Azulada
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.58);
    scene.add(ambientLight);

    // 2. Luz Principal Direcional (Key Light)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // 3. Luz de Preenchimento Azul Claro Isapel (Fill Light)
    const fillLight = new THREE.DirectionalLight(CORES.isapelCyan, 0.45);
    fillLight.position.set(-8, 6, 6);
    scene.add(fillLight);

    // 4. Luz de Recorte (Rim Light Traseira)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.55);
    rimLight.position.set(0, 8, -10);
    scene.add(rimLight);

    // 5. Spotlight Dourado Focado no 1º Colocado
    winnerSpotlight = new THREE.PointLight(CORES.biaPaperGoldGlow, 1.35, 14);
    winnerSpotlight.position.set(0, 6.2, 0.5);
    scene.add(winnerSpotlight);
  }

  // ==========================================================================
  // LÓGICA DE RANKING, ATUALIZAÇÃO E TRANSIÇÃO REATIVA
  // ==========================================================================

  /**
   * Ordena os vendedores pelo critério selecionado
   */
  function calcularRanking(vendedores, criterio = 'pontos') {
    return [...vendedores].sort((a, b) => {
      const valA = (a.metricas && a.metricas[criterio] !== undefined) ? a.metricas[criterio] : 0;
      const valB = (b.metricas && b.metricas[criterio] !== undefined) ? b.metricas[criterio] : 0;
      return valB - valA;
    });
  }

  /**
   * Atualiza a posição alvo de cada personagem com base no ranking
   */
  function sincronizarPosicoesPersonagens(rankingOrdenado) {
    rankingAtual = rankingOrdenado.map(v => v.id);

    rankingOrdenado.forEach((vendedor, index) => {
      const rank = index + 1; // 1, 2, 3 ou 4+
      let mesh = characterMeshes[vendedor.id];
      if (!mesh && scene && THREE) {
        const cfg = obterConfigAvatarSalva(vendedor.id);
        mesh = AvatarBuilder.construirAvatar(cfg, THREE);
        characterMeshes[vendedor.id] = mesh;
        scene.add(mesh);
      }
      if (!mesh) return;

      const slot = obterSlotPodio(rank);
      mesh.userData.rank = rank;
      mesh.userData.targetPos.set(slot.x, slot.y, slot.z);

      // Se for a primeira inicialização, posiciona imediatamente
      if (mesh.position.lengthSq() === 0) {
        mesh.position.set(slot.x, slot.y, slot.z);
      }
    });

    // Reposiciona o troféu suavemente sobre o 1º colocado
    if (trophyGroup && rankingOrdenado[0]) {
      const firstId = rankingOrdenado[0].id;
      const firstMesh = characterMeshes[firstId];
      if (firstMesh) {
        const slot1 = obterSlotPodio(1);
        trophyGroup.userData = trophyGroup.userData || {};
        trophyGroup.userData.targetX = slot1.x;
        trophyGroup.userData.targetY = slot1.y + 3.2;
        trophyGroup.userData.targetZ = slot1.z;
      }
    }

    // Atualiza overlays de HUD e placares
    renderizarHUDLeaderboard(rankingOrdenado);
  }

  /**
   * Normaliza métricas vindas do crm-backend.js ou de payload simplificado
   */
  function normalizarMetricas(raw) {
    if (!raw) return {};
    const norm = {
      pontos: 0,
      contatos: 0,
      novosLeads: 0,
      fechados: 0,
      emNegociacao: 0,
      taxaConversao: 0,
      valorTotal: 0
    };

    if (raw.pontos !== undefined) norm.pontos = Number(raw.pontos) || 0;
    else if (raw.pontuacaoGeral !== undefined) norm.pontos = Number(raw.pontuacaoGeral) || 0;

    if (raw.contatos !== undefined) norm.contatos = Number(raw.contatos) || 0;
    else if (raw.totalContatos !== undefined) norm.contatos = Number(raw.totalContatos) || 0;

    if (raw.novosLeads !== undefined) norm.novosLeads = Number(raw.novosLeads) || 0;
    else if (raw.totalCadastrados !== undefined) norm.novosLeads = Number(raw.totalCadastrados) || 0;

    if (raw.fechados !== undefined) norm.fechados = Number(raw.fechados) || 0;
    else if (raw.totalFechados !== undefined) norm.fechados = Number(raw.totalFechados) || 0;

    if (raw.emNegociacao !== undefined) norm.emNegociacao = Number(raw.emNegociacao) || 0;
    else if (raw.leadsPorEstagio && raw.leadsPorEstagio.negociacao !== undefined) norm.emNegociacao = Number(raw.leadsPorEstagio.negociacao) || 0;

    if (raw.taxaConversao !== undefined) norm.taxaConversao = Number(raw.taxaConversao) || 0;
    if (raw.valorTotal !== undefined) norm.valorTotal = Number(raw.valorTotal) || 0;
    else if (raw.volumeTotalFaturado !== undefined) norm.valorTotal = Number(raw.volumeTotalFaturado) || 0;

    return norm;
  }

  /**
   * Função principal exportada: atualizarArena3D(metricasVendedores, options)
   */
  function atualizar(metricasVendedores, options = {}) {
    if (metricasVendedores) {
      if (Array.isArray(metricasVendedores)) {
        metricasVendedores.forEach(novoItem => {
          let targetId = (novoItem.vendedorId || novoItem.id || novoItem.nome || '').toString().toLowerCase().trim();
          if (targetId === 'mateus') targetId = 'daniel';
          let existente = vendedoresData.find(v => v.id === targetId || v.nomeCurto.toLowerCase() === targetId || v.nome.toLowerCase() === targetId);
          if (!existente && targetId) {
            const padrao = DADOS_INICIAIS.find(d => d.id === targetId);
            existente = padrao ? JSON.parse(JSON.stringify(padrao)) : {
              id: targetId,
              nome: novoItem.nome || (targetId.charAt(0).toUpperCase() + targetId.slice(1)),
              nomeCurto: novoItem.nome || (targetId.charAt(0).toUpperCase() + targetId.slice(1)),
              cargo: 'Consultor B2B',
              corTema: '#0284C7',
              avatarIcone: '🧑🏽‍💼',
              metricas: normalizarMetricas(novoItem.metricas || novoItem)
            };
            vendedoresData.push(existente);
          }
          if (existente) {
            existente.metricas = normalizarMetricas(novoItem.metricas || novoItem);
          }
        });
      } else if (typeof metricasVendedores === 'object') {
        Object.keys(metricasVendedores).forEach(key => {
          let targetId = key.toLowerCase().trim();
          if (targetId === 'mateus') targetId = 'daniel';
          const existente = vendedoresData.find(v => v.id === targetId || v.nomeCurto.toLowerCase() === targetId || v.nome.toLowerCase() === targetId);
          if (existente) {
            existente.metricas = normalizarMetricas(metricasVendedores[key]);
          }
        });
      }
    }

    if (options.criterio) {
      criterioOrdenacao = options.criterio;
    }

    // Recalcula ranking
    const ordenados = calcularRanking(vendedoresData, criterioOrdenacao);
    sincronizarPosicoesPersonagens(ordenados);

    // Se houve celebração ou vitória especificada, solta confetes!
    if (options.celebrar || options.novoFechamento) {
      const topId = ordenados[0].id;
      const topMesh = characterMeshes[topId];
      const posX = topMesh ? topMesh.position.x : 0;
      dispararConfetes3D(posX, 4.0, 0);
    }
  }

  // ==========================================================================
  // INTERFACE DE USUÁRIO (HUD / OVERLAYS / PLACARES / CONTROLES)
  // ==========================================================================

  /**
   * Cria o contêiner de UI HTML por cima ou ao redor do canvas caso não existam
   */
  function injetarEstruturaHUD(containerParent) {
    if (typeof document === 'undefined' || !containerParent) return;
    if (document.getElementById('arena3d-hud-container')) return;

    const hudWrapper = document.createElement('div');
    hudWrapper.id = 'arena3d-hud-container';
    hudWrapper.className = 'arena3d-hud-overlay';

    hudWrapper.innerHTML = `
      <style>
        .arena3d-wrapper-relative {
          position: relative;
          width: 100%;
          min-height: 520px;
          border-radius: 20px;
          overflow: hidden;
          background: radial-gradient(circle at 50% 30%, #0d223a 0%, #06111e 85%);
          box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(56, 189, 248, 0.15);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          color: #f8fafc;
          user-select: none;
        }
        .arena3d-topbar {
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 10;
          pointer-events: none;
        }
        .arena3d-brand-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(6, 17, 30, 0.75);
          backdrop-filter: blur(12px);
          padding: 8px 16px;
          border-radius: 9999px;
          border: 1px solid rgba(56, 189, 248, 0.25);
          pointer-events: auto;
        }
        .arena3d-brand-title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #38bdf8;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .arena3d-brand-sub {
          font-size: 11px;
          color: #94a3b8;
          border-left: 1px solid rgba(148, 163, 184, 0.3);
          padding-left: 8px;
        }
        .arena3d-filters {
          display: flex;
          gap: 6px;
          background: rgba(6, 17, 30, 0.75);
          backdrop-filter: blur(12px);
          padding: 4px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          pointer-events: auto;
        }
        .arena3d-filter-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .arena3d-filter-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }
        .arena3d-filter-btn.active {
          background: linear-gradient(135deg, #0284c7 0%, #003360 100%);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
          border: 1px solid rgba(56, 189, 248, 0.3);
        }
        .arena3d-action-box {
          position: absolute;
          top: 56px;
          right: 16px;
          display: flex;
          gap: 8px;
          z-index: 10;
          pointer-events: auto;
        }
        .arena3d-btn-celebrate {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #e3a52b 0%, #b45309 100%);
          color: #ffffff;
          border: none;
          padding: 7px 14px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(227, 165, 43, 0.35);
          transition: all 0.2s ease;
        }
        .arena3d-btn-celebrate:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(227, 165, 43, 0.5);
        }
        .arena3d-btn-celebrate:active {
          transform: translateY(0);
        }
        .arena3d-btn-reset-cam {
          background: rgba(6, 17, 30, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #94a3b8;
          border-radius: 9999px;
          padding: 6px 12px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .arena3d-btn-reset-cam:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }
        .arena3d-hud-podium {
          position: absolute;
          bottom: 14px;
          left: 14px;
          right: 14px;
          display: flex;
          gap: 8px;
          z-index: 10;
          pointer-events: none;
          flex-wrap: nowrap;
        }
        .arena3d-card-vendedor {
          background: rgba(6, 17, 30, 0.85);
          backdrop-filter: blur(14px);
          border-radius: 12px;
          padding: 8px 11px;
          min-width: 118px;
          flex: 1 1 0;
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.25s ease;
          pointer-events: auto;
          cursor: pointer;
        }
        .arena3d-card-vendedor:hover {
          transform: translateY(-4px);
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }
        .arena3d-card-vendedor.rank-1 {
          border-color: rgba(227, 165, 43, 0.65);
          background: linear-gradient(180deg, rgba(227, 165, 43, 0.14) 0%, rgba(6, 17, 30, 0.92) 100%);
          box-shadow: 0 4px 18px rgba(227, 165, 43, 0.22);
        }
        .arena3d-card-vendedor.rank-2 {
          border-color: rgba(203, 213, 225, 0.4);
        }
        .arena3d-card-vendedor.rank-3 {
          border-color: rgba(205, 127, 50, 0.4);
        }
        .arena3d-card-vendedor.rank-4,
        .arena3d-card-vendedor.rank-5 {
          border-color: rgba(56, 189, 248, 0.25);
        }
        .arena3d-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
          gap: 4px;
        }
        .arena3d-card-rank-tag {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 5px;
          border-radius: 5px;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .rank-1 .arena3d-card-rank-tag { background: #e3a52b; color: #000; }
        .rank-2 .arena3d-card-rank-tag { background: #94a3b8; color: #000; }
        .rank-3 .arena3d-card-rank-tag { background: #b45309; color: #fff; }
        .rank-4 .arena3d-card-rank-tag,
        .rank-5 .arena3d-card-rank-tag { background: rgba(2, 132, 199, 0.35); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
        .arena3d-card-name {
          font-size: 12px;
          font-weight: 700;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .arena3d-card-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3px 6px;
          margin-top: 4px;
          font-size: 10.5px;
          color: #94a3b8;
        }
        .arena3d-card-metrics strong {
          color: #f1f5f9;
        }
        .arena3d-xp-bar-bg {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          margin-top: 6px;
          overflow: hidden;
        }
        .arena3d-xp-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .rank-1 .arena3d-xp-bar-fill { background: linear-gradient(90deg, #e3a52b, #fef08a); }
        .rank-2 .arena3d-xp-bar-fill { background: linear-gradient(90deg, #0284c7, #38bdf8); }
        .rank-3 .arena3d-xp-bar-fill { background: linear-gradient(90deg, #003360, #0284c7); }
        .rank-4 .arena3d-xp-bar-fill,
        .rank-5 .arena3d-xp-bar-fill { background: linear-gradient(90deg, #0f172a, #38bdf8); }
        .arena3d-hint {
          position: absolute;
          top: 62px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 0.05em;
          pointer-events: none;
          background: rgba(6, 17, 30, 0.6);
          padding: 3px 12px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(8px);
          z-index: 5;
        }
        @media (max-width: 900px) {
          .arena3d-hud-podium {
            display: none;
          }
          .arena3d-topbar {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }
        }
      </style>

      <div class="arena3d-topbar">
        <div class="arena3d-brand-badge">
          <div class="arena3d-brand-title">
            <span>⚔️</span> ARENA DE VENDEDORES
          </div>
        </div>

        <div class="arena3d-filters">
          <button class="arena3d-filter-btn active" data-criterio="pontos">XP Geral</button>
          <button class="arena3d-filter-btn" data-criterio="contatos">Contatos</button>
          <button class="arena3d-filter-btn" data-criterio="novosLeads">Novos Leads</button>
          <button class="arena3d-filter-btn" data-criterio="fechados">Fechamentos</button>
        </div>
      </div>

      <div id="arena3d-cards-container" class="arena3d-hud-podium">
        <!-- Injetado dinamicamente por renderizarHUDLeaderboard -->
      </div>

      <div class="arena3d-action-box">
        <button id="arena3d-btn-confetti" class="arena3d-btn-celebrate">
          <span>🎉</span> Celebrar Fechamento
        </button>
        <button id="arena3d-btn-reset-camera" class="arena3d-btn-reset-cam" title="Resetar Câmera">
          ↺ Câmera
        </button>
      </div>

      <div class="arena3d-hint">
        Arraste com o mouse para girar em 360º • Clique em um consultor para comemorar
      </div>
    `;

    containerParent.appendChild(hudWrapper);

    // Eventos de clique nos filtros
    const filterBtns = hudWrapper.querySelectorAll('.arena3d-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const criterio = btn.getAttribute('data-criterio');
        criterioOrdenacao = criterio;
        playPopChime();
        const ordenados = calcularRanking(vendedoresData, criterio);
        sincronizarPosicoesPersonagens(ordenados);
      });
    });

    // Botão de confetes
    const btnConfetti = hudWrapper.querySelector('#arena3d-btn-confetti');
    if (btnConfetti) {
      btnConfetti.addEventListener('click', () => {
        const topId = rankingAtual[0];
        const topMesh = characterMeshes[topId];
        const px = topMesh ? topMesh.position.x : 0;
        dispararConfetes3D(px, 3.8, 0);
      });
    }

    // Botão de reset de câmera
    const btnResetCam = hudWrapper.querySelector('#arena3d-btn-reset-camera');
    if (btnResetCam) {
      btnResetCam.addEventListener('click', () => {
        cameraControl.targetTheta = 0;
        cameraControl.targetPhi = 0.26;
        cameraControl.targetRadius = 14.5;
        playPopChime();
      });
    }
  }

  /**
   * Renderiza os cards do pódio no HUD inferior
   */
  function renderizarHUDLeaderboard(rankingOrdenado) {
    if (typeof document === 'undefined') return;
    const cardsContainer = document.getElementById('arena3d-cards-container');
    if (!cardsContainer) return;

    const maxPontos = Math.max(...vendedoresData.map(v => v.metricas.pontos || 100));

    cardsContainer.innerHTML = rankingOrdenado.map((v, idx) => {
      const rank = idx + 1;
      const pctXP = Math.min(100, Math.round(((v.metricas.pontos || 0) / maxPontos) * 100));
      const medalha = `${rank}º Lugar`;

      return `
        <div class="arena3d-card-vendedor rank-${rank}" data-id="${v.id}">
          <div class="arena3d-card-header">
            <span class="arena3d-card-name">${v.avatarIcone} • ${v.nomeCurto}</span>
            <span class="arena3d-card-rank-tag">${medalha}</span>
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #38bdf8; margin-bottom: 2px;">
            ${(v.metricas.pontos || 0).toLocaleString('pt-BR')} XP
          </div>
          <div class="arena3d-card-metrics">
            <div>Contatos: <strong>${v.metricas.contatos || 0}</strong></div>
            <div>Leads: <strong>${v.metricas.novosLeads || 0}</strong></div>
            <div>Negoc.: <strong>${v.metricas.emNegociacao || 0}</strong></div>
            <div>Fechados: <strong>${v.metricas.fechados || 0}</strong></div>
          </div>
          <div class="arena3d-xp-bar-bg">
            <div class="arena3d-xp-bar-fill" style="width: ${pctXP}%;"></div>
          </div>
        </div>
      `;
    }).join('');

    // Adiciona evento de clique aos cards para animar o personagem
    const cards = cardsContainer.querySelectorAll('.arena3d-card-vendedor');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        focarAnimacaoPersonagem(id);
      });
    });
  }

  /**
   * Dispara salto de comemoração individual no personagem
   */
  function focarAnimacaoPersonagem(id) {
    const mesh = characterMeshes[id];
    if (!mesh) return;

    playPopChime();
    mesh.userData.jumpAnim = 1.0; // Gatilho de pulo suave
    if (mesh.userData.rank === 1) {
      dispararConfetes3D(mesh.position.x, 3.8, mesh.position.z);
    }
  }

  // ==========================================================================
  // LOOP DE ANIMAÇÃO 3D E FÍSICA PROCEDURAL (FRAME-RATE INDEPENDENT)
  // ==========================================================================
  let lastTime = performance.now();

  function animateLoop(now) {
    animFrameId = requestAnimationFrame(animateLoop);

    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    const time = now * 0.001;

    // Fatores de amortecimento exponenciais independentes da taxa de atualização (60Hz vs 120Hz/144Hz)
    const dampCamera = 1.0 - Math.exp(-6.5 * delta);
    const lerpCharXZ = 1.0 - Math.exp(-5.0 * delta);
    const lerpCharY = 1.0 - Math.exp(-7.5 * delta);

    // 1. Interpolação suave dos Controles de Câmera (Inércia / Damping independente de frame-rate)
    cameraControl.theta += (cameraControl.targetTheta - cameraControl.theta) * dampCamera;
    cameraControl.phi += (cameraControl.targetPhi - cameraControl.phi) * dampCamera;
    cameraControl.radius += (cameraControl.targetRadius - cameraControl.radius) * dampCamera;

    // Converte coordenadas esféricas em cartesianas
    const cpX = cameraControl.radius * Math.sin(cameraControl.theta) * Math.cos(cameraControl.phi);
    const cpY = cameraControl.radius * Math.sin(cameraControl.phi) + 2.0;
    const cpZ = cameraControl.radius * Math.cos(cameraControl.theta) * Math.cos(cameraControl.phi);
    camera.position.set(cpX, cpY, cpZ);
    camera.lookAt(0, 2.4, 0);

    // 2. Animação e Interpolação de Posição dos 3 Personagens
    Object.keys(characterMeshes).forEach(id => {
      const char = characterMeshes[id];
      const ud = char.userData;

      // Movimento suave até o degrau correspondente (Lerp escalado por delta-time)
      if (ud.targetPos) {
        char.position.x += (ud.targetPos.x - char.position.x) * lerpCharXZ;
        char.position.z += (ud.targetPos.z - char.position.z) * lerpCharXZ;

        // Efeito de pulo parabólico caso esteja trocando de degrau
        const distHoriz = Math.hypot(ud.targetPos.x - char.position.x, ud.targetPos.z - char.position.z);
        const arcY = distHoriz > 0.1 ? Math.sin(distHoriz * Math.PI) * 0.6 : 0;
        char.position.y += ((ud.targetPos.y + arcY) - char.position.y) * lerpCharY;
      }

      // Olhar sempre suavemente para o centro da arena
      char.rotation.y = -char.position.x * 0.12;

      // Pulo disparado por clique do usuário
      if (ud.jumpAnim && ud.jumpAnim > 0) {
        ud.jumpAnim -= delta * 3.5;
        const jumpY = Math.sin(ud.jumpAnim * Math.PI) * 0.5;
        char.position.y += Math.max(0, jumpY);
      }

      // Animações anatômicas por Ranking
      const isWinner = ud.rank === 1;
      const t = time * 2.8 + ud.animTimeOffset;

      if (isWinner) {
        // --- 1º LUGAR: ANIMAÇÃO DE VITÓRIA / COMEMORAÇÃO ---
        // Respiração e pulso enérgico
        ud.bodyGroup.position.y = Math.sin(t * 2) * 0.05;

        // Braço direito erguido em vitória (fist pump contínuo)
        if (ud.armRight) {
          ud.armRight.rotation.z = -2.5 + Math.sin(t * 3) * 0.25;
          ud.armRight.rotation.x = Math.sin(t * 2) * 0.2;
        }
        // Braço esquerdo na cintura ou acenando com entusiasmo
        if (ud.armLeft) {
          ud.armLeft.rotation.z = 0.5 + Math.sin(t * 1.5) * 0.15;
          ud.armLeft.rotation.x = 0.2;
        }
        // Cabeça inclinada orgulhosa
        if (ud.headGroup) {
          ud.headGroup.rotation.y = Math.sin(t * 1.2) * 0.18;
          ud.headGroup.rotation.z = Math.sin(t * 2) * 0.06;
        }
      } else {
        // --- 2º E 3º LUGAR: APLAUSOS E INCENTIVO À EQUIPE ---
        // Respiração suave de postura corporativa
        ud.bodyGroup.position.y = Math.sin(t) * 0.025;

        // Braços batendo palmas ritmadas
        const clapCycle = Math.sin(t * 3.2);
        if (ud.armLeft && ud.armRight) {
          ud.armLeft.rotation.z = 0.45;
          ud.armLeft.rotation.x = -0.55 + clapCycle * 0.18;
          ud.armLeft.rotation.y = 0.45 + clapCycle * 0.2;

          ud.armRight.rotation.z = -0.45;
          ud.armRight.rotation.x = -0.55 + clapCycle * 0.18;
          ud.armRight.rotation.y = -0.45 - clapCycle * 0.2;
        }

        // Cabeça virando sutilmente para aplaudir o pódio central
        if (ud.headGroup) {
          const lookDir = ud.rank === 2 ? 0.35 : -0.35;
          ud.headGroup.rotation.y = lookDir + Math.sin(t * 0.8) * 0.08;
          ud.headGroup.rotation.x = 0.05;
        }
      }
    });

    // 3. Animação do Troféu 3D Flutuante
    if (trophyGroup) {
      // Rotação contínua de 360º
      trophyGroup.rotation.y += delta * 1.2;
      // Flutuação vertical (bobbing)
      const baseFloatY = (trophyGroup.userData && trophyGroup.userData.targetY) ? trophyGroup.userData.targetY : 5.4;
      trophyGroup.position.y = baseFloatY + Math.sin(time * 2.2) * 0.12;

      // Interpolação no X e Z se o 1º lugar mudou (escalado por delta-time)
      if (trophyGroup.userData && trophyGroup.userData.targetX !== undefined) {
        trophyGroup.position.x += (trophyGroup.userData.targetX - trophyGroup.position.x) * lerpCharXZ;
        trophyGroup.position.z += (trophyGroup.userData.targetZ - trophyGroup.position.z) * lerpCharXZ;
      }
    }

    // 4. Animação de Sparkles Dourados
    if (sparkParticles) {
      const positions = sparkParticles.geometry.attributes.position.array;
      const count = positions.length / 3;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += delta * 0.4;
        if (positions[i * 3 + 1] > 6.5) {
          positions[i * 3 + 1] = 2.5;
        }
      }
      sparkParticles.geometry.attributes.position.needsUpdate = true;
      sparkParticles.rotation.y = time * 0.1;
    }

    // 5. Física dos Confetes 3D
    if (confettiSystem && confettiSystem.active) {
      let anyAlive = false;
      const gravity = 7.5;

      confettiSystem.meshes.forEach(mesh => {
        if (!mesh.visible) return;
        mesh.userData.life += delta;
        if (mesh.userData.life < mesh.userData.maxLife) {
          anyAlive = true;
          // Atualiza posições com velocidade e gravidade
          mesh.userData.velocity.y -= gravity * delta;
          mesh.userData.velocity.x *= 0.985;
          mesh.userData.velocity.z *= 0.985;

          mesh.position.addScaledVector(mesh.userData.velocity, delta);

          // Rotação caótica
          mesh.rotation.x += mesh.userData.rotSpeed.x * delta;
          mesh.rotation.y += mesh.userData.rotSpeed.y * delta;
          mesh.rotation.z += mesh.userData.rotSpeed.z * delta;

          // Parada suave no chão da arena
          if (mesh.position.y < 0.1) {
            mesh.position.y = 0.1;
            mesh.userData.velocity.set(0, 0, 0);
          }
        } else {
          mesh.visible = false;
        }
      });

      if (!anyAlive) {
        confettiSystem.active = false;
      }
    }

    // 6. Efeito suave do Spotlight no Vencedor
    if (winnerSpotlight && trophyGroup) {
      winnerSpotlight.position.x = trophyGroup.position.x;
      winnerSpotlight.position.z = trophyGroup.position.z + 0.4;
    }

    renderer.render(scene, camera);
  }

  // ==========================================================================
  // EVENTOS DE MOUSE, TOQUE E ORBIT CONTROLS PERSONALIZADO
  // ==========================================================================
  function configurarInteracoes(domTarget) {
    raycaster = new THREE.Raycaster();
    mousePointer = new THREE.Vector2();

    domTarget.addEventListener('mousedown', e => {
      cameraControl.isDragging = true;
      cameraControl.prevMouseX = e.clientX;
      cameraControl.prevMouseY = e.clientY;
    });

    window.addEventListener('mousemove', e => {
      // Cálculo para Raycasting
      const rect = domTarget.getBoundingClientRect();
      mousePointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mousePointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!cameraControl.isDragging) {
        checarHoverPersonagens();
        return;
      }

      const dx = e.clientX - cameraControl.prevMouseX;
      const dy = e.clientY - cameraControl.prevMouseY;
      cameraControl.prevMouseX = e.clientX;
      cameraControl.prevMouseY = e.clientY;

      cameraControl.targetTheta -= dx * 0.007;
      cameraControl.targetPhi = Math.max(0.08, Math.min(Math.PI * 0.45, cameraControl.targetPhi + dy * 0.007));
    });

    window.addEventListener('mouseup', () => {
      cameraControl.isDragging = false;
    });

    // Zoom com scroll wheel
    domTarget.addEventListener('wheel', e => {
      e.preventDefault();
      cameraControl.targetRadius = Math.max(7.5, Math.min(18.0, cameraControl.targetRadius + e.deltaY * 0.012));
    }, { passive: false });

    // Clique direto no personagem 3D
    domTarget.addEventListener('click', () => {
      if (!raycaster || !mousePointer) return;
      raycaster.setFromCamera(mousePointer, camera);
      const meshesParaTestar = Object.values(characterMeshes);
      const intersects = raycaster.intersectObjects(meshesParaTestar, true);

      if (intersects.length > 0) {
        let rootGroup = intersects[0].object;
        while (rootGroup.parent && !rootGroup.userData.id) {
          rootGroup = rootGroup.parent;
        }
        if (rootGroup.userData && rootGroup.userData.id) {
          focarAnimacaoPersonagem(rootGroup.userData.id);
        }
      }
    });

    // Toque em dispositivos mobile
    let touchStartX = 0;
    let touchStartY = 0;
    domTarget.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        cameraControl.isDragging = true;
      }
    }, { passive: true });

    domTarget.addEventListener('touchmove', e => {
      if (!cameraControl.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;

      cameraControl.targetTheta -= dx * 0.009;
      cameraControl.targetPhi = Math.max(0.08, Math.min(Math.PI * 0.45, cameraControl.targetPhi + dy * 0.009));
    }, { passive: true });

    domTarget.addEventListener('touchend', () => {
      cameraControl.isDragging = false;
    });
  }

  function checarHoverPersonagens() {
    if (!raycaster || !mousePointer || !camera) return;
    raycaster.setFromCamera(mousePointer, camera);
    const meshesParaTestar = Object.values(characterMeshes);
    const intersects = raycaster.intersectObjects(meshesParaTestar, true);

    if (intersects.length > 0) {
      let rootGroup = intersects[0].object;
      while (rootGroup.parent && !rootGroup.userData.id) {
        rootGroup = rootGroup.parent;
      }
      if (rootGroup.userData && rootGroup.userData.id) {
        canvas.style.cursor = 'pointer';
        hoveredCharacter = rootGroup.userData.id;
        return;
      }
    }
    canvas.style.cursor = cameraControl.isDragging ? 'grabbing' : 'grab';
    hoveredCharacter = null;
  }

  // ==========================================================================
  // REDIMENSIONAMENTO RESPONSIVO
  // ==========================================================================
  function onWindowResize() {
    if (!renderer || !camera || !canvas) return;
    const parent = canvas.parentElement;
    const width = parent ? parent.clientWidth : window.innerWidth;
    const height = parent ? Math.max(480, parent.clientHeight || 560) : 560;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  // ==========================================================================
  // INICIALIZAÇÃO DA ARENA 3D
  // ==========================================================================

  /**
   * Inicializa Three.js, cena, personagens e controles
   */
  function init(options = {}) {
    if (isInitialized) {
      if (options.metricas) {
        atualizar(options.metricas);
      }
      return;
    }

    THREE = window.THREE;
    if (!THREE) {
      console.warn('[Arena3D] Three.js não encontrado globalmente. Tentando carregar...');
      carregarThreeScript(() => init(options));
      return;
    }

    // 1. Localiza ou cria o elemento <canvas id="arena3d-canvas">
    canvas = document.getElementById(options.canvasId || 'arena3d-canvas');
    let parentElem = null;

    if (!canvas) {
      const containerId = options.containerId || 'arena3d-container';
      parentElem = document.getElementById(containerId);
      if (!parentElem) {
        parentElem = document.createElement('div');
        parentElem.id = containerId;
        parentElem.className = 'arena3d-wrapper-relative';
        document.body.appendChild(parentElem);
      } else {
        parentElem.classList.add('arena3d-wrapper-relative');
      }

      canvas = document.createElement('canvas');
      canvas.id = 'arena3d-canvas';
      parentElem.appendChild(canvas);
    } else {
      parentElem = canvas.parentElement;
      if (parentElem) {
        parentElem.classList.add('arena3d-wrapper-relative');
      }
    }

    // 2. Injeta estrutura de HUD moderno
    injetarEstruturaHUD(parentElem);

    // 3. Testa suporte WebGL com fallback elegante
    try {
      const glTest = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!glTest) throw new Error('WebGL não suportado no navegador');
    } catch (err) {
      renderizarFallback2D(parentElem);
      return;
    }

    // 4. Configuração do Renderer Three.js
    const width = parentElem.clientWidth || 800;
    const height = Math.max(480, parentElem.clientHeight || 560);

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (renderer.toneMapping !== undefined) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
    }

    // 5. Configuração da Cena e Câmera
    scene = new THREE.Scene();
    scene.background = null; // Fundo transparente com CSS gradiente atrás

    camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 5.2, 14.5);

    // 6. Iluminação e Cenário
    configurarIluminacao();
    criarCenario3D();

    // 7. Modelagem Tridimensional dos 5 Personagens (Maciel, Fernanda, Caio, Albert e Daniel)
    const materiais = criarMateriaisPersonagens();
    const meshFernanda = criarModeloFernanda(materiais);
    const meshCaio = criarModeloCaio(materiais);
    const meshMaciel = criarModeloMaciel(materiais);
    const meshAlbert = AvatarBuilder.construirAvatar(obterConfigAvatarSalva('albert'), THREE);
    const meshDaniel = AvatarBuilder.construirAvatar(obterConfigAvatarSalva('daniel'), THREE);

    characterMeshes.fernanda = meshFernanda;
    characterMeshes.caio = meshCaio;
    characterMeshes.maciel = meshMaciel;
    characterMeshes.albert = meshAlbert;
    characterMeshes.daniel = meshDaniel;

    scene.add(meshFernanda, meshCaio, meshMaciel, meshAlbert, meshDaniel);

    // 8. Eventos de Janela e Interação
    window.addEventListener('resize', onWindowResize);
    configurarInteracoes(canvas);

    // 9. Aplica dados iniciais e ordena
    if (options.dadosVendedores) {
      vendedoresData = options.dadosVendedores;
    }
    const ordenados = calcularRanking(vendedoresData, criterioOrdenacao);
    sincronizarPosicoesPersonagens(ordenados);

    // 10. Inicia Loop de Renderização 60 FPS
    isInitialized = true;
    lastTime = performance.now();
    animateLoop(lastTime);

    console.log('[Arena3D] Inicializada com sucesso! Fernanda, Caio e Maciel no pódio Isapel.');
  }

  /**
   * Carregamento assíncrono resiliente do Three.js caso ainda não esteja no DOM
   */
  function carregarThreeScript(callback) {
    const script = document.createElement('script');
    script.src = 'js/three.min.js';
    script.onload = () => {
      THREE = window.THREE;
      if (callback) callback();
    };
    script.onerror = () => {
      // Fallback para CDN oficial estável
      const cdnScript = document.createElement('script');
      cdnScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      cdnScript.onload = () => {
        THREE = window.THREE;
        if (callback) callback();
      };
      cdnScript.onerror = () => {
        console.error('[Arena3D] Falha ao carregar Three.js local e via CDN.');
      };
      document.head.appendChild(cdnScript);
    };
    document.head.appendChild(script);
  }

  /**
   * Fallback visual 2D elegante caso o dispositivo não suporte WebGL
   */
  function renderizarFallback2D(parentElem) {
    if (!parentElem) return;
    parentElem.innerHTML = `
      <div style="padding: 30px; text-align: center; color: #fff;">
        <h3 style="color: #38bdf8; margin-bottom: 15px;">🏆 Arena Comercial Isapel</h3>
        <p style="color: #94a3b8; font-size: 13px;">Modo de visualização acelerada ativado.</p>
        <div style="display: flex; justify-content: center; gap: 20px; margin-top: 30px;">
          <div style="background: rgba(227,165,43,0.15); border: 2px solid #e3a52b; padding: 20px; border-radius: 12px; min-width: 150px;">
            <div style="font-size: 32px;">👨🏻‍💼</div>
            <strong style="color: #e3a52b;">1º Maciel</strong>
            <p style="font-size: 12px; color: #cbd5e1; margin-top: 6px;">2.280 XP</p>
          </div>
          <div style="background: rgba(56,189,248,0.1); border: 1px solid #38bdf8; padding: 20px; border-radius: 12px; min-width: 150px;">
            <div style="font-size: 32px;">👩🏼‍💼</div>
            <strong style="color: #38bdf8;">2º Fernanda</strong>
            <p style="font-size: 12px; color: #cbd5e1; margin-top: 6px;">1.950 XP</p>
          </div>
          <div style="background: rgba(2,132,199,0.1); border: 1px solid #0284c7; padding: 20px; border-radius: 12px; min-width: 150px;">
            <div style="font-size: 32px;">🧑🏽‍💼</div>
            <strong style="color: #0284c7;">3º Caio</strong>
            <p style="font-size: 12px; color: #cbd5e1; margin-top: 6px;">1.590 XP</p>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // AUTO-INICIALIZAÇÃO QUANDO O DOM ESTIVER PRONTO
  // ==========================================================================
  if (typeof document !== 'undefined') {
    const autoInit = () => {
      const autoCanvas = document.getElementById('arena3d-canvas');
      const autoContainer = document.getElementById('arena3d-container') || document.getElementById('arena-container');
      if (autoCanvas || autoContainer) {
        init();
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoInit);
    } else {
      setTimeout(autoInit, 50);
    }
  }

  // ==========================================================================
  // API PÚBLICA EXPORTADA
  // ==========================================================================
  return {
    init: init,
    atualizar: atualizar,
    atualizarAparencia: atualizarAparencia,
    AvatarBuilder: AvatarBuilder,
    AvatarPreviewEngine: AvatarPreviewEngine,
    dispararConfetes: function (posX, posY, posZ) {
      dispararConfetes3D(posX || 0, posY || 3.8, posZ || 0);
    },
    celebrarVenda: function (vendedorId, valor) {
      const id = vendedorId ? vendedorId.toLowerCase() : rankingAtual[0];
      const mesh = characterMeshes[id];
      const px = mesh ? mesh.position.x : 0;
      dispararConfetes3D(px, 3.8, 0);
      focarAnimacaoPersonagem(id);
    },
    obterRankingAtual: function () {
      return [...rankingAtual];
    },
    obterDadosVendedores: function () {
      return JSON.parse(JSON.stringify(vendedoresData));
    },
    definirCriterio: function (criterio) {
      criterioOrdenacao = criterio;
      const ordenados = calcularRanking(vendedoresData, criterio);
      sincronizarPosicoesPersonagens(ordenados);
    },
    resetarCamera: function () {
      cameraControl.targetTheta = 0;
      cameraControl.targetPhi = 0.26;
      cameraControl.targetRadius = 14.5;
    }
  };
});
