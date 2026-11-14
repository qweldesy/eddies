/* Eddie’s — интерфейс: меню, анимации, галерея, форма */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var M = window.Motion || null;
  var EASE = [0.22, 1, 0.36, 1];

  /* ---------------- header + active nav ---------------- */

  var header = $('#site-header');
  var bar = $('#mobile-bar');
  var onScroll = function () {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('is-scrolled', y > 10);
    if (bar) bar.classList.toggle('is-visible', y > 620);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var navLinks = $$('.desktop-nav a');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ---------------- mobile menu ---------------- */

  var burger = $('#burger');
  var menu = $('#mobile-menu');
  var main = $('#main');
  var footer = $('.site-footer');
  var lastFocus = null;

  var focusables = function () {
    return $$('a[href], button:not([disabled])', menu).filter(function (el) {
      return el.offsetParent !== null;
    });
  };

  function openMenu() {
    lastFocus = document.activeElement;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Закрыть меню');
    document.body.classList.add('menu-open');
    if (main) main.inert = true;
    if (footer) footer.inert = true;
    window.setTimeout(function () {
      var first = focusables()[0];
      if (first) first.focus();
    }, 60);
  }

  function closeMenu(restore) {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    document.body.classList.remove('menu-open');
    if (main) main.inert = false;
    if (footer) footer.inert = false;
    if (restore && lastFocus) lastFocus.focus();
  }

  if (burger) {
    burger.addEventListener('click', function () {
      if (menu.classList.contains('is-open')) closeMenu(true);
      else openMenu();
    });
  }

  $$('.mobile-nav a, .mobile-menu-actions a').forEach(function (link) {
    link.addEventListener('click', function () { closeMenu(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (lightbox.classList.contains('is-open')) closeLightbox(true);
      else if (menu.classList.contains('is-open')) closeMenu(true);
      return;
    }
    if (e.key === 'Tab' && menu.classList.contains('is-open')) {
      var items = focusables();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 920 && menu.classList.contains('is-open')) closeMenu(false);
  });

  /* ---------------- reveal on scroll ---------------- */

  var reveals = $$('.js-reveal');
  if (reveals.length) {
    if (reduceMotion || !M || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.remove('js-reveal'); });
    } else {
      document.documentElement.classList.add('reveal-on');
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          revealObserver.unobserve(el);
          el.classList.remove('js-reveal');
          M.animate(el, { opacity: [0, 1], transform: ['translateY(22px)', 'translateY(0px)'] }, { duration: 0.7, easing: EASE });
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach(function (el) { revealObserver.observe(el); });

      /* страховка: если observer не сработал — контент не должен остаться скрытым */
      window.setTimeout(function () {
        $$('.js-reveal').forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight) el.classList.remove('js-reveal');
        });
      }, 2600);
    }
  }

  /* ---------------- hero entrance ---------------- */

  if (M && !reduceMotion) {
    var heroBits = [
      [$('.hero-top'), 0.05],
      [$('.hero-title'), 0.16],
      [$('.hero-sub'), 0.28],
      [$('.hero-actions'), 0.36],
      [$('.hero-rating'), 0.42],
      [$('.hero-quote'), 0.5],
      [$('.hero-facts'), 0.55]
    ];
    heroBits.forEach(function (pair) {
      var el = pair[0];
      if (!el) return;
      try {
        el.style.opacity = '0';
        M.animate(el, { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0px)'] }, { duration: 0.8, delay: pair[1] + 0.15, easing: EASE }).finished.then(function () {
          el.style.opacity = '';
          el.style.transform = '';
        }).catch(function () {
          el.style.opacity = '';
          el.style.transform = '';
        });
      } catch (e) {
        el.style.opacity = '';
      }
    });
  }

  /* ---------------- marquee ---------------- */

  var strip = $('#strip-track');
  if (strip && M && !reduceMotion) {
    M.animate(strip, { x: ['0%', '-50%'] }, { duration: 38, easing: 'linear', repeat: Infinity });
  }

  /* ---------------- gallery lightbox ---------------- */

  var lightbox = $('#lightbox');
  var lbImg = $('#lb-img');
  var lbCaption = $('#lb-caption');
  var lbCounter = $('#lb-counter');
  var lbClose = $('#lb-close');
  var lbPrev = $('#lb-prev');
  var lbNext = $('#lb-next');
  var items = $$('.gallery-item');
  var current = 0;
  var lbLastFocus = null;

  function renderSlide(i) {
    current = (i + items.length) % items.length;
    var btn = items[current];
    var full = btn.getAttribute('data-full');
    var inner = btn.querySelector('img');
    lbImg.src = full;
    lbImg.alt = inner ? inner.alt : '';
    lbCaption.textContent = btn.getAttribute('data-caption') || '';
    lbCounter.textContent = (current + 1) + ' / ' + items.length;
  }

  function openLightbox(i) {
    lbLastFocus = document.activeElement;
    renderSlide(i);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lb-open');
    if (M && !reduceMotion) {
      M.animate(lightbox, { opacity: [0, 1] }, { duration: 0.25, easing: EASE });
    }
    lbClose.focus();
  }

  function closeLightbox(restore) {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lb-open');
    if (restore && lbLastFocus) lbLastFocus.focus();
  }

  items.forEach(function (btn, i) {
    btn.addEventListener('click', function () { openLightbox(i); });
  });

  if (lbClose) lbClose.addEventListener('click', function () { closeLightbox(true); });
  if (lbPrev) lbPrev.addEventListener('click', function () { renderSlide(current - 1); });
  if (lbNext) lbNext.addEventListener('click', function () { renderSlide(current + 1); });
  if (lightbox) lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(true); });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); renderSlide(current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); renderSlide(current - 1); }
  });

  /* ---------------- booking form ---------------- */

  var form = $('#booking-form');
  var status = $('#form-status');
  var nameInput = $('#name');
  var phoneInput = $('#phone');
  var carInput = $('#car');
  var serviceSelect = $('#service');

  function fieldOf(input) { return input.closest('.field'); }

  function setError(input, message) {
    var field = fieldOf(input);
    var error = $('#' + input.id + '-error');
    if (!field) return;
    field.classList.add('has-error');
    if (error && message) error.textContent = message;
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError(input) {
    var field = fieldOf(input);
    if (!field) return;
    field.classList.remove('has-error');
    input.removeAttribute('aria-invalid');
  }

  if (form) {
    [nameInput, phoneInput].forEach(function (input) {
      input.addEventListener('input', function () { clearError(input); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = nameInput.value.trim();
      var phone = phoneInput.value.trim();
      var digits = phone.replace(/\D/g, '');
      var car = carInput.value.trim();
      var service = serviceSelect.value;
      var ok = true;

      if (name.length < 2) { setError(nameInput, 'Укажите имя'); ok = false; } else clearError(nameInput);
      if (digits.length < 10) { setError(phoneInput, 'Проверьте номер телефона'); ok = false; } else clearError(phoneInput);

      if (!ok) {
        (name.length < 2 ? nameInput : phoneInput).focus();
        return;
      }

      var lines = [
        'Здравствуйте! Хочу записаться в Eddie’s.',
        'Имя: ' + name,
        'Телефон: ' + phone
      ];
      if (car) lines.push('Автомобиль: ' + car);
      if (service) lines.push('Задача: ' + service);
      lines.push('Источник: сайт eddies');

      var url = 'https://wa.me/79033430446?text=' + encodeURIComponent(lines.join('\n'));
      var win = window.open(url, '_blank', 'noopener');
      if (!win) window.location.href = url;
      status.textContent = 'Открыли WhatsApp с текстом заявки. Если окно не появилось — позвоните: +7 903 343-04-46.';
    });
  }

  /* ---------------- today highlight ---------------- */

  var today = new Date().getDay();
  $$('#hours-list span').forEach(function (row) {
    if (Number(row.getAttribute('data-day')) === today) row.classList.add('is-today');
  });

})();
