// ===== EPL ACTIVITY SYNC =====
// Fetches activity.json from the repo and patches all Activity tab tables/cards
// to match the latest uploaded Client Activity Report + Received Payments data.

(function() {
  'use strict';

  var activityData = null;
  var paymentsData = null;

  function fmtMoney(n) {
    if (n === null || n === undefined || n === 0) return '$0';
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  function fmtMoneyOrDash(n) {
    if (!n) return '—';
    return fmtMoney(n);
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    // Parse "M/D/YYYY" or ISO
    var d;
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(iso)) {
      var p = iso.split('/');
      d = new Date(parseInt(p[2]), parseInt(p[0]) - 1, parseInt(p[1]));
    } else {
      d = new Date(iso + 'T00:00:00');
    }
    if (isNaN(d)) return iso;
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  // Detect which rep is currently active
  function detectActiveRep() {
    // Check URL param first
    var params = new URLSearchParams(window.location.search);
    var urlRep = params.get('rep');
    if (urlRep === 'karin' || urlRep === 'megan') return urlRep;
    // Check heading text
    var h = document.querySelector('h1, h2, h3, h4');
    var bodyText = document.body.innerText;
    if (bodyText.indexOf('Karin Williamson') > -1 && bodyText.indexOf('Megan Smith') === -1) return 'karin';
    if (bodyText.indexOf('Megan Smith') > -1 && bodyText.indexOf('Karin Williamson') === -1) return 'megan';
    // Check tab button
    var karinBtn = Array.from(document.querySelectorAll('button')).find(function(b){return b.textContent.trim() === 'Karin';});
    if (karinBtn && getComputedStyle(karinBtn).backgroundColor.match(/rgb\((\d+),\s*(\d+)/)) {
      var m = getComputedStyle(karinBtn).backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/);
      if (m && parseInt(m[1]) < 100 && parseInt(m[2]) > 80) return 'karin';
    }
    return 'karin'; // default
  }

  // ===== Helpers for updating table rows =====
  function clearCellContent(cell) {
    // Keep any sub-text span (like "no change") but clear the main value
    // For simplicity: clear all and let caller set new
    cell.innerHTML = '';
  }

  function setCellText(cell, text) {
    cell.textContent = text;
  }

  // Find a table by checking its header text
  function findTableByHeaders(requiredHeaders) {
    var tables = document.querySelectorAll('table');
    for (var i = 0; i < tables.length; i++) {
      var head = tables[i].querySelector('thead');
      if (!head) continue;
      var ht = head.textContent.toUpperCase();
      var allMatch = requiredHeaders.every(function(h) { return ht.indexOf(h.toUpperCase()) > -1; });
      if (allMatch) return tables[i];
    }
    return null;
  }

  // Find a section by its label (MY TOP 5 ACCOUNTS, etc.) and return the first following table
  function findSectionTable(label) {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      if (node.textContent.trim().toUpperCase() === label.toUpperCase()) {
        // Find the next table after this label
        var el = node.parentElement;
        for (var i = 0; i < 8 && el; i++) {
          var nextTable = el.nextElementSibling;
          while (nextTable) {
            var t = nextTable.querySelector ? (nextTable.tagName === 'TABLE' ? nextTable : nextTable.querySelector('table')) : null;
            if (t) return t;
            nextTable = nextTable.nextElementSibling;
          }
          // Look in siblings of parent
          if (el.parentElement) {
            var peers = el.parentElement.querySelectorAll('table');
            for (var j = 0; j < peers.length; j++) {
              // Make sure this table comes after the label
              if (peers[j].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING) {
                return peers[j];
              }
            }
          }
          el = el.parentElement;
        }
      }
    }
    return null;
  }

  // Replace the tbody contents of a table with new rows
  function rebuildTableBody(table, rows) {
    if (!table) return;
    var tbody = table.querySelector('tbody');
    if (!tbody) return;

    // Preserve styling classes from the first existing row
    var sampleRow = tbody.querySelector('tr');
    var rowClass = sampleRow ? sampleRow.className : '';
    var sampleCells = sampleRow ? sampleRow.querySelectorAll('td') : null;
    var cellClasses = sampleCells ? Array.from(sampleCells).map(function(c){return c.className;}) : [];
    var cellStyles = sampleCells ? Array.from(sampleCells).map(function(c){return c.getAttribute('style') || '';}) : [];

    tbody.innerHTML = '';
    rows.forEach(function(rowData) {
      var tr = document.createElement('tr');
      if (rowClass) tr.className = rowClass;
      rowData.forEach(function(cellData, idx) {
        var td = document.createElement('td');
        if (cellClasses[idx]) td.className = cellClasses[idx];
        if (cellStyles[idx]) td.setAttribute('style', cellStyles[idx]);
        if (typeof cellData === 'string' || typeof cellData === 'number') {
          td.textContent = String(cellData);
        } else if (cellData && cellData.html) {
          td.innerHTML = cellData.html;
          if (cellData.style) {
            for (var k in cellData.style) td.style[k] = cellData.style[k];
          }
        } else {
          td.textContent = '';
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  // ===== Patch Top 5 Accounts =====
  function patchTopAccounts(repKey) {
    var rep = activityData.repDetails[repKey];
    if (!rep) return;
    var table = findSectionTable('MY TOP 5 ACCOUNTS');
    if (!table) return;

    var rows = rep.topAccounts.map(function(c) {
      return [
        c.clinic,
        c.state,
        c.totalOrders,
        c.totalVials,
        fmtMoney(c.totalSpent),
        {
          html: fmtMoneyOrDash(c.outstanding),
          style: c.outstanding > 0 ? { color: '#d97706', fontWeight: '600' } : {}
        },
        fmtDate(c.lastOrder)
      ];
    });
    rebuildTableBody(table, rows);
  }

  // ===== Patch New Clients This Month =====
  function patchNewClients(repKey) {
    var rep = activityData.repDetails[repKey];
    if (!rep) return;
    var table = findSectionTable('NEW CLIENTS THIS MONTH');
    if (!table) return;

    var rows = rep.newClients.map(function(c) {
      return [
        c.clinic,
        c.state,
        fmtDate(c.firstOrder),
        c.totalOrders,
        c.totalVials,
        fmtMoney(c.totalSpent),
        {
          html: c.status,
          style: c.status === 'Active' ? {
            backgroundColor: '#d1fae5',
            color: '#065f46',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: '600',
            display: 'inline-block'
          } : {}
        }
      ];
    });
    rebuildTableBody(table, rows);
  }

  // ===== Patch Outstanding AR =====
  function patchOutstandingAR(repKey) {
    var rep = activityData.repDetails[repKey];
    if (!rep) return;
    var table = findSectionTable('MY OUTSTANDING AR');
    if (!table) return;

    var rows = rep.outstandingAR.map(function(c) {
      return [
        c.clinic,
        c.state,
        {
          html: fmtMoney(c.outstanding),
          style: { color: '#d97706', fontWeight: '600' }
        },
        c.daysSinceLastOrder,
        fmtDate(c.lastOrder)
      ];
    });
    rebuildTableBody(table, rows);
  }

  // ===== Patch At-Risk Accounts =====
  function patchAtRisk(repKey) {
    var rep = activityData.repDetails[repKey];
    if (!rep) return;
    // Heading has count: MY AT-RISK ACCOUNTS (N)
    // Find any section label starting with this prefix
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var node, labelEl = null;
    while ((node = walker.nextNode())) {
      if (/MY AT-RISK ACCOUNTS/i.test(node.textContent)) {
        labelEl = node.parentElement;
        // Update count if in label
        var updated = node.textContent.replace(/\(\d+\)/, '(' + rep.atRiskAccounts.length + ')');
        if (updated !== node.textContent) node.textContent = updated;
        break;
      }
    }
    var table = findSectionTable('MY AT-RISK ACCOUNTS');
    if (!table) return;

    var rows = rep.atRiskAccounts.map(function(c) {
      return [
        c.clinic,
        c.state,
        {
          html: c.status,
          style: c.status === 'Active' ? {
            backgroundColor: '#fef3c7',
            color: '#92400e',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: '600',
            display: 'inline-block'
          } : {}
        },
        {
          html: String(c.daysSinceLastOrder),
          style: { color: '#dc2626', fontWeight: '600' }
        },
        fmtDate(c.lastOrder),
        fmtMoney(c.totalSpent)
      ];
    });
    rebuildTableBody(table, rows);
  }

  // ===== Main patch =====
  function patchAll() {
    if (!activityData) return;
    var repKey = detectActiveRep();
    window.__EPL_ACTIVE_REP = repKey;

    try { patchTopAccounts(repKey); } catch(e) { console.warn('[EPL] topAccounts patch failed', e); }
    try { patchNewClients(repKey); } catch(e) { console.warn('[EPL] newClients patch failed', e); }
    try { patchOutstandingAR(repKey); } catch(e) { console.warn('[EPL] outstandingAR patch failed', e); }
    try { patchAtRisk(repKey); } catch(e) { console.warn('[EPL] atRisk patch failed', e); }
  }

  // ===== Load and apply =====
  function loadActivity() {
    fetch('./activity.json?_=' + Date.now())
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(data) {
        if (!data) return;
        activityData = data;
        window.__EPL_ACTIVITY = data;
        console.log('[EPL ActivitySync] loaded', data.lastUpdated);
        setTimeout(patchAll, 1200);
      })
      .catch(function(e) { console.warn('[EPL ActivitySync] failed to load', e); });
  }

  loadActivity();

  // Re-apply on nav clicks
  document.body.addEventListener('click', function(e) {
    if (!e.target) return;
    var text = (e.target.textContent || '').trim();
    if (text === 'Activity' || text === 'Karin' || text === 'Megan') {
      setTimeout(patchAll, 700);
    }
  }, true);

  // Periodic retry for React re-renders
  var retries = 0;
  var iv = setInterval(function() {
    patchAll();
    retries++;
    if (retries > 20) clearInterval(iv);
  }, 2000);
})();
