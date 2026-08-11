const stages = [...document.querySelectorAll('.stage')];
const navLinks = [...document.querySelectorAll('.quest-nav a')];
const counter = document.querySelector('.level-counter');
const character = document.querySelector('.game-character');
const characterBody = document.querySelector('.character-body');
const clickTarget = document.querySelector('.click-target');
const guideButton = document.querySelector('.guide-button');
const speedControl = document.querySelector('#movement-speed');
const speedValue = document.querySelector('.speed-value');
const themeToggle = document.querySelector('.theme-toggle');
const themeLabel = document.querySelector('.theme-toggle-label');
const themeColor = document.querySelector('meta[name="theme-color"]');
const desktop = window.matchMedia('(min-width: 901px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const WALK_SPEED = 165;
const RUN_SPEED = 310;
const CHARACTER_WIDTH = 56;
const CHARACTER_HEIGHT = 116;

let activeIndex = 0;
let guideBusy = false;
let animationFrame = 0;
let lastFrameTime = performance.now();
let speedMultiplier = 1.5;
let lastObservedIndex = 0;
let characterEffect = null;
let wheelBusy = false;
let scrollTransitionToken = 0;
let booting = true;

const movement = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  moving: false,
  running: false,
  token: 0,
  resolve: null,
};

document.body.classList.add('game-ready');

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function boundsForPosition(x, y) {
  return {
    x: clamp(x, 8, window.innerWidth - CHARACTER_WIDTH - 8),
    y: clamp(y, window.scrollY + 76, window.scrollY + window.innerHeight - CHARACTER_HEIGHT - 8),
  };
}

function renderCharacter() {
  character.style.transform = `translate3d(${movement.x}px, ${movement.y}px, 0)`;
}

function setDirection(dx, dy) {
  let direction;
  if (dy < 0 && Math.abs(dy) >= Math.abs(dx) * 0.35) direction = 'up';
  else if (dy > 0 && Math.abs(dy) >= Math.abs(dx) * 0.35) direction = 'down';
  else if (Math.abs(dx) > Math.abs(dy)) direction = dx < 0 ? 'left' : 'right';
  else direction = dy < 0 ? 'up' : 'down';

  character.classList.remove('direction-down', 'direction-right', 'direction-left', 'direction-up', 'direction-up-left');
  character.classList.add(`direction-${direction}`);
  if (direction === 'up' && dx < 0) character.classList.add('direction-up-left');
}

function finishMovement(token) {
  if (token !== movement.token) return;
  movement.moving = false;
  movement.running = false;
  character.classList.remove('is-moving', 'is-running');
  const resolve = movement.resolve;
  movement.resolve = null;
  resolve?.();
}

function animationLoop(now) {
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;

  if (movement.moving) {
    const dx = movement.targetX - movement.x;
    const dy = movement.targetY - movement.y;
    const distance = Math.hypot(dx, dy);
    const baseSpeed = movement.running ? RUN_SPEED : WALK_SPEED;
    const speed = reducedMotion.matches ? 5000 : baseSpeed * speedMultiplier;
    const step = speed * dt;

    if (distance <= step || distance < 0.75) {
      movement.x = movement.targetX;
      movement.y = movement.targetY;
      renderCharacter();
      finishMovement(movement.token);
    } else {
      movement.x += (dx / distance) * step;
      movement.y += (dy / distance) * step;
      renderCharacter();
    }
  }

  animationFrame = requestAnimationFrame(animationLoop);
}

function setCharacterPosition(x, y, clampToViewport = true) {
  const next = clampToViewport ? boundsForPosition(x, y) : { x, y };
  movement.token += 1;
  movement.resolve?.();
  movement.resolve = null;
  movement.x = next.x;
  movement.y = next.y;
  movement.targetX = next.x;
  movement.targetY = next.y;
  movement.moving = false;
  movement.running = false;
  character.classList.remove('is-moving', 'is-running');
  renderCharacter();
}

