/**
 * pin-badge.js
 * 把 stellar 默认的 <span class="pin">svg 图标</span>（在 .meta 里）
 * 替换成 <span class="pin-badge">置顶</span> 徽章，放在 .post-title 文字前
 * 不改动 node_modules 模板，纯 DOM 操作
 *
 * 1.44.0 起首页文章卡片不再渲染 .pin 标记（置顶交给轮播/flat 列表），
 * 所以补一条按 slug 匹配的兜底：PINNED_SLUGS 里的文章卡片加徽章。
 * 新增/取消置顶时同步改这个列表（front-matter 的 pin/sticky 管排序，这里管徽章）。
 */
(function() {
  var PINNED_SLUGS = []; // 需要置顶徽章时把文章 slug 填进来（front-matter 的 pin/sticky 管排序，这里管徽章）
  function addBadge(title) {
    if (title.querySelector('.pin-badge')) return;
    var badge = document.createElement('span');
    badge.className = 'pin-badge';
    badge.textContent = '置顶';
    title.insertBefore(badge, title.firstChild);
  }
  function init() {
    document.querySelectorAll('article.md-text').forEach(article => {
      const pin = article.querySelector('.pin');
      const title = article.querySelector('.post-title');
      if (!title) return;
      if (pin) {
        addBadge(title);
        pin.remove();
        return;
      }
      var link = article.closest('a[href]');
      if (!link) return;
      var href = link.getAttribute('href') || '';
      if (PINNED_SLUGS.some(slug => href.indexOf('/' + slug + '/') !== -1)) {
        addBadge(title);
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
