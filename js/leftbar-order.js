// 1.44.0 把侧边栏菜单挪进了 widgets 里（搜索框之后），线上 1.33.1 的顺序是 logo → 菜单 → 搜索
// 这里把 nav-area 移回搜索框前面，对齐线上布局
(function () {
  function fix() {
    var c = document.querySelector('.leftbar-container');
    if (!c) return;
    var nav = c.querySelector('.widgets > .nav-area');
    var search = c.querySelector(':scope > .search-wrapper');
    if (nav && search) c.insertBefore(nav, search);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fix);
  } else {
    fix();
  }
})();
