const CODE=/^[A-Za-z0-9_-]{3,80}$/;

export async function captureAffiliate(req,env,store,helpers){
 const {json,clean,id,input}=helpers,u=new URL(req.url),path=u.pathname;
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
  const pid=id("par");
  await env.DB.prepare("INSERT INTO affiliate_partners(id,store_id,program_id,referral_code,name) VALUES(?,?,?,?,?) ON CONFLICT(store_id,referral_code) DO UPDATE SET name=excluded.name,status='active',updated_at=CURRENT_TIMESTAMP").bind(pid,store.id,g.id,code,name).run();
  return json(req,{ok:true,id:pid,referral_code:code},201);
 }
 if(path!=="/api/affiliate/dashboard"||req.method!=="GET")return null;
 if(!authorized)return json(req,{error:"unauthorized"},401);
 const summary=await env.DB.prepare("SELECT (SELECT COUNT(*) FROM affiliate_clicks WHERE store_id=?) clicks,(SELECT COUNT(*) FROM affiliate_attributions WHERE store_id=?) attributed_orders,(SELECT COUNT(*) FROM affiliate_conversions WHERE store_id=? AND status='approved') conversions,(SELECT COALESCE(SUM(order_total),0) FROM affiliate_conversions WHERE store_id=? AND status='approved') conversion_revenue,(SELECT COALESCE(SUM(amount),0) FROM affiliate_commissions WHERE store_id=? AND status!='reversed') commission_total").bind(store.id,store.id,store.id,store.id,store.id).first();
 const partners=(await env.DB.prepare("SELECT p.referral_code,p.name,(SELECT COUNT(*) FROM affiliate_clicks c WHERE c.store_id=p.store_id AND c.partner_id=p.id) clicks,(SELECT COUNT(*) FROM affiliate_conversions v JOIN affiliate_attributions a ON a.id=v.attribution_id WHERE a.store_id=p.store_id AND a.partner_id=p.id AND v.status='approved') conversions,(SELECT COALESCE(SUM(m.amount),0) FROM affiliate_commissions m WHERE m.store_id=p.store_id AND m.partner_id=p.id AND m.status!='reversed') commission FROM affiliate_partners p WHERE p.store_id=? ORDER BY commission DESC,clicks DESC").bind(store.id).all()).results;
 return json(req,{summary,partners});
}
