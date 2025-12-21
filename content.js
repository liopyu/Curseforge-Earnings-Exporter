let UI_ID = "cf-pdf-export-wrap";
let BTN_ID = "cf-pdf-export-menu-btn";
let MENU_ID = "cf-pdf-export-menu";
let CHECK_ID = "cf-pdf-export-permod";
let EXPORT_ID = "cf-pdf-export-doexport";
let STOP_ID = "cf-pdf-export-dostop";

let setMenuOpen = (open) => {
  let menu = document.getElementById(MENU_ID);
  if (!menu) return;
  if (open) menu.setAttribute("data-open", "1");
  else menu.removeAttribute("data-open");

  let btn = document.getElementById(BTN_ID);
  if (!btn) return;
  if (open) btn.setAttribute("data-open", "1");
  else btn.removeAttribute("data-open");
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

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  let menu = document.createElement("div");
  menu.id = MENU_ID;

  let opt = document.createElement("label");
  opt.className = "cf-pdf-export-opt";

  let check = document.createElement("input");
  check.type = "checkbox";
  check.id = CHECK_ID;
  check.checked = true;

  let optText = document.createElement("span");
  optText.textContent = "Include per-mod breakdown (may take longer)";

  opt.appendChild(check);
  opt.appendChild(optText);

  let sep = document.createElement("div");
  sep.className = "cf-pdf-export-sep";

  let exportBtn = document.createElement("button");
  exportBtn.id = EXPORT_ID;
  exportBtn.type = "button";
  exportBtn.textContent = "Export PDF";
  exportBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    let includeMods = !!document.getElementById(CHECK_ID)?.checked;
    window.dispatchEvent(new CustomEvent("CF_PDF_EXPORT_START", { detail: { includeMods } }));
    closeMenu();
  });

  let stopBtn = document.createElement("button");
  stopBtn.id = STOP_ID;
  stopBtn.type = "button";
  stopBtn.textContent = "Stop";
  stopBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent("CF_PDF_EXPORT_STOP"));
    closeMenu();
  });

  menu.appendChild(opt);
  menu.appendChild(sep);
  menu.appendChild(exportBtn);
  menu.appendChild(stopBtn);

  wrap.appendChild(btn);
  wrap.appendChild(menu);

  if (!window.__CF_EXPORT_MENU_DOC_CLICK) {
    window.__CF_EXPORT_MENU_DOC_CLICK = true;
    document.addEventListener("click", () => closeMenu());
  }

  wrap.addEventListener("click", (e) => e.stopPropagation());

  setMenuOpen(false);

  return wrap;
};

let HELP_TEXT = "You can view your transactions and see all of your previous orders of either Amazon Gift Cards, PayPal or Payoneer orders here.";

let isTransactions = () => typeof location.hash === "string" && location.hash.includes("/transactions");

let removeUi = () => {
  let existing = document.getElementById(UI_ID);
  if (existing) existing.remove();
};

let findHelpAnchor = () => {
  let span = Array.from(document.querySelectorAll("span.MuiTypography-root")).find(
    (s) => (s.textContent || "").trim() === HELP_TEXT
  );
  if (!span) return null;

  let container = span.closest("div.css-ukc0mo") || span.parentElement;
  if (!container) return null;

  return { span, container };
};

let findFallbackParent = () => {
  let dropdown = document.querySelector('div[role="combobox"][aria-labelledby="type-label type"]');
  if (!dropdown) return null;
  let fc = dropdown.closest(".MuiFormControl-root");
  if (fc && fc.parentElement) return fc.parentElement;
  return dropdown.parentElement;
};

let ensureUi = () => {
  if (!isTransactions()) {
    removeUi();
    return;
  }

  if (document.getElementById(UI_ID)) return;

  let anchor = findHelpAnchor();
  let wrap = buildDropdownUi();

  if (anchor && anchor.container && anchor.container.parentElement) {
    let parent = anchor.container.parentElement;
    let next = anchor.container.nextSibling;
    if (next) parent.insertBefore(wrap, next);
    else parent.appendChild(wrap);
    return;
  }

  let fallbackParent = findFallbackParent();
  if (!fallbackParent) return;
  fallbackParent.appendChild(wrap);
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
