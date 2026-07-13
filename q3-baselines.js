/* ============================================================
 * Q3 2026 — "My Q3 Baselines" panel
 * ----------------------------------------------------------
 * Inserts a per-rep baseline vial table on the Overview tab,
 * showing each account's baseline (vials/mo) that must be
 * exceeded to earn the 12.5% Growth Above Baseline commission.
 *
 * Rep-scoped: if ?rep=karin or ?rep=megan is in the URL,
 * only that rep's accounts show. Otherwise (admin view), both
 * reps' books are shown grouped under Karin then Megan.
 *
 * Placement: Inserted immediately AFTER the Q3 Accelerator /
 * comp-plan grid, BEFORE the Base Salary Milestones grid.
 * ============================================================ */
(function () {
  'use strict';

  var INJECTED_ATTR = 'data-q3bl-injected';
  var params = new URLSearchParams(window.location.search);
  var repParam = params.get('rep');  // 'karin' | 'megan' | null (admin)

  // ---- Load baselines ----------------------------------------------------
  var baselineData = null;
  function loadBaselines(cb) {
    if (baselineData) { cb(baselineData); return; }
    fetch('./q3-baselines.json?_=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (d) { baselineData = d; cb(d); })
      .catch(function (e) { console.warn('[Q3 Baselines] load failed', e); cb(null); });
  }

  // ---- Rep filter --------------------------------------------------------
  function filterByRep(rows) {
    if (!repParam) return rows;
    var target = repParam === 'karin' ? 'Karin' : (repParam === 'megan' ? 'Megan' : null);
    if (!target) return rows;
    return rows.filter(function (r) { return (r.rep || '').indexOf(target) !== -1; });
  }

  // ---- Group by rep for admin view --------------------------------------
  function groupByRep(rows) {
    var groups = {};
    rows.forEach(function (r) {
      var name = (r.rep || 'Other').split(' ')[0];
      if (!groups[name]) groups[name] = [];
      groups[name].push(r);
    });
    // Sort accounts within each rep by baseline desc
    Object.keys(groups).forEach(function (k) {
      groups[k].sort(function (a, b) { return b.baseline_vials_per_month - a.baseline_vials_per_month; });
    });
    return groups;
  }

  // ---- HTML --------------------------------------------------------------
  function buildHTML(data) {
    var rows = filterByRep(data.baselines);
    var groups = groupByRep(rows);
    var repNames = Object.keys(groups).sort();  // Karin, Megan

    var repSections = repNames.map(function (rep) {
      var accts = groups[rep];
      var totalBaseline = accts.reduce(function (s, r) { return s + r.baseline_vials_per_month; }, 0);
      var accountRows = accts.map(function (a) {
        return (
          '<tr>' +
            '<td class="q3bl-account">' + escapeHtml(a.account) + '</td>' +
            '<td class="q3bl-num">' + a.jan_vials + '</td>' +
            '<td class="q3bl-num">' + a.feb_vials + '</td>' +
            '<td class="q3bl-num">' + a.mar_vials + '</td>' +
            '<td class="q3bl-num">' + a.apr_vials + '</td>' +
            '<td class="q3bl-num">' + a.may_vials + '</td>' +
            '<td class="q3bl-num">' + a.jun_vials + '</td>' +
            '<td class="q3bl-num q3bl-total">' + a.h1_total_vials + '</td>' +
            '<td class="q3bl-num q3bl-baseline">' + a.baseline_vials_per_month.toFixed(1) + '</td>' +
          '</tr>'
        );
      }).join('');

      // Section header (rep name) — only show if admin view has multiple reps
      var showRepHeader = repNames.length > 1;
      return (
        (showRepHeader
          ? '<div class="q3bl-rep-hdr">' + escapeHtml(rep) + ' \u00b7 ' + accts.length + ' accounts \u00b7 ' + totalBaseline.toFixed(1) + ' vials/mo baseline</div>'
          : '') +
        '<div class="q3bl-tablewrap">' +
          '<table class="q3bl-table">' +
            '<thead><tr>' +
              '<th class="q3bl-th-acct">Account</th>' +
              '<th>Jan</th><th>Feb</th><th>Mar</th><th>Apr</th><th>May</th><th>Jun</th>' +
              '<th class="q3bl-th-tot">H1 Total</th>' +
              '<th class="q3bl-th-base">Baseline (vials/mo)</th>' +
            '</tr></thead>' +
            '<tbody>' + accountRows + '</tbody>' +
          '</table>' +
        '</div>'
      );
    }).join('');

    var scope = repParam ? (repParam === 'karin' ? 'Karin\u2019s' : 'Megan\u2019s') : 'All reps\u2019';
    var totalAcct = rows.length;
    var totalMo = rows.reduce(function (s, r) { return s + r.baseline_vials_per_month; }, 0);

    return (
      '<div class="q3bl-root" ' + INJECTED_ATTR + '="1">' +
        '<div class="q3bl-hdr">' +
          '<div>' +
            '<div class="q3bl-title">My Q3 Baselines</div>' +
            '<div class="q3bl-sub">' + scope + ' per-account monthly vial baseline for Q3 2026. Sell above this number in a calendar month to earn <strong>12.5% Growth Above Baseline</strong> on the incremental vials (when the $30K monthly gate is cleared).</div>' +
          '</div>' +
          '<div class="q3bl-summary">' +
            '<div class="q3bl-summary-n">' + totalAcct + '</div>' +
            '<div class="q3bl-summary-l">accounts \u00b7 ' + totalMo.toFixed(1) + ' vials/mo total</div>' +
          '</div>' +
        '</div>' +
        '<div class="q3bl-meta">Method: Jan\u2013Jun 2026 vials ordered (attributed by Invoice Date), divided by 6. Locked for all of Q3.</div>' +
        repSections +
      '</div>'
    );
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ---- Find placement --------------------------------------------------
  // The Overview <section> that holds the comp plan has 3 children:
  //   [0] "2026 Compensation Plan" header
  //   [1] Q2/Standard grid (or our Q3 replacement)  <-- insert AFTER this
  //   [2] Base Salary Milestones grid
  // We insert the baseline panel between [1] and [2].
  function findInsertionPoint() {
    // Look for existing marker; if present, we've done it
    if (document.querySelector('[' + INJECTED_ATTR + '="1"]')) return null;
    var headings = document.querySelectorAll('h1,h2,h3,h4');
    for (var i = 0; i < headings.length; i++) {
      var el = headings[i];
      if ((el.textContent || '').trim() !== '2026 Compensation Plan') continue;
      var up = el;
      for (var j = 0; j < 10 && up.parentElement; j++) {
        up = up.parentElement;
        if (up.tagName === 'SECTION' &&
            up.textContent.indexOf('Base Salary Milestones') !== -1) {
          // Find the Base Salary grid child — we insert BEFORE it
          var kids = up.children;
          for (var k = 0; k < kids.length; k++) {
            if (kids[k].textContent.indexOf('Base Salary Milestones') !== -1) {
              return kids[k];  // insertBefore reference
            }
          }
        }
      }
    }
    return null;
  }

  function inject() {
    if (document.querySelector('[' + INJECTED_ATTR + '="1"]')) return;
    var refNode = findInsertionPoint();
    if (!refNode) return;
    loadBaselines(function (data) {
      if (!data || !data.baselines) return;
      if (document.querySelector('[' + INJECTED_ATTR + '="1"]')) return;
      var refNode2 = findInsertionPoint();
      if (!refNode2) return;
      var wrap = document.createElement('div');
      wrap.innerHTML = buildHTML(data);
      var block = wrap.firstElementChild;
      refNode2.parentNode.insertBefore(block, refNode2);
    });
  }

  var observer = new MutationObserver(function () {
    if (inject._t) return;
    inject._t = setTimeout(function () { inject._t = 0; inject(); }, 150);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
