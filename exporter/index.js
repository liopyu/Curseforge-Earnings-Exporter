(() => {
  let running = false;

  let USD_PER_POINT = 5 / 100;
  let monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  let fmtUSD = n => {
    let v = Math.round(n * 100) / 100;
    return "$" + v.toFixed(2);
  };

  let fmtPoints = n => {
    let v = Math.round(n * 10000) / 10000;
    return v.toFixed(4);
  };

  let exporterMain = async (includeMods) => {
    window.CF_PDF_EXPORT_STOP = false;

    let setStatus = window.CF_EXPORTER.status.setStatus;
    let fadeStatusAfter = window.CF_EXPORTER.status.fadeStatusAfter;

    let norm = window.CF_EXPORTER.utils.norm;

    let ensureOnPage1 = window.CF_EXPORTER.pagination.ensureOnPage1;
    let getNextBtn = window.CF_EXPORTER.pagination.getNextBtn;
    let nextDisabled = window.CF_EXPORTER.pagination.nextDisabled;
    let tableSig = window.CF_EXPORTER.pagination.tableSig;
    let waitForTableChange = window.CF_EXPORTER.pagination.waitForTableChange;

    let collectCandidates = window.CF_EXPORTER.parse.collectCandidates;
    let mapLimit = window.CF_EXPORTER.parse.mapLimit;

    let expandRowAndParseMods = window.CF_EXPORTER.breakdown.expandRowAndParseMods;

    let okStart = await ensureOnPage1();
    if (!okStart) return;

    let totalsPoints = {};
    let totalsUSD = {};
    let totalsModPoints = {};
    let totalsModUSD = {};
    let seen = new Set();

    let page = 0;

    while (true) {
      if (window.CF_PDF_EXPORT_STOP) {
        setStatus("Stopped.");
        fadeStatusAfter(5000);
        return;
      }

      page++;

      let rawCandidates = collectCandidates(page);
      let candidates = [];

      for (let i = 0; i < rawCandidates.length; i++) {
        let it = rawCandidates[i];
        let key = String(it.y) + "|" + String(it.m) + "|" + String(it.pointsTotal) + "|" + String(it.expandId);
        if (seen.has(key)) continue;
        seen.add(key);
        candidates.push(it);
      }

      let parsed = null;

      if (!includeMods) {
        parsed = candidates.map(it => ({ y: it.y, m: it.m, pointsTotal: it.pointsTotal, mods: [] }));
      } else {
        parsed = await mapLimit(candidates, 4, async it => {
          let meta = { dateText: it.dateText, page: it.page, expandId: it.expandId };
          let mods = await expandRowAndParseMods(it.row, it.pointsTotal, meta);
          if (!mods.length) mods = await expandRowAndParseMods(it.row, it.pointsTotal, meta);
          return { y: it.y, m: it.m, pointsTotal: it.pointsTotal, mods };
        });
      }

      for (let i = 0; i < parsed.length; i++) {
        let it = parsed[i];

        if (!totalsPoints[it.y]) totalsPoints[it.y] = Array(12).fill(0);
        if (!totalsUSD[it.y]) totalsUSD[it.y] = Array(12).fill(0);

        totalsPoints[it.y][it.m] += it.pointsTotal;
        totalsUSD[it.y][it.m] += it.pointsTotal * USD_PER_POINT;

        if (includeMods) {
          if (!totalsModPoints[it.y]) totalsModPoints[it.y] = {};
          if (!totalsModUSD[it.y]) totalsModUSD[it.y] = {};

          if (it.mods && it.mods.length) {
            for (let j = 0; j < it.mods.length; j++) {
              let mod = it.mods[j];
              let name = mod.name;
              let pts = mod.points;
              if (!Number.isFinite(pts)) continue;

              totalsModPoints[it.y][name] = (totalsModPoints[it.y][name] || 0) + pts;
              totalsModUSD[it.y][name] = (totalsModUSD[it.y][name] || 0) + (pts * USD_PER_POINT);
            }
          } else {
            let bucket = "(Unattributed / Unknown)";
            totalsModPoints[it.y][bucket] = (totalsModPoints[it.y][bucket] || 0) + it.pointsTotal;
            totalsModUSD[it.y][bucket] = (totalsModUSD[it.y][bucket] || 0) + (it.pointsTotal * USD_PER_POINT);
          }
        }
      }

      setStatus("Parsed page " + page + ". Rows: " + seen.size + ". Years: " + Object.keys(totalsUSD).length + ".");

      let btn = getNextBtn();
      if (!btn || nextDisabled(btn)) break;

      let before = tableSig();
      btn.click();

      let changed = await waitForTableChange(before, 15000);
      if (!changed) break;
    }

    let years = Object.keys(totalsUSD).map(x => parseInt(x, 10)).filter(Number.isFinite).sort((a, b) => a - b);
    let now = new Date();

    let bytes = window.CF_EXPORTER.pdf.buildOfficialPdf({
      includeMods,
      years,
      now,
      pageCountParsed: page,
      rowsCounted: seen.size,
      totalsPoints,
      totalsUSD,
      totalsModPoints,
      totalsModUSD,
      monthNames,
      fmtUSD,
      fmtPoints
    });

    let blob = new Blob([bytes], { type: "application/pdf" });
    let url = URL.createObjectURL(blob);

    let pad2 = n => String(n).padStart(2, "0");
    let yyyy = now.getFullYear();
    let mm = pad2(now.getMonth() + 1);
    let dd = pad2(now.getDate());
    let range = years.length ? (years[0] + "-" + years[years.length - 1]) : "no-data";

    let name = "Curseforge Earnings Report " + range + " - " + yyyy + "." + mm + "." + dd + ".pdf";

    let a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setStatus("Done. PDF downloaded. Pages parsed: " + page + ". Rows: " + seen.size + ".");
    fadeStatusAfter(5000);
  };

  let runExport = async (includeMods) => {
    if (running) return;

    window.CF_EXPORTER.status.removeStatus();
    window.CF_EXPORTER.status.setStatus("Starting…");

    running = true;
    try {
      await exporterMain(includeMods);
    } finally {
      running = false;
    }
  };

  window.addEventListener("CF_PDF_EXPORT_START", (e) => {
    let includeMods = true;
    try { includeMods = e && e.detail && typeof e.detail.includeMods === "boolean" ? e.detail.includeMods : true; } catch (x) { }
    runExport(includeMods);
  });

  window.addEventListener("CF_PDF_EXPORT_STOP", () => {
    window.CF_PDF_EXPORT_STOP = true;
  });
})();
