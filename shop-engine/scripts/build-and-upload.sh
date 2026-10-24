#!/usr/bin/env bash
# Tai anh san pham tu API cong khai, dung video slideshow (fade+zoom), roi upload + gan vao san pham.
# Dung boi .github/workflows/product-video.yml. Bien moi truong can co:
#   API            vi du https://hc-shop-engine.huycuongonline.workers.dev
#   STORE          vi du store_amo
#   PRODUCT_KEY    id hoac slug san pham (nguoi dung nhap khi chay workflow)
#   SHOP_ADMIN_TOKEN  token quan tri (secret cua repo)
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
imgs="$work/imgs"; mkdir -p "$imgs"

echo "== Lay thong tin san pham '$PRODUCT_KEY' =="
curl -fsS "$API/api/public/product?store=$STORE&slug=$(python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))' "$PRODUCT_KEY")" -o "$work/product.json"
pid="$(python3 -c 'import json;d=json.load(open("'"$work"'/product.json"));print(d.get("id",""))')"
name="$(python3 -c 'import json;d=json.load(open("'"$work"'/product.json"));print(d.get("name",""))')"
if [ -z "$pid" ]; then
  echo "Khong tim thay san pham '$PRODUCT_KEY' (kiem tra lai ID hoac slug, san pham phai dang 'active')."
  exit 1
fi
echo "San pham: $name ($pid)"

n=0
while IFS= read -r url; do
  [ -z "$url" ] && continue
  n=$((n+1))
  printf -v fname "%03d" "$n"
  ext="${url##*.}"; ext="${ext%%\?*}"
  case "$ext" in jpg|jpeg|png|webp) ;; *) ext="jpg" ;; esac
  curl -fsS "$url" -o "$imgs/$fname.$ext" || echo "Bo qua anh loi: $url"
done < <(python3 -c 'import json;d=json.load(open("'"$work"'/product.json"));[print(i["url"]) for i in d.get("images",[])]')

count="$(ls "$imgs" 2>/dev/null | wc -l | tr -d ' ')"
echo "Da tai $count anh"
if [ "$count" -lt 1 ]; then
  echo "San pham chua co anh nao, khong the dung video."
  exit 1
fi

echo "== Dung video =="
out="$work/video.mp4"
python3 "$here/make-product-video.py" "$imgs" "$out"
size="$(stat -c%s "$out" 2>/dev/null || stat -f%z "$out")"
echo "Video: $size bytes"

echo "== Upload va gan vao san pham =="
(base64 -w0 "$out" 2>/dev/null || base64 "$out" | tr -d '\n') > "$work/video.b64"
python3 - "$pid" "$work/video.b64" "$work/payload.json" <<'PY'
import json,sys
pid,b64_path,out_path=sys.argv[1],sys.argv[2],sys.argv[3]
b64=open(b64_path,"r").read()
json.dump({"product_id":pid,"data":b64}, open(out_path,"w"))
PY
resp="$(curl -fsS -X POST "$API/api/v1/product-video" \
  -H "authorization: Bearer $SHOP_ADMIN_TOKEN" -H "x-store-id: $STORE" -H "content-type: application/json" \
  --data @"$work/payload.json")"
echo "$resp"
echo "$resp" | python3 -c 'import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get("ok") else 1)'
echo "Xong. Video da gan vao san pham '$name'."
