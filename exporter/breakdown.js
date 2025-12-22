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
  let expandRow = async (row) => {
    let btn = getExpandButton(row);
    if (!btn) return null;

    try { row.scrollIntoView({ block: "center" }); } catch (e) { }

    let wasExpanded = norm(btn.getAttribute("aria-expanded")).toLowerCase() === "true";
    if (!wasExpanded) btn.click();

    return {
      btn: btn,
      controls: norm(btn.getAttribute("aria-controls")),
      wasExpanded: wasExpanded
    };
  };

  let readExpandedRowMods = async (row, expectedPoints, meta, ctx) => {
    let controls = ctx && ctx.controls ? ctx.controls : "";
    let btn = ctx && ctx.btn ? ctx.btn : getExpandButton(row);
    let wasExpanded = ctx && typeof ctx.wasExpanded === "boolean" ? ctx.wasExpanded : (norm(btn && btn.getAttribute("aria-expanded")).toLowerCase() === "true");

    let getPanelNow = () => {
      if (controls) return document.getElementById(controls) || null;
      return getExpandPanel(row);
    };

    let sumPoints = mods => {
      let s = 0;
      for (let i = 0; i < mods.length; i++) s += mods[i].points;
      return s;
    };

    let roundingBound = (modsCount) => Math.max(0.02, modsCount * 0.01 * 0.55);

    let best = { mods: [], sum: 0 };

    let tryParse = () => {
      let panel = getPanelNow();
      if (!panel) return null;

      let mods = parseModBreakdownFromPanel(panel);
      if (!mods || !mods.length) return null;

      let sum = sumPoints(mods);
      if (sum > best.sum) best = { mods, sum };

      if (!Number.isFinite(expectedPoints)) return mods;

      let tol = roundingBound(mods.length);
      if (Math.abs(sum - expectedPoints) <= tol) return mods;

      return null;
    };

    let mods = tryParse();
    if (!mods) {
      mods = await new Promise(resolve => {
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
          let v = tryParse();
          if (v) finish(v);
        });

        try { obs.observe(document.body, { childList: true, subtree: true, characterData: true }); } catch (e) { }

        to = setTimeout(() => finish(null), 6000);

        let v = tryParse();
        if (v) finish(v);
      });
    }

    mods = mods || best.mods;

    if (!mods || !mods.length) {
      let panel = getPanelNow();
      console.groupCollapsed("CF breakdown parse failed");
      console.log("meta:", meta || {});
      console.log("expectedPoints:", expectedPoints);
      console.log("controls:", controls);
      console.log("panelText:", panel ? norm(panel.textContent).slice(0, 5000) : "");
      console.groupEnd();
      if (btn && !wasExpanded) btn.click();
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
      let panel = getPanelNow();
      console.log("panelText:", panel ? norm(panel.textContent).slice(0, 5000) : "");
      console.groupEnd();
      if (residual > 0) mods = mods.concat([{ name: "(Rounding / Residual)", points: residual }]);
    } else if (Number.isFinite(expectedPoints) && residual > 0.000001) {
      mods = mods.concat([{ name: "(Rounding / Residual)", points: residual }]);
    }

    if (btn && !wasExpanded) btn.click();
    return mods;
  };

  window.CF_EXPORTER = window.CF_EXPORTER || {};
  window.CF_EXPORTER.breakdown = { expandRow, readExpandedRowMods };

})();
