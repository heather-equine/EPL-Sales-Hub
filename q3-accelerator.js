/* ============================================================
 * Q3 Commission Accelerator — Overview tab injection
 * ----------------------------------------------------------
 * Non-destructively replaces the "2026 Compensation Plan" section
 * on the Overview tab with a tabbed block:
 *   [ Q3 Accelerator (ACTIVE) | Q2 Escalator (archived) | Standard ]
 *
 * Visibility gate: SHOWN TO ALL (admin + reps).
 * (Historically was admin-only during Q3 rollout preview; opened to reps on 2026-07-14.)
 * Debug bypass: ?q3ax=off disables injection.
 * ============================================================ */
(function () {
  'use strict';

  // ---- Visibility gate ---------------------------------------------------
  var params = new URLSearchParams(window.location.search);
  if (params.get('q3ax') === 'off') {
    // debug bypass
    return;
  }

  var INJECTED_ATTR = 'data-q3ax-injected';

  // ---- HTML for the injected block --------------------------------------
  function buildHTML() {
    return (
      '<div class="q3ax-root" ' + INJECTED_ATTR + '="1">' +

        // Tabs
        '<div class="q3ax-tabs" role="tablist">' +
          '<button class="q3ax-tab is-active" data-q3ax-tab="q3" role="tab" aria-selected="true">' +
            '<span class="q3ax-dot"></span> Q3 Accelerator · Active' +
          '</button>' +
          '<button class="q3ax-tab q3ax-tab-archived" data-q3ax-tab="q2" role="tab" aria-selected="false">' +
            '<span class="q3ax-dot"></span> Q2 Escalator · Archived' +
          '</button>' +
          '<button class="q3ax-tab q3ax-tab-archived" data-q3ax-tab="std" role="tab" aria-selected="false">' +
            '<span class="q3ax-dot"></span> Standard Plan · Reference' +
          '</button>' +
        '</div>' +

        // ------- Q3 PANEL -------
        '<div class="q3ax-panel is-active" data-q3ax-panel="q3">' +

          '<div class="q3ax-hero">' +
            '<div class="q3ax-hero-l">' +
              '<div class="q3ax-hero-eyebrow">Active · July 1 – September 30, 2026</div>' +
              '<h3>Q3 Commission Accelerator</h3>' +
              '<div class="q3ax-hero-sub">Clear one monthly target and unlock elevated commission rates plus cash bonuses for the whole month. Miss it and you fall back to the standard waterfall — no penalty, just less upside.</div>' +
            '</div>' +
            '<div class="q3ax-tag">EARN UP TO<br>~7× YOUR<br>NORMAL CHECK</div>' +
          '</div>' +

          '<div class="q3ax-gate">' +
            '<div class="q3ax-gate-big">Collect <span>$30,000</span> in qualifying revenue in a calendar month.</div>' +
            '<div class="q3ax-gate-desc">Qualifying revenue = paid invoices. Hit it → full accelerator rates &amp; bonuses apply for that whole month. Miss it → standard 5% / 6% / 7.5% / 10% waterfall, bonuses off. Re-evaluated fresh each month.</div>' +
          '</div>' +

          '<div class="q3ax-step"><span class="q3ax-num">2</span> Your commission rates (when you clear the gate)</div>' +
          '<div class="q3ax-rates">' +
            '<div class="q3ax-rate"><div class="q3ax-rate-hd">15%</div><div class="q3ax-rate-body">' +
              '<div class="q3ax-rate-name">New / Reactivated</div>' +
              '<div class="q3ax-rate-desc">New accounts you set up &amp; get ordering, or a 90+ day dormant account you bring back to life.</div>' +
            '</div></div>' +
            '<div class="q3ax-rate"><div class="q3ax-rate-hd">12.5%</div><div class="q3ax-rate-body">' +
              '<div class="q3ax-rate-name">Growth Above Baseline</div>' +
              '<div class="q3ax-rate-desc">Paid on the incremental vials an account buys above its normal monthly run-rate.</div>' +
            '</div></div>' +
            '<div class="q3ax-rate q3ax-rate-alt"><div class="q3ax-rate-hd">10%</div><div class="q3ax-rate-body">' +
              '<div class="q3ax-rate-name">Baseline Reorders</div>' +
              '<div class="q3ax-rate-desc">Everything else — the same floor rate you earn today. Nothing lost.</div>' +
            '</div></div>' +
          '</div>' +

          '<div class="q3ax-step"><span class="q3ax-num">3</span> Cash bonuses on top</div>' +
          '<div class="q3ax-bonuses">' +
            '<div class="q3ax-bonus">' +
              '<div class="q3ax-b-amt">$750</div>' +
              '<div class="q3ax-b-name">New-Account Spiff</div>' +
              '<div class="q3ax-b-desc">Paid each time a new account reaches the 8-paid-vial Freezer Milestone (8 vials @ $600). Once per practice.</div>' +
            '</div>' +
            '<div class="q3ax-bonus">' +
              '<div class="q3ax-b-amt">$2,000</div>' +
              '<div class="q3ax-b-name">Breadth Bonus</div>' +
              '<div class="q3ax-b-desc">Grow 5 or more accounts by at least 20% over their baseline in the same month.</div>' +
            '</div>' +
          '</div>' +

          '<div class="q3ax-earn">' +
            '<div class="q3ax-earn-hd">What this looks like in a real month</div>' +
            '<table>' +
              '<tr><th>Rep &amp; Scenario</th><th>Accelerator Pay</th><th>Standard Plan</th><th>Upside</th></tr>' +
              '<tr><td><strong>Karin</strong> <span class="q3ax-scn">· strong month (qualifies)</span></td><td>$6,425</td><td>$1,500</td><td class="q3ax-gain">+$4,925</td></tr>' +
              '<tr><td><strong>Karin</strong> <span class="q3ax-scn">· breakout (2 new + breadth)</span></td><td>$7,850</td><td>$1,680</td><td class="q3ax-gain">+$6,170</td></tr>' +
              '<tr><td><strong>Megan</strong> <span class="q3ax-scn">· strong month (qualifies)</span></td><td>$6,590</td><td>$1,560</td><td class="q3ax-gain">+$5,030</td></tr>' +
              '<tr class="q3ax-miss"><td><strong>Below the gate</strong> <span class="q3ax-scn">· e.g. $16K month</span></td><td>$810</td><td>$810</td><td class="q3ax-gain">+$0</td></tr>' +
            '</table>' +
          '</div>' +

          '<div class="q3ax-ctas">' +
            '<div class="q3ax-ctac">' +
              '<div class="q3ax-ctah">How to win this quarter</div>' +
              '<div class="q3ax-ctat">Front-load new-account setups and freezer placements, revive dormant accounts, and keep pushing existing accounts above their baseline — that\u2019s where 15% and 12.5% live.</div>' +
            '</div>' +
            '<div class="q3ax-ctac">' +
              '<div class="q3ax-ctah">Model your own month</div>' +
              '<div class="q3ax-ctat">The Accelerator Commission Calculator (Excel) lets you plug in accounts and vials to see exact earnings. Available in the Documents tab.</div>' +
            '</div>' +
          '</div>' +

        '</div>' + // /q3 panel

        // ------- Q2 PANEL -------
        '<div class="q3ax-panel" data-q3ax-panel="q2">' +
          '<div class="q3ax-archive-note">' +
            '<span class="q3ax-arc-badge">Archived · Ended June 30, 2026</span>' +
            '<div class="q3ax-arc-msg"><strong>The Q2 Escalator ended on June 30, 2026.</strong> It has been replaced by the Q3 Accelerator for July\u2013September. This tab is kept for historical reference.</div>' +
          '</div>' +
          '<div class="q3ax-card">' +
            '<h4>Q2 Escalator</h4>' +
            '<div class="q3ax-card-sub">April 1 – June 30, 2026 · Ramp-up boost</div>' +
            '<div class="q3ax-big10">10%<span> flat on all collected revenue</span></div>' +
            '<ul>' +
              '<li>Every dollar collected paid 10% — no tiers, no thresholds, no waterfall math</li>' +
              '<li>CTM and Maintain counted equally, just like the standard plan</li>' +
              '<li>Paid last payroll of the following month</li>' +
              '<li>Standard plan resumed automatically July 1, 2026</li>' +
            '</ul>' +
          '</div>' +
        '</div>' +

        // ------- STANDARD PANEL -------
        '<div class="q3ax-panel" data-q3ax-panel="std">' +
          '<div class="q3ax-archive-note">' +
            '<span class="q3ax-arc-badge">Reference · Fallback plan</span>' +
            '<div class="q3ax-arc-msg"><strong>The Standard Plan (Exhibit C) is the year-round default.</strong> It applies in any month a rep does not clear the Q3 Accelerator gate — and resumes fully on October 1, 2026.</div>' +
          '</div>' +
          '<div class="q3ax-card">' +
            '<h4>Standard Plan (Exhibit C)</h4>' +
            '<div class="q3ax-card-sub">Monthly tiered waterfall · Resets each month</div>' +
            '<div class="q3ax-tiers">' +
              '<div class="q3ax-tier"><span>$0 – $75,000</span><span class="q3ax-tier-rate">5%</span></div>' +
              '<div class="q3ax-tier"><span>$75,000 – $175,000</span><span class="q3ax-tier-rate">6%</span></div>' +
              '<div class="q3ax-tier"><span>$175,000 – $300,000</span><span class="q3ax-tier-rate">7.5%</span></div>' +
              '<div class="q3ax-tier q3ax-tier-top"><span>$300,000+</span><span class="q3ax-tier-rate">10%</span></div>' +
            '</div>' +
            '<ul>' +
              '<li>Progressive — each rate applies only to the portion of revenue within that tier</li>' +
              '<li>Tiers reset monthly · Paid last payroll of the following month</li>' +
              '<li>Qualifying 1099 agent revenue counts 100% toward tiers and milestones</li>' +
            '</ul>' +
          '</div>' +
        '</div>' +

      '</div>'
    );
  }

  // ---- Tab switching -----------------------------------------------------
  function wireTabs(root) {
    var tabs = root.querySelectorAll('[data-q3ax-tab]');
    var panels = root.querySelectorAll('[data-q3ax-panel]');
    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-q3ax-tab');
        tabs.forEach(function (t) {
          var active = t === btn;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        panels.forEach(function (p) {
          p.classList.toggle('is-active', p.getAttribute('data-q3ax-panel') === key);
        });
      });
    });
  }

  // ---- Find the target grid (the Q2/Standard comp-plan grid) -------------
  // The Overview <section> has three children:
  //   [0] the "2026 Compensation Plan" header row
  //   [1] the Q2 Escalator + Standard Plan grid   <-- WE REPLACE ONLY THIS ONE
  //   [2] the Base Salary Milestones + Payment Mechanics + Reference grid
  // We keep [0] and [2] intact so nothing else on the Overview tab shifts.
  function findCompGrid() {
    var headings = document.querySelectorAll('h1,h2,h3,h4');
    for (var i = 0; i < headings.length; i++) {
      var el = headings[i];
      if ((el.textContent || '').trim() !== '2026 Compensation Plan') continue;
      var up = el;
      for (var j = 0; j < 10 && up.parentElement; j++) {
        up = up.parentElement;
        if (up.tagName === 'SECTION' &&
            up.textContent.indexOf('Q2 Escalator') !== -1 &&
            up.textContent.indexOf('Standard Plan') !== -1) {
          // Walk the section's children to find the Q2/Std grid
          var kids = up.children;
          for (var k = 0; k < kids.length; k++) {
            var c = kids[k];
            if (c.textContent.indexOf('Q2 Escalator') !== -1 &&
                c.textContent.indexOf('Standard Plan (Exhibit C)') !== -1 &&
                c.textContent.indexOf('Base Salary Milestones') === -1) {
              return c;
            }
          }
        }
      }
    }
    return null;
  }

  function inject() {
    // If already injected somewhere, just verify it's still in the DOM
    var existing = document.querySelector('[' + INJECTED_ATTR + '="1"]');
    if (existing && document.body.contains(existing)) return;

    var grid = findCompGrid();
    if (!grid) return;

    // Build a wrapper <div> and replace only the Q2/Std grid with it.
    // Base Salary Milestones / Payment Mechanics / Reference stay intact.
    var wrap = document.createElement('div');
    wrap.innerHTML = buildHTML();
    var block = wrap.firstElementChild;
    grid.parentNode.replaceChild(block, grid);
    block.setAttribute('data-q3ax-replaced', '1');
    wireTabs(block);
  }

  // ---- Observe DOM: SPA may re-render Overview when nav'd back to --------
  var observer = new MutationObserver(function () {
    // Debounce lightly
    if (inject._t) return;
    inject._t = setTimeout(function () { inject._t = 0; inject(); }, 100);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Initial attempt (in case content is already there)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
