// Independent MakerWorld Estimator directory; no private key or proxy required.
(() => {
  const form = document.getElementById('mw-search-form');
  if (!form) return;
  const query = document.getElementById('mw-query');
  const sort = document.getElementById('mw-sort');
  const results = document.getElementById('mw-results');
  const status = document.getElementById('mw-status');
  const previous = document.getElementById('mw-previous');
  const next = document.getElementById('mw-next');
  const pageLabel = document.getElementById('mw-page');
  const retry = document.getElementById('mw-retry');
  let models = [], page = 0, controller, requestId = 0;
  const pageSize = 12;
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function safeUrl(value, model = false) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') return null;
      if (model && (url.hostname !== 'makerworld.com' || !/^\/(?:[a-z]{2}\/)?models\/\d+/.test(url.pathname))) return null;
      return url.href;
    } catch { return null; }
  }
  function render() {
    results.replaceChildren();
    const start = page * pageSize;
    for (const model of models.slice(start, start + pageSize)) {
      const card = element('article', 'mw-result-card');
      const media = element('div', 'mw-result-media');
      const imageUrl = safeUrl(model.modelImage);
      const missingImage = () => media.replaceChildren(element('span', '', 'Vista previa no disponible'));
      if (imageUrl) {
        const image = element('img');
        image.alt = String(model.modelName || 'Diseño 3D');
        image.loading = 'lazy'; image.decoding = 'async'; image.referrerPolicy = 'no-referrer';
        image.addEventListener('error', missingImage, {once:true});
        image.src = imageUrl; media.append(image);
      } else missingImage();
      const info = element('div', 'mw-result-info');
      info.append(element('h3', '', String(model.modelName || 'Diseño sin título')));
      info.append(element('p', 'mw-result-author', `Por ${model.creatorName || 'Creador no indicado'}`));
      info.append(element('p', 'mw-result-license', `Licencia: ${model.license || 'Consultar en MakerWorld'}`));
      const link = element('a', 'card-link', 'Ver en MakerWorld ↗');
      link.href = model.cleanUrl; link.target = '_blank'; link.rel = 'noopener noreferrer';
      info.append(link); card.append(media, info); results.append(card);
    }
    const total = models.length;
    status.textContent = total ? `${start + 1}–${Math.min(start + pageSize, total)} de ${total} diseños recibidos del directorio.` : 'No encontramos diseños en este directorio. Prueba otro término, también en inglés, o explora MakerWorld directamente.';
    previous.hidden = page === 0;
    next.hidden = start + pageSize >= total;
    pageLabel.textContent = total ? `Página ${page + 1} de ${Math.ceil(total / pageSize)}` : '';
  }
  async function search() {
    controller?.abort(); controller = new AbortController();
    const activeController = controller;
    const id = ++requestId;
    const timer = setTimeout(() => activeController.abort(), 15000);
    results.setAttribute('aria-busy', 'true');
    results.replaceChildren();
    status.textContent = 'Buscando diseños…';
    previous.hidden = next.hidden = retry.hidden = true; pageLabel.textContent = '';
    try {
      const url = new URL('https://api.tryar.in/api/models');
      url.searchParams.set('q', query.value.trim());
      url.searchParams.set('sort', sort.value);
      const response = await fetch(url, {signal: activeController.signal, credentials:'omit'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success !== true || !Array.isArray(data.models)) throw new Error('Invalid response');
      if (id !== requestId) return;
      const seen = new Set();
      models = data.models.filter(model => {
        if (!model || typeof model !== 'object') return false;
        const url = safeUrl(model.cleanUrl, true);
        if (!url) return false;
        const key = new URL(url).pathname.match(/models\/(\d+)/)[1];
        if (seen.has(key)) return false;
        seen.add(key); model.cleanUrl = url; return true;
      });
      page = 0; render();
    } catch {
      if (id !== requestId) return;
      status.textContent = 'No pudimos conectar con el directorio. Reintenta en un momento o abre MakerWorld con el enlace de abajo.';
      retry.hidden = false;
    } finally {
      clearTimeout(timer);
      if (id === requestId) results.setAttribute('aria-busy', 'false');
    }
  }
  form.addEventListener('submit', event => {event.preventDefault();search();});
  sort.addEventListener('change', search);
  document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => {
    query.value = button.dataset.query; search();
  }));
  previous.addEventListener('click', () => {page--;render();status.scrollIntoView({block:'center'});});
  next.addEventListener('click', () => {page++;render();status.scrollIntoView({block:'center'});});
  retry.addEventListener('click', search);
  // Defer third-party traffic until the directory approaches the viewport.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {observer.disconnect();if (!requestId) search();}
    }, {rootMargin:'300px'});
    observer.observe(form);
  } else search();
})();
