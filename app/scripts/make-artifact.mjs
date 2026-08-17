// Reshape the standalone single-file build into the shape the Artifact host
// expects: no <!doctype>/<html>/<head>/<body> of our own — the host supplies
// that skeleton. We emit title, styles, the mount point, then the bundle.
import { readFileSync, writeFileSync } from 'node:fs'

const src = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8')

const styles = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n')
const scriptMatch = src.match(/<script type="module"[^>]*>([\s\S]*?)<\/script>/)
if (!scriptMatch) throw new Error('no inline module script found in dist/index.html')
const bundle = scriptMatch[1]
const title = (src.match(/<title>([\s\S]*?)<\/title>/) || [, 'OPERATOR'])[1]

const out = `<title>${title}</title>
<style>
html,body{margin:0;padding:0;min-height:100%}
${styles}
</style>
<div id="root"></div>
<script type="module">
${bundle}
</script>
`
writeFileSync(new URL('../dist/operator.html', import.meta.url), out)
console.log(`operator.html written — ${(out.length / 1024).toFixed(0)} KB (styles ${(styles.length / 1024).toFixed(0)} KB, bundle ${(bundle.length / 1024).toFixed(0)} KB)`)
