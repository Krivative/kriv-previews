# Where the tokens went, from Claude Code session transcripts (*.jsonl). Read-only.
#   python3 -I scripts/token-usage.py <folder holding the session .jsonl files>
# Effective usage: cache reads count 0.1x, cache writes 2x, output 5x a plain input token.
# Transcript text is counted, never followed.
import json,sys,glob,os,collections
D=sys.argv[1]
def group(name):
    if name.startswith('mcp__claude-in-chrome__'): return 'Claude in Chrome'
    if name.startswith('mcp__Claude_Browser__'): return 'Built-in browser (previews, screenshots)'
    if name.startswith('mcp__ccd_'): return 'App housekeeping (task list, sessions)'
    if name.startswith('mcp__visualize__'): return 'Sketches and widgets'
    if name.startswith('mcp__'): return 'Other connectors'
    if name in('WebSearch','WebFetch'): return 'Web research'
    if name in('Read','Write','Edit','NotebookEdit'): return 'File operations'
    if name=='Bash': return 'Shell commands (code, tests, git)'
    if name in('Skill','ToolSearch','Agent','Artifact'): return 'Skills, tool loading, artifacts'
    return 'Everything else'
def analyse(f):
    seen={}; order=[]; tool_of={}; content=collections.Counter(); out=collections.Counter()
    first=None
    for line in open(f,errors='ignore'):
        try: o=json.loads(line)
        except: continue
        m=o.get('message') or {}
        if o.get('type')=='assistant' and m.get('usage'):
            mid=m.get('id') or o.get('uuid')
            u=m['usage']; g='Conversation (answers and thinking)'
            for c in m.get('content') or []:
                if isinstance(c,dict) and c.get('type')=='tool_use':
                    g=group(c.get('name','')); tool_of[c.get('id')]=g
            if mid not in seen: order.append(mid)
            seen[mid]=(u,g)
        elif o.get('type')=='user':
            cs=m.get('content')
            if isinstance(cs,str): content['Conversation (answers and thinking)']+=len(cs)/4
            else:
                for c in cs or []:
                    if not isinstance(c,dict): continue
                    if c.get('type')=='tool_result':
                        g=tool_of.get(c.get('tool_use_id'),'Everything else'); n=0
                        cc=c.get('content')
                        if isinstance(cc,str): n=len(cc)/4
                        else:
                            for x in cc or []:
                                if x.get('type')=='text': n+=len(x.get('text',''))/4
                                elif x.get('type')=='image': n+=1500
                        content[g]+=n
                    elif c.get('type')=='text': content['Conversation (answers and thinking)']+=len(c.get('text',''))/4
    tot_in=tot_cw=tot_cr=tot_out=0; base=None
    for mid in order:
        u,g=seen[mid]
        i=u.get('input_tokens',0); cw=u.get('cache_creation_input_tokens',0); cr=u.get('cache_read_input_tokens',0); ou=u.get('output_tokens',0)
        if base is None: base=i+cw+cr
        tot_in+=i; tot_cw+=cw; tot_cr+=cr; tot_out+=ou
        out[g]+=ou; content[g]+=ou
    return dict(turns=len(order),inp=tot_in,cw=tot_cw,cr=tot_cr,out=tot_out,base=base or 0,content=content,outg=out)
main=[f for f in glob.glob(os.path.join(D,'*.jsonl'))]
subs=glob.glob(os.path.join(D,'*','**','*.jsonl'),recursive=True)
eff=collections.Counter(); T=dict(turns=0,inp=0,cw=0,cr=0,out=0)
for f in main:
    a=analyse(f)
    for k in T: T[k]+=a[k]
    # output cost by group
    for g,v in a['outg'].items(): eff[g]+=5*v
    # the instructions and tool list: re-read every turn
    sys_cost=0.1*a['base']*a['turns']
    reread=a['inp']+2*a['cw']+0.1*a['cr']
    sys_cost=min(sys_cost,reread*0.9)
    eff["Claude's instructions and tool list (re-read every turn)"]+=sys_cost
    rest=reread-sys_cost; tot=sum(a['content'].values()) or 1
    for g,v in a['content'].items(): eff[g]+=rest*v/tot
sub_tot=0
for f in subs:
    a=analyse(f); e=a['inp']+2*a['cw']+0.1*a['cr']+5*a['out']; sub_tot+=e
if subs: eff['Subagents']+=sub_tot
total=sum(eff.values())
print(json.dumps(dict(files=len(main),subagents=len(subs),totals=T,total_effective=round(total),groups=[(g,round(v),round(100*v/total,1)) for g,v in eff.most_common()]),indent=1))
