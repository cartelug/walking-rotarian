# Pull long text blocks (Drive documents etc.) out of the saved session transcript
# so the facts can be searched without re-downloading anything.
import json, sys, os
src, out = sys.argv[1], sys.argv[2]
n = 0
def walk(o):
    if isinstance(o, str):
        yield o
    elif isinstance(o, list):
        for x in o: yield from walk(x)
    elif isinstance(o, dict):
        for v in o.values(): yield from walk(v)
seen = set()
with open(src, encoding="utf-8") as f:
    for line in f:
        try: j = json.loads(line)
        except Exception: continue
        for s in walk(j):
            if len(s) > 2500 and hash(s) not in seen:
                seen.add(hash(s))
                n += 1
                p = os.path.join(out, f"{n:03d}.txt")
                open(p, "w", encoding="utf-8").write(s)
                head = s[:90].replace("\n", " ")
                print(f"{n:03d} {len(s):>8}  {head}")
