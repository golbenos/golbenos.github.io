const themeToggle = document.querySelector('.theme-toggle');
const themeLabel = document.querySelector('.theme-toggle-label');
const themeColor = document.querySelector('meta[name="theme-color"]');
const cards = [...document.querySelectorAll('.project-card')];

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = theme;
  themeToggle?.setAttribute('aria-pressed', String(isDark));
  themeToggle?.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
  if (themeLabel) themeLabel.textContent = isDark ? 'Dark' : 'Light';
  themeColor?.setAttribute('content', isDark ? '#171816' : '#d9d7ce');
}

try {
  applyTheme(localStorage.getItem('portfolio-theme') || 'dark');
} catch {
  applyTheme('dark');
}

themeToggle?.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  try {
    localStorage.setItem('portfolio-theme', nextTheme);
  } catch {
    // The visual toggle still works if storage is blocked.
  }
});

cards.forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--spot-x', `${x}%`);
    card.style.setProperty('--spot-y', `${y}%`);
  });
});
