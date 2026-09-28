/**
 * footer-uptime.js
 * 计算从站点创建时间到当前的运行时长，每秒刷新一次
 * 用 UTC 方法计算，避免访客时区差异导致数字不一致
 */
(function() {
  // 站点创建时间：取本站最早一篇笔记的日期（原博客开站口径，可自行修改）
  const BIRTH = new Date('2019-01-01T00:00:00+08:00');
  const BIRTH_UTC = BIRTH.getTime();
  const el = document.getElementById('uptime-counter');
  if (!el) return;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function update() {
    const now = new Date();
    const diff = now.getTime() - BIRTH_UTC;
    if (diff < 0) {
      el.textContent = '即将开站';
      return;
    }

    // 全部用 UTC 方法，避免不同时区访客看到不同结果
    const b = new Date(BIRTH_UTC);
    let years   = now.getUTCFullYear() - b.getUTCFullYear();
    let months  = now.getUTCMonth()    - b.getUTCMonth();
    let days    = now.getUTCDate()     - b.getUTCDate();
    let hours   = now.getUTCHours()    - b.getUTCHours();
    let minutes = now.getUTCMinutes()  - b.getUTCMinutes();
    let seconds = now.getUTCSeconds()  - b.getUTCSeconds();

    // 借位：秒→分→时→天→月，月借位时要补上一个农历月的天数
    if (seconds < 0) { seconds += 60; minutes--; }
    if (minutes < 0) { minutes += 60; hours--;   }
    if (hours   < 0) { hours   += 24; days--;     }
    if (days    < 0) {
      // 上个月的天数：Date.UTC(year, monthIndex, 0) 返回上个月最后一天
      const lastOfPrev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
      days += lastOfPrev.getUTCDate();
      months--;
    }
    if (months  < 0) { months  += 12; years--;    }

    const parts = [];
    if (years  > 0)                      parts.push(years + ' 年');
    if (months > 0 || years > 0)         parts.push(months + ' 个月');
    if (days   > 0 || months > 0 || years > 0) parts.push(days + ' 天');
    parts.push(pad(hours) + ' 时 ' + pad(minutes) + ' 分 ' + pad(seconds) + ' 秒');

    el.textContent = parts.join(' ');
  }

  update();
  setInterval(update, 1000);
})();
