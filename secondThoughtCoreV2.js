// Second Thought Core V2 — safe, event-driven extension for "מחשבה שלא עוזבת".
// No MutationObserver. No polling. No changes to app.js internals.
(() => {
  'use strict';

  const LS_KEY = 'opensense_v1';
  const JOURNEY_ID = 'second_thought_journey_v2';
  const PANEL_ID = 'second_thought_finish_v2';

  const esc = (s) => (s ?? '').toString()
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const readStore = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      return {
        history: Array.isArray(parsed.history) ? parsed.history : [],
        antiRepeat: parsed.antiRepeat || { reg: [], thought: [], dilemma: [] }
      };
    } catch {
      return { history: [], antiRepeat: { reg: [], thought: [], dilemma: [] } };
    }
  };

  const writeStore = (store) => localStorage.setItem(LS_KEY, JSON.stringify(store));

  const style = document.createElement('style');
  style.textContent = `
    .stJourneyV2{margin:0 0 16px;padding:12px;border:1px solid rgba(15,23,42,.10);border-radius:18px;background:rgba(255,255,255,.55)}
    .stJourneyV2Title{font-weight:900;font-size:13px;margin-bottom:9px;text-align:right}
    .stJourneyV2Steps{display:flex;align-items:center;gap:6px;overflow-x:auto;padding-bottom:2px}
    .stStepV2{white-space:nowrap;font-size:12px;font-weight:800;opacity:.55;padding:7px 9px;border-radius:999px;background:rgba(15,23,42,.05)}
    .stStepV2.active{opacity:1;background:rgba(14,165,233,.12);outline:1px solid rgba(14,165,233,.25)}
    .stArrowV2{opacity:.35;font-weight:900}
    .stFinishV2{margin-top:14px;padding:14px;border-radius:18px;border:1px solid rgba(15,23,42,.10);background:rgba(255,255,255,.65)}
    .stFinishV2 textarea,.stFinishV2 input{width:100%;box-sizing:border-box}
    .stChoiceGridV2{display:grid;grid-template-columns:1fr;gap:8px;margin-top:10px}
    .stChoiceV2.selected{outline:2px solid rgba(14,165,233,.45)}
    .stSummaryV2{line-height:1.65}
    @media(min-width:700px){.stChoiceGridV2{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);

  const journeyMarkup = (active = 1) => {
    const labels = ['מחשבה ראשונה', 'עצירה', 'בדיקה', 'מחשבה שנייה', 'בחירה'];
    return `
      <div id="${JOURNEY_ID}" class="stJourneyV2" data-active="${active}">
        <div class="stJourneyV2Title">במחשבה שנייה</div>
        <div class="stJourneyV2Steps">
          ${labels.map((label, i) => `${i ? '<span class="stArrowV2">←</span>' : ''}<span class="stStepV2 ${i + 1 === active ? 'active' : ''}" data-step="${i + 1}">${label}</span>`).join('')}
        </div>
      </div>`;
  };

  const setJourneyStep = (step) => {
    const root = document.getElementById(JOURNEY_ID);
    if (!root) return;
    root.dataset.active = String(step);
    root.querySelectorAll('.stStepV2').forEach((el) => el.classList.toggle('active', Number(el.dataset.step) === step));
  };

  const enhanceThoughtView = () => {
    const text = document.getElementById('th_text');
    if (!text) return;

    if (!document.getElementById(JOURNEY_ID)) {
      const stack = text.closest('.stack');
      if (stack) stack.insertAdjacentHTML('afterbegin', journeyMarkup(document.querySelector('button[data-alt]') ? 3 : 1));
    }

    text.placeholder = 'המחשבה הראשונה שלי… (משפט אחד מספיק)';
    const generate = document.getElementById('th_generate');
    const mainLabel = generate?.querySelector('div[style*="font-weight:900"]');
    if (mainLabel) mainLabel.textContent = 'עוצרים ובודקים את המחשבה';

    if (document.querySelector('button[data-alt]')) setJourneyStep(3);
  };

  const getRealityText = () => {
    const buttons = [...document.querySelectorAll('button[data-alt]')];
    if (!buttons.length) return '';
    const card = buttons[0].closest('.card');
    if (!card) return '';
    const divs = [...card.querySelectorAll('div')];
    const label = divs.find((el) => el.textContent.trim() === 'בדיקת מציאות');
    return label?.nextElementSibling?.textContent?.trim() || '';
  };

  const showFinishPanel = (chosenAlt) => {
    document.getElementById(PANEL_ID)?.remove();

    const firstThought = document.getElementById('th_text')?.value?.trim() || '';
    const before = Number(document.getElementById('th_int_range')?.value || 0);
    const trigger = document.getElementById('th_trigger')?.value || '';
    const topic = document.getElementById('th_topic')?.value || '';
    const reality = getRealityText();

    const host = document.querySelector('button[data-alt]')?.closest('.card');
    if (!host) return;

    host.insertAdjacentHTML('afterend', `
      <div id="${PANEL_ID}" class="stFinishV2"
        data-first="${esc(firstThought)}" data-before="${before}" data-trigger="${esc(trigger)}" data-topic="${esc(topic)}" data-reality="${esc(reality)}">
        <div style="font-weight:900;font-size:17px;margin-bottom:6px;">ועכשיו, במחשבה שנייה…</div>
        <div class="p">אפשר לדייק את הניסוח שבחרת כך שירגיש אמין ושימושי עבורך.</div>
        <textarea id="st_second_v2" style="margin-top:10px;">${esc(chosenAlt)}</textarea>
        <div style="font-weight:900;margin-top:14px;">כמה זה מפריע לי עכשיו? <span id="st_after_val_v2">${before}</span>/10</div>
        <input id="st_after_v2" type="range" min="0" max="10" step="1" value="${before}" />
        <div style="font-weight:900;margin-top:14px;">מה אני בוחר/ת לעשות עכשיו?</div>
        <div class="stChoiceGridV2">
          ${['להמשיך הלאה', 'לעשות צעד קטן', 'לתת לעצמי זמן ולא להחליט עכשיו', 'לחזור לזה מאוחר יותר'].map((c) => `<button type="button" class="btn btnSmall stChoiceV2" data-choice="${esc(c)}"><span>${esc(c)}</span><span>✓</span></button>`).join('')}
        </div>
        <input id="st_custom_v2" class="input" style="margin-top:10px;" placeholder="או לכתוב בחירה אחרת…" />
        <button type="button" class="btn btnPrimary" id="st_save_v2" style="margin-top:12px;"><span>לשמור את המחשבה השנייה והבחירה</span><span>✓</span></button>
      </div>`);

    setJourneyStep(4);
    const panel = document.getElementById(PANEL_ID);
    panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const saveCompletion = () => {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    const secondThought = document.getElementById('st_second_v2')?.value?.trim() || '';
    if (!secondThought) {
      alert('כתוב/כתבי את המחשבה השנייה.');
      return;
    }

    const selected = panel.querySelector('.stChoiceV2.selected')?.dataset.choice || '';
    const custom = document.getElementById('st_custom_v2')?.value?.trim() || '';
    const choice = custom || selected;
    if (!choice) {
      alert('בחר/י מה לעשות עכשיו, או כתוב/כתבי בחירה אחרת.');
      return;
    }

    const firstThought = panel.dataset.first || '';
    const reality = panel.dataset.reality || '';
    const trigger = panel.dataset.trigger || '';
    const topic = panel.dataset.topic || '';
    const before = Number(panel.dataset.before || 0);
    const after = Number(document.getElementById('st_after_v2')?.value || 0);

    const store = readStore();
    store.history.unshift({
      ts: new Date().toISOString(),
      kind: 'מחשבה שלא עוזבת',
      intensity: before,
      intensityAfter: after,
      trigger,
      title: firstThought.slice(0, 64),
      note: `מחשבה ראשונה: ${firstThought}\nבדיקת מציאות: ${reality}\nמחשבה שנייה: ${secondThought}\nבחירה: ${choice}\nעוצמה לפני: ${before}/10\nעוצמה אחרי: ${after}/10\nנושא: ${topic}`,
      secondThought: { firstThought, reality, secondThought, choice, beforeIntensity: before, afterIntensity: after, topic }
    });
    store.history = store.history.slice(0, 500);
    writeStore(store);

    setJourneyStep(5);
    panel.innerHTML = `
      <div class="stSummaryV2">
        <div style="font-weight:900;font-size:18px;">זה ההבדל שעשית עכשיו</div>
        <div style="margin-top:10px;"><b>המחשבה הראשונה:</b> ${esc(firstThought)}</div>
        <div style="margin-top:8px;"><b>במחשבה שנייה:</b> ${esc(secondThought)}</div>
        <div style="margin-top:8px;"><b>הבחירה שלי:</b> ${esc(choice)}</div>
        <div style="margin-top:8px;"><b>עוצמת ההפרעה:</b> ${before} → ${after}</div>
        <button type="button" class="btn btnPrimary" id="st_finish_home_v2" style="margin-top:14px;"><span>סיום וחזרה לבית</span><span>⌂</span></button>
      </div>`;
  };

  document.addEventListener('click', (event) => {
    const altBtn = event.target.closest?.('button[data-alt]');
    if (altBtn && document.getElementById('th_text')) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const chosen = altBtn.querySelector('.p')?.textContent?.trim() || '';
      if (chosen) showFinishPanel(chosen);
      return;
    }
  }, true);

  document.addEventListener('click', (event) => {
    const target = event.target;

    if (target.closest?.('#th_generate') || target.closest?.('[data-route="thought"]')) {
      setTimeout(enhanceThoughtView, 0);
      return;
    }

    const choiceBtn = target.closest?.('.stChoiceV2');
    if (choiceBtn) {
      document.querySelectorAll('.stChoiceV2').forEach((b) => b.classList.remove('selected'));
      choiceBtn.classList.add('selected');
      document.getElementById('st_custom_v2').value = '';
      return;
    }

    if (target.closest?.('#st_save_v2')) {
      saveCompletion();
      return;
    }

    if (target.closest?.('#st_finish_home_v2')) {
      window.location.reload();
    }
  });

  document.addEventListener('input', (event) => {
    if (event.target?.id === 'st_after_v2') {
      const out = document.getElementById('st_after_val_v2');
      if (out) out.textContent = event.target.value;
    }
    if (event.target?.id === 'st_custom_v2' && event.target.value.trim()) {
      document.querySelectorAll('.stChoiceV2').forEach((b) => b.classList.remove('selected'));
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceThoughtView, { once: true });
  } else {
    enhanceThoughtView();
  }
})();
