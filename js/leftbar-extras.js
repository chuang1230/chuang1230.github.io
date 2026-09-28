// leftbar-extras.js
// 给 1.44 补两个 Stellar 2.0 才有、作者站 xaoxuu.com 在用的功能：
// 1) 侧边栏收起：收起后 64px 窄栏，只剩头像 + 五个页面图标 + 搜索 + 展开按钮；
// 2) 弹层搜索：搜索改成按钮，点击（或 Cmd/Ctrl+K）弹出居中大卡片搜索框。
//    搜索逻辑仍复用主题 local-search.js：把 #search-wrapper 节点整体搬进弹层，
//    它的监听绑在节点/document 上，搬走后依然生效。
// 收起状态存 localStorage，跨页保持。
(function () {
  var KEY = 'wsj-leftbar-collapsed';
  var SVG_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.5 15.5 5 5"></path></svg>';
  var SVG_FOLD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 6-6 6 6 6"></path><path d="m18 6-6 6 6 6"></path></svg>';
  var SVG_UNFOLD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m13 6 6 6-6 6"></path><path d="m6 6 6 6-6 6"></path></svg>';
  var SVG_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 6 12 12"></path><path d="m18 6-12 12"></path></svg>';

  function init() {
    var left = document.querySelector('.l_left');
    var container = left && left.querySelector('.leftbar-container');
    if (!container) return;
    var wrapper = document.getElementById('search-wrapper');

    // —— 搜索按钮：展开态是原搜索栏样式的横条，收起态变图标方块（CSS 控制） ——
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'search-trigger';
    trigger.innerHTML = SVG_SEARCH + '<span>搜索</span>';
    if (wrapper) container.insertBefore(trigger, wrapper);

    // —— 收起/展开按钮：展开态挂进页脚社交图标行末尾，与图标同排对齐 ——
    var fold = document.createElement('button');
    fold.type = 'button';
    fold.className = 'leftbar-collapse-btn';
    var socialRow = left.querySelector('footer .social-wrap');
    (socialRow || left).appendChild(fold);
    // ScrollReveal 给 widgets 挂 slide-up，display:none 折叠再展开后内联
    // opacity 会卡在 0（插件不会重播入场动画）。展开时强制复活。
    function reviveLeftWidgets() {
      document.querySelectorAll('.l_left .widgets .slide-up').forEach(function (el) {
        el.style.transition = 'none';
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.visibility = 'visible';
      });
    }
    function paintFold() {
      var collapsed = document.documentElement.hasAttribute('data-leftbar-collapsed');
      fold.innerHTML = collapsed ? SVG_UNFOLD : SVG_FOLD;
      var label = collapsed ? '展开侧边栏' : '收起侧边栏';
      fold.title = label;
      fold.setAttribute('aria-label', label);
    }
    fold.addEventListener('click', function () {
      var collapsed = !document.documentElement.hasAttribute('data-leftbar-collapsed');
      if (collapsed) document.documentElement.setAttribute('data-leftbar-collapsed', '');
      else document.documentElement.removeAttribute('data-leftbar-collapsed');
      try { localStorage.setItem(KEY, collapsed ? '1' : '0'); } catch (e) {}
      if (!collapsed) reviveLeftWidgets();
      paintFold();
    });
    try {
      if (localStorage.getItem(KEY) === '1') document.documentElement.setAttribute('data-leftbar-collapsed', '');
    } catch (e) {}
    paintFold();

    // —— 搜索弹层：#search-wrapper 整体搬进卡片，主题搜索 JS 不用改 ——
    var modal = document.createElement('div');
    modal.className = 'search-modal';
    var card = document.createElement('div');
    card.className = 'search-modal-card';
    modal.appendChild(card);
    if (wrapper) card.appendChild(wrapper);
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'search-modal-close';
    close.setAttribute('aria-label', '关闭搜索');
    close.innerHTML = SVG_CLOSE;
    card.appendChild(close);
    document.body.appendChild(modal);

    function openSearch() {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      var input = document.getElementById('search-input');
      if (!input) return;
      // Chromium 在弹层刚可见的一小段时间内可能拒绝 focus()（鼠标点击触发时
      // 窗口期更长），单次尝试不可靠：每 40ms 重试，获焦即停，最多约 0.5s
      var tries = 0;
      (function attempt() {
        if (document.activeElement === input) return;
        input.focus({ preventScroll: true });
        if (document.activeElement === input) return;
        if (++tries < 12) setTimeout(attempt, 40);
      })();
    }
    function closeSearch() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
    trigger.addEventListener('click', openSearch);
    close.addEventListener('click', closeSearch);
    modal.addEventListener('mousedown', function (e) { if (e.target === modal) closeSearch(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeSearch();
    });
    // Cmd/Ctrl+K：主题 shortcut.js 直接 focus #search-input，但输入框搬进关闭的
    // 弹层后处于 visibility:hidden 不可聚焦，focus 会被拒绝。这里用捕获阶段抢在
    // 主题之前拦截：先打开弹层再聚焦（守卫条件与主题 shortcut.js 保持一致）
    document.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.isComposing) return;
      if (e.altKey || e.shiftKey) return;
      if (!e.metaKey && !e.ctrlKey) return;
      if (typeof e.key !== 'string' || e.key.toLowerCase() !== 'k') return;
      var inputEl = document.getElementById('search-input');
      var target = e.target;
      if (target && target !== inputEl && typeof target.closest === 'function' &&
          target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
      var narrow = document.querySelector('.mobile-only.leftbar-toggle');
      if (narrow && getComputedStyle(narrow).display !== 'none') return;
      e.preventDefault();
      e.stopPropagation();
      if (!modal.classList.contains('open')) openSearch();
      else if (inputEl) inputEl.focus();
    }, true);
    // 兜底：任何途径让输入框获焦时，把弹层打开
    var input = document.getElementById('search-input');
    if (input) input.addEventListener('focusin', function () {
      if (!modal.classList.contains('open')) openSearch();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
