[Reading 87 lines from start (total: 87 lines, 0 remaining)]

/**
 * AMO NGUYEN - MASTER SHOP MODULE (Idempotent & A11y Ready)
 */
window.AMO = window.AMO || {};

window.AMO.Shop = (function() {
  if (window.AMO.isShopBooted) return window.AMO.Shop;

  const initShopUI = () => {
    const filterContainer = document.querySelector('.amo-shop-filter');
    const searchInput = document.getElementById('amoSearch');
    const sortSelect = document.getElementById('amoSort');
    const productGrid = document.getElementById('amoProductGrid');
    const emptyState = document.getElementById('amoEmptyState');
    
    if (!filterContainer || !productGrid) return;

    const products = Array.from(productGrid.querySelectorAll('.amo-product-card'));

    const updateGrid = (category, searchTerm) => {
      let visibleCount = 0;
      const term = (searchTerm || '').toLowerCase().trim();

      products.forEach(product => {
        const prodCat = product.getAttribute('data-category');
        const prodName = product.querySelector('.amo-product-name').textContent.toLowerCase();
        
        const matchCat = (category === 'all' || prodCat === category);
        const matchSearch = (term === '' || prodName.includes(term));

        if (matchCat && matchSearch) {
          product.style.display = 'flex';
          visibleCount++;
        } else {
          product.style.display = 'none';
        }
      });

      if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
      }
    };

    // Filter Buttons logic
    filterContainer.addEventListener('click', (e) => {
      if (!e.target.classList.contains('amo-filter-btn')) return;

      filterContainer.querySelectorAll('.amo-filter-btn').forEach(btn => {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-selected', 'false');
      });
      
      e.target.classList.add('is-active');
      e.target.setAttribute('aria-selected', 'true');

      const category = e.target.getAttribute('data-filter');
      const searchTerm = searchInput ? searchInput.value : '';
      updateGrid(category, searchTerm);
    });

    // Mock Search logic
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const activeFilter = filterContainer.querySelector('.is-active');
        const category = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
        updateGrid(category, e.target.value);
      });
    }

    // Mock Sort logic (Hooks ready for backend data mapping)
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        console.info(`[AMO INFO] Sắp xếp thay đổi thành: ${e.target.value}. Chờ hook API backend.`);
      });
    }
  };

  const init = () => {
    initShopUI();
    window.AMO.isShopBooted = true;
  };

  return { init };
})();

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.AMO.Shop.init);
else window.AMO.Shop.init();

[executed on device: HOCUONG (a318a9bd-cfd6-4540-bf01-3ab9fb7f587a)]