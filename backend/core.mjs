// Portable Web Fetch handler. Only this server module talks to Meta.
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
const fail = (status, message) => Object.assign(new Error(message), {status});
const enc = new TextEncoder();
const b64 = bytes => btoa(String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const un64 = value => Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')), c=>c.charCodeAt(0));
async function key(secret) { return crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']); }
async function sign(payload, secret) {
  const body=b64(enc.encode(JSON.stringify(payload)));
  return body+'.'+b64(new Uint8Array(await crypto.subtle.sign('HMAC',await key(secret),enc.encode(body))));
}
async function verify(value, secret) {
  try {
    const [body,sig]=value.split('.');
    if (!await crypto.subtle.verify('HMAC',await key(secret),un64(sig),enc.encode(body))) return null;
    const payload=JSON.parse(new TextDecoder().decode(un64(body)));
    return payload.exp>Date.now() ? payload : null;
  } catch {return null;}
}
function cookie(request,name) {
  return (request.headers.get('Cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='))?.slice(name.length+1)||'';
}
const cookieValue=(name,value,seconds,path='/api')=>`${name}=${value}; HttpOnly; Secure; SameSite=None; Path=${path}; Max-Age=${seconds}`;
function validId(id,env) {return new RegExp(`^${env.META_PAGE_ID}_[0-9]+$`).test(id);}
function publicUrl(value) {try {const u=new URL(value);return u.protocol==='https:' ? u.href : null;}catch{return null;}}
function normalizePost(p) {
  const media=[];
  for(const attachment of p.attachments?.data||[]) {
    for(const a of attachment.subattachments?.data||[attachment]) {
      const src=publicUrl(a.media?.source), poster=publicUrl(a.media?.image?.src);
      if(src && String(a.type).includes('video')) media.push({type:'video',url:src,poster});
      else if(poster) media.push({type:'image',url:poster,alt:a.title||'Imagen de la publicación'});
    }
  }
  if(!media.length && publicUrl(p.full_picture)) media.push({type:'image',url:p.full_picture,alt:'Imagen de la publicación'});
  return {id:p.id,text:p.message||p.story||'',createdAt:p.created_time,url:publicUrl(p.permalink_url),media,
    reactions:p.reactions?.summary?.total_count??null,commentsCount:p.comments?.summary?.total_count??null};
}
const fields='id,message,created_time,permalink_url,full_picture,attachments{type,title,media,subattachments{type,title,media}},reactions.limit(0).summary(true),comments.limit(0).summary(true)';
async function graph(path,params,env,fetcher=fetch,token=env.META_PAGE_ACCESS_TOKEN) {
  if(!/^v\d+\.\d+$/.test(env.META_GRAPH_VERSION||'')) throw fail(503,'La conexión con Facebook todavía no está configurada.');
  const url=new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/${path}`);
  for(const [k,v] of Object.entries(params)) if(v) url.searchParams.set(k,v);
  if(env.META_APP_SECRET) {
    const proof=new Uint8Array(await crypto.subtle.sign('HMAC',await key(env.META_APP_SECRET),enc.encode(token)));
    url.searchParams.set('appsecret_proof',Array.from(proof,b=>b.toString(16).padStart(2,'0')).join(''));
  }
  const response=await fetcher(url,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000)});
  const data=await response.json();
  if(!response.ok || data.error) throw fail(502,'Facebook no pudo proporcionar el contenido. Intenta más tarde.');
  return data;
}
function cursor(url) {
 const value=url.searchParams.get('after')||'';
 if(value.length>2048 || /[\r\n]/.test(value)) throw fail(400,'Paginación inválida.');
 return value;
}
function paging(data) {return data.paging?.next ? data.paging?.cursors?.after||null : null;}
export async function handle(request,env,fetcher=fetch) {
  const origin=request.headers.get('Origin'), allowed=env.SITE_ORIGIN;
  const isAllowedOrigin=!origin||origin===allowed||/^https:\/\/fluffywindow123\.github\.io$/.test(origin)||/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const headers={'Vary':'Origin','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
  if(origin && !isAllowedOrigin) return json({error:'Origen no permitido.'},403,headers);
  if(origin && isAllowedOrigin) Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true'});
  else if(!origin) Object.assign(headers,{'Access-Control-Allow-Origin':'*'});
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization'}});
  try {
    const url=new URL(request.url),path=url.pathname;
    const cookiePath=env.API_ORIGIN ? new URL(env.API_ORIGIN).pathname.replace(/\/$/,'')+'/api' : '/api';
    if(!['GET','POST'].includes(request.method)) throw fail(405,'Método no permitido.');
    if(request.method==='POST' && (!origin || !isAllowedOrigin)) throw fail(403,'Origen requerido.');
    if(path==='/api/session' && request.method==='GET') {
      const session=env.SESSION_SECRET ? await verify(cookie(request,'crea_session'),env.SESSION_SECRET) : null;
      return json({user:session?.user||null,canComment:false,loginAvailable:!!(env.META_APP_ID&&env.META_APP_SECRET&&env.SESSION_SECRET&&env.API_ORIGIN&&/^v\d+\.\d+$/.test(env.META_GRAPH_VERSION||'')),commentMode:'facebook'},200,headers);
    }
    if(path==='/api/auth/facebook' && request.method==='POST') {
      if(!env.META_APP_ID||!env.META_APP_SECRET||!env.SESSION_SECRET||!/^v\d+\.\d+$/.test(env.META_GRAPH_VERSION||'')) throw fail(503,'Facebook Login aún no está disponible. Puedes comentar en Facebook.');
      const nonce=crypto.randomUUID();
      const state=await sign({nonce,exp:Date.now()+600000},env.SESSION_SECRET);
      const login=new URL(`https://www.facebook.com/${env.META_GRAPH_VERSION}/dialog/oauth`);
      login.search=new URLSearchParams({client_id:env.META_APP_ID,redirect_uri:env.API_ORIGIN+'/api/auth/facebook/callback',state:nonce,response_type:'code',scope:'public_profile'}).toString();
      return json({url:login.href},200,{...headers,'Set-Cookie':cookieValue('crea_oauth',state,600,cookiePath)});
    }
    if(path==='/api/auth/facebook/callback' && request.method==='GET') {
      const state=await verify(cookie(request,'crea_oauth'),env.SESSION_SECRET);
      if(!state || state.nonce!==url.searchParams.get('state') || !url.searchParams.get('code')) throw fail(400,'No se pudo verificar el inicio de sesión. Vuelve al sitio e inténtalo de nuevo.');
      const response=await fetcher(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/oauth/access_token`,{
        method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:new URLSearchParams({client_id:env.META_APP_ID,client_secret:env.META_APP_SECRET,redirect_uri:env.API_ORIGIN+'/api/auth/facebook/callback',code:url.searchParams.get('code')}),signal:AbortSignal.timeout(10000)});
      const token=await response.json();
      if(!response.ok||!token.access_token) throw fail(401,'Facebook no autorizó el inicio de sesión.');
      const profile=await graph('me',{fields:'id,name'},env,fetcher,token.access_token);
      // No Meta token is stored in a cookie, HTML, browser storage or API response.
      const session=await sign({user:{id:profile.id,name:profile.name},exp:Date.now()+3600000},env.SESSION_SECRET);
      const nonce=b64(crypto.getRandomValues(new Uint8Array(16)));
      const target=JSON.stringify(allowed).replace(/</g,'\\u003c');
      const h=new Headers({...headers,'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; frame-ancestors 'none'`});
      h.append('Set-Cookie',cookieValue('crea_session',session,3600,cookiePath));h.append('Set-Cookie',cookieValue('crea_oauth','',0,cookiePath));
      return new Response(`<!doctype html><html lang="es"><meta charset="utf-8"><title>Sesión iniciada</title><p>Sesión iniciada. Puedes cerrar esta ventana y volver a Crea y Regala.</p><script nonce="${nonce}">if(window.opener){window.opener.postMessage({type:'crea-facebook-auth'},${target});window.close();}</script></html>`,{headers:h});
    }
    if(!/^\d+$/.test(env.META_PAGE_ID||'')||!env.META_PAGE_ACCESS_TOKEN) throw fail(503,'Las publicaciones de Facebook todavía no están disponibles.');
    if(path==='/api/posts' && request.method==='GET') {
      const after=cursor(url);
      const data=await graph(`${env.META_PAGE_ID}/published_posts`,{fields,limit:'9',after},env,fetcher);
      let featured=null;
      if(!after && env.FEATURED_POST_ID && validId(env.FEATURED_POST_ID,env)) {
        featured=normalizePost(await graph(env.FEATURED_POST_ID,{fields},env,fetcher));
      }
      const postHeaders={...headers,'Cache-Control':'public, max-age=180, s-maxage=300'};
      return json({posts:(data.data||[]).map(normalizePost),featured,nextCursor:paging(data)},200,postHeaders);
    }
    const match=path.match(/^\/api\/posts\/([^/]+)(\/comments)?$/);
    if(!match||!validId(match[1],env)) throw fail(404,'Publicación no encontrada.');
    const id=match[1];
    if(request.method==='POST' && match[2]) {
      // Meta's Page token must NEVER be used to impersonate a visitor.
      return json({error:'Comenta directamente en Facebook con tu cuenta.',code:'COMMENTING_UNAVAILABLE'},409,headers);
    }
    if(request.method!=='GET') throw fail(405,'Método no permitido.');
    if(!match[2]) return json({post:normalizePost(await graph(id,{fields},env,fetcher))},200,headers);
    const data=await graph(`${id}/comments`,{fields:'id,message,created_time,from{id,name,picture},like_count',summary:'true',limit:'25',after:cursor(url),filter:'stream'},env,fetcher);
    return json({comments:(data.data||[]).map(c=>({id:c.id,text:c.message||'',createdAt:c.created_time,reactions:c.like_count??null,author:{name:c.from?.name||'Persona en Facebook',picture:publicUrl(c.from?.picture?.data?.url)}})),total:data.summary?.total_count??null,nextCursor:paging(data)},200,headers);
  } catch(error) {return json({error:error.status ? error.message : 'No pudimos conectar con Facebook. Intenta de nuevo más tarde.'},error.status||502,headers);}
}
export default {fetch:(request,env)=>handle(request,env)};
