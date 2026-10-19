import * as THREE from 'three'
import { Chess } from 'chess.js'
import './style.css'

// ======================================================
// 1. ESTADO DA PARTIDA E CONFIGURAÇÃO DO THREE.JS
// ======================================================

const game = new Chess()
let gameMode = 'local' // 'local' = duas pessoas; 'bot' = contra o computador
let botLevel = 'beginner'
let botThinking = false
let botTimer = null
let selectedSquare = null
let lastMove = null // casas de origem e destino do lance mais recente
let pendingPromotion = null
let moveAnimation = null
let animateLastMove = false
let boardRotationTarget = 0
let soundEnabled = true
let highQuality = true
let audioContext = null

const LEVELS = {
  beginner: { label: 'Iniciante', depth: 0 },
  intermediate: { label: 'Intermediário', depth: 1 },
  advanced: { label: 'Avançado', depth: 2 },
}

const PIECE_VALUES = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 20000 }

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x141414)
scene.fog = new THREE.Fog(0x141414, 17, 34)

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(7.7, 9.6, 10.8)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.04
renderer.shadowMap.autoUpdate = true

const app = document.querySelector('#app')
app.replaceChildren(renderer.domElement)
Object.assign(renderer.domElement.style, {
  display: 'block',
  width: '100%',
  height: '100%',
  touchAction: 'none',
})

// ======================================================
// 2. COMPONENTES BÁSICOS DA INTERFACE
// ======================================================

const ui = document.createElement('div')
Object.assign(ui.style, {
  position: 'fixed',
  inset: '0',
  zIndex: '5',
  pointerEvents: 'none',
  fontFamily: 'Arial, sans-serif',
  color: '#ffffff',
})
document.body.appendChild(ui)

function createButton(label, onClick, primary = false) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'chess-ui-button'
  button.textContent = label
  Object.assign(button.style, {
    border: primary ? '1px solid #d9b66e' : '1px solid #656b75',
    borderRadius: '9px',
    padding: '10px 13px',
    background: primary ? '#b69a68' : '#252525',
    color: primary ? '#171615' : '#ffffff',
    fontSize: '14px',
    fontWeight: primary ? '700' : '500',
    cursor: 'pointer',
    pointerEvents: 'auto',
    transition: 'background 160ms ease, transform 160ms ease',
  })
  button.addEventListener('mouseenter', () => {
    button.style.background = primary ? '#d0b783' : '#393939'
    button.style.transform = 'translateY(-1px)'
  })
  button.addEventListener('mouseleave', () => {
    button.style.background = primary ? '#b69a68' : '#252525'
    button.style.transform = 'translateY(0)'
  })
  button.addEventListener('click', onClick)
  return button
}

function createOverlay(zIndex = 20) {
  const overlay = document.createElement('div')
  Object.assign(overlay.style, {
    display: 'none',
    position: 'fixed',
    inset: '0',
    zIndex: String(zIndex),
    background: 'rgba(5, 8, 13, 0.78)',
    backdropFilter: 'blur(7px)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px',
    boxSizing: 'border-box',
    pointerEvents: 'auto',
    fontFamily: 'Arial, sans-serif',
  })
  document.body.appendChild(overlay)
  return overlay
}

function createModalPanel(maxWidth = '650px') {
  const panel = document.createElement('div')
  panel.className = 'chess-modal-panel'
  Object.assign(panel.style, {
    width: `min(${maxWidth}, 100%)`,
    maxHeight: '88vh',
    overflowY: 'auto',
    boxSizing: 'border-box',
    padding: 'clamp(18px, 4vw, 28px)',
    borderRadius: '18px',
    background: 'linear-gradient(145deg, #2b2925, #171717)',
    border: '1px solid #596272',
    boxShadow: '0 24px 80px rgba(0,0,0,.45)',
    color: '#f3f4f6',
    lineHeight: '1.6',
  })
  return panel
}

const topPanel = document.createElement('div')
topPanel.className = 'chess-top-panel'
Object.assign(topPanel.style, {
  position: 'absolute',
  top: '16px',
  left: '16px',
  right: '16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
  pointerEvents: 'none',
})
ui.appendChild(topPanel)

const title = document.createElement('div')
title.className = 'chess-title'
title.textContent = 'XADREZ 3D'
Object.assign(title.style, {
  fontSize: '20px',
  fontWeight: '700',
  letterSpacing: '2px',
  textShadow: '0 2px 8px #000000',
})
topPanel.appendChild(title)

const controls = document.createElement('div')
controls.className = 'chess-controls'
Object.assign(controls.style, {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  alignItems: 'center',
  pointerEvents: 'auto',
})
topPanel.appendChild(controls)

const turnLabel = document.createElement('div')
turnLabel.className = 'chess-turn-label'
Object.assign(turnLabel.style, {
  position: 'absolute',
  top: '76px',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '10px 16px',
  borderRadius: '10px',
  background: 'rgba(15, 18, 23, 0.9)',
  border: '1px solid #4a515d',
  fontSize: '15px',
  fontWeight: '600',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  maxWidth: 'calc(100vw - 32px)',
})
ui.appendChild(turnLabel)

const historyPanel = document.createElement('div')
historyPanel.className = 'chess-history-panel'
Object.assign(historyPanel.style, {
  position: 'absolute',
  left: '16px',
  bottom: '16px',
  width: 'min(280px, calc(100vw - 32px))',
  maxHeight: '150px',
  overflowY: 'auto',
  boxSizing: 'border-box',
  padding: '12px',
  borderRadius: '12px',
  background: 'rgba(15, 18, 23, 0.91)',
  border: '1px solid #4a515d',
  fontSize: '13px',
  lineHeight: '1.7',
  whiteSpace: 'pre-wrap',
})
ui.appendChild(historyPanel)

const messageLabel = document.createElement('div')
messageLabel.className = 'chess-message-label'
Object.assign(messageLabel.style, {
  position: 'absolute',
  right: '16px',
  bottom: '16px',
  maxWidth: 'min(320px, calc(100vw - 32px))',
  padding: '12px',
  borderRadius: '12px',
  background: 'rgba(15, 18, 23, 0.91)',
  border: '1px solid #4a515d',
  fontSize: '13px',
  lineHeight: '1.5',
  textAlign: 'right',
})
ui.appendChild(messageLabel)

