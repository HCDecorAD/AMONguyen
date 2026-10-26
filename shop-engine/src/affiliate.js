const CODE=/^[A-Za-z0-9_-]{3,80}$/;
const sha=async v=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v)))].map(x=>x.toString(16).padStart(2,"0")).join("");
const secret=()=>{const b=crypto.getRandomValues(new Uint8Array(24));return btoa(String.fromCharCode(...b)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")};
async function partnerAuth(req,env,store){
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/,"");
 if(!/^par_[a-z0-9]+\.[A-Za-z0-9_-]{20,}$/.test(token))return null;
 const [pid,key]=token.split("."),p=await env.DB.prepare("SELECT id,store_id,referral_code,name,status,key_hash FROM affiliate_partners WHERE id=? AND store_id=? AND status='active'").bind(pid,store.id).first();
 if(!p||!p.key_hash||await sha(key)!==p.key_hash)return null;
 return p;
}

export async function captureAffiliate(req,env,store,helpers){
 const {json,clean,id,input}=helpers,u=new URL(req.url),path=u.pathname;
 if(path==="/api/affiliate/me"&&req.method==="GET"){
  const p=await partnerAuth(req,env,store);if(!p)return json(req,{error:"unauthorized"},401);
  await env.DB.prepare("UPDATE affiliate_partners SET last_login_at=CURRENT_TIMESTAMP WHERE id=?").bind(p.id).run();
  return json(req,{id:p.id,name:p.name,referral_code:p.referral_code,site_id:"SITE-001",share_url:"https://amonguyen.com/?ref="+encodeURIComponent(p.referral_code)});
 }
 if(path==="/api/affiliate/portal"&&req.method==="GET"){
  const p=await partnerAuth(req,env,store);if(!p)return json(req,{error:"unauthorized"},401);
  const summary=await env.DB.prepare("SELECT (SELECT COUNT(*) FROM affiliate_clicks WHERE store_id=? AND partner_id=?) clicks,(SELECT COUNT(*) FROM affiliate_attributions WHERE store_id=? AND partner_id=?) attributed_orders,(SELECT COUNT(*) FROM affiliate_conversions v JOIN affiliate_attributions a ON a.id=v.attribution_id WHERE a.store_id=? AND a.partner_id=? AND v.status='approved') conversions,(SELECT COALESCE(SUM(v.order_total),0) FROM affiliate_conversions v JOIN affiliate_attributions a ON a.id=v.attribution_id WHERE a.store_id=? AND a.partner_id=? AND v.status='approved') conversion_revenue,(SELECT COALESCE(SUM(amount),0) FROM affiliate_commissions WHERE store_id=? AND partner_id=? AND status!='reversed') commission_total,(SELECT COALESCE(SUM(amount),0) FROM affiliate_commissions WHERE store_id=? AND partner_id=? AND status='paid') commission_paid").bind(store.id,p.id,store.id,p.id,store.id,p.id,store.id,p.id,store.id,p.id,store.id,p.id).first();
  const conversions=(await env.DB.prepare("SELECT o.order_no,v.order_total,v.status conversion_status,v.converted_at,m.amount commission,m.status commission_status FROM affiliate_conversions v JOIN affiliate_attributions a ON a.id=v.attribution_id JOIN orders o ON o.id=v.order_id AND o.store_id=v.store_id LEFT JOIN affiliate_commissions m ON m.conversion_id=v.id AND m.store_id=v.store_id WHERE a.store_id=? AND a.partner_id=? ORDER BY v.converted_at DESC LIMIT 100").bind(store.id,p.id).all()).results;
  const daily=(await env.DB.prepare("SELECT date(occurred_at) day,COUNT(*) clicks FROM affiliate_clicks WHERE store_id=? AND partner_id=? AND occurred_at>=datetime('now','-30 days') GROUP BY day ORDER BY day").bind(store.id,p.id).all()).results;
  return json(req,{partner:{id:p.id,name:p.name,referral_code:p.referral_code,share_url:"https://amonguyen.com/?ref="+encodeURIComponent(p.referral_code)},summary,conversions,daily});
 }
 if(path==="/api/affiliate/click"&&req.method==="POST"){
  const d=await input(req),site=clean(d.site_id),code=clean(d.referral_code);
  if(site!=="SITE-001"||!CODE.test(code))return json(req,{ok:false,error:"invalid affiliate attribution"},422);
  const p=await env.DB.prepare("SELECT p.id partner_id,p.program_id FROM affiliate_partners p JOIN affiliate_programs g ON g.id=p.program_id AND g.store_id=p.store_id WHERE p.store_id=? AND p.referral_code=? AND p.status='active' AND g.site_id=? AND g.active=1").bind(store.id,code,site).first();
  if(!p)return json(req,{ok:true,tracked:false});
  const cid=id("clk");
  await env.DB.prepare("INSERT INTO affiliate_clicks(id,store_id,program_id,partner_id,referral_code,landing_url,referrer_url,user_agent) VALUES(?,?,?,?,?,?,?,?)").bind(cid,store.id,p.program_id,p.partner_id,code,clean(d.landing_url).slice(0,1000),clean(d.referrer_url).slice(0,1000),clean(req.headers.get("user-agent")).slice(0,500)).run();
  return json(req,{ok:true,tracked:true,click_id:cid},201);
 }
 return null;
}

export async function affiliateAttribution(env,store,affiliate,orderId,helpers){
 const {clean,id}=helpers,site=clean(affiliate?.site_id),code=clean(affiliate?.referral_code);
 if(!affiliate)return null;
 if(site!=="SITE-001"||!CODE.test(code))throw Error("invalid affiliate attribution");
 const p=await env.DB.prepare("SELECT p.id partner_id,p.program_id,g.cookie_days FROM affiliate_partners p JOIN affiliate_programs g ON g.id=p.program_id AND g.store_id=p.store_id WHERE p.store_id=? AND p.referral_code=? AND p.status='active' AND g.site_id=? AND g.active=1").bind(store.id,code,site).first();
 if(!p)return null;
 const click=await env.DB.prepare("SELECT id FROM affiliate_clicks WHERE store_id=? AND partner_id=? AND occurred_at>=datetime('now',?) ORDER BY occurred_at DESC LIMIT 1").bind(store.id,p.partner_id,"-"+Number(p.cookie_days||30)+" days").first();
 return env.DB.prepare("INSERT INTO affiliate_attributions(id,store_id,program_id,partner_id,referral_code,click_id,order_id) VALUES(?,?,?,?,?,?,?)").bind(id("atr"),store.id,p.program_id,p.partner_id,code,click?.id||null,orderId);
}

export async function syncAffiliateConversion(env,store,order,to,helpers){
 const {id}=helpers,a=await env.DB.prepare("SELECT a.*,g.commission_bps FROM affiliate_attributions a JOIN affiliate_programs g ON g.id=a.program_id WHERE a.store_id=? AND a.order_id=?").bind(store.id,order.id).first();
 if(!a)return [];
 if(to==="completed"&&a.status!=="converted"){
  const cid=id("cnv"),rate=Number(a.commission_bps||0),amount=Math.round(Number(order.total||0)*rate/10000);
  return [
   env.DB.prepare("UPDATE affiliate_attributions SET status='converted',converted_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(a.id),
   env.DB.prepare("INSERT INTO affiliate_conversions(id,store_id,attribution_id,order_id,order_total,status) VALUES(?,?,?,?,?,'approved') ON CONFLICT(store_id,order_id) DO UPDATE SET order_total=excluded.order_total,status='approved',reversed_at=NULL").bind(cid,store.id,a.id,order.id,Number(order.total||0)),
   env.DB.prepare("INSERT INTO affiliate_commissions(id,store_id,conversion_id,partner_id,basis_amount,rate_bps,amount,status) VALUES(?,?,?,?,?,?,?,'pending') ON CONFLICT(store_id,conversion_id) DO UPDATE SET basis_amount=excluded.basis_amount,rate_bps=excluded.rate_bps,amount=excluded.amount,status='pending',updated_at=CURRENT_TIMESTAMP").bind(id("com"),store.id,cid,a.partner_id,Number(order.total||0),rate,amount)
  ];
 }
 if(["cancelled","returned"].includes(to))return [
  env.DB.prepare("UPDATE affiliate_attributions SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(a.status==="converted"?"reversed":"cancelled",a.id),
  env.DB.prepare("UPDATE affiliate_conversions SET status='reversed',reversed_at=CURRENT_TIMESTAMP WHERE store_id=? AND order_id=?").bind(store.id,order.id),
  env.DB.prepare("UPDATE affiliate_commissions SET status='reversed',updated_at=CURRENT_TIMESTAMP WHERE store_id=? AND conversion_id IN (SELECT id FROM affiliate_conversions WHERE store_id=? AND order_id=?)").bind(store.id,store.id,order.id)
 ];
 return [];
}

export async function affiliateDashboard(req,env,store,helpers,authorized){
 const path=new URL(req.url).pathname,{json,clean,id,input}=helpers;
 if(path==="/api/affiliate/partners"&&req.method==="POST"){
  if(!authorized)return json(req,{error:"unauthorized"},401);
  const d=await input(req),code=clean(d.referral_code),name=clean(d.name);
  if(!CODE.test(code)||!name)return json(req,{ok:false,error:"name and valid referral_code required"},422);
  const g=await env.DB.prepare("SELECT id FROM affiliate_programs WHERE store_id=? AND site_id='SITE-001' AND active=1").bind(store.id).first();
  if(!g)return json(req,{ok:false,error:"affiliate program unavailable"},503);
  const existing=await env.DB.prepare("SELECT id FROM affiliate_partners WHERE store_id=? AND referral_code=?").bind(store.id,code).first(),pid=existing?.id||id("par"),key=secret();
  await env.DB.prepare("INSERT INTO affiliate_partners(id,store_id,program_id,referral_code,name,key_hash,key_hint) VALUES(?,?,?,?,?,?,?) ON CONFLICT(store_id,referral_code) DO UPDATE SET name=excluded.name,status='active',key_hash=excluded.key_hash,key_hint=excluded.key_hint,updated_at=CURRENT_TIMESTAMP").bind(pid,store.id,g.id,code,name,await sha(key),key.slice(-4)).run();
  return json(req,{ok:true,id:pid,referral_code:code,key:pid+"."+key,portal_url:"https://amonguyen.com/affiliate.html"},201);
 }
 const rotate=path.match(/^\/api\/affiliate\/partners\/([^/]+)\/rotate$/);
 if(rotate&&req.method==="POST"){
  if(!authorized)return json(req,{error:"unauthorized"},401);
  const p=await env.DB.prepare("SELECT id,referral_code FROM affiliate_partners WHERE id=? AND store_id=?").bind(rotate[1],store.id).first();if(!p)return json(req,{error:"not found"},404);
  const key=secret();await env.DB.prepare("UPDATE affiliate_partners SET key_hash=?,key_hint=?,status='active',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(await sha(key),key.slice(-4),p.id).run();
  return json(req,{ok:true,id:p.id,referral_code:p.referral_code,key:p.id+"."+key,portal_url:"https://amonguyen.com/affiliate.html"});
 }
 if(path!=="/api/affiliate/dashboard"||req.method!=="GET")return null;
 if(!authorized)return json(req,{error:"unauthorized"},401);
 const summary=await env.DB.prepare("SELECT (SELECT COUNT(*) FROM affiliate_clicks WHERE store_id=?) clicks,(SELECT COUNT(*) FROM affiliate_attributions WHERE store_id=?) attributed_orders,(SELECT COUNT(*) FROM affiliate_conversions WHERE store_id=? AND status='approved') conversions,(SELECT COALESCE(SUM(order_total),0) FROM affiliate_conversions WHERE store_id=? AND status='approved') conversion_revenue,(SELECT COALESCE(SUM(amount),0) FROM affiliate_commissions WHERE store_id=? AND status!='reversed') commission_total").bind(store.id,store.id,store.id,store.id,store.id).first();
 const partners=(await env.DB.prepare("SELECT p.id,p.referral_code,p.name,p.key_hint,p.last_login_at,(SELECT COUNT(*) FROM affiliate_clicks c WHERE c.store_id=p.store_id AND c.partner_id=p.id) clicks,(SELECT COUNT(*) FROM affiliate_conversions v JOIN affiliate_attributions a ON a.id=v.attribution_id WHERE a.store_id=p.store_id AND a.partner_id=p.id AND v.status='approved') conversions,(SELECT COALESCE(SUM(m.amount),0) FROM affiliate_commissions m WHERE m.store_id=p.store_id AND m.partner_id=p.id AND m.status!='reversed') commission FROM affiliate_partners p WHERE p.store_id=? ORDER BY commission DESC,clicks DESC").bind(store.id).all()).results;
 const conversions=(await env.DB.prepare("SELECT v.id,v.converted_at,v.order_total,v.status,o.order_no,p.id partner_id,p.name partner_name,p.referral_code FROM affiliate_conversions v JOIN affiliate_attributions a ON a.id=v.attribution_id JOIN affiliate_partners p ON p.id=a.partner_id JOIN orders o ON o.id=v.order_id AND o.store_id=v.store_id WHERE v.store_id=? ORDER BY v.converted_at DESC LIMIT 300").bind(store.id).all()).results;
 const commissions=(await env.DB.prepare("SELECT m.id,m.created_at,m.basis_amount,m.rate_bps,m.amount,m.status,o.order_no,p.id partner_id,p.name partner_name,p.referral_code FROM affiliate_commissions m JOIN affiliate_conversions v ON v.id=m.conversion_id JOIN orders o ON o.id=v.order_id AND o.store_id=v.store_id JOIN affiliate_partners p ON p.id=m.partner_id WHERE m.store_id=? ORDER BY m.created_at DESC LIMIT 300").bind(store.id).all()).results;
 const program=await env.DB.prepare("SELECT site_id,name,commission_bps,cookie_days,active FROM affiliate_programs WHERE store_id=? AND site_id='SITE-001'").bind(store.id).first();
 return json(req,{summary,partners,conversions,commissions,program});
}
