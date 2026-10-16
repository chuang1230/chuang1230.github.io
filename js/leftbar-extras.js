// leftbar-extras.js —— Stellar 2.0.0 版（大幅瘦身，不是移植）
//
// v1（1.44.0）时期这个脚本干三件事，现在 v2 原生都有，全部删掉不再自己实现：
//   1) 自研收起按钮 + localStorage('wsj-leftbar-collapsed') 记忆
//      → v2 原生渲染 button.leftbar-state-toggle[data-shell-action='toggle-leftbar']，
//        状态写在 html[data-leftbar-state]，收起态窄栏 64px（--leftbar-rail-width: 64px，
//        与我们当年手算的 64px 一致）整套规则在 public/css/main.css 里，主题自己持久化。
//   2) 自研弹层搜索（.search-modal / .search-modal-card，把 #search-wrapper 整体搬进弹层）
//      → v2 原生就是 dialog#site-search-dialog（.search-dialog__panel），
//        Cmd/Ctrl+K 由 /js/search/shortcut.js 负责，Esc 关闭由 <dialog> 自己负责，
//        输入框 id 从 #search-input 变成 #site-search-input。
//   3) 展开后把 widgets 的 opacity 强制拉回 1（ScrollReveal 不重播入场动画的坑）
//      → v2 的 reveal 扩展改用 IntersectionObserver（source/js/runtime/extensions/reveal.js），
//        元素从 display:none 变可见会重新触发淡入，卡住的 opacity 不会再出现。
// 这三段的 1.44 原文归档在 site/tools/v1-assets/（不放 source/ 下，避免被 hexo 拷进 public）。
//
// 现在只剩两件 v2 给不了的增量，都是"视觉/文案"级：
//   A. 收起按钮的位置：v2 把它放在 .site-region__system（和「设置」入口同一行，展开态页脚两行），
//      本站调了八轮出来的版式是社交图标行末尾那格（页脚一行图标 + 下面一行设置），这里把节点搬进
//      .site-region__footer-actions .region-actions 的最后一格，并给这块固定 widget 补
//      data-leftbar-rail 让它在收起态窄栏里可见（详见 makeRailAware 注释）。
//      点击逻辑是 document 上的 data-shell-action 委托（source/js/main.js:372），搬节点不影响生效。
//   B. 文案：主题的 aria-label 是硬编码英文 'Collapse leftbar' / 'Expand leftbar'
//      （source/js/main.js:145-149，languages 里没有对应 key），换成中文。
//      主题每次切换状态都会重写这两个属性，所以用 MutationObserver 补，不是一次性替换。
//   C.【阶段 6 之后，用户反馈 2】副标题两行翻字：v1 主题会把 logo.subtitle 按 '|' 拆成
//      .sub.normal + .sub.hover 两个 div，悬停站名块时上下两行互换（动效在 v1 的
//      sidebar/logo.styl:63-87，是纯 CSS）。v2 的 .brand-tagline 只渲染单行且
//      nowrap+ellipsis（main.css:8227-8238），13 个字在 167px 里放不下 → 后半句被省略号吞掉。
//      这里只做 v1 那一步「按 | 拆成两个 span」，翻字动效在 leftbar-extras.css 第 5 段。
//      拆完的类名按 v2 命名风格自取（brand-tagline__line / __normal / __hover），
//      不复用 v1 的 .sub（用户决策 1：照 v2 类重写）。
(function () {
  var LABELS = { expanded: '收起侧边栏', collapsed: '展开侧边栏', drawer_open: '关闭侧边栏', drawer_close: '打开侧边栏' };

  function currentLabel(btn) {
    var raw = btn.getAttribute('aria-label') || '';
    if (/^close /i.test(raw)) return LABELS.drawer_close;
    if (/^open /i.test(raw)) return LABELS.drawer_open;
    if (/^expand /i.test(raw)) return LABELS.collapsed;
    if (/^collapse /i.test(raw)) return LABELS.expanded;
    return null;
  }

  function localize(btn) {
    var want = currentLabel(btn);
    if (!want) return;
    if (btn.getAttribute('aria-label') !== want) btn.setAttribute('aria-label', want);
    if (btn.getAttribute('title') !== want) btn.setAttribute('title', want);
  }

  function relocate(btn, row) {
    if (btn.parentNode === row) return;
    row.appendChild(btn);
  }

  // 收起态窄栏里主题有一条 .widget-instance:not([data-leftbar-rail]){display:none}
  // （source/css/_components/layout.styl:304，leftbar-rail() 内），而 data-leftbar-rail
  // 只在 widgets.ejs:69/72/78 硬编码给 brand / menu / settings 三个固定 widget，
  // 固定的 actions widget（data-widget-id="leftbar:fixed:actions"）没有 → 收起态整块隐藏。
  // 我们既然把展开按钮搬进了这一块的最后一格，就得给它补上这个属性，
  // 否则收起后窄栏底部没有展开入口（实测补属性前按钮 rect 0×0，补完 40×40 可见）。
  function makeRailAware(row) {
    var widget = row.closest('.widget-instance');
    if (widget && !widget.hasAttribute('data-leftbar-rail')) widget.setAttribute('data-leftbar-rail', '');
  }

  // C. 副标题按 '|' 拆两行（幂等：已经拆过就不再动，partial navigation 重建节点后再拆一次）
  function splitTagline(region) {
    var el = region.querySelector('.widget-instance--brand .brand-tagline');
    if (!el || el.querySelector('.brand-tagline__line')) return;
    var parts = (el.textContent || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean);
    if (parts.length < 2) return; // 没写 '|' 就保持主题的单行行为，不做任何改动
    var rest = parts.slice(1).join(' · ');
    el.textContent = '';
    var normal = document.createElement('span');
    normal.className = 'brand-tagline__line brand-tagline__normal';
    normal.textContent = parts[0];
    var hover = document.createElement('span');
    hover.className = 'brand-tagline__line brand-tagline__hover';
    hover.textContent = rest;
    el.appendChild(normal);
    el.appendChild(hover);
  }

  function init() {
    var region = document.querySelector('.site-region--leftbar');
    if (!region) return;
    splitTagline(region);
    var btn = region.querySelector('.leftbar-state-toggle[data-shell-action="toggle-leftbar"]');
    if (!btn) return;
    var row = region.querySelector('.site-region__footer-actions .region-actions');
    if (row) {
      makeRailAware(row);
      relocate(btn, row);
    }
    localize(btn);
    // 主题在每次收起/展开时重写 aria-label（英文），跟着补一次中文；
    // 只观察属性变化，且赋值前先比对，观察回调不会自激循环。
    if (typeof MutationObserver === 'function') {
      var mo = new MutationObserver(function () { localize(btn); });
      mo.observe(btn, { attributes: true, attributeFilter: ['aria-label', 'title'] });
    }
    // 部分导航可能重建左栏节点，换页后再确认一次位置
    document.addEventListener('stellar:navigation-complete', function () {
      var next = document.querySelector('.site-region--leftbar');
      if (next) splitTagline(next);              // 副标题节点可能整块重建，先补拆行
      var again = document.querySelector('.site-region--leftbar .leftbar-state-toggle[data-shell-action="toggle-leftbar"]');
      if (!again || again === btn) return;
      btn = again;
      var nextRow = document.querySelector('.site-region--leftbar .site-region__footer-actions .region-actions');
      if (nextRow) {
        makeRailAware(nextRow);
        relocate(btn, nextRow);
      }
      localize(btn);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