// Ajustes responsivos para não sobrepor botões e painéis em telas pequenas.
const responsiveStyle = document.createElement('style')
responsiveStyle.textContent = `
  .chess-top-panel { z-index: 2; }
  .chess-ui-button:focus-visible { outline: 2px solid #f0cf83; outline-offset: 2px; }
  .chess-modal-panel h3 { color: #e6c47c; }
  .chess-modal-panel p { overflow-wrap: anywhere; }
  @media (max-width: 720px) {
    .chess-top-panel { top: max(8px, env(safe-area-inset-top)); left: 9px; right: 9px; align-items: flex-start; gap: 7px; }
    .chess-title { font-size: 16px !important; letter-spacing: 1.5px !important; margin-top: 7px; }
    .chess-controls { max-width: calc(100vw - 105px); justify-content: flex-end; gap: 5px !important; }
    .chess-ui-button { padding: 8px 9px !important; font-size: 12px !important; border-radius: 8px !important; }
    .chess-turn-label { top: auto !important; bottom: 142px !important; max-width: calc(100vw - 20px) !important; white-space: normal !important; width: max-content; font-size: 12px !important; padding: 8px 10px !important; }
    .chess-history-panel { left: 8px !important; bottom: max(8px, env(safe-area-inset-bottom)) !important; width: calc(50vw - 13px) !important; max-height: 112px !important; padding: 8px !important; font-size: 11px !important; line-height: 1.5 !important; }
    .chess-message-label { right: 8px !important; bottom: max(8px, env(safe-area-inset-bottom)) !important; width: calc(50vw - 13px) !important; max-width: calc(50vw - 13px) !important; box-sizing: border-box; padding: 8px !important; font-size: 11px !important; line-height: 1.4 !important; }
    .chess-modal-panel { max-height: 90dvh !important; padding: 18px !important; }
  }
  @media (max-width: 420px) {
    .chess-top-panel { flex-direction: column; }
    .chess-controls { max-width: 100%; justify-content: flex-start; }
    .chess-title { margin-top: 0; }
    .chess-turn-label { bottom: 130px !important; }
    .chess-history-panel, .chess-message-label { max-height: 96px !important; }
  }
  @media (max-height: 520px) {
    .chess-turn-label { top: auto !important; bottom: 120px !important; }
    .chess-history-panel, .chess-message-label { max-height: 72px !important; }
  }
`
document.head.appendChild(responsiveStyle)

// ======================================================
// 3. TELA DE ESCOLHA DO MODO E DA DIFICULDADE
// ======================================================

const modeOverlay = createOverlay(30)
modeOverlay.style.display = 'flex'
const modePanel = createModalPanel('680px')
modePanel.classList.add('chess-start-panel')
modeOverlay.appendChild(modePanel)

const eyebrow = document.createElement('div')
eyebrow.textContent = 'ESCOLHA COMO JOGAR'
Object.assign(eyebrow.style, {
  color: '#c5ab7a',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '2px',
})
modePanel.appendChild(eyebrow)

const modeHeading = document.createElement('h2')
modeHeading.textContent = 'Uma partida começa com você'
Object.assign(modeHeading.style, {
  fontSize: 'clamp(24px, 4vw, 32px)',
  lineHeight: '1.2',
  margin: '8px 0',
})
modePanel.appendChild(modeHeading)

const modeDescription = document.createElement('p')
modeDescription.textContent = 'Jogue com outra pessoa no mesmo dispositivo ou pratique contra o computador.'
Object.assign(modeDescription.style, { color: '#c2c8d1', margin: '0 0 22px' })
modePanel.appendChild(modeDescription)

const modeCards = document.createElement('div')
Object.assign(modeCards.style, {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '12px',
})
modePanel.appendChild(modeCards)

const levelArea = document.createElement('div')
Object.assign(levelArea.style, {
  display: 'none',
  marginTop: '20px',
  paddingTop: '18px',
  borderTop: '1px solid #424b59',
})
modePanel.appendChild(levelArea)

const levelTitle = document.createElement('h3')
levelTitle.textContent = 'Escolha a dificuldade'
levelTitle.style.margin = '0 0 6px'
levelArea.appendChild(levelTitle)

const levelDescription = document.createElement('p')
levelDescription.textContent = 'Você jogará com as brancas; o robô jogará com as pretas.'
Object.assign(levelDescription.style, { color: '#c2c8d1', margin: '0 0 14px' })
levelArea.appendChild(levelDescription)

const levelButtons = document.createElement('div')
Object.assign(levelButtons.style, {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
  gap: '10px',
})
levelArea.appendChild(levelButtons)

const modeFooter = document.createElement('div')
Object.assign(modeFooter.style, { display: 'flex', justifyContent: 'flex-end', marginTop: '18px' })
modePanel.appendChild(modeFooter)

function showModePicker() {
  cancelBotTimer()
  botThinking = false
  selectedSquare = null
  refreshHighlights()
  finishOverlay.style.display = 'none'
  promotionOverlay.style.display = 'none'
  pendingPromotion = null
  modeOverlay.style.display = 'flex'
  levelArea.style.display = 'none'
  modeCards.style.display = 'grid'
  modeFooter.replaceChildren()
  updateInterface()
}

function startGame(mode, level = 'beginner') {
  cancelBotTimer()
  botThinking = false
  gameMode = mode
  botLevel = level
  game.reset()
  selectedSquare = null
  lastMove = null
  clearHighlights()
  finishOverlay.style.display = 'none'
  promotionOverlay.style.display = 'none'
  pendingPromotion = null
  renderPieces()
  modeOverlay.style.display = 'none'
  updateInterface()
}

function createModeCard(icon, heading, description, onClick) {
  const card = document.createElement('button')
  card.type = 'button'
  card.className = 'chess-mode-card'
  Object.assign(card.style, {
    display: 'block',
    textAlign: 'left',
    padding: '20px',
    borderRadius: '14px',
    border: '1px solid #596272',
    background: '#242424',
    color: '#f4f1e9',
    cursor: 'pointer',
    minHeight: '150px',
    transition: 'background 160ms ease, border-color 160ms ease, transform 160ms ease',
  })
  const iconEl = document.createElement('div')
  iconEl.textContent = icon
  Object.assign(iconEl.style, { fontSize: '30px', marginBottom: '12px' })
  const titleEl = document.createElement('div')
  titleEl.textContent = heading
  Object.assign(titleEl.style, { fontSize: '18px', fontWeight: '700', marginBottom: '6px' })
  const descEl = document.createElement('div')
  descEl.textContent = description
  Object.assign(descEl.style, { color: '#c2c8d1', fontSize: '14px', lineHeight: '1.5' })
  card.append(iconEl, titleEl, descEl)
  card.addEventListener('mouseenter', () => {
    card.style.background = '#37332c'
    card.style.borderColor = '#d0aa62'
    card.style.transform = 'translateY(-2px)'
  })
  card.addEventListener('mouseleave', () => {
    card.style.background = '#242424'
    card.style.borderColor = '#766b58'
    card.style.transform = 'translateY(0)'
  })
  card.addEventListener('click', onClick)
  return card
}

modeCards.append(
  createModeCard('♙  ♟', 'Dois jogadores', 'Duas pessoas jogam no mesmo computador, alternando as jogadas.', () => startGame('local')),
  createModeCard('♟', 'Contra o robô', 'Pratique contra o computador e escolha um nível de dificuldade.', () => {
    modeCards.style.display = 'none'
    levelArea.style.display = 'block'
    modeFooter.replaceChildren(createButton('Voltar', () => {
      levelArea.style.display = 'none'
      modeCards.style.display = 'grid'
      modeFooter.replaceChildren()
    }))
  }),
)

const levelOptions = [
  { key: 'beginner', title: 'Iniciante', description: 'Jogadas simples, com escolhas mais imprevisíveis.' },
  { key: 'intermediate', title: 'Intermediário', description: 'Analisa capturas e respostas próximas.' },
  { key: 'advanced', title: 'Avançado', description: 'Busca mais jogadas à frente e avalia a posição.' },
]

