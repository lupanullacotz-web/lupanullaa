(function () {
  'use strict';

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
      return;
    }
    callback();
  }

  function toggleMobileMenu() {
    var button = document.getElementById('mobile-menu-btn');
    var menu = document.getElementById('mobile-menu');
    var icon = document.getElementById('menu-icon');

    if (!button || !menu) return;

    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', function () {
      var isOpen = !menu.classList.contains('hidden');
      menu.classList.toggle('hidden', isOpen);
      button.setAttribute('aria-expanded', String(!isOpen));

      if (icon) {
        icon.classList.toggle('ph-list', isOpen);
        icon.classList.toggle('ph-x', !isOpen);
      }
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
        if (icon) {
          icon.classList.add('ph-list');
          icon.classList.remove('ph-x');
        }
      });
    });
  }

  function markActiveLinks() {
    var currentFile = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('a[href]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#' || href.indexOf('://') !== -1) return;

      var file = href.split('#')[0].split('?')[0].split('/').pop() || 'index.html';
      if (file === currentFile) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('lupa-nav-active');
      }
    });
  }

  function wireSearchFilters() {
    document.querySelectorAll('[data-search-input]').forEach(function (input) {
      var key = input.getAttribute('data-search-input');
      var cards = Array.prototype.slice.call(document.querySelectorAll('[data-search-card="' + key + '"]'));
      var empty = document.querySelector('[data-search-empty="' + key + '"]');

      function applyFilter() {
        var query = input.value.trim().toLowerCase();
        var visibleCount = 0;

        cards.forEach(function (card) {
          var text = (card.getAttribute('data-search-text') || card.textContent || '').toLowerCase();
          var isVisible = !query || text.indexOf(query) !== -1;
          card.hidden = !isVisible;
          if (isVisible) visibleCount += 1;
        });

        if (empty) empty.hidden = visibleCount !== 0;
      }

      input.addEventListener('input', applyFilter);
      applyFilter();
    });
  }

  function wireComponentIncludes() {
    var includes = Array.prototype.slice.call(document.querySelectorAll('[data-include]'));
    if (!includes.length || !window.fetch) return;

    includes.forEach(function (target) {
      var url = target.getAttribute('data-include');
      if (!url) return;

      fetch(url, { credentials: 'same-origin' })
        .then(function (response) {
          if (!response.ok) throw new Error('Include failed: ' + url);
          return response.text();
        })
        .then(function (html) {
          target.innerHTML = html;
          target.removeAttribute('data-include');
        })
        .catch(function () {
          target.hidden = true;
        });
    });
  }

  function secureExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
      var rel = (link.getAttribute('rel') || '').split(/\s+/);
      ['noopener', 'noreferrer'].forEach(function (value) {
        if (rel.indexOf(value) === -1) rel.push(value);
      });
      link.setAttribute('rel', rel.filter(Boolean).join(' '));
    });
  }

  ready(function () {
    wireComponentIncludes();
    toggleMobileMenu();
    markActiveLinks();
    wireSearchFilters();
    secureExternalLinks();
  });
})();
