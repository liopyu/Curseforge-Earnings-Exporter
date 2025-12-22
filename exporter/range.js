(() => {
  if (!window.CF_EXPORTER) window.CF_EXPORTER = {};
  if (!window.CF_EXPORTER.range) window.CF_EXPORTER.range = {};

  let norm = window.CF_EXPORTER.utils && window.CF_EXPORTER.utils.norm
    ? window.CF_EXPORTER.utils.norm
    : (v => (v == null ? "" : String(v)).trim());

  let sleep = ms => new Promise(r => setTimeout(r, ms));

  let parseUSDateTime = s => {
    let d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d;

    let m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i);
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

  let scanPageMinMax = () => {
    let rows = Array.from(document.querySelectorAll("tr.MuiTableRow-root.RaDatagrid-row"));
    let min = null;
    let max = null;

    for (let i = 0; i < rows.length; i++) {
      let row = rows[i];
      let tds = Array.from(row.querySelectorAll("td"));
      if (tds.length < 7) continue;

      let kind = norm(tds[1] && (tds[1].textContent || tds[1].innerText));
      if (kind !== "Points generated") continue;

      let span = row.querySelector("td.column-dateCreated span");
      let dateText = norm(span && (span.textContent || span.innerText));
      if (!dateText) continue;

      let d = parseUSDateTime(dateText);
      if (!d) continue;

      if (!min || d < min) min = d;
      if (!max || d > max) max = d;
    }

    return { min, max };
  };

  let toYMD = d => {
    let pad2 = n => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  };
  window.CF_EXPORTER.range.probeMinMaxDate = async () => {
    let min = "2013-01-01";
    let max = toYMD(new Date());
    return { min: min, max: max };
  };

})();
