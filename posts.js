(() => {
  const config = window.CREA_POSTS_CONFIG || {};
  const base = (config.API_BASE_URL || '').replace(/\/$/, '');
  const $ = id => document.getElementById(id);
  const status = $('posts-status');
  const featured = $('featured-post');
  const grid = $('posts-grid');
  const dialog = $('comments-dialog');
  const commentsList = $('comments-list');
  const commentsStatus = $('comments-status');
  const commentsRetry = $('comments-retry');
  const commentsMore = $('comments-more');
  if (!status) return;

  const CACHE_KEY = 'crea_posts_cache_v3';
  let posts = [];
  let current = null;
  let nextCursor = null;
  let commentPost = null;
  let focusReturn = null;
  let listBusy = false;
  let commentsCursor = null;
  let commentsController = null;

  const KNOWN_AUTHORS = {
    '677611752007065_1135031885455330': {
      name: 'Mariana Morales',
      picture: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80'
    },
    '676725658762341_1093157696277454': {
      name: 'Claudia Ramos',
      picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
    },
    '676725658762341_1871709233406412': {
      name: 'Crea y regala',
      picture: 'https://scontent.fgdl5-1.fna.fbcdn.net/v/t39.30808-1/433446512_306442172457360_4765088879829433460_n.jpg?stp=cp0_dst-jpg_s50x50_tt6&_nc_cat=100&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=f907e8&_nc_ohc=i-_Vo8R2dYcQ7kNvwF4GTul&_nc_oc=AdpEW57mrrfQP6E-iyXgdkviMNGOJVy2mWbzMWetWfaPA8zN4aydt5uk9pzLlI2HMC8&_nc_zt=24&_nc_ht=scontent.fgdl5-1.fna&edm=AJdBtusEAAAA&_nc_gid=NlzB8-m7Uga7bE_lxY2I0w&_nc_tpa=Q5bMBQJPS_5NWeBV0aKdgv_KNjD4MkFs3ZWu5vJBSjmohH2_DyVx8pjc2DR-BMOSIbJpAQciRAr7ATJA&oh=00_AQLe_MlsUBM9YuxFcUY5gIGIcINH48f4e28tVP9Dwinn_g&oe=6AA2ADAD'
    },
    '676725658762341_819672494070172': {
      name: 'Eliza Rodríguez',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
    }
  };

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

  function commentNode(comment) {
    const row = el('article', 'comment');
    const known = KNOWN_AUTHORS[comment.id];

    // Profile photo placed strictly BEFORE the person's name
    const img = el('img', 'comment-avatar');
    const photoUrl = (comment.author?.picture && https(comment.author.picture))
      || (known?.picture && https(known.picture))
      || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';
    img.src = photoUrl;
    img.alt = '';
    img.loading = 'lazy';
    img.width = 44;
    img.height = 44;
    img.addEventListener('error', () => {
      img.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';
    }, { once: true });
    row.append(img);

    // Body with Name, Date and Comment message
    const body = el('div', 'comment-body');
    const header = el('div', 'comment-header');
    
    // Resolve person's name (never "Persona en Facebook")
    let authorName = comment.author?.name;
    if (!authorName || authorName === 'Persona en Facebook') {
      authorName = known?.name || 'Cliente de Facebook';
    }
    const nameEl = el('h4', 'comment-author-name', authorName);
    const timeEl = el('time', 'comment-date', date(comment.createdAt));
    header.append(nameEl, timeEl);

    const text = el('p', 'comment-text', comment.text || '');
    body.append(header, text);

    if (Number.isFinite(comment.reactions) && comment.reactions > 0) {
      body.append(el('span', 'comment-reactions', `❤️ ${count(comment.reactions)}`));
    }

    row.append(body);
    return row;
  }

  async function loadComments(more = false) {
    if (!commentPost) return;
    commentsController?.abort();
    commentsController = new AbortController();
    if (!more) {
      commentsList?.replaceChildren();
      if (commentsStatus) commentsStatus.textContent = 'Cargando comentarios…';
    }
    if (commentsRetry) commentsRetry.hidden = true;
    if (commentsMore) commentsMore.hidden = true;

    try {
      const path = `/posts/${encodeURIComponent(commentPost.id)}/comments` + (more && commentsCursor ? '?after=' + encodeURIComponent(commentsCursor) : '');
      const data = await api(path, { signal: commentsController.signal });
      if (!Array.isArray(data.comments)) throw Error('Formato inválido');

      for (const c of data.comments) {
        commentsList?.append(commentNode(c));
      }
      commentsCursor = data.nextCursor || null;

      if (!commentsList?.children.length) {
        if (commentsStatus) commentsStatus.textContent = 'Aún no hay comentarios en esta publicación. ¡Sé el primero en comentar en Facebook!';
      } else {
        if (commentsStatus) commentsStatus.textContent = '';
      }
      if (commentsMore) commentsMore.hidden = !commentsCursor;
    } catch (error) {
      if (commentsController?.signal.aborted) return;
      console.warn('Error al cargar comentarios:', error);
      if (!commentsList?.children.length) {
        if (commentsStatus) commentsStatus.textContent = 'No pudimos cargar los comentarios. Puedes verlos directamente en Facebook.';
        if (commentsRetry) commentsRetry.hidden = false;
      }
    }
  }

  function openComments(post, trigger) {
    commentPost = post;
    focusReturn = trigger;
    commentsCursor = null;
    const postUrl = facebook(post.url) || config.FACEBOOK_PAGE_URL;
    const fbBtn = $('comment-facebook');
    if (fbBtn) fbBtn.href = postUrl;

    if (!dialog.open) dialog.showModal();
    document.body.classList.add('comments-open');
    loadComments();
  }

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
    commentsController?.abort();
    document.body.classList.remove('comments-open');
    focusReturn?.focus();
  });

  commentsRetry?.addEventListener('click', () => loadComments());
  commentsMore?.addEventListener('click', () => loadComments(true));
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
