(() => {
  let norm = (v) => window.CF_EXPORTER.utils.norm(v);
  let parseUSDateTime = (s) => window.CF_EXPORTER.utils.parseUSDateTime(s);
  let collectCandidates = (page, reportType) => {
    let rows = Array.from(document.querySelectorAll("tr.MuiTableRow-root.RaDatagrid-row"));
    let candidates = [];

    let mode = (reportType === "withdrawals") ? "withdrawals" : "earnings";

    for (let row of rows) {
      let tds = Array.from(row.querySelectorAll("td"));
      if (tds.length < 7) continue;

      let kind = norm(tds[1]?.textContent);

      let typeCell = row.querySelector("td.column-type");
      let status = norm(typeCell ? (typeCell.textContent || typeCell.innerText) : (tds[3]?.textContent || ""));

      let dateCell = row.querySelector("td.column-dateCreated");
      let dateEl = dateCell ? (dateCell.querySelector("time") || dateCell.querySelector("span") || dateCell) : null;

      let dateRaw =
        norm(dateEl?.getAttribute("datetime")) ||
        norm(dateEl?.getAttribute("data-date")) ||
        norm(dateEl?.getAttribute("data-datetime")) ||
        norm(dateEl?.getAttribute("data-value")) ||
        norm(dateEl?.getAttribute("title")) ||
        norm(dateEl?.textContent);

      let d = parseUSDateTime(dateRaw);
      if (!d) continue;

      let ptsRaw = norm(tds[5]?.textContent);
      let pointsTotal = parseFloat(ptsRaw.replace(/[^0-9.\-]/g, ""));
      if (!Number.isFinite(pointsTotal)) continue;

      if (mode === "earnings") {
        if (kind !== "Points generated") continue;
      } else {
        if (status !== "Fulfilled") continue;
        if (!(pointsTotal < 0)) continue;
      }

      let details = norm(tds[2]?.textContent);
      let tx = norm(tds[6]?.textContent);
      if (!tx) {
        let link = tds[6]?.querySelector("a[href]");
        if (link) tx = norm(link.textContent);
      }

      let expandId = row.querySelector('[aria-controls$="-expand"]')?.getAttribute("aria-controls") || "";

      let y = d.getFullYear();
      let m = d.getMonth();

      candidates.push({
        row,
        y,
        m,
        pointsTotal,
        dateText: dateRaw,
        dateMs: d.getTime(),
        expandId,
        page,
        method: kind,
        details: details,
        tx: tx,
        status: status
      });
    }

    return candidates;
  };


  let mapLimit = async (items, limit, fn) => {
    let idx = 0;
    let out = new Array(items.length);

    let abort = window.__CF_EXPORT_ABORT;
    let isAborted = () => window.CF_PDF_EXPORT_STOP || (abort && abort.aborted);

    let workerCount = Math.max(1, Math.min(limit || 1, items.length || 0));

    let workers = Array(workerCount).fill(0).map(async () => {
      while (true) {
        let i = idx++;
        if (i >= items.length) return;

        if (isAborted()) {
          out[i] = null;
          continue;
        }

        try {
          let v = await fn(items[i], i);
          out[i] = v == null ? null : v;
        } catch (e) {
          out[i] = null;
        }
      }
    });

    await Promise.all(workers);
    return out;
  };


  window.CF_EXPORTER = window.CF_EXPORTER || {};
  window.CF_EXPORTER.parse = { collectCandidates, mapLimit };
})();
