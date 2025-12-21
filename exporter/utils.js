(() => {
  let sleep = ms => new Promise(r => setTimeout(r, ms));
  let norm = v => (v == null ? "" : String(v)).trim();

  let parseUSDateTime = s => {
    let d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d;

    let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return null;

    let mm = parseInt(m[1], 10);
    let dd = parseInt(m[2], 10);
    let yy = parseInt(m[3], 10);
    let hh = parseInt(m[4], 10);
    let mi = parseInt(m[5], 10);
    let ss = parseInt(m[6], 10);
    let ap = m[7].toUpperCase();

    if (ap === "PM" && hh !== 12) hh += 12;
    if (ap === "AM" && hh === 12) hh = 0;

    let out = new Date(yy, mm - 1, dd, hh, mi, ss);
    if (Number.isNaN(out.getTime())) return null;
    return out;
  };

  window.CF_EXPORTER = window.CF_EXPORTER || {};
  window.CF_EXPORTER.utils = { sleep, norm, parseUSDateTime };
})();
