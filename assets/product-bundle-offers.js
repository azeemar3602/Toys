/* ══ Toylicious Bundle Offers JS ══════════════════════════════
   Handles bundle card selection, qty sync, and price recalc
   on variant change.

   NOTE ON DISCOUNTS:
   The displayed bundle prices are informational totals.
   Actual discount at checkout requires Shopify Automatic
   Discounts to be configured in Admin > Discounts.
   See admin guide for setup instructions.
════════════════════════════════════════════════════════════ */
(function() {

  function formatMoney(cents) {
    /* Rs. format used by this store */
    return 'Rs.' + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function initBundles() {
    var productSection = document.querySelector('[data-section-type="product"]');
    if (!productSection) return;

    var bundleSection = productSection.querySelector('#ToyBundleSection');
    if (!bundleSection) return;

    var cards     = bundleSection.querySelectorAll('.toy-bundle-card');
    var qtyInput  = productSection.querySelector('.js-qty__num');

    /* ── 1. Bundle card click ──────────────────────────────── */
    cards.forEach(function(card) {
      card.addEventListener('click', function(e) {
        /* Don't re-process if clicking the radio input directly */
        var radio = card.querySelector('.toy-bundle-radio');
        var qty   = parseInt(card.dataset.qty, 10) || 1;

        /* Update visual selected state */
        cards.forEach(function(c) { c.classList.remove('is-selected'); });
        card.classList.add('is-selected');
        if (radio) { radio.checked = true; }

        /* Update qty input (will trigger theme's ATC qty update) */
        if (qtyInput) {
          qtyInput.value = qty;
          qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });

    /* ── 2. Sync bundle selection when qty changes manually ── */
    if (qtyInput) {
      qtyInput.addEventListener('change', function() {
        var qty = parseInt(qtyInput.value, 10) || 1;
        var matched = false;
        cards.forEach(function(card) {
          if (parseInt(card.dataset.qty, 10) === qty) {
            cards.forEach(function(c) { c.classList.remove('is-selected'); });
            card.classList.add('is-selected');
            var radio = card.querySelector('.toy-bundle-radio');
            if (radio) radio.checked = true;
            matched = true;
          }
        });
        if (!matched) {
          /* No bundle matches the qty — deselect all */
          cards.forEach(function(card) {
            card.classList.remove('is-selected');
            var radio = card.querySelector('.toy-bundle-radio');
            if (radio) radio.checked = false;
          });
        }
      });
    }

    /* ── 3. Recalculate prices on variant change ──────────── */
    function getVariantPrice() {
      /* Read from the variant JSON textarea */
      var variantJsonEl = productSection.querySelector('[data-variant-json]');
      if (!variantJsonEl) return null;

      var variants;
      try { variants = JSON.parse(variantJsonEl.textContent || variantJsonEl.value); }
      catch(e) { return null; }
      if (!variants || !variants.length) return null;

      var masterSelect = productSection.querySelector('[data-product-select]');
      var currentId = masterSelect ? parseInt(masterSelect.value, 10) : null;
      var variant = variants.find(function(v) { return v.id === currentId; }) || variants[0];
      return variant ? variant.price : null; /* price in cents */
    }

    function updateBundlePrices() {
      var basePrice = getVariantPrice();
      if (!basePrice) return;

      cards.forEach(function(card) {
        var qty      = parseInt(card.dataset.qty, 10) || 1;
        var discount = parseInt(card.dataset.discount, 10) || 0;

        var totalCents    = Math.round(basePrice * qty * (100 - discount) / 100);
        var originalCents = basePrice * qty;

        var totalEl   = card.querySelector('[data-bundle-total]');
        var compareEl = card.querySelector('[data-bundle-compare]');

        if (totalEl)   totalEl.textContent   = formatMoney(totalCents);
        if (compareEl) compareEl.textContent = formatMoney(originalCents);
      });
    }

    /* Listen for variant radio changes */
    productSection.addEventListener('change', function(e) {
      if (e.target && e.target.hasAttribute('data-variant-input')) {
        /* Short delay so master select is updated first */
        setTimeout(updateBundlePrices, 60);
      }
    });

    /* Also listen for the variant select directly */
    var masterSelect = productSection.querySelector('[data-product-select]');
    if (masterSelect) {
      masterSelect.addEventListener('change', function() {
        setTimeout(updateBundlePrices, 60);
      });
    }
  }

  /* ── Init ──────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBundles);
  } else {
    initBundles();
  }

})();
