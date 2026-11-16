import subprocess,re,json,glob
for _ in range(5):
    out=subprocess.run(['node','tests/lightbulb_check.mjs'],capture_output=True,text=True).stdout
    fix=[(m.group(1),m.group(2)) for m in re.finditer(r"problem: (.+?): related '(.+?)' is already in the explanation",out)]
    if not fix: break
    for f in glob.glob('lightbulb/*.json'):
        d=json.load(open(f,encoding='utf8')); ch=False
        for k,r in fix:
            if k in d:
                n=[x for x in d[k]['related'] if x['da']!=r]
                if len(n)>=3: d[k]['related']=n; ch=True
                else: print('NEEDS HAND',k,r)
        if ch: open(f,'w',encoding='utf8').write(json.dumps(d,ensure_ascii=False,indent=1))
print(subprocess.run(['node','tests/lightbulb_check.mjs'],capture_output=True,text=True).stdout.strip().split('\n')[-5:])
