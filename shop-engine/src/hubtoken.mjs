// Token đăng nhập ID/Pass từ HUB (hcdecor-hub /api/shop/login). Định dạng: "hub1." + payload(base64url JSON) + "." + HMAC-SHA256 hex.
// Secret HUB_SHOP_SECRET phải trùng với HUB. Token hết hạn sau 1 giờ. Chỉ chấp nhận cửa hàng store_amo.
const enc=new TextEncoder();
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
const fromB64u=s=>{const b=atob(s.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((s.length+3)%4||4));return new TextDecoder().decode(Uint8Array.from(b,c=>c.charCodeAt(0)))};
const ROLE_OK=["viewer","staff","manager"];
export async function verifyHubToken(token,secret,now=Math.floor(Date.now()/1000)){
 try{
  if(typeof token!=="string"||!token.startsWith("hub1.")||!secret)return null;
  const [, p, s]=token.split(".");
  if(!p||!s)return null;
  const key=await crypto.subtle.importKey("raw",enc.encode(String(secret)),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const want=hex(await crypto.subtle.sign("HMAC",key,enc.encode(p)));
  if(want.length!==s.length)return null;
  let diff=0;for(let i=0;i<want.length;i++)diff|=want.charCodeAt(i)^s.charCodeAt(i);
  if(diff!==0)return null;
  const d=JSON.parse(fromB64u(p));
  if(!d||d.v!==1||!(d.exp>now)||d.store!=="store_amo"||!ROLE_OK.includes(d.role)||typeof d.sub!=="string")return null;
  return {sub:d.sub,role:d.role,store_id:d.store};
 }catch{return null}
}
