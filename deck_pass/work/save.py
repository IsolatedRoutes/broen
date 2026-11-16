import json,re,sys,os
base=os.path.expanduser('~/mnt/Danish Flash Card App/deck_pass')
def save(n,new):
    ch=json.load(open(f'{base}/chunks/007.json'));keys=list(ch)[n*25:n*25+25]
    ok=True
    for w,v in new.items():
        assert w in keys,w
        c=ch[w];ex=v['explanation'];en=c['forms'][0]['en']
        if not ex.startswith('"'): pass
        if f'means "{en}"' not in ex: print('OPEN',w);ok=False
        r=v['related']
        if not 3<=len(r)<=4: print('NREL',w);ok=False
        for x in r:
            core=re.sub(r'^(en|et|at) ','',x['da'])
            if re.search(r'(?<!\w)'+re.escape(core.lower())+r'(?!\w)',ex.lower()): print('REL IN EXPL',w,x['da']);ok=False
            if core.lower() in w.lower().split()[1:] or core.lower()==w.lower().split(' ',1)[-1]: print('REL IN PHRASE',w,x['da']);ok=False
        for b in ['which looks similar','who gets','the thing (','what you do','starting with at','often','usually']:
            if b in ex: print('BAD',w,b);ok=False
    if ok:
        json.dump(new,open(f'{base}/parts/007_{n}.json','w'),ensure_ascii=False,indent=1);print('saved',len(new))
