(() => {
  const config = window.CREA_POSTS_CONFIG || {};
  const base = (config.API_BASE_URL || '').replace(/\/$/, '');
  const $ = id => document.getElementById(id);
  const status = $('posts-status');
  const featured = $('featured-post');
  const grid = $('posts-grid');
  const dialog = $('comments-dialog');
  if (!status) return;

  const CACHE_KEY = 'crea_posts_cache_v2';
  let posts = [];
  let current = null;
  let nextCursor = null;
  let commentPost = null;
  let focusReturn = null;
  let listBusy = false;

  const el = (tag, className, text) => {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  };

  function https(value) {
    try {
      const u = new URL(value);
      return u.protocol === 'https:' ? u.href : null;
    } catch {
      return null;
    }
  }

  function facebook(value) {
    try {
      const u = new URL(value);
      return u.protocol === 'https:' && (u.hostname === 'facebook.com' || u.hostname.endsWith('.facebook.com')) ? u.href : null;
    } catch {
      return null;
    }
  }

  const date = value => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const count = value => (Number.isFinite(value) ? value.toLocaleString('es-MX') : '—');

  async function api(path, options = {}) {
    const ownController = new AbortController();
    const timer = setTimeout(() => ownController.abort(), 8000);
    const abort = () => ownController.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) ownController.abort();
    try {
      const response = await fetch(base + '/api' + path, {
        ...options,
        signal: ownController.signal,
        credentials: 'omit',
        headers: {
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...options.headers
        }
      });
      const data = await response.json();
      if (!response.ok) throw Object.assign(new Error(data.error || 'No pudimos cargar el contenido.'), { code: data.code });
      return data;
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', abort);
    }
  }

  function media(post, small = false) {
    const wrap = el('div', 'post-media');
    const items = (Array.isArray(post.media) ? post.media : []).slice(0, small ? 1 : 10);
    for (const item of items) {
      const url = https(item.url);
      if (!url) continue;
      const n = el(item.type === 'video' ? 'video' : 'img');
      n.src = url;
      if (item.type === 'video') {
        n.controls = true;
        n.preload = 'metadata';
        if (https(item.poster)) n.poster = item.poster;
      } else {
        n.alt = item.alt || 'Imagen de la publicación';
        n.loading = 'lazy';
        n.decoding = 'async';
      }
      n.addEventListener('error', () => {
        n.replaceWith(el('p', 'post-media-error', 'Contenido multimedia no disponible. Consulta la publicación original.'));
      }, { once: true });
      wrap.append(n);
    }
    return wrap;
  }

  function interactions(post) {
    const row = el('div', 'post-interactions');
    row.append(el('span', '', `❤️ ${count(post.reactions)} reacciones`));
    const button = el('button', '', `💬 ${count(post.commentsCount)} comentarios`);
    button.type = 'button';
    button.dataset.commentsFor = post.id;
    button.addEventListener('click', () => openComments(post, button));
    row.append(button);
    return row;
  }

  function renderFeatured(post, scroll = false) {
    current = post;
    featured.hidden = false;
    featured.replaceChildren();
    const postCaption = (post.text && post.text.trim()) || 'Publicación en Facebook de Crea y Regala.';
    featured.append(
      el('time', 'post-date', date(post.createdAt)),
      el('p', 'post-text', postCaption),
      media(post),
      interactions(post)
    );
    renderGrid();
    if (scroll && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      featured.animate?.([{ opacity: 0.3, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220 });
    }
    if (scroll) {
      featured.focus({ preventScroll: true });
      featured.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    }
  }

  function renderGrid() {
    grid.replaceChildren();
    for (const post of posts.filter(p => p.id !== current?.id)) {
      const card = el('article', 'post-card');
      const select = el('button', 'post-select');
      select.type = 'button';
      select.setAttribute('aria-label', 'Ver publicación del ' + date(post.createdAt));
      const excerpt = (post.text && post.text.trim()) || 'Ver publicación en Facebook';
      select.append(
        el('time', 'post-date', date(post.createdAt)),
        el('p', 'post-excerpt', excerpt.slice(0, 220)),
        media(post, true)
      );
      select.addEventListener('click', () => renderFeatured(post, true));
      card.append(select, interactions(post));
      grid.append(card);
    }
    $('more-posts').hidden = !grid.children.length && !nextCursor;
    $('posts-more').hidden = !nextCursor;
  }

  function applyData(data, isAppend = false) {
    if (!Array.isArray(data.posts)) return false;
    const incoming = [...(data.featured ? [data.featured] : []), ...data.posts].filter(p => p && typeof p.id === 'string');
    if (!incoming.length && !posts.length) return false;
    const combined = isAppend ? [...posts, ...incoming] : incoming;
    posts = [...new Map(combined.map(p => [p.id, p])).values()];
    nextCursor = data.nextCursor || null;
    if (!isAppend) {
      const selected = data.featured || [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      if (selected) renderFeatured(selected);
      else featured.hidden = true;
    } else {
      renderGrid();
    }
    status.textContent = posts.length ? '' : 'Todavía no hay publicaciones disponibles.';
    $('posts-retry').hidden = true;
    return true;
  }

  async function loadPosts(more = false) {
    if (listBusy) return;
    listBusy = true;
    $('posts-more').disabled = true;
    if (!posts.length) {
      status.textContent = 'Cargando publicaciones…';
      $('posts-retry').hidden = true;
    }
    try {
      const data = await api('/posts' + (more && nextCursor ? '?after=' + encodeURIComponent(nextCursor) : ''));
      applyData(data, more);
      if (!more && Array.isArray(data.posts) && data.posts.length > 0) {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {}
      }
    } catch (error) {
      console.warn('Error al cargar publicaciones:', error);
      if (!posts.length) {
        status.textContent = 'No pudimos cargar las publicaciones. Puedes verlas directamente en Facebook.';
        $('posts-retry').hidden = false;
      }
    } finally {
      listBusy = false;
      $('posts-more').disabled = false;
    }
  }

  function openComments(post, trigger) {
    commentPost = post;
    focusReturn = trigger;
    const postUrl = facebook(post.url) || config.FACEBOOK_PAGE_URL;
    const fbBtn = $('comment-facebook');
    if (fbBtn) fbBtn.href = postUrl;

    const container = $('fb-comments-container');
    if (container) {
      container.innerHTML = `<div class="fb-comments" data-href="${postUrl}" data-width="100%" data-numposts="10" data-colorscheme="dark" data-order-by="reverse_time"></div>`;
      if (window.FB && window.FB.XFBML) {
        window.FB.XFBML.parse(container);
      } else {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.FB && window.FB.XFBML) {
            clearInterval(interval);
            window.FB.XFBML.parse(container);
          } else if (attempts > 30) {
            clearInterval(interval);
          }
        }, 150);
      }
    }
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('comments-open');
  }

  window.fbAsyncInit = function () {
    if (window.FB) {
      window.FB.init({
        appId: '367992518917446',
        xfbml: true,
        version: 'v20.0'
      });
      const container = $('fb-comments-container');
      if (container && dialog && dialog.open) {
        window.FB.XFBML.parse(container);
      }
    }
  };

  function closeDialog() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !dialog.animate) {
      dialog.close();
      return;
    }
    dialog.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(8px)' }], { duration: 140 }).finished.then(() => dialog.close());
  }

  $('comments-close')?.addEventListener('click', closeDialog);
  dialog?.addEventListener('cancel', event => {
    event.preventDefault();
    closeDialog();
  });
  dialog?.addEventListener('click', event => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog();
    }
  });
  dialog?.addEventListener('close', () => {
    document.body.classList.remove('comments-open');
    focusReturn?.focus();
  });

  $('posts-more')?.addEventListener('click', () => loadPosts(true));
  $('posts-retry')?.addEventListener('click', () => loadPosts(!!posts.length));

  // Try to restore from cache instantly
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Array.isArray(cached.posts) && cached.posts.length > 0) {
      applyData(cached, false);
    }
  } catch {}

  if (!https(base)) {
    status.textContent = 'Pronto podrás consultar nuestras publicaciones aquí. Mientras tanto, visítanos en Facebook.';
    return;
  }

  loadPosts();
})();