for (const option of levelOptions) {
  const button = document.createElement('button')
  button.type = 'button'
  Object.assign(button.style, {
    textAlign: 'left',
    padding: '13px',
    borderRadius: '10px',
    border: '1px solid #596272',
    background: '#242424',
    color: '#f4f1e9',
    cursor: 'pointer',
  })
  const name = document.createElement('div')
  name.textContent = option.title
  name.style.fontWeight = '700'
  const description = document.createElement('div')
  description.textContent = option.description
  Object.assign(description.style, { marginTop: '5px', color: '#c2c8d1', fontSize: '12px', lineHeight: '1.4' })
  button.append(name, description)
  button.addEventListener('mouseenter', () => {
    button.style.borderColor = '#d0aa62'
    button.style.background = '#37332c'
  })
  button.addEventListener('mouseleave', () => {
    button.style.borderColor = '#766b58'
    button.style.background = '#242424'
  })
  button.addEventListener('click', () => startGame('bot', option.key))
  levelButtons.appendChild(button)
}

// ======================================================
// 4. MANUAL ILUSTRADO
// ======================================================

const manualOverlay = createOverlay(20)
const manualPanel = createModalPanel('700px')
manualOverlay.appendChild(manualPanel)

const manualHeader = document.createElement('div')
Object.assign(manualHeader.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' })
manualPanel.appendChild(manualHeader)

const manualTitle = document.createElement('h2')
manualTitle.textContent = 'Manual do xadrez'
manualTitle.style.marginTop = '0'
manualHeader.appendChild(manualTitle)
manualHeader.appendChild(createButton('Fechar', () => { manualOverlay.style.display = 'none' }))

const manualContent = document.createElement('div')
manualContent.innerHTML = `
  <div style="padding:16px;border-radius:12px;background:#303a49;margin-bottom:18px">
    <div style="font-size:18px;font-weight:700;color:#e6c47c">Objetivo do jogo</div>
    <p style="margin-bottom:0">Dar xeque-mate no rei adversário: atacar o rei de forma que ele não possa escapar, bloquear o ataque ou capturar a peça atacante.</p>
  </div>
  <h3>Como as peças se movimentam</h3>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:10px">
    <div style="padding:12px;border:1px solid #596272;border-radius:10px"><div style="font-size:30px">♟</div><strong>Peão</strong><p>Avança uma casa (ou duas na primeira jogada). Captura na diagonal.</p></div>
    <div style="padding:12px;border:1px solid #596272;border-radius:10px"><div style="font-size:30px">♜</div><strong>Torre</strong><p>Move-se na horizontal ou vertical.</p></div>
    <div style="padding:12px;border:1px solid #596272;border-radius:10px"><div style="font-size:30px">♞</div><strong>Cavalo</strong><p>Move-se em formato de L e salta sobre peças.</p></div>
    <div style="padding:12px;border:1px solid #596272;border-radius:10px"><div style="font-size:30px">♝</div><strong>Bispo</strong><p>Move-se pelas diagonais.</p></div>
    <div style="padding:12px;border:1px solid #596272;border-radius:10px"><div style="font-size:30px">♛</div><strong>Dama</strong><p>Move-se na horizontal, vertical e diagonal.</p></div>
    <div style="padding:12px;border:1px solid #596272;border-radius:10px"><div style="font-size:30px">♚</div><strong>Rei</strong><p>Move-se uma casa em qualquer direção, sem ficar em xeque.</p></div>
  </div>
  <h3>Regras importantes</h3>
  <ul>
    <li>As brancas sempre fazem o primeiro movimento.</li>
    <li>Os jogadores alternam os turnos e não podem deixar o próprio rei em xeque.</li>
    <li><strong>Roque:</strong> movimento especial do rei com uma torre, quando as condições são satisfeitas.</li>
    <li><strong>En passant:</strong> captura especial de peão que só pode ocorrer logo após um avanço específico do peão adversário.</li>
    <li><strong>Promoção:</strong> quando o peão chega à última fileira, ele é promovido a dama, torre, bispo ou cavalo.</li>
    <li><strong>Empate:</strong> pode acontecer por afogamento, repetição, material insuficiente ou outras regras oficiais.</li>
  </ul>
  <h3>Como jogar neste projeto</h3>
  <ol>
    <li>Escolha um modo de jogo no botão “Modo de jogo”.</li>
    <li>Clique em uma peça da cor que tem a vez.</li>
    <li>As casas de destino legais ficam destacadas em verde.</li>
    <li>Clique na casa de destino para fazer a jogada.</li>
    <li>Use “Desfazer” para voltar jogadas ou “Nova partida” para reiniciar.</li>
  </ol>
  <p style="color:#c2c8d1;font-size:13px">O jogo usa chess.js para validar os movimentos. As peças 3D são representações visuais simplificadas.</p>
`
Object.assign(manualContent.style, { color: '#e6e9ef', lineHeight: '1.65' })
manualPanel.appendChild(manualContent)

function openManual() {
  manualOverlay.style.display = 'flex'
}
manualOverlay.addEventListener('click', (event) => {
  if (event.target === manualOverlay) manualOverlay.style.display = 'none'
})

// ======================================================
// 4.1 AVISO CENTRAL DE FIM DE PARTIDA
// ======================================================

const finishOverlay = createOverlay(25)
const finishPanel = createModalPanel('440px')
Object.assign(finishPanel.style, { textAlign: 'center', padding: 'clamp(24px, 5vw, 38px)' })
finishOverlay.appendChild(finishPanel)

const finishIcon = document.createElement('div')
finishIcon.textContent = '♔'
Object.assign(finishIcon.style, { fontSize: '48px', lineHeight: '1.1', color: '#e6c47c', marginBottom: '12px' })
finishPanel.appendChild(finishIcon)

const finishTitle = document.createElement('h2')
Object.assign(finishTitle.style, { fontSize: 'clamp(24px, 5vw, 34px)', margin: '0 0 8px', lineHeight: '1.2' })
finishPanel.appendChild(finishTitle)

const finishDescription = document.createElement('p')
Object.assign(finishDescription.style, { color: '#c2c8d1', margin: '0 0 22px' })
finishPanel.appendChild(finishDescription)

const finishActions = document.createElement('div')
Object.assign(finishActions.style, { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' })
finishPanel.appendChild(finishActions)
finishActions.appendChild(createButton('Jogar novamente', () => startGame(gameMode, botLevel), true))
finishActions.appendChild(createButton('Escolher modo', showModePicker))

// ======================================================
// 4.2 ESCOLHA VISUAL DE PROMOÇÃO DE PEÃO
// Evita a janela padrão do navegador e funciona em telas móveis.
// ======================================================

const promotionOverlay = createOverlay(26)
const promotionPanel = createModalPanel('440px')
promotionOverlay.appendChild(promotionPanel)

const promotionTitle = document.createElement('h2')
promotionTitle.textContent = 'Escolha a promoção'
promotionTitle.style.marginTop = '0'
promotionPanel.appendChild(promotionTitle)

const promotionDescription = document.createElement('p')
promotionDescription.textContent = 'Seu peão chegou à última fileira. Escolha a peça que deseja receber.'
promotionDescription.style.color = '#c2c8d1'
promotionPanel.appendChild(promotionDescription)

const promotionChoices = document.createElement('div')
Object.assign(promotionChoices.style, { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' })
promotionPanel.appendChild(promotionChoices)

const promotionOptions = [
  { key: 'q', name: 'Dama', glyph: '♛' },
  { key: 'r', name: 'Torre', glyph: '♜' },
  { key: 'b', name: 'Bispo', glyph: '♝' },
  { key: 'n', name: 'Cavalo', glyph: '♞' },
]

for (const option of promotionOptions) {
  const optionButton = document.createElement('button')
  optionButton.type = 'button'
  Object.assign(optionButton.style, {
    border: '1px solid #596272', borderRadius: '12px', padding: '14px 10px',
    background: '#242424', color: '#f4f1e9', cursor: 'pointer', fontSize: '15px',
  })
  const glyph = document.createElement('div')
  glyph.textContent = option.glyph
  Object.assign(glyph.style, { fontSize: '34px', lineHeight: '1.1', marginBottom: '6px' })
  const name = document.createElement('div')
  name.textContent = option.name
  name.style.fontWeight = '700'
  optionButton.append(glyph, name)
  optionButton.addEventListener('mouseenter', () => { optionButton.style.borderColor = '#d0aa62'; optionButton.style.background = '#37332c' })
  optionButton.addEventListener('mouseleave', () => { optionButton.style.borderColor = '#766b58'; optionButton.style.background = '#242424' })
  optionButton.addEventListener('click', () => {
    if (!pendingPromotion) return
    const pending = pendingPromotion
    pendingPromotion = null
    promotionOverlay.style.display = 'none'
    completeMove(pending.from, pending.to, option.key)
  })
  promotionChoices.appendChild(optionButton)
}

function openPromotionPicker(from, to) {
  pendingPromotion = { from, to }
  promotionOverlay.style.display = 'flex'
}

// ======================================================
// 5. ILUMINAÇÃO
// ======================================================

const ambientLight = new THREE.HemisphereLight(0xe8e0d0, 0x27231d, 1.65)
scene.add(ambientLight)
const directionalLight = new THREE.DirectionalLight(0xffe4b4, 3.1)
directionalLight.position.set(5, 11, 7)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(2048, 2048)
directionalLight.shadow.camera.left = -7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.bottom = -7
directionalLight.shadow.bias = -0.00025
directionalLight.shadow.normalBias = 0.025
scene.add(directionalLight)
const fillLight = new THREE.DirectionalLight(0xc6d6e8, 0.8)
fillLight.position.set(-7, 5, -5)
scene.add(fillLight)

// Piso fosco para ancorar visualmente o tabuleiro e receber sombras suaves.
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x171614, roughness: 0.92, metalness: 0.02 }),
)
floor.rotation.x = -Math.PI / 2
floor.position.y = -0.34
floor.receiveShadow = true
scene.add(floor)

// ======================================================
// 6. TABULEIRO 3D
// ======================================================

const boardGroup = new THREE.Group()
scene.add(boardGroup)
const squareGeometry = new THREE.BoxGeometry(1, 0.2, 1)
const lightSquareMaterial = new THREE.MeshStandardMaterial({ color: 0xe8dcc4, roughness: 0.78 })
const darkSquareMaterial = new THREE.MeshStandardMaterial({ color: 0x242424, roughness: 0.7 })
const squareMeshes = new Map()
const coordinateGroup = new THREE.Group()
boardGroup.add(coordinateGroup)

function squareToPosition(square) {
  const col = square.charCodeAt(0) - 97
  const rank = Number(square[1])
  return { x: col - 3.5, z: 4.5 - rank }
}

function createBoard() {
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(8.34, 0.18, 8.34),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.32, metalness: 0.28 }),
  )
  plinth.position.set(0, -0.19, 0)
  plinth.castShadow = true
  plinth.receiveShadow = true
  boardGroup.add(plinth)

  // Moldura perimetral em camadas, como um tabuleiro de madeira premium.
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x30291f, roughness: 0.36, metalness: 0.18 })
  const railGeometry = new THREE.BoxGeometry(8.56, 0.13, 0.22)
  for (const z of [-4.12, 4.12]) {
    const rail = new THREE.Mesh(railGeometry, frameMaterial)
    rail.position.set(0, -0.015, z)
    rail.castShadow = true
    rail.receiveShadow = true
    boardGroup.add(rail)
  }
  const sideRailGeometry = new THREE.BoxGeometry(0.22, 0.13, 8.25)
  for (const x of [-4.12, 4.12]) {
    const rail = new THREE.Mesh(sideRailGeometry, frameMaterial)
    rail.position.set(x, -0.015, 0)
    rail.castShadow = true
    rail.receiveShadow = true
    boardGroup.add(rail)
  }
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(8.39, 0.035, 8.39),
    new THREE.MeshStandardMaterial({ color: 0xb69a68, roughness: 0.28, metalness: 0.62 }),
  )
  trim.position.set(0, -0.095, 0)
  boardGroup.add(trim)
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = new THREE.Mesh(squareGeometry, (row + col) % 2 === 0 ? darkSquareMaterial : lightSquareMaterial)
      square.position.set(col - 3.5, 0, row - 3.5)
      square.receiveShadow = true
      const name = String.fromCharCode(97 + col) + (8 - row)
      square.userData.square = name
      boardGroup.add(square)
      squareMeshes.set(name, square)
    }
  }
}
createBoard()

