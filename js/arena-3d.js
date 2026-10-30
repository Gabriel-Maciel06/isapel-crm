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
  // DADOS INICIAIS DA EQUIPE COMERCIAL ISAPEL
  // ==========================================================================
  const DADOS_INICIAIS = [
    {
      id: 'maciel',
      nome: 'Gabriel Maciel',
      nomeCurto: 'Gabriel Maciel',
      cargo: 'Comercial',
      corPrimaria: '#003360',
      corAcento: '#E3A52B',
      avatarIcone: 'GM',
      descricao: 'Gabriel Maciel',
      metricas: {
        contatos: 54,
        novosLeads: 24,
        emNegociacao: 18,
        fechados: 16,
        taxaConversao: 37.5,
        valorTotal: 198400,
        pontos: 2280
      }
    },
    {
      id: 'fernanda',
      nome: 'Fernanda',
      nomeCurto: 'Fernanda',
      cargo: 'Comercial',
      corPrimaria: '#38BDF8',
      corAcento: '#003360',
      avatarIcone: 'FE',
      descricao: 'Fernanda',
      metricas: {
        contatos: 49,
        novosLeads: 20,
        emNegociacao: 15,
        fechados: 13,
        taxaConversao: 33.3,
        valorTotal: 162500,
        pontos: 1950
      }
    },
    {
      id: 'caio',
      nome: 'Caio',
      nomeCurto: 'Caio',
      cargo: 'Comercial',
      corPrimaria: '#0284C7',
      corAcento: '#38BDF8',
      avatarIcone: 'CA',
      descricao: 'Caio',
      metricas: {
        contatos: 43,
        novosLeads: 17,
        emNegociacao: 12,
        fechados: 10,
        taxaConversao: 29.4,
        valorTotal: 124000,
        pontos: 1590
      }
    }
  ];

  // Posições geométricas dos degraus do pódio
  const PODIUM_SLOTS = {
    1: { x: 0, y: 2.2, z: 0, height: 2.2, radius: 1.55, cor: CORES.biaPaperGold, label: '1º LUGAR' },
    2: { x: -3.1, y: 1.45, z: 0.4, height: 1.45, radius: 1.4, cor: CORES.prata, label: '2º LUGAR' },
    3: { x: 3.1, y: 0.85, z: 0.4, height: 0.85, radius: 1.4, cor: CORES.bronze, label: '3º LUGAR' }
  };

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
    targetPhi: 0.28,
    theta: 0,
    phi: 0.28,
    radius: 12.8,
    targetRadius: 12.8
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

  /**
   * Constrói o modelo 3D estilizado de FERNANDA
   * Menina loira de 21 anos, cabelos loiros compridos estilizados, camisa pólo Isapel Azul Claro
   */
  function criarModeloFernanda(materiais) {
    const root = new THREE.Group();
    root.name = 'char_fernanda';

    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'body_pivot';
    root.add(bodyGroup);

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
    const root = new THREE.Group();
    root.name = 'char_caio';

    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'body_pivot';
    root.add(bodyGroup);

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
    const root = new THREE.Group();
    root.name = 'char_maciel';

    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'body_pivot';
    root.add(bodyGroup);

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
    const arenaPisoGeo = new THREE.CylinderGeometry(6.8, 7.2, 0.35, 48);
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
    const ringGeo = new THREE.TorusGeometry(6.6, 0.08, 12, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: CORES.isapelCyan });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.01;
    podiumGroup.add(ringMesh);

    // Anel interno Dourado Bia Paper (#E3A52B)
    const ringGoldGeo = new THREE.TorusGeometry(5.2, 0.06, 12, 64);
    const ringGoldMat = new THREE.MeshBasicMaterial({ color: CORES.biaPaperGoldGlow });
    const ringGoldMesh = new THREE.Mesh(ringGoldGeo, ringGoldMat);
    ringGoldMesh.rotation.x = Math.PI / 2;
    ringGoldMesh.position.y = 0.015;
    podiumGroup.add(ringGoldMesh);

    // 2. Os 3 Pilares do Pódio (1º Ouro, 2º Prata, 3º Bronze)
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
      } else {
        pilarMat = new THREE.MeshStandardMaterial({
          color: CORES.bronze,
          roughness: 0.32,
          metalness: 0.78
        });
      }

      const pilarMesh = new THREE.Mesh(pilarGeo, pilarMat);
      pilarMesh.position.y = slot.height / 2;
      pilarMesh.receiveShadow = true;
      pilarGroup.add(pilarMesh);

      // Friso superior brilhante metálico
      const frisoGeo = new THREE.TorusGeometry(slot.radius, 0.05, 8, 32);
      const frisoMat = new THREE.MeshBasicMaterial({
        color: rankStr === '1' ? CORES.biaPaperGoldGlow : (rankStr === '2' ? 0xffffff : 0xf59e0b)
      });
      const frisoMesh = new THREE.Mesh(frisoGeo, frisoMat);
      frisoMesh.rotation.x = Math.PI / 2;
      frisoMesh.position.y = slot.height;
      pilarGroup.add(frisoMesh);

      // Placa frontal com o número (1, 2 ou 3) em relevo
      const placaGeo = new THREE.BoxGeometry(0.7, 0.7, 0.06);
      const placaMat = new THREE.MeshStandardMaterial({
        color: 0x07111e,
        roughness: 0.3,
        metalness: 0.5
      });
      const placaMesh = new THREE.Mesh(placaGeo, placaMat);
      placaMesh.position.set(0, slot.height * 0.5, slot.radius * 1.02);
      pilarGroup.add(placaMesh);

      // Número tridimensional esculpido
      const numGeo = new THREE.BoxGeometry(0.12, 0.42, 0.08);
      const numMesh = new THREE.Mesh(numGeo, frisoMat);
      numMesh.position.set(0, slot.height * 0.5, slot.radius * 1.05);
      pilarGroup.add(numMesh);

      if (rankStr === '2') {
        const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.08), frisoMat);
        h1.position.set(0, slot.height * 0.5 + 0.16, slot.radius * 1.05);
        const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.08), frisoMat);
        h2.position.set(0, slot.height * 0.5 - 0.16, slot.radius * 1.05);
        pilarGroup.add(h1, h2);
      } else if (rankStr === '3') {
        const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.09, 0.08), frisoMat);
        b1.position.set(0.04, slot.height * 0.5 + 0.16, slot.radius * 1.05);
        const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.09, 0.08), frisoMat);
        b2.position.set(0.04, slot.height * 0.5, slot.radius * 1.05);
        const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.09, 0.08), frisoMat);
        b3.position.set(0.04, slot.height * 0.5 - 0.16, slot.radius * 1.05);
        pilarGroup.add(b1, b2, b3);
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
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.65);
    scene.add(ambientLight);

    // 2. Luz Principal Direcional (Key Light)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // 3. Luz de Preenchimento Azul Claro Isapel (Fill Light)
    const fillLight = new THREE.DirectionalLight(CORES.isapelCyan, 0.55);
    fillLight.position.set(-8, 6, 6);
    scene.add(fillLight);

    // 4. Luz de Recorte (Rim Light Traseira)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.65);
    rimLight.position.set(0, 8, -10);
    scene.add(rimLight);

    // 5. Spotlight Dourado Focado no 1º Colocado
    winnerSpotlight = new THREE.PointLight(CORES.biaPaperGoldGlow, 1.8, 14);
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
      const rank = index + 1; // 1, 2 ou 3
      const mesh = characterMeshes[vendedor.id];
      if (!mesh) return;

      const slot = PODIUM_SLOTS[rank];
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
        const slot1 = PODIUM_SLOTS[1];
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
    const norm = {};
    if (raw.pontos !== undefined) norm.pontos = raw.pontos;
    else if (raw.pontuacaoGeral !== undefined) norm.pontos = raw.pontuacaoGeral;

    if (raw.contatos !== undefined) norm.contatos = raw.contatos;
    else if (raw.totalContatos !== undefined) norm.contatos = raw.totalContatos;

    if (raw.novosLeads !== undefined) norm.novosLeads = raw.novosLeads;
    else if (raw.totalCadastrados !== undefined) norm.novosLeads = raw.totalCadastrados;

    if (raw.fechados !== undefined) norm.fechados = raw.fechados;
    else if (raw.totalFechados !== undefined) norm.fechados = raw.totalFechados;

    if (raw.emNegociacao !== undefined) norm.emNegociacao = raw.emNegociacao;
    else if (raw.leadsPorEstagio && raw.leadsPorEstagio.negociacao !== undefined) norm.emNegociacao = raw.leadsPorEstagio.negociacao;

    if (raw.taxaConversao !== undefined) norm.taxaConversao = raw.taxaConversao;
    if (raw.valorTotal !== undefined) norm.valorTotal = raw.valorTotal;
    else if (raw.volumeTotalFaturado !== undefined) norm.valorTotal = raw.volumeTotalFaturado;

    return norm;
  }

  /**
   * Função principal exportada: atualizarArena3D(metricasVendedores, options)
   */
  function atualizar(metricasVendedores, options = {}) {
    if (!metricasVendedores) return;

    // Trata se for array ou mapa { 'maciel': { ... }, 'fernanda': { ... } }
    if (Array.isArray(metricasVendedores)) {
      metricasVendedores.forEach(novoItem => {
        const targetId = (novoItem.vendedorId || novoItem.id || novoItem.nome || '').toString().toLowerCase();
        const existente = vendedoresData.find(v => v.id === targetId || v.nomeCurto.toLowerCase() === targetId || v.nome.toLowerCase() === targetId);
        if (existente) {
          const norm = normalizarMetricas(novoItem.metricas || novoItem);
          existente.metricas = Object.assign({}, existente.metricas, norm);
        }
      });
    } else if (typeof metricasVendedores === 'object') {
      Object.keys(metricasVendedores).forEach(key => {
        const targetId = key.toLowerCase();
        const existente = vendedoresData.find(v => v.id === targetId || v.nomeCurto.toLowerCase() === targetId || v.nome.toLowerCase() === targetId);
        if (existente) {
          const norm = normalizarMetricas(metricasVendedores[key]);
          existente.metricas = Object.assign({}, existente.metricas, norm);
        }
      });
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
          bottom: 16px;
          right: 16px;
          display: flex;
          gap: 10px;
          z-index: 10;
          pointer-events: auto;
        }
        .arena3d-btn-celebrate {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #e3a52b 0%, #b45309 100%);
          color: #ffffff;
          border: none;
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 12px;
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
          border-radius: 12px;
          padding: 8px 12px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .arena3d-btn-reset-cam:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }
        .arena3d-hud-podium {
          position: absolute;
          bottom: 16px;
          left: 16px;
          display: flex;
          gap: 10px;
          z-index: 10;
          pointer-events: none;
        }
        .arena3d-card-vendedor {
          background: rgba(6, 17, 30, 0.82);
          backdrop-filter: blur(14px);
          border-radius: 14px;
          padding: 10px 14px;
          min-width: 170px;
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
          border-color: rgba(227, 165, 43, 0.6);
          background: linear-gradient(180deg, rgba(227, 165, 43, 0.12) 0%, rgba(6, 17, 30, 0.9) 100%);
          box-shadow: 0 4px 18px rgba(227, 165, 43, 0.2);
        }
        .arena3d-card-vendedor.rank-2 {
          border-color: rgba(203, 213, 225, 0.4);
        }
        .arena3d-card-vendedor.rank-3 {
          border-color: rgba(205, 127, 50, 0.4);
        }
        .arena3d-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .arena3d-card-rank-tag {
          font-size: 11px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 6px;
          letter-spacing: 0.03em;
        }
        .rank-1 .arena3d-card-rank-tag { background: #e3a52b; color: #000; }
        .rank-2 .arena3d-card-rank-tag { background: #94a3b8; color: #000; }
        .rank-3 .arena3d-card-rank-tag { background: #b45309; color: #fff; }
        .arena3d-card-name {
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
        }
        .arena3d-card-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px 8px;
          margin-top: 6px;
          font-size: 11px;
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
          margin-top: 8px;
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
        .arena3d-hint {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          pointer-events: none;
        }  letter-spacing: 0.05em;
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
        cameraControl.targetPhi = 0.28;
        cameraControl.targetRadius = 12.8;
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
    camera.position.set(0, 5.0, 12.8);

    // 6. Iluminação e Cenário
    configurarIluminacao();
    criarCenario3D();

    // 7. Modelagem Tridimensional dos 3 Personagens
    const materiais = criarMateriaisPersonagens();
    const meshFernanda = criarModeloFernanda(materiais);
    const meshCaio = criarModeloCaio(materiais);
    const meshMaciel = criarModeloMaciel(materiais);

    characterMeshes.fernanda = meshFernanda;
    characterMeshes.caio = meshCaio;
    characterMeshes.maciel = meshMaciel;

    scene.add(meshFernanda, meshCaio, meshMaciel);

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
      cameraControl.targetPhi = 0.28;
      cameraControl.targetRadius = 12.8;
    }
  };
});
