[Reading 130 lines from start (total: 130 lines, 0 remaining)]

/**
 * AMO NGUYEN - MASTER JS APPLICATION
 * Fully encapsulated namespace, no dependencies.
 */
window.AMO = window.AMO || {};

window.AMO.App = (function() {
  
  // 1. Header & Navigation Logic
  const initNav = () => {
    const header = document.querySelector('.amo-header');
    const menuBtn = document.querySelector('.amo-menu-btn');
    const mobileNav = document.querySelector('.amo-nav-mobile');

    if (!header || !menuBtn || !mobileNav) return;

    // Scroll effect
    window.addEventListener('scroll', () => {
      header.classList.toggle('is-scrolled', window.scrollY > 20);
    }, { passive: true });

    // Toggle Menu
    const toggleMenu = (forceClose = false) => {
      const isOpen = forceClose ? false : !mobileNav.classList.contains('is-open');
      mobileNav.classList.toggle('is-open', isOpen);
      menuBtn.classList.toggle('is-active', isOpen);
      menuBtn.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    menuBtn.addEventListener('click', () => toggleMenu());

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
        toggleMenu(true);
      }
    });

    // Close menu on window resize (prevent layout bugs)
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && mobileNav.classList.contains('is-open')) {
        toggleMenu(true);
      }
    }, { passive: true });
  };

  // 2. Reveal Animations (Intersection Observer)
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

  // 3. Fake Asset Loader (Listens to data-amo-asset)
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

  // 4. Shop Filter Logic
  const initShopFilter = () => {
    const filterContainer = document.querySelector('.amo-shop-filter');
    const products = document.querySelectorAll('.amo-product-card');

    if (!filterContainer || !products.length) return;

    // Event delegation
    filterContainer.addEventListener('click', (e) => {
      if (!e.target.classList.contains('amo-filter-btn')) return;

      // Active state
      filterContainer.querySelectorAll('.amo-filter-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');

      const category = e.target.getAttribute('data-filter');

      // Filter products
      products.forEach(product => {
        if (category === 'all' || product.getAttribute('data-category') === category) {
          product.style.display = 'flex';
          // Small animation reset
          product.style.animation = 'none';
          product.offsetHeight; /* trigger reflow */
          product.style.animation = null; 
        } else {
          product.style.display = 'none';
        }
      });
    });
  };

  // Run all Initializers
  const init = () => {
    initNav();
    initReveal();
    initAssets();
    initShopFilter();
  };

  return { init };
})();

// Boot safely
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.AMO.App.init);
} else {
  window.AMO.App.init();
}

[executed on device: HOCUONG (a318a9bd-cfd6-4540-bf01-3ab9fb7f587a)]