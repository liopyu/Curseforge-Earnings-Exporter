(() => {
  if (window.__CF_EXPORTER_PAGE_LOADER) return;
  window.__CF_EXPORTER_PAGE_LOADER = true;

  let getBaseUrl = () => {
    let cs = document.currentScript;
    let src = cs && cs.src ? String(cs.src) : "";
    if (!src) {
      let scripts = document.querySelectorAll('script[src]');
      let last = scripts.length ? scripts[scripts.length - 1] : null;
      src = last && last.src ? String(last.src) : "";
    }
    let i = src.lastIndexOf("/");
    if (i === -1) return src;
    return src.slice(0, i + 1);
  };

  let base = getBaseUrl();

  let inject = (path) =>
    new Promise((resolve, reject) => {
      let s = document.createElement("script");
      s.src = base + path;
      s.onload = () => {
        s.remove();
        resolve();
      };
      s.onerror = () => {
        try { s.remove(); } catch (e) { }
        reject(new Error("Failed to inject: " + path));
      };
      (document.head || document.documentElement).appendChild(s);
    });

  (async () => {
    try {
      await inject("exporter/status.js");
      await inject("exporter/utils.js");
      await inject("exporter/pagination.js");
      await inject("exporter/breakdown.js");
      await inject("exporter/parse.js");
      await inject("exporter/pdf.js");
      await inject("exporter/range.js");
      await inject("exporter/index.js");
    } catch (e) {
      console.error(e);
    }
  })();
})();
