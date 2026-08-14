// Browser console collector for interview-question research.
//
// PURPOSE: a RESEARCH tool — captured links *inform* the course, they are NOT
// copied verbatim. Run only on pages you're authorized to view, logged in.
//
// WHAT IT DOES: for each target company, pages through the site's
// ?company=X listing (client-rendered, so we render it in ONE hidden iframe and
// read the question links). Writes <dir>/<company>.md — a numbered list of every
// question that company asked, each linked to its page. Simple and robust.
//
// USAGE
//   1. Open hellointerview.com; DevTools (F12) > Console; paste & Enter.
//   2. IQ.setDir()   — pick export folder
//   3. IQ.crawl()    — crawl all target companies
//      IQ.crawl({ companies: ['Google','Meta'] })  — specific companies
//      IQ.stop()                                    — abort
//   IQ.status() · IQ.list() · IQ.export() · IQ.clear()

(() => {
  const KEY = '__iq_links__',
        load = () => JSON.parse(localStorage.getItem(KEY) || '[]'),
        save = a => localStorage.setItem(KEY, JSON.stringify(a)),
        clean = t => (t || '').replace(/\s+/g, ' ').trim();

  const COMPANIES = [
    'Anthropic', 'NVIDIA', 'Google', 'Netflix', 'OpenAI', 'Meta',
    'Amazon', 'Apple', 'Microsoft', 'Stripe', 'Databricks',
    'Uber', 'Airbnb', 'DoorDash', 'SpaceX', 'Tesla', 'DeepMind',
  ];

  let crawlAbort = null;
  let exportDirHandle = null;

  function jitter() { return Math.floor(Math.random() * 3000) + 2000; } // 2-5s

  function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      if (signal) signal.addEventListener('abort', () => {
        clearTimeout(timer); reject(new Error('aborted'));
      }, { once: true });
    });
  }

  function titleFromSlug(url) {
    const slug = url.split('/').slice(-2, -1)[0] || '';
    return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // Extract {url, title} for each question card in a rendered listing document.
  function findDetailItems(doc) {
    const host = location.hostname;
    const byUrl = new Map();
    for (const a of doc.querySelectorAll('a[href]')) {
      try {
        const u = new URL(a.href, location.origin);
        if (u.hostname !== host || u.hash) continue;
        const seg = u.pathname.split('/').filter(Boolean);
        if (seg.length !== 4 || seg[0] !== 'community' || seg[1] !== 'questions') continue;
        const url = u.origin + u.pathname;
        const text = clean(a.innerText || a.textContent || '');
        const prev = byUrl.get(url);
        if (prev == null || text.length > prev.length) byUrl.set(url, text);
      } catch {}
    }
    return [...byUrl].map(([url, text]) => ({ url, title: text || titleFromSlug(url) }));
  }

  // ONE reused hidden iframe renders each listing page (light, ~dozens of loads).
  let frame = null;
  function getFrame() {
    if (!frame || !frame.isConnected) {
      frame = document.createElement('iframe');
      frame.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1024px;height:768px;opacity:0;pointer-events:none;';
      document.body.appendChild(frame);
    }
    return frame;
  }
  function disposeFrame() {
    if (frame) {
      try { frame.contentWindow?.stop(); } catch {}
      try { frame.src = 'about:blank'; } catch {}
      frame.remove(); frame = null;
    }
  }

  function grabListingItems(url, signal) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) { reject(new Error('aborted')); return; }
      const iframe = getFrame();
      let attempts = 0, poll = null, done = false;
      const onAbort = () => { if (poll) clearInterval(poll); done = true; reject(new Error('aborted')); };
      if (signal) signal.addEventListener('abort', onAbort, { once: true });
      const finish = (val) => {
        if (done) return; done = true;
        if (poll) clearInterval(poll);
        iframe.onload = null;
        if (signal) signal.removeEventListener('abort', onAbort);
        resolve(val);
      };
      iframe.onload = () => {
        poll = setInterval(() => {
          attempts++;
          try {
            const items = findDetailItems(iframe.contentDocument);
            if (items.length > 0 || attempts >= 15) finish(items);
          } catch { if (attempts >= 15) finish([]); }
        }, 1000);
      };
      iframe.src = url;
    });
  }

  // store: [{ url, title, companies: [] }]
  function addItem(url, title, company) {
    const all = load();
    let rec = all.find(x => x.url === url);
    if (!rec) { rec = { url, title, companies: [] }; all.push(rec); }
    if (title && title.length > (rec.title || '').length) rec.title = title;
    if (!rec.companies.includes(company)) rec.companies.push(company);
    save(all);
    return rec;
  }

  async function writeCompanyFile(company) {
    if (!exportDirHandle) return 0;
    const items = load().filter(r => r.companies.includes(company))
      .sort((a, b) => a.title.localeCompare(b.title));
    const md = `# ${company} — Interview Questions (${items.length})\n\n`
      + items.map((r, i) => `${i + 1}. [${r.title}](${r.url})`).join('\n') + '\n';
    try {
      const file = await exportDirHandle.getFileHandle(`${company}.md`, { create: true });
      const w = await file.createWritable();
      await w.write(md);
      await w.close();
    } catch (e) { console.warn(`⚠️ write ${company}.md: ${e.message}`); }
    return items.length;
  }

  window.IQ = {
    async setDir() {
      try {
        exportDirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        console.log(`📁 Export directory set: ${exportDirHandle.name}`);
      } catch { console.warn('⚠️ Directory picker cancelled'); }
    },

    async crawl({ companies = COMPANIES, sort = 'popular', maxPagesPerCompany = 50 } = {}) {
      if (crawlAbort) { console.log('crawl already running — IQ.stop() first'); return; }
      if (!exportDirHandle) { console.warn('⚠️ Run IQ.setDir() first'); return; }

      const ac = new AbortController();
      crawlAbort = ac;
      const signal = ac.signal;
      let grandTotal = 0;

      console.log('%c🕷️ Crawl started', 'color:orange;font-weight:bold',
        `${companies.length} companies`);

      try {
        for (const company of companies) {
          if (signal.aborted) break;
          console.log(`%c🏢 ${company}`, 'color:yellow;font-weight:bold');
          const seen = new Set();

          for (let page = 1; page <= maxPagesPerCompany; page++) {
            if (signal.aborted) break;
            const url = `${location.origin}/community/questions?company=${encodeURIComponent(company)}&sort=${sort}&page=${page}`;
            await sleep(jitter(), signal);

            let items;
            try {
              items = await grabListingItems(url, signal);
            } catch (e) {
              if (e.message === 'aborted') throw e;
              console.warn(`  ⚠️ p${page}: ${e.message}`); break;
            }

            const fresh = items.filter(it => !seen.has(it.url));
            if (!fresh.length) { console.log(`  🏁 end of ${company} at page ${page}`); break; }

            for (const it of fresh) { seen.add(it.url); addItem(it.url, it.title, company); }
            console.log(`  📄 p${page}: +${fresh.length} (${seen.size} total)`);
            await writeCompanyFile(company); // save progress each page
          }

          const n = await writeCompanyFile(company);
          grandTotal += n;
          console.log(`  ✅ ${company}: ${n} questions → ${company}.md`);
        }
      } catch (e) {
        if (e.message === 'aborted') console.log('%c⏹️ stopped', 'color:red;font-weight:bold');
        else console.error('Crawl error:', e);
      } finally {
        crawlAbort = null;
        disposeFrame();
      }

      console.log(`%c🏁 Done — ${grandTotal} question-links across companies, ${load().length} unique`,
        'color:green;font-weight:bold');
    },

    stop() {
      if (crawlAbort) { crawlAbort.abort(); crawlAbort = null; console.log('stopping…'); }
      else console.log('no crawl running');
    },

    status() {
      const all = load();
      const counts = {};
      for (const r of all) for (const c of r.companies) counts[c] = (counts[c] || 0) + 1;
      console.log(`${all.length} unique questions`);
      console.table(Object.entries(counts).sort((a, b) => b[1] - a[1])
        .map(([company, n]) => ({ company, questions: n })));
    },

    list() {
      const all = load();
      console.table(all.map(x => ({ title: x.title.slice(0, 60), companies: x.companies.join(', '), url: x.url })));
      return all.length;
    },

    async export() {
      if (!exportDirHandle) await IQ.setDir();
      if (!exportDirHandle) return;
      const companies = [...new Set(load().flatMap(r => r.companies))];
      for (const c of companies) await writeCompanyFile(c);
      console.log(`📁 wrote ${companies.length} company files`);
    },

    clear() { save([]); console.log('cleared'); }
  };

  console.log('%cIQ ready — question-link collector', 'color:green;font-weight:bold');
  console.log(`${COMPANIES.length} companies: ${COMPANIES.slice(0, 6).join(', ')}…`);
  console.log('1. IQ.setDir()   2. IQ.crawl()');
  console.log('IQ.stop() · IQ.status() · IQ.list() · IQ.export() · IQ.clear()');
})();
