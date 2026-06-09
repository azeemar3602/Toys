/* ══ Toylicious Checkout-Style Cart Page JS ═══════════════════
   Handles: qty +/-, item removal, customer details → order
   notes, payment method selection, checkout redirect.
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Utility ──────────────────────────────────────────── */
  function formatMoney(cents) {
    return 'Rs.' + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /* ── Cart API helpers ─────────────────────────────────── */
  function cartChange(key, qty) {
    return fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: qty })
    }).then(function (r) { return r.json(); });
  }

  function cartUpdate(body) {
    return fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); });
  }

  /* ── Init ─────────────────────────────────────────────── */
  function init() {
    var page = document.querySelector('.tck-checkout-page');
    if (!page) return;

    /* ── Qty buttons ────────────────────────────────────── */
    page.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tck-qty-btn]');
      if (!btn) return;

      var row = btn.closest('.tck-item');
      if (!row) return;

      var key = row.dataset.key;
      var input = row.querySelector('.tck-item__qty-val');
      var current = parseInt(input.value, 10) || 1;
      var dir = btn.dataset.tckQtyBtn;
      var next = dir === 'plus' ? current + 1 : current - 1;
      if (next < 1) next = 1;

      input.value = next;
      input.disabled = true;
      btn.disabled = true;

      cartChange(key, next).then(function (cart) {
        refreshPage(cart);
      }).catch(function () {
        input.value = current;
        input.disabled = false;
        btn.disabled = false;
      });
    });

    /* ── Qty input direct change ────────────────────────── */
    page.addEventListener('change', function (e) {
      if (!e.target.classList.contains('tck-item__qty-val')) return;
      var row = e.target.closest('.tck-item');
      if (!row) return;
      var key = row.dataset.key;
      var qty = parseInt(e.target.value, 10);
      if (!qty || qty < 0) qty = 1;
      e.target.disabled = true;
      cartChange(key, qty).then(function (cart) {
        refreshPage(cart);
      }).catch(function () { e.target.disabled = false; });
    });

    /* ── Remove item ────────────────────────────────────── */
    page.addEventListener('click', function (e) {
      var remove = e.target.closest('[data-tck-remove]');
      if (!remove) return;
      e.preventDefault();
      var row = remove.closest('.tck-item');
      if (!row) return;
      var key = row.dataset.key;
      row.style.opacity = '0.4';
      cartChange(key, 0).then(function (cart) {
        refreshPage(cart);
      });
    });

    /* ── Payment option selection ────────────────────────── */
    page.addEventListener('click', function (e) {
      var opt = e.target.closest('.tck-payment-option');
      if (!opt) return;
      page.querySelectorAll('.tck-payment-option').forEach(function (o) {
        o.classList.remove('is-selected');
      });
      opt.classList.add('is-selected');
      var radio = opt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });

    /* ── Checkout form submit ───────────────────────────── */
    var form = page.querySelector('#TckCheckoutForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        /* Collect customer details → order note */
        var name    = (page.querySelector('#tck-name') || {}).value || '';
        var phone   = (page.querySelector('#tck-phone') || {}).value || '';
        var address = (page.querySelector('#tck-address') || {}).value || '';
        var city    = (page.querySelector('#tck-city') || {}).value || '';
        var payment = '';
        var checkedPay = page.querySelector('input[name="tck_payment"]:checked');
        if (checkedPay) payment = checkedPay.value;

        var note = '';
        if (name)    note += 'Name: ' + name + '\n';
        if (phone)   note += 'Phone: ' + phone + '\n';
        if (address) note += 'Address: ' + address + '\n';
        if (city)    note += 'City: ' + city + '\n';
        if (payment) note += 'Payment: ' + payment + '\n';

        /* Save note then redirect to checkout */
        if (note) {
          cartUpdate({ note: note.trim() }).then(function () {
            window.location.href = '/checkout';
          }).catch(function () {
            window.location.href = '/checkout';
          });
        } else {
          window.location.href = '/checkout';
        }
      });
    }
  }

  /* ── Refresh page after cart change ────────────────────── */
  function refreshPage(cart) {
    if (!cart || cart.item_count === 0) {
      window.location.reload();
      return;
    }
    /* Simple reload for now — keeps things reliable */
    window.location.reload();
  }

  /* ── Boot ─────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
