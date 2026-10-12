
import * as THREE from 'three'
import { Chess } from 'chess.js'
import './style.css'

// ======================================================
// 1. CONFIGURAÇÃO DO JOGO
// chess.js controla as regras oficiais do xadrez.
// Three.js desenha o tabuleiro e as peças em 3D.
// ======================================================

const game = new Chess()

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x20232a)

const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  100
)

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
// 2. INTERFACE
// Cria os controles e as informações da partida.
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

function createButton(label, onClick) {
  const button = document.createElement('button')
  button.textContent = label

  Object.assign(button.style, {
    border: '1px solid #656b75',
    borderRadius: '8px',
    padding: '10px 13px',
    background: '#292e37',
    color: '#ffffff',
    fontSize: '14px',
    cursor: 'pointer',
    pointerEvents: 'auto',
  })

  button.addEventListener('click', onClick)
  button.addEventListener('mouseenter', () => {
    button.style.background = '#414957'
  })
  button.addEventListener('mouseleave', () => {
    button.style.background = '#292e37'
  })

  return button
}

// Painel superior.
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

// Nome do jogo.
const title = document.createElement('div')
title.textContent = 'XADREZ 3D'

Object.assign(title.style, {
  fontSize: '20px',
  fontWeight: '700',
  letterSpacing: '2px',
  textShadow: '0 2px 8px #000000',
})

topPanel.appendChild(title)

// Botões do lado direito.
const controls = document.createElement('div')

Object.assign(controls.style, {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  alignItems: 'center',
  pointerEvents: 'auto',
})

topPanel.appendChild(controls)

// Indicador de turno.
const turnLabel = document.createElement('div')

Object.assign(turnLabel.style, {
  position: 'absolute',
  top: '76px',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '10px 16px',
  borderRadius: '10px',
  background: 'rgba(15, 18, 23, 0.88)',
  border: '1px solid #4a515d',
  fontSize: '15px',
  fontWeight: '600',
  whiteSpace: 'nowrap',
})

ui.appendChild(turnLabel)

// Histórico das jogadas.
const historyPanel = document.createElement('div')

Object.assign(historyPanel.style, {
  position: 'absolute',
  left: '16px',
  bottom: '16px',
  width: 'min(260px, calc(100vw - 32px))',
  maxHeight: '150px',
  overflowY: 'auto',
  boxSizing: 'border-box',
  padding: '12px',
  borderRadius: '10px',
  background: 'rgba(15, 18, 23, 0.9)',
  border: '1px solid #4a515d',
  fontSize: '13px',
  lineHeight: '1.7',
})

ui.appendChild(historyPanel)

// Mensagens de estado.
const messageLabel = document.createElement('div')

Object.assign(messageLabel.style, {
  position: 'absolute',
  right: '16px',
  bottom: '16px',
  maxWidth: 'min(300px, calc(100vw - 32px))',
  padding: '12px',
  borderRadius: '10px',
  background: 'rgba(15, 18, 23, 0.9)',
  fontSize: '13px',
  lineHeight: '1.5',
  textAlign: 'right',
})

ui.appendChild(messageLabel)

// ======================================================
// 3. MANUAL
// O botão abre e fecha um painel com regras básicas.
// ======================================================

const manualOverlay = document.createElement('div')

Object.assign(manualOverlay.style, {
  display: 'none',
  position: 'fixed',
  inset: '0',
  zIndex: '20',
  background: 'rgba(0, 0, 0, 0.72)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '16px',
  boxSizing: 'border-box',
  pointerEvents: 'auto',
})

document.body.appendChild(manualOverlay)

const manualPanel = document.createElement('div')

Object.assign(manualPanel.style, {
  width: 'min(650px, 100%)',
  maxHeight: '85vh',
  overflowY: 'auto',
  boxSizing: 'border-box',
  padding: '24px',
  borderRadius: '14px',
  background: '#202630',
  border: '1px solid #555e6b',
  color: '#f3f4f6',
  fontFamily: 'Arial, sans-serif',
  lineHeight: '1.65',
})

manualOverlay.appendChild(manualPanel)

const manualHeader = document.createElement('div')

Object.assign(manualHeader.style, {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
})

manualPanel.appendChild(manualHeader)

const manualTitle = document.createElement('h2')
manualTitle.textContent = 'Manual do xadrez'
manualTitle.style.marginTop = '0'
manualHeader.appendChild(manualTitle)

const closeManualButton = createButton('Fechar', () => {
  manualOverlay.style.display = 'none'
})

