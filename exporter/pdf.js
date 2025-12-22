(() => {
  if (!window.CF_EXPORTER) window.CF_EXPORTER = {};
  if (!window.CF_EXPORTER.pdf) window.CF_EXPORTER.pdf = {};

  let pdfEscape = s => String(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  let estimateTextWidth = (text, fontSize) => {
    let t = String(text);
    return t.length * fontSize * 0.52;
  };

  window.CF_EXPORTER.pdf.buildOfficialPdf = (args) => {
    let includeMods = !!args.includeMods;
    let years = args.years || [];
    let now = args.now || new Date();
    let pageCountParsed = args.pageCountParsed || 0;
    let rowsCounted = args.rowsCounted || 0;

    let totalsPoints = args.totalsPoints || {};
    let totalsUSD = args.totalsUSD || {};
    let totalsModPoints = args.totalsModPoints || {};
    let totalsModUSD = args.totalsModUSD || {};

    let monthNames = args.monthNames || [];
    let fmtUSD = args.fmtUSD;
    let fmtPoints = args.fmtPoints;

    let pageW = 612;
    let pageH = 792;

    let marginL = 54;
    let marginR = 54;
    let marginT = 54;
    let marginB = 54;

    let usableW = pageW - marginL - marginR;

    let colMonth = Math.floor(usableW * 0.40);
    let colPoints = Math.floor(usableW * 0.30);
    let colUSD = usableW - colMonth - colPoints;

    let x0 = marginL;
    let x1 = x0 + colMonth;
    let x2 = x1 + colPoints;
    let x3 = x0 + usableW;

    let rowH = 20;
    let headerH = 22;

    let objects = [];
    let addObj = s => { objects.push(s); return objects.length; };
    let computeModsCapacity = (yStart) => {
      let y = yStart;
      y -= 10;
      y -= 16;
      y -= 18;

      let top = y;
      let bottom = top - headerH;

      y = bottom;

      let minY = marginB + 56;
      let availableRows = Math.floor((y - minY) / rowH);
      if (!Number.isFinite(availableRows) || availableRows < 0) availableRows = 0;
      return availableRows;
    };

    let yearHasAnyZeroMonth = (yYear) => {
      for (let mi = 0; mi < 12; mi++) {
        let v = (totalsPoints[yYear] && totalsPoints[yYear][mi]) ? totalsPoints[yYear][mi] : 0;
        if (v === 0) return true;
      }
      return false;
    };

    let computeYearModsStartY = (yYear) => {
      let y = pageH - marginT - 54;
      y -= 18;

      let top = y;
      let bottom = top - headerH;

      y = bottom;

      let rowsLen = 13;
      let tableBottom = y - rowsLen * rowH;

      y = tableBottom - 18;

      if (yearHasAnyZeroMonth(yYear)) y -= 16;

      return y;
    };

    let modListsByYear = {};
    if (includeMods) {
      for (let i = 0; i < years.length; i++) {
        let y = years[i];
        let map = totalsModUSD[y] || {};
        let list = Object.keys(map).map(name => ({
          name: name,
          usd: map[name] || 0,
          points: (totalsModPoints[y] && totalsModPoints[y][name]) ? totalsModPoints[y][name] : 0
        }));
        list.sort((a, b) => (b.usd - a.usd) || (b.points - a.points) || a.name.localeCompare(b.name));
        modListsByYear[y] = list;
      }
    }

    let pageSpecs = [];
    pageSpecs.push({ kind: "cover" });

    for (let i = 0; i < years.length; i++) {
      let yYear = years[i];

      pageSpecs.push({ kind: "year", year: yYear, modStart: 0, modCount: 0 });

      if (!includeMods) continue;

      let list = modListsByYear[yYear] || [];
      if (!list.length) continue;

      let modsStartY = pageH - marginT - 54;
      let cap = computeModsCapacity(modsStartY);
      if (!Number.isFinite(cap) || cap < 1) cap = 1;

      let start = 0;
      let first = true;
      while (start < list.length) {
        let count = Math.min(cap, list.length - start);
        pageSpecs.push({ kind: "mods", year: yYear, modStart: start, modCount: count, first: first });
        start += count;
        first = false;
      }
    }


    let totalPages = pageSpecs.length;


    let grandUSD = 0;
    let grandPoints = 0;
    for (let i = 0; i < years.length; i++) {
      let y = years[i];
      let arrUSD = totalsUSD[y] || Array(12).fill(0);
      let arrPts = totalsPoints[y] || Array(12).fill(0);
      for (let j = 0; j < 12; j++) {
        grandUSD += arrUSD[j] || 0;
        grandPoints += arrPts[j] || 0;
      }
    }

    if (includeMods) {
      for (let i = 0; i < years.length; i++) {
        let y = years[i];
        let map = totalsModUSD[y] || {};
        let list = Object.keys(map).map(name => ({
          name: name,
          usd: map[name] || 0,
          points: (totalsModPoints[y] && totalsModPoints[y][name]) ? totalsModPoints[y][name] : 0
        }));
        list.sort((a, b) => (b.usd - a.usd) || (b.points - a.points) || a.name.localeCompare(b.name));
        modListsByYear[y] = list;
      }
    }

    let makePageStream = (spec, pageIndex) => {
      let parts = [];

      let setStroke = () => {
        parts.push("0.9 w");
        parts.push("0.12 0.12 0.12 RG");
        parts.push("0 0 0 rg");
      };

      let addText = (font, size, x, y, text) => {
        parts.push("BT");
        parts.push("/" + font + " " + size + " Tf");
        parts.push("1 0 0 1 " + x.toFixed(2) + " " + y.toFixed(2) + " Tm");
        parts.push("(" + pdfEscape(text) + ") Tj");
        parts.push("ET");
      };

      let addTextCentered = (font, size, y, text) => {
        let w = estimateTextWidth(text, size);
        let x = (pageW - w) / 2;
        if (x < marginL) x = marginL;
        addText(font, size, x, y, text);
      };

      let addTextRight = (font, size, xRight, y, text) => {
        let w = estimateTextWidth(text, size);
        addText(font, size, xRight - w, y, text);
      };

      let addLine = (xA, yA, xB, yB) => {
        parts.push(xA.toFixed(2) + " " + yA.toFixed(2) + " m");
        parts.push(xB.toFixed(2) + " " + yB.toFixed(2) + " l");
        parts.push("S");
      };

      let addRect = (x, y, w, h) => {
        parts.push(x.toFixed(2) + " " + y.toFixed(2) + " " + w.toFixed(2) + " " + h.toFixed(2) + " re");
        parts.push("S");
      };

      let drawFrame = () => {
        setStroke();
        addRect(marginL - 8, marginB - 18, pageW - 2 * (marginL - 8), pageH - (marginT - 18) - (marginB - 18));
      };

      let footerY = marginB - 34;
      let footer = "Page " + pageIndex + " of " + totalPages;
      let headerTextY = pageH - marginT + 2;
      let headerRuleY = headerTextY - 14;

      let drawFooter = () => {
        setStroke();
        addLine(marginL, footerY + 16, pageW - marginR, footerY + 16);
        addTextCentered("F1", 10, footerY, footer);
      };

      let drawHeader = (rightText) => {
        setStroke();
        addText("F2", 11, marginL, headerTextY, "CurseForge Author Rewards Report");
        if (rightText) addTextRight("F1", 10, pageW - marginR, headerTextY, rightText);
        addLine(marginL, headerRuleY, pageW - marginR, headerRuleY);
      };
      let drawModsOnlyPage = (spec) => {
        drawFrame();
        drawHeader("Tax Year " + spec.year);

        let y = pageH - marginT - 54;

        drawModsTableSlice(spec.year, y, spec.modStart || 0, spec.modCount || 0, !spec.first);


        drawFooter();
      };

      let drawCover = () => {
        drawFrame();
        drawHeader("Generated " + now.toLocaleString());

        let y = pageH - marginT - 50;

        addTextCentered("F2", 18, y, "CurseForge Points Generated");
        y -= 26;
        addTextCentered("F1", 13, y, "USD Equivalent Summary");
        y -= 36;

        let period = years.length ? (years[0] + " - " + years[years.length - 1]) : "No data detected";

        addText("F2", 12, marginL, y, "Report Period:");
        addText("F1", 12, marginL + 130, y, period);
        y -= 18;

        addText("F2", 12, marginL, y, "Transaction Type:");
        addText("F1", 12, marginL + 130, y, "Points generated (withdrawals excluded)");
        y -= 18;

        addText("F2", 12, marginL, y, "Conversion Rate:");
        addText("F1", 12, marginL + 130, y, "100 points = $5.00 (1 point = $0.05)");
        y -= 18;

        addText("F2", 12, marginL, y, "Pages Parsed:");
        addText("F1", 12, marginL + 130, y, String(pageCountParsed));
        y -= 18;

        addText("F2", 12, marginL, y, "Transactions Counted:");
        addText("F1", 12, marginL + 130, y, String(rowsCounted));
        y -= 26;

        addLine(marginL, y, pageW - marginR, y);
        y -= 26;

        addText("F2", 12, marginL, y, "Grand Total (USD):");
        addText("F1", 12, marginL + 160, y, fmtUSD(grandUSD));
        y -= 18;

        addText("F2", 12, marginL, y, "Grand Total (Points):");
        addText("F1", 12, marginL + 160, y, fmtPoints(grandPoints));
        y -= 30;

        addText("F1", 10, marginL, y, "Note: This report is a user-generated summary of on-screen transaction history.");
        y -= 14;
        addText("F1", 10, marginL, y, "Verify totals against the source portal and retain original records for your files.");

        drawFooter();
      };
      let drawModsTableSlice = (yYear, yStart, startIndex, takeCount, continued) => {
        if (!includeMods) return yStart;

        let list = modListsByYear[yYear] || [];
        if (!list.length) return yStart;

        let slice = list.slice(startIndex, startIndex + (takeCount || 0));
        if (!slice.length) return yStart;

        let y = yStart;

        y -= 10;
        addText("F2", 13, marginL, y, continued ? ("Earnings Per Mod (" + yYear + ", Continued)") : ("Earnings Per Mod (" + yYear + ")"));
        y -= 16;


        setStroke();

        let colMod = Math.floor(usableW * 0.55);
        let colPts = Math.floor(usableW * 0.20);
        let colUsd = usableW - colMod - colPts;

        let mx0 = marginL;
        let mx1 = mx0 + colMod;
        let mx2 = mx1 + colPts;
        let mx3 = mx0 + usableW;

        let top = y;
        let bottom = top - headerH;

        addRect(mx0, bottom, usableW, headerH);
        addLine(mx1, bottom, mx1, top);
        addLine(mx2, bottom, mx2, top);

        addText("F2", 11, mx0 + 8, top - 15, "Mod");
        addText("F2", 11, mx1 + 8, top - 15, "Points");
        addText("F2", 11, mx2 + 8, top - 15, "USD");

        y = bottom;

        let tableTop = y;
        let tableBottom = y - slice.length * rowH;

        addRect(mx0, tableBottom, usableW, slice.length * rowH);
        addLine(mx1, tableBottom, mx1, tableTop);
        addLine(mx2, tableBottom, mx2, tableTop);

        let maxModChars = Math.max(10, Math.floor((colMod - 16) / 6.1));

        for (let i = 0; i < slice.length; i++) {
          let r = slice[i];
          let rowTop = y - i * rowH;
          if (i > 0) addLine(mx0, rowTop, mx3, rowTop);

          let midY = rowTop - rowH + 6;

          let name = r.name;
          if (name.length > maxModChars) name = name.slice(0, maxModChars - 1) + "…";

          addText("F1", 11, mx0 + 8, midY, name);

          let ptsText = r.points !== 0 ? fmtPoints(r.points) : "-";
          let usdText = r.usd !== 0 ? fmtUSD(r.usd) : "-";

          addTextRight("F1", 11, mx2 - 8, midY, ptsText);
          addTextRight("F1", 11, mx3 - 8, midY, usdText);
        }

        y = tableBottom - 16;

        return y;
      };


      let drawYear = (spec) => {
        let yYear = spec.year;

        drawFrame();
        drawHeader("Tax Year " + yYear);

        let y = pageH - marginT - 54;
        addText("F2", 16, marginL, y, "Tax Year " + yYear);
        y -= 18;

        addText("F1", 10, marginL, y, "USD equivalent computed at $0.05 per point (100 points = $5.00).");
        y -= 24;

        setStroke();


        let top = y;
        let bottom = top - headerH;

        addRect(x0, bottom, usableW, headerH);
        addLine(x1, bottom, x1, top);
        addLine(x2, bottom, x2, top);

        addText("F2", 11, x0 + 8, top - 15, "Month");
        addText("F2", 11, x1 + 8, top - 15, "Points");
        addText("F2", 11, x2 + 8, top - 15, "USD");

        y = bottom;

        let rows = [];
        for (let mi = 0; mi < 12; mi++) {
          let pts = (totalsPoints[yYear] && totalsPoints[yYear][mi]) ? totalsPoints[yYear][mi] : 0;
          let usd = (totalsUSD[yYear] && totalsUSD[yYear][mi]) ? totalsUSD[yYear][mi] : 0;
          rows.push({ month: monthNames[mi] || ("Month " + (mi + 1)), pts: pts, usd: usd });
        }

        let yearPts = (totalsPoints[yYear] || Array(12).fill(0)).reduce((a, b) => a + b, 0);
        let yearUsd = (totalsUSD[yYear] || Array(12).fill(0)).reduce((a, b) => a + b, 0);
        rows.push({ month: "Year Total", pts: yearPts, usd: yearUsd, total: true });

        let tableTop = y;
        let tableBottom = y - rows.length * rowH;

        addRect(x0, tableBottom, usableW, rows.length * rowH);
        addLine(x1, tableBottom, x1, tableTop);
        addLine(x2, tableBottom, x2, tableTop);

        for (let i = 0; i < rows.length; i++) {
          let r = rows[i];
          let rowTop = y - i * rowH;
          if (i > 0) addLine(x0, rowTop, x3, rowTop);

          let midY = rowTop - rowH + 6;

          let font = r.total ? "F2" : "F1";
          addText(font, 11, x0 + 8, midY, r.month);

          let ptsText = r.total || r.pts !== 0 ? fmtPoints(r.pts) : "-";
          let usdText = r.total || r.usd !== 0 ? fmtUSD(r.usd) : "-";

          addTextRight(font, 11, x2 - 8, midY, ptsText);
          addTextRight(font, 11, x3 - 8, midY, usdText);
        }

        y = tableBottom - 18;

        let hasAnyZeroMonth = false;
        for (let mi = 0; mi < 12; mi++) {
          if (((totalsPoints[yYear] && totalsPoints[yYear][mi]) ? totalsPoints[yYear][mi] : 0) === 0) {
            hasAnyZeroMonth = true;
            break;
          }
        }

        if (hasAnyZeroMonth) {
          addText("F1", 10, marginL, y, "Included months shown even if zero to support year completeness.");
          y -= 16;
        }

        if (spec && spec.kind === "year" && spec.year === yYear) {
          y = drawModsTableSlice(yYear, y, spec.modStart || 0, spec.modCount || 0, false);

        }

        drawFooter();
      };

      if (spec.kind === "cover") drawCover();
      if (spec.kind === "year") drawYear(spec);
      if (spec.kind === "mods") drawModsOnlyPage(spec);

      return parts.join("\n") + "\n";
    };

    let streams = [];
    for (let i = 0; i < pageSpecs.length; i++) {
      streams.push(makePageStream(pageSpecs[i], i + 1));
    }

    let contentObjNums = [];
    for (let i = 0; i < streams.length; i++) {
      let stream = streams[i];
      let contentObj = addObj("<< /Length " + stream.length + " >>\nstream\n" + stream + "endstream\n");
      contentObjNums.push(contentObj);
    }

    let font1 = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>\n");
    let font2 = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>\n");

    let pagesObj = addObj("<< /Type /Pages /Kids [ ] /Count 0 >>\n");

    let pageObjNums = [];
    for (let i = 0; i < streams.length; i++) {
      let pageObj = addObj(
        "<< /Type /Page /Parent " + pagesObj + " 0 R /MediaBox [0 0 " + pageW + " " + pageH + "] " +
        "/Resources << /Font << /F1 " + font1 + " 0 R /F2 " + font2 + " 0 R >> >> " +
        "/Contents " + contentObjNums[i] + " 0 R >>\n"
      );
      pageObjNums.push(pageObj);
    }

    let kidsArr = pageObjNums.map(n => n + " 0 R").join(" ");
    objects[pagesObj - 1] = "<< /Type /Pages /Kids [ " + kidsArr + " ] /Count " + pageObjNums.length + " >>\n";

    let catalog = addObj("<< /Type /Catalog /Pages " + pagesObj + " 0 R >>\n");

    let header = "%PDF-1.3\n";
    let body = "";
    let offsets = [];
    offsets.push(0);

    let pos = header.length;
    for (let i = 0; i < objects.length; i++) {
      offsets.push(pos);
      let objNum = i + 1;
      let chunk = objNum + " 0 obj\n" + objects[i] + "endobj\n";
      body += chunk;
      pos += chunk.length;
    }

    let xrefPos = header.length + body.length;
    let xref = "xref\n0 " + (objects.length + 1) + "\n";
    xref += "0000000000 65535 f \n";
    for (let i = 1; i < offsets.length; i++) {
      let off = String(offsets[i]).padStart(10, "0");
      xref += off + " 00000 n \n";
    }

    let trailer =
      "trailer\n<< /Size " + (objects.length + 1) + " /Root " + catalog + " 0 R >>\n" +
      "startxref\n" + xrefPos + "\n%%EOF\n";

    let pdf = header + body + xref + trailer;
    return new TextEncoder().encode(pdf);
  };
})();
