// ========================================
// iusymarket - Main Frontend JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initFlashMessages();
  initStatCounters();
  initDarkMode();
  initBackToTop();
  initPageTransitions();
});

// --- Navbar ---
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');

  if (!navbar) return;

  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const current = window.pageYOffset;
    if (current > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    if (current > lastScroll && current > 200) {
      navbar.classList.add('hidden');
    } else {
      navbar.classList.remove('hidden');
    }
    lastScroll = current;
  });

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      menu.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    });
    menu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        menu.classList.remove('active');
        document.body.classList.remove('menu-open');
      });
    });
  }
}

// --- Scroll Reveal Animation ---
function initScrollReveal() {
  const elements = document.querySelectorAll('.scroll-reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = getComputedStyle(entry.target).getPropertyValue('--delay') || '0s';
        entry.target.style.transitionDelay = delay;
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  elements.forEach(el => observer.observe(el));
}

// --- Flash Messages ---
function initFlashMessages() {
  const flash = document.getElementById('flash-msg');
  if (flash) {
    setTimeout(() => {
      flash.style.opacity = '0';
      flash.style.transform = 'translateY(-20px)';
      setTimeout(() => flash.remove(), 400);
    }, 4000);
  }
}

// --- Stat Counter Animation ---
function initStatCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.getAttribute('data-count'));
        animateCounter(entry.target, target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

function animateCounter(el, target) {
  let current = 0;
  const increment = target / 60;
  const stepTime = 1500 / 60;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current);
  }, stepTime);
}

// --- Dark Mode Toggle ---
function initDarkMode() {
  const toggle = document.getElementById('dark-mode-toggle');
  if (!toggle) return;

  const sunIcon = toggle.querySelector('.dm-sun');
  const moonIcon = toggle.querySelector('.dm-moon');

  const saved = localStorage.getItem('iusy-theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (sunIcon) sunIcon.style.display = 'none';
    if (moonIcon) moonIcon.style.display = 'block';
  }

  toggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('iusy-theme', 'light');
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('iusy-theme', 'dark');
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
    }
  });
}

// --- Back to Top ---
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// --- Smooth Page Transitions ---
function initPageTransitions() {
  // Add entrance animation
  const main = document.querySelector('main') || document.querySelector('section');
  if (main) main.classList.add('page-transition');

  // Intercept internal links for exit animation
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    // Skip: empty, pure hash, external, javascript, new tab, download
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('javascript') ||
        link.target === '_blank' || link.hasAttribute('download')) return;

    // Skip: links with hash that point to the same page (e.g., /about#contact while on /about)
    const linkUrl = new URL(link.href, window.location.origin);
    const currentPath = window.location.pathname;
    if (linkUrl.pathname === currentPath && linkUrl.hash) return;

    // Skip: links pointing to the exact same page we're already on
    if (linkUrl.pathname === currentPath && !linkUrl.hash) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.href;
      document.body.classList.add('page-exit');
      setTimeout(() => {
        window.location.href = target;
      }, 200);
    });
  });
}

// --- Password Toggle ---
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const eyeOpen = btn.querySelector('.eye-open');
  const eyeClosed = btn.querySelector('.eye-closed');
  if (input.type === 'password') {
    input.type = 'text';
    eyeOpen.style.display = 'none';
    eyeClosed.style.display = 'block';
  } else {
    input.type = 'password';
    eyeOpen.style.display = 'block';
    eyeClosed.style.display = 'none';
  }
}
