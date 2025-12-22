(() => {
  let STATUS_ID = "cf-pdf-export-status";

  let removeStatus = () => {
    let el = document.getElementById(STATUS_ID);
    if (el) el.remove();
  };

  let setStatus = (text) => {
    let el = document.getElementById(STATUS_ID);
    if (!el) {
      el = document.createElement("div");
      el.id = STATUS_ID;
      (document.body || document.documentElement).appendChild(el);
    }

    el.removeAttribute("data-fade");
    el.textContent = text;
    return el;
  };


  let fadeStatusAfter = (ms) => {
    let el = document.getElementById(STATUS_ID);
    if (!el) return;

    let token = String(Date.now()) + Math.random();
    el.setAttribute("data-token", token);

    setTimeout(() => {
      let cur = document.getElementById(STATUS_ID);
      if (!cur) return;
      if (cur.getAttribute("data-token") !== token) return;
      cur.setAttribute("data-fade", "1");
      setTimeout(() => {
        let cur2 = document.getElementById(STATUS_ID);
        if (!cur2) return;
        if (cur2.getAttribute("data-token") !== token) return;
        cur2.remove();
      }, 350);
    }, ms);
  };

  window.CF_EXPORTER = window.CF_EXPORTER || {};
  window.CF_EXPORTER.status = { removeStatus, setStatus, fadeStatusAfter };
})();
