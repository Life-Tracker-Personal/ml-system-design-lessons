// Browser console collector for verbatim interview-question research.
//
// SITE-AGNOSTIC: no hostnames or site-specific rules are baked in. It uses
// generic, Readability-style heuristics, so it works on whatever page you run
// it on. Point it at the prep sites and discussion forums you're researching.
//
// PURPOSE: a RESEARCH tool. Captured text *informs* the course (frameworks,
// question shapes, expected-answer rubrics in
// .claude/skills/interview-questions/) — it is NOT copied verbatim into lessons.
// Run it only on pages you are authorized to view, in your own logged-in
// browser. It captures the single page you're on; don't crawl aggressively.
//
// USAGE
//   1. Open a page; scroll to the bottom; expand any "show more comments".
//   2. DevTools (F12) > Console, paste this whole file, press Enter.
//   3. IQ.grab()    capture the current page (verbatim title + body + comments)
//      IQ.links()   print same-site links that look like posts/threads/lessons
//      IQ.list()    show what you've collected so far
//      IQ.export()  download a .md of everything captured ON THIS DOMAIN
//      IQ.clear()   reset the store for this domain
//   4. Storage is per-domain — run IQ.export() before leaving each site, then
//      send the exported .md back into the chat (it lands in research/raw/).

(() => {
  const KEY = '__iq__',
        load = () => JSON.parse(localStorage.getItem(KEY) || '[]'),
        save = a => localStorage.setItem(KEY, JSON.stringify(a)),
        clean = t => (t || '').replace(/ /g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  // Generic main-content picker: among candidate blocks, prefer the one with
  // the most text and the lowest link-density (nav/menus are link-dense).
  function pickMain(root) {
    const cands = [...root.querySelectorAll('article, main, [role=main], section, div')];
    let best = null, bestScore = 0;
    for (const el of cands) {
      const len = (el.innerText || '').length;
      if (len < 200) continue;
      const linkChars = [...el.querySelectorAll('a')].reduce((s, a) => s + (a.innerText || '').length, 0);
      const score = len * (1 - (len ? linkChars / len : 1));
      if (score > bestScore) { bestScore = score; best = el; }
    }
    return best || root;
  }

  function extract() {
    // Strip chrome from a clone so it never pollutes the text.
    const c = document.body.cloneNode(true);
    c.querySelectorAll('script,style,nav,header,footer,aside,svg,noscript,form,button')
      .forEach(n => n.remove());

    const title = clean(document.querySelector('h1')?.innerText) || clean(document.title);
    const main = pickMain(c);
    const body = clean(main.innerText);

    // Comments by generic semantic class hints (not tied to any site).
    const comments = [...c.querySelectorAll('[class*=comment i],[class*=reply i],[class*=answer i]')]
      .map(e => clean(e.innerText)).filter(t => t && t.length > 20);

    return { url: location.href, host: location.hostname, title,
             capturedAt: new Date().toISOString(), body, comments };
  }

  window.IQ = {
    grab() {
      const a = load(), r = extract();
      if (a.some(x => x.url === r.url)) { console.log('already have', r.url); return r; }
      a.push(r); save(a);
      console.log(`✅ ${a.length} total | ${r.title} | ${r.body.length} chars, ${r.comments.length} comments`);
      return r;
    },
    list() {
      const a = load();
      console.table(a.map(x => ({ title: x.title.slice(0, 60), comments: x.comments.length, url: x.url })));
      return a.length;
    },
    // Same-origin links whose path looks like a discussion/question/lesson page.
    links() {
      const here = location.hostname;
      const re = /(thread|post|question|discuss|comment|lesson|interview|topic|answer)/i;
      const u = [...new Set([...document.querySelectorAll('a[href]')].map(a => a.href).filter(x => {
        try { const url = new URL(x); return url.hostname === here && re.test(url.pathname); }
        catch (e) { return false; }
      }))];
      console.log(u.join('\n'));
      return u;
    },
    export() {
      const a = load();
      const md = a.map(x => `\n\n# ${x.title}\nURL: ${x.url}\nHost: ${x.host} | ${x.capturedAt}\n\n## Body\n${x.body}\n\n## Comments (${x.comments.length})\n${x.comments.map((cm, i) => `### ${i + 1}\n${cm}`).join('\n\n')}`).join('\n\n---\n');
      const b = new Blob([md], { type: 'text/markdown' }), l = document.createElement('a');
      l.href = URL.createObjectURL(b);
      l.download = `iq-${location.hostname.replace(/^www\./, '')}-${Date.now()}.md`;
      l.click();
      console.log(`⬇️ exported ${a.length} pages`);
    },
    clear() { save([]); console.log('cleared'); }
  };
  console.log('%cIQ ready (site-agnostic capture)', 'color:green;font-weight:bold');
  console.log('IQ.grab() · IQ.list() · IQ.links() · IQ.export() · IQ.clear()');
})();