manualHeader.appendChild(closeManualButton)

const manualContent = document.createElement('div')

manualContent.innerHTML = `
  <h3>Objetivo do jogo</h3>
  <p>O objetivo é dar xeque-mate no rei adversário: atacar o rei de modo que ele não possa escapar, bloquear o ataque ou capturar a peça atacante.</p>

  <h3>Como as peças se movimentam</h3>
  <ul>
    <li><strong>Peão:</strong> avança uma casa; no primeiro movimento, pode avançar duas. Captura na diagonal.</li>
    <li><strong>Torre:</strong> move-se em linhas retas, horizontal ou verticalmente.</li>
    <li><strong>Cavalo:</strong> move-se em formato de L e pode saltar sobre outras peças.</li>
    <li><strong>Bispo:</strong> move-se pelas diagonais.</li>
    <li><strong>Dama:</strong> move-se em linhas retas e diagonais.</li>
    <li><strong>Rei:</strong> move-se uma casa em qualquer direção, desde que não fique em xeque.</li>
  </ul>

  <h3>Regras importantes</h3>
  <ul>
    <li>As brancas fazem o primeiro movimento.</li>
    <li>Os jogadores alternam os turnos.</li>
    <li>Não é permitido deixar o próprio rei em xeque.</li>
    <li><strong>Roque:</strong> movimento especial entre o rei e uma torre, quando as condições são satisfeitas.</li>
    <li><strong>En passant:</strong> captura especial de peão que só pode ocorrer imediatamente após determinado avanço de dois passos de um peão adversário.</li>
    <li><strong>Promoção:</strong> um peão que chega à última fileira deve ser promovido, normalmente a uma dama.</li>
    <li><strong>Empate:</strong> pode ocorrer, por exemplo, por afogamento, repetição de posição ou falta de material suficiente para dar mate.</li>
  </ul>

  <h3>Como jogar neste projeto</h3>
  <ol>
    <li>Clique em uma peça da cor que está jogando.</li>
    <li>As casas legais aparecem destacadas em verde.</li>
    <li>Clique na casa de destino para confirmar o movimento.</li>
    <li>Use “Desfazer” para voltar uma jogada ou “Nova partida” para recomeçar.</li>
  </ol>

  <p>Este jogo valida os movimentos usando a biblioteca chess.js. As peças 3D são representações visuais simplificadas.</p>
`

manualPanel.appendChild(manualContent)

function openManual() {
  manualOverlay.style.display = 'flex'
}

manualOverlay.addEventListener('click', (event) => {
  if (event.target === manualOverlay) {
    manualOverlay.style.display = 'none'
  }
})

// ======================================================
// 4. ILUMINAÇÃO
// ======================================================

scene.add(new THREE.AmbientLight(0xffffff, 1.8))

const directionalLight = new THREE.DirectionalLight(0xffffff, 3)
directionalLight.position.set(5, 10, 6)
directionalLight.castShadow = true
scene.add(directionalLight)

// ======================================================
// 5. TABULEIRO 3D
// As casas recebem coordenadas como a1, e4 e h8.
// ======================================================

const boardGroup = new THREE.Group()
scene.add(boardGroup)

const squareGeometry = new THREE.BoxGeometry(1, 0.2, 1)

const lightSquareMaterial = new THREE.MeshStandardMaterial({
  color: 0xe8d5b7,
  roughness: 0.8,
})

const darkSquareMaterial = new THREE.MeshStandardMaterial({
  color: 0x65452f,
  roughness: 0.8,
})

const squareMeshes = new Map()

function squareToPosition(square) {
  const col = square.charCodeAt(0) - 97
  const rank = Number(square[1])

  return {
    x: col - 3.5,
    z: 4.5 - rank,
  }
}

