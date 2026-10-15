// Token quản trị gửi sang HUB (/api/shop/staff) để owner/manager cửa hàng quản lý nhân viên. Ký bằng HUB_SHOP_SECRET (cùng định dạng hub1).
// Chỉ ký sau khi đã xác thực mem_ key của owner/manager trong store_members. Hết hạn sau 5 phút.
const enc=new TextEncoder();
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
const b64u=s=>{let bin="";for(const b of enc.encode(s))bin+=String.fromCharCode(b);return btoa(bin).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
export const HUB_STAFF_URL="https://hcdecor-hub.huycuongonline.workers.dev/api/shop/staff";
export async function signHubAdminToken({sub,role},secret,now=Math.floor(Date.now()/1000)){
 const p=b64u(JSON.stringify({sub,role,store:"store_amo",kind:"admin",iat:now,exp:now+300,v:1}));
 const key=await crypto.subtle.importKey("raw",enc.encode(String(secret)),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 return "hub1."+p+"."+hex(await crypto.subtle.sign("HMAC",key,enc.encode(p)));
}
