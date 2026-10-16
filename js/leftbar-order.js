// leftbar-order.js —— Stellar 2.0.0 版
// 目的没变：本站侧边栏顺序要维持「头像标题 → 菜单 → 搜索」，这是 1.33.1 时代的线上布局，
// 1.44 把菜单塞进 widgets（搜索框之后）时靠这个脚本搬回来。
//
// v2 的变化（选择器全部按实测 DOM 重写，不再依赖 1.44 的 .leftbar-container / .nav-area）：
//   头像+标题+搜索   → #leftbar-region .widget-instance--brand > .brand-header > .brand-wrap / .brand-search
//   菜单             → .site-region__zone--body > .widget-instance--menu（自带 data-leftbar-rail）
//   正文区           → .widgets.widget-stack--leftbar
// 也就是说 v2 原生顺序是「品牌区（含搜索）→ 菜单 → widgets」，和 1.44 一样把搜索排在菜单前面，
// 所以这个脚本仍然要有，只是搬的节点换了。
//
// 为什么把 .brand-search 塞进 .widget-instance--menu 而不是并列放在它后面：
// 收起态的窄栏样式里，v2 只给带 data-leftbar-rail 的 .widget-instance 里的
// .ui-collection__item 配 40px 方块（实测 public/css/main.css 的
// html[data-leftbar-state='collapsed'] … .widget-instance[data-leftbar-rail] .ui-collection > .ui-collection__item）。
// .menu 这个 widget-instance 正好带该属性，搜索按钮作为它的子节点可以直接复用原生的收起态方块待遇，
// 不用我们再写一份窄栏尺寸。
//
// 部分导航（features.partial_navigation）换页时左栏可能被重建，所以除了首次，
// 每次 stellar:navigation-complete 之后都再补一次；函数本身幂等。
(function () {
  function fix() {
    var region = document.querySelector('.site-region--leftbar');
    if (!region) return;
    var search = region.querySelector('.widget-instance--brand .brand-search');
    var menu = region.querySelector('.widget-instance--menu');
    if (!search || !menu) return;                       // brand.search: false 时主题不渲染这个节点
    if (!search.querySelector('.search-trigger')) return;
    if (search.parentNode === menu) return;             // 已经搬过，避免重复插入
    menu.appendChild(search);
  }

  function bind() {
    fix();
    document.addEventListener('stellar:navigation-complete', fix);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
