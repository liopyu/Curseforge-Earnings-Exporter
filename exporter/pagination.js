(() => {
  let norm = (v) => window.CF_EXPORTER.utils.norm(v);

  let getPaginationRoot = () => {
    let nextBtn =
      document.querySelector('button[aria-label="Go to next page"]') ||
      document.querySelector('button[aria-label*="next page" i]');
    if (!nextBtn) return null;
    return nextBtn.closest("nav") || nextBtn.closest("ul") || nextBtn.parentElement;
  };

  let getPageNumberFromPagination = () => {
    let root = getPaginationRoot();
    if (!root) return null;

    let selected =
      root.querySelector('[aria-current="page"]') ||
      root.querySelector('button[aria-current="true"]') ||
      root.querySelector('button[aria-selected="true"]') ||
      root.querySelector('li.Mui-selected') ||
      root.querySelector('button.Mui-selected');
    if (!selected) return null;

    let t = norm(selected.innerText || selected.textContent);
    let n = parseInt(t, 10);
    if (!Number.isFinite(n)) return null;
    return n;
  };

  let getTbody = () => document.querySelector("table tbody");

  let tableSig = () => {
    let rows = Array.from(document.querySelectorAll("tr.MuiTableRow-root.RaDatagrid-row"));
    let s = rows.slice(0, 10).map(r => {
      let tds = Array.from(r.querySelectorAll("td"));
      let kind = norm(tds[1]?.innerText);
      let dateText = norm(r.querySelector("td.column-dateCreated span")?.innerText);
      let amtText = norm(tds[5]?.innerText);
      return kind + "|" + dateText + "|" + amtText;
    }).join("||");
    return s || "empty";
  };

  let waitForTableChange = async (beforeSig, timeoutMs) => {
    let tb = getTbody();
    return await new Promise(resolve => {
      let done = false;
      let obs = null;

      let finish = v => {
        if (done) return;
        done = true;
        try { if (obs) obs.disconnect(); } catch (e) { }
        clearTimeout(to);
        resolve(!!v);
      };

      if (tableSig() !== beforeSig) {
        finish(true);
        return;
      }

      if (tb) {
        obs = new MutationObserver(() => {
          if (tableSig() !== beforeSig) finish(true);
        });
        try { obs.observe(tb, { childList: true, subtree: true, characterData: true }); } catch (e) { }
      }

      let to = setTimeout(() => finish(tableSig() !== beforeSig), timeoutMs);
    });
  };

  let clickPageNumber = async (n) => {
    let root = getPaginationRoot();
    if (!root) return false;

    let btns = Array.from(root.querySelectorAll("button, a")).filter(el => {
      let t = norm(el.innerText || el.textContent);
      return t === String(n);
    });

    if (btns.length === 0) return false;

    let before = tableSig();
    btns[0].click();
    let changed = await waitForTableChange(before, 15000);
    return changed;
  };

  let getFirstPageBtn = () => {
    let root = getPaginationRoot();
    if (!root) return null;

    let direct =
      root.querySelector('button[aria-label="Go to first page"]') ||
      root.querySelector('button[aria-label*="first page" i]');
    if (direct) return direct;

    let btns = Array.from(root.querySelectorAll("button, a"));
    for (let el of btns) {
      let t = norm(el.innerText || el.textContent);
      if (t === "1") return el;
    }
    return null;
  };

  let getPrevBtn = () => (
    document.querySelector('button[aria-label="Go to previous page"]') ||
    document.querySelector('button[aria-label*="previous page" i]')
  );

  let prevDisabled = btn => {
    if (!btn) return true;
    if (btn.disabled) return true;
    let ariaDisabled = norm(btn.getAttribute("aria-disabled")).toLowerCase();
    if (ariaDisabled === "true") return true;
    let li = btn.closest("li");
    if (li && /\bMui-disabled\b/.test(li.className)) return true;
    return false;
  };

  let getNextBtn = () => (
    document.querySelector('button[aria-label="Go to next page"]') ||
    document.querySelector('button[aria-label*="next page" i]')
  );

  let nextDisabled = btn => {
    if (!btn) return true;
    if (btn.disabled) return true;
    let ariaDisabled = norm(btn.getAttribute("aria-disabled")).toLowerCase();
    if (ariaDisabled === "true") return true;
    let li = btn.closest("li");
    if (li && /\bMui-disabled\b/.test(li.className)) return true;
    return false;
  };

  let ensureOnPage1 = async () => {
    let setStatus = window.CF_EXPORTER.status.setStatus;
    let nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));

    setStatus("Checking current page…");
    await nextFrame();

    let cur = getPageNumberFromPagination();
    if (cur === 1) return true;

    let firstBtn = getFirstPageBtn();
    if (firstBtn) {
      setStatus("Navigating to page 1…");
      let before = tableSig();
      firstBtn.click();
      let ok = await waitForTableChange(before, 15000);
      await nextFrame();
      let afterCur = getPageNumberFromPagination();
      if (afterCur === 1) return true;
      if (ok) return true;
    }

    if (cur != null && cur > 1) {
      let ok = await clickPageNumber(1);
      if (ok) return true;
      await nextFrame();
      let afterCur = getPageNumberFromPagination();
      if (afterCur === 1) return true;
    }

    let prev = getPrevBtn();
    if (!prev) return true;

    let guard = 0;
    while (!prevDisabled(prev) && guard < 200) {
      if (window.CF_PDF_EXPORT_STOP) return false;
      let before = tableSig();
      prev.click();
      let changed = await waitForTableChange(before, 15000);
      if (!changed) break;
      await nextFrame();
      let nowCur = getPageNumberFromPagination();
      if (nowCur === 1) return true;
      prev = getPrevBtn();
      guard++;
    }

    return true;
  };

  window.CF_EXPORTER = window.CF_EXPORTER || {};
  window.CF_EXPORTER.pagination = {
    tableSig,
    waitForTableChange,
    ensureOnPage1,
    getNextBtn,
    nextDisabled
  };
})();
