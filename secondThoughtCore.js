// Second Thought Core — product identity + completion flow
// Extends only the "מחשבה שלא עוזבת" journey while leaving the existing app logic untouched.
(() => {
  const LS_KEY = 'opensense_v1';
  const STEPS = [
    ['1', 'מחשבה ראשונה'],
    ['2', 'עצירה'],
    ['3', 'בדיקה'],
    ['4', 'מחשבה שנייה'],
    ['5', 'בחירה']
  ];

  const esc = (s) => (s ?? '').toString()
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  const style = document.createElement('style');
  style.textContent = `
    .secondThoughtJourney{margin:0 0 18px;padding:14px 12px;border:1px solid rgba(15,23,42,.10);border-radius:18px;background:rgba(255,255,255,.55)}
    .secondThoughtJourneyTitle{font-weight:900;font-size:14px;margin-bottom:10px;text-align:right}
    .secondThoughtSteps{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;direction:rtl}
    .secondThoughtStep{min-width:0;text-align:center;font-size:11px;line-height:1.25;color:rgba(15,23,42,.66)}
    .secondThoughtStepNum{width:26px;height:26px;margin:0 auto 5px;border-radius:50%;display:grid;place-items:center;font-weight:900;background:rgba(14,165,233,.10);border:1px solid rgba(14,165,233,.24);color:#075985}
    .secondThoughtStep.active .secondThoughtStepNum{background:#0EA5E9;color:#fff;border-color:#0EA5E9}
    .secondThoughtStep.done .secondThoughtStepNum{background:rgba(14,165,233,.18);color:#075985;border-color:rgba(14,165,233,.28)}
    .secondThoughtSignature{margin-top:10px;font-size:12px;line-height:1.5;color:rgba(15,23,42,.68);text-align:right}
    .secondThoughtFinish{margin-top:14px;padding:16px;border:1px solid rgba(14,165,233,.20);border-radius:20px;background:rgba(14,165,233,.055)}
    .secondThoughtFinish h3{margin:0 0 6px;font-size:18px}
    .secondThoughtFinishLabel{font-weight:900;margin:14px 0 6px}
    .secondThoughtAltChosen{padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.7);line-height:1.55}
    .secondThoughtChoices{display:grid;gap:8px;margin-top:6px}
    .secondThoughtChoice{width:100%;text-align:right;padding:11px 12px;border:1px solid rgba(15,23,42,.12);border-radius:14px;background:rgba(255,255,255,.72);font:inherit;cursor:pointer}
    .secondThoughtChoice.selected{border-color:#0EA5E9;background:rgba(14,165,233,.10);font-weight:900}
    .secondThoughtSummary{margin-top:14px;display:grid;gap:9px}
    .secondThoughtSummaryRow{padding:11px 12px;border-radius:14px;background:rgba(255,255,255,.72)}
    .secondThoughtSummaryKey{font-size:12px;font-weight:900;color:rgba(15,23,42,.58);margin-bottom:3px}
    @media(max-width:430px){.secondThoughtStep{font-size:9.5px}.secondThoughtJourney{padding:12px 8px}.secondThoughtStepNum{width:24px;height:24px}}
  `;
  document.head.appendChild(style);

  const journeyHtml = (active = 1) => `
    <div class="secondThoughtJourney" data-second-thought-journey="true" aria-label="תהליך במחשבה שנייה">
      <div class="secondThoughtJourneyTitle">התהליך של „במחשבה שנייה”</div>
      <div class="secondThoughtSteps">
        ${STEPS.map(([n,label], i) => `<div class="secondThoughtStep ${i + 1 < active ? 'done' : ''} ${i + 1 === active ? 'active' : ''}"><div class="secondThoughtStepNum">${n}</div><div>${label}</div></div>`).join('')}
      </div>
      <div class="secondThoughtSignature">המחשבה הראשונה היא אוטומטית. המחשבה השנייה כבר יכולה להיות בחירה.</div>
    </div>`;

  const updateJourney = (active) => {
    const wrap = document.querySelector('[data-second-thought-journey]');
    if (!wrap) return;
    wrap.outerHTML = journeyHtml(active);
  };

  const readLocalState = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      if (!Array.isArray(parsed.history)) parsed.history = [];
      if (!parsed.antiRepeat) parsed.antiRepeat = { reg: [], thought: [], dilemma: [] };
      return parsed;
    } catch {
      return { history: [], antiRepeat: { reg: [], thought: [], dilemma: [] } };
    }
  };

  const saveCompletedThought = (entry) => {
    const state = readLocalState();
    state.history.unshift(entry);
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  };

  const getRealityText = (card) => {
    const labels = [...card.querySelectorAll('div')];
    const label = labels.find(el => (el.textContent || '').trim() === 'בדיקת מציאות');
    if (!label) return '';
    const next = label.nextElementSibling;
    return next ? (next.textContent || '').trim() : '';
  };

  const showFinishFlow = (card, selectedAlt) => {
    if (card.querySelector('[data-second-thought-finish]')) return;

    const firstThought = (card.querySelector('#th_text')?.value || '').trim();
    const beforeIntensity = Number(card.querySelector('#th_int_range')?.value || 0);
    const trigger = card.querySelector('#th_trigger')?.value || '';
    const topic = card.querySelector('#th_topic')?.value || '';
    const reality = getRealityText(card);

    updateJourney(4);

    const panel = document.createElement('div');
    panel.className = 'secondThoughtFinish';
    panel.dataset.secondThoughtFinish = 'true';
    panel.innerHTML = `
      <h3>ועכשיו, במחשבה שנייה…</h3>
      <div class="p">אפשר לקחת את החלופה שבחרת כמו שהיא, או לשנות אותה כך שתרגיש אמינה ומדויקת יותר עבורך.</div>

      <div class="secondThoughtFinishLabel">החלופה שבחרתי</div>
      <div class="secondThoughtAltChosen">${esc(selectedAlt)}</div>

      <div class="secondThoughtFinishLabel">המחשבה השנייה שלי</div>
      <textarea id="second_thought_text" placeholder="נסח/י מחשבה מאוזנת ואמינה…">${esc(selectedAlt)}</textarea>

      <div class="secondThoughtFinishLabel">כמה זה מפריע לי עכשיו? <span id="second_after_value">${beforeIntensity}</span>/10</div>
      <input id="second_after_intensity" type="range" min="0" max="10" step="1" value="${beforeIntensity}" />

      <div class="secondThoughtFinishLabel">מה אני בוחר/ת לעשות עכשיו?</div>
      <div class="secondThoughtChoices" id="second_choices">
        <button type="button" class="secondThoughtChoice" data-choice="להמשיך הלאה">להמשיך הלאה</button>
        <button type="button" class="secondThoughtChoice" data-choice="לעשות צעד קטן">לעשות צעד קטן</button>
        <button type="button" class="secondThoughtChoice" data-choice="לתת לעצמי זמן ולא להחליט עכשיו">לתת לעצמי זמן ולא להחליט עכשיו</button>
        <button type="button" class="secondThoughtChoice" data-choice="לחזור לזה מאוחר יותר">לחזור לזה מאוחר יותר</button>
      </div>
      <input id="second_custom_choice" class="input" style="margin-top:8px" placeholder="או לכתוב בחירה אחרת…" />

      <button type="button" class="btn btnPrimary" id="second_finish_save" style="margin-top:14px">
        <span><div style="font-weight:900">סיימתי — שמור את המחשבה השנייה</div><div class="p">נשמור את הלפני, אחרי והבחירה שלי</div></span><span>✓</span>
      </button>
    `;

    const resultsCard = card.querySelector('button[data-alt]')?.closest('.card');
    (resultsCard || card.querySelector('.stack') || card).appendChild(panel);

    let selectedChoice = '';
    panel.querySelectorAll('.secondThoughtChoice').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.secondThoughtChoice').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedChoice = btn.dataset.choice || '';
        panel.querySelector('#second_custom_choice').value = '';
        updateJourney(5);
      });
    });

    const afterRange = panel.querySelector('#second_after_intensity');
    afterRange.addEventListener('input', () => {
      panel.querySelector('#second_after_value').textContent = afterRange.value;
    });

    panel.querySelector('#second_custom_choice').addEventListener('input', (e) => {
      if (e.target.value.trim()) {
        selectedChoice = '';
        panel.querySelectorAll('.secondThoughtChoice').forEach(b => b.classList.remove('selected'));
        updateJourney(5);
      }
    });

    panel.querySelector('#second_finish_save').addEventListener('click', () => {
      const secondThought = panel.querySelector('#second_thought_text').value.trim();
      const customChoice = panel.querySelector('#second_custom_choice').value.trim();
      const choice = customChoice || selectedChoice;
      const afterIntensity = Number(afterRange.value);

      if (!secondThought) {
        alert('כדאי לנסח מחשבה שנייה לפני שמסיימים.');
        return;
      }
      if (!choice) {
        alert('בחר/י מה לעשות עכשיו, או כתוב/כתבי בחירה משלך.');
        return;
      }

      saveCompletedThought({
        ts: new Date().toISOString(),
        kind: 'מחשבה שלא עוזבת',
        intensity: beforeIntensity,
        intensityAfter: afterIntensity,
        trigger,
        title: firstThought.slice(0, 64),
        note: `מחשבה ראשונה: ${firstThought}\nבדיקת מציאות: ${reality}\nמחשבה שנייה: ${secondThought}\nבחירה: ${choice}\nעוצמה לפני: ${beforeIntensity}/10\nעוצמה אחרי: ${afterIntensity}/10\nנושא: ${topic}`,
        secondThought: {
          firstThought,
          reality,
          secondThought,
          choice,
          beforeIntensity,
          afterIntensity,
          topic
        }
      });

      panel.innerHTML = `
        <h3>זה ההבדל שעשית עכשיו</h3>
        <div class="secondThoughtSummary">
          <div class="secondThoughtSummaryRow"><div class="secondThoughtSummaryKey">המחשבה הראשונה</div>${esc(firstThought)}</div>
          <div class="secondThoughtSummaryRow"><div class="secondThoughtSummaryKey">במחשבה שנייה</div>${esc(secondThought)}</div>
          <div class="secondThoughtSummaryRow"><div class="secondThoughtSummaryKey">הבחירה שלי</div>${esc(choice)}</div>
          <div class="secondThoughtSummaryRow"><div class="secondThoughtSummaryKey">עוצמת ההפרעה</div>${beforeIntensity}/10 → ${afterIntensity}/10</div>
        </div>
        <button type="button" class="btn btnPrimary" id="second_done_home" style="margin-top:14px"><span>סיום וחזרה לבית</span><span>⌂</span></button>
      `;
      updateJourney(5);

      panel.querySelector('#second_done_home').addEventListener('click', () => {
        const home = document.querySelector('#go_home2');
        if (home) home.click();
      });
    });

    setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const replaceAltHandlers = (card) => {
    card.querySelectorAll('button[data-alt]').forEach(btn => {
      if (btn.dataset.secondThoughtBound === 'true') return;
      const clone = btn.cloneNode(true);
      clone.dataset.secondThoughtBound = 'true';
      btn.replaceWith(clone);
      clone.addEventListener('click', (e) => {
        e.preventDefault();
        const text = clone.querySelector('.p')?.textContent?.trim() || '';
        if (text) showFinishFlow(card, text);
      });
    });
  };

  const enhanceThoughtView = () => {
    const app = document.querySelector('#app');
    if (!app) return;

    const title = [...app.querySelectorAll('h1,h2,.h1')]
      .find(el => (el.textContent || '').includes('מחשבה שלא עוזבת'));
    if (!title) return;

    const card = title.closest('.card');
    if (!card) return;
    const stack = card.querySelector('.stack');
    if (!stack) return;

    if (!card.querySelector('[data-second-thought-journey]')) {
      stack.insertAdjacentHTML('afterbegin', journeyHtml(1));
    }

    const text = card.querySelector('#th_text');
    if (text) text.placeholder = 'המחשבה הראשונה שלי… (משפט אחד מספיק)';

    const generate = card.querySelector('#th_generate');
    if (generate) {
      const strong = generate.querySelector('div[style*="font-weight:900"]');
      if (strong) strong.textContent = 'עוצרים ובודקים את המחשבה';
      if (!generate.dataset.secondThoughtProgressBound) {
        generate.dataset.secondThoughtProgressBound = 'true';
        generate.addEventListener('click', () => setTimeout(() => updateJourney(3), 40));
      }
    }

    replaceAltHandlers(card);
  };

  const observer = new MutationObserver(enhanceThoughtView);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', enhanceThoughtView);
  enhanceThoughtView();
})();
