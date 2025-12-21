(() => {
  let norm = (v) => window.CF_EXPORTER.utils.norm(v);
  let parseUSDateTime = (s) => window.CF_EXPORTER.utils.parseUSDateTime(s);

  let collectCandidates = (page) => {
    let rows = Array.from(document.querySelectorAll("tr.MuiTableRow-root.RaDatagrid-row"));
    let candidates = [];

    for (let row of rows) {
      let tds = Array.from(row.querySelectorAll("td"));
      if (tds.length < 7) continue;

      let kind = norm(tds[1]?.textContent);
      if (kind !== "Points generated") continue;

      let dateText = norm(row.querySelector("td.column-dateCreated span")?.textContent);
      let d = parseUSDateTime(dateText);
      if (!d) continue;

      let ptsRaw = norm(tds[5]?.textContent);
      let pointsTotal = parseFloat(ptsRaw.replace(/[^0-9.\-]/g, ""));
      if (!Number.isFinite(pointsTotal)) continue;

      let expandId = row.querySelector('[aria-controls$="-expand"]')?.getAttribute("aria-controls") || "";

      let y = d.getFullYear();
      let m = d.getMonth();

      candidates.push({ row, y, m, pointsTotal, dateText, expandId, page });
    }

    return candidates;
  };

  let mapLimit = async (items, limit, fn) => {
    let idx = 0;
    let out = new Array(items.length);

    let workers = Array(limit).fill(0).map(async () => {
      while (true) {
        let i = idx++;
        if (i >= items.length) return;
        out[i] = await fn(items[i], i);
      }
    });

    await Promise.all(workers);
    return out;
  };

  window.CF_EXPORTER = window.CF_EXPORTER || {};
  window.CF_EXPORTER.parse = { collectCandidates, mapLimit };
})();