function createBoard() {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = new THREE.Mesh(
        squareGeometry,
        (row + col) % 2 === 0
          ? darkSquareMaterial
          : lightSquareMaterial
      )

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
// 6. PEÇAS 3D
// Cada peça é identificada pela casa e pelo tipo no jogo.
// ======================================================

const pieceGroup = new THREE.Group()
scene.add(pieceGroup)

const whiteMaterial = new THREE.MeshStandardMaterial({
  color: 0xf5f0e6,
  roughness: 0.35,
  metalness: 0.05,
})

const blackMaterial = new THREE.MeshStandardMaterial({
  color: 0x252525,
  roughness: 0.35,
  metalness: 0.1,
})

const pieceBaseGeometry = new THREE.CylinderGeometry(
  0.3, 0.35, 0.12, 32
)

const pieceStemGeometry = new THREE.CylinderGeometry(
  0.12, 0.22, 0.35, 24
)

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

  // A parte superior diferencia visualmente os tipos de peça.
  let topGeometry

  switch (type) {
    case 'p':
      topGeometry = new THREE.SphereGeometry(0.16, 24, 16)
      break
    case 'r':
      topGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.25, 8)
      break
    case 'n':
      topGeometry = new THREE.OctahedronGeometry(0.23)
      break
    case 'b':
      topGeometry = new THREE.ConeGeometry(0.2, 0.4, 24)
      break
    case 'q':
      topGeometry = new THREE.SphereGeometry(0.23, 24, 16)
      break
    case 'k':
      topGeometry = new THREE.ConeGeometry(0.18, 0.42, 4)
      break
  }

  const top = new THREE.Mesh(topGeometry, material)
  top.position.y = type === 'p' ? 0.62 : 0.72
  top.castShadow = true
  piece.add(top)

  // Um pequeno elemento cruzado distingue o rei da dama.
  if (type === 'k') {
    const cross = new THREE.Group()

    const vertical = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.24, 0.055),
      material
    )

    const horizontal = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.055, 0.055),
      material
    )

    vertical.position.y = 0.96
    horizontal.position.y = 0.98

    cross.add(vertical, horizontal)
    piece.add(cross)
  }

  const position = squareToPosition(square)
  piece.position.set(position.x, 0, position.z)

  // A casa é usada para identificar a peça durante os cliques.
  piece.userData = {
    square,
    type,
    color,
  }

  return piece
}

function renderPieces() {
  // Remove as representações antigas antes de desenhar o estado atual.
  while (pieceGroup.children.length > 0) {
    pieceGroup.remove(pieceGroup.children[0])
  }

  const position = game.board()

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const chessPiece = position[row][col]
      if (!chessPiece) continue

      const square =
        String.fromCharCode(97 + col) + (8 - row)

      const mesh = createPieceMesh(
        chessPiece.type,
        chessPiece.color,
        square
      )

      pieceGroup.add(mesh)
    }
  }
}

// ======================================================
// 7. CASAS DESTACADAS
// Mostra os destinos permitidos pela biblioteca de xadrez.
// ======================================================

const highlightGroup = new THREE.Group()
scene.add(highlightGroup)

const moveHighlightMaterial = new THREE.MeshBasicMaterial({
  color: 0x20e85a,
  transparent: true,
  opacity: 0.65,
  depthWrite: false,
})

const selectedMaterial = new THREE.MeshBasicMaterial({
  color: 0x4a90e2,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
})

const highlightGeometry = new THREE.BoxGeometry(0.88, 0.025, 0.88)

let selectedSquare = null

function clearHighlights() {
  while (highlightGroup.children.length > 0) {
    highlightGroup.remove(highlightGroup.children[0])
  }
}

function addHighlight(square, material, kind) {
  const position = squareToPosition(square)

  const highlight = new THREE.Mesh(highlightGeometry, material)
  highlight.position.set(position.x, 0.115, position.z)

  highlight.userData = {
    square,
    kind,
  }

  highlightGroup.add(highlight)
}

function showLegalMoves(square) {
  clearHighlights()

  addHighlight(square, selectedMaterial, 'selected')

  const legalMoves = game.moves({
    square,
    verbose: true,
  })

  for (const move of legalMoves) {
    addHighlight(move.to, moveHighlightMaterial, 'move')
  }
}

// ======================================================
// 8. ESTADO DA PARTIDA E MENSAGENS
// Atualiza o turno, o histórico e o resultado.
// ======================================================

function getGameStatus() {
  if (game.isCheckmate()) {
    const winner = game.turn() === 'w' ? 'pretas' : 'brancas'
    return `Xeque-mate! As ${winner} venceram.`
  }

  if (game.isStalemate()) {
    return 'Empate por afogamento.'
  }

  if (game.isThreefoldRepetition()) {
    return 'Empate por repetição de posição.'
  }

  if (game.isInsufficientMaterial()) {
    return 'Empate por material insuficiente.'
  }

  if (game.isDraw()) {
    return 'Partida empatada.'
  }

  if (game.isCheck()) {
    return game.turn() === 'w'
      ? 'Xeque nas brancas!'
      : 'Xeque nas pretas!'
  }

  return ''
}

