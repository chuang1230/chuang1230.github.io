/* topic-card-link.js — 第九轮 / 第十轮 / 第十一轮
 * 第九轮：1.44 专栏卡唯一链接是 cover 且跳最新文章；线上 1.33.1 是整卡点击跳
 * 专栏总览页 /topic/<slug>/。用 search.json（含总览页条目）建「标题→总览页」
 * 映射改写 cover 的 href，配合 code-enhance.css 把 cover 的 ::after 铺满整卡
 * 实现整卡点击；topic-posts 里的文章链接 z-index 抬高，不受影响。
 * 第十轮：
 * 1) cover 本身就是最新文章，但第八轮把它变成 96px 图标并隐藏了标题，
 *    列表看起来缺了最新一篇——加载时把 cover（最新文章）作为第一条
 *    回填进 topic-posts（回填发生在排序之前，升序排序会把它归位）；
 * 2) 总览页 /topic/<slug>/ 面包屑只有「主页 > 本专栏」，没有回专栏列表
 *    的入口——在「主页」后插入指向 /topic/ 的「专栏」面包屑，
 *    与文章页面包屑的「专栏」层对齐。
 * 第十一轮：
 * 1) 专栏卡内文章按时间升序（最早在前）；同日期时按标题里的
 *    集数（一）（二）… 做第二排序键；
 * 2) 带背景图的文章（正文自带 {% banner %} 标签）自动横幅被 CSS 隐藏，
 *    顶部图片卡缺面包屑返回入口——把被隐藏横幅里 #breadcrumb 的子节点
 *    克隆进 banner 的 .top 行，补上「主页 > 专栏 > 专栏名」路径；
 *    无背景图的文章页横幅面包屑本来就正常，不受影响。
 */
(function () {
  var path = location.pathname;
  var isList = /\/topic\/?$/.test(path);
  var isOverview = !isList && /^\/topic\/[^/]+\/$/.test(path);

  // 第十一轮：给 banner 文章页补面包屑。自动横幅（.article-banner-wrap）
  // 只是被 CSS :has() 隐藏，#breadcrumb 仍在 DOM 里，克隆即可；
  // 无 banner 标签的页面找不到节点直接返回，无副作用
  function injectBannerBreadcrumb() {
    var banner = document.querySelector('.md-text > .tag-plugin.banner');
    if (!banner || banner.querySelector('.banner-breadcrumb')) return;
    var src = document.querySelector('.article-banner-wrap #breadcrumb');
    if (!src || !src.children.length) return;
    var top = banner.querySelector('.content .top');
    if (!top) return;
    var wrap = document.createElement('div');
    wrap.className = 'banner-breadcrumb';
    Array.prototype.forEach.call(src.children, function (n) {
      var c = n.cloneNode(true);
      // 去掉克隆节点上的 id，避免与原横幅里的 #menu/#proj 重复
      if (c.removeAttribute) c.removeAttribute('id');
      wrap.appendChild(c);
    });
    top.appendChild(wrap);
  }

  if (!isList && !isOverview) {
    injectBannerBreadcrumb();
    return;
  }

  if (isOverview) {
    // 总览页：面包屑插「专栏」。现结构 [主页][sep][专栏名]，
    // 插成 [主页][sep][专栏][sep][专栏名]。两次 afterend 后插的靠前，
    // 所以先插链接再插 sep 副本（复用现有 sep 节点保持箭头样式一致）
    var bc = document.getElementById('breadcrumb');
    if (bc && !bc.querySelector('a[href="/topic/"]')) {
      var first = bc.querySelector('a.breadcrumb');
      var sep = bc.querySelector('.sep');
      if (first && sep) {
        var link = document.createElement('a');
        link.className = 'cap breadcrumb';
        link.href = '/topic/';
        link.textContent = '专栏';
        first.insertAdjacentElement('afterend', link);
        first.insertAdjacentElement('afterend', sep.cloneNode(true));
      }
    }
    return;
  }

  var cards = document.querySelectorAll('.post-card.topic');
  if (!cards.length) return;

  // 第十轮：最新文章回填。先于下方 search.json 改写 href 执行，
  // 此时 cover.href 还是最新文章地址。专栏卡只有一篇文章时
  // 模板不渲染 topic-posts，缺了就补建
  cards.forEach(function (card) {
    var cover = card.querySelector('a.cover');
    var headline = card.querySelector('.cover-info .headline');
    if (!cover || !headline) return;
    var caption = card.querySelector('.cover-info .caption');
    var list = card.querySelector('.topic-posts');
    if (!list) {
      var article = card.querySelector('article');
      if (!article) return;
      list = document.createElement('div');
      list.className = 'topic-posts';
      article.appendChild(list);
    }
    var wrap = document.createElement('div');
    wrap.className = 'archive-list';
    var a = document.createElement('a');
    a.className = 'post fs14';
    a.setAttribute('href', cover.getAttribute('href'));
    var time = document.createElement('time');
    // cover-info 里的日期是 2026-08-06 全写，列表 <time> 是 08-06，去年份对齐
    time.textContent = caption ? caption.textContent.trim().replace(/^\d{4}-/, '') : '';
    var span = document.createElement('span');
    span.textContent = headline.textContent.trim();
    a.appendChild(time);
    a.appendChild(span);
    wrap.appendChild(a);
    list.insertBefore(wrap, list.firstChild);
  });

  // 第十一轮：列表按时间升序（最早在前）。<time> 只有月-日（去年份），
  // 工作流三篇同为 08-06，再按标题集数（一）（二）… 做第二排序键，
  // 无集数的条目第二键为 Infinity，同日时排在有集数的之后
  cards.forEach(function (card) {
    var list = card.querySelector('.topic-posts');
    if (!list) return;
    var order = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
    function keys(row) {
      var t = row.querySelector('time');
      var span = row.querySelector('span');
      var m = span && span.textContent.match(/（([一二三四五六七八九十])）/);
      return [t ? t.textContent.trim() : '', m ? order[m[1]] : Infinity];
    }
    var rows = Array.prototype.slice.call(list.querySelectorAll('.archive-list'));
    rows.sort(function (a, b) {
      var ka = keys(a), kb = keys(b);
      if (ka[0] !== kb[0]) return ka[0] < kb[0] ? -1 : 1;
      return ka[1] - kb[1];
    });
    rows.forEach(function (row) { list.appendChild(row); });
  });

  fetch('/search.json')
    .then(function (r) { return r.json(); })
    .then(function (entries) {
      var map = {};
      (entries || []).forEach(function (e) {
        if (/^\/topic\/[^/]+\/$/.test(e.path)) map[e.title] = e.path;
      });
      cards.forEach(function (card) {
        var title = card.querySelector('.topic-title');
        var cover = card.querySelector('a.cover');
        if (!title || !cover) return;
        var url = map[title.textContent.trim()];
        if (url) cover.setAttribute('href', url);
      });
    })
    .catch(function () {});
})();
