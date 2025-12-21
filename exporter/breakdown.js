(() => {
  let norm = (v) => window.CF_EXPORTER.utils.norm(v);

  let getExpandButton = (row) => {
    if (!row) return null;

    let el =
      row.querySelector('button[aria-controls$="-expand"]') ||
      row.querySelector('button[aria-controls*="-expand"]') ||
      row.querySelector('[aria-controls$="-expand"]') ||
      row.querySelector('[aria-controls*="-expand"]');

    return el || null;
  };

  let getExpandPanel = (row) => {
    let btn = getExpandButton(row);
    if (!btn) return null;
    let id = btn.getAttribute("aria-controls");
    if (!id) return null;
    return document.getElementById(id);
  };

  let parseModBreakdownFromPanel = (panel) => {
    if (!panel) return [];

    let root = panel.querySelector("div.css-1jfg054") || panel;
    let kids = root.children;
    if (!kids || kids.length < 3) return [];

    let merged = {};

    for (let i = 0; i + 2 < kids.length; i += 3) {
      let s0 = kids[i];
      let s1 = kids[i + 1];
      let box = kids[i + 2];

      if (!s0 || !s1 || !box) break;
      if (s0.tagName !== "SPAN") continue;
      if (s1.tagName !== "SPAN") continue;
      if (norm(s1.textContent).toLowerCase() !== "points for") continue;

      let pts = parseFloat(norm(s0.textContent).replace(/,/g, ""));
      if (!Number.isFinite(pts)) continue;

      let link = box.querySelector('a[aria-label], a[href], a');
      if (!link) continue;

      let name = norm(link.getAttribute("aria-label") || link.textContent);
      if (!name) continue;

      merged[name] = (merged[name] || 0) + pts;
    }

    return Object.keys(merged).map(name => ({ name, points: merged[name] }));
  };

  let expandRowAndParseMods = async (row, expectedPoints, meta) => {
    let btn = getExpandButton(row);
    if (!btn) return [];

    try { row.scrollIntoView({ block: "center" }); } catch (e) { }

    let wasExpanded = norm(btn.getAttribute("aria-expanded")).toLowerCase() === "true";
    if (!wasExpanded) btn.click();

    let controls = btn.getAttribute("aria-controls") || "";

    let getPanelNow = () => {
      if (controls) return document.getElementById(controls);
      return getExpandPanel(row);
    };

    let panel = getPanelNow();
    if (!panel) {
      panel = await new Promise(resolve => {
        let done = false;
        let obs = null;
        let to = null;

        let finish = v => {
          if (done) return;
          done = true;
          try { if (obs) obs.disconnect(); } catch (e) { }
          clearTimeout(to);
          resolve(v || null);
        };

        obs = new MutationObserver(() => {
          let p = getPanelNow();
          if (p) finish(p);
        });

        try { obs.observe(document.body, { childList: true, subtree: true }); } catch (e) { }

        to = setTimeout(() => finish(null), 2500);

        let p = getPanelNow();
        if (p) finish(p);
      });
    }

    if (!panel) {
      if (!wasExpanded) btn.click();
      return [];
    }

    let sumPoints = mods => {
      let s = 0;
      for (let i = 0; i < mods.length; i++) s += mods[i].points;
      return s;
    };

    let roundingBound = (modsCount) => Math.max(0.02, modsCount * 0.01 * 0.55);

    let best = { mods: [], sum: 0 };

    let parseAndScore = () => {
      let mods = parseModBreakdownFromPanel(panel);
      if (!mods || !mods.length) return null;

      let sum = sumPoints(mods);
      if (sum > best.sum) best = { mods, sum };

      let tol = roundingBound(mods.length);
      if (Number.isFinite(expectedPoints) && Math.abs(sum - expectedPoints) <= tol) return mods;

      return null;
    };

    let immediate = parseAndScore();
    if (!immediate) {
      immediate = await new Promise(resolve => {
        let done = false;
        let obs = null;
        let to = null;

        let finish = v => {
          if (done) return;
          done = true;
          try { if (obs) obs.disconnect(); } catch (e) { }
          clearTimeout(to);
          resolve(v || null);
        };

        obs = new MutationObserver(() => {
          let v = parseAndScore();
          if (v) finish(v);
        });

        try { obs.observe(panel, { childList: true, subtree: true, characterData: true }); } catch (e) { }

        to = setTimeout(() => finish(null), 2500);

        let v = parseAndScore();
        if (v) finish(v);
      });
    }

    let mods = immediate || best.mods;

    if (!mods || !mods.length) {
      console.groupCollapsed("CF breakdown parse failed");
      console.log("meta:", meta || {});
      console.log("expectedPoints:", expectedPoints);
      console.log("controls:", controls);
      console.log("panelText:", norm(panel.textContent).slice(0, 5000));
      console.groupEnd();
      if (!wasExpanded) btn.click();
      return [];
    }

    let sum = sumPoints(mods);
    let residual = Number.isFinite(expectedPoints) ? (expectedPoints - sum) : 0;
    let tol = roundingBound(mods.length);

    if (Number.isFinite(expectedPoints) && Math.abs(residual) > tol) {
      console.groupCollapsed("CF breakdown mismatch");
      console.log("meta:", meta || {});
      console.log("expectedPoints:", expectedPoints);
      console.log("sumMods:", sum);
      console.log("residual:", residual);
      console.log("tol:", tol);
      console.log("mods:", mods);
      console.log("controls:", controls);
      console.log("panelText:", norm(panel.textContent).slice(0, 5000));
      console.groupEnd();
      if (residual > 0) mods = mods.concat([{ name: "(Rounding / Residual)", points: residual }]);
    } else if (Number.isFinite(expectedPoints) && residual > 0.000001) {
      mods = mods.concat([{ name: "(Rounding / Residual)", points: residual }]);
    }

    if (!wasExpanded) btn.click();
    return mods;
  };

  window.CF_EXPORTER = window.CF_EXPORTER || {};
  window.CF_EXPORTER.breakdown = { expandRowAndParseMods };
})();
