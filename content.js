let UI_ID = "cf-pdf-export-wrap";
let BTN_ID = "cf-pdf-export-menu-btn";
let MENU_ID = "cf-pdf-export-menu";
let CHECK_ID = "cf-pdf-export-permod";
let EXPORT_ID = "cf-pdf-export-doexport";
let STOP_ID = "cf-pdf-export-dostop";

let __cfInjectFailUntil = 0;
function injectExporter() {
  if (window.__CF_EXPORTER_INJECTED) return;
  if (Date.now() < __cfInjectFailUntil) return;

  let rt = typeof chrome !== "undefined" && chrome && chrome.runtime;
  if (!rt || typeof rt.getURL !== "function") return;

  let url = rt.getURL("exporter.js");
  if (!url || typeof url !== "string") {
    __cfInjectFailUntil = Date.now() + 2000;
    return;
  }

  window.__CF_EXPORTER_INJECTED = true;

  let s = document.createElement("script");
  s.src = url;

  s.onload = () => {
    try { s.remove(); } catch (e) { }
  };

  s.onerror = () => {
    try { s.remove(); } catch (e) { }
    window.__CF_EXPORTER_INJECTED = false;
    __cfInjectFailUntil = Date.now() + 2000;
  };

  (document.head || document.documentElement).appendChild(s);
}


let setMenuOpen = (open) => {
  let menu = document.getElementById(MENU_ID);
  if (menu) {
    if (open) menu.setAttribute("data-open", "1");
    else menu.removeAttribute("data-open");
  }

  let btn = document.getElementById(BTN_ID);
  if (btn) {
    if (open) btn.setAttribute("data-open", "1");
    else btn.removeAttribute("data-open");
  }
};
let isMenuOpen = () => {
  let menu = document.getElementById(MENU_ID);
  return !!menu && menu.getAttribute("data-open") === "1";
};

let closeMenu = () => setMenuOpen(false);

