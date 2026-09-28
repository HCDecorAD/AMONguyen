[Reading 47 lines from start (total: 47 lines, 0 remaining)]

/**
 * AMO NGUYEN - PRODUCTION SHOP LOGIC (V2)
 */
window.AMO = window.AMO || {};

window.AMO.Shop = (function() {
  if (window.AMO.isShopBooted) return window.AMO.Shop;

  const initFilter = () => {
    const filterContainer = document.querySelector('.amo-shop-filter');
    const products = document.querySelectorAll('.amo-product-card');
    const emptyState = document.querySelector('.amo-shop-empty-state');

    if (!filterContainer || !products.length) return;

    filterContainer.addEventListener('click', (e) => {
      if (!e.target.classList.contains('amo-filter-btn')) return;

      filterContainer.querySelectorAll('.amo-filter-btn').forEach(btn => btn.classList.remove('is-active'));
      e.target.classList.add('is-active');

      const category = e.target.getAttribute('data-filter');
      let visibleCount = 0;

      products.forEach(product => {
        if (category === 'all' || product.getAttribute('data-category') === category) {
          product.style.display = 'flex';
          visibleCount++;
        } else {
          product.style.display = 'none';
        }
      });

      if (emptyState) emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    });
  };

  const init = () => {
    initFilter();
    window.AMO.isShopBooted = true;
  };

  return { init };
})();

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.AMO.Shop.init);
else window.AMO.Shop.init();

[executed on device: HOCUONG (a318a9bd-cfd6-4540-bf01-3ab9fb7f587a)]