// Coordenadas discretas na moldura ajudam a localizar casas sem poluir o tabuleiro.
function createCoordinateSprite(label, x, z, isLightEdge) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 128, 128)
  ctx.font = '600 54px DM Sans, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = isLightEdge ? '#e4d4b6' : '#a99570'
  ctx.fillText(label, 64, 66)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }))
  sprite.position.set(x, 0.057, z)
  sprite.scale.set(0.19, 0.19, 1)
  sprite.userData.isCoordinate = true
  coordinateGroup.add(sprite)
}
for (let col = 0; col < 8; col++) {
  const file = String.fromCharCode(97 + col)
  createCoordinateSprite(file, col - 3.5, -4.12, col % 2 === 0)
  createCoordinateSprite(file, col - 3.5, 4.12, col % 2 !== 0)
}
for (let rank = 1; rank <= 8; rank++) {
  createCoordinateSprite(String(rank), -4.12, 4.5 - rank, rank % 2 === 0)
  createCoordinateSprite(String(rank), 4.12, 4.5 - rank, rank % 2 !== 0)
}

// ======================================================
// 7. PEÇAS 3D
// ======================================================

const pieceGroup = new THREE.Group()
scene.add(pieceGroup)
const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xe9dfca, roughness: 0.31, metalness: 0.025 })
const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x20201f, roughness: 0.28, metalness: 0.12 })
const pieceBaseGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.12, 40)
const pieceStemGeometry = new THREE.CylinderGeometry(0.12, 0.22, 0.35, 24)

