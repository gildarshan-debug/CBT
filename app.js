// BUILD: 2026-01-04-uidfix3
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
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
  
  const formatDT = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('he-IL', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
    } catch { return String(iso||''); }
  };
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


  // ---------- Lock (Local-only) ----------
  const LOCK_KEY = "opensense_lock_v1";
  const loadLock = () => {
    try {
      const raw = localStorage.getItem(LOCK_KEY);
      if (!raw) return { enabled: false, hash: "", timeoutMin: 1, lastActive: Date.now() };
      const o = JSON.parse(raw);
      return {
        enabled: !!o.enabled,
        hash: String(o.hash || ""),
        timeoutMin: Number.isFinite(Number(o.timeoutMin)) ? Number(o.timeoutMin) : 1,
        lastActive: Number.isFinite(Number(o.lastActive)) ? Number(o.lastActive) : Date.now()
      };
    } catch {
      return { enabled: false, hash: "", timeoutMin: 1, lastActive: Date.now() };
    }
  };
  const saveLock = () => localStorage.setItem(LOCK_KEY, JSON.stringify(lock));
  const lock = loadLock();

  const lockState = {
    isLocked: false,
    pendingRoute: null
  };

  const sha256Hex = async (text) => {
    const enc = new TextEncoder();
    const buf = enc.encode(String(text));
    const digest = await crypto.subtle.digest("SHA-256", buf);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const pinValid = (pin) => /^\d{4}$/.test(String(pin || "").trim());

  const lockNow = () => {
    lockState.isLocked = true;
    lockState.pendingRoute = ui.route || "home";
    ui.route = "lock";
    render();
  };

  const unlockNow = () => {
    lockState.isLocked = false;
    const next = lockState.pendingRoute || "home";
    lockState.pendingRoute = null;
    ui.route = next;
    touchActive();
    render();
  };

  const touchActive = () => {
    lock.lastActive = Date.now();
    saveLock();
  };

  const shouldAutoLock = () => {
    if (!lock.enabled || !lock.hash) return false;
    const t = Number(lock.timeoutMin);
    if (!Number.isFinite(t) || t <= 0) return false; // 0 = no auto-lock
    return (Date.now() - Number(lock.lastActive || 0)) > t * 60 * 1000;
  };

  const clearAllLocalData = () => {
    // Removes all app content + lock config
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LOCK_KEY);
  };
  const state = loadState();

  // ---------- Content ----------
  // Regulation (Pressure/Overwhelm)
  const REG_EXERCISES = [
    { id:"breath46", title:"נשימה 4–6", intro:"אנחנו מכוונים את מערכת העצבים בעדינות. גם אם זה לא מרגיע מיד—זה מתחיל להזיז את הגוף לכיוון בטוח.", how:"שאיפה 4 שניות, נשיפה 6 שניות. חזור 8 פעמים בקצב רגוע." },
    { id:"box4444", title:"נשימת קופסה 4–4–4–4", intro:"זה תרגיל שעוזר לייצב קצב ולהחזיר תחושת שליטה. תן לעצמך להיות “בסדר” גם אם זה לא מושלם.", how:"שאיפה 4, החזקה 4, נשיפה 4, החזקה 4. חזור 4–6 סבבים." },
    { id:"doubleExhale", title:"נשיפה כפולה", intro:"נשיפה ארוכה משדרת למוח: “אין סכנה כרגע”. נעשה את זה קצר ופשוט.", how:"שאיפה רגילה, שתי נשיפות קצרות ואז נשיפה ארוכה. חזור 6 פעמים." },
    { id:"noseOnly", title:"נשימה דרך האף", intro:"המטרה היא להאט בלי להילחם בתחושה. רק להכניס מעט סדר לנשימה.", how:"דקה של נשימות איטיות דרך האף בלבד. תן לנשיפה להיות מעט ארוכה מהשאיפה." },
    { id:"hum", title:"נשיפה עם קול", intro:"הקול עוזר לגוף “לרדת הילוך”. אם זה מרגיש מוזר—זה נורמלי לחלוטין.", how:"נשוף לאט עם “מממ” או “האאא”. חזור 8 נשיפות." },

    { id:"ground54321", title:"קרקוע 5–4–3–2–1", intro:"כשיש הצפה, המוח נתקע בראש. אנחנו מחזירים אותך לכאן ולעכשיו דרך החושים.", how:"5 דברים שאני רואה, 4 במגע, 3 קולות, 2 ריחות, 1 טעם." },
    { id:"feetGround", title:"כפות רגליים לקרקע", intro:"זה עוגן מהיר שמייצב. אנחנו לא חייבים “להרגיש טוב”, רק להיות יציבים יותר.", how:"הרגש את מגע הרגליים ברצפה ואת המשקל. נשום 6 נשימות רגועות." },
    { id:"objectDescribe", title:"תיאור חפץ", intro:"זה מייצב כי זה מעביר קשב מפרשנות לעובדות. בוא נבחר משהו פשוט מולנו.", how:"בחר חפץ ותאר בלב 5 פרטים (צבע/צורה/מרקם/חומר/שימוש)." },
    { id:"wideLook", title:"מבט רחב", intro:"בלחץ הראייה “מצטמצמת”. הרחבה של המבט נותנת למוח אות שהסביבה בטוחה.", how:"סרוק את החדר בעיניים מצד לצד 10 שניות. אחר כך בחר נקודה אחת ו-3 נשימות." },
    { id:"countBack", title:"ספירה יורדת", intro:"זה תרגיל שמוריד רעש במוח בלי מאבק. אם טעית—ממשיכים, לא מבקרים.", how:"ספר לאחור מ־30 לאט. אם טעית—חזור מספר אחד אחורה והמשך." },

    { id:"pmrMini", title:"הרפיית שרירים קצרה", intro:"כשגוף מתוח, המוח מפרש “סכנה”. שחרור קטן בשרירים מפחית את האות הזה.", how:"כווץ 5 שניות ושחרר 10: כפות ידיים, כתפיים, לסת, בטן." },
    { id:"shouldersDrop", title:"הורדת כתפיים", intro:"זה קטן אבל יעיל: כתפיים למטה = פחות דריכות. נעשה את זה בעדינות.", how:"הרם כתפיים 3 שניות, שחרר לאט. חזור 5 פעמים עם נשימה איטית." },
    { id:"jawRelax", title:"לסת רכה", intro:"לסת תפוסה מחזיקה סטרס. בוא נשחרר נקודת לחץ מרכזית.", how:"פתח מעט את הפה, הנח לשון על החך, ושחרר לסת ל-30 שניות." },
    { id:"handPress", title:"לחיצת כפות ידיים", intro:"כשאין שקט בראש, הולכים לגוף. לחץ קבוע נותן תחושת יציבות.", how:"הצמד כפות ידיים ולחץ 10 שניות, שחרר 10. חזור 5 פעמים." },
    { id:"stretchSlow", title:"מתיחה איטית", intro:"תנועה איטית היא אנטי-הצפה. לא צריך “לשחרר הכול”, רק קצת מרווח.", how:"מתיחה עדינה לצוואר/כתפיים/גב עליון. 3 נשימות לכל תנועה." },

    { id:"coldAnchor", title:"עוגן קר", intro:"קור קצר יכול להוריד דריכות מהר. אנחנו משתמשים בזה כמו “כפתור עצירה”.", how:"מים קרים על כפות ידיים 20–30 שניות. אחר כך 3 נשימות איטיות." },
    { id:"sipWater", title:"שתייה איטית", intro:"פעולה איטית ופשוטה מחזירה שליטה. המטרה היא קצב, לא תוצאה.", how:"קח 5 לגימות מים לאט. בין לגימה ללגימה—נשיפה ארוכה אחת." },
    { id:"nameEmotion", title:"לתת שם למה שקורה", intro:"כשנותנים שם לרגש, הוא נהיה פחות “מפלצת”. זה לא אבחון—רק תיאור רגעי.", how:"אמור בלב: “עכשיו יש לי לחץ/פחד/עומס”. הוסף: “זה זמני”." },
    { id:"microTask", title:"משימה מיקרו", intro:"בהצפה אנחנו מקטינים את העולם. משימה קטנה מחזירה תנועה קדימה.", how:"בחר פעולה של 60 שניות (לסדר דבר אחד/לשטוף פנים/לכתוב שורה) ובצע." },
    { id:"worryTime", title:"דחיית דאגה לזמן קבוע", intro:"המוח רוצה לפתור הכול עכשיו. אנחנו נותנים לו “תור” מסודר במקום להילחם.", how:"קבע 10 דקות מאוחר יותר. כתוב מילה על הדאגה וחזור להווה." },

    { id:"3min", title:"3 דקות מיקוד", intro:"כאן אנחנו לא מנסים לשנות—רק להתייצב. זה עובד מצוין כשיש עומס כללי.", how:"דקה נשימה, דקה גוף, דקה סביבה. רק לשים לב." },
    { id:"miniWalk", title:"הליכה מודעת קצרה", intro:"תנועה קצרה מפנה עומס. גם 2 דקות מספיקות כדי לשנות כיוון.", how:"לך 2 דקות. שים לב לכף רגל-רצפה ולנשיפה ארוכה." },
    { id:"safetyPhrase", title:"משפט מווסת", intro:"משפט קצר חוזר מחזיר יציבות. לא צריך לשכנע—רק להזכיר.", how:"אמור: “זה לא נעים, וזה זמני. אני בטוח כרגע.” חזור 3 פעמים." },
    { id:"twoChoices", title:"שתי בחירות בלבד", intro:"בהצפה יותר מדי אופציות מעמיס. אנחנו מצמצמים כדי לנשום.", how:"בחר: “נשימה 60 שניות” או “שתייה איטית”. בצע אחת." }
  ];

  const REG_PREFACES = [
    "בוא נעצור רגע. מה שעובר עליך עכשיו לא אומר עליך משהו—זה תגובה אנושית ללחץ. אנחנו עושים כאן צעד קטן, לא מהפכה.",
    "אנחנו לא חייבים להרגיש מושלם כדי להתקדם. מספיק שניצור 5% יותר יציבות עכשיו.",
    "אם יש התנגדות או חוסר אמון—זה נורמלי. אנחנו רק בודקים מה עובד לך, בקצב שלך."
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
      "יכול להיות שאני מפרש/ת חמור מדי. אני אבדוק לפני שאחליט.",
      "זה לא נעים, אבל זה לא אומר שזה מסוכן.",
      "מותר לי להיות בלחץ ועדיין לפעול נכון.",
      "גם אם זה לא יצליח 100%, אני יכול/ה להתמודד עם 80%.",
      "אני לא חייב/ת לדעת עכשיו את כל התשובות. צעד אחד מספיק.",
      "מחשבה היא לא עובדה. אני יכול/ה לבחור איך להגיב.",
      "גם אם טעיתי—זה חלק מהלמידה, לא הוכחה שאני כישלון.",
      "אני יכול/ה להיות עדין/ה עם עצמי ועדיין להתקדם."
    ],
    performance: [
      "להצליח לא אומר להיות מושלם—זה אומר להתמיד.",
      "אם תהיה טעות, זה לא סוף—זה תיקון.",
      "אני יכול/ה להתמקד בביצוע צעד אחד, לא בכל התוצאה.",
      "יש לי יכולת ללמוד תוך כדי. זה מספיק להיום.",
      "זה לחץ טבעי כשחשוב לי. זה לא אומר שאני לא טוב/ה."
    ],
    relationships: [
      "אפשר שזו אי הבנה, לא דחייה.",
      "אני יכול/ה לשאול ברור במקום לנחש.",
      "קשר חזק בונה על תיקונים, לא על שלמות.",
      "גם אם זה כואב—אני יכול/ה להגיב בכבוד, בלי להיעלם ובלי להתפוצץ.",
      "הרגש שלי אמיתי, אבל הוא לא חייב לנהל את השיחה."
    ],
    health: [
      "חרדה גופנית מרגישה מסוכנת, אבל לרוב היא גל חולף.",
      "אני יכול/ה לבדוק עובדות במקום להיבהל מסימפטום אחד.",
      "גם אם הגוף לא נעים עכשיו—אני יכול/ה להחזיר שליטה קטנה דרך נשימה ותנועה.",
      "אני לא חייב/ת להילחם בגוף—אפשר להקשיב ולווסת.",
      "אני אעשה צעד שמרגיע, ואז אחליט אם צריך בדיקה."
    ],
    money: [
      "לחץ כלכלי לא נפתר במחשבה—נפתר בצעד קטן ותכנית.",
      "אני יכול/ה לבחור פעולה אחת: לבדוק מספרים / לצמצם סעיף / להתייעץ.",
      "המצב לא מגדיר אותי. הוא מצב.",
      "פחד לא ינהל קניות/החלטות. עובדות ינהלו.",
      "גם כאן—עדיף צעד ברור אחד מאשר הצפה."
    ],
    selfWorth: [
      "הערך שלי לא נמדד ברגע אחד.",
      "אני יכול/ה לטעות ועדיין להיות אדם ראוי.",
      "הביקורת הפנימית נשמעת חכמה, אבל היא לא תמיד צודקת.",
      "אני לא חייב/ת להוכיח. אני יכול/ה לתרגל.",
      "זה שאני מרגיש/ה כך—לא אומר שזה נכון."
    ]
  };

  // Dilemma framework (safe, non-diagnostic)
  const DILEMMA_PREFACES = [
    "דילמה טובה היא סימן שאכפת לך. אנחנו לא מחפשים החלטה מושלמת—אלא החלטה סבירה עם צעד קטן.",
    "בוא נפריד רגע בין פחד לבין עובדות. נבנה כיוון פעולה שנכון לך, לא לכותרת בראש.",
    "אנחנו יכולים לבחור צעד הפיך: כזה שמקדם, בלי לשרוף גשרים."
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
      <span class="badge"><span class="badgeDot"></span> צעד קטן</span>
    </div>
  `;

  const sliderBlock = (label, valueText, id, note) => `
    <div class="sliderWrap">
      <div class="sliderTop">
        <div class="sliderLabel">${esc(label)}</div>
        <div class="sliderVal" id="${esc(id)}">${esc(valueText)}</div>
      </div>
      <input type="range" min="0" max="10" step="1" value="0" id="${esc(id)}_range" />
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
      ${cardHeader("מה עושים עכשיו?", "בחר כלי לפי מה שמתאים לך לרגע הזה. אנחנו איתך, בלי שיפוט.")}
      <div class="grid2">
        <button class="btn btnPrimary" data-open="reg">
          <span class="row" style="gap:10px;"> <span>
              <div style="font-weight:900;">לחץ/הצפה</div>
              <div class="p">תרגיל ויסות אחד בכל פעם</div>
            </span>
          </span>
          <span>›</span>
        </button>

        <button class="btn" data-open="thought">
          <span class="row" style="gap:10px;"> <span>
              <div style="font-weight:900;">מחשבה שלא עוזבת</div>
              <div class="p">בדיקת מציאות + חלופות</div>
            </span>
          </span>
          <span>›</span>
        </button>

        <button class="btn" data-open="dilemma">
          <span class="row" style="gap:10px;"> <span>
              <div style="font-weight:900;">דילמה</div>
              <div class="p">כיוון + צעד קטן</div>
            </span>
          </span>
          <span>›</span>
        </button>

        <button class="btn" data-open="journal">
          <span class="row" style="gap:10px;"> <span>
              <div style="font-weight:900;">התנסויות</div>
              <div class="p">יומן אישי פתוח</div>
            </span>
          </span>
          <span>›</span>
        </button>

        <button class="btn" data-open="goal">
          <span class="row" style="gap:10px;"> <span>
              <div style="font-weight:900;">יעד אישי</div>
              <div class="p">כיוון, סיבה וצעד</div>
            </span>
          </span>
          <span>›</span>
        </button>

        <button class="btn" data-open="lifeWheel">
          <span class="row" style="gap:10px;"> <span>
              <div style="font-weight:900;">מעגל החיים</div>
              <div class="p">דירוג הווה ועתיד</div>
            </span>
          </span>
          <span>›</span>
        </button>

      </div>

      <div class="hr"></div>
      <div class="kpi">
        <div class="kpiItem">
          <div class="kpiTitle">כמות אירועים בהיסטוריה</div>
          <div class="kpiValue">${state.history.length}</div>
        </div>
        <div class="kpiItem">
          <div class="kpiTitle">זכירה מקומית</div>
          <div class="kpiValue">פעיל</div>
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
        ${cardHeader("לחץ / הצפה", "נרגיע את הגוף רגע, ואז נחזיר סדר לראש.")}
        <div class="stack">
        <button class="btn ghost" id="btnSecurity">🔐 אבטחה ונעילה</button>

          ${sliderBlock("עוצמה עכשיו (0–10)", ui.reg.intensity === null ? "0 – לא בחרתי" : `${ui.reg.intensity}`, "reg_int", "בחר רק אחרי שאתה מזיז את הסליידר.")}
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
            <span class="row" style="gap:10px;"> <span>
                <div style="font-weight:900;">תן לי תרגיל</div>
                <div class="p">תרגיל אחד בכל פעם (בלי חזרות)</div>
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
            <div class="smallNote">טיפ: אם אתה/את מוצף/ת מאוד—תתחיל/י קודם בעוגן קר או קרקוע 5-4-3-2-1.</div>
          `}

          <button class="btn btnInline" id="go_home"><span>חזרה לבית</span><span>⌂</span></button>
        </div>
      </div>

      <div class="card">
        ${cardHeader("שמור וסיים", "כשתסיים את התרגיל—נשמור את האירוע, כדי שתוכל/י לראות דפוסים לאורך זמן.")}
        <button class="btn btnPrimary" id="reg_save">
          <span class="row" style="gap:10px;"> <span>
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
        ${cardHeader("מחשבה שלא עוזבת", "נבדוק עובדות מול פרשנות, ונייצר 2–3 חלופות מאוזנות.")}
        <div class="stack">
          ${sliderBlock("עוצמה עכשיו (0–10)", ui.thought.intensity === null ? "0 – לא בחרתי" : `${ui.thought.intensity}`, "th_int", "בחר רק אחרי שאתה מזיז את הסליידר.")}
          ${selectBlock("טריגר", "th_trigger", TRIGGERS, ui.thought.trigger)}
          ${selectBlock("נושא", "th_topic", topicOptionsThought, ui.thought.topic)}

          <textarea id="th_text" placeholder="כתוב/כתבי את המחשבה שמטרידה אותך… (משפט אחד מספיק)">${esc(ui.thought.text)}</textarea>

          <button class="btn btnPrimary" id="th_generate">
            <span class="row" style="gap:10px;"> <span>
                <div style="font-weight:900;">תן לי בדיקת מציאות</div>
                <div class="p">ואז 2–3 מחשבות חליפיות</div>
              </span>
            </span>
            <span>›</span>
          </button>

          ${outs.length ? `
            <div class="card" style="background: rgba(255,255,255,.02); border-radius: 22px;">
              <div style="font-weight:900; margin-bottom:8px;">בדיקת מציאות</div>
              <div class="p" style="margin-bottom:10px;">${esc(outs[0].reality)}</div>
              <div class="hr"></div>
              <div style="font-weight:900; margin-bottom:8px;">מחשבות חליפיות (בחר/י אחת)</div>
              ${outs[0].alts.map((a, idx) => `
                <button class="btn btnSmall" data-alt="${idx}">
                  <span class="row" style="gap:10px;"> <span style="text-align:right;">
                      <div style="font-weight:900;">חלופה ${idx+1}</div>
                      <div class="p">${esc(a)}</div>
                    </span>
                  </span>
                  <span>✓</span>
                </button>
              `).join("")}
              <div class="smallNote" style="margin-top:10px;">החלופה היא “מאוזנת” — לא ורודה מדי ולא קיצונית מדי.</div>
            </div>
          ` : `
            <div class="smallNote">טיפ: אם אין לך כוח לכתוב—רשום/רשמי רק 3 מילים שמסכמות.</div>
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
        ${cardHeader("דילמה", "נוריד עומס, נחדד מה חשוב, ונבחר צעד קטן ובטוח.")}
        <div class="stack">
          ${sliderBlock("עוצמה עכשיו (0–10)", ui.dilemma.intensity === null ? "0 – לא בחרתי" : `${ui.dilemma.intensity}`, "di_int", "בחר רק אחרי שאתה מזיז את הסליידר.")}
          ${selectBlock("טריגר", "di_trigger", TRIGGERS, ui.dilemma.trigger)}
          ${selectBlock("תחום", "di_topic", dilemmaTopicOptions, ui.dilemma.topic)}
          <textarea id="di_text" placeholder="כתוב/כתבי בקצרה: מה הדילמה? (2–3 שורות)">${esc(ui.dilemma.text)}</textarea>

          <button class="btn btnPrimary" id="di_generate">
            <span class="row" style="gap:10px;"> <span>
                <div style="font-weight:900;">בוא נבנה כיוון</div>
                <div class="p">עדין, ברור, ומעשי</div>
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
              <div style="font-weight:900; margin-bottom:6px;">עדשות חשיבה (לבחור אחת)</div>
              <div class="pillRow">
                ${out.lenses.map(l => `<span class="tag">${esc(l)}</span>`).join("")}
              </div>
              <div class="hr"></div>
              <div style="font-weight:900; margin-bottom:6px;">צעד קטן מומלץ</div>
              <div style="line-height:1.55; font-weight:900;">${esc(out.step)}</div>
              <div class="smallNote" style="margin-top:10px;">
                אם יש כאן סיכון גבוה (בטיחות/אלימות/בריאות דחופה) — עדיף צעד שמערב גורם מקצועי/עזרה מיידית. האפליקציה לא מחליפה טיפול.
              </div>
              <div class="hr"></div>
              <button class="btn btnPrimary" id="di_save">
                <span class="row" style="gap:10px;"> <span>
                    <div style="font-weight:900;">שמור וסיים</div>
                    <div class="p">דילמה + צעד קטן + עוצמה + טריגר</div>
                  </span>
                </span>
                <span>✓</span>
              </button>
            </div>
          ` : `
            <div class="smallNote">טיפ: בדילמה, “צעד הפיך” כמעט תמיד עדיף מצעד קיצוני כשאתה/את מוצף/ת.</div>
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

  
  // ---------- Life Wheel (מעגל החיים) ----------
  // Domains: current rating + future rating + short descriptions + a small step.
  const LIFE_WHEEL_KEY = "opensense_life_wheel_v1";

  const LIFE_DOMAINS = [
    { key:"career", title:"קריירה - תעסוקה", priority:"must" },
    { key:"study", title:"לימודים - השכלה", priority:"must" },
    { key:"money", title:"מצב כלכלי", priority:"must" },
    { key:"leisure", title:"תחביבים ופנאי", priority:"should" },
    { key:"health", title:"בריאות", priority:"should" },
    { key:"relationship", title:"זוגיות", priority:"" },
    { key:"family", title:"משפחה", priority:"" },
    { key:"friends", title:"חברים", priority:"" },
    { key:"other", title:"אחר", priority:"" }
  ];

  const LIFE_WHEEL_EMPTY = () => ({
    id: uid(),
    createdAt: nowISO(),
    note: "",
    mode: "current",
    items: LIFE_DOMAINS.map(d => ({
      key: d.key,
      title: d.title,
      priority: d.priority,
      current: { rating: null, desc: "" },
      future: { rating: null, desc: "" },
      step: ""
    }))
  });

  const loadLifeSessions = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(LIFE_WHEEL_KEY));
      return Array.isArray(raw) ? raw : [];
    } catch { return []; }
  };
  const saveLifeSessions = (arr) => localStorage.setItem(LIFE_WHEEL_KEY, JSON.stringify(arr));

  let lifeSessions = loadLifeSessions();
  let lifeActive = lifeSessions[0] || LIFE_WHEEL_EMPTY();

  const badge = (txt, kind) => {
    const cls = kind === "must" ? "pillMust" : (kind === "should" ? "pillShould" : "pill");
    return `<span class="${cls}">${esc(txt)}</span>`;
  };

  const lifeLegend = () => ``;

  const wheelSvg = (session) => {
    const mode = session.mode === "future" ? "future" : "current";
    const values = session.items.map(it => {
      const v = it[mode].rating;
      return (typeof v === "number" ? Math.max(0, Math.min(10, v)) : 0);
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

    const gridCircles = [2,4,6,8,10].map(v => {
      const rr = (v/10)*rMax;
      return `<circle cx="${cx}" cy="${cy}" r="${rr}" class="wheelGrid" />`;
    }).join("");

    const wedges = values.map((v,i)=> `<path d="${wedgePath(i,v)}" class="wheelFill wheelFill${i%9}" />`).join("");

    const labels = session.items.map((it,i)=>{
      const p = labelPos(i);
      const short = it.title.split(" - ")[0];
      return `<text x="${p.x}" y="${p.y}" text-anchor="middle" class="wheelLabel">${esc(short)}</text>`;
    }).join("");

    return `
      <svg class="wheelSvg" viewBox="0 0 240 240" role="img" aria-label="מעגל החיים">
        ${gridCircles}
        <circle cx="${cx}" cy="${cy}" r="${rMax}" class="wheelOuter" />
        ${wedges}
        <circle cx="${cx}" cy="${cy}" r="2.5" class="wheelDot" />
        ${labels}
      </svg>
    `;
  };

  const lifeWheelView = () => {
    const modeLabel = lifeActive.mode === "future" ? "עתיד" : "הווה";
    const modeOther = lifeActive.mode === "future" ? "הווה" : "עתיד";

    const header = `
      ${cardHeader("מעגל החיים", "מסתכלים על התמונה הרחבה, ואז בוחרים כיוון וצעד אחד.")}
      <div class="rowBetween" style="gap:10px; flex-wrap:wrap;">
        <div class="smallNote">מצב תצוגה: <b>${esc(modeLabel)}</b></div>
        <button class="btn ghost" id="lw_toggle"><span>להציג ${esc(modeOther)}</span></button>
      </div>
            <div style="margin-top:12px; display:flex; justify-content:center;">
        ${wheelSvg(lifeActive)}
      </div>
    `;

    const items = lifeActive.items.map((it, idx) => {
      const cur = it.current.rating;
      const fut = it.future.rating;
      const curTxt = (typeof cur === "number") ? String(cur) : "בחר";
      const futTxt = (typeof fut === "number") ? String(fut) : "בחר";

      return `
        <div class="card" style="margin-top:12px;">
          <div class="rowBetween" style="gap:10px; align-items:flex-start;">
            <div>
              <div class="h2">${esc(it.title)}</div>
                          </div>
          </div>

          <div class="hr"></div>
          <div class="smallNote" style="margin-top:10px;">תיאור הווה</div>
          <textarea class="input" data-lw-cur-desc="${idx}" placeholder="במילים קצרות...">${esc(it.current.desc || "")}</textarea>

          <div class="smallNote" style="margin-top:10px;">תיאור עתיד</div>
          <textarea class="input" data-lw-fut-desc="${idx}" placeholder="איך הייתי רוצה שזה ייראה...">${esc(it.future.desc || "")}</textarea>

          <div class="smallNote" style="margin-top:10px;">צעד קטן לעבר המטרה</div>
          <input class="input" data-lw-step="${idx}" placeholder="משהו אחד שאפשר להתחיל ממנו" value="${esc(it.step || "")}" />

          <div class="grid2" style="margin-top:12px;">
            ${sliderBlock("דירוג הווה", curTxt, "lw_cur_"+idx, "בחר מספר 1-10")}
            ${sliderBlock("דירוג עתיד", futTxt, "lw_fut_"+idx, "בחר מספר 1-10")}
          </div>
        </div>
      `;
    }).join("");

    const sessionsList = lifeSessions.length === 0 ? `
      <div class="smallNote" style="margin-top:12px;">אין עדיין שמירות קודמות.</div>
    ` : `
      <div class="hr"></div>
      <div class="sectionTitle">שמירות קודמות</div>
      <div class="list">
        ${lifeSessions.slice(0, 8).map(s => `
          <button class="btn ghost" data-lw-open="${esc(s.id)}">
            <span>נשמר: ${esc(formatDT(s.createdAt))}</span><span>›</span>
          </button>
        `).join("")}
      </div>
    `;

    return `
      <div class="card">
        ${header}
        <div class="hr"></div>

        <div class="sectionTitle">מילוי</div>
        <div class="smallNote">מדרגים 1-10, מתארים בקצרה, ואז כותבים צעד אחד שאפשר להתחיל ממנו.</div>

        ${items}

        <div class="card" style="margin-top:12px;">
          <div class="h2">הערה כללית (אופציונלי)</div>
          <textarea class="input" id="lw_note" placeholder="שורה או שתיים לסיכום...">${esc(lifeActive.note || "")}</textarea>

          <div class="hr"></div>
          <div class="grid2">
            <button class="btn btnPrimary" id="lw_save"><span>שמור</span><span>✓</span></button>
            <button class="btn" id="lw_save_new"><span>שמור כגרסה חדשה</span><span>+</span></button>
          </div>
        </div>

        ${sessionsList}

        <button class="btn btnInline" id="lw_home"><span>חזרה לבית</span><span>⌂</span></button>
      </div>
    `;
  };

  const bindLifeWheel = () => {
    if (ui.route !== "lifeWheel") return;

    $("#lw_home")?.addEventListener("click", () => setRoute("home"));

    $("#lw_toggle")?.addEventListener("click", () => {
      lifeActive.mode = (lifeActive.mode === "future") ? "current" : "future";
      render();
    });

    lifeActive.items.forEach((it, idx) => {
      const rCur = $(`#lw_cur_${idx}_range`);
      const vCur = $(`#lw_cur_${idx}`);
      const rFut = $(`#lw_fut_${idx}_range`);
      const vFut = $(`#lw_fut_${idx}`);

      if (typeof it.current.rating === "number") rCur.value = String(it.current.rating);
      if (typeof it.future.rating === "number") rFut.value = String(it.future.rating);

      rCur?.addEventListener("input", () => {
        it.current.rating = Number(rCur.value);
        vCur.textContent = String(it.current.rating);
        render();
      });
      rFut?.addEventListener("input", () => {
        it.future.rating = Number(rFut.value);
        vFut.textContent = String(it.future.rating);
        render();
      });

      const curDesc = $$(`[data-lw-cur-desc="${idx}"]`)[0];
      const futDesc = $$(`[data-lw-fut-desc="${idx}"]`)[0];
      const stepEl  = $$(`[data-lw-step="${idx}"]`)[0];

      curDesc?.addEventListener("input", () => it.current.desc = curDesc.value);
      futDesc?.addEventListener("input", () => it.future.desc = futDesc.value);
      stepEl?.addEventListener("input", () => it.step = stepEl.value);
    });

    $("#lw_note")?.addEventListener("input", () => lifeActive.note = $("#lw_note").value);

    const persist = (asNew) => {
      const any = lifeActive.items.some(it => typeof it.current.rating === "number" || typeof it.future.rating === "number");
      if (!any) { toast("כדאי לדרג לפחות תחום אחד."); return; }

      const snapshot = JSON.parse(JSON.stringify(lifeActive));
      snapshot.createdAt = nowISO();
      if (asNew) snapshot.id = uid();

      const idx = lifeSessions.findIndex(s => s.id === snapshot.id);
      if (idx >= 0) lifeSessions[idx] = snapshot;
      else lifeSessions.unshift(snapshot);

      lifeSessions = lifeSessions.slice(0, 30);
      saveLifeSessions(lifeSessions);
      lifeActive = snapshot;
      toast("נשמר");
      render();
    };

    $("#lw_save")?.addEventListener("click", () => persist(false));
    $("#lw_save_new")?.addEventListener("click", () => persist(true));

    $$(`[data-lw-open]`).forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-lw-open");
        const found = lifeSessions.find(s => s.id === id);
        if (found) { lifeActive = found; render(); }
      });
    });
  };

