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

const LEVELS = {
  beginner: { label: 'Iniciante', depth: 0 },
  intermediate: { label: 'Intermediário', depth: 1 },
  advanced: { label: 'Avançado', depth: 2 },
}

const PIECE_VALUES = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 20000 }

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x20232a)

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(7, 9, 10)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

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
  button.textContent = label
  Object.assign(button.style, {
    border: primary ? '1px solid #d9b66e' : '1px solid #656b75',
    borderRadius: '9px',
    padding: '10px 13px',
    background: primary ? '#b58b42' : '#292e37',
    color: primary ? '#17191d' : '#ffffff',
    fontSize: '14px',
    fontWeight: primary ? '700' : '500',
    cursor: 'pointer',
    pointerEvents: 'auto',
    transition: 'background 160ms ease, transform 160ms ease',
  })
  button.addEventListener('mouseenter', () => {
    button.style.background = primary ? '#d0a95e' : '#414957'
    button.style.transform = 'translateY(-1px)'
  })
  button.addEventListener('mouseleave', () => {
    button.style.background = primary ? '#b58b42' : '#292e37'
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
  Object.assign(panel.style, {
    width: `min(${maxWidth}, 100%)`,
    maxHeight: '88vh',
    overflowY: 'auto',
    boxSizing: 'border-box',
    padding: 'clamp(18px, 4vw, 28px)',
    borderRadius: '18px',
    background: 'linear-gradient(145deg, #252d39, #171c24)',
    border: '1px solid #596272',
    boxShadow: '0 24px 80px rgba(0,0,0,.45)',
    color: '#f3f4f6',
    lineHeight: '1.6',
  })
  return panel
}

const topPanel = document.createElement('div')
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
title.textContent = 'XADREZ 3D'
Object.assign(title.style, {
  fontSize: '20px',
  fontWeight: '700',
  letterSpacing: '2px',
  textShadow: '0 2px 8px #000000',
})
topPanel.appendChild(title)

const controls = document.createElement('div')
Object.assign(controls.style, {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  alignItems: 'center',
  pointerEvents: 'auto',
})
topPanel.appendChild(controls)

const turnLabel = document.createElement('div')
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

// ======================================================
// 3. TELA DE ESCOLHA DO MODO E DA DIFICULDADE
// ======================================================

const modeOverlay = createOverlay(30)
modeOverlay.style.display = 'flex'
const modePanel = createModalPanel('680px')
modeOverlay.appendChild(modePanel)

const eyebrow = document.createElement('div')
eyebrow.textContent = 'ESCOLHA COMO JOGAR'
Object.assign(eyebrow.style, {
  color: '#d9b66e',
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
  clearHighlights()
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
  clearHighlights()
  renderPieces()
  modeOverlay.style.display = 'none'
  updateInterface()
}

function createModeCard(icon, heading, description, onClick) {
  const card = document.createElement('button')
  card.type = 'button'
  Object.assign(card.style, {
    display: 'block',
    textAlign: 'left',
    padding: '20px',
    borderRadius: '14px',
    border: '1px solid #596272',
    background: '#202733',
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
    card.style.background = '#2d3746'
    card.style.borderColor = '#d0aa62'
    card.style.transform = 'translateY(-2px)'
  })
  card.addEventListener('mouseleave', () => {
    card.style.background = '#202733'
    card.style.borderColor = '#596272'
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
    background: '#202733',
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
    button.style.background = '#2d3746'
  })
  button.addEventListener('mouseleave', () => {
    button.style.borderColor = '#596272'
    button.style.background = '#202733'
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
// 5. ILUMINAÇÃO
// ======================================================

scene.add(new THREE.AmbientLight(0xffffff, 1.8))
const directionalLight = new THREE.DirectionalLight(0xffffff, 3)
directionalLight.position.set(5, 10, 6)
directionalLight.castShadow = true
scene.add(directionalLight)

// ======================================================
// 6. TABULEIRO 3D
// ======================================================

const boardGroup = new THREE.Group()
scene.add(boardGroup)
const squareGeometry = new THREE.BoxGeometry(1, 0.2, 1)
const lightSquareMaterial = new THREE.MeshStandardMaterial({ color: 0xe8d5b7, roughness: 0.8 })
const darkSquareMaterial = new THREE.MeshStandardMaterial({ color: 0x65452f, roughness: 0.8 })
const squareMeshes = new Map()

function squareToPosition(square) {
  const col = square.charCodeAt(0) - 97
  const rank = Number(square[1])
  return { x: col - 3.5, z: 4.5 - rank }
}

function createBoard() {
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

// ======================================================
// 7. PEÇAS 3D
// ======================================================

const pieceGroup = new THREE.Group()
scene.add(pieceGroup)
const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.35, metalness: 0.05 })
const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x252525, roughness: 0.35, metalness: 0.1 })
const pieceBaseGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.12, 32)
const pieceStemGeometry = new THREE.CylinderGeometry(0.12, 0.22, 0.35, 24)

function createPieceMesh(type, color, square) {
  const material = color === 'w' ? whiteMaterial : blackMaterial
  const piece = new THREE.Group()
  const base = new THREE.Mesh(pieceBaseGeometry, material)
  base.position.y = 0.16
  base.castShadow = true
  piece.add(base)
  const stem = new THREE.Mesh(pieceStemGeometry, material)
  stem.position.y = 0.38
  stem.castShadow = true
  piece.add(stem)

  let topGeometry
  switch (type) {
    case 'p': topGeometry = new THREE.SphereGeometry(0.16, 24, 16); break
    case 'r': topGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.25, 8); break
    case 'n': topGeometry = new THREE.OctahedronGeometry(0.23); break
    case 'b': topGeometry = new THREE.ConeGeometry(0.2, 0.4, 24); break
    case 'q': topGeometry = new THREE.SphereGeometry(0.23, 24, 16); break
    case 'k': topGeometry = new THREE.ConeGeometry(0.18, 0.42, 4); break
    default: topGeometry = new THREE.SphereGeometry(0.16, 24, 16)
  }
  const top = new THREE.Mesh(topGeometry, material)
  top.position.y = type === 'p' ? 0.62 : 0.72
  top.castShadow = true
  piece.add(top)

  if (type === 'k') {
    const cross = new THREE.Group()
    const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.24, 0.055), material)
    const horizontal = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.055, 0.055), material)
    vertical.position.y = 0.96
    horizontal.position.y = 0.98
    cross.add(vertical, horizontal)
    piece.add(cross)
  }

  const position = squareToPosition(square)
  piece.position.set(position.x, 0, position.z)
  piece.userData = { square, type, color }
  return piece
}

