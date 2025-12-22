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

  let toYmdLocal = (d) => {
    let y = d.getFullYear();
    let m = String(d.getMonth() + 1).padStart(2, "0");
    let dd = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + dd;
  };
  let getRowDateRaw = (row) => {
    let cell = row ? row.querySelector("td.column-dateCreated") : null;
    if (!cell) return "";

    let el = cell.querySelector("time") || cell.querySelector("span") || cell;

    return (
      String(el.getAttribute("datetime") || "").trim() ||
      String(el.getAttribute("data-date") || "").trim() ||
      String(el.getAttribute("data-datetime") || "").trim() ||
      String(el.getAttribute("data-value") || "").trim() ||
      String(el.getAttribute("title") || "").trim() ||
      String(el.textContent || "").trim()
    );
  };
  let __probeRunning = false;
  let __probeDone = false;

  window.addEventListener("CF_PDF_EXPORT_PROBE_RANGE", async () => {
    if (__probeDone || __probeRunning) return;
    __probeRunning = true;

    try {
      let minYmd = "2013-01-01";
      let maxYmd = toYmdLocal(new Date());

      window.dispatchEvent(new CustomEvent("CF_PDF_EXPORT_PROBE_RANGE_RESULT", {
        detail: { min: minYmd, max: maxYmd }
      }));

      __probeDone = true;
    } finally {
      __probeRunning = false;
    }
  });
  window.__CF_EXPORT_ABORT = window.__CF_EXPORT_ABORT || { aborted: false };

  window.addEventListener("CF_PDF_EXPORT_STOP", () => {
    window.CF_PDF_EXPORT_STOP = true;
    if (window.__CF_EXPORT_ABORT) window.__CF_EXPORT_ABORT.aborted = true;
  });
  let exporterMain = async (includeMods, startDateYmd, endDateYmd) => {
    window.CF_PDF_EXPORT_STOP = false;
    window.__CF_EXPORT_ABORT = { aborted: false };
    let abort = window.__CF_EXPORT_ABORT;
    let isAborted = () => window.CF_PDF_EXPORT_STOP || (abort && abort.aborted);

    let setStatus = window.CF_EXPORTER.status.setStatus;
    let fadeStatusAfter = window.CF_EXPORTER.status.fadeStatusAfter;

    let pagination = window.CF_EXPORTER.pagination;
    let ensureOnPage1 = pagination.ensureOnPage1;
    let getNextBtn = pagination.getNextBtn;
    let nextDisabled = pagination.nextDisabled;
    let tableSig2 = pagination.tableSig;
    let waitForTableChange2 = pagination.waitForTableChange;

    let collectCandidates = window.CF_EXPORTER.parse.collectCandidates;
    let mapLimit = window.CF_EXPORTER.parse.mapLimit;

    let parseUSDateTime = window.CF_EXPORTER.utils.parseUSDateTime;

    let ymdToMs = (ymd) => {
      if (!ymd) return null;
      let m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return null;
      let y = parseInt(m[1], 10);
      let mo = parseInt(m[2], 10);
      let d = parseInt(m[3], 10);
      let dt = new Date(y, mo - 1, d, 12, 0, 0, 0);
      if (Number.isNaN(dt.getTime())) return null;
      return dt.getTime();
    };

    let startMs = ymdToMs(startDateYmd);
    let endMs = ymdToMs(endDateYmd);

    if (startMs == null || endMs == null) {
      setStatus("Invalid date range.");
      fadeStatusAfter(5000);
      return;
    }

    if (startMs > endMs) {
      setStatus("Invalid date range (start after end).");
      fadeStatusAfter(5000);
      return;
    }

    let okStart = await ensureOnPage1();
    if (!okStart) return;

    let totalsPoints = {};
    let totalsUSD = {};
    let totalsModPoints = {};
    let totalsModUSD = {};
    let seen = new Set();

    let page = 0;
    let parsedPages = 0;
    let skippedPages = 0;

    let scanPageNewestOldestMs = () => {
      let rows = Array.from(document.querySelectorAll("tr.MuiTableRow-root.RaDatagrid-row"));
      let newest = null;
      let oldest = null;

      for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let dateRaw = getRowDateRaw(row);
        if (!dateRaw) continue;

        let d = parseUSDateTime(dateRaw);
        if (!d) continue;

        let t = d.getTime();
        if (newest == null || t > newest) newest = t;
        if (oldest == null || t < oldest) oldest = t;
      }

      return { newest, oldest };
    };


    try {
      while (true) {
        if (isAborted()) {
          setStatus("Stopped.");
          fadeStatusAfter(5000);
          return;
        }

        page++;

        let mm = scanPageNewestOldestMs();

        if (mm.oldest != null && mm.oldest > endMs) {
          skippedPages++;
          setStatus("Skipped page " + page + " (too new). Parsed: " + parsedPages + ". Skipped: " + skippedPages + ".");
        } else if (mm.newest != null && mm.newest < startMs) {
          setStatus("Reached start of range on page " + page + ". Parsed: " + parsedPages + ". Skipped: " + skippedPages + ".");
          break;
        } else {
          let rawCandidates = collectCandidates(page) || [];

          let candidates = [];
          for (let i = 0; i < rawCandidates.length; i++) {
            if (isAborted()) break;

            let it = rawCandidates[i];
            if (!it) continue;

            let d = parseUSDateTime(it.dateText);
            if (!d) continue;
            let t = d.getTime();

            if (t < startMs || t > endMs) continue;

            let key = String(it.y) + "|" + String(it.m) + "|" + String(it.pointsTotal) + "|" + String(it.expandId);
            if (seen.has(key)) continue;
            seen.add(key);
            candidates.push(it);
          }

          if (isAborted()) {
            setStatus("Stopped.");
            fadeStatusAfter(5000);
            return;
          }

          let parsed = null;

          if (!includeMods) {
            parsed = candidates.map(it => it ? ({ y: it.y, m: it.m, pointsTotal: it.pointsTotal, mods: [] }) : null);
          } else {
            let expandRow = window.CF_EXPORTER.breakdown.expandRow;
            let readExpandedRowMods = window.CF_EXPORTER.breakdown.readExpandedRowMods;

            let contexts = await mapLimit(candidates, 6, async it => {
              if (isAborted()) return null;
              if (!it) return null;
              try {
                return await expandRow(it.row);
              } catch (e) {
                return null;
              }
            });

            if (isAborted()) {
              setStatus("Stopped.");
              fadeStatusAfter(5000);
              return;
            }

            parsed = await mapLimit(candidates, 1, async (it) => {
              if (window.CF_PDF_EXPORT_STOP) return null;

              let meta = { dateText: it.dateText, page: it.page, expandId: it.expandId };

              let expandRow = window.CF_EXPORTER.breakdown.expandRow;
              let readExpandedRowMods = window.CF_EXPORTER.breakdown.readExpandedRowMods;

              let ctx = await expandRow(it.row);
              if (!ctx) return { y: it.y, m: it.m, pointsTotal: it.pointsTotal, mods: [] };

              let mods = await readExpandedRowMods(it.row, it.pointsTotal, meta, ctx);
              if (!mods.length) mods = await readExpandedRowMods(it.row, it.pointsTotal, meta, ctx);

              return { y: it.y, m: it.m, pointsTotal: it.pointsTotal, mods: mods };
            });

          }

          if (isAborted()) {
            setStatus("Stopped.");
            fadeStatusAfter(5000);
            return;
          }

          let parsedSafe = (parsed || []).filter(Boolean);

          for (let i = 0; i < parsedSafe.length; i++) {
            let it = parsed[i];
            if (!it) continue;

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
                  if (!mod) continue;

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

          parsedPages++;
          setStatus("Parsed page " + page + ". Rows: " + seen.size + ". Years: " + Object.keys(totalsUSD).length + ". Skipped: " + skippedPages + ".");
        }

        if (isAborted()) {
          setStatus("Stopped.");
          fadeStatusAfter(5000);
          return;
        }

        let btn = getNextBtn();
        if (!btn || nextDisabled(btn)) break;

        let before = tableSig2();
        btn.click();

        let changed = await waitForTableChange2(before, 15000);
        if (!changed) break;
      }

      if (isAborted()) {
        setStatus("Stopped.");
        fadeStatusAfter(5000);
        return;
      }

      let yearsOut = Object.keys(totalsUSD).map(x => parseInt(x, 10)).filter(Number.isFinite).sort((a, b) => a - b);
      let now = new Date();

      let bytes = window.CF_EXPORTER.pdf.buildOfficialPdf({
        includeMods: includeMods,
        years: yearsOut,
        now: now,
        pageCountParsed: parsedPages,
        rowsCounted: seen.size,
        totalsPoints: totalsPoints,
        totalsUSD: totalsUSD,
        totalsModPoints: totalsModPoints,
        totalsModUSD: totalsModUSD,
        monthNames: monthNames,
        fmtUSD: fmtUSD,
        fmtPoints: fmtPoints
      });

      if (isAborted()) {
        setStatus("Stopped.");
        fadeStatusAfter(5000);
        return;
      }

      let blob = new Blob([bytes], { type: "application/pdf" });
      let url = URL.createObjectURL(blob);

      let pad2 = n => String(n).padStart(2, "0");
      let yyyy = now.getFullYear();
      let mm2 = pad2(now.getMonth() + 1);
      let dd2 = pad2(now.getDate());
      let range = yearsOut.length ? (yearsOut[0] + "-" + yearsOut[yearsOut.length - 1]) : "no-data";

      let name = "Curseforge Earnings Report " + range + " - " + yyyy + "." + mm2 + "." + dd2 + ".pdf";

      let a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);

      if (isAborted()) {
        setStatus("Stopped.");
        fadeStatusAfter(5000);
        return;
      }

      a.click();
      a.remove();

      setStatus("Done. PDF downloaded. Pages parsed: " + parsedPages + ". Pages skipped: " + skippedPages + ". Rows: " + seen.size + ".");
      fadeStatusAfter(5000);
    } finally {
      try {
        await ensureOnPage1();
      } catch (e) {
      }
    }
  };

  let runExport = async (includeMods, startDate, endDate) => {
    if (running) return;

    window.CF_EXPORTER.status.removeStatus();
    window.CF_EXPORTER.status.setStatus("Starting…");

    running = true;
    try {
      window.dispatchEvent(new CustomEvent("CF_PDF_EXPORT_RUNNING", { detail: { running: true } }));
      await exporterMain(includeMods, startDate, endDate);
    } finally {
      running = false;
      window.dispatchEvent(new CustomEvent("CF_PDF_EXPORT_RUNNING", { detail: { running: false } }));
    }
  };



  window.addEventListener("CF_PDF_EXPORT_START", (e) => {
    let includeMods = true;
    let startDate = null;
    let endDate = null;

    try { includeMods = e && e.detail && typeof e.detail.includeMods === "boolean" ? e.detail.includeMods : true; } catch (x) { }
    try { startDate = e && e.detail && typeof e.detail.startDate === "string" ? e.detail.startDate : null; } catch (x) { }
    try { endDate = e && e.detail && typeof e.detail.endDate === "string" ? e.detail.endDate : null; } catch (x) { }

    runExport(includeMods, startDate, endDate);
  });

})();
