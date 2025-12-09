import * as THREE from "three";
import { Game } from "./game.js";
import * as Towers from "./towers.js";

let game = null;

const canvasContainer = document.getElementById('canvas-container');
canvasContainer.addEventListener('focusout', () => {
  if (game) {
    game.state.paused = true;
  }
});
canvasContainer.addEventListener('focusin', () => {
  if (game) {
    game.state.paused = false;
  }
});

const menuScreen = document.getElementById('menu-screen');
const uiOverlay = document.getElementById('ui-overlay');
const controls = document.getElementById('controls');
const towerSelection = document.getElementById('tower-selection');
const gameOverScreen = document.getElementById('game-over-screen');

const modeButton = document.getElementById('mode-button');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const menuButton = document.getElementById('menu-button');
const gameOverMenuButton = document.getElementById('game-over-menu-button');
const restartButton = document.getElementById('restart-button');

const basicTowerButton = document.getElementById('basic-tower-button');
basicTowerButton.classList.add('highlighted');
const rangerTowerButton = document.getElementById('ranger-tower-button');
const towerButtons = [basicTowerButton, rangerTowerButton];
let lastClickedButton = basicTowerButton;
towerButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (lastClickedButton) {
      lastClickedButton.classList.remove('highlighted');
    }
    button.classList.add('highlighted');
    lastClickedButton = button;
    const towerType = button.dataset.tower;
    switch (towerType) {
      case Towers.Types.BASIC:
        game.selectedTowerType = Towers.Types.BASIC;
        break;
      case Towers.Types.RANGER:
        game.selectedTowerType = Towers.Types.RANGER;
        break;
    }
  });
});

const uiLives = document.getElementById('ui-lives');
const uiCurrency = document.getElementById('ui-currency');
const uiWave = document.getElementById('ui-wave');
const uiScore = document.getElementById('ui-score');

const finalScore = document.getElementById('final-score');
const wavesCompleted = document.getElementById('waves-completed');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
canvasContainer.appendChild(renderer.domElement);
renderer.domElement.addEventListener('click', onMouseClick);

function startGame() {
  const startingLives = parseInt(document.getElementById('starting-lives').value);
  const startingCurrency = parseInt(document.getElementById('starting-currency').value);
  const difficulty = document.getElementById('difficulty').value;

  menuScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';
  canvasContainer.style.display = 'block';
  uiOverlay.style.display = 'block';
  controls.style.display = 'flex';
  towerSelection.style.display = 'flex';

  game = new Game(renderer, startingLives, startingCurrency, difficulty);
  initUI();

  requestAnimationFrame(animate);
}

function animate() {
  requestAnimationFrame(animate);
  if (game === null) {
    return;
  }
  const delta = game.clock.getDelta();
  game.step(delta);
  renderer.render(game.scene, game.camera);
  updateUI();
  if (game.state.gameOver) {
    gameOver();
  }
}

function gameOver() {
  menuScreen.style.display = 'none';
  uiOverlay.style.display = 'none';
  controls.style.display = 'none';
  towerSelection.style.display = 'none';

  game.state.paused = true;
  finalScore.textContent = game.state.score;
  wavesCompleted.textContent = game.state.wave - 1;
  gameOverScreen.style.display = 'block';
}

function initUI() {
  basicTowerButton.textContent = `Basic Tower (${Towers.Basic.Stats.cost})`;
  rangerTowerButton.textContent = `Ranger Tower (${Towers.Ranger.Stats.cost})`;
  updateUI();
}

function updateUI() {
  uiLives.textContent = game.state.lives;
  uiCurrency.textContent = game.state.currency;
  uiWave.textContent = game.state.wave;
  uiScore.textContent = game.state.score;
  modeButton.textContent = `Mode: ${game.renderMode === 'prototype' ? 'Prototype' : 'Fancy'}`;
  pauseButton.textContent = game.state.paused ? 'Unpause' : 'Pause';
}

startButton.addEventListener('click', startGame);

modeButton.addEventListener('click', () => {
  if (game) game.swapRenderMode();
});
pauseButton.addEventListener('click', () => { game.state.paused = !game.state.paused; });
menuButton.addEventListener('click', () => { goToMenu(); });
gameOverMenuButton.addEventListener('click', () => { goToMenu(); });
restartButton.addEventListener('click', () => {
  game = null;
  startGame();
});


function goToMenu() {
  if (!game.state.gameOver) {
    if (!confirm('Return to menu? Your progress will be lost.')) {
      return;
    }
  }
  uiOverlay.style.display = 'none';
  controls.style.display = 'none';
  towerSelection.style.display = 'none';
  gameOverScreen.style.display = 'none';
  canvasContainer.style.display = 'none';
  menuScreen.style.display = 'block';

  game = null;
}

const mouse = new THREE.Vector2();
function onMouseClick(event) {
  if (game === null || game.state.gameOver || game.state.paused) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  game.onMouseClick(mouse);
}

const mouseMove = new THREE.Vector2();
window.addEventListener('mousemove', (event) => {
  if (game === null || game.state.gameOver || game.state.paused) return;
  mouseMove.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouseMove.y = -(event.clientY / window.innerHeight) * 2 + 1;
  game.onMouseMove(mouseMove);
});

window.addEventListener('resize', () => {
  if (game === null) {
    return;
  }
  game.camera.aspect = window.innerWidth / window.innerHeight;
  game.camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

