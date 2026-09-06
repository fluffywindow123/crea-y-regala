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

  const CACHE_KEY = 'crea_posts_cache_v5';
  const FB_DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%231877F2'/%3E%3Cpath d='M20 9a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm0 17c-6.63 0-12 3.58-12 8v1h24v-1c0-4.42-5.37-8-12-8z' fill='%23ffffff'/%3E%3C/svg%3E";

  // Genuine Facebook publications snapshot for 0ms immediate render
  const INITIAL_POSTS = {
    posts: [
      {
        id: "108966855532260_306442182457359",
        text: "¡Nuevo diseño en Crea y Regala! Tazas y regalos personalizados para toda ocasión especial.",
        createdAt: "2024-03-25T21:03:23+0000",
        url: "https://www.facebook.com/980837971684440/posts/306442182457359?substory_index=1469807500587879",
        media: [
          {
            type: "image",
            url: "assets/posts/post_perfil.jpg",
            alt: "Crea y regala"
          }
        ],
        reactions: 0,
        commentsCount: 0
      },
      {
        id: "108966855532260_299554406479470",
        text: "Vasos para despedida de soltera 🤩👰🏻‍♀️\n✨En la compra de 10 piezas ó mas el de la Novia va GRATIS 🤍\n\nEnvíanos whatsapp para cotizaciones 📲341 137 4977",
        createdAt: "2024-03-14T04:21:59+0000",
        url: "https://www.facebook.com/980837971684440/posts/299554406479470",
        media: [
          {
            type: "image",
            url: "assets/posts/post_vasos_despedida.jpg",
            alt: "Vasos para despedida de soltera"
          }
        ],
        reactions: 1,
        commentsCount: 0
      },
      {
        id: "108966855532260_280692425032335",
        text: "Éste 14 de Febrero regala un detalle personalizado 😍\n\nEnvíanos tu idea por whatsapp 📲 al número 341 137 4977 \n✨Cotizaciones sin compromiso✨",
        createdAt: "2024-02-11T05:02:52+0000",
        url: "https://www.facebook.com/980837971684440/posts/280692425032335",
        media: [
          {
            type: "image",
            url: "assets/posts/post_14_febrero.jpg",
            alt: "Detalle personalizado para San Valentín"
          }
        ],
        reactions: 1,
        commentsCount: 0
      }
    ],
    featured: {
      id: "108966855532260_299554406479470",
      text: "Vasos para despedida de soltera 🤩👰🏻‍♀️\n✨En la compra de 10 piezas ó mas el de la Novia va GRATIS 🤍\n\nEnvíanos whatsapp para cotizaciones 📲341 137 4977",
      createdAt: "2024-03-14T04:21:59+0000",
      url: "https://www.facebook.com/980837971684440/posts/299554406479470",
      media: [
        {
          type: "image",
          url: "assets/posts/post_vasos_despedida.jpg",
          alt: "Vasos para despedida de soltera"
        }
      ],
      reactions: 1,
      commentsCount: 0
    }
  };

  let posts = [];
  let current = null;
  let nextCursor = null;
  let commentPost = null;
  let focusReturn = null;
  let listBusy = false;
  let commentsCursor = null;
  let commentsController = null;
  let currentUser = null;

  const el = (tag, className, text) => {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  };

  function https(value) {
    if (typeof value === 'string' && (value.startsWith('assets/') || value.startsWith('./assets/'))) {
      return value;
    }
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

    // 1. Profile photo placed strictly BEFORE the person's name
    const img = el('img', 'comment-avatar');
    const photoUrl = (comment.author?.picture && https(comment.author.picture)) || FB_DEFAULT_AVATAR;
    img.src = photoUrl;
    img.alt = '';
    img.loading = 'lazy';
    img.width = 44;
    img.height = 44;
    img.addEventListener('error', () => {
      img.src = FB_DEFAULT_AVATAR;
    }, { once: true });
    row.append(img);

    // 2. Body with Name, Date and Comment message
    const body = el('div', 'comment-body');
    const header = el('div', 'comment-header');

    // Use real Facebook name if returned, otherwise clean fallback
    let authorName = comment.author?.name;
    if (!authorName || authorName === 'Persona en Facebook') {
      authorName = 'Usuario de Facebook';
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

    // Load any user comments stored locally for this post
    if (!more) {
      try {
        const localComments = JSON.parse(localStorage.getItem('crea_local_comments_' + commentPost.id) || '[]');
        if (Array.isArray(localComments)) {
          for (const c of localComments) {
            commentsList?.append(commentNode(c));
          }
        }
      } catch {}
    }

    try {
      const path = `/posts/${encodeURIComponent(commentPost.id)}/comments` + (more && commentsCursor ? '?after=' + encodeURIComponent(commentsCursor) : '');
      const data = await api(path, { signal: commentsController.signal });
      if (!Array.isArray(data.comments)) throw Error('Formato inválido');

      for (const c of data.comments) {
        commentsList?.append(commentNode(c));
      }
      commentsCursor = data.nextCursor || null;

      if (!commentsList?.children.length) {
        if (commentsStatus) commentsStatus.textContent = 'Aún no hay comentarios en esta publicación. ¡Sé el primero en comentar con tu Facebook!';
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

  function updateAuthUI(user) {
    currentUser = user;
    const prompt = $('fb-login-prompt');
    const connected = $('fb-user-connected');
    const nameEl = $('fb-user-name');
    const avatarEl = $('fb-user-avatar');

    if (user && user.name) {
      if (prompt) prompt.hidden = true;
      if (connected) connected.hidden = false;
      if (nameEl) nameEl.textContent = user.name;
      if (avatarEl) avatarEl.src = user.picture || FB_DEFAULT_AVATAR;
    } else {
      if (prompt) prompt.hidden = false;
      if (connected) connected.hidden = true;
    }
  }

  function switchTab(tab) {
    const tabNative = $('tab-btn-native');
    const tabEmbed = $('tab-btn-embed');
    const panelNative = $('view-native-comments');
    const panelEmbed = $('view-embed-comments');
    const embedContainer = $('fb-embed-container');

    if (tab === 'embed') {
      tabNative?.classList.remove('active');
      tabNative?.setAttribute('aria-selected', 'false');
      tabEmbed?.classList.add('active');
      tabEmbed?.setAttribute('aria-selected', 'true');
      if (panelNative) panelNative.style.display = 'none';
      if (panelEmbed) {
        panelEmbed.style.display = 'flex';
        panelEmbed.hidden = false;
      }

      // Render official Facebook post embed iframe (Option 3)
      if (commentPost && embedContainer) {
        const postUrl = facebook(commentPost.url) || config.FACEBOOK_PAGE_URL;
        const targetSrc = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(postUrl)}&width=500&show_text=true`;
        const currentIframe = embedContainer.querySelector('iframe');
        if (!currentIframe || currentIframe.getAttribute('src') !== targetSrc) {
          embedContainer.innerHTML = `<iframe src="${targetSrc}" width="100%" height="540" style="border:none;overflow:hidden;border-radius:12px;background:#18191a;width:100%;max-width:500px;min-height:500px;" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" title="Publicación oficial de Facebook"></iframe>`;
        }
      }
    } else {
      tabEmbed?.classList.remove('active');
      tabEmbed?.setAttribute('aria-selected', 'false');
      tabNative?.classList.add('active');
      tabNative?.setAttribute('aria-selected', 'true');
      if (panelEmbed) panelEmbed.style.display = 'none';
      if (panelNative) panelNative.style.display = 'flex';
    }
  }

  function openComments(post, trigger) {
    commentPost = post;
    focusReturn = trigger;
    commentsCursor = null;
    const postUrl = facebook(post.url) || config.FACEBOOK_PAGE_URL;
    const fbBtn = $('comment-facebook');
    if (fbBtn) fbBtn.href = postUrl;

    const embedContainer = $('fb-embed-container');
    if (embedContainer) {
      embedContainer.innerHTML = '<p style="text-align: center; padding: 24px; color: var(--text-muted);">Cargando visor oficial de Facebook…</p>';
    }

    switchTab('native');

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

  $('tab-btn-native')?.addEventListener('click', () => switchTab('native'));
  $('tab-btn-embed')?.addEventListener('click', () => switchTab('embed'));

  // Option 2: Facebook Login Handler
  $('btn-facebook-login')?.addEventListener('click', () => {
    if (window.FB) {
      window.FB.login(res => {
        if (res.authResponse) {
          window.FB.api('/me', { fields: 'id,name,picture.width(100).height(100)' }, user => {
            if (user && user.name) {
              const userData = {
                id: user.id,
                name: user.name,
                picture: user.picture?.data?.url || null
              };
              try {
                localStorage.setItem('crea_fb_user', JSON.stringify(userData));
              } catch {}
              updateAuthUI(userData);
            }
          });
        }
      }, { scope: 'public_profile' });
    } else {
      alert('Iniciando conexión con Facebook. Por favor asegúrate de permitir ventanas emergentes.');
    }
  });

  $('btn-facebook-logout')?.addEventListener('click', () => {
    try {
      localStorage.removeItem('crea_fb_user');
    } catch {}
    if (window.FB) {
      try {
        window.FB.logout();
      } catch {}
    }
    updateAuthUI(null);
  });

  // Submit comment form (Option 2)
  $('fb-comment-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const input = $('fb-comment-input');
    const text = input ? input.value.trim() : '';
    if (!text || !commentPost) return;

    const user = currentUser || {
      name: 'Usuario de Facebook',
      picture: FB_DEFAULT_AVATAR
    };

    const newComment = {
      id: 'local_' + Date.now(),
      text,
      createdAt: new Date().toISOString(),
      reactions: 0,
      author: {
        name: user.name,
        picture: user.picture || FB_DEFAULT_AVATAR
      }
    };

    // Prepend new comment to the comments list
    commentsList?.prepend(commentNode(newComment));
    if (commentsStatus) commentsStatus.textContent = '';

    // Save to local storage for this post
    try {
      const existing = JSON.parse(localStorage.getItem('crea_local_comments_' + commentPost.id) || '[]');
      existing.unshift(newComment);
      localStorage.setItem('crea_local_comments_' + commentPost.id, JSON.stringify(existing));
    } catch {}

    if (input) input.value = '';
  });

  commentsRetry?.addEventListener('click', () => loadComments());
  commentsMore?.addEventListener('click', () => loadComments(true));
  $('posts-more')?.addEventListener('click', () => loadPosts(true));
  $('posts-retry')?.addEventListener('click', () => loadPosts(!!posts.length));

  // Try to restore saved Facebook user
  try {
    const savedUser = JSON.parse(localStorage.getItem('crea_fb_user'));
    if (savedUser && savedUser.name) {
      updateAuthUI(savedUser);
    }
  } catch {}

  // Initialize Meta SDK
  function initFB() {
    if (window.FB) {
      try {
        window.FB.init({
          appId: config.FACEBOOK_APP_ID || '367992518917446',
          cookie: true,
          xfbml: true,
          version: 'v20.0'
        });

        // Check active login status
        window.FB.getLoginStatus(res => {
          if (res && res.status === 'connected') {
            window.FB.api('/me', { fields: 'id,name,picture.width(100).height(100)' }, user => {
              if (user && user.name) {
                const userData = {
                  id: user.id,
                  name: user.name,
                  picture: user.picture?.data?.url || null
                };
                try {
                  localStorage.setItem('crea_fb_user', JSON.stringify(userData));
                } catch {}
                updateAuthUI(userData);
              }
            });
          }
        });
      } catch (e) {
        console.warn('FB init error:', e);
      }
    }
  }

  if (window.FB) {
    initFB();
  } else {
    const prevFbAsyncInit = window.fbAsyncInit;
    window.fbAsyncInit = function () {
      if (typeof prevFbAsyncInit === 'function') prevFbAsyncInit();
      initFB();
    };
  }

  // Render genuine Facebook posts immediately so the feed is never blank or stuck loading
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Array.isArray(cached.posts) && cached.posts.length > 0) {
      applyData(cached, false);
    } else {
      applyData(INITIAL_POSTS, false);
    }
  } catch {
    applyData(INITIAL_POSTS, false);
  }

  if (https(base)) {
    loadPosts();
  }
})();
