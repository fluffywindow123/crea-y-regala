/**
 * SISTEMA DE RENDERIZADO DEL BLOG / PUBLICACIONES
 * ================================================
 * Renderiza dinámicamente las publicaciones definidas en blog-data.js,
 * gestiona filtros por categoría y abre el visor de lectura completa.
 */

(() => {
  const posts = window.BLOG_POSTS || [];
  let currentCategory = 'all';
  let activePostId = null;

  const $ = id => document.getElementById(id);

  // Elementos del DOM
  const categoriesContainer = $('blog-categories');
  const featuredContainer = $('blog-featured');
  const gridContainer = $('blog-grid');
  const dialog = $('blog-reader-dialog');
  const closeBtn = $('reader-close');
  const closeBottomBtn = $('reader-close-bottom');
  const prevBtn = $('reader-prev-btn');
  const nextBtn = $('reader-next-btn');

  const readerCategory = $('reader-category');
  const readerDate = $('reader-date');
  const readerReadTime = $('reader-read-time');
  const readerTitle = $('reader-title');
  const readerHeroImg = $('reader-hero-img');
  const readerHeroWrapper = $('reader-hero-wrapper');
  const readerBody = $('reader-body');

  if (!categoriesContainer || !gridContainer) return;

  /**
   * Formatea el contenido del post convirtiendo etiquetas especiales como [video ...]
   * en elementos visuales atractivos.
   */
  function formatContent(html) {
    if (!html) return '';

    // Reemplaza marcadores [video ...] o [video 1] con tarjetas estilizadas de video
    let formatted = html.replace(/\[(video[a-zA-Z0-9_-]*|\s*video\s*\d+)\]/gi, (match, tag) => {
      const cleanTag = tag.trim();
      let label = 'Ver Video / Tráiler';
      if (cleanTag.includes('summer_game_fest')) label = 'Tráiler: Summer Game Fest';
      else if (cleanTag.includes('resident_evil')) label = 'Tráiler: Resident Evil Veronica';
      else if (cleanTag.includes('final_fantasy')) label = 'Tráiler: Final Fantasy VII Revelation';
      else if (cleanTag.includes('control')) label = 'Tráiler: Control Resonant';
      else if (cleanTag.includes('assassins_creed')) label = 'Tráiler: Assassin\'s Creed IV Resynced';
      else if (cleanTag.includes('gen_atlas')) label = 'Tráiler: gen Atlas';
      else if (cleanTag.includes('cuphead')) label = 'Tráiler: Mighty Cuphead Adventure';
      else if (cleanTag.includes('tmnt')) label = 'Tráiler: TMNT The Last Ronin';
      else if (cleanTag.includes('guild_wars')) label = 'Tráiler: Guild Wars 3';
      else if (cleanTag.includes('hitman')) label = 'Tráiler: Hitman Classic Trilogy';
      else if (cleanTag.includes('trine')) label = 'Tráiler: Trine 6';
      else if (cleanTag.includes('yooka')) label = 'Tráiler: Super Yooka-Laylee Kart';
      else if (cleanTag === 'video 1') label = 'Ver Tráiler Oficial de la Colección';
      else if (cleanTag === 'video 2') label = 'Ver Teaser Tráiler de Ocarina of Time';

      return `
        <div class="blog-video-card" tabindex="0" role="button" aria-label="${label}">
          <div class="blog-video-icon">▶</div>
          <div class="blog-video-info">
            <strong>${label}</strong>
            <span>Contenido multimedia / Video referenciado en la publicación</span>
          </div>
        </div>
      `;
    });

    return formatted;
  }

  /**
   * Renderiza los botones de categorías dinámicamente
   */
  function renderCategories() {
    categoriesContainer.innerHTML = '';

    // Obtener categorías únicas
    const cats = ['all', ...new Set(posts.map(p => p.category).filter(Boolean))];

    cats.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `blog-cat-btn ${cat === currentCategory ? 'active' : ''}`;
      btn.textContent = cat === 'all' ? 'Todas' : cat;
      btn.dataset.category = cat;

      btn.addEventListener('click', () => {
        currentCategory = cat;
        document.querySelectorAll('.blog-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderPosts();
      });

      categoriesContainer.appendChild(btn);
    });
  }

  /**
   * Crea una tarjeta individual de publicación para el grid
   */
  function createPostCard(post) {
    const card = document.createElement('article');
    card.className = 'blog-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Leer ${post.title}`);

    const imageHtml = post.image
      ? `<div class="blog-card-media"><img src="${post.image}" alt="${post.title}" loading="lazy" onerror="this.parentElement.style.display='none'"></div>`
      : '';

    card.innerHTML = `
      ${imageHtml}
      <div class="blog-card-content">
        <div class="blog-card-meta">
          <span class="blog-badge">${post.category || 'General'}</span>
          <span class="blog-card-date">${post.date || ''}</span>
          ${post.readTime ? `<span class="blog-card-readtime">⏱ ${post.readTime}</span>` : ''}
        </div>
        <h3 class="blog-card-title">${post.title}</h3>
        <p class="blog-card-excerpt">${post.excerpt || ''}</p>
        <span class="blog-card-link">Leer artículo completo ➔</span>
      </div>
    `;

    // Abrir al hacer clic o presionar Enter
    card.addEventListener('click', () => openReader(post.id));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openReader(post.id);
      }
    });

    return card;
  }

  /**
   * Renderiza el post destacado y el grid de publicaciones según la categoría seleccionada
   */
  function renderPosts() {
    const filtered = currentCategory === 'all'
      ? posts
      : posts.filter(p => p.category === currentCategory);

    // Limpiar contenedores
    if (featuredContainer) featuredContainer.innerHTML = '';
    gridContainer.innerHTML = '';

    if (!filtered.length) {
      gridContainer.innerHTML = `<p class="blog-empty-msg">No hay publicaciones disponibles en esta categoría.</p>`;
      return;
    }

    // El primer post de la lista filtrada se muestra como Destacado
    const featuredPost = filtered[0];
    const otherPosts = filtered.slice(1);

    if (featuredContainer && featuredPost) {
      const hasImage = Boolean(featuredPost.image);
      const featCard = document.createElement('article');
      featCard.className = `blog-featured-card ${hasImage ? 'has-media' : 'no-media'}`;
      featCard.tabIndex = 0;
      featCard.setAttribute('role', 'button');
      featCard.setAttribute('aria-label', `Leer destacado: ${featuredPost.title}`);

      const featImg = hasImage
        ? `<div class="blog-featured-media"><img src="${featuredPost.image}" alt="${featuredPost.title}" loading="eager" onerror="this.parentElement.style.display='none'; this.closest('.blog-featured-card')?.classList.replace('has-media','no-media');"></div>`
        : '';

      featCard.innerHTML = `
        ${featImg}
        <div class="blog-featured-content">
          <div class="blog-card-meta">
            <span class="blog-badge featured-badge">⭐ Destacado</span>
            <span class="blog-badge">${featuredPost.category || 'General'}</span>
            <span class="blog-card-date">${featuredPost.date || ''}</span>
            ${featuredPost.readTime ? `<span class="blog-card-readtime">⏱ ${featuredPost.readTime}</span>` : ''}
          </div>
          <h3 class="blog-featured-title">${featuredPost.title}</h3>
          <p class="blog-featured-excerpt">${featuredPost.excerpt || ''}</p>
          <button type="button" class="btn btn-primary blog-featured-btn">Leer publicación completa ➔</button>
        </div>
      `;

      featCard.addEventListener('click', () => openReader(featuredPost.id));
      featCard.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openReader(featuredPost.id);
        }
      });

      featuredContainer.appendChild(featCard);
    }

    // Renderizar los demás posts en el grid
    const listToRender = otherPosts.length > 0 ? otherPosts : (filtered.length === 1 ? [] : filtered);
    listToRender.forEach(post => {
      gridContainer.appendChild(createPostCard(post));
    });

    // Título de sección de cuadrícula
    const gridHeading = document.querySelector('.blog-grid-heading');
    if (gridHeading) {
      gridHeading.style.display = listToRender.length > 0 ? 'block' : 'none';
    }
  }

  /**
   * Abre el visor de lectura completa de una publicación
   */
  function openReader(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post || !dialog) return;

    activePostId = postId;

    // Llenar metadatos
    if (readerCategory) readerCategory.textContent = post.category || 'General';
    if (readerDate) readerDate.textContent = post.date || '';
    if (readerReadTime) readerReadTime.textContent = post.readTime ? `⏱ ${post.readTime}` : '';
    if (readerTitle) readerTitle.textContent = post.title;

    // Imagen principal
    if (readerHeroWrapper && readerHeroImg) {
      if (post.image) {
        readerHeroImg.src = post.image;
        readerHeroImg.alt = post.title;
        readerHeroWrapper.hidden = false;
        readerHeroImg.onerror = () => { readerHeroWrapper.hidden = true; };
      } else {
        readerHeroWrapper.hidden = true;
      }
    }

    // Contenido enriquecido
    if (readerBody) {
      readerBody.innerHTML = formatContent(post.content || post.excerpt || '');
    }

    // Botones de navegación Anterior / Siguiente
    const currentIndex = posts.findIndex(p => p.id === postId);
    if (prevBtn) {
      const prevPost = posts[currentIndex - 1];
      prevBtn.hidden = !prevPost;
      if (prevPost) {
        prevBtn.onclick = () => openReader(prevPost.id);
      }
    }
    if (nextBtn) {
      const nextPost = posts[currentIndex + 1];
      nextBtn.hidden = !nextPost;
      if (nextPost) {
        nextBtn.onclick = () => openReader(nextPost.id);
      }
    }

    // Mostrar modal
    if (!dialog.open) {
      dialog.showModal();
    }

    // Scroll al inicio del lector
    dialog.scrollTo({ top: 0, behavior: 'instant' });
    document.body.classList.add('reader-open');

    // Actualizar hash de la URL
    try {
      history.replaceState(null, null, `#post-${postId}`);
    } catch {}
  }

  /**
   * Cierra el visor de lectura
   */
  function closeReader() {
    if (!dialog || !dialog.open) return;
    dialog.close();
    document.body.classList.remove('reader-open');
    activePostId = null;

    // Limpiar hash de la URL sin recargar
    try {
      if (window.location.hash.startsWith('#post-')) {
        history.replaceState(null, null, window.location.pathname + '#publicaciones');
      }
    } catch {}
  }

  // Event Listeners del diálogo
  closeBtn?.addEventListener('click', closeReader);
  closeBottomBtn?.addEventListener('click', closeReader);

  dialog?.addEventListener('click', e => {
    // Cerrar al hacer clic en el backdrop
    if (e.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        closeReader();
      }
    }
  });

  dialog?.addEventListener('cancel', e => {
    e.preventDefault();
    closeReader();
  });

  // Inicializar blog
  renderCategories();
  renderPosts();

  // Revisar si la URL contiene un hash para abrir un post directamente (ej. #post-2)
  const hash = window.location.hash;
  if (hash && hash.startsWith('#post-')) {
    const idParam = parseInt(hash.replace('#post-', ''), 10);
    if (!isNaN(idParam)) {
      setTimeout(() => openReader(idParam), 150);
    }
  }
})();
