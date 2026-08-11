const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.primary-nav');
const header = document.querySelector('.site-header');
const hero = document.querySelector('.hero');
const navLinks = [...document.querySelectorAll('.primary-nav a[href^="#"]')];

function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false');
  navigation?.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}

menuButton?.addEventListener('click', () => {
  const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(willOpen));
  navigation.classList.toggle('is-open', willOpen);
  document.body.classList.toggle('menu-open', willOpen);
});

navLinks.forEach((link) => link.addEventListener('click', closeMenu));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

if (hero) {
  const headerObserver = new IntersectionObserver(([entry]) => {
    header?.classList.toggle('is-scrolled', !entry.isIntersecting);
  }, { rootMargin: '-72px 0px 0px', threshold: 0 });
  headerObserver.observe(hero);
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');

if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -40px' });
  revealItems.forEach((item) => revealObserver.observe(item));
}

const sections = document.querySelectorAll('main section[id]');
const activeNavObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  navLinks.forEach((link) => {
    const isCurrent = link.getAttribute('href') === `#${visible.target.id}`;
    if (isCurrent) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}, { rootMargin: '-25% 0px -60%', threshold: [0.05, 0.4] });
sections.forEach((section) => activeNavObserver.observe(section));

const subject = document.querySelector('#subject');
document.querySelectorAll('.event-register').forEach((link) => {
  link.addEventListener('click', () => {
    if (subject) subject.value = 'Upcoming event';
    const message = document.querySelector('#message');
    if (message && !message.value) message.value = `I would like details about ${link.dataset.event}.`;
  });
});

const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');
const requiredFields = form ? [...form.querySelectorAll('[required]')] : [];

function validateField(field) {
  const error = document.querySelector(`#${field.id}-error`);
  let message = '';
  if (!field.value.trim()) message = 'Please complete this field.';
  else if (field.type === 'email' && !field.validity.valid) message = 'Enter a valid email address.';
  field.setAttribute('aria-invalid', String(Boolean(message)));
  if (error) error.textContent = message;
  return !message;
}

requiredFields.forEach((field) => field.addEventListener('blur', () => validateField(field)));

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const valid = requiredFields.map(validateField).every(Boolean);
  if (!valid) {
    requiredFields.find((field) => field.getAttribute('aria-invalid') === 'true')?.focus();
    status.textContent = 'Please review the highlighted fields.';
    return;
  }
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Sending...';
  window.setTimeout(() => {
    form.reset();
    button.disabled = false;
    button.textContent = 'Send Message';
    status.textContent = 'Thanks for reaching out. Our team will be in touch soon.';
    requiredFields.forEach((field) => field.removeAttribute('aria-invalid'));
  }, 650);
});

document.querySelector('#current-year').textContent = new Date().getFullYear();

const privacyDialog = document.querySelector('#privacy-dialog');
document.querySelector('[data-dialog-open]')?.addEventListener('click', () => privacyDialog?.showModal());
document.querySelector('[data-dialog-close]')?.addEventListener('click', () => privacyDialog?.close());
privacyDialog?.addEventListener('click', (event) => {
  if (event.target === privacyDialog) privacyDialog.close();
});