// ---------- History view ----------
  const historyView = () => {
    const groups = groupHistoryByDay();
    const total = state.history.length;

    return `
      <div class="card">
        ${cardHeader("היסטוריה", "הכול נשמר לפי יום ושעה — כדי לראות שכיחות, טריגרים ועוצמות לאורך זמן.")}
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
          <p class="p">עדיין אין אירועים. תתחיל/י מכלי אחד, ותשמור/י — ואז נוכל לראות דפוסים.</p>
        ` : `
          <button class="btn btnDanger" id="clear_history">
            <span class="row" style="gap:10px;"> <span>
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

  
  const bindHome = () => {
    if (ui.route !== "home") return;

    // Home uses data-open attributes
    const map = {
      reg: "regulation",
      thought: "thought",
      dilemma: "dilemma",
      journal: "journal",
      goal: "goal",
      lifeWheel: "lifeWheel"
    };

    $$("[data-open]").forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-open");
        const route = map[key];
        if (route) setRoute(route);
      });
    });
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

  const bindPrivacy = () => {
    $("#btnSecurity")?.addEventListener("click", () => setRoute("security"));
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
        ${cardHeader("💡 תובנות", "מסכם דפוסים מהשימוש שלך — הכל נשמר מקומית במכשיר.")}
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
          <div style="font-weight:900; margin-bottom:6px;">מה חוזר אצלך (רמז למה שעובד)</div>
          <div class="smallNote" style="margin-bottom:8px;">אנחנו לא “מאבחנים” — רק מזהים חזרות בתרגילים/בחירות שנשמרו.</div>
          ${renderTop(ins.topChoices, "עדיין אין בחירות שחוזרות מספיק כדי להציג כאן.")}
        </div>

        <div class="hr"></div>
        <div class="smallNote">
          טיפ: אם העוצמה עלתה — זה לא כישלון. זה מידע. אפשר לבחור צעד קטן אחד לשבוע הקרוב (למשל 2 תרגילי ויסות קבועים).
        </div>
      </div>
    `;
  };


  // ---------- Lock screen ----------
  const lockView = () => `
    <div class="card">
      ${cardHeader("🔐 האפליקציה נעולה", "כדי להגן על פרטיות המידע – צריך להזין קוד.")}
      <div class="stack">
        <div class="item">
          <div style="font-weight:900; margin-bottom:6px;">קוד (4 ספרות)</div>
          <input id="lockPin" class="input" inputmode="numeric" autocomplete="one-time-code" maxlength="4" placeholder="••••">
          <div id="lockErr" class="smallNote" style="margin-top:8px; color: var(--danger, #ff6b6b); display:none;"></div>
        </div>
        <button id="btnUnlock" class="btn primary">פתח</button>
        <button id="btnForgotPin" class="btn ghost">שכחתי את הקוד</button>
        <div class="smallNote">
          טיפ: אם שכחת את הקוד – אפשר לאפס את האפליקציה. זה ימחק את הנתונים המקומיים (אי אפשר לשחזר).
        </div>
      </div>
    </div>
  `;

  const bindLock = () => {
    const pinEl = $("#lockPin");
    const errEl = $("#lockErr");
    const showErr = (msg) => {
      if (!errEl) return;
      errEl.style.display = "block";
      errEl.textContent = msg;
    };

    $("#btnUnlock")?.addEventListener("click", async () => {
      const pin = String(pinEl?.value || "").trim();
      if (!pinValid(pin)) return showErr("הקוד חייב להיות 4 ספרות.");
      try {
        const h = await sha256Hex(pin);
        if (h === lock.hash) {
          unlockNow();
        } else {
          showErr("הקוד שגוי. נסה שוב.");
        }
      } catch {
        showErr("שגיאה טכנית. נסה שוב.");
      }
    });

    pinEl?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") $("#btnUnlock")?.click();
    });

    $("#btnForgotPin")?.addEventListener("click", () => {
      confirmModal(
        "איפוס האפליקציה",
        "הפעולה תסיר את הנעילה ותמחק את כל הנתונים המקומיים במכשיר זה. אין אפשרות לשחזור.",
        "איפוס והתחלה מחדש",
        () => {
          clearAllLocalData();
          // Hard reload to ensure clean state
          location.reload();
        }
      );
    });
  };

  // ---------- Security & Lock settings ----------
  const securityView = () => {
    const enabled = !!lock.enabled;
    const timeout = Number(lock.timeoutMin);
    const timeoutLabel = (t) => (t<=0 ? "ללא נעילה אוטומטית" : `${t} דקה${t===1?"":"ות"}`);
    return `
      <div class="card">
        ${cardHeader("🔐 אבטחה ונעילה", "נעילה מקומית מאפשרת מרחב בטוח לעבודה רגשית.")}
        <div class="stack">

          <div class="item">
            <div style="font-weight:900; margin-bottom:6px;">מצב נעילה</div>
            <div class="row" style="justify-content:space-between; gap:12px; align-items:center;">
              <div class="p">${enabled ? "נעילה פעילה ✅" : "נעילה כבויה"}</div>
              <button id="toggleLock" class="btn ${enabled ? "ghost" : "primary"}">${enabled ? "כיבוי נעילה" : "הפעל נעילה"}</button>
            </div>
            <div class="smallNote" style="margin-top:6px;">
              חשוב: הקוד נשמר רק במכשיר ולא ניתן לשחזור. אם הקוד יישכח – הפתרון היחיד הוא איפוס מקומי (מחיקת הנתונים).
            </div>
          </div>

          <div class="item">
            <div style="font-weight:900; margin-bottom:6px;">נעילה אוטומטית</div>
            <div class="smallNote" style="margin-bottom:8px;">מומלץ לבחור נעילה אוטומטית באזורים משותפים.</div>
            <select id="lockTimeout" class="input">
              <option value="0" ${timeout<=0?"selected":""}>ללא נעילה אוטומטית</option>
              <option value="1" ${timeout===1?"selected":""}>אחרי 1 דקה</option>
              <option value="5" ${timeout===5?"selected":""}>אחרי 5 דקות</option>
            </select>
            <div class="smallNote" style="margin-top:8px;">נבחר כרגע: <strong>${esc(timeoutLabel(timeout))}</strong></div>
          </div>

          <div class="item">
            <div style="font-weight:900; margin-bottom:6px;">שינוי קוד</div>
            <div class="grid2">
              <div>
                <div class="smallNote" style="margin-bottom:6px;">קוד נוכחי</div>
                <input id="curPin" class="input" inputmode="numeric" maxlength="4" placeholder="••••">
              </div>
              <div>
                <div class="smallNote" style="margin-bottom:6px;">קוד חדש</div>
                <input id="newPin" class="input" inputmode="numeric" maxlength="4" placeholder="••••">
              </div>
            </div>
            <div style="margin-top:10px;">
              <div class="smallNote" style="margin-bottom:6px;">אימות קוד חדש</div>
              <input id="newPin2" class="input" inputmode="numeric" maxlength="4" placeholder="••••">
            </div>
            <div id="secErr" class="smallNote" style="margin-top:10px; color: var(--danger, #ff6b6b); display:none;"></div>
            <button id="btnChangePin" class="btn ghost" style="margin-top:10px;">שמור קוד חדש</button>
          </div>

          <div class="item">
            <button id="btnBackFromSecurity" class="btn">חזרה</button>
          </div>

          <div class="smallNote">
            האפליקציה לא שולחת מידע החוצה ולא אוספת סטטיסטיקות. כל ההגדרות נשמרות מקומית במכשיר שלך בלבד.
          </div>

        </div>
      </div>
    `;
  };

  const bindSecurity = () => {
    const errEl = $("#secErr");
    const showErr = (msg) => {
      if (!errEl) return;
      errEl.style.display = "block";
      errEl.textContent = msg;
    };
    const clearErr = () => {
      if (!errEl) return;
      errEl.style.display = "none";
      errEl.textContent = "";
    };

    $("#btnBackFromSecurity")?.addEventListener("click", () => setRoute("privacy"));

    $("#lockTimeout")?.addEventListener("change", (e) => {
      const v = Number(e.target.value);
      lock.timeoutMin = Number.isFinite(v) ? v : 1;
      saveLock();
      touchActive();
      toast("עודכן ✅");
      render();
    });

    $("#toggleLock")?.addEventListener("click", async () => {
      clearErr();
      if (lock.enabled) {
        // Disable requires current pin
        const cur = String($("#curPin")?.value || "").trim();
        if (!pinValid(cur)) return showErr("כדי לכבות נעילה, הזן קוד נוכחי בן 4 ספרות.");
        const h = await sha256Hex(cur);
        if (h !== lock.hash) return showErr("הקוד הנוכחי שגוי.");
        lock.enabled = false;
        saveLock();
        toast("נעילה כובתה ✅");
        render();
        return;
      }

      // Enable: requires setting a new pin (use newPin/newPin2)
      const p1 = String($("#newPin")?.value || "").trim();
      const p2 = String($("#newPin2")?.value || "").trim();
      if (!pinValid(p1) || !pinValid(p2)) return showErr("כדי להפעיל נעילה, הזן קוד חדש בן 4 ספרות ואימות.");
      if (p1 !== p2) return showErr("האימות לא תואם לקוד החדש.");
      lock.hash = await sha256Hex(p1);
      lock.enabled = true;
      touchActive();
      saveLock();
      toast("נעילה הופעלה ✅");
      render();
    });

    $("#btnChangePin")?.addEventListener("click", async () => {
      clearErr();
      if (!lock.enabled || !lock.hash) return showErr("כדי לשנות קוד, יש להפעיל נעילה קודם.");
      const cur = String($("#curPin")?.value || "").trim();
      const p1 = String($("#newPin")?.value || "").trim();
      const p2 = String($("#newPin2")?.value || "").trim();
      if (!pinValid(cur)) return showErr("הזן קוד נוכחי בן 4 ספרות.");
      const h = await sha256Hex(cur);
      if (h !== lock.hash) return showErr("הקוד הנוכחי שגוי.");
      if (!pinValid(p1) || !pinValid(p2)) return showErr("הקוד החדש חייב להיות 4 ספרות + אימות.");
      if (p1 !== p2) return showErr("האימות לא תואם לקוד החדש.");
      lock.hash = await sha256Hex(p1);
      touchActive();
      saveLock();
      toast("קוד עודכן ✅");
      render();
    });
  };

  // ---------- Privacy view ----------
