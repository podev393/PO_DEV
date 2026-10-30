'use strict';

const SHOTS = {
  desktop: { src: 'assets/images/desktop_view.jpg', alt: 'Savora restaurant website – desktop view' },
  mobile: { src: 'assets/images/mobile_view.jpg', alt: 'Savora restaurant website – mobile view' }
};

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ---------- Navbar: scroll state + mobile menu ---------- */
const nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const setMenu = open => {
  menu.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
};
burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
$$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

/* ---------- Active section indicator ---------- */
const links = $$('.menu a[href^="#"]:not(.nav-cta)');
const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
const spy = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => spy.observe(s));

/* ---------- Scroll reveal ---------- */
const rvEls = $$('.rv');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('show'); io.unobserve(en.target); }
    });
  }, { threshold: .12 });
  rvEls.forEach((el, i) => { el.style.transitionDelay = (i % 4) * 90 + 'ms'; io.observe(el); });
} else {
  rvEls.forEach(el => el.classList.add('show'));
}

/* ---------- Screenshot gallery + lightbox ---------- */
const lb = $('#lightbox'), lbC = $('#lb-c'), lbX = $('#lb-x');
let lastFocus = null;

$$('.shot').forEach(btn => {
  const key = btn.dataset.shot, shot = SHOTS[key];
  if (shot && shot.src) {
    const img = new Image();
    img.src = shot.src; img.alt = shot.alt; img.loading = 'lazy'; img.decoding = 'async';
    img.onerror = () => img.remove();   // fall back to the placeholder if the image fails
    $('.ph', btn).appendChild(document.createComment('replaced'));
    btn.insertBefore(img, $('.zoom', btn));
    img.addEventListener('load', () => { const p = $('.ph', btn); if (p) p.hidden = true; });
  }
  btn.addEventListener('click', () => openLightbox(key, btn));
});

function openLightbox(key, trigger) {
  const shot = SHOTS[key];
  lastFocus = trigger;
  lbC.innerHTML = '';
  if (shot.src) {
    const img = new Image();
    img.src = shot.src; img.alt = shot.alt;
    lbC.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'ph' + (key === 'mobile' ? ' m' : '');
    ph.innerHTML = `<b>${key === 'mobile' ? 'Mobile' : 'Desktop'} screenshot placeholder</b><small>Add your image path in script.js → SHOTS.${key}.src</small>`;
    lbC.appendChild(ph);
  }
  lb.hidden = false;
  document.body.style.overflow = 'hidden';
  lbX.focus();
}
function closeLightbox() {
  lb.hidden = true;
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
}
lbX.addEventListener('click', closeLightbox);
lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
document.addEventListener('keydown', e => {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'Tab') { e.preventDefault(); lbX.focus(); }  // keep focus inside dialog
});

/* ---------- Contact form validation ---------- */
const form = $('#form'), status = $('#status');
const rules = {
  name: v => v.trim().length >= 2 ? '' : 'Enter your full name (at least 2 characters).',
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter a valid email address, like name@example.com.',
  subject: v => v.trim().length >= 3 ? '' : 'Enter a subject (at least 3 characters).',
  message: v => v.trim().length >= 10 ? '' : 'Write a message of at least 10 characters.'
};
function check(field) {
  const el = form.elements[field], msg = rules[field](el.value);
  el.classList.toggle('bad', !!msg);
  el.setAttribute('aria-invalid', !!msg);
  $('#e-' + field).textContent = msg;
  return !msg;
}
Object.keys(rules).forEach(f => {
  form.elements[f].addEventListener('blur', () => check(f));
  form.elements[f].addEventListener('input', () => { if (form.elements[f].classList.contains('bad')) check(f); });
});
form.addEventListener('submit', e => {
  e.preventDefault();
  status.textContent = ''; status.style.color = '';
  const results = Object.keys(rules).map(check);
  if (results.includes(false)) {
    status.style.color = '#fca5a5';
    status.textContent = 'Please fix the highlighted fields and try again.';
    form.querySelector('.bad')?.focus();
    return;
  }
  // No backend: open the visitor's email app with the message pre-filled.
  const { name, email, subject, message } = form.elements;
  const body = `Name: ${name.value.trim()}\nEmail: ${email.value.trim()}\n\n${message.value.trim()}`;
  window.location.href = `mailto:podev393@gmail.com?subject=${encodeURIComponent(subject.value.trim())}&body=${encodeURIComponent(body)}`;
  status.textContent = 'Thanks! Your email app is opening with your message ready to send.';
  form.reset();
});
