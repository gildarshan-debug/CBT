/* =========================
   במחשבה שנייה — App
   ========================= */

/* ---------- Elements ---------- */
const screen = document.getElementById("screen");
const navHome = document.getElementById("navHome");
const navHistory = document.getElementById("navHistory");
const btnSettings = document.getElementById("btnSettings");
const splash = document.getElementById("splash");

/* ---------- Utils ---------- */
function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}
function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
function pad2(n){ return String(n).padStart(2,"0"); }
function tsFmt(ts){
  const d = new Date(ts);
  return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function dateKey(ts){
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}
function dateLabel(key){
  const [y,m,dd] = key.split("-");
  return `${dd}/${m}/${y}`;
}
function timeFmt(ts){
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function normStr(s){ return String(s||"").toLowerCase().trim(); }

function safeCopy(text){
  const t = (text||"").trim();
  if (!t) return false;
  try{
    if (navigator.clipboard?.writeText){
      navigator.clipboard.writeText(t);
      return true;
    }
  }catch{}
  const ta = document.createElement("textarea");
  ta.value = t;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch {}
  document.body.removeChild(ta);
  return ok;
}

/* ---------- Storage ---------- */
const KEY_LOGS = "bmhs_logs_v5";
const KEY_LAST = "bmhs_last_used_v5"; // per category: regulation/thought/dilemma
const KEY_SPLASH_SEEN = "bmhs_splash_seen_v1";

function loadLogs(){
  try { return JSON.parse(localStorage.getItem(KEY_LOGS) || "[]"); }
  catch { return []; }
}
function saveLogs(logs){
  localStorage.setItem(KEY_LOGS, JSON.stringify(logs));
}
function loadLastUsed(){
  try { return JSON.parse(localStorage.getItem(KEY_LAST) || "{}"); }
  catch { return {}; }
}
function saveLastUsed(obj){
  localStorage.setItem(KEY_LAST, JSON.stringify(obj));
}

/* ---------- Brand content ---------- */
/* Regulation (pressure/overwhelm) */
const REG_NORMALIZE = [
  "מה שקורה עכשיו הוא תגובה של הגוף, לא בעיה אצלך.",
  "אין צורך לפתור כלום כרגע. רק להוריד קצת עומס.",
  "גם אם זה חזק — זה זמני. נתחיל בגוף.",
  "לא צריך להצליח. עצם הניסיון כבר משפיע.",
  "אפשר לעשות את זה לאט, בקצב שמתאים לך.",
  "הגוף במצב דרוך. אנחנו עוזרים לו לצאת מזה.",
  "גם תרגול קצר יכול להספיק עכשיו.",
  "אם עולה התנגדות — זה חלק מהעניין. ממשיכים בעדינות.",
  "המטרה היא לא להירגע לגמרי, אלא להיות קצת יותר יציב.",
  "זה לא אומר עליך כלום. זו תגובה אנושית.",
  "אנחנו לא נלחמים בתחושה — רק משנים כיוון.",
  "אפשר לעצור בכל רגע. אתה בשליטה."
];

const REG_PREFACE = [
  "ננסה בעדינות. אין פה מבחן.",
  "גם 30 שניות זה בסדר.",
  "אם זה מרגיש מוזר בהתחלה — זה טבעי.",
  "המטרה היא ירידה קטנה בעומס, לא שינוי דרמטי.",
  "נשמור על קצב רגוע. אתה מוביל.",
  "אם זה לא מתאים — נעבור לתרגיל אחר.",
  "בוא נתחיל. אחר כך נבדוק אם היה שינוי קטן.",
  "אפילו ניסיון חלקי שווה משהו.",
  "אנחנו מכוונים את הגוף, לא מתווכחים עם המחשבות.",
  "נעשה את זה קצר וברור."
];

const REG_EXERCISES = [
  { id:"breath46", title:"נשימה 4–6", how:"שאיפה 4 שניות, נשיפה 6 שניות. חזור 8 פעמים בקצב רגוע." },
  { id:"box4444", title:"נשימת קופסה 4–4–4–4", how:"שאיפה 4, החזקה 4, נשיפה 4, החזקה 4. חזור 4–6 סבבים." },
  { id:"ground54321", title:"קרקוע 5–4–3–2–1", how:"5 דברים שאני רואה, 4 במגע, 3 קולות, 2 ריחות, 1 טעם." },
  { id:"pmrMini", title:"הרפיית שרירים קצרה", how:"כווץ 5 שניות ושחרר 10: כפות ידיים, כתפיים, לסת, בטן." },
  { id:"doubleExhale", title:"נשיפה כפולה", how:"שאיפה רגילה, שתי נשיפות קצרות ואז נשיפה ארוכה. חזור 6 פעמים." },
  { id:"noseOnly", title:"נשימה דרך האף", how:"דקה של נשימות איטיות דרך האף בלבד. שים לב שהנשיפה מעט ארוכה מהשאיפה." },
  { id:"feetGround", title:"כפות רגליים לקרקע", how:"הרגש את מגע הרגליים ברצפה ואת המשקל. נשום 6 נשימות רגועות." },
  { id:"coldAnchor", title:"עוגן קר", how:"מים קרים על כפות ידיים 20–30 שניות. ואז 3 נשימות איטיות." },
  { id:"countBack", title:"ספירה יורדת מ־20", how:"ספר לאחור לאט. אם טעית — חוזרים מספר אחד אחורה וממשיכים." },
  { id:"hum", title:"נשיפה עם קול", how:"נשוף לאט עם “מממ” או “האאא”. חזור 8 נשיפות." },
  { id:"slowStretch", title:"מתיחה איטית", how:"הרם כתפיים, הורד לאט. סובב צוואר בעדינות. 3 נשימות לכל תנועה." },
  { id:"wideLook", title:"מבט רחב", how:"סרוק את החדר בעיניים מצד לצד 10 שניות. אחר כך התמקד בנקודה אחת ונשום." },
  { id:"objectDescribe", title:"תיאור אובייקט", how:"בחר חפץ ותאר בלב 5 פרטים (צבע/צורה/מרקם). זה מחזיר שליטה לקשב." },
  { id:"3min", title:"3 דקות מיקוד", how:"דקה נשימה, דקה גוף, דקה סביבה. לא צריך לשנות כלום — רק לשים לב." },
  { id:"phrase", title:"משפט מווסת", how:"אמור בלב: “זה לא נעים, אבל זה זמני ואני בטוח כרגע.” חזור 3 פעמים." }
];

/* Thought (sticky thought) */
const TH_OPEN = "מחשבות יכולות להרגיש אמיתיות מאוד, גם כשהן רק מחשבות.";
const TH_BALANCE_Q = [
  "מה העובדות בעד ומה העובדות נגד?",
  "איזו עוד אפשרות יכולה להיות נכונה כאן?",
  "אם חבר היה אומר לי את זה — מה הייתי עונה לו?",
  "האם זו עובדה, או פרשנות שאני נותן למצב?",
  "מה הדבר הסביר ביותר, לא הקיצוני ביותר?",
  "מה הייתי עושה אם הפחד היה קטן ב־20%?",
  "מה החלק שאני כן יודע בוודאות, ומה אני רק מניח?",
  "איזו טעות חשיבה עלולה להיות פה (הכל או כלום / ניבוי עתיד)?"
];

const TH_ALT_STARTERS = [
  "יכול להיות ש…",
  "יש סיכוי ש…",
  "ניסוח יותר סביר כרגע הוא…",
  "גם אם זה נכון חלקית — עדיין…",
  "אפשר להחזיק שתי אפשרויות: … וגם …"
];

const TH_ALT_LIBRARY = [
  "זו מחשבה, לא עובדה.",
  "אני לא חייב להחליט עכשיו.",
  "גם אם זה יקרה — אוכל להתמודד.",
  "התחושה חזקה, אבל היא זמנית.",
  "אני רואה רק חלק מהתמונה.",
  "יש יותר מאפשרות אחת להסביר את זה.",
  "המוח מנסה להגן — גם אם הוא מגזים.",
  "אפשר לבחור תגובה אחרת.",
  "אני יכול להאט לפני פעולה.",
  "אני לא חייב להאמין לכל מחשבה שעולה.",
  "גם צעד קטן נותן לי שליטה.",
  "הסיכון לא בהכרח גבוה כמו שזה מרגיש.",
  "היו פעמים דומות ועברתי אותן.",
  "זה לא אומר עליי משהו קבוע.",
  "אפשר לדחות את זה לשעה מסוימת ולחזור לזה."
];

/* Dilemma */
const TRIGGERS = [
  { id:"work", label:"עבודה" },
  { id:"relationship", label:"זוגיות/קשרים" },
  { id:"family", label:"משפחה" },
  { id:"health", label:"בריאות" },
  { id:"money", label:"כסף" },
  { id:"study", label:"לימודים/ביצועים" },
  { id:"other", label:"אחר" }
];
function triggerLabel(id){
  return (TRIGGERS.find(t=>t.id===id)?.label) || "אחר";
}

/* ---------- Non-repeat engine ---------- */
function pickNonRepeat(pool, key, keep=3){
  const state = loadLastUsed();
  const prev = Array.isArray(state[key]) ? state[key] : [];

  // remove last used
  const candidates = pool.filter(x => !prev.includes(x.id ?? x));
  const chosen = candidates.length ? pick(candidates) : pick(pool);

  // update
  const id = chosen.id ?? chosen;
  const next = [id, ...prev].slice(0, keep);
  state[key] = next;
  saveLastUsed(state);

  return chosen;
}

/* ---------- Navigation ---------- */
function setActive(tab){
  navHome.classList.toggle("active", tab === "home");
  navHistory.classList.toggle("active", tab === "history");
}
navHome.addEventListener("click", () => route("home"));
navHistory.addEventListener("click", () => route("history"));

let __route = "home";
let __routeParams = {};

function route(name, params={}){
  __route = name;
  __routeParams = params;

  if (name === "home") return renderHome();
  if (name === "reg") return renderRegulation();
  if (name === "thought") return renderThought();
  if (name === "dilemma") return renderDilemma();
  if (name === "finish") return renderFinish(params);
  if (name === "history") return renderHistory();
  if (name === "settings") return renderSettings();
  return renderHome();
}

/* ---------- Logs ---------- */
function addLog(entry){
  const logs = loadLogs();
  logs.unshift({ ...entry, ts: entry.ts || Date.now() });
  saveLogs(logs);
}
function normalizeType(mode){
  if (mode === "לחץ/הצפה") return "הרגעה";
  if (mode === "מחשבה") return "מחשבה";
  if (mode === "דילמה") return "דילמה";
  return mode || "אירוע";
}

/* ---------- Splash ---------- */
function runSplash(){
  const seen = localStorage.getItem(KEY_SPLASH_SEEN) === "1";
  // show once per browser unless you clear storage
  if (seen){
    splash.classList.add("hide");
    return;
  }
  setTimeout(() => {
    splash.classList.add("hide");
    localStorage.setItem(KEY_SPLASH_SEEN, "1");
  }, 1200);
}

/* ---------- Settings modal ---------- */
btnSettings.addEventListener("click", () => route("settings"));

function openModal(html){
  const overlay = document.createElement("div");
  overlay.className = "modalOverlay";
  overlay.innerHTML = `
    <div class="modal fadeIn">
      ${html}
    </div>
  `;
  overlay.addEventListener("click", (e)=>{
    if (e.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
  return overlay;
}

/* ---------- Screens ---------- */
function renderHome(){
  setActive("home");
  screen.className = "fadeIn";
  screen.innerHTML = `
    <section class="card">
      <div class="pill">צעד קטן — עכשיו</div>
      <div class="hr"></div>
      <h2 class="h2">בוא נעצור רגע</h2>
      <p class="p">מה שעובר עליך עכשיו לא אומר עליך משהו. נבחר צעד שמתאים לרגע הזה.</p>

      <button class="btn btnPrimary" id="goReg" type="button">יש לחץ / הצפה</button>
      <div style="height:10px"></div>
      <button class="btn btnSecondary" id="goThought" type="button">יש מחשבה שלא עוזבת</button>
      <div style="height:10px"></div>
      <button class="btn btnSecondary" id="goDilemma" type="button">יש דילמה</button>

      <div class="hr"></div>
      <div class="row">
        <button class="btn btnGhost" id="goHistory" type="button">להיסטוריה</button>
        <button class="btn btnGhost" id="goSettings" type="button">פרטיות</button>
      </div>
    </section>
  `;

  document.getElementById("goReg").onclick = () => route("reg");
  document.getElementById("goThought").onclick = () => route("thought");
  document.getElementById("goDilemma").onclick = () => route("dilemma");
  document.getElementById("goHistory").onclick = () => route("history");
  document.getElementById("goSettings").onclick = () => route("settings");
}

function renderRegulation(){
  setActive("home");
  screen.className = "fadeIn";

  const normalize = pickNonRepeat(REG_NORMALIZE.map((t,i)=>({id:`n${i}`, t})), "reg_norm", 2).t;
  const preface = pickNonRepeat(REG_PREFACE.map((t,i)=>({id:`p${i}`, t})), "reg_pref", 2).t;
  const ex = pickNonRepeat(REG_EXERCISES, "reg_ex", 3);

  screen.innerHTML = `
    <section class="card">
      <div class="pill">לחץ / הצפה</div>
      <div class="hr"></div>

      <h2 class="h2">קודם הגוף</h2>
      <p class="p"><strong>${esc(normalize)}</strong></p>

      <div class="card" style="background:linear-gradient(180deg, rgba(14,165,166,.10), rgba(255,255,255,.86));">
        <div class="pill">תרגיל אחד — עכשיו</div>
        <div class="hr"></div>
        <h2 class="h2" style="margin-top:0">${esc(ex.title)}</h2>
        <p class="p">${esc(preface)}</p>
        <div class="hr"></div>
        <p style="margin:0; line-height:1.55; font-weight:800">${esc(ex.how)}</p>
      </div>

      <div class="hr"></div>
      <div class="row">
        <button class="btn btnSecondary" id="another" type="button">תן לי תרגיל אחר</button>
        <button class="btn btnPrimary" id="finish" type="button">סיימנו</button>
      </div>
    </section>
  `;

  document.getElementById("another").onclick = () => route("reg");
  document.getElementById("finish").onclick = () => route("finish", {
    mode: "לחץ/הצפה",
    payload: { exerciseId: ex.id, exerciseTitle: ex.title }
  });
}

function renderThought(){
  setActive("home");
  screen.className = "fadeIn";

  const qObj = pickNonRepeat(TH_BALANCE_Q.map((t,i)=>({id:`q${i}`, t})), "th_q", 3);
  const altSuggestion = pickNonRepeat(TH_ALT_LIBRARY.map((t,i)=>({id:`a${i}`, t})), "th_alt", 3).t;

  screen.innerHTML = `
    <section class="card">
      <div class="pill">מחשבה שלא עוזבת</div>
      <div class="hr"></div>

      <h2 class="h2">נעשה רגע סדר</h2>
      <p class="p">${esc(TH_OPEN)}</p>

      <label class="muted">המחשבה (משפט אחד)</label>
      <textarea id="thText" rows="3" placeholder="לדוגמה: אני בטוח אכשל"></textarea>

      <div class="card" style="margin-top:12px;">
        <div class="pill">בדיקת מציאות</div>
        <div class="hr"></div>
        <div style="font-weight:900">${esc(qObj.t)}</div>
        <div style="height:10px"></div>
        <button class="btn btnSecondary" id="swapQ" type="button">החלף שאלה</button>
      </div>

      <label class="muted" style="margin-top:10px;display:block;">מחשבה חלופית (סבירה יותר)</label>
      <textarea id="thAlt" rows="2" placeholder="לדוגמה: יש סיכוי שאצליח אם אתכונן">${esc(altSuggestion)}</textarea>

      <div class="row" style="margin-top:10px;">
        <button class="btn btnSecondary" id="starter" type="button">תן לי פתיח לניסוח</button>
        <button class="btn btnGhost" id="alt2" type="button">עוד רעיון</button>
      </div>
      <div id="starterBox" style="margin-top:10px;"></div>

      <div class="hr"></div>
      <div class="row">
        <button class="btn btnSecondary" id="back" type="button">חזרה</button>
        <button class="btn btnPrimary" id="finish" type="button">שמור וסיים</button>
      </div>
    </section>
  `;

  document.getElementById("swapQ").onclick = () => route("thought");
  document.getElementById("starter").onclick = () => {
    const s = pickNonRepeat(TH_ALT_STARTERS.map((t,i)=>({id:`s${i}`, t})), "th_starter", 2).t;
    document.getElementById("starterBox").innerHTML = `
      <div class="card" style="background:linear-gradient(180deg, rgba(99,102,241,.10), rgba(255,255,255,.86));">
        <div class="pill">אפשר להתחיל ככה</div>
        <div class="hr"></div>
        <div style="font-weight:900">${esc(s)}</div>
      </div>
    `;
  };
  document.getElementById("alt2").onclick = () => {
    const a = pickNonRepeat(TH_ALT_LIBRARY.map((t,i)=>({id:`a${i}`, t})), "th_alt", 3).t;
    document.getElementById("thAlt").value = a;
  };

  document.getElementById("back").onclick = () => route("home");
  document.getElementById("finish").onclick = () => {
    const thought = document.getElementById("thText").value.trim();
    const alt = document.getElementById("thAlt").value.trim();

    route("finish", {
      mode: "מחשבה",
      payload: { thought, question: qObj.t, alternative: alt }
    });
  };
}

function renderDilemma(){
  setActive("home");
  screen.className = "fadeIn";

  screen.innerHTML = `
    <section class="card">
      <div class="pill">דילמה</div>
      <div class="hr"></div>
      <h2 class="h2">לא חייבים החלטה מושלמת</h2>
      <p class="p">המטרה היא לבחור צעד שלא יזיק, ולזוז קדימה.</p>

      <label class="muted">מה הדילמה? (משפט אחד)</label>
      <input id="dText" placeholder="לדוגמה: לדבר עם הבוס על שכר או לחכות?" />

      <div class="card" style="margin-top:12px;">
        <div class="pill">מיפוי קצר</div>
        <div class="hr"></div>

        <label class="muted">תחום</label>
        <select id="dDomain">
          <option value="work">עבודה</option>
          <option value="relationship">קשרים וזוגיות</option>
          <option value="family">משפחה</option>
          <option value="money">כסף</option>
          <option value="health">בריאות</option>
          <option value="self">אני מול עצמי</option>
          <option value="other">אחר</option>
        </select>

        <label class="muted" style="margin-top:10px;display:block;">דחיפות</label>
        <select id="dUrgency">
          <option value="low">לא דחוף</option>
          <option value="med" selected>בינוני</option>
          <option value="high">דחוף</option>
        </select>

        <label class="muted" style="margin-top:10px;display:block;">מה הסיכון אם אטעה?</label>
        <select id="dRisk">
          <option value="low">נמוך</option>
          <option value="med" selected>בינוני</option>
          <option value="high">גבוה</option>
        </select>

        <label class="muted" style="margin-top:10px;display:block;">כמה זה בשליטה שלי?</label>
        <select id="dControl">
          <option value="low">מעט</option>
          <option value="med" selected>בינוני</option>
          <option value="high">הרבה</option>
        </select>

        <label class="muted" style="margin-top:10px;display:block;">מה חשוב לי עכשיו?</label>
        <select id="dValue">
          <option value="calm">שקט נפשי</option>
          <option value="values">ערכים</option>
          <option value="long">טווח ארוך</option>
          <option value="harm">להימנע מנזק</option>
        </select>
      </div>

      <button class="btn btnPrimary" id="gen" type="button">תן לי 3 כיוונים</button>
      <div id="dResult" style="margin-top:12px;"></div>

      <div class="hr"></div>
      <div class="row">
        <button class="btn btnSecondary" id="back" type="button">חזרה</button>
        <button class="btn btnGhost" id="finish" type="button">שמור וסיים</button>
      </div>
    </section>
  `;

  document.getElementById("back").onclick = () => route("home");

  document.getElementById("gen").onclick = () => {
    const dilemma = (document.getElementById("dText").value || "").trim() || "הנושא";
    const domain  = document.getElementById("dDomain").value;
    const urgency = document.getElementById("dUrgency").value;
    const risk    = document.getElementById("dRisk").value;
    const control = document.getElementById("dControl").value;
    const value   = document.getElementById("dValue").value;

    const pack = buildDecisionPack({ dilemma, domain, urgency, risk, control, value });
    renderDecisionPack(pack);
  };

  document.getElementById("finish").onclick = () => {
    const payload = {
      dilemma: (document.getElementById("dText").value || "").trim(),
      domain: document.getElementById("dDomain").value,
      urgency: document.getElementById("dUrgency").value,
      risk: document.getElementById("dRisk").value,
      control: document.getElementById("dControl").value,
      value: document.getElementById("dValue").value,
      step: (document.getElementById("dStep")?.value || "").trim(),
      message: (document.getElementById("dMsg")?.value || "").trim()
    };
    route("finish", { mode:"דילמה", payload });
  };
}

/* ---------- Decision helpers (same logic, Hebrew clean) ---------- */
function domainLabel(v){
  return ({
    work:"עבודה",
    relationship:"קשרים וזוגיות",
    family:"משפחה",
    money:"כסף",
    health:"בריאות",
    self:"אני מול עצמי",
    other:"אחר"
  })[v] || "אחר";
}

function buildDecisionPack({ dilemma, domain, urgency, risk, control, value }){
  const highRisk = risk === "high";
  const highUrg  = urgency === "high";
  const lowCtrl  = control === "low";

  let mode = "act";
  if (highRisk && !highUrg) mode = "gather";
  if (highRisk && highUrg) mode = "safe";
  if (!highRisk && !highUrg) mode = "experiment";
  if (lowCtrl) mode = highRisk ? "boundaries" : "influence";

  const psychoDomain = ({
    work:"בעבודה, משפט קצר וברור עובד יותר משיחה ארוכה.",
    relationship:"בקשרים, עדיף לדבר ברור ועדין מאשר לרמוז.",
    family:"במשפחה, גבול קטן ועקבי עובד יותר מהסבר ארוך.",
    money:"בכסף, עדיף לצמצם סיכון לפני שמחליטים.",
    health:"בבריאות, עדיף צעד מינימלי ובטוח לפני החלטות כבדות.",
    self:"מול עצמנו, ניסוי קטן עדיף מהבטחה גדולה.",
    other:"נפרק את זה לצעד אחד קטן."
  })[domain] || "נפרק את זה לצעד אחד קטן.";

  const psychoValue = ({
    calm:"אם המטרה היא שקט נפשי, נעדיף יציבות והורדת עומס.",
    values:"אם המטרה היא ערכים, נבחר מה שמתאים לאדם שאנחנו רוצים להיות.",
    long:"אם המטרה היא טווח ארוך, נעדיף צעד שמייצר תוצאה מצטברת.",
    harm:"אם המטרה היא להימנע מנזק, נעדיף צעד בטוח והפיך."
  })[value] || "";

  const rules = [];
  if (highRisk) rules.push("אם הסיכון גבוה — עדיף צעד בטוח והפיך. כשצריך, מתייעצים עם גורם מוסמך.");
  if (highUrg) rules.push("אם זה דחוף — בוחרים צעד קטן היום וקובעים זמן החלטה.");
  if (lowCtrl) rules.push("אם זה לא בשליטה מלאה — מתמקדים במה שכן בשליטה: בקשה ברורה, גבול, ותיאום.");

  const base = [
    makeActionOption(dilemma, { domain, highRisk, lowCtrl }),
    makeGatherOption(dilemma, { domain, highRisk, highUrg }),
    makeExperimentOption(dilemma, { domain, highRisk, lowCtrl })
  ];

  const order = ({
    act:[0,2,1],
    gather:[1,2,0],
    safe:[2,1,0],
    boundaries:[0,1,2],
    influence:[0,2,1],
    experiment:[2,0,1]
  })[mode] || [0,2,1];

  return {
    meta:{ dilemma, domain, urgency, risk, control, value, mode },
    psycho: `${psychoDomain} ${psychoValue}`.trim(),
    rules,
    options: order.map(i=>base[i])
  };
}

function makeActionOption(dilemma, { domain, highRisk, lowCtrl }){
  const why  = highRisk
    ? "כשיש סיכון גבוה, עדיף צעד קטן שלא שורף גשרים."
    : "צעד ברור מקטין תקיעות ונותן מידע אמיתי.";

  let script = `נוסח קצר: "חשוב לי X. המצב עכשיו Y. אני מבקש Z. מתי נוח לדבר?"`;
  if (domain === "work") script = `נוסח לעבודה: "אפשר לתאם 10 דקות השבוע? רציתי לדבר על ${dilemma}."`;
  if (domain === "relationship") script = `נוסח לקשר: "חשוב לי לדבר על ${dilemma}. מתי נוח לך 10 דקות?"`;
  if (domain === "family") script = `נוסח למשפחה: "בוא נעשה סדר לגבי ${dilemma}. אפשר לדבר קצר השבוע?"`;
  if (domain === "money") script = `נוסח לכסף: "כדי להרגיש בטוחים, צריך לסגור את ${dilemma}. מתי נוח לדבר?"`;

  const riskNote = highRisk ? "טיפ: כתוב טיוטה, חכה שעה, ורק אז שלח." : "טיפ: משפט אחד מספיק.";
  const ctrlNote = lowCtrl ? "אם זה לא בשליטה מלאה — תתמקד בבקשה או גבול שלך." : "אם זה בשליטה שלך — בחר צעד שאפשר לעשות היום.";

  return {
    key:"action",
    title:"כיוון 1: פעולה או שיחה קצרה",
    why,
    prompt:`מה הצעד הכי קטן שאפשר לעשות היום סביב "${dilemma}"?`,
    helper:`${script}\n${riskNote}\n${ctrlNote}`
  };
}

function makeGatherOption(dilemma, { domain, highRisk, highUrg }){
  const why = "איסוף מידע טוב מונע החלטה מתוך לחץ או ניחוש.";
  const plan = highUrg
    ? "היום: בודקים דבר אחד. בתוך 24–48 שעות: מחליטים."
    : "כותבים שתי שאלות שחסרות, מתייעצים עם אדם אחד, וקובעים תאריך החלטה.";

  const qExamples = ({
    work:"שאלות: מה נחשב הצלחה? מה האלטרנטיבות? מה סדרי הגודל המקובלים?",
    relationship:"שאלות: מה אני צריך באמת? מה הגבול שלי? מה ייחשב שיפור קטן?",
    family:"שאלות: מה אפשר לסכם? מה הגבול שלי? מי יכול לעזור ביישום?",
    money:"שאלות: מה העלות האמיתית? מה ההשפעה החודשית? מה התרחיש הרע הסביר?",
    health:"שאלות: מה אומר איש מקצוע? מה בדיקת העובדות? מה צעד מינימלי בטוח?",
    self:"שאלות: מה המכשול האמיתי? מה גרסה קטנה יותר של המטרה?"
  })[domain] || "שאלות: מה חסר לי כדי להחליט? מה אפשר לבדוק היום?";

  const safety = highRisk ? "אם זה קשור לבריאות/חוק/בטיחות — מתייעצים עם גורם מוסמך." : "מטרה: בהירות, לא דחיינות.";

  return {
    key:"gather",
    title:"כיוון 2: איסוף מידע ואז החלטה",
    why,
    prompt:`מה שתי העובדות שחסרות לך כדי להחליט על "${dilemma}"?`,
    helper:`${plan}\n${qExamples}\n${safety}`
  };
}

function makeExperimentOption(dilemma, { domain, highRisk, lowCtrl }){
  const why = "ניסוי קטן נותן מידע אמיתי בלי להתחייב בגדול.";
  const ex = ({
    work:"ניסוי: לנסח הודעה קצרה ולבקש שיחה. זה בודק תגובה בלי להעמיס.",
    relationship:"ניסוי: משפט אחד ברור ועדין, ואז לבדוק תגובה במשך 24 שעות.",
    family:"ניסוי: גבול קטן לשבוע, ואז לראות אם זה מוריד עומס.",
    money:"ניסוי: הקפאה ל-48 שעות ובדיקה של חלופה אחת זולה יותר.",
    health:"ניסוי: צעד מינימלי ובטוח (תיאום תור / בדיקת מידע / 10 דקות פעילות קלה).",
    self:"ניסוי: 10 דקות התחלה ולרשום איך זה מרגיש לפני ואחרי."
  })[domain] || "ניסוי: צעד הפיך של 10 דקות שייתן אינדיקציה.";

  const safety = highRisk ? "אם יש סיכון גבוה — הניסוי חייב להיות בטוח והפיך." : "המטרה היא להתקדם קצת, לא לפתור הכול עכשיו.";
  const influence = lowCtrl ? "אם זה לא בשליטה מלאה — בחר ניסוי שמעלה השפעה: בקשה, גבול, או תיאום." : "אם זה בשליטה שלך — בחר ניסוי שאפשר לבצע מיד.";

  return {
    key:"experiment",
    title:"כיוון 3: ניסוי קטן במקום החלטה גדולה",
    why,
    prompt:`איזה ניסוי של 10 דקות סביב "${dilemma}" יכול לעזור?`,
    helper:`${ex}\n${safety}\n${influence}`
  };
}

function generateMessageOptions({ domain, risk, urgency, dilemma }){
  const highRisk = risk === "high";
  const isUrgent = urgency === "high";
  const soft = highRisk ? "בעדינות" : "בקצרה";
  const time = isUrgent ? "היום או מחר" : "השבוע";

  if (domain === "work"){
    return [
      `היי, אפשר לתאם 10 דקות ${time}? רציתי לדבר על ${dilemma}.`,
      `היי, חשוב לי לדבר ${soft} על ${dilemma}. מתי נוח לך 10 דקות?`,
      `היי, אפשר רגע קצר ${time}? אני רוצה לעשות סדר לגבי ${dilemma}.`
    ];
  }
  if (domain === "relationship"){
    return [
      `חשוב לי לדבר ${soft} על ${dilemma}. מתי נוח לך 10 דקות?`,
      `אפשר לדבר קצר ${time}? אני רוצה לסכם משהו לגבי ${dilemma}.`,
      `אני רוצה לשים את זה ברור ועדין: ${dilemma}. מתי אפשר לדבר?`
    ];
  }
  if (domain === "family"){
    return [
      `אפשר לדבר קצר ${time} על ${dilemma}? חשוב לי לעשות סדר.`,
      `בוא נעשה תיאום קצר ${time} לגבי ${dilemma}. מתי נוח?`,
      `חשוב לי לשים גבול קטן בנושא ${dilemma}. אפשר לדבר 10 דקות?`
    ];
  }
  if (domain === "money"){
    return [
      `כדי להרגיש בטוחים, צריך לדבר קצר על ${dilemma}. מתי נוח ${time}?`,
      `אפשר 10 דקות ${time} לגבי ${dilemma}? אני רוצה לעשות סדר.`,
      `חשוב לי לדבר ${soft} על ${dilemma}. מתי נוח לך?`
    ];
  }
  return [
    `אפשר לדבר קצר ${time} על ${dilemma}?`,
    `חשוב לי לסכם משהו לגבי ${dilemma}. מתי נוח לך 10 דקות?`,
    `אני רוצה לשים את זה ברור: ${dilemma}. מתי אפשר לדבר?`
  ];
}

function renderDecisionPack(pack){
  const rulesHtml = pack.rules?.length ? `
    <div class="card">
      <div class="pill">מה חשוב לזכור</div>
      <div class="hr"></div>
      <ul style="margin:0; padding-right:18px; color:var(--muted); font-weight:800; line-height:1.6">
        ${pack.rules.map(r=>`<li>${esc(r)}</li>`).join("")}
      </ul>
    </div>
  ` : "";

  const optsHtml = pack.options.map((o,i)=>`
    <div class="card">
      <div class="pill">${esc(o.title)}</div>
      <div class="hr"></div>
      <div style="color:var(--muted); font-weight:800">${esc(o.why)}</div>
      <div class="hr"></div>
      <div style="font-weight:900">${esc(o.prompt)}</div>
      <pre style="white-space:pre-wrap; margin:10px 0 0; font-family:inherit; color:var(--muted); font-weight:800; line-height:1.6">${esc(o.helper)}</pre>
      <div style="height:10px"></div>
      <button class="btn btnSecondary" type="button" data-choose="${i}">בחר כיוון</button>
    </div>
  `).join("");

  document.getElementById("dResult").innerHTML = `
    <div class="card" style="background:linear-gradient(180deg, rgba(99,102,241,.10), rgba(255,255,255,.86));">
      <div class="pill">הסבר קצר</div>
      <div class="hr"></div>
      <div style="font-weight:900; line-height:1.55">${esc(pack.psycho)}</div>
    </div>
    ${rulesHtml}
    <div class="card">
      <div class="pill">שלושה כיוונים אפשריים</div>
      <div class="hr"></div>
      <div class="p" style="margin:0">בחר אחד. אחר כך נכתוב צעד קטן ונשמור.</div>
    </div>
    ${optsHtml}
    <div class="card">
      <div class="pill">צעד קטן לביצוע</div>
      <div class="hr"></div>
      <input id="dStep" placeholder='לדוגמה: "לנסח הודעה ולבקש 10 דקות שיחה ביום רביעי"' />
      <div class="hr"></div>
      <label class="muted">הודעה או משפט פתיחה (אופציונלי)</label>
      <input id="dMsg" placeholder='לדוגמה: "אפשר לתאם 10 דקות השבוע?"' />
      <div style="height:10px"></div>
      <button class="btn btnSecondary" id="msgGen" type="button">תן לי 3 ניסוחים</button>
      <div id="msgBox" style="margin-top:10px;"></div>
    </div>
  `;

  document.querySelectorAll("[data-choose]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const i = Number(btn.getAttribute("data-choose"));
      const chosen = pack.options[i];
      const stepEl = document.getElementById("dStep");
      if (stepEl && !stepEl.value.trim()){
        const suggestion = chosen.key === "action"
          ? "צעד קטן: לנסח הודעה קצרה ולבקש זמן שיחה."
          : chosen.key === "gather"
            ? "צעד קטן: לכתוב שתי שאלות חסרות ולשאול אדם אחד היום."
            : "צעד קטן: לעשות ניסוי של 10 דקות ולרשום תוצאה אחת.";
        stepEl.value = suggestion;
      }
      stepEl?.focus();
    });
  });

  document.getElementById("msgGen").addEventListener("click", ()=>{
    const domain  = document.getElementById("dDomain").value;
    const urgency = document.getElementById("dUrgency").value;
    const risk    = document.getElementById("dRisk").value;
    const dilemma = (document.getElementById("dText").value||"").trim() || "הנושא";
    const msgs = generateMessageOptions({ domain, urgency, risk, dilemma });

    document.getElementById("msgBox").innerHTML = msgs.map((m,idx)=>`
      <div class="card">
        <div class="pill">ניסוח ${idx+1}</div>
        <div class="hr"></div>
        <div style="font-weight:900; line-height:1.55">${esc(m)}</div>
        <div style="height:10px"></div>
        <button class="btn btnSecondary" type="button" data-pickmsg="${idx}">להשתמש בזה</button>
        <button class="btn btnGhost" type="button" data-copy="${idx}">העתק</button>
      </div>
    `).join("");

    document.querySelectorAll("[data-pickmsg]").forEach(b=>{
      b.addEventListener("click", ()=>{
        const idx = Number(b.getAttribute("data-pickmsg"));
        const msgEl = document.getElementById("dMsg");
        msgEl.value = msgs[idx];
        msgEl.focus();
      });
    });
    document.querySelectorAll("[data-copy]").forEach(b=>{
      b.addEventListener("click", ()=>{
        const idx = Number(b.getAttribute("data-copy"));
        safeCopy(msgs[idx]);
      });
    });
  });
}

/* ---------- Finish (save) ---------- */
function renderFinish({ mode, payload }){
  setActive("home");
  screen.className = "fadeIn";

  let moved = false;
  let val = 0;
  let rating = null;

  screen.innerHTML = `
    <section class="card">
      <div class="pill">לפני ששומרים</div>
      <div class="hr"></div>

      <h2 class="h2">כמה זה חזק עכשיו?</h2>
      <p class="p">אנחנו מודדים עוצמה כדי להבין דפוסים. אין פה שיפוט.</p>

      <div class="card" style="background:linear-gradient(180deg, rgba(14,165,166,.10), rgba(255,255,255,.86));">
        <div class="pill">עוצמה</div>
        <div class="sliderWrap">
          <input id="range" type="range" min="0" max="10" value="0" step="1" />
          <div id="rVal" class="sliderVal"><strong>לא נבחר</strong></div>
        </div>
        <div style="color:var(--muted); font-weight:800; margin-top:6px;">0–10</div>
      </div>

      <div class="card">
        <div class="pill">טריגר (אופציונלי)</div>
        <div class="hr"></div>
        <select id="trig">
          <option value="">לא נבחר</option>
          ${TRIGGERS.map(t=>`<option value="${t.id}">${esc(t.label)}</option>`).join("")}
        </select>
      </div>

      <div class="card">
        <div class="pill">האם זה עזר?</div>
        <div class="hr"></div>
        <div class="row">
          <button class="btn btnSecondary" data-rate="0" type="button">לא ממש</button>
          <button class="btn btnPrimary" data-rate="1" type="button">כן, קצת</button>
        </div>
      </div>

      <div class="card">
        <div class="pill">הערה קצרה (אופציונלי)</div>
        <div class="hr"></div>
        <input id="note" placeholder="לדוגמה: אחרי 2 דקות היה יותר קל" />
      </div>

      <div class="row">
        <button class="btn btnSecondary" id="back" type="button">חזרה</button>
        <button class="btn btnPrimary" id="save" type="button">שמור וסיים</button>
      </div>
    </section>
  `;

  const range = document.getElementById("range");
  const rVal = document.getElementById("rVal");

  function intensityColor(v){
    // return CSS var name
    if (v <= 3) return "rgba(52,211,153,.25)";
    if (v <= 6) return "rgba(251,146,60,.22)";
    return "rgba(239,68,68,.20)";
  }

  range.addEventListener("input", ()=>{
    moved = true;
    val = Number(range.value);
    rVal.innerHTML = `<strong>${val} מתוך 10</strong>`;
    // subtle glow
    range.style.filter = `drop-shadow(0 10px 18px ${intensityColor(val)})`;
  });

  screen.querySelectorAll("[data-rate]").forEach(b=>{
    b.addEventListener("click", ()=>{
      rating = Number(b.getAttribute("data-rate"));
      // visual cue
      screen.querySelectorAll("[data-rate]").forEach(x=>x.style.opacity="0.75");
      b.style.opacity = "1";
    });
  });

  document.getElementById("back").onclick = () => {
    if (mode === "לחץ/הצפה") return route("reg");
    if (mode === "מחשבה") return route("thought");
    if (mode === "דילמה") return route("dilemma");
    return route("home");
  };

  document.getElementById("save").onclick = () => {
    const trigger = (document.getElementById("trig").value || "").trim() || null;
    const note = (document.getElementById("note").value || "").trim();

    addLog({
      ts: Date.now(),
      mode,
      type: normalizeType(mode),
      rating,
      note: note || null,
      intensity: moved ? val : null,
      trigger,
      payload
    });

    screen.innerHTML = `
      <section class="card fadeIn">
        <div class="pill">נשמר</div>
        <div class="hr"></div>
        <h2 class="h2">נשמר. עשית צעד.</h2>
        <p class="p">אפשר לחזור לזה מתי שתרצה.</p>
        <button class="btn btnPrimary" id="goHome" type="button">חזרה לבית</button>
      </section>
    `;
    document.getElementById("goHome").onclick = () => route("home");
  };
}

/* ---------- History ---------- */
function ratingLabel(r){
  if (r === 1) return "עזר קצת";
  if (r === 0) return "לא ממש";
  return "לא סומן";
}
function timeBucket(h){
  if (h >= 5 && h <= 11) return "בוקר (05–11)";
  if (h >= 12 && h <= 16) return "צהריים (12–16)";
  if (h >= 17 && h <= 21) return "ערב (17–21)";
  return "לילה (22–04)";
}

function extractSummary(entry){
  const t = entry.type || normalizeType(entry.mode);
  const p = entry.payload || {};
  if (t === "הרגעה"){
    return { subject: p.exerciseTitle ? `תרגיל: ${p.exerciseTitle}` : "תרגיל הרגעה", details: [] };
  }
  if (t === "מחשבה"){
    const details = [];
    if (p.question) details.push(`שאלה: ${p.question}`);
    if (p.alternative) details.push(`חלופה: ${p.alternative}`);
    return { subject: p.thought ? `מחשבה: ${p.thought}` : "מחשבה", details };
  }
  if (t === "דילמה"){
    const details = [];
    if (p.domain) details.push(`תחום: ${domainLabel(p.domain)}`);
    if (p.step) details.push(`צעד: ${p.step}`);
    if (p.message) details.push(`הודעה: ${p.message}`);
    return { subject: p.dilemma ? `דילמה: ${p.dilemma}` : "דילמה", details };
  }
  return { subject: "אירוע", details: [] };
}

function entrySearchText(x){
  const p = x.payload || {};
  const pieces = [];
  pieces.push(tsFmt(x.ts));
  pieces.push(dateKey(x.ts));
  pieces.push(dateLabel(dateKey(x.ts)));
  pieces.push(timeFmt(x.ts));
  pieces.push(x.type || normalizeType(x.mode));
  if (x.trigger) pieces.push(triggerLabel(x.trigger));
  if (x.note) pieces.push(x.note);

  if (p.exerciseTitle) pieces.push(p.exerciseTitle);
  if (p.thought) pieces.push(p.thought);
  if (p.question) pieces.push(p.question);
  if (p.alternative) pieces.push(p.alternative);
  if (p.dilemma) pieces.push(p.dilemma);
  if (p.step) pieces.push(p.step);
  if (p.message) pieces.push(p.message);
  if (p.domain) pieces.push(domainLabel(p.domain));

  return normStr(pieces.join(" | "));
}

function calcIntensityStats(list){
  const values = list
    .map(x => x.intensity)
    .filter(v => v !== null && v !== undefined && Number.isFinite(Number(v)))
    .map(v => Number(v));

  if (!values.length){
    return { avg:null, low:0, med:0, high:0, count:0 };
  }
  const sum = values.reduce((a,b)=>a+b,0);
  const avg = sum / values.length;
  let low=0, med=0, high=0;
  values.forEach(v=>{
    if (v <= 3) low++;
    else if (v <= 6) med++;
    else high++;
  });
  return { avg, low, med, high, count: values.length };
}

function topTriggers(list){
  const counts = {};
  list.forEach(x=>{
    if (!x.trigger) return;
    counts[x.trigger] = (counts[x.trigger]||0) + 1;
  });
  return Object.entries(counts)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,3)
    .map(([k,v])=> `${triggerLabel(k)} (${v})`);
}

function renderHistory(){
  setActive("history");
  screen.className = "fadeIn";

  const state = window.__histState || { q:"", type:"all" };
  window.__histState = state;

  const logs = loadLogs().sort((a,b)=>(b.ts||0)-(a.ts||0));
  const q = normStr(state.q);

  const filtered = logs.filter(x=>{
    const t = x.type || normalizeType(x.mode);
    const okType = state.type === "all" ? true : t === state.type;
    if (!okType) return false;
    if (!q) return true;
    return entrySearchText(x).includes(q);
  });

  // grouped by day (collapsed)
  const groups = {};
  filtered.forEach(x=>{
    const k = dateKey(x.ts||0);
    if (!groups[k]) groups[k] = [];
    groups[k].push(x);
  });
  const keys = Object.keys(groups).sort((a,b)=> a<b ? 1 : -1);

  // summary: counts + time buckets + triggers + intensity
  const byType = { "הרגעה":0, "מחשבה":0, "דילמה":0 };
  const byBucket = { "בוקר (05–11)":0, "צהריים (12–16)":0, "ערב (17–21)":0, "לילה (22–04)":0 };
  filtered.forEach(x=>{
    const t = x.type || normalizeType(x.mode);
    if (byType[t] != null) byType[t] += 1;
    const h = new Date(x.ts||0).getHours();
    byBucket[timeBucket(h)] = (byBucket[timeBucket(h)]||0) + 1;
  });

  const trigTop = topTriggers(filtered);
  const inten = calcIntensityStats(filtered);

  screen.innerHTML = `
    <section class="card">
      <div class="pill">היסטוריה (מקובצת לפי יום)</div>
      <div class="hr"></div>

      <div class="row">
        <div style="flex:1 1 240px;">
          <label class="muted">חיפוש</label>
          <input id="q" value="${esc(state.q)}" placeholder='חיפוש (גם תאריך/שעה כמו "28/12" או "09:")' />
        </div>
        <div style="flex:1 1 180px;">
          <label class="muted">סוג</label>
          <select id="type">
            <option value="all">הכול</option>
            <option value="הרגעה">הרגעה</option>
            <option value="מחשבה">מחשבה</option>
            <option value="דילמה">דילמה</option>
          </select>
        </div>
      </div>

      <div class="hr"></div>

      <div class="card" style="background:linear-gradient(180deg, rgba(14,165,166,.10), rgba(255,255,255,.86));">
        <div class="pill">ניטור — סיכום</div>
        <div class="hr"></div>
        <div style="font-weight:900">סה״כ אירועים אחרי סינון: ${filtered.length}</div>

        <div class="hr"></div>
        <div style="color:var(--muted); font-weight:800">לפי סוג</div>
        <div style="margin-top:8px; font-weight:900">
          הרגעה: ${byType["הרגעה"]} · מחשבה: ${byType["מחשבה"]} · דילמה: ${byType["דילמה"]}
        </div>

        <div class="hr"></div>
        <div style="color:var(--muted); font-weight:800">שעות קשות (כמות)</div>
        <div style="margin-top:8px; font-weight:900; line-height:1.6">
          בוקר: ${byBucket["בוקר (05–11)"]||0} · צהריים: ${byBucket["צהריים (12–16)"]||0}<br/>
          ערב: ${byBucket["ערב (17–21)"]||0} · לילה: ${byBucket["לילה (22–04)"]||0}
        </div>

        <div class="hr"></div>
        <div style="color:var(--muted); font-weight:800">מדד עוצמה</div>
        <div style="margin-top:8px; font-weight:900; line-height:1.6">
          ${inten.avg === null ? "אין מספיק נתונים (לא נבחרה עוצמה)." : `ממוצע: ${inten.avg.toFixed(1)} / 10`}
          <br/>
          נמוכה (0–3): ${inten.low} · בינונית (4–6): ${inten.med} · גבוהה (7–10): ${inten.high}
        </div>

        <div class="hr"></div>
        <div style="color:var(--muted); font-weight:800">טריגרים מובילים</div>
        <div style="margin-top:8px; font-weight:900">
          ${trigTop.length ? esc(trigTop.join(" · ")) : "לא סומן"}
        </div>
      </div>

      <div class="hr"></div>
      <div class="row">
        <button class="btn btnSecondary" id="clearQ" type="button" ${state.q ? "" : "disabled"}>נקה חיפוש</button>
        <button class="btn btnSecondary" id="export" type="button">העתק סיכום</button>
        <button class="btn btnGhost" id="wipe" type="button">איפוס הכול</button>
      </div>
    </section>

    ${keys.length ? keys.map(k => renderDayGroup(k, groups[k])).join("") : `
      <section class="card">
        <div class="pill">אין רשומות</div>
        <div class="hr"></div>
        <div class="p" style="margin:0">עדיין לא נשמרו אירועים — או שהסינון/חיפוש סגר הכול.</div>
      </section>
    `}
  `;

  // set selects
  const typeEl = document.getElementById("type");
  typeEl.value = state.type;

  // handlers
  let tmr = null;
  document.getElementById("q").addEventListener("input", (e)=>{
    clearTimeout(tmr);
    tmr = setTimeout(()=>{
      state.q = e.target.value;
      renderHistory();
    }, 250);
  });
  typeEl.addEventListener("change", ()=>{
    state.type = typeEl.value;
    renderHistory();
  });

  document.getElementById("clearQ").onclick = () => {
    state.q = "";
    renderHistory();
  };

  document.getElementById("wipe").onclick = () => {
    const ok = confirm("למחוק את כל ההיסטוריה מהמכשיר? אין שחזור.");
    if (!ok) return;
    saveLogs([]);
    renderHistory();
  };

  document.getElementById("export").onclick = () => {
    const txt = [
      `סיכום — במחשבה שנייה`,
      `אירועים אחרי סינון: ${filtered.length}`,
      `הרגעה: ${byType["הרגעה"]}, מחשבה: ${byType["מחשבה"]}, דילמה: ${byType["דילמה"]}`,
      `שעות: בוקר ${byBucket["בוקר (05–11)"]||0}, צהריים ${byBucket["צהריים (12–16)"]||0}, ערב ${byBucket["ערב (17–21)"]||0}, לילה ${byBucket["לילה (22–04)"]||0}`,
      inten.avg === null ? `עוצמה: אין נתונים` : `עוצמה ממוצעת: ${inten.avg.toFixed(1)} / 10 (נמוכה ${inten.low}, בינונית ${inten.med}, גבוהה ${inten.high})`,
      trigTop.length ? `טריגרים מובילים: ${trigTop.join(", ")}` : `טריגרים: לא סומן`
    ].join("\n");
    safeCopy(txt);
    alert("הסיכום הועתק ללוח.");
  };

  // collapse handlers
  document.querySelectorAll("[data-day]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const key = btn.getAttribute("data-day");
      const body = document.querySelector(`[data-daybody="${key}"]`);
      const chev = btn.querySelector(".chev");
      const open = body.getAttribute("data-open") === "1";
      body.setAttribute("data-open", open ? "0" : "1");
      body.style.display = open ? "none" : "block";
      chev.textContent = open ? "▸" : "▾";
    });
  });

  // per-entry delete/copy
  document.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const ts = Number(b.getAttribute("data-del"));
      const next = loadLogs().filter(x => (x.ts||0) !== ts);
      saveLogs(next);
      renderHistory();
    });
  });
  document.querySelectorAll("[data-copy-step]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const ts = Number(b.getAttribute("data-copy-step"));
      const e = loadLogs().find(x => (x.ts||0) === ts);
      safeCopy(e?.payload?.step || "");
    });
  });
  document.querySelectorAll("[data-copy-msg]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const ts = Number(b.getAttribute("data-copy-msg"));
      const e = loadLogs().find(x => (x.ts||0) === ts);
      safeCopy(e?.payload?.message || "");
    });
  });
}

