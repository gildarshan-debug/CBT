// BUILD: baseline-lifeWheel-ticks-wedges-v1
/* OpenSense - PWA CBT micro-tools (Hebrew, RTL)
   - Local-only storage
   - 3 tools: Regulation, Thought Reality Check, Dilemma
   - History grouped by day with collapse
*/

(() => {
  // ---------- Utils ----------
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const esc = (s) => (s ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

  const nowISO = () => new Date().toISOString();
  const toLocal = (iso) => {
    const d = new Date(iso);
    // Israel locale display
    return {
      day: d.toLocaleDateString("he-IL", { weekday:"long", year:"numeric", month:"2-digit", day:"2-digit" }),
      time: d.toLocaleTimeString("he-IL", { hour:"2-digit", minute:"2-digit" }),
      dateKey: d.toLocaleDateString("he-IL", { year:"numeric", month:"2-digit", day:"2-digit" })
    };
  };

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const randInt = (a,b) => Math.floor(Math.random() * (b-a+1)) + a;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const LS_KEY = "opensense_v1";
  const loadState = () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return { history: [], antiRepeat: { reg: [], thought: [], dilemma: [] } };
      const parsed = JSON.parse(raw);
      return {
        history: Array.isArray(parsed.history) ? parsed.history : [],
        antiRepeat: parsed.antiRepeat || { reg: [], thought: [], dilemma: [] }
      };
    } catch {
      return { history: [], antiRepeat: { reg: [], thought: [], dilemma: [] } };
    }
  };
  const saveState = () => localStorage.setItem(LS_KEY, JSON.stringify(state));

  const state = loadState();

  // ---------- Content ----------
  // Regulation (Pressure/Overwhelm)
  const REG_EXERCISES = [
    { id:"breath46", title:"נשימה 4–6", intro:"תרגיל נשימה עם נשיפה ארוכה מהשאיפה.", how:"שאיפה 4 שניות, נשיפה 6 שניות. חזור 8 פעמים בקצב נוח." },
    { id:"box4444", title:"נשימת קופסה 4–4–4–4", intro:"תרגיל נשימה בקצב קבוע.", how:"שאיפה 4, החזקה 4, נשיפה 4, החזקה 4. חזור 4–6 סבבים." },
    { id:"doubleExhale", title:"נשיפה כפולה", intro:"תרגיל קצר שמתמקד בהארכת הנשיפה.", how:"שאיפה רגילה, שתי נשיפות קצרות ואז נשיפה ארוכה. חזור 6 פעמים." },
    { id:"noseOnly", title:"נשימה דרך האף", intro:"דקה של תשומת לב לקצב הנשימה.", how:"נשום לאט דרך האף. נסה שהנשיפה תהיה מעט ארוכה מהשאיפה." },
    { id:"hum", title:"נשיפה עם קול", intro:"תרגיל נשיפה שמשלב קול רציף.", how:"נשוף לאט עם “מממ” או “האאא”. חזור 8 פעמים." },
    { id:"ground54321", title:"קרקוע 5–4–3–2–1", intro:"התרגיל מפנה את הקשב למה שקורה סביבך דרך החושים.", how:"מצא 5 דברים שאתה רואה, 4 דברים שאתה מרגיש במגע, 3 קולות, 2 ריחות וטעם אחד." },
    { id:"feetGround", title:"כפות רגליים לקרקע", intro:"תרגיל קצר שמפנה את הקשב למגע עם הקרקע.", how:"שים לב למגע כפות הרגליים ברצפה ולמשקל הגוף. קח 6 נשימות בקצב נוח." },
    { id:"objectDescribe", title:"תיאור חפץ", intro:"הפנה את הקשב לפרטים שאפשר לראות ולתאר.", how:"בחר חפץ ותאר לעצמך 5 פרטים: צבע, צורה, מרקם, חומר ושימוש." },
    { id:"wideLook", title:"מבט רחב", intro:"תרגיל קצר של הפניית קשב לסביבה.", how:"העבר את המבט מצד לצד במשך 10 שניות. אחר כך בחר נקודה אחת וקח 3 נשימות." },
    { id:"countBack", title:"ספירה יורדת", intro:"תרגיל מיקוד פשוט.", how:"ספר לאחור מ־30 בקצב איטי. אם איבדת את הרצף, חזור למספר האחרון שאתה זוכר והמשך." },
    { id:"pmrMini", title:"הרפיית שרירים קצרה", intro:"כיווץ ושחרור מכוונים של כמה קבוצות שרירים.", how:"כווץ 5 שניות ושחרר 10: כפות ידיים, כתפיים, לסת ובטן." },
    { id:"shouldersDrop", title:"הורדת כתפיים", intro:"תרגיל קצר לכיווץ ושחרור הכתפיים.", how:"הרם כתפיים ל־3 שניות ושחרר לאט. חזור 5 פעמים." },
    { id:"jawRelax", title:"שחרור הלסת", intro:"הפנה את הקשב למתח באזור הלסת.", how:"פתח מעט את הפה, הנח את הלשון בנוחות ושחרר את הלסת למשך 30 שניות." },
    { id:"handPress", title:"לחיצת כפות ידיים", intro:"תרגיל שמתמקד בתחושת הלחץ והשחרור.", how:"הצמד כפות ידיים ולחץ 10 שניות. שחרר ל־10 שניות. חזור 5 פעמים." },
    { id:"stretchSlow", title:"מתיחה איטית", intro:"כמה מתיחות איטיות לצוואר, לכתפיים ולגב העליון.", how:"בצע מתיחה עדינה וקח 3 נשימות בכל תנוחה. אל תמתח עד כאב." },
    { id:"coldAnchor", title:"מים קרים", intro:"תרגיל קצר שמפנה את הקשב לתחושת הקור.", how:"העבר מים קרים על כפות הידיים במשך 20–30 שניות. אחר כך קח 3 נשימות איטיות." },
    { id:"sipWater", title:"שתייה איטית", intro:"פעולה פשוטה ואיטית שממקדת את הקשב.", how:"קח 5 לגימות מים באיטיות. בין לגימה ללגימה קח נשיפה ארוכה." },
    { id:"nameEmotion", title:"לתת שם למה שקורה", intro:"נסה לתאר במילה או שתיים את מה שאתה מרגיש כרגע.", how:"השלם לעצמך: “כרגע אני מרגיש...”. אין צורך להסביר או לפתור." },
    { id:"microTask", title:"פעולה של דקה", intro:"בחר פעולה קצרה ומוגדרת שאפשר לסיים עכשיו.", how:"למשל: לסדר דבר אחד, לשטוף פנים או לכתוב שורה. הקדש לה עד דקה." },
    { id:"worryTime", title:"לדחות את העיסוק בדאגה", intro:"אפשר לקבוע זמן מוגדר לחזור לדאגה במקום לעסוק בה כרגע.", how:"קבע זמן של 10 דקות מאוחר יותר. רשום בקצרה את הדאגה וחזור למה שעשית." },
    { id:"3min", title:"3 דקות מיקוד", intro:"שלוש דקות של הפניית קשב לנשימה, לגוף ולסביבה.", how:"דקה לנשימה, דקה לתחושות הגוף ודקה למה שאתה רואה ושומע סביבך." },
    { id:"miniWalk", title:"הליכה קצרה", intro:"שתי דקות של הליכה תוך תשומת לב לתנועה.", how:"לך במשך 2 דקות ושים לב למגע כף הרגל ברצפה ולקצב הנשימה." },
    { id:"safetyPhrase", title:"משפט עוגן", intro:"בחר משפט קצר שמתאר את המצב בלי להעצים אותו.", how:"למשל: “זה לא נעים, ואני יכול לבדוק מה אני צריך עכשיו.” חזור עליו כמה פעמים אם הוא מתאים לך." },
    { id:"twoChoices", title:"לצמצם לשתי אפשרויות", intro:"כשקשה לבחור, אפשר לצמצם את האפשרויות לשתיים.", how:"בחר בין דקה של נשימה לבין שתייה איטית. בצע אפשרות אחת." }
  ];

  // Thought reality-check prompts (general)
  const TH_QUESTIONS = [
    "מה העובדות שאני יודע/ת בוודאות? ומה זה פרשנות/ניחוש?",
    "איזה ראיות יש בעד? איזה ראיות יש נגד?",
    "אם חבר טוב היה אומר לי את זה—מה הייתי עונה לו?",
    "מה ההסבר האלטרנטיבי הסביר ביותר?",
    "מה ההשלכה הכי ריאלית (לא הכי מפחידה)?",
    "מה הצעד הקטן ביותר שאני יכול/ה לעשות עכשיו (לא לפתור הכול)?",
    "מה הייתי רוצה שיזכירו לי בעוד שבוע על הרגע הזה?",
    "איזו מחשבה יותר מאוזנת—גם אמיתית וגם מקדמת?"
  ];

  // Thought alternatives: general + topics
  const TH_ALTS = {
    general: [
      "מה עוד יכול להסביר את המצב?",
      "איזה חלק מהמחשבה הוא עובדה ואיזה חלק הוא פירוש?",
      "מה הייתי אומר לאדם אחר שהיה חושב כך?",
      "האם אני מתייחס לאפשרות כאילו היא ודאות?",
      "איזה מידע חסר לי לפני שאסיק מסקנה?",
      "מה ניסוח מדויק יותר של מה שאני יודע כרגע?"
    ],
    performance: [
      "מה נחשב מבחינתי ביצוע סביר, לא מושלם?",
      "מה המשמעות של טעות אחת בתוך התמונה המלאה?",
      "על איזה חלק בביצוע יש לי שליטה כרגע?",
      "באילו מצבים דומים כבר התמודדתי טוב יותר ממה שציפיתי?"
    ],
    relationships: [
      "מה אני יודע על הכוונה של האדם האחר, ומה אני מניח?",
      "איזו שאלה יכולה לתת לי מידע במקום לנחש?",
      "האם קיימים הסברים נוספים להתנהגות שלו?",
      "מה הייתי רוצה לומר לפני שאני מגיב?"
    ],
    health: [
      "מה אני יודע כרגע על התחושה, ומה אני מסיק ממנה?",
      "האם יש מידע אמין שתומך במסקנה שלי?",
      "מה הצעד המתאים לבדיקת המצב בלי להמשיך לנחש?",
      "האם אני מתייחס לתרחיש אפשרי כאילו כבר קרה?"
    ],
    money: [
      "אילו מספרים ועובדות יש לי כרגע?",
      "מה דורש החלטה עכשיו ומה יכול לחכות?",
      "איזה מידע חסר לי לפני החלטה?",
      "מה הפעולה המעשית הבאה שאפשר לבדוק?"
    ],
    selfWorth: [
      "האם אני מסיק מסקנה כללית על עצמי מאירוע אחד?",
      "אילו עובדות אינן מתיישבות עם המסקנה הזאת?",
      "איך הייתי מתאר את האירוע בלי להפוך אותו להגדרה של עצמי?",
      "מה ניסוח מדויק יותר של מה שקרה?"
    ]
  };

  // Dilemma framework (safe, non-diagnostic)
  const DILEMMA_PREFACES = [
    "בדוק מה ידוע, מה חשוב לך ומה עדיין חסר לפני החלטה.",
    "הפרד בין העובדות, החששות והאפשרויות שעומדות בפניך.",
    "בדוק אם אפשר להתחיל בצעד הפיך שייתן לך מידע נוסף."
  ];

  const DILEMMA_MICRO_STEPS = {
    work: [
      "לכתוב 3 שורות: מה הבעיה, מה המטרה, מה הצעד הראשון.",
      "לשלוח הודעת בירור אחת (ברורה וקצרה) במקום לנחש.",
      "לקבוע 15 דקות עבודה ממוקדת ואז להפסיק.",
      "לשבור משימה ל-2 חלקים ולסיים רק את הראשון."
    ],
    relationships: [
      "לנסח משפט פתיחה רגוע: “חשוב לי להבין…”.",
      "לשאול שאלה אחת במקום להאשים.",
      "להציע זמן לשיחה קצרה (10–15 דק׳) במקום שיחה אינסופית.",
      "לבדוק מה אני מבקש/ת בפועל (לא מה אני רוצה שיבינו לבד)."
    ],
    family: [
      "להגדיר גבול אחד ברור + דרך ביצוע (“אני יכול… ואני לא יכול…”).",
      "לבקש עזרה ספציפית (לא כללית): מי עושה מה ומתי.",
      "לתאם ציפיות מראש לפני אירוע/שיחה.",
      "להחליט על “תיקון קטן” במקום ריב גדול."
    ],
    health: [
      "לעשות 2 דקות ויסות (נשימה/קרקוע) ואז לבדוק עובדות.",
      "לקבוע כלל: לא גוגל ל-24 שעות; אם צריך—מקור אמין אחד.",
      "לרשום סימפטום + זמן + מה עוזר, כדי להחזיר שליטה.",
      "אם צריך—לקבוע תור/התייעצות במקום להחזיק חרדה לבד."
    ],
    money: [
      "לפתוח דף ולכתוב: הכנסות/הוצאות/חוב—רק מספרים.",
      "לסמן סעיף אחד לצמצום השבוע.",
      "לקבוע שיחה עם גורם מקצועי/בנק/יועץ.",
      "לבחור פעולה אחת שמייצרת סדר: מעקב 7 ימים."
    ]
  };

  const DILEMMA_LENSES = [
    { id:"values", title:"ערכים", hint:"מה חשוב לי פה באמת? (כבוד, שקט, יציבות, התקדמות…)" },
    { id:"facts", title:"עובדות מול ניחושים", hint:"מה אני יודע בוודאות ומה אני משלים בראש?" },
    { id:"cost", title:"מחיר ותועלת", hint:"אם אבחר A—מה המחיר ומה הרווח? ואם B—מה המחיר ומה הרווח?" },
    { id:"reversible", title:"צעד הפיך", hint:"מה צעד קטן שאני יכול לבדוק בלי התחייבות מלאה?" },
    { id:"communication", title:"שיחת בדיקה", hint:"איזו שאלה קצרה תיתן לי מידע במקום ניחוש?" }
  ];

  const TRIGGERS = [
    "עומס כללי", "לחץ בעבודה", "משפחה", "זוגיות", "בריאות", "כסף",
    "ביקורת/הערה", "אי־ודאות", "בדידות", "כעס", "עייפות", "אחר"
  ];

  // ---------- Anti-repeat ----------
  // Keep last N IDs per tool, avoid picking from that set.
  const ANTI_N = 7;
  const avoidPick = (toolKey, pool) => {
    const recent = state.antiRepeat?.[toolKey] || [];
    const candidates = pool.filter(x => !recent.includes(x.id));
    const chosen = candidates.length ? pick(candidates) : pick(pool);
    // update recent
    const next = [chosen.id, ...recent.filter(id => id !== chosen.id)].slice(0, ANTI_N);
    state.antiRepeat[toolKey] = next;
    saveState();
    return chosen;
  };

  // ---------- History ----------
  const addHistory = (entry) => {
    state.history.unshift(entry);
    // cap
    state.history = state.history.slice(0, 500);
    saveState();
  };

  const groupHistoryByDay = () => {
    const groups = new Map();
    for (const it of state.history) {
      const { dateKey, day } = toLocal(it.ts);
      if (!groups.has(dateKey)) groups.set(dateKey, { dateKey, dayLabel: day, items: [] });
      groups.get(dateKey).items.push(it);
    }
    // preserve order by newest first (state.history already sorted)
    return [...groups.values()];
  };

  // ---------- UI State ----------
  const ui = {
    route: "home",
    reg: {
      intensity: null, // must move slider
      count: 1,
      trigger: "עומס כללי",
      current: null
    },
    thought: {
      intensity: null,
      trigger: "עומס כללי",
      topic: "כללי",
      text: "",
      outputs: []
    },
    dilemma: {
      intensity: null,
      trigger: "עומס כללי",
      topic: "עבודה",
      text: "",
      output: null
    }
  };

  // ---------- Rendering ----------
  const setRoute = (r) => {
    ui.route = r;
    render();
    $$("button.navBtn, button.nav-btn, [data-route].navBtn, [data-route].nav-btn").forEach(b => b.classList.toggle("active", b.dataset.route === r));
  };

  const mountNav = () => {
    $$("button.navBtn, button.nav-btn, [data-route].navBtn, [data-route].nav-btn").forEach(btn => {
      btn.addEventListener("click", () => setRoute(btn.dataset.route));
    });
    // default active
    $$("button.navBtn, button.nav-btn, [data-route].navBtn, [data-route].nav-btn").forEach(b => b.classList.toggle("active", b.dataset.route === ui.route));
  };

  const app = $("#app");

  const cardHeader = (title, sub) => `
    <div class="rowBetween" style="margin-bottom:10px;">
      <div>
        <h2 class="h1">${esc(title)}</h2>
        ${sub ? `<p class="p">${esc(sub)}</p>` : ""}
      </div>
    </div>
  `;

  const sliderBlock = (label, valueText, id, note) => `
    <div class="sliderWrap">
      <div class="sliderTop">
        <div class="sliderLabel">${esc(label)}</div>
        <div class="sliderVal" id="${esc(id)}">${esc(valueText)}</div>
      </div>
      <input type="range" min="0" max="10" step="1" value="0" id="${esc(id)}_range" />
      <div class="rangeTicks" aria-hidden="true"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span></div>
      ${note ? `<div class="smallNote" style="margin-top:6px;">${esc(note)}</div>` : ""}
    </div>
  `;

  const selectBlock = (label, id, options, value) => `
    <div class="sliderWrap">
      <div class="sliderTop">
        <div class="sliderLabel">${esc(label)}</div>
      </div>
      <select class="input" id="${esc(id)}">
        ${options.map(o => `<option value="${esc(o)}"${o===value?' selected':''}>${esc(o)}</option>`).join("")}
      </select>
    </div>
  `;

  const homeView = () => `
    <div class="card">
      ${cardHeader("מה מתאים לך עכשיו?", "בחר את הכלי שמתאים למה שאתה רוצה לעבוד עליו.")}
      <div class="grid2">
        <button class="btn btnPrimary homeToolBtn" data-open="reg">
          <span class="homeToolText">
            <span class="homeToolTitle">לחץ/הצפה</span>
            <span class="p">תרגיל קצר להפחתת עוררות</span>
          </span>
          <span class="homeToolIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M4 14a8 8 0 1 1 16 0"/><path d="M12 12l3-3"/><path d="M6.5 18h11"/></svg>
          </span>
        </button>

        <button class="btn homeToolBtn" data-open="thought">
          <span class="homeToolText">
            <span class="homeToolTitle">מחשבה שלא עוזבת</span>
            <span class="p">בדיקה של המחשבה מול העובדות</span>
          </span>
          <span class="homeToolIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M9.5 4.5A3 3 0 0 0 6 8v.3A3.5 3.5 0 0 0 5 15a3 3 0 0 0 4.5 2.6"/><path d="M14.5 4.5A3 3 0 0 1 18 8v.3a3.5 3.5 0 0 1 1 6.7 3 3 0 0 1-4.5 2.6"/><path d="M12 4v16M8.5 10H12m3.5 4H12"/><path d="M7 21a5 5 0 0 0 8.7-2"/><path d="M7 21v-4h4"/></svg>
          </span>
        </button>

        <button class="btn homeToolBtn" data-open="dilemma">
          <span class="homeToolText">
            <span class="homeToolTitle">דילמה</span>
            <span class="p">בחינת האפשרויות לפני החלטה</span>
          </span>
          <span class="homeToolIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M6 3v5a4 4 0 0 0 4 4h8"/><path d="M14 8l4 4-4 4"/><path d="M6 21v-5a4 4 0 0 1 4-4"/></svg>
          </span>
        </button>

        <button class="btn homeToolBtn" data-open="journal">
          <span class="homeToolText">
            <span class="homeToolTitle">חשיפות</span>
            <span class="p">תיעוד תרגול וחשיפות</span>
          </span>
          <span class="homeToolIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M4 20h16"/><path d="M5 17h4v-4h4V9h4V5h3"/></svg>
          </span>
        </button>

        <button class="btn homeToolBtn" data-open="goal">
          <span class="homeToolText">
            <span class="homeToolTitle">מטרות</span>
            <span class="p">הגדרת מטרה ומעקב</span>
          </span>
          <span class="homeToolIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 12l7-7M16 5h3v3"/></svg>
          </span>
        </button>

        <button class="btn homeToolBtn" data-open="lifeWheel">
          <span class="homeToolText">
            <span class="homeToolTitle">מעגל החיים</span>
            <span class="p">מבט על תחומי החיים</span>
          </span>
          <span class="homeToolIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3v9h9M12 12l-6.4 6.4"/></svg>
          </span>
        </button>
      </div>

      <div class="hr"></div>
      <div class="kpi">
        <div class="kpiItem">
          <div class="kpiTitle">כמות אירועים בהיסטוריה</div>
          <div class="kpiValue">${state.history.length}</div>
        </div>
      </div>
    </div>

    <div class="card">
      ${cardHeader("משפט קטן לרגע הזה", "")}
      <p class="p">${esc(pick(REG_PREFACES))}</p>
    </div>
  `;

// ---------- Regulation ----------
  const regView = () => {
    const ex = ui.reg.current;
    return `
      <div class="card">
        ${cardHeader("לחץ / הצפה", "בחר תרגיל קצר והתמקד רק בו.")}
        <div class="stack">
          ${sliderBlock("עוצמה עכשיו (0–10)", ui.reg.intensity === null ? "0 – לא בחרתי" : `${ui.reg.intensity}`, "reg_int", "סמן את העוצמה שמתאימה כרגע.")}
          ${selectBlock("טריגר", "reg_trigger", TRIGGERS, ui.reg.trigger)}
          <div class="sliderWrap">
            <div class="sliderTop">
              <div class="sliderLabel">כמות אירועים לשמירה</div>
              <div class="sliderVal" id="reg_count_val">${ui.reg.count}</div>
            </div>
            <input type="range" min="1" max="10" step="1" value="${ui.reg.count}" id="reg_count" />
            <div class="smallNote" style="margin-top:6px;">אם עשית את התרגיל כמה פעמים—אפשר לשמור יותר מאירוע אחד.</div>
          </div>

          <button class="btn btnPrimary" id="reg_next">
            <span class="row" style="gap:10px;"><span>
                <div style="font-weight:900;">בחר תרגיל</div>
                <div class="p">יוצג תרגיל אחד</div>
              </span>
            </span>
            <span>›</span>
          </button>

          ${ex ? `
            <div class="card" style="background: rgba(255,255,255,.02); border-radius: 22px;">
              <div class="rowBetween" style="margin-bottom:8px;">
                <div style="font-weight:900; font-size:16px;">${esc(ex.title)}</div>
                <span class="tag tagStrong">ויסות</span>
              </div>
              <p class="p">${esc(ex.intro)}</p>
              <div class="hr"></div>
              <div style="font-weight:900; line-height:1.55;">${esc(ex.how)}</div>
              <div class="hr"></div>
              <div class="pillRow">
                <span class="tag">אנחנו איתך</span>
                <span class="tag">צעד קטן</span>
                <span class="tag">לא חייב מושלם</span>
              </div>
            </div>
          ` : `
            <div class="smallNote">אפשר להתחיל בקרקוע 5–4–3–2–1 או בתרגיל מים קרים.</div>
          `}

          <button class="btn btnInline" id="go_home"><span>חזרה לבית</span><span>⌂</span></button>
        </div>
      </div>

      <div class="card">
        ${cardHeader("שמירת התרגול", "אפשר לשמור את התרגול כדי לעקוב אחר דפוסים לאורך זמן.")}
        <button class="btn btnPrimary" id="reg_save">
          <span class="row" style="gap:10px;"><span>
              <div style="font-weight:900;">שמור וסיים</div>
              <div class="p">יישמר לפי שעה + יום + עוצמה + טריגר</div>
            </span>
          </span>
          <span>✓</span>
        </button>
        <div class="smallNote" style="margin-top:8px;">המידע נשמר רק במכשיר שלך (Local Storage).</div>
      </div>
    `;
  };

  const bindReg = () => {
    const r = $("#reg_int_range");
    const v = $("#reg_int");
    const triggerEl = $("#reg_trigger");
    const count = $("#reg_count");
    const countVal = $("#reg_count_val");

    // intensity must be moved
    r.addEventListener("input", () => {
      const n = Number(r.value);
      ui.reg.intensity = n; // now chosen
      v.textContent = `${n}`;
    });

    triggerEl.addEventListener("change", () => ui.reg.trigger = triggerEl.value);

    count.addEventListener("input", () => {
      ui.reg.count = Number(count.value);
      countVal.textContent = `${ui.reg.count}`;
    });

    $("#reg_next").addEventListener("click", () => {
      ui.reg.current = avoidPick("reg", REG_EXERCISES);
      render();
      // focus exercise title area
      setTimeout(() => window.scrollTo({ top: 0, behavior:"smooth" }), 80);
    });

    $("#reg_save").addEventListener("click", () => {
      if (ui.reg.intensity === null) {
        toast("רק רגע—תזיז/י את הסליידר כדי לבחור עוצמה.");
        return;
      }
      if (!ui.reg.current) {
        toast("בחר/י קודם תרגיל אחד.");
        return;
      }
      const entries = [];
      for (let i=0;i<ui.reg.count;i++){
        entries.push({
          ts: nowISO(),
          kind: "לחץ/הצפה",
          intensity: ui.reg.intensity,
          trigger: ui.reg.trigger,
          title: ui.reg.current.title,
          note: ui.reg.current.how
        });
      }
      entries.forEach(addHistory);
      toast("נשמר ✅");
      // reset small parts (keep trigger)
      ui.reg.current = null;
      ui.reg.count = 1;
      ui.reg.intensity = null;
      render();
    });

    $("#go_home").addEventListener("click", () => setRoute("home"));
  };

  // ---------- Thought ----------
  const topicOptionsThought = ["כללי", "ביצועים", "זוגיות", "בריאות", "כסף", "דימוי עצמי"];

  const thoughtView = () => {
    const outs = ui.thought.outputs || [];
    return `
      <div class="card">
        ${cardHeader("מחשבה שלא עוזבת", "כתוב את המחשבה ובדוק מה ידוע ומה אתה מניח.")}
        <div class="stack">
          ${sliderBlock("עוצמה עכשיו (0–10)", ui.thought.intensity === null ? "0 – לא בחרתי" : `${ui.thought.intensity}`, "th_int", "סמן את העוצמה שמתאימה כרגע.")}
          ${selectBlock("טריגר", "th_trigger", TRIGGERS, ui.thought.trigger)}
          ${selectBlock("נושא", "th_topic", topicOptionsThought, ui.thought.topic)}

          <textarea id="th_text" placeholder="כתוב/כתבי את המחשבה שמטרידה אותך… (משפט אחד מספיק)">${esc(ui.thought.text)}</textarea>

          <button class="btn btnPrimary" id="th_generate">
            <span class="row" style="gap:10px;"><span>
                <div style="font-weight:900;">בדיקת המחשבה</div>
                <div class="p">שאלת בדיקה וניסוחים אפשריים</div>
              </span>
            </span>
            <span>›</span>
          </button>

          ${outs.length ? `
            <div class="card" style="background: rgba(255,255,255,.02); border-radius: 22px;">
              <div style="font-weight:900; margin-bottom:8px;">בדיקת מציאות</div>
              <div class="p" style="margin-bottom:10px;">${esc(outs[0].reality)}</div>
              <div class="hr"></div>
              <div style="font-weight:900; margin-bottom:8px;">ניסוחים לבדיקה</div>
              ${outs[0].alts.map((a, idx) => `
                <button class="btn btnSmall" data-alt="${idx}">
                  <span class="row" style="gap:10px;"><span style="text-align:right;">
                      <div style="font-weight:900;">אפשרות ${idx+1}</div>
                      <div class="p">${esc(a)}</div>
                    </span>
                  </span>
                  <span>✓</span>
                </button>
              `).join("")}
              <div class="smallNote" style="margin-top:10px;">בחר ניסוח שמתאים לעובדות, או ערוך אותו בהמשך במילים שלך.</div>
            </div>
          ` : `
            <div class="smallNote">אפשר לכתוב גם משפט קצר בלבד.</div>
          `}

          <button class="btn btnInline" id="go_home2"><span>חזרה לבית</span><span>⌂</span></button>
        </div>
      </div>
    `;
  };

  const buildReality = (text) => {
    const q = pick(TH_QUESTIONS);
    const lead = "בוא נבדוק רגע: מחשבה היא לא עובדה. אנחנו מחפשים ניסוח מאוזן שמאפשר לפעול.";
    return `${lead} שאלה מנחה: ${q}  |  המחשבה: “${text.trim()}”`;
  };

  const topicToKey = (t) => {
    if (t === "כללי") return "general";
    if (t === "ביצועים") return "performance";
    if (t === "זוגיות") return "relationships";
    if (t === "בריאות") return "health";
    if (t === "כסף") return "money";
    if (t === "דימוי עצמי") return "selfWorth";
    return "general";
  };

  const uniquePickMany = (arr, k) => {
    const copy = [...arr];
    const out = [];
    while (copy.length && out.length < k) {
      const i = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(i,1)[0]);
    }
    return out;
  };

  const bindThought = () => {
    const r = $("#th_int_range");
    const v = $("#th_int");
    const triggerEl = $("#th_trigger");
    const topicEl = $("#th_topic");
    const textEl = $("#th_text");

    r.addEventListener("input", () => {
      ui.thought.intensity = Number(r.value);
      v.textContent = `${ui.thought.intensity}`;
    });
    triggerEl.addEventListener("change", () => ui.thought.trigger = triggerEl.value);
    topicEl.addEventListener("change", () => ui.thought.topic = topicEl.value);
    textEl.addEventListener("input", () => ui.thought.text = textEl.value);

    $("#th_generate").addEventListener("click", () => {
      if (ui.thought.intensity === null) { toast("רק רגע—תזיז/י את הסליידר כדי לבחור עוצמה."); return; }
      const t = (ui.thought.text || "").trim();
      if (!t) { toast("כתוב/כתבי מחשבה קצרה (משפט אחד מספיק)."); return; }

      // Build alternatives: combine general + topic
      const topicKey = topicToKey(ui.thought.topic);
      const pool = [...TH_ALTS.general, ...(TH_ALTS[topicKey] || [])]
        .map((s, idx) => ({ id: `${topicKey}_${idx}`, text: s }));

      // anti-repeat for thought: treat items as pool
      const recent = state.antiRepeat?.thought || [];
      const filtered = pool.filter(p => !recent.includes(p.id));
      const chosen = (filtered.length ? filtered : pool);
      const alts = uniquePickMany(chosen, 3).map(x => x.text);

      // update anti-repeat list with selected ids
      // rebuild from alts
      const altIds = alts.map(a => {
        const found = pool.find(p => p.text === a);
        return found ? found.id : `x_${Math.random()}`;
      });
      const next = [...altIds, ...recent].filter((v,i,a) => a.indexOf(v)===i).slice(0, ANTI_N);
      state.antiRepeat.thought = next;
      saveState();

      ui.thought.outputs = [{
        reality: buildReality(t),
        alts
      }];
      render();
    });

    $$("button[data-alt]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.alt);
        const outs = ui.thought.outputs?.[0];
        if (!outs) return;
        const chosenAlt = outs.alts[idx];

        addHistory({
          ts: nowISO(),
          kind: "מחשבה שלא עוזבת",
          intensity: ui.thought.intensity,
          trigger: ui.thought.trigger,
          title: ui.thought.text.trim().slice(0, 64),
          note: `בדיקת מציאות: ${outs.reality}\nחלופה שנבחרה: ${chosenAlt}\nנושא: ${ui.thought.topic}`
        });

        toast("נשמר ✅");
        // reset
        ui.thought.outputs = [];
        ui.thought.text = "";
        ui.thought.intensity = null;
        render();
      });
    });

    $("#go_home2").addEventListener("click", () => setRoute("home"));
  };

  // ---------- Dilemma ----------
  const dilemmaTopicOptions = ["עבודה", "זוגיות", "משפחה", "בריאות", "כסף"];

  const dilemmaView = () => {
    const out = ui.dilemma.output;
    return `
      <div class="card">
        ${cardHeader("דילמה", "בחן את האפשרויות ומה חשוב לך לפני החלטה.")}
        <div class="stack">
          ${sliderBlock("עוצמה עכשיו (0–10)", ui.dilemma.intensity === null ? "0 – לא בחרתי" : `${ui.dilemma.intensity}`, "di_int", "סמן את העוצמה שמתאימה כרגע.")}
          ${selectBlock("טריגר", "di_trigger", TRIGGERS, ui.dilemma.trigger)}
          ${selectBlock("תחום", "di_topic", dilemmaTopicOptions, ui.dilemma.topic)}
          <textarea id="di_text" placeholder="כתוב/כתבי בקצרה: מה הדילמה? (2–3 שורות)">${esc(ui.dilemma.text)}</textarea>

          <button class="btn btnPrimary" id="di_generate">
            <span class="row" style="gap:10px;"><span>
                <div style="font-weight:900;">בחינת הדילמה</div>
                <div class="p">שאלות בדיקה ואפשרות לצעד הבא</div>
              </span>
            </span>
            <span>›</span>
          </button>

          ${out ? `
            <div class="card" style="background: rgba(255,255,255,.02); border-radius: 22px;">
              <div class="rowBetween" style="margin-bottom:8px;">
                <div style="font-weight:900; font-size:16px;">כיוון פעולה</div>
                <span class="tag tagStrong">דילמה</span>
              </div>
              <p class="p">${esc(out.preface)}</p>
              <div class="hr"></div>
              <div style="font-weight:900; margin-bottom:6px;">שאלות שכדאי לבדוק</div>
              <div class="pillRow">
                ${out.lenses.map(l => `<span class="tag">${esc(l)}</span>`).join("")}
              </div>
              <div class="hr"></div>
              <div style="font-weight:900; margin-bottom:6px;">אפשרות לצעד הבא</div>
              <div style="line-height:1.55; font-weight:900;">${esc(out.step)}</div>
              <div class="smallNote" style="margin-top:10px;">
                אם יש כאן סיכון גבוה (בטיחות/אלימות/בריאות דחופה) — עדיף צעד שמערב גורם מקצועי/עזרה מיידית. האפליקציה לא מחליפה טיפול.
              </div>
              <div class="hr"></div>
              <button class="btn btnPrimary" id="di_save">
                <span class="row" style="gap:10px;"><span>
                    <div style="font-weight:900;">שמור וסיים</div>
                    <div class="p">דילמה + צעד קטן + עוצמה + טריגר</div>
                  </span>
                </span>
                <span>✓</span>
              </button>
            </div>
          ` : `
            <div class="smallNote">אפשר לבדוק קודם אם קיימת אפשרות הפיכה שאינה מחייבת החלטה מלאה.</div>
          `}

          <button class="btn btnInline" id="go_home3"><span>חזרה לבית</span><span>⌂</span></button>
        </div>
      </div>
    `;
  };

  const mapTopicKey = (t) => {
    if (t==="עבודה") return "work";
    if (t==="זוגיות") return "relationships";
    if (t==="משפחה") return "family";
    if (t==="בריאות") return "health";
    if (t==="כסף") return "money";
    return "work";
  };

  const buildDilemma = () => {
    const preface = pick(DILEMMA_PREFACES);
    const lenses = uniquePickMany(DILEMMA_LENSES, 3).map(l => `${l.title}: ${l.hint}`);
    const topicKey = mapTopicKey(ui.dilemma.topic);
    const steps = DILEMMA_MICRO_STEPS[topicKey] || DILEMMA_MICRO_STEPS.work;
    const step = pick(steps);
    return { preface, lenses, step };
  };

  const bindDilemma = () => {
    const r = $("#di_int_range");
    const v = $("#di_int");
    const triggerEl = $("#di_trigger");
    const topicEl = $("#di_topic");
    const textEl = $("#di_text");

    r.addEventListener("input", () => {
      ui.dilemma.intensity = Number(r.value);
      v.textContent = `${ui.dilemma.intensity}`;
    });
    triggerEl.addEventListener("change", () => ui.dilemma.trigger = triggerEl.value);
    topicEl.addEventListener("change", () => ui.dilemma.topic = topicEl.value);
    textEl.addEventListener("input", () => ui.dilemma.text = textEl.value);

    $("#di_generate").addEventListener("click", () => {
      if (ui.dilemma.intensity === null) { toast("רק רגע—תזיז/י את הסליידר כדי לבחור עוצמה."); return; }
      const t = (ui.dilemma.text || "").trim();
      if (!t) { toast("כתוב/כתבי 2–3 שורות על הדילמה."); return; }
      ui.dilemma.output = buildDilemma();
      render();
    });

    const saveBtn = $("#di_save");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        if (!ui.dilemma.output) return;

        addHistory({
          ts: nowISO(),
          kind: "דילמה",
          intensity: ui.dilemma.intensity,
          trigger: ui.dilemma.trigger,
          title: ui.dilemma.text.trim().slice(0, 64),
          note: `תחום: ${ui.dilemma.topic}\nדילמה: ${ui.dilemma.text.trim()}\nכיוון: ${ui.dilemma.output.preface}\nצעד קטן: ${ui.dilemma.output.step}\nעדשות: ${ui.dilemma.output.lenses.join(" | ")}`
        });

        toast("נשמר ✅");
        ui.dilemma.output = null;
        ui.dilemma.text = "";
        ui.dilemma.intensity = null;
        render();
      });
    }

    $("#go_home3").addEventListener("click", () => setRoute("home"));
  };

    // ---------- Long-term tools: Exposures (חשיפות) + Goals (מטרות) + Life Wheel (מעגל החיים) ----------
  const EXPOSURES_KEY = "opensense_exposures_v1";
  const GOALS_KEY = "opensense_goals_v1";
  const LIFEWHEEL_KEY = "opensense_life_v1";
  const APP_LOCK_KEY = "opensense_app_lock_v1";

  const loadJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  };
  const saveJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const getLockConfig = () => loadJSON(APP_LOCK_KEY, null);
  const makeSalt = () => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
  };
  const hashPin = async (pin, salt) => {
    const data = new TextEncoder().encode(`${salt}:${pin}`);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
  };
  const isValidPin = (pin) => /^\d{4,6}$/.test(pin);
  const verifyPin = async (pin, config = getLockConfig()) =>
    !!config && (await hashPin(pin, config.salt)) === config.hash;

  let appLocked = !!getLockConfig();

  let exposures = loadJSON(EXPOSURES_KEY, []);
  let goals = loadJSON(GOALS_KEY, []);
  let life = loadJSON(LIFEWHEEL_KEY, null);

  const exposuresView = () => `
    <div class="card">
      ${cardHeader("חשיפות", "תיעוד של תרגול, מצב ותגובה.")}
      <textarea id="exp_text" placeholder="כתוב כאן..."></textarea>
      <button class="btn btnPrimary" id="exp_save"><span>שמור</span><span>✓</span></button>
      <div class="hr"></div>
      ${exposures.length === 0 ? `<p class="p">עדיין אין רשומות.</p>` : exposures.slice(0, 30).map((e,i)=>`
        <div class="item">
          <div class="rowBetween">
            <div style="font-weight:900;">רשומה</div>
            <span class="tag tagStrong">${esc(formatDT(e.ts))}</span>
          </div>
          <div class="p" style="white-space:pre-wrap; margin-top:8px;">${esc(e.text)}</div>
          <button class="btn btnSmall btnDanger" data-exp-del="${i}" style="margin-top:10px;"><span>מחיקה</span><span>×</span></button>
        </div>
      `).join("")}
      <button class="btn btnInline" id="exp_home"><span>חזרה לבית</span><span>⌂</span></button>
    </div>
  `;

  const bindExposures = () => {
    if (ui.route !== "journal") return;
    $("#exp_home")?.addEventListener("click", () => setRoute("home"));
    $("#exp_save")?.addEventListener("click", () => {
      const t = ($("#exp_text")?.value || "").trim();
      if (!t) { toast("כתוב משהו קצר."); return; }
      exposures.unshift({ ts: nowISO(), text: t });
      exposures = exposures.slice(0, 200);
      saveJSON(EXPOSURES_KEY, exposures);
      toast("נשמר");
      render();
    });
    $$("[data-exp-del]").forEach(btn => btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-exp-del"));
      exposures.splice(idx, 1);
      saveJSON(EXPOSURES_KEY, exposures);
      toast("נמחק");
      render();
    }));
  };

  const goalsView = () => `
    <div class="card">
      ${cardHeader("מטרות", "הגדר מטרה, למה היא חשובה ומה הפעולה הראשונה.")}
      <input id="g_title" class="input" placeholder="מה המטרה?" />
      <textarea id="g_why" placeholder="למה זה חשוב לי?"></textarea>
      <input id="g_step" class="input" placeholder="פעולה ראשונה" />
      <button class="btn btnPrimary" id="g_add"><span>הוסף מטרה</span><span>+</span></button>
      <div class="hr"></div>
      ${goals.length === 0 ? `<p class="p">עדיין אין מטרות.</p>` : goals.slice(0, 50).map((g,i)=>`
        <div class="item">
          <div class="rowBetween">
            <div style="font-weight:900;">${esc(g.title)}</div>
            <span class="tag tagStrong">${g.done ? "בוצע" : "פעיל"}</span>
          </div>
          ${g.why ? `<div class="p" style="margin-top:8px;">${esc(g.why)}</div>` : ""}
          ${g.step ? `<div class="smallNote" style="margin-top:8px;">צעד: ${esc(g.step)}</div>` : ""}
          <div class="pillRow" style="margin-top:10px;">
            <button class="btn btnSmall" data-g-done="${i}"><span>${g.done ? "סמן כפעיל" : "סמן כבוצע"}</span><span>✓</span></button>
            <button class="btn btnSmall btnDanger" data-g-del="${i}"><span>מחיקה</span><span>×</span></button>
          </div>
        </div>
      `).join("")}
      <button class="btn btnInline" id="g_home"><span>חזרה לבית</span><span>⌂</span></button>
    </div>
  `;

  const bindGoals = () => {
    if (ui.route !== "goal") return;
    $("#g_home")?.addEventListener("click", () => setRoute("home"));
    $("#g_add")?.addEventListener("click", () => {
      const title = ($("#g_title")?.value || "").trim();
      if (!title) { toast("כתוב מטרה קצרה."); return; }
      const why = ($("#g_why")?.value || "").trim();
      const step = ($("#g_step")?.value || "").trim();
      goals.unshift({ ts: nowISO(), title, why, step, done:false });
      goals = goals.slice(0, 200);
      saveJSON(GOALS_KEY, goals);
      toast("נשמר");
      render();
    });
    $$("[data-g-del]").forEach(btn => btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-g-del"));
      goals.splice(idx,1);
      saveJSON(GOALS_KEY, goals);
      toast("נמחק");
      render();
    }));
    $$("[data-g-done]").forEach(btn => btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-g-done"));
      goals[idx].done = !goals[idx].done;
      saveJSON(GOALS_KEY, goals);
      render();
    }));
  };

  // Minimal Life Wheel (working + responsive wedges)
  const LIFE_DOMAINS = ["קריירה - תעסוקה","לימודים - השכלה","מצב כלכלי","תחביבים ופנאי","בריאות","זוגיות","משפחה","חברים","אחר"];
  const LIFE_COLORS = ["#7DD3FC","#A7F3D0","#FDE68A","#FBCFE8","#C4B5FD","#FDBA74","#93C5FD","#86EFAC","#D1D5DB"];

  const lifeDefault = () => ({
    id: String(Date.now()),
    at: nowISO(),
    mode: "present",
    items: LIFE_DOMAINS.map((title,i)=>({
      title, color: LIFE_COLORS[i],
      present: null, future: null,
      presentDesc:"", futureDesc:"", step:""
    }))
  });

  const rgbaFromHex = (hex, a) => {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };

  const lifeGet = () => {
    const obj = loadJSON(LIFEWHEEL_KEY, { sessions: [], active: null });
    if (!Array.isArray(obj.sessions)) obj.sessions = [];
    if (!obj.active) obj.active = obj.sessions[0] || lifeDefault();
    if (!Array.isArray(obj.active.items) || obj.active.items.length !== LIFE_DOMAINS.length) {
      obj.active = lifeDefault();
    }
    return obj;
  };

  const lifeSvg = (session) => {
    const which = (session.mode === "future") ? "future" : "present";
    const values = session.items.map(it => {
      const v = (which === "future") ? it.future : it.present;
      return (typeof v === "number" ? clamp(v,0,10) : 0);
    });
    const N = values.length, cx=120, cy=120, rMax=95;
    const toRad = (deg) => (deg*Math.PI)/180;
    const wedgePath = (i,val) => {
      const a0 = -90 + (360/N)*i;
      const a1 = -90 + (360/N)*(i+1);
      const r = (val/10)*rMax;
      const x0 = cx + r*Math.cos(toRad(a0));
      const y0 = cy + r*Math.sin(toRad(a0));
      const x1 = cx + r*Math.cos(toRad(a1));
      const y1 = cy + r*Math.sin(toRad(a1));
      return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`;
    };
    const grid = [2,4,6,8,10].map(v => `<circle cx="${cx}" cy="${cy}" r="${(v/10)*rMax}" class="wheelGrid" />`).join("");
    const wedges = values.map((v,i)=> {
      const col = session.items[i].color;
      const alpha = 0.12 + (0.70*(v/10));
      return `<path d="${wedgePath(i,v)}" class="wheelWedge" style="fill:${rgbaFromHex(col, alpha.toFixed(3))};" />`;
    }).join("");
    const labels = session.items.map((it,i)=>{ const angle = -90 + (360/N)*(i+0.5); const rr = 112; const x = cx + rr*Math.cos(toRad(angle)); const y = cy + rr*Math.sin(toRad(angle)); const short = it.title.split(" - ")[0]; return `<text x="${x}" y="${y}" text-anchor="middle" class="wheelLabel">${esc(short)}</text>`; }).join("");
    return `<svg class="wheelSvg" viewBox="0 0 240 240">${grid}<circle cx="${cx}" cy="${cy}" r="${rMax}" class="wheelOuter" />${wedges}<circle cx="${cx}" cy="${cy}" r="2.5" class="wheelDot" />${labels}</svg>`;
  };

  const lifeWheelView = () => {
    const obj = lifeGet();
    const active = obj.active;

    const whichLabel = (active.mode === "future") ? "עתיד" : "הווה";
    const otherLabel = (active.mode === "future") ? "הווה" : "עתיד";

    const itemsHtml = active.items.map((it, idx) => `
      <div class="card lw-item" data-lw-idx="${idx}" style="margin-top:12px;">
        <div class="h2 lw-title">${esc(it.title)}</div>

        <div class="grid2" style="margin-top:8px;">
          <div class="lw-slider">${sliderBlock("דירוג הווה", (typeof it.present==="number"? String(it.present):"בחר"), "life_p_"+idx, "")}</div>
          <div class="lw-slider">${sliderBlock("דירוג עתיד", (typeof it.future==="number"? String(it.future):"בחר"), "life_f_"+idx, "")}</div>
        </div>

        <div class="smallNote" style="margin-top:10px;">תיאור הווה</div>
        <textarea class="input" data-life-pdesc="${idx}" placeholder="במילים קצרות...">${esc(it.presentDesc||"")}</textarea>

        <div class="smallNote" style="margin-top:10px;">תיאור עתיד</div>
        <textarea class="input" data-life-fdesc="${idx}" placeholder="איך הייתי רוצה שזה ייראה...">${esc(it.futureDesc||"")}</textarea>

        <div class="smallNote" style="margin-top:10px;">פעולה אפשרית</div>
        <input class="input" data-life-step="${idx}" placeholder="מה אפשר לעשות מכאן?" value="${esc(it.step||"")}" />
      </div>
    `).join("");

    return `
      <div class="card">
        ${cardHeader("מעגל החיים", "דרג את המצב כיום ואת המצב שאליו היית רוצה להגיע.")}
        <div class="rowBetween" style="gap:10px; flex-wrap:wrap;">
          <div class="smallNote">תצוגה: <b>${esc(whichLabel)}</b></div>
          <button class="btn ghost" id="life_toggle"><span>להציג ${esc(otherLabel)}</span></button>
        </div>
        <div style="margin-top:12px; display:flex; justify-content:center;">
          ${lifeSvg(active)}
        </div>
        ${itemsHtml}
        <button class="btn btnInline" id="life_home"><span>חזרה לבית</span><span>⌂</span></button>
      </div>
    `;
  };

  const bindLifeWheel = () => {
    if (ui.route !== "lifeWheel") return;
    const obj = lifeGet();
    const active = obj.active;

    const saveLife = () => {
      obj.active = active;
      saveJSON(LIFEWHEEL_KEY, obj);
    };

    $("#life_home")?.addEventListener("click", () => setRoute("home"));
    $("#life_toggle")?.addEventListener("click", () => {
      active.mode = (active.mode === "future") ? "present" : "future";
      saveLife();
      render();
    });

    active.items.forEach((it, idx) => {
      const rp = $(`#life_p_${idx}_range`);
      const vp = $(`#life_p_${idx}`);
      const rf = $(`#life_f_${idx}_range`);
      const vf = $(`#life_f_${idx}`);

      if (rp && typeof it.present === "number") rp.value = String(it.present);
      if (rf && typeof it.future === "number") rf.value = String(it.future);

      rp?.addEventListener("input", () => {
        it.present = clamp(Number(rp.value),0,10);
        vp.textContent = String(it.present);
        saveLife();
        render();
      });
      rf?.addEventListener("input", () => {
        it.future = clamp(Number(rf.value),0,10);
        vf.textContent = String(it.future);
        saveLife();
        render();
      });

      const pd = $$(`[data-life-pdesc="${idx}"]`)[0];
      const fd = $$(`[data-life-fdesc="${idx}"]`)[0];
      const st = $$(`[data-life-step="${idx}"]`)[0];
      pd?.addEventListener("input", () => { it.presentDesc = pd.value; saveLife(); });
      fd?.addEventListener("input", () => { it.futureDesc = fd.value; saveLife(); });
      st?.addEventListener("input", () => { it.step = st.value; saveLife(); });
    });
  };

