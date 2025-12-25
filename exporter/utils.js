(() => {
  let sleep = ms => new Promise(r => setTimeout(r, ms));
  let norm = v => (v == null ? "" : String(v)).trim();

  let parseUSDateTime = s => {
    let raw = String(s == null ? "" : s).trim();
    if (!raw) return null;

    if (/^\d{10,13}$/.test(raw)) {
      let n = parseInt(raw, 10);
      if (!Number.isFinite(n)) return null;
      if (raw.length === 10) n = n * 1000;
      let d = new Date(n);
      if (!Number.isNaN(d.getTime())) return d;
    }

    let iso = new Date(raw);
    if (!Number.isNaN(iso.getTime())) return iso;

    let cleaned = raw
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b(klo|kl)\b/gi, " ")
      .trim();

    let m1 = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i);
    if (m1) {
      let mm = parseInt(m1[1], 10);
      let dd = parseInt(m1[2], 10);
      let yy = parseInt(m1[3], 10);
      let hh = parseInt(m1[4], 10);
      let mi = parseInt(m1[5], 10);
      let ss = parseInt(m1[6], 10);
      let ap = m1[7].toUpperCase();

      if (ap === "PM" && hh !== 12) hh += 12;
      if (ap === "AM" && hh === 12) hh = 0;

      let out = new Date(yy, mm - 1, dd, hh, mi, ss);
      if (!Number.isNaN(out.getTime())) return out;
    }

    let m2 = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (m2) {
      let a = parseInt(m2[1], 10);
      let b = parseInt(m2[2], 10);
      let yy = parseInt(m2[3], 10);
      let hh = parseInt(m2[4], 10);
      let mi = parseInt(m2[5], 10);
      let ss = parseInt(m2[6] || "0", 10);

      let mm = a;
      let dd = b;

      if (a > 12 && b <= 12) {
        dd = a;
        mm = b;
      }

      let out = new Date(yy, mm - 1, dd, hh, mi, ss);
      if (!Number.isNaN(out.getTime())) return out;
    }

    let m3 = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[,\s]+(\d{1,2})[.:](\d{2})(?:[.:](\d{2}))?(?:\s*(AM|PM))?)?$/i);
    if (m3) {
      let dd = parseInt(m3[1], 10);
      let mm = parseInt(m3[2], 10);
      let yy = parseInt(m3[3], 10);

      let hh = parseInt(m3[4] || "0", 10);
      let mi = parseInt(m3[5] || "0", 10);
      let ss = parseInt(m3[6] || "0", 10);

      let ap = String(m3[7] || "").toUpperCase();
      if (ap === "PM" && hh !== 12) hh += 12;
      if (ap === "AM" && hh === 12) hh = 0;

      let out = new Date(yy, mm - 1, dd, hh, mi, ss);
      if (!Number.isNaN(out.getTime())) return out;
    }

    return null;
  };



  window.CF_EXPORTER = window.CF_EXPORTER || {};
  window.CF_EXPORTER.utils = { sleep, norm, parseUSDateTime };
})();
