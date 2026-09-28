/**
 * theme-toggle.js
 * 在左侧栏底部社交图标行末尾注入白天/夜间切换按钮（v2）
 * 复用 .social 的视觉语言：32px 圆格、默认 grayscale 单色、hover 显色+底色，
 * 与 github/rss 等图标同款待遇，不再用独立大 pill
 * light 显示太阳、dark 显示月亮，点击旋转渐变切换
 */
(function() {
  const SUN_ICON  = 'https://api.iconify.design/solar:sun-bold-duotone.svg?color=%23d97706';
  const MOON_ICON = 'https://api.iconify.design/solar:moon-stars-bold-duotone.svg?color=%238fc7ab';

  function stored() {
    return window.localStorage.getItem('Stellar.theme') || 'auto';
  }
  function effective() {
    const t = stored();
    if (t === 'auto') {
      // 无存储时跟随站点默认（prefers_theme），而不是系统偏好
      const def = document.documentElement.getAttribute('data-theme');
      if (def === 'dark' || def === 'light') return def;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return t;
  }

  function apply(next) {
    document.documentElement.setAttribute('data-theme', next);
    window.localStorage.setItem('Stellar.theme', next);
    if (window.utils && window.utils.dark) {
      window.utils.dark.mode = next;
      if (window.utils.dark.method && window.utils.dark.method.toggle && window.utils.dark.method.toggle.start) {
        window.utils.dark.method.toggle.start();
      }
    }
  }

  function updateBtn(btn, animate) {
    const current = effective();
    const img = btn.querySelector('img');
    if (img) {
      img.src = current === 'dark' ? MOON_ICON : SUN_ICON;
    }
    btn.classList.toggle('is-dark', current === 'dark');
    const label = current === 'dark' ? '切换到白天模式' : '切换到夜间模式';
    btn.setAttribute('aria-label', label);
    btn.title = label;
    if (animate) {
      btn.classList.remove('tt-spin');
      void btn.offsetWidth;
      btn.classList.add('tt-spin');
    }
  }

  function createToggle() {
    const wrap = document.querySelector('.l_left .social-wrap');
    if (!wrap) return null;
    let btn = wrap.querySelector('.theme-toggle-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'social theme-toggle-btn';
      btn.innerHTML = '<img alt=""/>';
      btn.addEventListener('click', () => {
        apply(effective() === 'dark' ? 'light' : 'dark');
        updateBtn(btn, true);
      });
      wrap.appendChild(btn);
    }
    updateBtn(btn, false);
    return btn;
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const btn = document.querySelector('.l_left .theme-toggle-btn');
    if (btn && stored() === 'auto') updateBtn(btn, false);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createToggle);
  } else {
    createToggle();
  }
})();
