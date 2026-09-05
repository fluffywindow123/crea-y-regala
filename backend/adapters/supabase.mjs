import {handle} from '../core.mjs';
Deno.serve(request => {
  // Configure the gateway with JWT verification disabled for these public reads.
  const url=new URL(request.url);
  url.pathname=url.pathname.replace(/^\/functions\/v1\/[^/]+/, '');
  return handle(new Request(url,request),Deno.env.toObject());
});
