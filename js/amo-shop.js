[Reading 46 lines from start (total: 46 lines, 0 remaining)]

/**
 * AMO NGUYEN - SHOP MODULE
 */
window.AMO = window.AMO || {};

window.AMO.Shop = (function() {
  
  const initFilter = () => {
    const filterContainer = document.querySelector('.amo-shop-filter');
    const products = document.querySelectorAll('.amo-product-card');

    if (!filterContainer || !products.length) return;

    filterContainer.addEventListener('click', (e) => {
      if (!e.target.classList.contains('amo-filter-btn')) return;

      filterContainer.querySelectorAll('.amo-filter-btn').forEach(btn => btn.classList.remove('is-active'));
      e.target.classList.add('is-active');

      const category = e.target.getAttribute('data-filter');

      products.forEach(product => {
        if (category === 'all' || product.getAttribute('data-category') === category) {
          product.style.display = 'flex';
          product.style.animation = 'none';
          product.offsetHeight; 
          product.style.animation = null; 
        } else {
          product.style.display = 'none';
        }
      });
    });
  };

  const init = () => {
    initFilter();
  };

  return { init };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.AMO.Shop.init);
} else {
  window.AMO.Shop.init();
}

[executed on device: HOCUONG (a318a9bd-cfd6-4540-bf01-3ab9fb7f587a)]