// ---------- History view ----------
  const historyView = () => {
    const groups = groupHistoryByDay();
    const total = state.history.length;

    return `
      <div class="card">
        ${cardHeader("היסטוריה", "תרגולים שנשמרו לפי תאריך ושעה.")}
        <div class="kpi">
          <div class="kpiItem">
            <div class="kpiTitle">סה״כ אירועים</div>
            <div class="kpiValue">${total}</div>
          </div>
          <div class="kpiItem">
            <div class="kpiTitle">ימים עם נתונים</div>
            <div class="kpiValue">${groups.length}</div>
          </div>
        </div>
        <div class="hr"></div>

        ${total === 0 ? `
          <p class="p">עדיין לא נשמרו תרגולים.</p>
        ` : `
          <button class="btn btnDanger" id="clear_history">
            <span class="row" style="gap:10px;"><span>
                <div style="font-weight:900;">מחיקת היסטוריה</div>
                <div class="p">מוחק רק מהמכשיר שלך</div>
              </span>
            </span>
            <span>!</span>
          </button>

          ${groups.map((g, idx) => {
            const avg = Math.round(g.items.reduce((s,x)=>s+(Number(x.intensity)||0),0) / g.items.length);
            return `
              <div class="historyGroup">
                <button class="historyHead" data-idx="${idx}">
                  <div>
                    <div class="historyHeadTitle">${esc(g.dayLabel)}</div>
                    <div class="historyHeadMeta">${g.items.length} אירועים • עוצמה ממוצעת: ${isFinite(avg)?avg:0}</div>
                  </div>
                  <div>▾</div>
                </button>
                <div class="historyBody" id="hg_${idx}">
                  ${g.items.map(it => {
                    const t = toLocal(it.ts);
                    return `
                      <div class="item">
                        <div class="rowBetween">
                          <div style="font-weight:900;">${esc(it.kind)}</div>
                          <span class="tag tagStrong">${esc(t.time)}</span>
                        </div>
                        <div class="pillRow" style="margin-top:8px;">
                          <span class="tag">עוצמה: ${esc(it.intensity)}</span>
                          <span class="tag">טריגר: ${esc(it.trigger)}</span>
                        </div>
                        <div class="hr"></div>
                        <div style="font-weight:900; margin-bottom:6px;">${esc(it.title || "")}</div>
                        <div class="p" style="white-space:pre-wrap;">${esc(it.note || "")}</div>
                      </div>
                    `;
                  }).join("")}
                </div>
              </div>
            `;
          }).join("")}
        `}
      </div>
    `;
  };

  const bindHistory = () => {
    const clear = $("#clear_history");
    if (clear) {
      clear.addEventListener("click", () => {
        if (!confirm("למחוק את כל ההיסטוריה מהמכשיר?")) return;
        state.history = [];
        saveState();
        toast("נמחק ✅");
        render();
      });
    }
    $$("button.historyHead").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = btn.dataset.idx;
        const body = $(`#hg_${idx}`);
        body.classList.toggle("open");
      });
    });
  };


  // ---------- Insights view ----------
  const parseNoteValue = (note, label) => {
    if (!note) return "";
    const lines = String(note).split(/\r?\n/);
    const line = lines.find(l => l.trim().startsWith(label));
    if (!line) return "";
    return line.slice(label.length).trim();
  };

  const dayKeyFromISO = (iso) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("he-IL", { year:"numeric", month:"2-digit", day:"2-digit" });
  };

  const computeInsights = () => {
    const events = state.history || [];
    const total = events.length;

    const kindCount = new Map();
    const triggerCount = new Map();
    const choiceCount = new Map(); // repeating saved choice (exercise title / chosen alt / dilemma step)
    const days = new Set();

    const now = new Date();
    const endLast7 = new Date(now); endLast7.setHours(23,59,59,999);
    const startLast7 = new Date(endLast7); startLast7.setDate(startLast7.getDate() - 6); startLast7.setHours(0,0,0,0);

    const endPrev7 = new Date(startLast7.getTime() - 1);
    const startPrev7 = new Date(endPrev7); startPrev7.setDate(startPrev7.getDate() - 6); startPrev7.setHours(0,0,0,0);

    const last7Int = [];
    const prev7Int = [];

    for (const it of events) {
      if (!it || !it.ts) continue;
      days.add(dayKeyFromISO(it.ts));

      const kind = it.kind || "לא ידוע";
      kindCount.set(kind, (kindCount.get(kind) || 0) + 1);

      const trig = it.trigger || "";
      if (trig) triggerCount.set(trig, (triggerCount.get(trig) || 0) + 1);

      const d = new Date(it.ts);
      const inten = Number(it.intensity);
      if (!isNaN(d.getTime()) && Number.isFinite(inten)) {
        if (d >= startLast7 && d <= endLast7) last7Int.push(inten);
        else if (d >= startPrev7 && d <= endPrev7) prev7Int.push(inten);
      }

      // Repeating "what helps" proxy:
      // - Regulation: title is the exercise
      // - Thought: parse "חלופה שנבחרה:"
      // - Dilemma: parse "צעד קטן:"
      let key = "";
      if (kind === "לחץ/הצפה") key = (it.title || "").trim();
      else if (kind === "מחשבה שלא עוזבת") key = parseNoteValue(it.note, "חלופה שנבחרה:");
      else if (kind === "דילמה") key = parseNoteValue(it.note, "צעד קטן:");
      if (key) choiceCount.set(key, (choiceCount.get(key) || 0) + 1);
    }

    const avg = (arr) => arr.length ? (arr.reduce((s,x)=>s+x,0) / arr.length) : null;

    const topN = (map, n=3) => [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,n);

    return {
      total,
      daysCount: days.size,
      avgLast7: avg(last7Int),
      avgPrev7: avg(prev7Int),
      topKinds: topN(kindCount, 3),
      topTriggers: topN(triggerCount, 3),
      topChoices: topN(choiceCount, 3)
    };
  };

  const fmt = (n, digits=1) => (n==null || !isFinite(n)) ? "—" : Number(n).toFixed(digits);

  const insightsView = () => {
    const ins = computeInsights();

    const delta = (ins.avgLast7!=null && ins.avgPrev7!=null) ? (ins.avgLast7 - ins.avgPrev7) : null;
    const deltaLine = (delta==null || !isFinite(delta))
      ? "אין מספיק נתונים להשוואה (צריך לפחות כמה אירועים בשני השבועות)."
      : (Math.abs(delta) < 0.05)
        ? "נראה שהעוצמה יציבה (שינוי מזערי)."
        : (delta < 0)
          ? `בשבוע האחרון העוצמה הממוצעת ירדה ב־${fmt(Math.abs(delta),1)} נק׳.`
          : `בשבוע האחרון העוצמה הממוצעת עלתה ב־${fmt(delta,1)} נק׳.`;

    const renderTop = (items, emptyText) => {
      if (!items || !items.length) return `<div class="smallNote">${esc(emptyText)}</div>`;
      return `
        <ol class="p" style="margin:0; padding-inline-start:18px;">
          ${items.map(([k,v]) => `<li><span style="font-weight:900;">${esc(k)}</span> <span class="smallNote">(${v})</span></li>`).join("")}
        </ol>
      `;
    };

    return `
      <div class="card">
        ${cardHeader("תובנות", "סיכום נתונים מהתרגולים ששמרת במכשיר.")}
        <div class="kpi">
          <div class="kpiItem">
            <div class="kpiTitle">סה״כ אירועים</div>
            <div class="kpiValue">${ins.total}</div>
          </div>
          <div class="kpiItem">
            <div class="kpiTitle">ימים עם נתונים</div>
            <div class="kpiValue">${ins.daysCount}</div>
          </div>
        </div>

        <div class="hr"></div>

        <div class="item">
          <div style="font-weight:900; margin-bottom:6px;">עוצמה ממוצעת</div>
          <div class="p">7 ימים אחרונים: <span style="font-weight:900;">${fmt(ins.avgLast7,1)}</span> • 7 ימים קודמים: <span style="font-weight:900;">${fmt(ins.avgPrev7,1)}</span></div>
          <div class="smallNote" style="margin-top:6px;">${esc(deltaLine)}</div>
        </div>

        <div class="hr"></div>

        <div class="grid2">
          <div class="item">
            <div style="font-weight:900; margin-bottom:6px;">הכלי הכי בשימוש</div>
            ${renderTop(ins.topKinds, "עדיין אין מספיק נתונים.")}
          </div>
          <div class="item">
            <div style="font-weight:900; margin-bottom:6px;">טריגרים חוזרים</div>
            ${renderTop(ins.topTriggers, "לא נשמרו טריגרים מספיק כדי לזהות מגמה.")}
          </div>
        </div>

        <div class="hr"></div>

        <div class="item">
          <div style="font-weight:900; margin-bottom:6px;">בחירות שחוזרות בתרגולים</div>
          <div class="smallNote" style="margin-bottom:8px;">הנתונים מציגים חזרות בלבד ואינם מהווים אבחון.</div>
          ${renderTop(ins.topChoices, "עדיין אין בחירות שחוזרות מספיק כדי להציג כאן.")}
        </div>

        <div class="hr"></div>
        <div class="smallNote">
          שינוי בעוצמה הוא נתון למעקב. כדאי לבחון אותו לצד מספר התרגולים והמצבים שבהם השתמשת באפליקציה.
        </div>
      </div>
    `;
  };

  // ---------- App lock ----------
  const lockView = () => `
    <div class="lockScreen">
      <div class="card lockCard">
        <div class="lockIcon" aria-hidden="true">🔒</div>
        <h1 class="h1">האפליקציה נעולה</h1>
        <p class="p">יש להזין את הקוד האישי כדי להמשיך.</p>
        <form id="unlock_form" class="stack" autocomplete="off">
          <input
            id="unlock_pin"
            class="input lockPin"
            type="password"
            inputmode="numeric"
            pattern="[0-9]*"
            minlength="4"
            maxlength="6"
            placeholder="קוד בן 4–6 ספרות"
            aria-label="קוד אישי"
            autofocus
          />
          <div id="unlock_error" class="lockError" role="alert" aria-live="polite"></div>
          <button class="btn btnPrimary" type="submit"><span>פתיחת האפליקציה</span><span>🔓</span></button>
        </form>
      </div>
    </div>
  `;

  const bindLockScreen = () => {
    const form = $("#unlock_form");
    const pinInput = $("#unlock_pin");
    const error = $("#unlock_error");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const pin = pinInput?.value || "";
      if (!isValidPin(pin)) {
        error.textContent = "יש להזין קוד בן 4–6 ספרות.";
        return;
      }
      if (!(await verifyPin(pin))) {
        error.textContent = "הקוד שגוי. אפשר לנסות שוב.";
        pinInput.value = "";
        pinInput.focus();
        return;
      }
      appLocked = false;
      render();
      toast("האפליקציה נפתחה");
    });
  };

  const bindPrivacyLock = () => {
    const config = getLockConfig();
    const current = $("#lock_current");
    const next = $("#lock_new");
    const confirmPin = $("#lock_confirm");
    const status = $("#lock_status");

    $("#lock_save")?.addEventListener("click", async () => {
      const newPin = next?.value || "";
      const confirmation = confirmPin?.value || "";
      if (config && !(await verifyPin(current?.value || "", config))) {
        status.textContent = "הקוד הנוכחי שגוי.";
        return;
      }
      if (!isValidPin(newPin)) {
        status.textContent = "הקוד החדש צריך להכיל 4–6 ספרות.";
        return;
      }
      if (newPin !== confirmation) {
        status.textContent = "הקודים החדשים אינם תואמים.";
        return;
      }
      const salt = makeSalt();
      saveJSON(APP_LOCK_KEY, { salt, hash: await hashPin(newPin, salt) });
      appLocked = false;
      toast(config ? "הקוד הוחלף" : "הנעילה הופעלה");
      render();
    });

    $("#lock_remove")?.addEventListener("click", async () => {
      if (!(await verifyPin(current?.value || "", config))) {
        status.textContent = "הקוד הנוכחי שגוי.";
        return;
      }
      localStorage.removeItem(APP_LOCK_KEY);
      appLocked = false;
      toast("הנעילה הוסרה");
      render();
    });

    $("#lock_now")?.addEventListener("click", () => {
      appLocked = true;
      render();
    });
  };

  // ---------- Privacy view ----------
  const privacyView = () => {
    const lockEnabled = !!getLockConfig();
    return `
    <div class="card">
      ${cardHeader("פרטיות", "הנתונים נשמרים במכשיר בלבד.")}
      <div class="stack">
        <div class="item">
          <div class="rowBetween">
            <div style="font-weight:900;">נעילת האפליקציה</div>
            <span class="tag tagStrong">${lockEnabled ? "פעילה" : "לא פעילה"}</span>
          </div>
          <p class="p" style="margin-top:8px;">קוד אישי בן 4–6 ספרות יידרש בפתיחת האפליקציה ובחזרה אליה לאחר מעבר לרקע.</p>
          ${lockEnabled ? `
            <input id="lock_current" class="input lockPin" type="password" inputmode="numeric" maxlength="6" placeholder="הקוד הנוכחי" autocomplete="off" />
          ` : ""}
          <input id="lock_new" class="input lockPin" type="password" inputmode="numeric" maxlength="6" placeholder="${lockEnabled ? "קוד חדש" : "בחירת קוד"}" autocomplete="new-password" />
          <input id="lock_confirm" class="input lockPin" type="password" inputmode="numeric" maxlength="6" placeholder="הקלדת הקוד שוב" autocomplete="new-password" />
          <div id="lock_status" class="lockError" role="alert" aria-live="polite"></div>
          <div class="pillRow" style="margin-top:10px;">
            <button class="btn btnSmall btnPrimary" id="lock_save"><span>${lockEnabled ? "החלפת קוד" : "הפעלת נעילה"}</span><span>🔒</span></button>
            ${lockEnabled ? `
              <button class="btn btnSmall" id="lock_now"><span>נעילה עכשיו</span><span>🔒</span></button>
              <button class="btn btnSmall btnDanger" id="lock_remove"><span>הסרת נעילה</span><span>×</span></button>
            ` : ""}
          </div>
          <div class="smallNote" style="margin-top:10px;">הקוד אינו נשלח לשום מקום. אם הוא נשכח, אין אפשרות לשחזר אותו מתוך האפליקציה.</div>
        </div>
        <div class="item">
          <div style="font-weight:900; margin-bottom:6px;">איפה הנתונים נשמרים?</div>
          <div class="p">רק במכשיר שלך (Local Storage). אין שרת. אין חשבון. אין שליחה לענן.</div>
        </div>
        <div class="item">
          <div style="font-weight:900; margin-bottom:6px;">מי יכול לראות?</div>
          <div class="p">מי שיש לו גישה פיזית למכשיר פתוח. לכן כדאי לשמור את הטלפון נעול.</div>
        </div>
        <div class="item">
          <div style="font-weight:900; margin-bottom:6px;">מה האפליקציה לא עושה?</div>
          <div class="p">היא לא מאבחנת ולא מחליפה טיפול. היא נותנת כלים קצרים ומעקב עצמי.</div>
        </div>
      </div>
    </div>
  `;
  };

  // ---------- Toast ----------
  let toastTimer = null;
  const toast = (msg) => {
    let el = $("#toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.style.position = "fixed";
      el.style.left = "12px";
      el.style.right = "12px";
      el.style.bottom = "92px";
      el.style.maxWidth = "720px";
      el.style.margin = "0 auto";
      el.style.zIndex = "50";
      el.style.padding = "12px 14px";
      el.style.borderRadius = "16px";
      el.style.border = "1px solid rgba(255,255,255,.12)";
      el.style.background = "rgba(15,26,51,.92)";
      el.style.backdropFilter = "blur(10px)";
      el.style.boxShadow = "0 18px 50px rgba(0,0,0,.35)";
      el.style.color = "#eaf1ff";
      el.style.fontWeight = "800";
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      el.style.transition = "opacity .18s ease, transform .18s ease";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
    }, 2200);
  };

  // ---------- Main render ----------
  const render = () => {
    if (!app) return;

    if (appLocked && getLockConfig()) {
      document.body.classList.add("appLocked");
      const bottomNav = $(".bottomNav");
      if (bottomNav) bottomNav.style.display = "none";
      app.innerHTML = lockView();
      bindLockScreen();
      return;
    }
    document.body.classList.remove("appLocked");
    const bottomNav = $(".bottomNav");
    if (bottomNav) bottomNav.style.removeProperty("display");

    let html = "";
    if (ui.route === "home") html = homeView();
    if (ui.route === "reg") html = regView();
    if (ui.route === "thought") html = thoughtView();
    if (ui.route === "dilemma") html = dilemmaView();
    if (ui.route === "history") html = historyView();
    if (ui.route === "privacy") html = privacyView();
    if (ui.route === "insights") html = insightsView();
    if (ui.route === "journal") html = exposuresView();
    if (ui.route === "goal") html = goalsView();
    if (ui.route === "lifeWheel") html = lifeWheelView();

    app.innerHTML = html;

    // Bind home buttons
    $$("[data-open]").forEach(b => b.addEventListener("click", () => {
      const r = b.getAttribute("data-open");
      if (r) setRoute(r);
    }));

    // Bind route-specific
    if (ui.route === "reg") bindReg();
    if (ui.route === "thought") bindThought();
    if (ui.route === "dilemma") bindDilemma();
    if (ui.route === "history") bindHistory();
    if (ui.route === "privacy") bindPrivacyLock();
    if (ui.route === "journal") bindExposures();
    if (ui.route === "goal") bindGoals();
    if (ui.route === "lifeWheel") bindLifeWheel();
  };

  // ---------- Splash + Service Worker ----------
  const hideSplashSoon = () => {
    const s = $("#splash");
    if (!s) return;
    setTimeout(() => s.classList.add("hide"), 550);
  };

  const registerSW = async () => {
    try {
      if ("serviceWorker" in navigator) {
        // Keep a single canonical service worker entry-point.
        await navigator.serviceWorker.register("./sw.js");
      }
    } catch {
      // ignore
    }
  };

  // ---------- Boot ----------
  const boot = () => {
    mountNav();
    render();
    hideSplashSoon();
    registerSW();
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && getLockConfig()) {
      appLocked = true;
    }
  });

  document.addEventListener("DOMContentLoaded", boot);
})();
