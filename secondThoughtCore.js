// Second Thought Core — product identity layer
// Adds the app's signature CBT journey without changing existing tool logic.
(() => {
  const STEPS = [
    ['1', 'מחשבה ראשונה'],
    ['2', 'עצירה'],
    ['3', 'בדיקה'],
    ['4', 'מחשבה שנייה'],
    ['5', 'בחירה']
  ];

  const style = document.createElement('style');
  style.textContent = `
    .secondThoughtJourney{margin:0 0 18px;padding:14px 12px;border:1px solid rgba(15,23,42,.10);border-radius:18px;background:rgba(255,255,255,.55)}
    .secondThoughtJourneyTitle{font-weight:900;font-size:14px;margin-bottom:10px;text-align:right}
    .secondThoughtSteps{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;direction:rtl}
    .secondThoughtStep{min-width:0;text-align:center;font-size:11px;line-height:1.25;color:rgba(15,23,42,.66)}
    .secondThoughtStepNum{width:26px;height:26px;margin:0 auto 5px;border-radius:50%;display:grid;place-items:center;font-weight:900;background:rgba(14,165,233,.10);border:1px solid rgba(14,165,233,.24);color:#075985}
    .secondThoughtStep:first-child .secondThoughtStepNum{background:#0EA5E9;color:#fff;border-color:#0EA5E9}
    .secondThoughtSignature{margin-top:10px;font-size:12px;line-height:1.5;color:rgba(15,23,42,.68);text-align:right}
    @media(max-width:430px){.secondThoughtStep{font-size:9.5px}.secondThoughtJourney{padding:12px 8px}.secondThoughtStepNum{width:24px;height:24px}}
  `;
  document.head.appendChild(style);

  const journeyHtml = () => `
    <div class="secondThoughtJourney" data-second-thought-journey="true" aria-label="תהליך במחשבה שנייה">
      <div class="secondThoughtJourneyTitle">התהליך של „במחשבה שנייה”</div>
      <div class="secondThoughtSteps">
        ${STEPS.map(([n,label]) => `<div class="secondThoughtStep"><div class="secondThoughtStepNum">${n}</div><div>${label}</div></div>`).join('')}
      </div>
      <div class="secondThoughtSignature">המחשבה הראשונה היא אוטומטית. המחשבה השנייה כבר יכולה להיות בחירה.</div>
    </div>`;

  const enhanceThoughtView = () => {
    const app = document.querySelector('#app');
    if (!app || app.querySelector('[data-second-thought-journey]')) return;

    const title = [...app.querySelectorAll('h1,h2,.h1')]
      .find(el => (el.textContent || '').includes('מחשבה שלא עוזבת'));
    if (!title) return;

    const card = title.closest('.card');
    if (!card) return;
    const stack = card.querySelector('.stack');
    if (!stack) return;
    stack.insertAdjacentHTML('afterbegin', journeyHtml());

    const text = card.querySelector('#th_text');
    if (text) text.placeholder = 'המחשבה הראשונה שלי… (משפט אחד מספיק)';

    const generate = card.querySelector('#th_generate');
    if (generate) {
      const strong = generate.querySelector('div[style*="font-weight:900"]');
      if (strong) strong.textContent = 'עוצרים ובודקים את המחשבה';
    }
  };

  const observer = new MutationObserver(enhanceThoughtView);
  observer.observe(document.documentElement, {childList:true, subtree:true});
  document.addEventListener('DOMContentLoaded', enhanceThoughtView);
  enhanceThoughtView();
})();