function startingPosition() {
  const spawn = document.querySelector('.spawn-marker')?.getBoundingClientRect();
  if (!spawn || !desktop.matches) return;
  setCharacterPosition(
    spawn.left + window.scrollX + spawn.width / 2 - CHARACTER_WIDTH / 2,
    spawn.top + window.scrollY - CHARACTER_HEIGHT + 12,
    false,
  );
  character.classList.remove('direction-right', 'direction-left', 'direction-up');
  character.classList.add('direction-down');
}

function resetCharacterEffect() {
  characterEffect?.cancel();
  characterEffect = null;
  characterBody.style.removeProperty('opacity');
  characterBody.style.removeProperty('transform');
  characterBody.style.removeProperty('filter');
}

function playSpawnAnimation() {
  resetCharacterEffect();
  character.classList.remove('is-hidden', 'is-vanishing');
  character.classList.add('is-jumping');

  if (reducedMotion.matches) {
    character.classList.remove('is-jumping');
    return Promise.resolve();
  }

  const effect = characterBody.animate(
    [
      { opacity: 0, transform: 'translateY(-58px) scale(0.58) rotate(-8deg)', filter: 'blur(8px) brightness(1.9)' },
      { opacity: 1, transform: 'translateY(10px) scale(1.08) rotate(2deg)', filter: 'blur(0) brightness(1.25)', offset: 0.62 },
      { opacity: 1, transform: 'translateY(0) scale(1) rotate(0)', filter: 'none' },
    ],
    { duration: 720, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' },
  );
  characterEffect = effect;

  return effect.finished.catch(() => undefined).then(() => {
    if (characterEffect !== effect) return;
    resetCharacterEffect();
    character.classList.remove('is-jumping');
  });
}

function jumpAndVanish() {
  resetCharacterEffect();
  character.classList.add('is-jumping', 'is-vanishing');

  if (reducedMotion.matches) {
    character.classList.add('is-hidden');
    character.classList.remove('is-jumping', 'is-vanishing');
    return Promise.resolve();
  }

  const effect = characterBody.animate(
    [
      { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'none' },
      { opacity: 1, transform: 'translateY(-88px) scale(1.06) rotate(5deg)', filter: 'brightness(1.15)', offset: 0.48 },
      { opacity: 0, transform: 'translateY(-34px) scale(0.66) rotate(18deg)', filter: 'blur(7px) brightness(1.8)' },
    ],
    { duration: 520, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)', fill: 'forwards' },
  );
  characterEffect = effect;

  return effect.finished.catch(() => undefined).then(() => {
    if (characterEffect !== effect) return;
    character.classList.add('is-hidden');
    character.classList.remove('is-jumping', 'is-vanishing');
  });
}

function spawnAtCheckpoint(index) {
  if (!desktop.matches) return;
  if (index === 0) {
    startingPosition();
    playSpawnAnimation();
    return;
  }

  const stage = stages[index];
  const checkpoint = stage.querySelector('.checkpoint-marker');
  if (!checkpoint) return;
  const rect = checkpoint.getBoundingClientRect();
  setCharacterPosition(
    rect.left + window.scrollX + rect.width / 2 - CHARACTER_WIDTH / 2,
    rect.bottom + window.scrollY - CHARACTER_HEIGHT - 58,
    false,
  );
  character.classList.remove('direction-right', 'direction-left', 'direction-up');
  character.classList.add('direction-down');
  playSpawnAnimation();
}

async function respawnAfterScroll(index) {
  const token = ++scrollTransitionToken;
  if (guideBusy) return;

  await jumpAndVanish();
  if (token !== scrollTransitionToken || guideBusy) return;

  spawnAtCheckpoint(index);
}

function moveCharacter(x, y, running = false) {
  if (!desktop.matches) return Promise.resolve();

  const target = boundsForPosition(x, y);
  const dx = target.x - movement.x;
  const dy = target.y - movement.y;

  if (Math.hypot(dx, dy) < 1) return Promise.resolve();

  movement.token += 1;
  const token = movement.token;
  movement.resolve?.();
  movement.targetX = target.x;
  movement.targetY = target.y;
  movement.moving = true;
  movement.running = running;
  setDirection(dx, dy);
  character.classList.add('is-moving');
  character.classList.toggle('is-running', running);

  return new Promise((resolve) => {
    movement.resolve = resolve;
    if (reducedMotion.matches) {
      movement.x = target.x;
      movement.y = target.y;
      renderCharacter();
      finishMovement(token);
    }
  });
}

function showClickTarget(x, y) {
  clickTarget.style.transform = `translate3d(${x - 12}px, ${y - 12}px, 0)`;
  clickTarget.classList.remove('is-visible');
  void clickTarget.offsetWidth;
  clickTarget.classList.add('is-visible');
}

function setActiveStage(index) {
  activeIndex = index;
  counter.textContent = `Level ${index + 1}/${stages.length}`;
  navLinks.forEach((link) => {
    link.classList.toggle('is-active', link.getAttribute('href') === `#${stages[index].id}`);
  });

  const finished = index === stages.length - 1;
  guideButton.disabled = finished;
  guideButton.querySelector('.guide-label').textContent = finished ? 'Route complete' : 'Next checkpoint';
  guideButton.dataset.label = finished ? 'Route complete' : 'Next checkpoint';
  guideButton.setAttribute('aria-label', finished ? 'Final checkpoint reached' : 'Travel to the next checkpoint');
}

function revealCheckpoint(stage) {
  stages.forEach((item) => {
    if (item !== stage) item.querySelector('.checkpoint-panel')?.classList.remove('is-revealed');
  });
  stage.querySelector('.checkpoint-panel')?.classList.add('is-revealed');
  stage.querySelector('.checkpoint-marker')?.classList.add('is-reached');
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, reducedMotion.matches ? 1 : milliseconds));
}

