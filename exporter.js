(() => {
  if (window.__CF_EXPORTER_INJECTED) return;
  window.__CF_EXPORTER_INJECTED = true;

  let inject = (path) => new Promise((resolve, reject) => {
    let s = document.createElement("script");
    s.src = chrome.runtime.getURL(path);
    s.onload = () => {
      s.remove();
      resolve();
    };
    s.onerror = () => {
      s.remove();
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
      await inject("exporter/index.js");
    } catch (e) {
      console.error(e);
    }
  })();
})();