function updateInterface() {
  const status = getGameStatus()

  if (game.isGameOver()) {
    turnLabel.textContent = status
  } else {
    turnLabel.textContent =
      game.turn() === 'w'
        ? 'Vez das brancas'
        : 'Vez das pretas'

    if (game.isCheck()) {
      turnLabel.textContent += ' — XEQUE'
    }
  }

  messageLabel.textContent = status || 'Selecione uma peça para ver os movimentos.'

  const history = game.history()

  if (history.length === 0) {
    historyPanel.textContent = 'Histórico de jogadas'
  } else {
    const moves = []

    for (let i = 0; i < history.length; i += 2) {
      const number = Math.floor(i / 2) + 1
      const whiteMove = history[i]
      const blackMove = history[i + 1] || ''

      moves.push(`${number}. ${whiteMove}   ${blackMove}`)
    }

    historyPanel.textContent = moves.join('\n')
    historyPanel.style.whiteSpace = 'pre-wrap'
  }
}

// ======================================================
// 9. MOVIMENTAÇÃO
// chess.js valida cada movimento antes de alterar a partida.
// ======================================================

function makeMove(from, to) {
  if (game.isGameOver()) return

  const candidateMoves = game.moves({
    square: from,
    verbose: true,
  })

  const move = candidateMoves.find((item) => item.to === to)

  if (!move) return

  let promotion

  if (move.flags.includes('p')) {
    const answer = window.prompt(
      'Promoção do peão: escolha dama (q), torre (r), bispo (b) ou cavalo (n).',
      'q'
    )

    const choice = (answer || 'q').toLowerCase()
    promotion = ['q', 'r', 'b', 'n'].includes(choice) ? choice : 'q'
  }

  try {
    game.move({
      from,
      to,
      ...(promotion ? { promotion } : {}),
    })
  } catch (error) {
    console.error('Movimento não realizado:', error)
    return
  }

  selectedSquare = null
  clearHighlights()
  renderPieces()
  updateInterface()
}

// ======================================================
// 10. SELEÇÃO POR CLIQUE
// Seleciona peças e move para destinos legais.
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

  while (object.parent && object.parent !== pieceGroup) {
    object = object.parent
  }

  return object.userData.square ? object : null
}

function findSquareHit() {
  const hits = raycaster.intersectObjects(boardGroup.children, false)

  if (hits.length === 0) return null

  return hits[0].object.userData.square || null
}

function handleBoardClick(event) {
  // Não deixa jogar enquanto o manual está aberto.
  if (manualOverlay.style.display === 'flex') return
  if (game.isGameOver()) return

  updatePointer(event)

  const clickedPiece = findPieceHit()

  if (clickedPiece) {
    const targetSquare = clickedPiece.userData.square

    // Se uma peça está selecionada, tenta capturar a peça clicada.
    if (selectedSquare) {
      const legalMoves = game.moves({
        square: selectedSquare,
        verbose: true,
      })

      const canMoveThere = legalMoves.some(
        (move) => move.to === targetSquare
      )

      if (canMoveThere) {
        makeMove(selectedSquare, targetSquare)
        return
      }
    }

    // Só permite selecionar uma peça da cor que tem a vez.
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

  // Se o clique foi numa casa vazia, tenta mover para ela.
  const clickedSquare = findSquareHit()

  if (selectedSquare && clickedSquare) {
    const legalMoves = game.moves({
      square: selectedSquare,
      verbose: true,
    })

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
// 11. CONTROLES
// Reiniciar, desfazer e abrir o manual.
// ======================================================

controls.appendChild(
  createButton('📖 Manual', openManual)
)

controls.appendChild(
  createButton('Desfazer', () => {
    const undoneMove = game.undo()

    if (undoneMove) {
      selectedSquare = null
      clearHighlights()
      renderPieces()
      updateInterface()
    }
  })
)

controls.appendChild(
  createButton('Nova partida', () => {
    const confirmed = window.confirm(
      'Deseja reiniciar a partida? O histórico atual será apagado.'
    )

    if (!confirmed) return

    game.reset()
    selectedSquare = null
    clearHighlights()
    renderPieces()
    updateInterface()
  })
)

// ======================================================
// 12. ANIMAÇÃO
// Renderiza a cena 3D continuamente.
// ======================================================

function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}

renderPieces()
updateInterface()
animate()

// ======================================================
// 13. REDIMENSIONAMENTO
// Mantém a câmera e o renderizador proporcionais à janela.
// ======================================================

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})