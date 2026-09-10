"""Kiem mermaid: can bang ngoac/subgraph/quote + node id hop le. Khong render, chi bat loi cu phap thuong gap."""
import re,sys
from pathlib import Path
bad=0
for f in sorted(Path("06_modules").rglob("*.md")):
    txt=f.read_text(encoding="utf-8")
    for i,blk in enumerate(re.findall(r"```mermaid\n(.*?)```",txt,re.S)):
        errs=[]
        head=blk.strip().split("\n")[0].strip()
        if not re.match(r"^(flowchart|graph|stateDiagram-v2|erDiagram|sequenceDiagram|classDiagram)\b",head):
            errs.append("dong dau khong phai khai bao loai: %r"%head[:40])
        for ch,name in [("[","]"),("(",")"),("{","}")]:
            if blk.count(ch)!=blk.count(name): errs.append("lech %s%s: %d vs %d"%(ch,name,blk.count(ch),blk.count(name)))
        if blk.count('"')%2: errs.append("so dau nhay le: %d"%blk.count('"'))
        sg=len(re.findall(r"^\s*subgraph\b",blk,re.M)); en=len(re.findall(r"^\s*end\s*$",blk,re.M))
        if head.startswith(("flowchart","graph")) and sg>en:
            errs.append("subgraph %d > end %d"%(sg,en))
        if errs:
            bad+=1; print("FAIL %s blok#%d"%(f,i+1)); [print("      -",e) for e in errs]
        else: print("ok   %s blok#%d (%d dong)"%(f,i+1,len(blk.strip().split("\n"))))
print("\n%s"%("TAT CA MERMAID PASS" if not bad else "%d blok loi"%bad)); sys.exit(1 if bad else 0)