function createPieceMesh(type, color, square) {
  const material = color === 'w' ? whiteMaterial : blackMaterial
  const piece = new THREE.Group()
  const detailMaterial = new THREE.MeshStandardMaterial({
    color: color === 'w' ? 0xb79a62 : 0x8c744c,
    metalness: 0.62,
    roughness: 0.28,
  })
  const shadowMaterial = new THREE.MeshStandardMaterial({
    color: color === 'w' ? 0xd4c3a4 : 0x303030,
    roughness: 0.32,
    metalness: 0.12,
  })

  function addMesh(geometry, y = 0, x = 0, z = 0, mat = material, rotation = null) {
    const mesh = new THREE.Mesh(geometry, mat)
    mesh.position.set(x, y, z)
    if (rotation) mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0)
    mesh.castShadow = true
    mesh.receiveShadow = true
    piece.add(mesh)
    return mesh
  }
  function lathe(points, mat = material, segments = 32) {
    const geometry = new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments)
    return addMesh(geometry, 0, 0, 0, mat)
  }
  function ring(radius, tube, y, mat = detailMaterial) {
    return addMesh(new THREE.TorusGeometry(radius, tube, 10, 36), y, 0, 0, mat, { x: Math.PI / 2 })
  }

  // Base torneada em três níveis, semelhante a um conjunto de xadrez esculpido.
  addMesh(new THREE.CylinderGeometry(0.30, 0.345, 0.12, 40), 0.16)
  addMesh(new THREE.CylinderGeometry(0.265, 0.30, 0.075, 40), 0.255, 0, 0, detailMaterial)
  addMesh(new THREE.CylinderGeometry(0.235, 0.265, 0.055, 40), 0.32, 0, 0, material)
  ring(0.287, 0.018, 0.205)

  switch (type) {
    case 'p': { // Peão: haste estreita e cabeça esférica destacada.
      lathe([[0.16,.34],[.18,.37],[.16,.41],[.12,.47],[.105,.54],[.12,.59],[.16,.62],[.17,.65],[.13,.68],[.08,.70],[.02,.705]])
      addMesh(new THREE.SphereGeometry(0.135, 32, 24), 0.79)
      ring(0.12, 0.012, 0.655, detailMaterial)
      break
    }
    case 'r': { // Torre: bloco vertical, gola e ameias grandes claramente quadradas.
      lathe([[.18,.34],[.205,.39],[.20,.43],[.175,.47],[.175,.78],[.205,.81],[.23,.84],[.23,.91],[.17,.91],[.17,.86],[.145,.86],[.145,.92]])
      addMesh(new THREE.CylinderGeometry(.225,.225,.055,32), .855, 0, 0, detailMaterial)
      for (let i=0;i<6;i++) {
        const a=(i/6)*Math.PI*2
        addMesh(new THREE.BoxGeometry(.115,.15,.115), .965, Math.cos(a)*.16, Math.sin(a)*.16)
      }
      break
    }
    case 'n': { // Cavalo com pescoço inclinado e cabeça equina em relevo.
      // Pescoço e crina criam o volume tridimensional antes da silhueta da cabeça.
      addMesh(new THREE.CylinderGeometry(.105,.17,.43,24), .54, -.015, 0, material, {x:0,z:-.42})
      addMesh(new THREE.SphereGeometry(.145,24,18), .68, -.04, 0, material)
      const horseShape = new THREE.Shape()
      horseShape.moveTo(-.16,.49)
      horseShape.lineTo(-.17,.70)
      horseShape.lineTo(-.10,.83)
      horseShape.lineTo(-.13,1.02)
      horseShape.lineTo(-.055,.96)
      horseShape.lineTo(.015,.86)
      horseShape.lineTo(.13,.82)
      horseShape.lineTo(.22,.74)
      horseShape.lineTo(.20,.68)
      horseShape.lineTo(.10,.66)
      horseShape.lineTo(.035,.70)
      horseShape.lineTo(.01,.50)
      horseShape.closePath()
      const horseGeometry = new THREE.ExtrudeGeometry(horseShape, {depth:.16,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:8})
      const horse = addMesh(horseGeometry, 0, 0, -.08, material)
      // Olho e narina posicionados na face visível do cavalo.
      addMesh(new THREE.SphereGeometry(.025,14,10), .77, .105, .105, detailMaterial)
      addMesh(new THREE.SphereGeometry(.018,12,8), .685, .19, .105, detailMaterial)
      // Crina estilizada em pequenos relevos no topo do pescoço.
      for (let i=0;i<3;i++) addMesh(new THREE.ConeGeometry(.035,.12,8), .86-i*.09, -.10+i*.025, -.005, shadowMaterial, {x:0,z:-.38})
      break
    }
    case 'b': { // Bispo: corpo torneado, mitra pontiaguda e fenda diagonal.
      lathe([[.16,.34],[.19,.39],[.16,.44],[.12,.52],[.105,.64],[.13,.70],[.17,.74],[.15,.78],[.10,.81],[.07,.84]])
      addMesh(new THREE.SphereGeometry(.115,28,20), .77)
      addMesh(new THREE.ConeGeometry(.145,.29,32), .94, 0, 0, material)
      addMesh(new THREE.SphereGeometry(.025,16,12), 1.09, 0, 0, detailMaterial)
      const slit = addMesh(new THREE.BoxGeometry(.035,.20,.045), .91, .015, .125, detailMaterial, {x:0,z:-.48})
      break
    }
    case 'q': { // Rainha: corpo elegante e coroa com pontas e joias.
      lathe([[.17,.34],[.20,.39],[.16,.44],[.12,.51],[.105,.63],[.13,.70],[.18,.75],[.20,.79],[.23,.82],[.23,.87],[.18,.88],[.15,.84]])
      ring(.19,.014,.81,detailMaterial)
      for (let i=0;i<7;i++) {
        const a=(i/7)*Math.PI*2
        const x=Math.cos(a)*.17, z=Math.sin(a)*.17
        addMesh(new THREE.ConeGeometry(.045,.19,12), .955, x, z, detailMaterial)
        addMesh(new THREE.SphereGeometry(.025,12,10), .91, x, z, material)
      }
      addMesh(new THREE.SphereGeometry(.075,20,16), 1.02, 0, 0, detailMaterial)
      break
    }
    case 'k': { // Rei: corpo mais alto, gola e cruz tridimensional.
      lathe([[.17,.34],[.21,.39],[.17,.44],[.13,.53],[.12,.68],[.15,.75],[.19,.79],[.20,.83],[.16,.87],[.12,.90],[.11,.94],[.07,.96]])
      ring(.18,.016,.82,detailMaterial)
      addMesh(new THREE.SphereGeometry(.07,20,16), .98, 0, 0, detailMaterial)
      addMesh(new THREE.BoxGeometry(.075,.30,.075), 1.12, 0, 0, detailMaterial)
      addMesh(new THREE.BoxGeometry(.23,.075,.075), 1.145, 0, 0, detailMaterial)
      break
    }
  }

  const position = squareToPosition(square)
  piece.position.set(position.x, 0, position.z)
  piece.userData = { square, type, color }
  return piece
}

function playTone(frequency = 520, duration = 0.075, type = 'sine', volume = 0.035) {
  if (!soundEnabled) return
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return
    if (!audioContext) audioContext = new AudioContextClass()
    if (audioContext.state === 'suspended') audioContext.resume()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
    gain.gain.setValueAtTime(volume, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + duration)
  } catch (error) {
    // Áudio é opcional; falhas do navegador não devem interromper a partida.
  }
}