let toggleMenu = () => {
  let menu = document.getElementById(MENU_ID);
  if (!menu) return;
  setMenuOpen(menu.getAttribute("data-open") !== "1");
};
let buildDropdownUi = () => {
  let wrap = document.createElement("div");
  wrap.id = UI_ID;

  let btn = document.createElement("button");
  btn.id = BTN_ID;
  btn.type = "button";

  let btnLabel = document.createElement("span");
  btnLabel.className = "cf-pdf-export-btn-text";
  btnLabel.textContent = "Export PDF";

  let btnArrow = document.createElement("span");
  btnArrow.className = "cf-pdf-export-arrow";
  btnArrow.setAttribute("aria-hidden", "true");

  btn.appendChild(btnLabel);
  btn.appendChild(btnArrow);

  btn.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleMenu();
  });

  let menu = document.createElement("div");
  menu.id = MENU_ID;

  let opt = document.createElement("div");
  opt.className = "cf-pdf-export-opt";
  opt.setAttribute("role", "checkbox");
  opt.setAttribute("tabindex", "0");

  let check = document.createElement("input");
  check.type = "checkbox";
  check.id = CHECK_ID;
  check.checked = false;

  let optText = document.createElement("span");
  optText.textContent = "Include per-mod breakdown (This usually takes longer)";

  let syncOpt = () => {
    opt.setAttribute("aria-checked", check.checked ? "true" : "false");
  };

  let toggleCheck = () => {
    check.checked = !check.checked;
    syncOpt();
  };

  check.addEventListener("click", (e) => {
    e.stopPropagation();
    syncOpt();
  });

  opt.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    if (e.target === check) return;
    e.preventDefault();
    toggleCheck();
  });

  opt.addEventListener("keydown", (e) => {
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    e.stopPropagation();
    toggleCheck();
  });

  opt.appendChild(check);
  opt.appendChild(optText);
  syncOpt();

  let rangeWrap = document.createElement("div");
  rangeWrap.className = "cf-pdf-export-range";

  let rangeTitle = document.createElement("div");
  rangeTitle.className = "cf-pdf-export-range-title";
  rangeTitle.textContent = "Date Range";


  let row1 = document.createElement("div");
  row1.className = "cf-pdf-export-range-row";

  let startLabel = document.createElement("div");
  startLabel.className = "cf-pdf-export-range-label";
  startLabel.textContent = "Start";

  let startCol = document.createElement("div");
  startCol.className = "cf-pdf-export-range-col";

  let startBox = document.createElement("div");
  startBox.className = "cf-pdf-export-range-inputbox";

  let startInput = document.createElement("input");
  startInput.type = "date";
  startInput.id = "cf-pdf-export-startdate";

  let startErr = document.createElement("div");
  startErr.className = "cf-pdf-export-range-error";
  startErr.textContent = "";

  let startBtn = document.createElement("button");
  startBtn.type = "button";
  startBtn.className = "cf-pdf-export-calbtn";
  startBtn.setAttribute("aria-label", "Pick start date");
  startBtn.textContent = "📅";
  startBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (startInput.showPicker) startInput.showPicker();
    else startInput.focus();
  });

  startBox.appendChild(startInput);
  startBox.appendChild(startBtn);
  startCol.appendChild(startBox);
  startCol.appendChild(startErr);

  row1.appendChild(startLabel);
  row1.appendChild(startCol);

  let row2 = document.createElement("div");
  row2.className = "cf-pdf-export-range-row";

  let endLabel = document.createElement("div");
  endLabel.className = "cf-pdf-export-range-label";
  endLabel.textContent = "End";

  let endCol = document.createElement("div");
  endCol.className = "cf-pdf-export-range-col";

  let endBox = document.createElement("div");
  endBox.className = "cf-pdf-export-range-inputbox";

  let endInput = document.createElement("input");
  endInput.type = "date";
  endInput.id = "cf-pdf-export-enddate";

  let endErr = document.createElement("div");
  endErr.className = "cf-pdf-export-range-error";
  endErr.textContent = "";

  let endBtn = document.createElement("button");
  endBtn.type = "button";
  endBtn.className = "cf-pdf-export-calbtn";
  endBtn.setAttribute("aria-label", "Pick end date");
  endBtn.textContent = "📅";
  endBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (endInput.showPicker) endInput.showPicker();
    else endInput.focus();
  });

  endBox.appendChild(endInput);
  endBox.appendChild(endBtn);
  endCol.appendChild(endBox);
  endCol.appendChild(endErr);

  row2.appendChild(endLabel);
  row2.appendChild(endCol);

  rangeWrap.appendChild(rangeTitle);
  rangeWrap.appendChild(row1);
  rangeWrap.appendChild(row2);

  let sep = document.createElement("div");
  sep.className = "cf-pdf-export-sep";

  let exportBtn = document.createElement("button");
  exportBtn.id = EXPORT_ID;
  exportBtn.type = "button";
  exportBtn.textContent = "Export PDF";

  let stopBtn = document.createElement("button");
  stopBtn.id = STOP_ID;
  stopBtn.type = "button";
  stopBtn.textContent = "Stop";

  let minYmd = null;
  let maxYmd = null;

  let setInvalid = (el, msg) => {
    el.textContent = msg || "";
    if (msg) el.setAttribute("data-show", "1");
    else el.removeAttribute("data-show");
  };

  let ymdToMs = ymd => {
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

  let setBounds = (min, max) => {
    minYmd = min;
    maxYmd = max;
    startInput.min = min || "";
    startInput.max = max || "";
    endInput.min = min || "";
    endInput.max = max || "";
  };

  let exportEnabled = () => {
    let a = String(startInput.value || "").trim();
    let b = String(endInput.value || "").trim();
    if (!a || !b) return false;
    if (!minYmd || !maxYmd) return false;

    let am = ymdToMs(a);
    let bm = ymdToMs(b);
    let minm = ymdToMs(minYmd);
    let maxm = ymdToMs(maxYmd);
    if (am == null || bm == null || minm == null || maxm == null) return false;

    if (am < minm || am > maxm) return false;
    if (bm < minm || bm > maxm) return false;
    if (am > bm) return false;

    return true;
  };

  let updateExportDisabled = () => {
    if (exportEnabled()) exportBtn.removeAttribute("disabled");
    else exportBtn.setAttribute("disabled", "true");
  };

  let validate = () => {
    setInvalid(startErr, "");
    setInvalid(endErr, "");

    if (!minYmd || !maxYmd) {
      setInvalid(startErr, "Loading available range…");
      setInvalid(endErr, "Loading available range…");
      updateExportDisabled();
      return;
    }

    let s = String(startInput.value || "").trim();
    let e = String(endInput.value || "").trim();

    if (!s) setInvalid(startErr, "Required.");
    if (!e) setInvalid(endErr, "Required.");

    let sm = ymdToMs(s);
    let em = ymdToMs(e);
    let minm = ymdToMs(minYmd);
    let maxm = ymdToMs(maxYmd);

    if (s && sm == null) setInvalid(startErr, "Invalid date.");
    if (e && em == null) setInvalid(endErr, "Invalid date.");

    if (s && sm != null && (sm < minm || sm > maxm)) setInvalid(startErr, "Must be between " + minYmd + " and " + maxYmd + ".");
    if (e && em != null && (em < minm || em > maxm)) setInvalid(endErr, "Must be between " + minYmd + " and " + maxYmd + ".");

    if (s && e && sm != null && em != null && sm > em) {
      setInvalid(endErr, "End date must be on or after start date.");
    }

    updateExportDisabled();
  };

  startInput.addEventListener("input", (e) => { e.stopPropagation(); validate(); });
  startInput.addEventListener("change", (e) => { e.stopPropagation(); validate(); });
  endInput.addEventListener("input", (e) => { e.stopPropagation(); validate(); });
  endInput.addEventListener("change", (e) => { e.stopPropagation(); validate(); });

  exportBtn.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    e.preventDefault();

    validate();
    if (exportBtn.hasAttribute("disabled")) return;

    let includeMods = !!document.getElementById(CHECK_ID)?.checked;
    let startDate = String(startInput.value || "").trim() || null;
    let endDate = String(endInput.value || "").trim() || null;

    window.dispatchEvent(new CustomEvent("CF_PDF_EXPORT_START", {
      detail: { includeMods: includeMods, startDate: startDate, endDate: endDate }
    }));

    closeMenu();
  });

  stopBtn.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("CF_PDF_EXPORT_STOP"));
    closeMenu();
  });

  let rangeKey = "cf_pdf_export_range_v2";

  let tryLoadCachedRange = () => {
    try {
      let raw = localStorage.getItem(rangeKey);
      if (!raw) return false;
      let obj = JSON.parse(raw);
      if (obj && typeof obj.min === "string") {
        let today = (() => {
          let d = new Date();
          let y = d.getFullYear();
          let m = String(d.getMonth() + 1).padStart(2, "0");
          let dd = String(d.getDate()).padStart(2, "0");
          return y + "-" + m + "-" + dd;
        })();

        let min = obj.min;
        let max = today;

        setBounds(min, max);
        if (!startInput.value) startInput.value = min;
        if (!endInput.value) endInput.value = max;
        validate();
        return true;
      }

    } catch (e) {
    }
    return false;
  };

  let cacheRange = (min, max) => {
    try { localStorage.setItem(rangeKey, JSON.stringify({ min: min, max: max })); } catch (e) { }
  };

  let probed = false;

  let requestProbe = () => {
    if (probed) return;
    probed = true;

    window.addEventListener("CF_PDF_EXPORT_PROBE_RANGE_RESULT", (ev) => {
      try {
        let d = ev && ev.detail ? ev.detail : null;
        if (!d || typeof d.min !== "string" || typeof d.max !== "string") return;

        setBounds(d.min, d.max);

        if (!startInput.value) startInput.value = d.min;
        if (!endInput.value) endInput.value = d.max;

        cacheRange(d.min, d.max);
        validate();
      } catch (e) {
      }
    }, { once: true });

    window.dispatchEvent(new CustomEvent("CF_PDF_EXPORT_PROBE_RANGE"));
    validate();
  };

  menu.appendChild(opt);
  menu.appendChild(sep);
  menu.appendChild(rangeWrap);
  menu.appendChild(sep.cloneNode(true));
  menu.appendChild(exportBtn);
  menu.appendChild(stopBtn);

  wrap.appendChild(btn);
  wrap.appendChild(menu);

  if (!window.__CF_EXPORT_MENU_DOC_CLICK) {
    window.__CF_EXPORT_MENU_DOC_CLICK = true;
    document.addEventListener("pointerdown", () => closeMenu());
  }

  wrap.addEventListener("pointerdown", (e) => e.stopPropagation());

  setMenuOpen(false);

  tryLoadCachedRange();
  requestProbe();
  validate();

  return wrap;
};