function renderDayGroup(key, items){
  // day summary
  const inten = calcIntensityStats(items);
  const topTr = topTriggers(items);

  const summaryLine = [
    `אירועים: ${items.length}`,
    inten.avg === null ? `עוצמה: —` : `עוצמה ממוצעת: ${inten.avg.toFixed(1)}`,
    topTr.length ? `טריגרים: ${topTr.join(" · ")}` : `טריגרים: —`
  ].join(" • ");

  const cards = items
    .sort((a,b)=>(b.ts||0)-(a.ts||0))
    .map(x=>{
      const t = x.type || normalizeType(x.mode);
      const { subject, details } = extractSummary(x);
      const p = x.payload || {};
      const hasStep = (p.step||"").trim();
      const hasMsg = (p.message||"").trim();

      const intensityText = (x.intensity === null || x.intensity === undefined)
        ? "עוצמה: לא נבחרה"
        : `עוצמה: ${x.intensity}/10`;

      const trigText = x.trigger ? `טריגר: ${triggerLabel(x.trigger)}` : "טריגר: לא נבחר";

      return `
        <div class="card" style="box-shadow:var(--shadow2);">
          <div class="pill">${esc(timeFmt(x.ts))} · ${esc(t)} · ${esc(ratingLabel(x.rating))}</div>
          <div style="margin-top:8px; color:var(--muted); font-weight:800">${esc(intensityText)} · ${esc(trigText)}</div>
          <div class="hr"></div>

          <div style="font-weight:900">${esc(subject)}</div>
          ${details?.length ? `<div style="margin-top:8px; color:var(--muted); font-weight:800; line-height:1.55">${details.map(d=>esc(d)).join("<br/>")}</div>` : ""}

          ${x.note ? `<div style="margin-top:10px; color:var(--muted); font-weight:800">הערה: ${esc(x.note)}</div>` : ""}

          ${(hasStep || hasMsg) ? `<div class="hr"></div>` : ""}

          ${hasStep ? `
            <div style="color:var(--muted); font-weight:800">צעד</div>
            <div style="margin-top:6px; font-weight:900; line-height:1.55">${esc(p.step)}</div>
            <div class="row" style="margin-top:10px;">
              <button class="btn btnSecondary" type="button" data-copy-step="${x.ts}">העתק צעד</button>
            </div>
          ` : ""}

          ${hasMsg ? `
            <div style="margin-top:10px; color:var(--muted); font-weight:800">הודעה</div>
            <div style="margin-top:6px; font-weight:900; line-height:1.55">${esc(p.message)}</div>
            <div class="row" style="margin-top:10px;">
              <button class="btn btnSecondary" type="button" data-copy-msg="${x.ts}">העתק הודעה</button>
            </div>
          ` : ""}

          <div class="row" style="margin-top:12px;">
            <button class="smallBtn" data-del="${x.ts}" type="button">מחק</button>
          </div>
        </div>
      `;
    }).join("");

  return `
    <section class="card">
      <button class="dayHeader" type="button" data-day="${esc(key)}">
        <div>
          <div style="font-weight:900">יום: ${esc(dateLabel(key))}</div>
          <div class="dayMeta">${esc(summaryLine)}</div>
        </div>
        <div class="chev">▸</div>
      </button>
      <div data-daybody="${esc(key)}" data-open="0" style="display:none; margin-top:12px;">
        ${cards}
      </div>
    </section>
  `;
}

