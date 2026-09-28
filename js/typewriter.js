/**
 * 打字机 slogan（v0 添加）
 * 作用于侧边栏「食用指南」组件里加粗的那句 tagline，
 * 逐字显示 + 电青闪烁光标（光标样式在 minimal-theme.css 的 .v0-typing）。
 * 尊重 prefers-reduced-motion：直接显示完整文字，不做动画。
 */
(function () {
  'use strict';

  var SPEED = 90;        // 每字毫秒
  var START_DELAY = 500; // 进入后延迟开始

  function pickTarget() {
    // 在侧边栏组件里挑加粗文本最长的一段作为 tagline
    var nodes = document.querySelectorAll('.widget-body strong, .widget-body b');
    var best = null;
    nodes.forEach(function (n) {
      var t = (n.textContent || '').trim();
      if (t.length >= 6 && (!best || t.length > best.textContent.trim().length)) {
        best = n;
      }
    });
    return best;
  }

  function typewrite(el) {
    var full = (el.textContent || '').trim();
    if (!full) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      el.classList.add('v0-typing', 'v0-typing-done');
      return;
    }

    el.textContent = '';
    el.classList.add('v0-typing');
    var i = 0;

    function step() {
      if (i <= full.length) {
        el.textContent = full.slice(0, i);
        i++;
        window.setTimeout(step, SPEED);
      } else {
        el.classList.add('v0-typing-done');
      }
    }
    window.setTimeout(step, START_DELAY);
  }

  function init() {
    var el = pickTarget();
    if (!el || el.dataset.v0Typed) return;
    el.dataset.v0Typed = '1';

    // 侧栏在首屏可见，用 IntersectionObserver 保险：进入视口再打字
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            io.disconnect();
            typewrite(el);
          }
        });
      }, { threshold: 0.4 });
      io.observe(el);
    } else {
      typewrite(el);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