let HELP_TEXT = "You can view your transactions and see all of your previous orders of either Amazon Gift Cards, PayPal or Payoneer orders here.";

let isTransactions = () => typeof location.hash === "string" && location.hash.includes("/transactions");

let removeUi = () => {
  let existing = document.getElementById(UI_ID);
  if (existing) existing.remove();
};

let findHelpAnchor = () => {
  let span = Array.from(document.querySelectorAll("span.MuiTypography-root")).find(s => (s.textContent || "").trim() === HELP_TEXT);
  if (!span) return null;

  let container = span.closest("div.css-ukc0mo") || span.parentElement;
  if (!container) return null;

  return { span: span, container: container };
};

let findFallbackParent = () => {
  let dropdown = document.querySelector('div[role="combobox"][aria-labelledby="type-label type"]');
  if (!dropdown) return null;
  let fc = dropdown.closest(".MuiFormControl-root");
  if (fc && fc.parentElement) return fc.parentElement;
  return dropdown.parentElement;
};

let placeUiAfterNode = (wrap, node) => {
  if (!wrap || !node) return false;

  try {
    node.insertAdjacentElement("afterend", wrap);
    return true;
  } catch (e) {
  }

  let parent = node.parentElement;
  if (!parent) return false;

  let next = node.nextSibling;
  if (next && next.parentNode === parent) {
    try {
      parent.insertBefore(wrap, next);
      return true;
    } catch (e) {
      try {
        parent.appendChild(wrap);
        return true;
      } catch (e2) {
        return false;
      }
    }
  }

  try {
    parent.appendChild(wrap);
    return true;
  } catch (e) {
    return false;
  }
};
let ensureUi = () => {
  if (!isTransactions()) {
    removeUi();
    return;
  }

  if (isMenuOpen()) return;

  injectExporter();

  let existing = document.getElementById(UI_ID);
  let wrap = existing || buildDropdownUi();

  let anchor = findHelpAnchor();
  if (anchor && anchor.container) {
    placeUiAfterNode(wrap, anchor.container);
    return;
  }

  let fallbackParent = findFallbackParent();
  if (!fallbackParent) return;

  try {
    fallbackParent.appendChild(wrap);
  } catch (e) {
  }
};

let schedule = (() => {
  let queued = false;
  return () => {
    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      ensureUi();
    }, 150);
  };
})();

schedule();

window.addEventListener("hashchange", () => schedule());

let obs = new MutationObserver(() => {
  if (!isTransactions()) return;
  schedule();
});

obs.observe(document.documentElement, { childList: true, subtree: true });
