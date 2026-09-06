(() => {
  const config=window.CREA_POSTS_CONFIG||{}, base=(config.API_BASE_URL||'').replace(/\/$/,'');
  const $=id=>document.getElementById(id), status=$('posts-status'), featured=$('featured-post'), grid=$('posts-grid'), dialog=$('comments-dialog');
  if(!status)return;
  let posts=[],current=null,nextCursor=null,commentsCursor=null,commentPost=null,focusReturn=null,session=null,popup=null;
  let listBusy=false,commentVersion=0,commentController=null;
  const el=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!=null)n.textContent=text;return n;};
  function https(value){try{const u=new URL(value);return u.protocol==='https:'?u.href:null;}catch{return null;}}
  function facebook(value){try{const u=new URL(value);return u.protocol==='https:'&&(u.hostname==='facebook.com'||u.hostname.endsWith('.facebook.com'))?u.href:null;}catch{return null;}}
  const date=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});};
  const count=value=>Number.isFinite(value)?value.toLocaleString('es-MX'):'—';
  async function api(path,options={}) {
    const ownController=new AbortController(),timer=setTimeout(()=>ownController.abort(),12000);
    const abort=()=>ownController.abort();options.signal?.addEventListener('abort',abort,{once:true});
    if(options.signal?.aborted)ownController.abort();
    try{
      const response=await fetch(base+'/api'+path,{...options,signal:ownController.signal,credentials:'include',headers:{...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});
      const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error||'No pudimos cargar el contenido.'),{code:data.code});return data;
    }finally{clearTimeout(timer);options.signal?.removeEventListener('abort',abort);}
  }
  function media(post,small=false){
    const wrap=el('div','post-media');
    for(const item of (Array.isArray(post.media)?post.media:[]).slice(0,small?1:10)){
      const url=https(item.url);if(!url)continue;
      const n=el(item.type==='video'?'video':'img');n.src=url;
      if(item.type==='video'){n.controls=true;n.preload='metadata';if(https(item.poster))n.poster=item.poster;}
      else{n.alt=item.alt||'Imagen de la publicación';n.loading='lazy';n.decoding='async';}
      n.addEventListener('error',()=>n.replaceWith(el('p','post-media-error','Contenido multimedia no disponible. Consulta la publicación original.')),{once:true});wrap.append(n);
    }return wrap;
  }
  function interactions(post){
    const row=el('div','post-interactions');row.append(el('span','',`❤️ ${count(post.reactions)} reacciones`));
    const button=el('button','',`💬 ${count(post.commentsCount)} comentarios`);button.type='button';button.dataset.commentsFor=post.id;
    button.addEventListener('click',()=>openComments(post,button));row.append(button);return row;
  }
  function renderFeatured(post,scroll=false){
    current=post;featured.hidden=false;featured.replaceChildren();
    featured.append(el('time','post-date',date(post.createdAt)),el('p','post-text',post.text||'Una nueva publicación de Crea y Regala.'),media(post),interactions(post));
    renderGrid();
    if(scroll && !matchMedia('(prefers-reduced-motion: reduce)').matches) featured.animate?.([{opacity:.3,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:220});
    if(scroll){featured.focus({preventScroll:true});featured.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
  }
  function renderGrid(){
    grid.replaceChildren();
    for(const post of posts.filter(p=>p.id!==current?.id)){
      const card=el('article','post-card'),select=el('button','post-select');select.type='button';select.setAttribute('aria-label','Ver publicación del '+date(post.createdAt));
      select.append(el('time','post-date',date(post.createdAt)),el('p','post-excerpt',(post.text||'Nueva publicación').slice(0,220)),media(post,true));
      select.addEventListener('click',()=>renderFeatured(post,true));card.append(select,interactions(post));grid.append(card);
    }
    $('more-posts').hidden=!grid.children.length&&!nextCursor;$('posts-more').hidden=!nextCursor;
  }
  async function loadPosts(more=false){
    if(listBusy)return;listBusy=true;$('posts-more').disabled=true;$('posts-retry').hidden=true;status.textContent='Cargando publicaciones…';
    try{
      const data=await api('/posts'+(more&&nextCursor?'?after='+encodeURIComponent(nextCursor):''));
      if(!Array.isArray(data.posts))throw Error('Respuesta de publicaciones no válida.');
      const incoming=[...(data.featured?[data.featured]:[]),...data.posts].filter(p=>p&&typeof p.id==='string');
      const combined=more?[...posts,...incoming]:incoming;posts=[...new Map(combined.map(p=>[p.id,p])).values()];
      nextCursor=data.nextCursor||null;
      if(!more){const selected=data.featured||[...posts].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0];if(selected)renderFeatured(selected);else featured.hidden=true;}else renderGrid();
      status.textContent=posts.length?'':'Todavía no hay publicaciones disponibles.';
    }catch(error){status.textContent='No pudimos cargar las publicaciones. Puedes verlas directamente en Facebook.';$('posts-retry').hidden=false;}
    finally{listBusy=false;$('posts-more').disabled=false;}
  }
  function updateCount(total){if(!Number.isFinite(total)||!commentPost)return;commentPost.commentsCount=total;
    document.querySelectorAll('[data-comments-for]').forEach(n=>{if(n.dataset.commentsFor===commentPost.id)n.textContent=`💬 ${count(total)} comentarios`;});
  }
  function commentNode(comment){
    const row=el('article','comment');if(https(comment.author?.picture)){const img=el('img','comment-avatar');img.src=comment.author.picture;img.alt='';img.loading='lazy';img.addEventListener('error',()=>img.remove(),{once:true});row.append(img);}
    const text=el('div','comment-body');text.append(el('h3','',comment.author?.name||'Persona en Facebook'),el('p','',comment.text||''),el('time','post-date',date(comment.createdAt)));
    if(Number.isFinite(comment.reactions))text.append(el('span','comment-reactions',`❤️ ${count(comment.reactions)}`));row.append(text);return row;
  }
  async function loadComments(more=false){
    if(!commentPost)return;
    commentController?.abort();commentController=new AbortController();const version=++commentVersion;
    $('comments-status').textContent='Cargando comentarios…';$('comments-list').setAttribute('aria-busy','true');$('comments-more').hidden=true;$('comments-retry').hidden=true;
    if(!more)$('comments-list').replaceChildren();
    try{
      const data=await api(`/posts/${encodeURIComponent(commentPost.id)}/comments`+(more&&commentsCursor?'?after='+encodeURIComponent(commentsCursor):''),{signal:commentController.signal});
      if(version!==commentVersion)return;
      if(!Array.isArray(data.comments))throw Error('Respuesta inválida.');
      data.comments.forEach(c=>$('comments-list').append(commentNode(c)));commentsCursor=data.nextCursor||null;
      updateCount(data.total);$('comments-status').textContent=$('comments-list').children.length?'':'Todavía no hay comentarios.';$('comments-more').hidden=!commentsCursor;
    }catch(error){if(version!==commentVersion)return;$('comments-status').textContent='No pudimos cargar los comentarios.';$('comments-retry').hidden=false;}
    finally{if(version===commentVersion)$('comments-list').setAttribute('aria-busy','false');}
  }
  async function refreshSession(){
    try{session=await api('/session');}catch{session={user:null,canComment:false,loginAvailable:false};}
    const enabled=!!(session.user&&session.canComment);$('comment-text').disabled=!enabled;$('comment-submit').hidden=!enabled;
    $('facebook-login').hidden=!!session.user;$('facebook-login').disabled=!session.loginAvailable;
    $('comment-auth-status').textContent=enabled?`Comentas como ${session.user.name}.`:session.user?'Facebook no permite publicar desde aquí con tu cuenta. Usa «Comentar en Facebook».':session.loginAvailable?'Inicia sesión para comprobar las opciones disponibles.':'El inicio de sesión aún no está disponible. Puedes comentar en Facebook.';
  }
  function openComments(post,trigger){
    commentPost=post;focusReturn=trigger;
    const postUrl=facebook(post.url)||config.FACEBOOK_PAGE_URL;
    const fbBtn=$('comment-facebook');
    if(fbBtn) fbBtn.href=postUrl;

    const container=$('fb-comments-container');
    if(container){
      container.innerHTML=`<div class="fb-comments" data-href="${postUrl}" data-width="100%" data-numposts="10" data-colorscheme="dark" data-order-by="reverse_time"></div>`;
      if(window.FB && window.FB.XFBML){
        window.FB.XFBML.parse(container);
      }
    }
    if(!dialog.open)dialog.showModal();
    document.body.classList.add('comments-open');
  }
  window.fbAsyncInit = function() {
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
  function closeDialog(){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches || !dialog.animate){dialog.close();return;}
    dialog.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(8px)'}],{duration:140}).finished.then(()=>dialog.close());
  }
  $('comments-close').addEventListener('click',closeDialog);
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog();});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog();}});
  dialog.addEventListener('close',()=>{document.body.classList.remove('comments-open');focusReturn?.focus();});
  $('posts-more').addEventListener('click',()=>loadPosts(true));
  $('posts-retry').addEventListener('click',()=>loadPosts(!!posts.length));
  if(!https(base)){status.textContent='Pronto podrás consultar nuestras publicaciones aquí. Mientras tanto, visítanos en Facebook.';return;}
  loadPosts();
})();
