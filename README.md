# CurseForge Earnings Exporter

**CurseForge Earnings Exporter** is a Google Chrome extension that allows CurseForge creators to export their **Author Rewards / Points Generated** history into a **clean, structured PDF report** with optional per-mod breakdowns and custom date ranges.

The extension works directly on the CurseForge website by reading the visible transaction table, handling pagination, expanding breakdown panels, and generating a locally downloadable PDF — no external servers, no data upload.

---

## Features

* Export **Points Generated** earnings directly from CurseForge
* Custom **date range selection**
* Optional **per-mod earnings breakdown**
* Automatic pagination handling (reads all pages in range)
* Smart date-range skipping for fast exports
* Accurate rounding handling
* Generates a **professionally formatted PDF**
* Fully client-side (no network requests)
* Cancel export at any time
* Resets the page back to **Page 1** after export completes


---

## Usage

1. Open your **CurseForge → Author Rewards / Earnings** page
2. Click the **Export** menu button
3. Choose:
   * Date range
   * Whether to include per-mod breakdowns

2. Click the **Export** menu button

<img src="https://i.ibb.co/hFGgcjtD/buttonarrow.png" alt="buttonarrow" border="0">

3. Configure your export options:

   * Date range
   * Whether to include per-mod breakdowns

<img src="https://i.ibb.co/fzRL5b3y/exportmenu.png" alt="exportmenu" border="0">

4. Click **Export PDF**
5. Wait while pages are scanned
6. The PDF downloads automatically
7. Page navigation resets back to Page 1

You may click **Stop** at any time to cancel an in-progress export.

> **Note:** For the fastest parsing performance, it is strongly recommended to set **Transactions per page** to the maximum value before exporting.

<img src="https://i.ibb.co/7B2CmSB/image.png" alt="transactions per page" border="0">

---

## Output Preview

### Overview Page

The PDF begins with an overview page including the report period, conversion rate, pages parsed, transactions counted, and grand totals.

<img src="https://i.ibb.co/ymq5Q2P8/overviewpage.png" alt="overviewpage" border="0">

### Monthly Earnings Summary (per year)

Each tax year includes a month-by-month summary with points, USD equivalent, and yearly totals.

<img src="https://i.ibb.co/3Y1Q4CPf/monthlyearningssummary.png" alt="monthlyearningssummary" border="0">

### Optional: Earnings Per Mod

If enabled, the report also includes:

* Points per mod
* USD equivalent per mod
* Sorted by highest earnings
* Automatically paginated across pages if needed

<img src="https://i.ibb.co/SXgCjW8q/modearning.png" alt="modearning" border="0">


---

## Performance Notes

* Breakdown panels are read asynchronously
* Panel content is waited on via DOM observation (no fixed delays)
* Safe for slow networks and large datasets
* Duplicate rows are automatically deduplicated

---

## Privacy & Security

* No data is sent anywhere
* No tracking
* No analytics
* No external requests
* Everything runs locally in your browser

---

## Compatibility

* Google Chrome (latest)
* Chromium-based browsers (Edge, Brave, etc.)
* Requires CurseForge’s standard Author Rewards UI

---

## Known Limitations

* Only supports **Points Generated** transactions
* Withdrawals are intentionally excluded
* PDF styling is fixed (Times-based PDF fonts)
* Relies on CurseForge DOM structure (may need updates if site changes)

---

## Development Notes

The extension is modular and split into focused components:

* `index.js` — main export orchestration
* `pagination.js` — page navigation & detection
* `parse.js` — transaction row parsing
* `breakdown.js` — per-mod breakdown extraction
* `pdf.js` — PDF layout and rendering
* `status.js` — progress UI
* `utils.js` — helpers
* `content.js` — UI injection and control
* `style.css` — UI styling

---

## Disclaimer

This project is **not affiliated with CurseForge or Overwolf**.
All data is derived from the user’s own visible account information.
