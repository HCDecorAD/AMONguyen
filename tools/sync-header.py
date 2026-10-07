from pathlib import Path
root=Path(r"D:\HCDecorHUB\AMONguyen\repo")
files=["shop.html","story.html","policy.html","contact.html"]
home=(root/"index.html").read_text(encoding="utf-8")
header=home[home.index('<div class="amo-new-top">'):home.index("<main>")]
footer=home[home.index('<footer class="amo-new-footer">'):home.index('<script src="js/amo-theme.js"')]
style=home[home.index("<style>"):home.index("</style>")+8]
for n in files:
 p=root/n; s=p.read_text(encoding="utf-8")
 if '<header class="amo-header"' in s:
  a=s.index('<header class="amo-header"'); b=s.index("<main",a); s=s[:a]+header+s[b:]
 elif "<body><main" in s:
  s=s.replace("<body><main","<body>"+header+"<main",1)
 s=s.replace("AMO NGUYEN","AMO NGUYỄN").replace("Contact |","Liên hệ |").replace("Shop |","Sản phẩm |")
 if '<footer class="amo-footer"' in s:
  a=s.index('<footer class="amo-footer"'); b=s.index("<script",a); s=s[:a]+footer+s[b:]
 elif "</main>" in s and '<footer class="amo-new-footer">' not in s:
  s=s.replace("</main>","</main>"+footer,1)
 if ".amo-new-header" not in s:
  s=s.replace("</head>",style+"</head>",1)
 p.write_text(s,encoding="utf-8",newline="\n")
