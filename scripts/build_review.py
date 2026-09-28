"""Package the existing production build as a self-contained review copy.

Usage: python3 scripts/build_review.py /absolute/path/gospel-atlas-review.html
Run npm run build first. The published docs/ build is never modified.
"""
from pathlib import Path
import base64
import json
import re
import sys

root = Path(__file__).resolve().parents[1]
docs = root / 'docs'
output = Path(sys.argv[1]).resolve()
html = (docs / 'index.html').read_text()
script_path = re.search(r'<script[^>]+src="([^"]+)"[^>]*></script>', html).group(1)
css_path = re.search(r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>', html).group(1)
script = (docs / script_path).read_text()
css = (docs / css_path).read_text()
assets = {p.name: base64.b64encode(p.read_bytes()).decode() for p in (docs / 'data').iterdir() if p.is_file()}
worker = next((docs / 'assets').glob('statistics.worker-*.js'))
worker_url = "URL.createObjectURL(new Blob([" + json.dumps(worker.read_text()) + "],{type:'text/javascript'}))"
script, count = re.subn(r'new URL\(`statistics\.worker-[^`]+`,import\.meta\.url\)\.href', lambda _: worker_url, script)
assert count == 1, 'Review worker packaging must track the Vite output format'
# Only review data requests are served from the byte-identical embedded files.
bootstrap = r"""
const embeddedFiles = __FILES__;
const bytesFor = name => Uint8Array.from(atob(embeddedFiles[name]), c => c.charCodeAt(0));
const contentType = name => name.endsWith('.json') ? 'application/json' : 'text/plain';
const originalFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
 const url = new URL(typeof input === 'string' ? input : input.url || String(input), location.href);
 const name = url.pathname.split('/').pop();
 if (url.pathname.includes('/data/') && Object.hasOwn(embeddedFiles, name)) {
  return Promise.resolve(new Response(bytesFor(name), {headers:{'Content-Type':contentType(name)}}));
 }
 return originalFetch(input, init);
};
document.addEventListener('click', event => {
 const link = event.target.closest?.('a[download]'); if (!link) return;
 const name = new URL(link.href).pathname.split('/').pop();
 if (!Object.hasOwn(embeddedFiles, name)) return;
 event.preventDefault();
 const url = URL.createObjectURL(new Blob([bytesFor(name)], {type:contentType(name)}));
 const download = document.createElement('a'); download.href=url; download.download=name;
 download.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
});
if (!location.hash) history.replaceState(null,'','#view=compare&books=MAT,MRK&ed=SBLGNT&passage=divorce-focus&tab=text&explore=0');
""".replace('__FILES__', json.dumps(assets))
# Script terminators are escaped without altering their evaluated string values.
safe_script = (bootstrap + '\n' + script).replace('</script', '<\\/script')
html = re.sub(r'<script[^>]+src="[^"]+"[^>]*></script>', lambda _: '<script type="module">' + safe_script + '</script>', html)
html = re.sub(r'<link[^>]+rel="stylesheet"[^>]+href="[^"]+"[^>]*>', lambda _: '<style>' + css + '</style>', html)
favicon = 'data:image/svg+xml;base64,' + base64.b64encode((docs / 'favicon.svg').read_bytes()).decode()
html = html.replace('./favicon.svg', favicon).replace('<title>Gospel Atlas — Explore the Four Gospels</title>', '<title>Gospel Atlas — Review copy</title>')
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(html)
print(json.dumps({'file':str(output),'bytes':output.stat().st_size,'embeddedFiles':len(assets)}))
