(() => {
  const CFG = window.LP_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!CFG.SHOW_PENDENCIAS) document.documentElement.classList.add('no-pend');

  // Vídeo do YouTube: toca dentro da página, carrega o player só no clique
  $$('[data-yt]').forEach((btn) => btn.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    f.title = 'Passo a passo do processo seletivo';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    btn.replaceWith(f);
  }));

  // Header: fundo conforme a seção, barra de progresso
  const header = $('.header');
  const progress = $('.header__progress');
  const lightSecs = $$('[data-header="light"]');
  const hero = $('.hero');
  const stepsLine = $('.steps__line');
  const steps = $('.steps');
  const mercadoImg = $('.mercado__bg img');
  const mercado = $('.mercado');

  function onScroll() {
    const y = scrollY;
    const h = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--p', h > 0 ? (y / h).toFixed(4) : 0);

    const probe = header.offsetHeight + 2;
    const inLight = lightSecs.some((s) => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
    const heroBottom = hero.getBoundingClientRect().bottom;
    header.classList.toggle('is-light', inLight);
    header.classList.toggle('is-navy', !inLight && heroBottom < probe);


    if (steps && stepsLine) {
      const r = steps.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * .75 - r.top) / (r.height + innerHeight * .2)));
      stepsLine.style.setProperty('--sp', p.toFixed(3));
    }
    if (!reduced && mercado && mercadoImg) {
      const r = mercado.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) mercadoImg.style.setProperty('--py', (-(r.top) * 0.18 - 80).toFixed(1));
    }
  }
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(() => { onScroll(); ticking = false; }); ticking = true; } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // Scroll reveal (entra uma vez)
  const io = 'IntersectionObserver' in window && new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => { if (isIntersecting) { target.classList.add('is-in'); io.unobserve(target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('is-in')));

  // Contador 0 → 728
  const counter = $('.count');
  if (counter) {
    const target = +counter.dataset.count;
    const run = () => {
      if (reduced) { counter.textContent = target; return; }
      const t0 = performance.now(), dur = 1800;
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        counter.textContent = Math.round(target * (1 - Math.pow(1 - k, 4)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (io) {
      const cio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { run(); cio.disconnect(); } }, { threshold: .4 });
      cio.observe(counter);
    } else counter.textContent = target;
  }

  // FAQ: um aberto por vez
  $$('.faq details').forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) $$('.faq details').forEach((o) => { if (o !== d) o.open = false; });
  }));

  // M01 · Modal do formulário
  const modal = $('#form-modal');
  const form = $('#lead-form');
  let lastFocus = null;
  const openForm = () => {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => form.nome.focus(), 60);
  };
  const closeForm = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
    lastFocus && lastFocus.focus();
  };
  $$('[data-open-form]').forEach((b) => b.addEventListener('click', openForm));
  $$('[data-close-form]').forEach((b) => b.addEventListener('click', closeForm));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeForm(); });
  if (CFG.FORM_MODE !== 'demo') $('[data-demo-note]').remove();

  // UTMs
  const qs = new URLSearchParams(location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((k) => { if (form[k]) form[k].value = qs.get(k) || ''; });

  // Máscara de WhatsApp
  form.whatsapp.addEventListener('input', (e) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 11);
    let v = d;
    if (d.length > 2) v = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length > 7) v = `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    e.target.value = v;
  });

  const MSG = {
    vazio: 'Preencha este campo para continuar.',
    whatsapp: 'Confira o número com DDD. Ex.: (11) 91234-5678.',
    email: 'Confira o e-mail. Ex.: nome@email.com.'
  };
  const setErr = (wrap, msg) => { wrap.classList.toggle('is-error', !!msg); $('.field__err', wrap).textContent = msg || ''; };

  function validate() {
    let ok = true;
    ['nome', 'whatsapp', 'email', 'cidade'].forEach((n) => {
      const input = form[n], wrap = input.closest('.field'), v = input.value.trim();
      let msg = '';
      if (!v) msg = MSG.vazio;
      else if (n === 'whatsapp' && v.replace(/\D/g, '').length < 10) msg = MSG.whatsapp;
      else if (n === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = MSG.email;
      setErr(wrap, msg);
      if (msg) ok = false;
    });
    const baseWrap = $('.field--radio', form);
    const base = form.querySelector('input[name=base]:checked');
    setErr(baseWrap, base ? '' : MSG.vazio);
    if (!base) ok = false;
    return ok;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    $('.form__fail', form).hidden = true;
    if (!validate()) { const first = $('.is-error input', form); first && first.focus(); return; }
    const btn = $('button[type=submit]', form);
    btn.disabled = true; btn.textContent = 'Enviando sua inscrição...';
    const thanks = CFG.THANK_YOU_URL || 'obrigado.html';
    if (CFG.FORM_MODE === 'demo' || !CFG.FORM_ENDPOINT) {
      setTimeout(() => { location.href = `${thanks}?demo=1`; }, 700);
      return;
    }
    try {
      const r = await fetch(CFG.FORM_ENDPOINT, { method: 'POST', body: new FormData(form) });
      if (!r.ok) throw new Error(r.status);
      location.href = thanks;
    } catch {
      $('.form__fail', form).hidden = false;
      btn.disabled = false; btn.textContent = btn.dataset.label;
    }
  });

  // Vídeos: pausam fora da tela; fallback por blob se o servidor não responder com Range
  const vids = $$('video[autoplay]');
  if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver((es) => es.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) v.play()?.catch(() => {}); else v.pause();
    }), { threshold: 0.25 });
    vids.forEach((v) => { v.muted = true; vio.observe(v); });
  }
  const playFromBlob = (v) => {
    if (v.dataset.blobTried) return; v.dataset.blobTried = '1';
    const src = v.currentSrc || v.querySelector('source')?.src; if (!src) return;
    fetch(src).then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
      .then((b) => { v.src = URL.createObjectURL(b); return v.play(); }).catch(() => {});
  };
  vids.forEach((v) => {
    v.addEventListener('error', () => playFromBlob(v), true);
    v.addEventListener('play', () => setTimeout(() => { if (v.readyState < 2 && !v.paused) playFromBlob(v); }, 4000));
  });
})();
