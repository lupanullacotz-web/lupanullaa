(function () {
  'use strict';

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
      return;
    }
    callback();
  }

  function escapeText(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function renderPost(post) {
    var url = post.url || ('/blog/' + post.slug + '.html');
    var category = post.category || 'Makala';
    var date = post.date || '';

    return [
      '<article class="lupa-card lupa-card-hover overflow-hidden" data-search-card="posts" data-search-text="',
      escapeText([post.title, post.excerpt, category, date].join(' ')),
      '">',
      '<a href="',
      escapeText(url),
      '" class="block p-5">',
      '<span class="lupa-chip">',
      escapeText(category),
      '</span>',
      '<h3 class="mt-3 text-xl font-extrabold text-slate-950">',
      escapeText(post.title),
      '</h3>',
      '<p class="mt-3 text-sm leading-6 text-slate-600">',
      escapeText(post.excerpt),
      '</p>',
      '<p class="mt-5 text-xs font-bold uppercase text-slate-500">',
      escapeText(date),
      '</p>',
      '</a>',
      '</article>'
    ].join('');
  }

  ready(function () {
    var list = document.querySelector('[data-blog-list]');
    if (!list || !window.fetch) return;

    fetch('/blog/data.json', { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw new Error('Blog data failed');
        return response.json();
      })
      .then(function (posts) {
        if (!Array.isArray(posts) || !posts.length) return;
        list.innerHTML = posts.map(renderPost).join('');
        document.dispatchEvent(new Event('lupanulla:blog-ready'));
      })
      .catch(function () {
        list.hidden = true;
      });
  });
})();
