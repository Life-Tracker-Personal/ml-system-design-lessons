// Browser console collector for verbatim interview questions.
//
// SCOPE: Hello Interview, Educative, Blind (teamblind.com), 1point3acres only.
//
// PURPOSE: This is a RESEARCH tool. The captured text is used to *inform* the
// course (frameworks, question shapes, expected-answer rubrics in
// .claude/skills/interview-questions/) — NOT copied verbatim into lessons.
// Run it only on pages you are authorized to view, in your own logged-in
// browser. Do not crawl aggressively; it captures the single page you're on.
//
// USAGE
//   1. Open a page on one of the four sites.
//   2. Scroll to the bottom; expand any "show more comments".
//   3. Open DevTools (F12) > Console, paste this whole file, press Enter.
//   4. IQ.grab()    capture the current page (verbatim title + body + comments)
//      IQ.links()   print question/post/lesson URLs found on a list/search page
//      IQ.list()    show what you've collected so far
//      IQ.export()  download a .md of everything captured ON THIS DOMAIN
//      IQ.clear()   reset the store for this domain
//   5. Storage is per-domain — run IQ.export() before leaving each site.
//      Send the exported .md file back into the chat; it drops into research/raw/.

(() => {
  const KEY = '__iq__',
        load = () => JSON.parse(localStorage.getItem(KEY) || '[]'),
        save = a => localStorage.setItem(KEY, JSON.stringify(a)),
        clean = t => (t || '').replace(/ /g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim(),
        site = () => location.hostname.replace(/^www\./, '');
  const sel = s => [...document.querySelectorAll(s)].map(e => clean(e.innerText)).filter(Boolean);

  function extract() {
    const h = site();
    let title = clean(document.title), body = '', comments = [];
    try {
      if (h.includes('hellointerview.com')) {
        title = clean(document.querySelector('h1')?.innerText) || title;
        body = clean(document.querySelector('article,main,[class*=prose],[class*=content]')?.innerText);
        comments = sel('[class*=answer],[class*=comment],[class*=reply]');
      } else if (h.includes('educative.io')) {
        title = clean(document.querySelector('h1,[class*=lessonTitle],[class*=PageTitle]')?.innerText) || title;
        body = clean(document.querySelector('[class*=markdown],[class*=lesson-content],[class*=PageContent],article,main')?.innerText);
      } else if (h.includes('teamblind.com')) {
        title = clean(document.querySelector('h1,[class*=title]')?.innerText) || title;
        body = clean(document.querySelector('[class*=content],article')?.innerText);
        comments = sel('[class*=comment]');
      } else if (h.includes('1point3acres.com')) {
        title = clean(document.querySelector('h1,#thread_subject,.ts')?.innerText) || title;
        const posts = sel('#postlist .t_f, .post_message, .t_f');
        body = posts[0] || clean(document.querySelector('main,article,#postlist')?.innerText);
        comments = posts.slice(1);
      }
    } catch (e) { /* fall through to generic */ }

    if (!body) {
      const c = document.body.cloneNode(true);
      c.querySelectorAll('script,style,nav,header,footer,aside,svg,noscript,form,button').forEach(n => n.remove());
      body = clean((c.querySelector('article,main,[role=main]') || c).innerText);
    }
    return { url: location.href, site: h, title, capturedAt: new Date().toISOString(), body, comments };
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
    links() {
      const re = /hellointerview\.com\/(learn|community\/questions)\/|educative\.io\/(courses|module|lesson)\/|teamblind\.com\/post|1point3acres\.com\/.*(thread|interview)/;
      const u = [...new Set([...document.querySelectorAll('a[href]')].map(a => a.href).filter(x => re.test(x)))];
      console.log(u.join('\n'));
      return u;
    },
    export() {
      const a = load();
      const md = a.map(x => `\n\n# ${x.title}\nURL: ${x.url}\nSite: ${x.site} | ${x.capturedAt}\n\n## Body\n${x.body}\n\n## Comments (${x.comments.length})\n${x.comments.map((c, i) => `### ${i + 1}\n${c}`).join('\n\n')}`).join('\n\n---\n');
      const b = new Blob([md], { type: 'text/markdown' }), l = document.createElement('a');
      l.href = URL.createObjectURL(b); l.download = `iq-${site()}-${Date.now()}.md`; l.click();
      console.log(`⬇️ exported ${a.length} pages`);
    },
    clear() { save([]); console.log('cleared'); }
  };
  console.log('%cIQ ready (HelloInterview · Educative · Blind · 1point3acres)', 'color:green;font-weight:bold');
  console.log('IQ.grab() · IQ.list() · IQ.links() · IQ.export() · IQ.clear()');
})();