/* ---------- Settings ---------- */
function renderSettings(){
  const overlay = openModal(`
    <div class="modalTop">
      <div class="modalTitle">הגדרות ופרטיות</div>
      <button class="closeBtn" id="closeModal" type="button">סגור</button>
    </div>
    <div class="hr"></div>

    <div class="card" style="box-shadow:var(--shadow2);">
      <div class="pill">פרטיות</div>
      <div class="hr"></div>
      <div style="color:var(--muted); font-weight:800; line-height:1.65">
        כל המידע נשמר <strong>רק במכשיר</strong> (Local Storage). אין שיתוף אוטומטי ואין העלאה לשרת.
        <br/>אם תרצה בהמשך סטטיסטיקה אנונימית — נעשה את זה בנפרד ובאישור מפורש.
      </div>
    </div>

    <div class="card" style="box-shadow:var(--shadow2);">
      <div class="pill">תחזוקה</div>
      <div class="hr"></div>
      <div class="row">
        <button class="btn btnSecondary" id="goHomeBtn" type="button">חזרה לבית</button>
        <button class="btn btnSecondary" id="goHistBtn" type="button">להיסטוריה</button>
        <button class="btn btnGhost" id="resetSplash" type="button">הצג Splash שוב</button>
      </div>
      <div style="height:10px"></div>
      <button class="btn btnSecondary" id="resetAll" type="button" style="border-color: rgba(239,68,68,.25);">
        איפוס מלא (מוחק היסטוריה)
      </button>
    </div>
  `);

  overlay.querySelector("#closeModal").onclick = () => overlay.remove();
  overlay.querySelector("#goHomeBtn").onclick = () => { overlay.remove(); route("home"); };
  overlay.querySelector("#goHistBtn").onclick = () => { overlay.remove(); route("history"); };

  overlay.querySelector("#resetSplash").onclick = () => {
    localStorage.removeItem(KEY_SPLASH_SEEN);
    alert("בכניסה הבאה יוצג מסך פתיחה.");
  };

  overlay.querySelector("#resetAll").onclick = () => {
    const ok = confirm("לאפס הכול? זה מוחק היסטוריה מהמכשיר.");
    if (!ok) return;
    localStorage.removeItem(KEY_LOGS);
    localStorage.removeItem(KEY_LAST);
    alert("אופס. הכול אופס מקומית.");
    overlay.remove();
    route("home");
  };
}

/* ---------- PWA SW ---------- */
if ("serviceWorker" in navigator){
  window.addEventListener("load", ()=>{
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  });
}

/* ---------- Start ---------- */
runSplash();
route("home");