function playMoveSound(captured = false) {
  if (game.isCheck()) {
    playTone(720, 0.14, 'triangle', 0.045)
    return
  }
  playTone(captured ? 250 : 460, captured ? 0.11 : 0.065, captured ? 'triangle' : 'sine', 0.035)
}

function renderPieces() {
  while (pieceGroup.children.length > 0) pieceGroup.remove(pieceGroup.children[0])
  const position = game.board()
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const chessPiece = position[row][col]
      if (!chessPiece) continue
      const square = String.fromCharCode(97 + col) + (8 - row)
      const piece = createPieceMesh(chessPiece.type, chessPiece.color, square)
      if (animateLastMove && lastMove && square === lastMove.to) {
        const fromPosition = squareToPosition(lastMove.from)
        const targetPosition = { x: piece.position.x, z: piece.position.z }
        piece.position.set(fromPosition.x, 0, fromPosition.z)
        moveAnimation = { piece, from: { x: fromPosition.x, z: fromPosition.z }, to: targetPosition, startedAt: performance.now(), duration: 260 }
      }
      pieceGroup.add(piece)
    }
  }
  animateLastMove = false
}

// ======================================================
// 8. CASAS DESTACADAS
// ======================================================

const highlightGroup = new THREE.Group()
scene.add(highlightGroup)
const moveHighlightMaterial = new THREE.MeshBasicMaterial({ color: 0xd9c49b, transparent: true, opacity: 0.85, depthWrite: false })
const selectedMaterial = new THREE.MeshBasicMaterial({ color: 0xc7a66b, transparent: true, opacity: 0.48, depthWrite: false })
const lastMoveFromMaterial = new THREE.MeshBasicMaterial({ color: 0x9d8c6c, transparent: true, opacity: 0.30, depthWrite: false })
const lastMoveToMaterial = new THREE.MeshBasicMaterial({ color: 0xc7a66b, transparent: true, opacity: 0.43, depthWrite: false })
const checkMaterial = new THREE.MeshBasicMaterial({ color: 0xb94d43, transparent: true, opacity: 0.72, depthWrite: false })
const highlightGeometry = new THREE.BoxGeometry(0.88, 0.025, 0.88)

function clearHighlights() {
  while (highlightGroup.children.length > 0) highlightGroup.remove(highlightGroup.children[0])
}

function addHighlight(square, material, kind) {
  const position = squareToPosition(square)
  const highlight = new THREE.Mesh(highlightGeometry, material)
  const height = kind === 'selected' ? 0.145 : kind === 'move' ? 0.135 : kind === 'last-to' ? 0.12 : 0.116
  highlight.position.set(position.x, height, position.z)
  highlight.userData = { square, kind }
  highlightGroup.add(highlight)
}

// A casa de destino fica verde; a origem recebe um verde mais suave.
function drawLastMoveHighlights() {
  if (!lastMove) return
  addHighlight(lastMove.from, lastMoveFromMaterial, 'last-from')
  addHighlight(lastMove.to, lastMoveToMaterial, 'last-to')
}

function addLegalMoveMarker(square, isCapture = false) {
  const position = squareToPosition(square)
  let marker
  if (isCapture) {
    marker = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.035, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0xd9c49b, transparent: true, opacity: 0.9, depthWrite: false }),
    )
    marker.rotation.x = Math.PI / 2
    marker.position.set(position.x, 0.126, position.z)
  } else {
    marker = new THREE.Mesh(
      new THREE.CircleGeometry(0.105, 24),
      moveHighlightMaterial,
    )
    marker.rotation.x = -Math.PI / 2
    marker.position.set(position.x, 0.127, position.z)
  }
  marker.userData = { square, kind: 'move' }
  highlightGroup.add(marker)
}

function refreshHighlights() {
  clearHighlights()
  drawLastMoveHighlights()
  if (game.isCheck()) {
    const board = game.board()
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece && piece.type === 'k' && piece.color === game.turn()) {
          addHighlight(String.fromCharCode(97 + col) + (8 - row), checkMaterial, 'check')
        }
      }
    }
  }
  if (!selectedSquare) return
  addHighlight(selectedSquare, selectedMaterial, 'selected')
  for (const move of game.moves({ square: selectedSquare, verbose: true })) {
    addLegalMoveMarker(move.to, Boolean(move.captured))
  }
}

function syncLastMoveFromHistory() {
  const history = game.history({ verbose: true })
  const move = history.length ? history[history.length - 1] : null
  lastMove = move ? { from: move.from, to: move.to } : null
}

function showLegalMoves(square) {
  selectedSquare = square
  refreshHighlights()
}

// ======================================================
// 9. STATUS E HISTÓRICO
// ======================================================

function getGameStatus() {
  if (game.isCheckmate()) return `Xeque-mate! As ${game.turn() === 'w' ? 'pretas' : 'brancas'} venceram.`
  if (game.isStalemate()) return 'Empate por afogamento.'
  if (game.isThreefoldRepetition()) return 'Empate por repetição de posição.'
  if (game.isInsufficientMaterial()) return 'Empate por material insuficiente.'
  if (game.isDraw()) return 'Partida empatada.'
  if (game.isCheck()) return game.turn() === 'w' ? 'Xeque nas brancas!' : 'Xeque nas pretas!'
  return ''
}

function getEndGameCopy() {
  if (game.isCheckmate()) {
    const winner = game.turn() === 'w' ? 'pretas' : 'brancas'
    if (gameMode === 'bot') {
      return winner === 'brancas'
        ? { title: 'Você venceu!', description: 'Xeque-mate! Você conseguiu vencer o robô.' }
        : { title: 'O robô venceu', description: 'Xeque-mate. Que tal tentar outra estratégia?' }
    }
    return { title: `As ${winner} venceram!`, description: 'Xeque-mate: a partida terminou.' }
  }

  const status = getGameStatus()
  if (game.isDraw()) return { title: 'Empate!', description: status || 'A partida terminou empatada.' }
  return { title: 'Fim de partida', description: status || 'A partida terminou.' }
}

function updateFinishOverlay() {
  if (!game.isGameOver()) {
    finishOverlay.style.display = 'none'
    return
  }
  const result = getEndGameCopy()
  finishTitle.textContent = result.title
  finishDescription.textContent = result.description
  finishIcon.textContent = game.isCheckmate() ? '♚' : '½'
  finishOverlay.style.display = 'flex'
}

