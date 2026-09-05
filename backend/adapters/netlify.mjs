import {handle} from '../core.mjs';
export default request => {
  const names=['SITE_ORIGIN','API_ORIGIN','META_PAGE_ID','META_APP_ID','META_GRAPH_VERSION','FEATURED_POST_ID','META_PAGE_ACCESS_TOKEN','META_APP_SECRET','SESSION_SECRET'];
  return handle(request,Object.fromEntries(names.map(name=>[name,Netlify.env.get(name)])));
};
export const config = {path:'/api/*'};
