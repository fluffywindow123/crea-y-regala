import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handle} from '../backend/core.mjs';
const env={SITE_ORIGIN:'https://fluffywindow123.github.io',API_ORIGIN:'https://api.example.com',META_PAGE_ID:'123',META_GRAPH_VERSION:'v26.0',META_PAGE_ACCESS_TOKEN:'test-private-token',META_APP_ID:'456',META_APP_SECRET:'test-secret',SESSION_SECRET:'test-session-secret-long-enough-for-tests'};
const req=(path,options={})=>new Request(env.API_ORIGIN+'/api'+path,{...options,headers:{Origin:env.SITE_ORIGIN,...options.headers}});
const reply=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
test('normalizes posts and strips Meta tokens from paging',async()=>{
 const result=await handle(req('/posts'),env,async(url,init)=>{
  assert.match(String(url),/123\/published_posts/);assert.equal(init.headers.Authorization,'Bearer test-private-token');
  return reply({data:[{id:'123_7',message:'<script>not executable</script>',full_picture:'https://example.com/a.jpg',reactions:{summary:{total_count:4}},comments:{summary:{total_count:2}}}],paging:{next:'https://graph.facebook.com?access_token=LEAK',cursors:{after:'cursor123'}}});
 });
 const data=await result.json();assert.equal(data.posts[0].text,'<script>not executable</script>');assert.equal(data.nextCursor,'cursor123');assert.equal(data.posts[0].reactions,4);assert.ok(!JSON.stringify(data).includes('LEAK'));
});
test('denies other page IDs without upstream traffic',async()=>{let calls=0;const r=await handle(req('/posts/999_7/comments'),env,()=>calls++);assert.equal(r.status,404);assert.equal(calls,0);});
test('rejects untrusted CORS origins and writes without Origin',async()=>{
 assert.equal((await handle(req('/posts',{headers:{Origin:'https://evil.example'}}),env)).status,403);
 assert.equal((await handle(new Request(env.API_ORIGIN+'/api/auth/facebook',{method:'POST'}),env)).status,403);
});
test('never publishes visitor comments with Page token',async()=>{
 let calls=0;const r=await handle(req('/posts/123_7/comments',{method:'POST'}),env,()=>calls++);
 assert.equal(r.status,409);assert.equal(calls,0);assert.equal((await r.json()).code,'COMMENTING_UNAVAILABLE');
});
test('returns unknown counters honestly and normalizes comments',async()=>{
 const r=await handle(req('/posts/123_7/comments'),env,async()=>reply({data:[{id:'c',message:'hello'}]}));const d=await r.json();assert.equal(d.total,null);assert.equal(d.comments[0].author.name,'Persona en Facebook');
});
test('upstream failures do not leak secrets',async()=>{
 const r=await handle(req('/posts'),env,async()=>reply({error:{message:'access_token=private'}}));assert.equal(r.status,502);assert.ok(!(await r.text()).includes('private'));
});
test('unconfigured backend is unavailable rather than sample content',async()=>{assert.equal((await handle(req('/posts'),{SITE_ORIGIN:env.SITE_ORIGIN})).status,503);});
test('OAuth state is browser-bound, login contains no app secret',async()=>{
 const r=await handle(req('/auth/facebook',{method:'POST'}),env);
 const d=await r.json();const url=new URL(d.url);assert.equal(url.hostname,'www.facebook.com');assert.ok(!d.url.includes(env.META_APP_SECRET));assert.match(r.headers.get('set-cookie'),/HttpOnly; Secure/);
 const wrong=await handle(new Request(env.API_ORIGIN+'/api/auth/facebook/callback?code=a&state=wrong'),env);assert.equal(wrong.status,400);
});
test('OAuth callback creates only own identity cookie and sanitizes HTML',async()=>{
 const start=await handle(req('/auth/facebook',{method:'POST'}),env);const login=await start.json();const state=new URL(login.url).searchParams.get('state');const cookie=start.headers.get('set-cookie').split(';')[0];
 let calls=0;
 const r=await handle(req('/auth/facebook/callback?code=valid&state='+state,{headers:{Cookie:cookie}}),env,async()=>++calls===1?reply({access_token:'META_USER_PRIVATE'}):reply({id:'u',name:'Test'}));
 assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/crea_session/);assert.ok(!(await r.text()).includes('META_USER_PRIVATE'));
 const sessionCookie=r.headers.getSetCookie().find(v=>v.startsWith('crea_session')).split(';')[0];
 const s=await handle(req('/session',{headers:{Cookie:sessionCookie}}),env);const d=await s.json();assert.equal(d.user.id,'u');assert.equal(d.canComment,false);
});