function updateInterface() {
  const status = getGameStatus()
  updateFinishOverlay()
  if (game.isGameOver()) {
    turnLabel.textContent = status
  } else if (botThinking) {
    turnLabel.textContent = 'Robô pensando…'
  } else if (gameMode === 'bot') {
    turnLabel.textContent = game.turn() === 'w' ? 'Sua vez — brancas' : 'Vez do robô — pretas'
    if (game.isCheck()) turnLabel.textContent += ' · XEQUE'
  } else {
    turnLabel.textContent = game.turn() === 'w' ? 'Vez das brancas' : 'Vez das pretas'
    if (game.isCheck()) turnLabel.textContent += ' · XEQUE'
  }

  const modeText = gameMode === 'bot' ? `Contra o robô · ${LEVELS[botLevel].label}` : 'Dois jogadores'
  messageLabel.textContent = status || `${modeText}. Selecione uma peça para ver os movimentos.`
  const history = game.history()
  historyPanel.replaceChildren()
  const historyHeading = document.createElement('div')
  historyHeading.className = 'chess-history-heading'
  historyHeading.textContent = 'HISTÓRICO DE JOGADAS'
  historyPanel.appendChild(historyHeading)
  if (history.length === 0) {
    const emptyHistory = document.createElement('div')
    emptyHistory.className = 'chess-history-empty'
    emptyHistory.textContent = 'As jogadas aparecerão aqui.'
    historyPanel.appendChild(emptyHistory)
  } else {
    for (let i = 0; i < history.length; i += 2) {
      const row = document.createElement('div')
      row.className = 'chess-history-row'
      if (i >= history.length - 2) row.classList.add('is-latest')
      const number = document.createElement('span')
      number.className = 'chess-history-number'
      number.textContent = `${Math.floor(i / 2) + 1}.`
      const whiteMove = document.createElement('span')
      whiteMove.textContent = history[i]
      const blackMove = document.createElement('span')
      blackMove.textContent = history[i + 1] || '…'
      row.append(number, whiteMove, blackMove)
      historyPanel.appendChild(row)
    }
  }

  // Contra o robô, só é possível desfazer enquanto ele ainda está pensando:
  // nesse intervalo, o último movimento da partida ainda é o do jogador.
  if (undoButton) {
    const canUndo = gameMode === 'bot'
      ? botThinking && game.turn() === 'b' && history.length > 0 && !game.isGameOver()
      : history.length > 0
    undoButton.disabled = !canUndo
    undoButton.style.opacity = canUndo ? '1' : '0.45'
    undoButton.style.cursor = canUndo ? 'pointer' : 'not-allowed'
    undoButton.title = gameMode === 'bot'
      ? 'Desfaz apenas sua última jogada, antes de o robô responder.'
      : 'Desfaz a última jogada.'
  }
}

// ======================================================
// 10. INTELIGÊNCIA ARTIFICIAL
// Iniciante usa escolhas simples. Os outros níveis avaliam
// capturas, posição das peças e possíveis respostas.
// ======================================================

function cancelBotTimer() {
  if (botTimer !== null) {
    clearTimeout(botTimer)
    botTimer = null
  }
}

function evaluatePosition(position) {
  if (position.isCheckmate()) return position.turn() === 'w' ? -100000 : 100000
  if (position.isDraw()) return 0

  let score = 0
  const board = position.board()
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (!piece) continue
      const sign = piece.color === 'w' ? 1 : -1
      let value = PIECE_VALUES[piece.type]
      const centerDistance = Math.abs(3.5 - col) + Math.abs(3.5 - row)
      if (piece.type === 'n' || piece.type === 'b') value += (7 - centerDistance) * 4
      if (piece.type === 'p') {
        const advancement = piece.color === 'w' ? 6 - row : row - 1
        value += advancement * 7
      }
      score += sign * value
    }
  }
  if (position.isCheck()) score += position.turn() === 'w' ? -25 : 25
  return score
}

function moveOrderingScore(move) {
  let score = 0
  if (move.captured) score += 10 * (PIECE_VALUES[move.captured] || 0) - (PIECE_VALUES[move.piece] || 0)
  if (move.promotion) score += PIECE_VALUES[move.promotion] || 0
  if (move.san?.includes('+')) score += 40
  if (move.san?.includes('#')) score += 100000
  return score
}

function orderedMoves(position) {
  return position.moves({ verbose: true }).sort((a, b) => moveOrderingScore(b) - moveOrderingScore(a))
}

function minimax(position, depth, alpha, beta) {
  if (depth === 0 || position.isGameOver()) return evaluatePosition(position)

  const moves = orderedMoves(position)
  if (moves.length === 0) return evaluatePosition(position)
  const maximizing = position.turn() === 'w' // pontuação positiva favorece as brancas

  if (maximizing) {
    let best = -Infinity
    for (const move of moves) {
      const next = new Chess(position.fen())
      next.move({ from: move.from, to: move.to, ...(move.promotion ? { promotion: move.promotion } : {}) })
      best = Math.max(best, minimax(next, depth - 1, alpha, beta))
      alpha = Math.max(alpha, best)
      if (beta <= alpha) break
    }
    return best
  }

  let best = Infinity
  for (const move of moves) {
    const next = new Chess(position.fen())
    next.move({ from: move.from, to: move.to, ...(move.promotion ? { promotion: move.promotion } : {}) })
    best = Math.min(best, minimax(next, depth - 1, alpha, beta))
    beta = Math.min(beta, best)
    if (beta <= alpha) break
  }
  return best
}

function chooseBotMove() {
  const moves = game.moves({ verbose: true })
  if (moves.length === 0) return null

  // O iniciante tende a escolher movimentos simples e ocasionalmente aleatórios.
  if (botLevel === 'beginner') {
    const scored = moves.map((move) => {
      let score = Math.random() * 100
      if (move.captured) score += (PIECE_VALUES[move.captured] || 0) * 0.35
      if (move.promotion) score += (PIECE_VALUES[move.promotion] || 0) * 0.5
      if (move.san.includes('+')) score += 20
      if (move.san.includes('#')) score += 10000
      return { move, score }
    })
    scored.sort((a, b) => b.score - a.score)
    return scored[0].move
  }

  // As pretas são o robô: ele minimiza a pontuação das brancas.
  const depth = LEVELS[botLevel].depth
  let bestScore = Infinity
  let bestMoves = []
  for (const move of orderedMoves(game)) {
    const next = new Chess(game.fen())
    next.move({ from: move.from, to: move.to, ...(move.promotion ? { promotion: move.promotion } : {}) })
    const score = minimax(next, depth, -Infinity, Infinity)
    if (score < bestScore) {
      bestScore = score
      bestMoves = [move]
    } else if (score === bestScore) {
      bestMoves.push(move)
    }
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)] || moves[0]
}

function makeBotMove() {
  if (gameMode !== 'bot' || game.turn() !== 'b' || game.isGameOver()) {
    botThinking = false
    updateInterface()
    return
  }

  botThinking = true
  updateInterface()
  // Pequena pausa para o indicador “Robô pensando…” aparecer.
  botTimer = setTimeout(() => {
    botTimer = null
    if (gameMode !== 'bot' || game.turn() !== 'b' || game.isGameOver()) {
      botThinking = false
      updateInterface()
      return
    }

    try {
      const move = chooseBotMove()
      if (move) {
        const captured = Boolean(game.get(move.to))
        game.move({ from: move.from, to: move.to, ...(move.promotion ? { promotion: move.promotion } : {}) })
        lastMove = { from: move.from, to: move.to }
        animateLastMove = true
        playMoveSound(captured)
      }
    } catch (error) {
      console.error('O robô não conseguiu realizar a jogada:', error)
    }

    botThinking = false
    selectedSquare = null
    refreshHighlights()
    renderPieces()
    updateInterface()
  }, 1800)
}

// ======================================================
// 11. MOVIMENTAÇÃO FEITA PELO JOGADOR
// ======================================================

