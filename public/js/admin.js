// ========================================
// iusymarket - Admin JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  initAdminSidebar();
  initImageUpload();
  initStatCounters();
  initFlashMessages();
});

// --- Sidebar Toggle ---
function initAdminSidebar() {
  const toggle = document.getElementById('admin-menu-toggle');
  const sidebar = document.getElementById('admin-sidebar');
  const main = document.getElementById('admin-main');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      if (main) main.classList.toggle('expanded');
    });
  }
}

// --- Image Upload Preview ---
function initImageUpload() {
  const area = document.getElementById('image-upload-area');
  const input = document.getElementById('image');

  if (!area || !input) return;

  area.addEventListener('click', () => input.click());

  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.classList.add('dragover');
  });

  area.addEventListener('dragleave', () => {
    area.classList.remove('dragover');
  });

  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      input.files = e.dataTransfer.files;
      previewImage(input.files[0]);
    }
  });

  input.addEventListener('change', () => {
    if (input.files[0]) previewImage(input.files[0]);
  });
}

function previewImage(file) {
  const area = document.getElementById('image-upload-area');
  const reader = new FileReader();

  reader.onload = (e) => {
    let img = area.querySelector('.image-preview');
    const placeholder = area.querySelector('.image-preview-placeholder');

    if (!img) {
      img = document.createElement('img');
      img.className = 'image-preview';
      img.id = 'image-preview';
      area.insertBefore(img, area.firstChild);
    }

    img.src = e.target.result;

    if (placeholder) placeholder.style.display = 'none';

    let text = area.querySelector('.image-upload-text');
    if (!text) {
      text = document.createElement('p');
      text.className = 'image-upload-text';
      text.textContent = 'Click or drag to replace image';
      area.appendChild(text);
    }
  };

  reader.readAsDataURL(file);
}

// --- Dynamic Fields (Sizes, Defects) ---
function addField(containerId, name, placeholder) {
  const container = document.getElementById(containerId);
  const field = document.createElement('div');
  field.className = 'dynamic-field';
  field.innerHTML = `
    <input type="text" name="${name}" placeholder="${placeholder}">
    <button type="button" class="remove-field-btn" onclick="this.parentElement.remove()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  container.appendChild(field);
  field.querySelector('input').focus();
}

// --- Stat Counter ---
function initStatCounters() {
  const counters = document.querySelectorAll('[data-count]');
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-count'));
    animateCounter(counter, target);
  });
}

function animateCounter(el, target) {
  let current = 0;
  const increment = Math.max(1, target / 40);
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current);
  }, 30);
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
