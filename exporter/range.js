(() => {
  if (!window.CF_EXPORTER) window.CF_EXPORTER = {};
  if (!window.CF_EXPORTER.range) window.CF_EXPORTER.range = {};

  let norm = window.CF_EXPORTER.utils && window.CF_EXPORTER.utils.norm
    ? window.CF_EXPORTER.utils.norm
    : (v => (v == null ? "" : String(v)).trim());

  let parseDateTime = window.CF_EXPORTER.utils && typeof window.CF_EXPORTER.utils.parseUSDateTime === "function"
    ? window.CF_EXPORTER.utils.parseUSDateTime
    : (s => {
      let d = new Date(s);
      if (!Number.isNaN(d.getTime())) return d;
      return null;
    });

  let getRowDateRaw = (row) => {
    let cell = row ? row.querySelector("td.column-dateCreated") : null;
    if (!cell) return "";

    let el = cell.querySelector("time") || cell.querySelector("span") || cell;

    return (
      norm(el.getAttribute("datetime")) ||
      norm(el.getAttribute("data-date")) ||
      norm(el.getAttribute("data-datetime")) ||
      norm(el.getAttribute("data-value")) ||
      norm(el.getAttribute("title")) ||
      norm(el.textContent || el.innerText)
    );
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

      let dateRaw = getRowDateRaw(row);
      if (!dateRaw) continue;

      let d = parseDateTime(dateRaw);
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

  window.CF_EXPORTER.range.scanPageMinMax = scanPageMinMax;

  window.CF_EXPORTER.range.probeMinMaxDate = async () => {
    let min = "2013-01-01";
    let max = toYMD(new Date());
    return { min: min, max: max };
  };
})();
