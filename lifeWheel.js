// LifeWheel module (global) - v1
(() => {
  const LIFE_KEY = "opensense_life_v2";

  const DOMAINS = [
    "קריירה - תעסוקה",
    "לימודים - השכלה",
    "מצב כלכלי",
    "תחביבים ופנאי",
    "בריאות",
    "זוגיות",
    "משפחה",
    "חברים",
    "אחר"
  ];

  const COLORS = ["#7DD3FC","#A7F3D0","#FDE68A","#FBCFE8","#C4B5FD","#FDBA74","#93C5FD","#86EFAC","#D1D5DB"];

  const load = (fallback) => {
    try {
      const raw = localStorage.getItem(LIFE_KEY);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  };
  const save = (obj) => localStorage.setItem(LIFE_KEY, JSON.stringify(obj));

  const defaultSession = (nowISO) => ({
    id: String(Date.now()),
    at: nowISO(),
    mode: "present",
    items: DOMAINS.map((title,i)=>({
      title,
      color: COLORS[i] || "#FFFFFF",
      present: null,
      future: null,
      presentDesc: "",
      futureDesc: "",
      step: ""
    }))
  });

  const rgbaFromHex = (hex, a) => {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };

  const svg = (ctx, session) => {
    const which = (session.mode === "future") ? "future" : "present";
    const values = session.items.map(it => {
      const v = (which === "future") ? it.future : it.present;
      return (typeof v === "number" ? ctx.clamp(v,0,10) : 0);
    });

    const N = values.length;
    const cx = 120, cy = 120;
    const rMax = 95;
    const toRad = (deg) => (deg * Math.PI) / 180;

    const wedgePath = (i, val) => {
      const angle0 = -90 + (360 / N) * i;
      const angle1 = -90 + (360 / N) * (i + 1);
      const r = (val / 10) * rMax;
      const x0 = cx + r * Math.cos(toRad(angle0));
      const y0 = cy + r * Math.sin(toRad(angle0));
      const x1 = cx + r * Math.cos(toRad(angle1));
      const y1 = cy + r * Math.sin(toRad(angle1));
      return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`;
    };

    const labelPos = (i) => {
      const angle = -90 + (360 / N) * (i + 0.5);
      const r = 112;
      return { x: cx + r * Math.cos(toRad(angle)), y: cy + r * Math.sin(toRad(angle)) };
    };

    const grid = [2,4,6,8,10].map(v => {
      const rr = (v/10)*rMax;
      return `<circle cx="${cx}" cy="${cy}" r="${rr}" class="wheelGrid" />`;
    }).join("");

    const wedges = values.map((v,i)=> {
      const col = session.items[i].color || "#FFFFFF";
      const alpha = 0.12 + (0.70 * (v/10));
      const fill = rgbaFromHex(col, alpha.toFixed(3));
      return `<path d="${wedgePath(i,v)}" class="wheelWedge" data-w="${i}" style="fill:${fill};" />`;
    }).join("");

    const labels = session.items.map((it,i)=> {
      const p = labelPos(i);
      const short = it.title.split(" - ")[0];
      return `<text x="${p.x}" y="${p.y}" text-anchor="middle" class="wheelLabel">${ctx.esc(short)}</text>`;
    }).join("");

    return `
      <svg class="wheelSvg" viewBox="0 0 240 240" role="img" aria-label="מעגל החיים">
        ${grid}
        <circle cx="${cx}" cy="${cy}" r="${rMax}" class="wheelOuter" />
        ${wedges}
        <circle cx="${cx}" cy="${cy}" r="2.5" class="wheelDot" />
        ${labels}
      </svg>
    `;
  };

  const getStore = (nowISO) => {
    const store = load({ sessions: [], active: null });
    const sessions = Array.isArray(store.sessions) ? store.sessions : [];
    let active = store.active || sessions[0] || defaultSession(nowISO);
    store.active = active;
    store.sessions = sessions;
    save(store);
    return { store, sessions: store.sessions, active: store.active };
  };

  const view = (ctx) => {
    const { store, sessions, active } = getStore(ctx.nowISO);

    const whichLabel = (active.mode === "future") ? "עתיד" : "הווה";
    const otherLabel = (active.mode === "future") ? "הווה" : "עתיד";

    const itemsHtml = active.items.map((it, idx) => `
      <div class="card lw-item" data-lw-idx="${idx}" style="margin-top:12px;">
        <div class="h2 lw-title">${ctx.esc(it.title)}</div>

        <div class="grid2" style="margin-top:8px;">
          <div class="lw-slider">
            ${ctx.sliderBlock("דירוג הווה", (typeof it.present==="number"? String(it.present):"בחר"), "life_p_"+idx, "")}
          </div>
          <div class="lw-slider">
            ${ctx.sliderBlock("דירוג עתיד", (typeof it.future==="number"? String(it.future):"בחר"), "life_f_"+idx, "")}
          </div>
        </div>

        <div class="smallNote" style="margin-top:10px;">תיאור הווה</div>
        <textarea class="input" data-life-pdesc="${idx}" placeholder="במילים קצרות...">${ctx.esc(it.presentDesc||"")}</textarea>

        <div class="smallNote" style="margin-top:10px;">תיאור עתיד</div>
        <textarea class="input" data-life-fdesc="${idx}" placeholder="איך הייתי רוצה שזה ייראה...">${ctx.esc(it.futureDesc||"")}</textarea>

        <div class="smallNote" style="margin-top:10px;">צעד קטן</div>
        <input class="input" data-life-step="${idx}" placeholder="משהו אחד שאפשר להתחיל ממנו" value="${ctx.esc(it.step||"")}" />
      </div>
    `).join("");

    const past = sessions.slice(0, 8).map(s => `
      <button class="btn" data-life-open="${ctx.esc(s.id)}"><span>${ctx.esc(ctx.formatDT(s.at))}</span><span>›</span></button>
    `).join("");

    return `
      <div class="card">
        ${ctx.cardHeader("מעגל החיים", "מסתכלים על התמונה הרחבה, ואז בוחרים כיוון וצעד אחד.")}
        <div class="rowBetween" style="gap:10px; flex-wrap:wrap;">
          <div class="smallNote">תצוגה: <b>${ctx.esc(whichLabel)}</b></div>
          <button class="btn ghost" id="life_toggle"><span>להציג ${ctx.esc(otherLabel)}</span></button>
        </div>

        <div style="margin-top:12px; display:flex; justify-content:center;">
          ${svg(ctx, active)}
        </div>

        ${itemsHtml}

        <div class="card" style="margin-top:12px;">
          <div class="h2">הערה כללית (אופציונלי)</div>
          <textarea class="input" id="life_note" placeholder="שורה או שתיים לסיכום...">${ctx.esc(active.note||"")}</textarea>
          <div class="hr"></div>
          <div class="grid2">
            <button class="btn btnPrimary" id="life_save"><span>שמור</span><span>✓</span></button>
            <button class="btn" id="life_save_new"><span>שמור כגרסה חדשה</span><span>+</span></button>
          </div>
        </div>

        ${past ? `<div class="hr"></div><div class="h2">שמירות קודמות</div>${past}` : ""}

        <button class="btn btnInline" id="life_home"><span>חזרה לבית</span><span>⌂</span></button>
      </div>
    `;
  };

  const bind = (ctx) => {
    if (ctx.ui.route !== "lifeWheel") return;

    const { store, sessions, active } = getStore(ctx.nowISO);

    const persist = (asNew) => {
      const snapshot = JSON.parse(JSON.stringify(active));
      snapshot.at = ctx.nowISO();
      if (asNew) snapshot.id = String(Date.now()) + "_v";
      const idx = sessions.findIndex(s => s.id === snapshot.id);
      if (idx >= 0) sessions[idx] = snapshot;
      else sessions.unshift(snapshot);
      store.sessions = sessions.slice(0, 30);
      store.active = snapshot;
      save(store);
      ctx.toast("נשמר");
      ctx.render();
    };

    document.getElementById("life_home")?.addEventListener("click", () => ctx.setRoute("home"));

    document.getElementById("life_toggle")?.addEventListener("click", () => {
      active.mode = (active.mode === "future") ? "present" : "future";
      store.active = active;
      save(store);
      ctx.render();
    });

    active.items.forEach((it, idx) => {
      const rp = document.getElementById(`life_p_${idx}_range`);
      const vp = document.getElementById(`life_p_${idx}`);
      const rf = document.getElementById(`life_f_${idx}_range`);
      const vf = document.getElementById(`life_f_${idx}`);

      if (typeof it.present === "number") rp.value = String(it.present);
      if (typeof it.future === "number") rf.value = String(it.future);

      rp?.addEventListener("input", () => {
        it.present = ctx.clamp(Number(rp.value),0,10);
        vp.textContent = String(it.present);
        store.active = active;
        save(store);
        ctx.render();
      });
      rf?.addEventListener("input", () => {
        it.future = ctx.clamp(Number(rf.value),0,10);
        vf.textContent = String(it.future);
        store.active = active;
        save(store);
        ctx.render();
      });

      const pd = document.querySelector(`[data-life-pdesc="${idx}"]`);
      const fd = document.querySelector(`[data-life-fdesc="${idx}"]`);
      const st = document.querySelector(`[data-life-step="${idx}"]`);

      pd?.addEventListener("input", () => { it.presentDesc = pd.value; store.active = active; save(store); });
      fd?.addEventListener("input", () => { it.futureDesc = fd.value; store.active = active; save(store); });
      st?.addEventListener("input", () => { it.step = st.value; store.active = active; save(store); });
    });

    document.getElementById("life_note")?.addEventListener("input", () => {
      active.note = document.getElementById("life_note").value;
      store.active = active;
      save(store);
    });

    document.getElementById("life_save")?.addEventListener("click", () => persist(false));
    document.getElementById("life_save_new")?.addEventListener("click", () => persist(true));

    document.querySelectorAll("[data-life-open]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-life-open");
        const found = sessions.find(s => s.id === id);
        if (found) {
          store.active = found;
          save(store);
          ctx.render();
        }
      });
    });
  };

  window.LifeWheel = { view, bind };
})();