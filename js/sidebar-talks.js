/**
 * sidebar-talks.js（本站适配版 v2）
 * 主页右栏「近期说说」widget：数据源为站内静态 /talks.json
 * （nightfall 原版拉取其私有 ech0 API，本站未部署说说后端）。
 * 条目格式 v2：[{ id, content, created_at, updated_at?, images? }]，
 * images 为站内路径数组（形如 /img/talks/xxx.webp，由桌面客户端压缩落盘）；
 * 旧条目没有 images 字段仍合法，只是不显示缩略图。空数组时显示空状态。
 * 点击条目跳到 /shuoshuo/#talk-xxx 锚点。
 */
(function() {
  const API = '/talks.json';
  const AVATAR = '/img/avatar-20260927-203311.jpg';
  const NICKNAME = 'Kenzo';
  const LIMIT = 6;
  // 缩略图最多 3 张，多出的显示 +N
  const MAX_THUMBS = 3;
  // 只认客户端图片管线产出的站内路径，防止 talks.json 被写坏后带出外部/越界 URL
  const TALK_IMG_RE = /^\/img\/talks\/[\w.\-]+$/;

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function formatTime(ts) {
    if (!ts) return '';
    // ech0 API 返回 Unix 秒，new Date(number) 按 ms 解析所以要 *1000
    const d = new Date(typeof ts === 'number' ? ts * 1000 : ts);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + ' 天前';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const MM = String(d.getMinutes()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd} ${HH}:${MM}`;
  }

  function truncate(s, n) {
    s = String(s || '').trim();
    // 去掉常见 markdown 语法符号，让摘要干净
    s = s.replace(/[#*`>_~]/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[[^\]]*\]\(([^)]*)\)/g, '$1').replace(/\s+/g, ' ').trim();
    if (s.length > n) return s.slice(0, n) + '…';
    return s;
  }

  /** 缩略图区：路径先过白名单，非法路径整条丢弃；超出 3 张折叠成 +N */
  function renderThumbs(item) {
    const raw = Array.isArray(item.images) ? item.images : [];
    const urls = raw.filter(u => typeof u === 'string' && TALK_IMG_RE.test(u));
    if (!urls.length) return '';
    const shown = urls.slice(0, MAX_THUMBS);
    const more = urls.length - shown.length;
    const cells = shown.map((u, i) => {
      const label = i === shown.length - 1 && more > 0 ? `<span class="talk-thumb-more">+${more}</span>` : '';
      return `<span class="talk-thumb"><img src="${escapeHtml(u)}" alt="说说图片" loading="lazy">${label}</span>`;
    });
    return `<div class="talk-thumbs">${cells.join('')}</div>`;
  }

  function renderItem(item) {
    const content = truncate(item.content, 80);
    const time = formatTime(item.created_at);
    const id = escapeHtml(item.id);
    // 复用 stellar 的 .tag-plugin.timeline .timenode 结构，
    // 让 stellar 自带的 CSS（左侧竖线 + header 圆点 + hover 变色）直接生效
    return `
      <div class="timenode">
        <div class="header">
          <a class="user-info">
            <img src="${AVATAR}" alt="${escapeHtml(NICKNAME)}" onerror="this.style.display='none'">
            <span>${escapeHtml(NICKNAME)}</span>
          </a>
          <span>${time}</span>
        </div>
        <a class="body" href="/shuoshuo/#talk-${id}">
          <p>${escapeHtml(content)}</p>
          ${renderThumbs(item)}
        </a>
      </div>
    `;
  }

  async function load() {
    const el = document.getElementById('sidebar-talks');
    if (!el) return;
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const items = (Array.isArray(json) ? json : (json.data?.items || [])).slice(0, LIMIT);
      if (items.length === 0) {
        el.className = 'sidebar-talks-empty';
        el.innerHTML = '还没有说说，<a href="/shuoshuo/">去发一条</a>';
        return;
      }
      // 用 stellar 的 .tag-plugin.timeline 类，让 timenode 的竖线+圆点样式生效
      el.className = 'tag-plugin timeline sidebar-talks-container';
      el.innerHTML = items.map(renderItem).join('');
    } catch (err) {
      el.className = 'sidebar-talks-error';
      el.innerHTML = '说说加载失败：' + (err.message || err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }

  // 把「近期说说」widget-header 做成可点击按钮：单击跳转到 /shuoshuo/
  // CSS 已加上 cursor:pointer + hover 底色，这里只挂导航
  function bindHeaderClick() {
    const header = document.querySelector('.widget-wrapper.markdown:has(#sidebar-talks) .widget-header');
    if (!header || header.dataset.bound === '1') return;
    header.dataset.bound = '1';
    header.addEventListener('click', (e) => {
      // 避免点 header 内的子链接（如未来的 a 标签）也触发跳转
      if (e.target.closest('a[href]')) return;
      location.href = '/shuoshuo/';
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindHeaderClick);
  } else {
    bindHeaderClick();
  }
})();
