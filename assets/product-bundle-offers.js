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

    /* ── Helper: find the best matching bundle card for a qty ── */
    function findBestCard(qty) {
      var exactMatch = null;
      var minMatch = null; /* card with data-qty-min that qty >= its qty */

      cards.forEach(function(card) {
        var cardQty = parseInt(card.dataset.qty, 10) || 1;
        if (cardQty === qty) {
          exactMatch = card;
        }
        /* Cards with data-qty-min match any qty >= their base qty */
        if (card.hasAttribute('data-qty-min') && qty >= cardQty) {
          if (!minMatch || cardQty > parseInt(minMatch.dataset.qty, 10)) {
            minMatch = card;
          }
        }
      });

      return exactMatch || minMatch;
    }

    /* ── 1. Bundle card click ──────────────────────────────── */
    cards.forEach(function(card) {
      card.addEventListener('click', function(e) {
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
        var bestCard = findBestCard(qty);

        cards.forEach(function(c) { c.classList.remove('is-selected'); });

        if (bestCard) {
          bestCard.classList.add('is-selected');
          var radio = bestCard.querySelector('.toy-bundle-radio');
          if (radio) radio.checked = true;

          /* Update the 3+ card price display for actual qty (>= so reducing back to base also recalculates) */
          if (bestCard.hasAttribute('data-qty-min') && qty >= parseInt(bestCard.dataset.qty, 10)) {
            updateCardPrice(bestCard, qty);
          }
        } else {
          cards.forEach(function(card) {
            var radio = card.querySelector('.toy-bundle-radio');
            if (radio) radio.checked = false;
          });
        }
      });
    }

    /* ── 3. Update a single card's price for a given qty ──── */
    function updateCardPrice(card, qty) {
      var basePrice = getVariantPrice();
      if (!basePrice) basePrice = parseInt(bundleSection.dataset.productPrice, 10) || 0;
      var discount = parseInt(card.dataset.discount, 10) || 0;

      var totalCents    = Math.round(basePrice * qty * (100 - discount) / 100);
      var originalCents = basePrice * qty;

      var totalEl   = card.querySelector('[data-bundle-total]');
      var compareEl = card.querySelector('[data-bundle-compare]');

      if (totalEl)   totalEl.textContent   = formatMoney(totalCents);
      if (compareEl) compareEl.textContent = formatMoney(originalCents);
    }

    /* ── 4. Get current variant price ────────────────────── */
    function getVariantPrice() {
      var variantJsonEl = productSection.querySelector('[data-variant-json]');
      if (!variantJsonEl) return null;

      var variants;
      try { variants = JSON.parse(variantJsonEl.textContent || variantJsonEl.value); }
      catch(e) { return null; }
      if (!variants || !variants.length) return null;

      var masterSelect = productSection.querySelector('[data-product-select]');
      var currentId = masterSelect ? parseInt(masterSelect.value, 10) : null;
      var variant = variants.find(function(v) { return v.id === currentId; }) || variants[0];
      return variant ? variant.price : null;
    }

    /* ── 5. Recalculate all card prices on variant change ── */
    function updateBundlePrices() {
      var basePrice = getVariantPrice();
      if (!basePrice) return;

      cards.forEach(function(card) {
        var qty      = parseInt(card.dataset.qty, 10) || 1;
        var discount = parseInt(card.dataset.discount, 10) || 0;

        /* For 3+ card, use the current qty input if higher */
        if (card.hasAttribute('data-qty-min') && qtyInput) {
          var currentQty = parseInt(qtyInput.value, 10) || 1;
          if (currentQty > qty) qty = currentQty;
        }

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
