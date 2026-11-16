import json,sys,re
def R(*a): return [{"da":x,"en":y} for x,y in a]
def save(n,P):
    import os
    d=json.load(open('chunks/041.json'));ks=list(d)[n*25:n*25+25]
    for k,v in P.items():
        assert k in ks,k
        t=v['explanation'].lower()
        assert 3<=len(v['related'])<=4,k
        for r in v['related']:
            w=re.sub(r'^(at|en|et) ','',r['da']).lower()
            assert not re.search(r'\b'+re.escape(w)+r'\b',t),(k,w)
        f=d[k]['forms'][0]['en']
        assert v['explanation'].count('means "%s"'%f)==1,(k,f)
    json.dump(P,open('deck_pass/parts/041_%d.json'%n if False else 'parts/041_%d.json'%n,'w'),ensure_ascii=False,indent=1)
    print('saved',len(P))