function completeMove(from, to, promotion) {
  const captured = Boolean(game.get(to))
  try {
    game.move({ from, to, ...(promotion ? { promotion } : {}) })
  } catch (error) {
    console.error('Movimento não realizado:', error)
    return
  }

  lastMove = { from, to }
  animateLastMove = true
  playMoveSound(captured)
  selectedSquare = null
  refreshHighlights()
  renderPieces()
  updateInterface()

  if (gameMode === 'bot' && !game.isGameOver() && game.turn() === 'b') makeBotMove()
}

function makeMove(from, to) {
  if (game.isGameOver() || botThinking || promotionOverlay.style.display === 'flex') return
  if (gameMode === 'bot' && game.turn() !== 'w') return

  const candidateMoves = game.moves({ square: from, verbose: true })
  const move = candidateMoves.find((item) => item.to === to)
  if (!move) return

  // A promoção espera a escolha visual da peça, sem usar window.prompt.
  if (move.flags.includes('p')) {
    openPromotionPicker(from, to)
    return
  }

  completeMove(from, to)
}

// ======================================================
// 12. CLIQUES NO TABULEIRO
// ======================================================

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

function updatePointer(event) {
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
}

function findPieceHit() {
  const hits = raycaster.intersectObjects(pieceGroup.children, true)
  if (hits.length === 0) return null
  let object = hits[0].object
  while (object.parent && object.parent !== pieceGroup) object = object.parent
  return object.userData.square ? object : null
}

function findSquareHit() {
  const hits = raycaster.intersectObjects(boardGroup.children, false)
  const squareHit = hits.find((hit) => hit.object.userData.square)
  return squareHit ? squareHit.object.userData.square : null
}

function handleBoardClick(event) {
  if (manualOverlay.style.display === 'flex' || modeOverlay.style.display === 'flex' || promotionOverlay.style.display === 'flex' || finishOverlay.style.display === 'flex') return
  if (game.isGameOver() || botThinking) return
  // Quando está contra o robô, o jogador só controla as brancas.
  if (gameMode === 'bot' && game.turn() !== 'w') return

  updatePointer(event)
  const clickedPiece = findPieceHit()
  if (clickedPiece) {
    const targetSquare = clickedPiece.userData.square
    if (selectedSquare) {
      const legalMoves = game.moves({ square: selectedSquare, verbose: true })
      if (legalMoves.some((move) => move.to === targetSquare)) {
        makeMove(selectedSquare, targetSquare)
        return
      }
    }

    const pieceAtSquare = game.get(targetSquare)
    if (pieceAtSquare && pieceAtSquare.color === game.turn()) {
      selectedSquare = targetSquare
      showLegalMoves(targetSquare)
    } else {
      selectedSquare = null
      refreshHighlights()
    }
    return
  }

  const clickedSquare = findSquareHit()
  if (selectedSquare && clickedSquare) {
    const legalMoves = game.moves({ square: selectedSquare, verbose: true })
    if (legalMoves.some((move) => move.to === clickedSquare)) {
      makeMove(selectedSquare, clickedSquare)
      return
    }
  }
  selectedSquare = null
  refreshHighlights()
}
renderer.domElement.addEventListener('pointerdown', handleBoardClick)
renderer.domElement.addEventListener('pointermove', (event) => {
  updatePointer(event)
  const pieceHit = findPieceHit()
  const squareHit = findSquareHit()
  renderer.domElement.style.cursor = pieceHit || squareHit ? 'pointer' : 'default'
})
renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault())

// ======================================================
// 13. BOTÕES DO TOPO
// ======================================================

controls.appendChild(createButton('Modo de jogo', showModePicker))
controls.appendChild(createButton('📖 Manual', openManual))

const undoButton = createButton('Desfazer', () => {
  if (gameMode === 'bot') {
    // Nunca desfazemos o movimento do robô. Só aceitamos o comando durante
    // a pausa de pensamento, quando o último lance ainda é o do jogador.
    if (!botThinking || game.turn() !== 'b' || game.history().length === 0) return
    cancelBotTimer()
    botThinking = false
    game.undo()
  } else if (game.history().length > 0) {
    game.undo()
  } else {
    return
  }

  selectedSquare = null
  syncLastMoveFromHistory()
  refreshHighlights()
  renderPieces()
  updateInterface()
})
controls.appendChild(undoButton)

controls.appendChild(createButton('Nova partida', () => {
  const confirmed = window.confirm('Deseja reiniciar a partida? O histórico atual será apagado.')
  if (!confirmed) return
  cancelBotTimer()
  botThinking = false
  game.reset()
  selectedSquare = null
  lastMove = null
  moveAnimation = null
  animateLastMove = false
  pendingPromotion = null
  promotionOverlay.style.display = 'none'
  finishOverlay.style.display = 'none'
  clearHighlights()
  renderPieces()
  updateInterface()
}))

controls.appendChild(createButton('Girar tabuleiro', () => {
  boardRotationTarget = boardRotationTarget === 0 ? Math.PI : 0
}))

const soundButton = createButton('Som: ligado', () => {
  soundEnabled = !soundEnabled
  soundButton.textContent = soundEnabled ? 'Som: ligado' : 'Som: desligado'
  if (soundEnabled) playTone(520, 0.06, 'sine', 0.025)
})
controls.appendChild(soundButton)

const qualityButton = createButton('Qualidade: alta', () => {
  highQuality = !highQuality
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, highQuality ? 2 : 1))
  renderer.shadowMap.enabled = highQuality
  directionalLight.castShadow = highQuality
  qualityButton.textContent = highQuality ? 'Qualidade: alta' : 'Qualidade: econômica'
})
controls.appendChild(qualityButton)

// ======================================================
// 14. ANIMAÇÃO E REDIMENSIONAMENTO
// ======================================================

function animate() {
  requestAnimationFrame(animate)
  const rotationGroups = [boardGroup, pieceGroup, highlightGroup]
  for (const group of rotationGroups) {
    const delta = boardRotationTarget - group.rotation.y
    if (Math.abs(delta) > 0.001) group.rotation.y += delta * 0.12
    else group.rotation.y = boardRotationTarget
  }
  if (moveAnimation) {
    const progress = Math.min(1, (performance.now() - moveAnimation.startedAt) / moveAnimation.duration)
    const eased = 1 - Math.pow(1 - progress, 3)
    moveAnimation.piece.position.x = moveAnimation.from.x + (moveAnimation.to.x - moveAnimation.from.x) * eased
    moveAnimation.piece.position.z = moveAnimation.from.z + (moveAnimation.to.z - moveAnimation.from.z) * eased
    moveAnimation.piece.position.y = Math.sin(progress * Math.PI) * 0.16
    if (progress >= 1) {
      moveAnimation.piece.position.y = 0
      moveAnimation = null
    }
  }
  renderer.render(scene, camera)
}

renderPieces()
updateInterface()
animate()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, highQuality ? 2 : 1))
  const narrow = window.innerWidth < 760
  camera.position.set(narrow ? 8.8 : 7.7, narrow ? 11.1 : 9.6, narrow ? 12.1 : 10.8)
  camera.lookAt(0, 0, 0)
})
