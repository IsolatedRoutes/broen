import json,glob,os,sys
sizes={}
bad=[]
for of in sorted(glob.glob('deck_pass/out/*.json')):
    n=os.path.basename(of)
    if os.path.exists('deck_pass/merged/'+n): continue
    ch=json.load(open('deck_pass/chunks/'+n,encoding='utf8'))
    try: out=json.load(open(of,encoding='utf8'))
    except Exception as e: bad.append((n,'badjson')); continue
    ok=True
    for k,v in out.items():
        if k not in ch or not isinstance(v.get('explanation'),str) or not v['explanation'].strip(): ok=False;bad.append((n,k,'expl'));continue
        r=v.get('related')
        if not(isinstance(r,list) and 3<=len(r)<=4 and all(isinstance(x,dict) and x.get('da') and x.get('en') for x in r)): ok=False;bad.append((n,k,'related'))
        if set(v)-{'explanation','related'}: ok=False;bad.append((n,k,'extra'))
    if not ok: continue
    byfile={}
    for k,v in out.items(): byfile.setdefault(ch[k]['file'],{})[k]=v
    for f,upd in byfile.items():
        p='lightbulb/'+f; d=json.load(open(p,encoding='utf8'))
        for k,v in upd.items():
            d[k]['explanation']=v['explanation']; d[k]['related']=[{'da':x['da'],'en':x['en']} for x in v['related']]
        open(p,'w',encoding='utf8').write(json.dumps(d,ensure_ascii=False,indent=1))
    os.makedirs('deck_pass/merged',exist_ok=True); open('deck_pass/merged/'+n,'w').write('ok')
    print('merged',n,len(out),'changed cards')
print('problems:',bad)
