const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","access-control-allow-origin":"*"}});
const storeId=req=>req.headers.get("x-store-id")||"store_amo";
const input=async req=>{try{return await req.json()}catch{return {}}};
const newId=p=>p+"_"+crypto.randomUUID().replaceAll("-","").slice(0,20);
export default {async fetch(req,env){
 const url=new URL(req.url), path=url.pathname, store=storeId(req);
 if(req.method==="OPTIONS") return new Response(null,{headers:{"access-control-allow-origin":"*","access-control-allow-headers":"content-type,x-store-id","access-control-allow-methods":"GET,POST,OPTIONS"}});
 try {
  if(path==="/api/health") return json({ok:true,app:"HC Shop Engine",store});
  if(path==="/api/stores") return json({items:(await env.DB.prepare("SELECT * FROM stores WHERE active=1").all()).results});
  if(path==="/api/products" && req.method==="GET") return json({items:(await env.DB.prepare("SELECT * FROM products WHERE store_id=? ORDER BY created_at DESC").bind(store).all()).results});
  if(path==="/api/products" && req.method==="POST"){
   const d=await input(req), id=newId("prd");
   await env.DB.prepare("INSERT INTO products(id,store_id,name,slug,description,status,price,sale_price) VALUES(?,?,?,?,?,?,?,?)").bind(id,store,d.name,d.slug,d.description||"",d.status||"draft",d.price||0,d.sale_price||null).run();
   return json({ok:true,id},201);
  }
  if(path==="/api/inventory") return json({items:(await env.DB.prepare("SELECT v.sku,p.name,v.size,v.color,l.on_hand,l.reserved,(l.on_hand-l.reserved) available,l.variant_id FROM inventory_levels l JOIN variants v ON v.id=l.variant_id JOIN products p ON p.id=v.product_id WHERE l.store_id=?").bind(store).all()).results});
  if(path==="/api/inventory/adjust" && req.method==="POST"){
   const d=await input(req), qty=Number(d.qty||0), loc=d.location_id||"loc_amo_main";
   if(!qty) throw Error("qty required");
   const old=await env.DB.prepare("SELECT on_hand,reserved FROM inventory_levels WHERE store_id=? AND location_id=? AND variant_id=?").bind(store,loc,d.variant_id).first();
   const next=(old?.on_hand||0)+qty;
   if(next<0 || next<(old?.reserved||0)) throw Error("insufficient inventory");
   await env.DB.batch([
    env.DB.prepare("INSERT INTO inventory_levels(store_id,location_id,variant_id,on_hand,reserved) VALUES(?,?,?,?,0) ON CONFLICT(location_id,variant_id) DO UPDATE SET on_hand=excluded.on_hand,updated_at=CURRENT_TIMESTAMP").bind(store,loc,d.variant_id,next),
    env.DB.prepare("INSERT INTO inventory_movements(id,store_id,location_id,variant_id,type,qty,reference_type,note) VALUES(?,?,?,?,?,?,?,?)").bind(newId("mov"),store,loc,d.variant_id,d.type||"adjust",qty,"manual",d.note||null)
   ]);
   return json({ok:true,on_hand:next});
  }
  if(path==="/api/orders" && req.method==="GET") return json({items:(await env.DB.prepare("SELECT * FROM orders WHERE store_id=? ORDER BY created_at DESC").bind(store).all()).results});
  if(path==="/api/dashboard"){
   const inv=await env.DB.prepare("SELECT COALESCE(SUM(on_hand),0) total_stock,COALESCE(SUM(CASE WHEN on_hand-reserved<=2 THEN 1 ELSE 0 END),0) low_stock,COALESCE(SUM(CASE WHEN on_hand-reserved=0 THEN 1 ELSE 0 END),0) out_stock FROM inventory_levels WHERE store_id=?").bind(store).first();
   const ord=await env.DB.prepare("SELECT COUNT(*) orders,COALESCE(SUM(CASE WHEN status='new' THEN 1 ELSE 0 END),0) new_orders,COALESCE(SUM(CASE WHEN status='completed' THEN total ELSE 0 END),0) revenue FROM orders WHERE store_id=?").bind(store).first();
   return json({...inv,...ord});
  }
  if(path==="/api/orders" && req.method==="POST"){
   const d=await input(req), oid=newId("ord"), no=d.order_no||("AMO-"+Date.now()), items=d.items||[];
   if(!items.length) throw Error("items required");
   let total=0, batch=[];
   for(const item of items){
    const v=await env.DB.prepare("SELECT v.*,p.name FROM variants v JOIN products p ON p.id=v.product_id WHERE v.id=? AND v.store_id=?").bind(item.variant_id,store).first();
    if(!v) throw Error("variant not found");
    const qty=Number(item.qty), price=v.sale_price??v.price??0; total+=qty*price;
    batch.push(env.DB.prepare("INSERT INTO order_items(id,store_id,order_id,variant_id,sku,name,qty,unit_price,line_total) VALUES(?,?,?,?,?,?,?,?,?)").bind(newId("itm"),store,oid,v.id,v.sku,v.name,qty,price,qty*price));
   }
   batch.unshift(env.DB.prepare("INSERT INTO orders(id,store_id,order_no,status,subtotal,total,note) VALUES(?,?,?,?,?,?,?)").bind(oid,store,no,"new",total,total,d.note||null));
   await env.DB.batch(batch); return json({ok:true,id:oid,order_no:no,total},201);
  }
  const statusMatch=path.match(/^\/api\/orders\/([^/]+)\/status$/);
  if(statusMatch && req.method==="POST"){
   const d=await input(req), order=await env.DB.prepare("SELECT * FROM orders WHERE id=? AND store_id=?").bind(statusMatch[1],store).first();
   if(!order) throw Error("order not found");
   const allowed={new:["confirmed","cancelled"],confirmed:["packing","cancelled"],packing:["shipping","cancelled"],shipping:["completed","returned"],completed:["returned"],cancelled:[],returned:[]};
   if(!allowed[order.status]?.includes(d.status)) throw Error("invalid status transition");
   const items=(await env.DB.prepare("SELECT * FROM order_items WHERE order_id=?").bind(order.id).all()).results, batch=[];
   for(const item of items){
    const level=await env.DB.prepare("SELECT * FROM inventory_levels WHERE store_id=? AND variant_id=?").bind(store,item.variant_id).first();
    if(d.status==="confirmed"){if(!level||level.on_hand-level.reserved<item.qty)throw Error("insufficient stock "+item.sku);batch.push(env.DB.prepare("UPDATE inventory_levels SET reserved=reserved+? WHERE store_id=? AND variant_id=?").bind(item.qty,store,item.variant_id));}
    if(d.status==="cancelled"&&order.status!=="new")batch.push(env.DB.prepare("UPDATE inventory_levels SET reserved=MAX(0,reserved-?) WHERE store_id=? AND variant_id=?").bind(item.qty,store,item.variant_id));
    if(d.status==="completed")batch.push(env.DB.prepare("UPDATE inventory_levels SET on_hand=on_hand-?,reserved=MAX(0,reserved-?) WHERE store_id=? AND variant_id=?").bind(item.qty,item.qty,store,item.variant_id));
    if(d.status==="returned")batch.push(env.DB.prepare("UPDATE inventory_levels SET on_hand=on_hand+? WHERE store_id=? AND variant_id=?").bind(item.qty,store,item.variant_id));
   }
   batch.push(env.DB.prepare("UPDATE orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(d.status,order.id));
   batch.push(env.DB.prepare("INSERT INTO order_status_history(id,store_id,order_id,from_status,to_status,note) VALUES(?,?,?,?,?,?)").bind(newId("hst"),store,order.id,order.status,d.status,d.note||null));
   await env.DB.batch(batch); return json({ok:true,status:d.status});
  }
  return json({error:"not found"},404);
 }catch(e){return json({ok:false,error:e.message},400)}
}};
