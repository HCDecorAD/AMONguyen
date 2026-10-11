/* Tài khoản nhận tiền của shop AMO NGUYỄN — chủ shop sửa tại đây */
window.AMO_PAY={
  bank:{id:"VPB",name:"VPBank",account:"390932358371",holder:"NGUYEN THI TUYET NHUNG"},
  qr:function(amount,info){
    var b=window.AMO_PAY.bank,q=[];
    if(amount>0)q.push("amount="+Math.round(amount));
    if(info)q.push("addInfo="+encodeURIComponent(info));
    q.push("accountName="+encodeURIComponent(b.holder));
    return "https://img.vietqr.io/image/"+b.id+"-"+b.account+"-compact2.png?"+q.join("&");
  }
};
