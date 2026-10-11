// Run against `wrangler dev --local --port 8793 --var TEST_ADMIN_TOKEN:local-e2e`
const base=process.env.E2E_BASE||'http://127.0.0.1:8793',sup=process.env.TEST_ADMIN_TOKEN||'local-e2e';
const call=async(path,{method='GET',token=sup,store='store_amo',body}={})=>{const h={'content-type':'application/json','x-store-id':store};if(token)h.authorization='Bearer '+token;const r=await fetch(base+path,{method,headers:h,body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json().catch(()=>({}))}};
const eq=(a,b,m)=>{if(a!==b)throw Error(`${m}: expected ${b}, got ${a}`);console.log('ok -',m)};
const u=Date.now(),slug='t'+String(u).slice(-8);
const own=await call('/api/v1/members',{method:'POST',body:{email:`o${u}@example.test`,role:'owner'}});const OWN=own.data.key;
const stf=await call('/api/v1/members',{method:'POST',token:OWN,body:{email:`s${u}@example.test`,role:'staff'}});const STF=stf.data.key;
const vw=await call('/api/v1/members',{method:'POST',token:OWN,body:{email:`v${u}@example.test`,role:'viewer'}});const VW=vw.data.key;
const P='/api/v1/site/pages/'+slug;
// public: nothing yet
eq((await call('/api/site/page?slug='+slug,{token:null})).data.published,false,'unpublished by default');
eq((await call('/api/site/page?slug=BAD_SLUG!',{token:null})).status,400,'bad slug rejected');
// roles
eq((await call('/api/v1/site/pages',{token:null})).status,401,'anonymous cannot list');
eq((await call('/api/v1/site/pages',{token:VW})).status,401,'viewer cannot list');
const blocks=[{type:'hero',props:{title:'Xin chào <script>alert(1)</script>',image:'img/a.jpg',primaryLabel:'Mua',primaryUrl:'/shop.html'}},{type:'text',props:{title:'Giới thiệu',body:'Nội dung'}},{type:'video',props:{url:'https://youtu.be/dQw4w9WgXcQ'}},{type:'links',props:{items:[{label:'Nike',url:'https://nike.com'}]}}];
const sv=await call(P,{method:'POST',token:STF,body:{title:'Trang thử',blocks}});eq(sv.status,200,'staff saves draft');
eq(sv.data.blocks[2].props.url,'https://www.youtube.com/embed/dQw4w9WgXcQ','youtube normalised to embed');
eq(sv.data.blocks[0].props.title.includes('<'),false,'html stripped from text');
// validation
for(const [n,b] of [['javascript: link',{type:'cta',props:{buttonLabel:'x',buttonUrl:'javascript:alert(1)'}}],['data: image',{type:'image',props:{url:'data:text/html,x'}}],['evil video',{type:'video',props:{url:'https://evil.test/x'}}],['unknown type',{type:'iframe',props:{}}]])
  eq((await call(P,{method:'POST',token:STF,body:{blocks:[b]}})).status,400,'reject '+n);
eq((await call(P,{method:'POST',token:STF,body:{blocks:Array.from({length:61},()=>({type:'text',props:{body:'x'}}))}})).status,400,'reject >60 blocks');
eq((await call(P+'/publish',{method:'POST',token:STF})).status,401,'staff cannot publish');
eq((await call('/api/site/page?slug='+slug,{token:null})).data.published,false,'draft is not public');
// publish by owner
const pb=await call(P+'/publish',{method:'POST',token:OWN});eq(pb.status,200,'owner publishes');eq(pb.data.version,1,'version 1');
const pub=await call('/api/site/page?slug='+slug,{token:null});eq(pub.data.published,true,'public sees published');eq(pub.data.blocks.length,4,'public blocks');
// edit draft doesn't change public
await call(P,{method:'POST',token:OWN,body:{title:'Trang thử',blocks:[{type:'text',props:{title:'Bản 2',body:'b'}}]}});
eq((await call('/api/site/page?slug='+slug,{token:null})).data.blocks.length,4,'draft edit not public until publish');
eq((await call('/api/v1/site/pages',{token:OWN})).data.items.find(x=>x.slug===slug).unpublished_changes,true,'flag unpublished changes');
eq((await call(P+'/publish',{method:'POST',token:OWN})).data.version,2,'version 2');
eq((await call('/api/site/page?slug='+slug,{token:null})).data.blocks.length,1,'public updated');
// rollback
eq((await call(P+'/rollback',{method:'POST',token:STF,body:{version:1}})).status,401,'staff cannot rollback');
eq((await call(P+'/rollback',{method:'POST',token:OWN,body:{version:1}})).data.version,3,'rollback creates v3');
eq((await call('/api/site/page?slug='+slug,{token:null})).data.blocks.length,4,'public back to v1 content');
eq((await call(P+'/rollback',{method:'POST',token:OWN,body:{version:99}})).status,404,'unknown version');
eq((await call(P+'/versions',{token:STF})).data.items.length,3,'3 versions listed');
// isolation
const s2=await call('/api/stores',{method:'POST',body:{code:'S'+String(u).slice(-6),name:'Shop 2'}});
eq((await call('/api/site/page?slug='+slug,{token:null,store:s2.data.id})).data.published,false,'other store sees nothing');
eq((await call(P,{token:OWN,store:s2.data.id})).status,401,'owner key blocked on other store');
// unpublish
eq((await call(P+'/unpublish',{method:'POST',token:OWN})).status,200,'unpublish');
eq((await call('/api/site/page?slug='+slug,{token:null})).data.published,false,'public falls back');
console.log('SITE_E2E PASS');