async function travelToStage(nextIndex) {
  const nextStage = stages[nextIndex];
  const movingDown = nextIndex > activeIndex;

  setDirection(0, movingDown ? 1 : -1);
  await jumpAndVanish();
  nextStage.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  await wait(760);

  setActiveStage(nextIndex);
  lastObservedIndex = nextIndex;
  window.history.replaceState(null, '', `#${nextStage.id}`);

  const checkpoint = nextStage.querySelector('.checkpoint-marker');
  if (checkpoint) {
    const rect = checkpoint.getBoundingClientRect();
    setCharacterPosition(
      rect.left + window.scrollX + rect.width / 2 - CHARACTER_WIDTH / 2,
      rect.bottom + window.scrollY - CHARACTER_HEIGHT - 58,
      false,
    );
    character.classList.remove('direction-right', 'direction-left', 'direction-up');
    character.classList.add('direction-down');
    revealCheckpoint(nextStage);
    await playSpawnAnimation();
  }
}

async function guideToNextCheckpoint() {
  if (!desktop.matches || guideBusy || activeIndex >= stages.length - 1) return;

  guideBusy = true;
  guideButton.classList.add('is-travelling');
  guideButton.disabled = true;

  await travelToStage(activeIndex + 1);

  guideBusy = false;
  guideButton.classList.remove('is-travelling');
  guideButton.disabled = activeIndex === stages.length - 1;
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
  themeLabel.textContent = isDark ? 'Dark' : 'Light';
  themeColor.setAttribute('content', isDark ? '#171816' : '#f1f0e9');
}

speedControl.addEventListener('input', () => {
  speedMultiplier = Number(speedControl.value);
  speedValue.textContent = `${speedMultiplier.toFixed(2)}x`;
});

themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  try {
    localStorage.setItem('portfolio-theme', nextTheme);
  } catch {
    // Theme still works when storage is unavailable.
  }
});

document.querySelectorAll('.checkpoint-panel').forEach((panel) => {
  panel.addEventListener('pointermove', (event) => {
    if (!desktop.matches || reducedMotion.matches) return;
    const rect = panel.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    panel.style.setProperty('--tilt-x', `${(0.5 - y) * 7}deg`);
    panel.style.setProperty('--tilt-y', `${(x - 0.5) * 8}deg`);
    panel.style.setProperty('--spot-x', `${x * 100}%`);
    panel.style.setProperty('--spot-y', `${y * 100}%`);
    panel.classList.add('is-pointer-active');
  });

  panel.addEventListener('pointerleave', () => {
    panel.style.setProperty('--tilt-x', '0deg');
    panel.style.setProperty('--tilt-y', '0deg');
    panel.classList.remove('is-pointer-active');
  });
});

