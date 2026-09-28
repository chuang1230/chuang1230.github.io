/* === swiper 图片分组：让 fancybox 放大后支持左右翻页 ===
   swiper 标签源码只渲染裸 <img>，没有 <a data-fancybox> 包裹，
   fancybox 打开后只显示单张图，无法翻到同组其他图片。
   这里给每个 swiper 容器内的图片按容器索引分组，
   加 data-fancybox="swiper-gallery-N" 属性，
   fancybox v5 会把相同 data-fancybox 值的图片归为一组，
   放大后即可左右箭头/键盘 ←→ 翻页浏览同一主题的所有照片。 */
(function () {
  function groupSwiperImages() {
    var swipers = document.querySelectorAll('.tag-plugin.swiper');
    swipers.forEach(function (swiper, i) {
      var imgs = swiper.querySelectorAll('.swiper-slide img');
      imgs.forEach(function (img) {
        img.setAttribute('data-fancybox', 'swiper-gallery-' + i);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', groupSwiperImages);
  } else {
    groupSwiperImages();
  }
})();
