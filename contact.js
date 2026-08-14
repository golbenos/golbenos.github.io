const themeToggle = document.querySelector('.theme-toggle');
const themeLabel = document.querySelector('.theme-toggle-label');
const themeColor = document.querySelector('meta[name="theme-color"]');
const contactForm = document.querySelector('#contact-form');
const formNote = document.querySelector('#form-note');
const contactEmail = 'contact@aymanemaach.me';

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

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!contactForm.reportValidity()) return;

  const data = new FormData(contactForm);
  const name = String(data.get('name') || '').trim();
  const email = String(data.get('email') || '').trim();
  const projectType = String(data.get('projectType') || '').trim();
  const message = String(data.get('message') || '').trim();

  const subject = `Portfolio contact from ${name}`;
  const body = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Project type: ${projectType}`,
    '',
    'Message:',
    message,
  ].join('\n');

  window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  if (formNote) {
    formNote.textContent = 'Email prepared. If your email app did not open, check the contact email setting.';
  }
});
