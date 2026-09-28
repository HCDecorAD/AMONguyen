[Reading 97 lines from start (total: 97 lines, 0 remaining)]

/**
 * AMO NGUYEN - PRODUCTION APP LOGIC (V2)
 * Namespace: window.AMO. Safely handles re-initialization and a11y.
 */
window.AMO = window.AMO || {};

window.AMO.App = (function() {
  if (window.AMO.isBooted) return window.AMO.App;

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => { clearTimeout(timeout); func(...args); };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const initNav = () => {
    const header = document.querySelector('.amo-header');
    const menuBtn = document.querySelector('.amo-menu-btn');
    const mobileNav = document.querySelector('.amo-nav-mobile');
    if (!header || !menuBtn || !mobileNav) return;

    window.addEventListener('scroll', debounce(() => {
      header.classList.toggle('is-scrolled', window.scrollY > 10);
    }, 10), { passive: true });

    const toggleMenu = (forceClose = false) => {
      const isOpen = forceClose ? false : !mobileNav.classList.contains('is-open');
      mobileNav.classList.toggle('is-open', isOpen);
      menuBtn.classList.toggle('is-active', isOpen);
      menuBtn.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
      if (isOpen) mobileNav.querySelector('a')?.focus();
      else menuBtn.focus();
    };

    menuBtn.addEventListener('click', () => toggleMenu());
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) toggleMenu(true);
    });

    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth > 768 && mobileNav.classList.contains('is-open')) toggleMenu(true);
    }, 150), { passive: true });
  };

  const initReveal = () => {
    const elements = document.querySelectorAll('.amo-reveal');
    if (!elements.length) return;

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(el => el.classList.add('is-visible'));
      return;
    }
    
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -50px 0px" });
    elements.forEach(el => observer.observe(el));
  };

  const initAssets = () => {
    const applyMap = (map = {}) => {
      document.querySelectorAll('img[data-amo-asset]').forEach(img => {
        const key = img.dataset.amoAsset;
        if (!img.getAttribute('src') && map[key]) img.src = map[key];
        const src = img.getAttribute('src');
        if (src && src.trim() !== '') {
          img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
          img.addEventListener('error', () => img.classList.add('is-broken'), { once: true });
          if (img.complete && img.naturalWidth) img.classList.add('is-loaded');
          else if (img.complete && !img.naturalWidth) img.classList.add('is-broken');
        }
      });
    };
    applyMap();
    if (window.location.protocol !== 'file:' && window.fetch) {
      fetch('config/amo-assets.json', { credentials: 'same-origin' })
        .then(r => r.ok ? r.json() : null)
        .then(j => { if (j) applyMap(j.amo_asset_mapping || {}); })
        .catch(() => {});
    }
  };

  const setActiveNav = () => {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.amo-nav-desktop a, .amo-nav-mobile a').forEach(link => {
      const active = link.getAttribute('href') === path;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };

  const init = () => {
    initNav();
    initReveal();
    initAssets();
    setActiveNav();
    window.AMO.isBooted = true;
  };

  return { init };
})();

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.AMO.App.init);
else window.AMO.App.init();

[executed on device: HOCUONG (a318a9bd-cfd6-4540-bf01-3ab9fb7f587a)]