// Place behind a Vercel Node function with a rewrite from /api/:path*.
import {handle} from '../core.mjs';
export default async function handler(req,res) {
  const url=new URL(req.url,process.env.API_ORIGIN);
  const headers=new Headers();
  for(const [name,value] of Object.entries(req.headers)) if(value)headers.set(name,Array.isArray(value)?value.join(', '):value);
  const request=new Request(url,{method:req.method,headers});
  const response=await handle(request,process.env);
  res.statusCode=response.status;
  response.headers.forEach((value,name)=>{if(name!=='set-cookie')res.setHeader(name,value);});
  const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('Set-Cookie',cookies);
  res.end(Buffer.from(await response.arrayBuffer()));
}
