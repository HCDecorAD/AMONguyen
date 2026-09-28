[Reading 92 lines from start (total: 92 lines, 0 remaining)]

/**
 * AMO NGUYEN - MASTER APP CORE
 * Namespace: window.AMO
 */
window.AMO = window.AMO || {};

window.AMO.App = (function() {
  
  const initNav = () => {
    const header = document.querySelector('.amo-header');
    const menuBtn = document.querySelector('.amo-menu-btn');
    const mobileNav = document.querySelector('.amo-nav-mobile');

    if (!header || !menuBtn || !mobileNav) return;

    window.addEventListener('scroll', () => {
      header.classList.toggle('is-scrolled', window.scrollY > 20);
    }, { passive: true });

    const toggleMenu = (forceClose = false) => {
      const isOpen = forceClose ? false : !mobileNav.classList.contains('is-open');
      mobileNav.classList.toggle('is-open', isOpen);
      menuBtn.classList.toggle('is-active', isOpen);
      menuBtn.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    menuBtn.addEventListener('click', () => toggleMenu());
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) toggleMenu(true);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && mobileNav.classList.contains('is-open')) toggleMenu(true);
    }, { passive: true });
  };

  const initReveal = () => {
    const elements = document.querySelectorAll('.amo-reveal');
    if (!elements.length) return;

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(el => el.classList.add('is-visible'));
      return;
    }
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    elements.forEach(el => observer.observe(el));
  };

  const initAssets = () => {
    const images = document.querySelectorAll('img[data-amo-asset]');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src && src.trim() !== '') {
        img.addEventListener('load', () => img.classList.add('is-loaded'));
        if (img.complete) img.classList.add('is-loaded');
      }
    });
  };

  const setActiveNav = () => {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.amo-nav-desktop a').forEach(link => {
      if (link.getAttribute('href') === path) link.classList.add('is-active');
    });
  };

  const init = () => {
    initNav();
    initReveal();
    initAssets();
    setActiveNav();
  };

  return { init };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.AMO.App.init);
} else {
  window.AMO.App.init();
}

[executed on device: HOCUONG (a318a9bd-cfd6-4540-bf01-3ab9fb7f587a)]