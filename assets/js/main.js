/* ═══════════════════════════════════════════════════════════════
   XENOPRIME — Core JavaScript
   Cursor effects, scroll animations, navigation, interactions
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Loading Screen ─── */
  function initLoader() {
    const loader = document.querySelector('.loader');
    if (!loader) return;
    
    function hideLoader() {
      setTimeout(function () { loader.classList.add('loaded'); }, 800);
    }
    
    if (document.readyState === 'complete') {
      hideLoader();
    } else {
      window.addEventListener('load', hideLoader);
      // Fallback in case load event gets blocked
      setTimeout(hideLoader, 3000);
    }
  }

  /* ─── Lenis Smooth Scroll ─── */
  function initLenis() {
    if (reducedMotion || typeof Lenis === 'undefined') return null;
    const lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      orientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync with GSAP ScrollTrigger
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    return lenis;
  }

  /* ─── Navigation ─── */
  function initNav() {
    const nav = document.querySelector('.nav');
    const toggle = document.querySelector('.nav__toggle');
    const mobile = document.querySelector('.nav__mobile');
    if (!nav) return;

    // Scroll detection
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          nav.classList.toggle('scrolled', window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    });

    // Mobile toggle
    if (toggle && mobile) {
      toggle.addEventListener('click', function () {
        toggle.classList.toggle('open');
        mobile.classList.toggle('open');
        document.body.style.overflow = mobile.classList.contains('open') ? 'hidden' : '';
      });
      mobile.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          toggle.classList.remove('open');
          mobile.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }

    // Active link on scroll
    var sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', function () {
      var scrollY = window.scrollY + 200;
      sections.forEach(function (section) {
        var top = section.offsetTop;
        var height = section.offsetHeight;
        var id = section.getAttribute('id');
        var link = nav.querySelector('.nav__link[href="#' + id + '"]');
        if (link) {
          if (scrollY >= top && scrollY < top + height) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        }
      });
    });
  }

  /* ─── Cursor Effects ─── */
  function initCursor() {
    if (window.matchMedia('(hover: none)').matches || reducedMotion) return;

    var glow = document.querySelector('.cursor-glow');
    var dot = document.querySelector('.cursor-dot');
    if (!glow || !dot) return;

    var mx = 0, my = 0;
    var gx = 0, gy = 0;
    var dx = 0, dy = 0;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
    });

    function animateCursor() {
      // Glow follows with inertia
      gx += (mx - gx) * 0.08;
      gy += (my - gy) * 0.08;
      glow.style.left = gx + 'px';
      glow.style.top = gy + 'px';

      // Dot follows tightly
      dx += (mx - dx) * 0.2;
      dy += (my - dy) * 0.2;
      dot.style.left = dx + 'px';
      dot.style.top = dy + 'px';
      
      // Global background subtle parallax
      var globalBg = document.getElementById('globalBg');
      if (globalBg) {
        var xWarp = (mx / window.innerWidth - 0.5) * 15;
        var yWarp = (my / window.innerHeight - 0.5) * 15;
        globalBg.style.transform = `translate(${xWarp}px, ${yWarp}px)`;
      }

      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover detection on interactive elements
    var hoverTargets = document.querySelectorAll('a, button, .card, .service-card, .faq-item__trigger');
    hoverTargets.forEach(function (el) {
      el.addEventListener('mouseenter', function () { dot.classList.add('hovering'); });
      el.addEventListener('mouseleave', function () { dot.classList.remove('hovering'); });
    });
  }

  /* ─── Scroll Progress Bar ─── */
  function initScrollProgress() {
    var bar = document.querySelector('.scroll-progress');
    if (!bar) return;
    window.addEventListener('scroll', function () {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? scrollTop / docHeight : 0;
      bar.style.transform = 'scaleX(' + progress + ')';
    });
  }

  /* ─── Back to Top ─── */
  function initBackToTop() {
    var btn = document.querySelector('.back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('visible', window.scrollY > 600);
    });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ─── 3D Scroll Animations (GSAP ScrollTrigger) ─── */
  function initScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // 1. Hero Parallax
    gsap.to('.hero__layout', {
      yPercent: 30,
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    // 2. 3D Services Grid (Apple-style 3D Scroll Skew)
    gsap.from('.service-card', {
      scrollTrigger: {
        trigger: '#services',
        start: 'top 80%'
      },
      y: 120,
      opacity: 0,
      rotationX: 25,
      rotationY: -5,
      scale: 0.9,
      stagger: 0.15,
      duration: 1.4,
      ease: 'power3.out',
      transformOrigin: 'bottom center'
    });

    // 3. Process Steps (Stagger & Scale)
    gsap.from('.process__step', {
      scale: 0.8,
      opacity: 0,
      y: 60,
      rotationX: 15,
      stagger: 0.15,
      duration: 1.2,
      ease: 'back.out(1.5)',
      scrollTrigger: {
        trigger: '#process',
        start: 'top 75%'
      }
    });

    // 4. Stats Counter Reveal
    gsap.from('.stat', {
      opacity: 0,
      scale: 0.5,
      stagger: 0.1,
      duration: 0.8,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: '#stats',
        start: 'top 85%'
      }
    });

    // 5. Testimonial Track (Horizontal scroll effect)
    gsap.from('.testimonial-card', {
      x: 150,
      opacity: 0,
      rotationY: -15,
      stagger: 0.15,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#testimonials',
        start: 'top 75%'
      }
    });

    // 6. FAQ Items
    gsap.from('.faq-item', {
      y: 30,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '#faq',
        start: 'top 80%'
      }
    });

    // 7. Footer 3D Reveal
    gsap.from('.footer__flower', {
      y: 100,
      rotationZ: -10,
      opacity: 0,
      duration: 1.5,
      ease: 'elastic.out(1, 0.5)',
      scrollTrigger: {
        trigger: '.footer',
        start: 'top 90%'
      }
    });

    var heroActions = document.querySelector('.hero__actions');
    if (heroActions) {
      gsap.from(heroActions, {
        y: 30,
        opacity: 0,
        duration: 1,
        delay: 2,
        ease: 'power3.out',
      });
    }

    var heroStats = document.querySelector('.hero__stats');
    if (heroStats) {
      gsap.from(heroStats, {
        y: 30,
        opacity: 0,
        duration: 1,
        delay: 2.3,
        ease: 'power3.out',
      });
    }

    // Counter animation with Randomization
    gsap.utils.toArray('[data-counter]').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-counter'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      var prefix = el.getAttribute('data-prefix') || '';
      
      // Add randomness for a dynamic, professional feel
      var labelText = (el.nextElementSibling || {}).textContent || '';
      if (labelText.includes("Projects Delivered")) {
        target = Math.floor(Math.random() * (140 - 80 + 1) + 80); // Random between 80-140
      } else if (labelText.includes("Client Satisfaction")) {
        target = 99; // Keep very high
      } else if (labelText.includes("Avg. Turnaround")) {
        target = Math.floor(Math.random() * (60 - 36 + 1) + 36); // Random between 36-60 hrs
      }

      var proxy = { val: 0 };
      
      gsap.to(proxy, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        val: target,
        duration: 2.5,
        ease: 'power3.out',
        onUpdate: function () {
          el.textContent = prefix + Math.round(proxy.val) + suffix;
        }
      });
    });
  }

  /* ─── FAQ Accordion ─── */
  function initFAQ() {
    var items = document.querySelectorAll('.faq-item__trigger');
    items.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var item = trigger.parentElement;
        var wasOpen = item.classList.contains('open');
        // Close all
        document.querySelectorAll('.faq-item.open').forEach(function (el) {
          el.classList.remove('open');
        });
        // Toggle current
        if (!wasOpen) { item.classList.add('open'); }
      });
    });
  }

  /* ─── Button Ripple Effect ─── */
  function initRipple() {
    document.querySelectorAll('.btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var ripple = document.createElement('span');
        ripple.classList.add('btn-ripple');
        var rect = btn.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', function () { ripple.remove(); });
      });
    });
  }

  /* ─── Magnetic Buttons ─── */
  function initMagnetic() {
    if (reducedMotion || window.matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = 'translate(' + (x * 0.15) + 'px, ' + (y * 0.15) + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = 'translate(0, 0)';
        el.style.transition = 'transform 0.4s cubic-bezier(0.16,1,0.3,1)';
        setTimeout(function () { el.style.transition = ''; }, 400);
      });
    });
  }

  /* ─── Contact Modal ─── */
  function initContactModal() {
    var overlay = document.getElementById('contactModal');
    if (!overlay) return;
    window.openContactModal = function (e) {
      if (e) e.preventDefault();
      overlay.classList.add('open');
    };
    window.closeContactModal = function () {
      overlay.classList.remove('open');
    };
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) window.closeContactModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') window.closeContactModal();
    });
  }

  /* ─── Glowing Firefly Particles ─── */
  // Removed: Now handled by webgl-hero.js using Three.js

  /* ─── Smooth Anchor Scroll ─── */
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var target = document.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ─── Form Handling ─── */
  function initForms() {
    var form = document.getElementById('orderForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('.btn--primary');
      btn.textContent = 'Sending...';
      btn.disabled = true;
      // Simulate submission
      setTimeout(function () {
        btn.textContent = '✓ Request Sent';
        btn.style.background = 'var(--accent-cyan)';
        showToast('Your request has been received! We\'ll respond within 24 hours.');
      }, 1500);
    });
  }

  /* ─── Toast ─── */
  function showToast(msg) {
    var toast = document.querySelector('.toast');
    if (!toast) return;
    toast.querySelector('.toast__text').textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 4000);
  }

  /* ─── Tilt Effect on Cards ─── */
  function initTilt() {
    if (reducedMotion || window.matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = 'perspective(800px) rotateY(' + (x * 8) + 'deg) rotateX(' + (-y * 8) + 'deg) translateY(-4px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
        el.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
        setTimeout(function () { el.style.transition = ''; }, 500);
      });
    });
  }

  /* ─── 3D Hero Parallax ─── */
  function init3DHero() {
    if (reducedMotion || window.matchMedia('(hover: none)').matches) return;
    var hero = document.getElementById('hero');
    if (!hero) return;

    var bgWords = document.querySelectorAll('.hero__bg-word');

    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      var y = (e.clientY - rect.top) / rect.height - 0.5;

      // Parallax background words
      bgWords.forEach(function (word) {
        var p = parseFloat(word.getAttribute('data-parallax')) || 0.1;
        word.style.transform = 'translate3d(' + (x * 100 * p) + 'px, ' + (y * 100 * p) + 'px, 0)';
      });
    });

    hero.addEventListener('mouseleave', function () {
      bgWords.forEach(function (word) {
        word.style.transform = 'translate3d(0, 0, 0)';
        word.style.transition = 'transform 0.8s cubic-bezier(0.16,1,0.3,1)';
        setTimeout(function () { word.style.transition = ''; }, 800);
      });
    });
  }

  /* ─── Apple-style Liquid Glass Physics ─── */
  function initLiquidGlass() {
    if (typeof liquidGlass !== 'function') return;
    
    var glassElements = document.querySelectorAll('.service-card, .process__step, .testimonial-card, .nav, .modal-card');
    glassElements.forEach(function(el) {
      liquidGlass(el, {
        scale: -300,    // Extreme Bulge strength
        chroma: 40,     // Extreme Rainbow Chromatic fringe
        blur: 24,       // Base frosted blur
        saturate: 2.0,  // Boost saturation underneath
        border: 4       // Pixel thickness of the rim
      });
      el.classList.add('is-liquid-glass');
    });
  }

  /* ─── Ambient Background Particles ─── */
  function initAmbientParticles() {
    var canvas = document.getElementById('ambient-particles');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w, h, particles = [];
    
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    for (var i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 3 + 1,
        dx: (Math.random() - 0.5) * 0.5,
        dy: Math.random() * -1 - 0.5,
        opacity: Math.random() * 0.5 + 0.1
      });
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(function(p) {
        p.x += p.dx;
        p.y += p.dy;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 170, 0, ' + p.opacity + ')';
        ctx.fill();
      });
      requestAnimationFrame(animate);
    }
    animate();
  }

  /* ─── Initialize Everything ─── */
  document.addEventListener('DOMContentLoaded', function () {
    initLoader();
    initLenis();
    initNav();
    initCursor();
    initScrollProgress();
    initBackToTop();
    initScrollAnimations(); // Replaced initGSAPAnimations
    initFAQ();
    initRipple();
    initMagnetic();
    initContactModal();
    initSmoothAnchors();
    initForms();
    initTilt();
    init3DHero();
    initAmbientParticles();
    initLiquidGlass();
  });
})();