const privacyView = () => `
  <div class="card">
    ${cardHeader("אבטחה ופרטיות", "הדבר הכי חשוב: זה נשאר אצלך.")}
    <div class="stack">

      <div class="item">
        <div style="font-weight:900; margin-bottom:6px;">איפה הנתונים נשמרים?</div>
        <div class="p">רק במכשיר שלך (Local Storage). אין שרת. אין חשבון. אין שליחה לענן.</div>
      </div>

      <div class="item">
        <div style="font-weight:900; margin-bottom:6px;">למי יש גישה?</div>
        <div class="p">מי שיש לו גישה פיזית למכשיר פתוח. אם המכשיר פתוח — אפשר לראות. לכן מומלץ להפעיל נעילה בתוך האפליקציה בנוסף לנעילת המכשיר.</div>
      </div>

      <div class="item">
        <div style="font-weight:900; margin-bottom:6px;">מה האפליקציה לא עושה?</div>
        <div class="p">היא לא מאבחנת, לא מחליפה טיפול, ולא שולחת נתונים החוצה. זה כלי פסיכו־חינוכי ומעקב עצמי.</div>
      </div>

      <div class="hr"></div>

      <button class="btn ghost" id="btnSecurity">
        <span class="row" style="gap:10px;"> <span>
            <div style="font-weight:900;">נעילה בתוך האפליקציה</div>
            <div class="p">הפעל/כבה קוד, זמן נעילה, שינוי קוד</div>
          </span>
        </span>
        <span>›</span>
      </button>

      <div class="smallNote">
        טיפ: אם בחרת להפעיל נעילה — אם שוכחים את הקוד, הפתרון היחיד הוא איפוס (זה מוחק את הנתונים המקומיים). אין שחזור ואין שרת שיכול לעזור.
      </div>

    </div>
  </div>
`;
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
  // No-op binds kept for backward compatibility
  const bindJournal = () => {};
  const bindGoal = () => {};

  const render = () => {
    if (!app) return;

    // Lock gate (local-only)
    if (lock.enabled && lock.hash) {
      if (!lockState.isLocked && shouldAutoLock()) {
        lockNow();
        return;
      }
      if (lockState.isLocked || ui.route === "lock") {
        app.innerHTML = lockView();
        bindLock();
        return;
      }
    }

    let html = "";
    if (ui.route === "home") html = homeView();
    if (ui.route === "reg") html = regView();
    if (ui.route === "thought") html = thoughtView();
    if (ui.route === "dilemma") html = dilemmaView();
    if (ui.route === "history") html = historyView();
    if (ui.route === "privacy") html = privacyView();
    if (ui.route === "security") html = securityView();
    if (ui.route === "insights") html = insightsView();
    if (ui.route === "lock") html = lockView();

    app.innerHTML = html;

    // Bind home buttons
    $$("[data-open='reg']").forEach(b => b.addEventListener("click", () => setRoute("reg")));
    $$("[data-open='thought']").forEach(b => b.addEventListener("click", () => setRoute("thought")));
    $$("[data-open='dilemma']").forEach(b => b.addEventListener("click", () => setRoute("dilemma")));

    // Bind route-specific
    if (ui.route === "reg") bindReg();
    if (ui.route === "thought") bindThought();
    if (ui.route === "dilemma") bindDilemma();
    if (ui.route === "history") bindHome();
    bindHistory();
    bindGoal();
    bindJournal();
    bindLifeWheel();
    if (ui.route === "privacy") bindPrivacy();
    if (ui.route === "security") bindSecurity();
    if (ui.route === "lock") bindLock();
  };

  // ---------- Splash + SW ----------
  const hideSplashSoon = () => {
    const s = $("#splash");
    if (!s) return;
    setTimeout(() => s.classList.add("hide"), 550);
  };

  const registerSW = async () => {
    try {
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("./sw.js");
      }
    } catch {
      // ignore
    }
  };

  // ---------- Boot ----------
  const boot = () => {
    mountNav();
    // Activity tracking for auto-lock
    const activity = () => { if (lock.enabled && lock.hash && !lockState.isLocked) touchActive(); };
    ["click","keydown","touchstart","mousemove"].forEach(evt => document.addEventListener(evt, activity, true));
    setInterval(() => {
      if (lock.enabled && lock.hash && !lockState.isLocked && shouldAutoLock()) lockNow();
    }, 5000);

    // Initial lock gate
    if (lock.enabled && lock.hash) {
      lockState.isLocked = true;
      ui.route = "lock";
    }
    render();
    hideSplashSoon();
    registerSW();
  };

  document.addEventListener("DOMContentLoaded", boot);
})();