function renderPieces() {
  while (pieceGroup.children.length > 0) pieceGroup.remove(pieceGroup.children[0])
  const position = game.board()
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const chessPiece = position[row][col]
      if (!chessPiece) continue
      const square = String.fromCharCode(97 + col) + (8 - row)
      pieceGroup.add(createPieceMesh(chessPiece.type, chessPiece.color, square))
    }
  }
}

// ======================================================
// 8. CASAS DESTACADAS
// ======================================================

const highlightGroup = new THREE.Group()
scene.add(highlightGroup)
const moveHighlightMaterial = new THREE.MeshBasicMaterial({ color: 0x20e85a, transparent: true, opacity: 0.65, depthWrite: false })
const selectedMaterial = new THREE.MeshBasicMaterial({ color: 0x4a90e2, transparent: true, opacity: 0.55, depthWrite: false })
const highlightGeometry = new THREE.BoxGeometry(0.88, 0.025, 0.88)

function clearHighlights() {
  while (highlightGroup.children.length > 0) highlightGroup.remove(highlightGroup.children[0])
}

function addHighlight(square, material, kind) {
  const position = squareToPosition(square)
  const highlight = new THREE.Mesh(highlightGeometry, material)
  highlight.position.set(position.x, 0.115, position.z)
  highlight.userData = { square, kind }
  highlightGroup.add(highlight)
}

function showLegalMoves(square) {
  clearHighlights()
  addHighlight(square, selectedMaterial, 'selected')
  for (const move of game.moves({ square, verbose: true })) addHighlight(move.to, moveHighlightMaterial, 'move')
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

function updateInterface() {
  const status = getGameStatus()
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
  if (history.length === 0) {
    historyPanel.textContent = 'Histórico de jogadas'
  } else {
    const moves = []
    for (let i = 0; i < history.length; i += 2) moves.push(`${Math.floor(i / 2) + 1}. ${history[i]}   ${history[i + 1] || ''}`)
    historyPanel.textContent = `Histórico de jogadas\n${moves.join('\n')}`
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
      if (move) game.move({ from: move.from, to: move.to, ...(move.promotion ? { promotion: move.promotion } : {}) })
    } catch (error) {
      console.error('O robô não conseguiu realizar a jogada:', error)
    }

    botThinking = false
    selectedSquare = null
    clearHighlights()
    renderPieces()
    updateInterface()
  }, 1800)
}

// ======================================================
// 11. MOVIMENTAÇÃO FEITA PELO JOGADOR
// ======================================================

function makeMove(from, to) {
  if (game.isGameOver() || botThinking) return
  if (gameMode === 'bot' && game.turn() !== 'w') return

  const candidateMoves = game.moves({ square: from, verbose: true })
  const move = candidateMoves.find((item) => item.to === to)
  if (!move) return

  let promotion
  if (move.flags.includes('p')) {
    const answer = window.prompt('Promoção do peão: dama (q), torre (r), bispo (b) ou cavalo (n).', 'q')
    const choice = (answer || 'q').toLowerCase()
    promotion = ['q', 'r', 'b', 'n'].includes(choice) ? choice : 'q'
  }

  try {
    game.move({ from, to, ...(promotion ? { promotion } : {}) })
  } catch (error) {
    console.error('Movimento não realizado:', error)
    return
  }

  selectedSquare = null
  clearHighlights()
  renderPieces()
  updateInterface()

  if (gameMode === 'bot' && !game.isGameOver() && game.turn() === 'b') makeBotMove()
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
  if (hits.length === 0) return null
  return hits[0].object.userData.square || null
}

function handleBoardClick(event) {
  if (manualOverlay.style.display === 'flex' || modeOverlay.style.display === 'flex') return
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
      clearHighlights()
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
  clearHighlights()
}
renderer.domElement.addEventListener('pointerdown', handleBoardClick)

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
  clearHighlights()
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
  clearHighlights()
  renderPieces()
  updateInterface()
}))

// ======================================================
// 14. ANIMAÇÃO E REDIMENSIONAMENTO
// ======================================================

function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}

renderPieces()
updateInterface()
animate()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})
