(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // State האפליקציה
  const ui = { route: "home" };
  const state = {
    lifeWheel: { health: 5, mood: 5, social: 5, work: 5 }
  };

  // רינדור דף הבית
  const renderHome = () => `
    <div class="p14">
      <div class="sectionTitle">כלים מהירים</div>
      <div class="grid2">
        <div class="card p14 tool-card" data-tool="reg">
          <h3>וויסות רגשי</h3>
          <p class="muted">נשימות והרגעה</p>
        </div>
        <div class="card p14 tool-card" data-tool="thought">
          <h3>בדיקת מציאות</h3>
          <p class="muted">עבודה על מחשבות</p>
        </div>
      </div>
    </div>
  `;

  // רינדור גלגל החיים
  const renderLifeWheel = () => `
    <div class="p14 life-wheel-container">
      <div class="sectionTitle">גלגל החיים</div>
      <div class="card p14">
        ${Object.keys(state.lifeWheel).map(cat => `
          <div style="margin-bottom:15px">
            <label>${cat === 'health' ? 'בריאות' : cat === 'mood' ? 'מצב רוח' : cat === 'social' ? 'חברה' : 'קריירה'}</label>
            <input type="range" min="1" max="10" value="${state.lifeWheel[cat]}" data-cat="${cat}" class="w100">
          </div>
        `).join('')}
      </div>
      <div id="wheelVisual" style="text-align:center; margin-top:20px; font-size:40px;">🎡</div>
    </div>
  `;

  const render = () => {
    const main = $("#app");
    if (ui.route === "home") {
      main.innerHTML = renderHome();
      bindHome();
    } else if (ui.route === "lifewheel") {
      main.innerHTML = renderLifeWheel();
      bindLifeWheel();
    } else {
      main.innerHTML = `<div class="p14">הדף בבנייה...</div>`;
    }
  };

  const bindHome = () => {
    $$(".tool-card").forEach(card => {
      card.onclick = () => alert("כלי ה" + card.dataset.tool + " ייפתח בקרוב");
    });
  };

  const bindLifeWheel = () => {
    $$("input[type='range']").forEach(input => {
      input.oninput = (e) => {
        state.lifeWheel[e.target.dataset.cat] = e.target.value;
        $("#wheelVisual").style.transform = `rotate(${e.target.value * 36}deg)`;
      };
    });
  };

  const mountNav = () => {
    $$(".navBtn").forEach(btn => {
      btn.onclick = () => {
        $$(".navBtn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        ui.route = btn.dataset.route;
        render();
      };
    });
  };

  const hideSplashSoon = () => {
    const s = $("#splash");
    if (s) setTimeout(() => s.classList.add("hide"), 800);
  };

  const boot = () => {
    mountNav();
    render();
    hideSplashSoon();
    console.log("App Ready");
  };

  // הפעלה
  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
})();