document.addEventListener('pointerdown', (event) => {
  if (!desktop.matches || guideBusy || event.button !== 0) return;
  if (event.target.closest('button, a, .topbar')) return;

  const root = document.documentElement;
  const clickedVerticalScrollbar = event.clientX >= root.clientWidth;
  const clickedHorizontalScrollbar = event.clientY >= root.clientHeight;
  const clickedScrollbarEdge = event.clientX >= window.innerWidth - 20 || event.clientY >= window.innerHeight - 20;
  if (clickedVerticalScrollbar || clickedHorizontalScrollbar || clickedScrollbarEdge) return;

  showClickTarget(event.clientX, event.clientY);
  moveCharacter(
    event.clientX + window.scrollX - CHARACTER_WIDTH / 2,
    event.clientY + window.scrollY - CHARACTER_HEIGHT + 12,
    event.detail > 1,
  );
});

window.addEventListener('wheel', (event) => {
  if (!desktop.matches || guideBusy || wheelBusy || Math.abs(event.deltaY) < 8) return;

  const direction = event.deltaY > 0 ? 1 : -1;
  const nextIndex = clamp(activeIndex + direction, 0, stages.length - 1);
  if (nextIndex === activeIndex) return;

  event.preventDefault();
  wheelBusy = true;
  stages[nextIndex].scrollIntoView({ behavior: 'auto', block: 'start' });
  window.setTimeout(() => {
    wheelBusy = false;
  }, 520);
}, { passive: false });

guideButton.addEventListener('click', guideToNextCheckpoint);

navLinks.forEach((link) => {
  link.addEventListener('click', async (event) => {
    if (!desktop.matches || guideBusy) return;
    event.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    const targetIndex = stages.indexOf(target);
    if (targetIndex < 0) return;

    guideBusy = true;
    guideButton.disabled = true;
    await travelToStage(targetIndex);
    guideBusy = false;
    guideButton.disabled = targetIndex === stages.length - 1;
  });
});

document.querySelector('.brand').addEventListener('click', () => {
  stages.forEach((stage) => stage.querySelector('.checkpoint-panel')?.classList.remove('is-revealed'));
  scrollTransitionToken += 1;
  resetCharacterEffect();
  character.classList.remove('is-hidden', 'is-vanishing', 'is-jumping');
  lastObservedIndex = 0;
  setActiveStage(0);
  window.setTimeout(startingPosition, reducedMotion.matches ? 1 : 520);
});

const stageObserver = new IntersectionObserver(
  (entries) => {
    if (booting || guideBusy) return;
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const index = stages.indexOf(visible.target);
    if (index < 0) return;
    setActiveStage(index);
    if (index !== lastObservedIndex) {
      lastObservedIndex = index;
      if (index > 0) revealCheckpoint(stages[index]);
      respawnAfterScroll(index);
    }
  },
  { threshold: [0.45, 0.65] },
);

stages.forEach((stage) => stageObserver.observe(stage));

desktop.addEventListener('change', () => {
  if (desktop.matches) startingPosition();
});

window.addEventListener('resize', () => {
  if (desktop.matches && activeIndex === 0 && !movement.moving) startingPosition();
});

try {
  applyTheme(localStorage.getItem('portfolio-theme') || 'dark');
} catch {
  applyTheme('dark');
}

function resetToIntroAfterLoad() {
  booting = true;
  scrollTransitionToken += 1;
  resetCharacterEffect();
  character.classList.remove('is-hidden', 'is-vanishing', 'is-jumping');
  window.history.replaceState(null, '', '#intro');
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  startingPosition();
  lastObservedIndex = 0;
  setActiveStage(0);
  window.setTimeout(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    startingPosition();
    booting = false;
  }, 80);
}

resetToIntroAfterLoad();
window.addEventListener('load', resetToIntroAfterLoad, { once: true });
animationFrame = requestAnimationFrame(animationLoop);

window.addEventListener('pagehide', () => cancelAnimationFrame(animationFrame), { once: true });
