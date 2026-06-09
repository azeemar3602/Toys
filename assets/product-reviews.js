/* ══ Toylicious Product Reviews JS ════════════════════════════
   Handles "Show More Reviews" progressive reveal.
   Shows 8 reviews initially, reveals BATCH_SIZE more per click.
════════════════════════════════════════════════════════════ */
(function() {
  var BATCH_SIZE = 6;

  function initReviews() {
    var reviewsSections = document.querySelectorAll('.toy-reviews-section');

    reviewsSections.forEach(function(section) {
      var showMoreBtn = section.querySelector('.toy-show-more-btn');
      if (!showMoreBtn) return;

      showMoreBtn.addEventListener('click', function() {
        var hidden = section.querySelectorAll('.toy-review-card.toy-review-hidden');
        if (!hidden.length) {
          showMoreBtn.setAttribute('data-all-shown', '1');
          return;
        }

        /* Reveal next BATCH_SIZE hidden cards */
        var count = 0;
        hidden.forEach(function(card) {
          if (count < BATCH_SIZE) {
            card.classList.remove('toy-review-hidden');
            count++;
          }
        });

        /* Check if any more remain */
        var stillHidden = section.querySelectorAll('.toy-review-card.toy-review-hidden');
        if (!stillHidden.length) {
          showMoreBtn.setAttribute('data-all-shown', '1');
        }

        /* Update button text */
        var remaining = stillHidden.length;
        if (remaining > 0) {
          showMoreBtn.textContent = 'Show More Reviews (' + remaining + ' remaining)';
        }

        /* Smooth scroll so first new card is visible */
        if (count > 0) {
          var allVisible = section.querySelectorAll('.toy-review-card:not(.toy-review-hidden)');
          var firstNew = allVisible[allVisible.length - count];
          if (firstNew) {
            firstNew.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      });

      /* Init button text with count */
      var totalHidden = section.querySelectorAll('.toy-review-card.toy-review-hidden').length;
      if (totalHidden > 0) {
        showMoreBtn.textContent = 'Show More Reviews (' + totalHidden + ' more)';
      } else {
        showMoreBtn.setAttribute('data-all-shown', '1');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReviews);
  } else {
    initReviews();
  }

})();
