"use strict";

const $ = (id) => document.getElementById(id);
const LS_FAV = "yy_favs_v1";
const LS_CHECK = "yy_checkins_v1";
const LS_PRACTICE = "yy_practice_v1";

/* ---------- 工具 ---------- */
function pad(n) { return String(n).padStart(2, "0"); }
function todayStr(d) {
  d = d || new Date();
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch (e) { return fallback; }
}
function writeLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

/* ---------- 数据 ---------- */
let favs = new Set(readLS(LS_FAV, []));
let checkins = new Set(readLS(LS_CHECK, []));
let practices = new Set(readLS(LS_PRACTICE, []));
let currentIdx = dailyIndex();
let browseCat = "全部";
let searchKw = "";
let modalCard = null;
let humorIdx = humorDailyIndex();
let humorCat = "全部";
let humorKw = "";
let goldenIdx = goldenDailyIndex();

const KNOWLEDGE = CARDS.concat(GROWTH || []);
const ALL = KNOWLEDGE.concat(BANTER || []);

function dailyIndex() {
  return hashStr(todayStr()) % CARDS.length;
}
function humorDailyIndex() {
  return hashStr(todayStr() + "-humor") % BANTER.length;
}
function goldenDailyIndex() {
  return hashStr(todayStr() + "-golden") % GOLDEN.length;
}
function flirtCards() {
  return BANTER.filter((p) => p.c === "暧昧局·调情");
}
function todayPracticeIdx() {
  const list = flirtCards();
  return hashStr(todayStr() + "-practice") % list.length;
}
function calcStreak() {
  const d = new Date();
  if (!checkins.has(todayStr(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (checkins.has(todayStr(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
function calcPracticeStreak() {
  const d = new Date();
  if (!practices.has(todayStr(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (practices.has(todayStr(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
function saveFavs() { writeLS(LS_FAV, Array.from(favs)); }
function saveCheckins() { writeLS(LS_CHECK, Array.from(checkins)); }
function savePractices() { writeLS(LS_PRACTICE, Array.from(practices)); }

/* ---------- 界面 ---------- */
let toastTimer = null;
function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 1800);
}

function renderHead() {
  $("headDate").textContent = todayStr();
  const lines = [
    "每天变好一点点",
    "先长根，再发芽",
    "慢慢来，比较快",
    "一颗土豆，也能顶天立地"
  ];
  $("headLine").textContent = lines[new Date().getDate() % lines.length];
}

function renderToday() {
  const p = CARDS[currentIdx];
  $("todayCat").textContent = p.c;
  $("todaySrc").textContent = "来源：" + (p.s || "综合整理");
  $("todayTitle").textContent = p.t;
  $("todayDetail").textContent = p.d || "";
  $("todayAction").textContent = p.a || "";
  $("todayAction").style.display = p.a ? "" : "none";

  const checked = checkins.has(todayStr());
  const btn = $("checkinBtn");
  btn.textContent = checked ? "✓ 今日已打卡" : "今日打卡";
  btn.classList.toggle("done", checked);

  const favBtn = $("favBtn");
  favBtn.textContent = favs.has(p.id) ? "★ 已收藏" : "☆ 收藏";
  favBtn.style.color = favs.has(p.id) ? "#C99A3F" : "";

  renderStreak();
  renderStats();
}

function renderStreak() {
  $("streakNum").textContent = calcStreak();
  const t = todayStr();
  if (checkins.has(t)) $("streakSub").textContent = "今天已打卡，继续保持！";
  else if (calcStreak() > 0) $("streakSub").textContent = "差一次就能续上，加油！";
  else $("streakSub").textContent = "今天还没打卡哦";
}

function renderStats() {
  $("statStreak").textContent = calcStreak();
  $("statTotal").textContent = checkins.size;
  $("statPractice").textContent = practices.size;
  $("statFav").textContent = favs.size;
  $("favCount").textContent = favs.size + " 个";
}

/* ---------- 幽默板块 ---------- */
function renderGolden() {
  const g = GOLDEN[goldenIdx];
  $("goldenTag").textContent = g.tag || "撩人金句";
  $("goldenLine").textContent = g.t;
}

function renderPractice() {
  const list = flirtCards();
  const p = list[todayPracticeIdx()];
  $("practiceCat").textContent = p.c;
  $("practiceSrc").textContent = "今日练习：" + p.t;
  $("practiceTitle").textContent = "把这句话用出去";
  $("practiceEx").textContent = p.ex || "";
  $("practiceEx").style.display = p.ex ? "" : "none";

  const done = practices.has(todayStr());
  const btn = $("practiceBtn");
  btn.textContent = done ? "✓ 今天练过了" : "练完打卡";
  btn.classList.toggle("done", done);

  const s = calcPracticeStreak();
  if (done) $("practiceStreakSub").textContent = "已连续练习 " + s + " 天，撩人手感正在养成";
  else if (s > 0) $("practiceStreakSub").textContent = "已连续练习 " + s + " 天，今天练完就续上";
  else $("practiceStreakSub").textContent = "练完点打卡，记录你的进步";
}

function renderHumorToday() {
  const p = BANTER[humorIdx];
  $("humorCat").textContent = p.c;
  $("humorSrc").textContent = "来源：" + (p.s || "综合整理");
  $("humorTitle").textContent = p.t;
  $("humorDetail").textContent = p.d || "";
  $("humorEx").textContent = p.ex || "";
  $("humorEx").style.display = p.ex ? "" : "none";
  $("humorAction").textContent = p.a || "";
  $("humorAction").style.display = p.a ? "" : "none";

  const favBtn = $("humorFavBtn");
  favBtn.textContent = favs.has(p.id) ? "★ 已收藏" : "☆ 收藏";
  favBtn.style.color = favs.has(p.id) ? "#C99A3F" : "";
}

const HUMOR_CATS = ["全部"].concat([...new Set(BANTER.map((p) => p.c))]);
function renderHumorChips() {
  $("humorChips").innerHTML = HUMOR_CATS.map((c) =>
    '<button class="chip' + (c === humorCat ? " on" : "") + '" data-hcat="' + esc(c) + '">' + esc(c) + "</button>"
  ).join("");
}

function filterBanter() {
  const kw = humorKw.trim().toLowerCase();
  return BANTER.filter((p) => {
    const okCat = humorCat === "全部" || p.c === humorCat;
    const okKw = !kw ||
      p.t.toLowerCase().includes(kw) ||
      (p.s || "").toLowerCase().includes(kw) ||
      (p.d || "").toLowerCase().includes(kw) ||
      (p.ex || "").toLowerCase().includes(kw) ||
      p.c.toLowerCase().includes(kw);
    return okCat && okKw;
  });
}

function humorItemHTML(p) {
  const isFav = favs.has(p.id);
  return (
    '<div class="point-item" data-open-id="' + p.id + '">' +
    '<div><p class="ppath">' + esc(p.c) + " · " + esc(p.s || "") + "</p>" +
    '<p class="ptitle">' + esc(p.t) + "</p>" +
    '<p class="pdetail">' + esc((p.d || "") + (p.ex ? "\n" + p.ex : "")) + "</p>" +
    "</div>" +
    '<button class="star' + (isFav ? " on" : "") + '" data-fav-id="' + p.id + '">' + (isFav ? "★" : "☆") + "</button>" +
    "</div>"
  );
}

function renderHumorList() {
  const list = filterBanter();
  $("humorList").innerHTML = list.length
    ? list.map(humorItemHTML).join("")
    : '<div class="empty">没有找到匹配的内容</div>';
}

/* ---------- 目录 ---------- */
let tocOpen = new Set();
function renderToc(){
  const groups = {};
  ALL.forEach((p)=>{ (groups[p.c]=groups[p.c]||[]).push(p); });
  const cats = Object.keys(groups).sort((a,b)=>groups[b].length-groups[a].length);
  $("tocCount").textContent = ALL.length + " 张";
  $("tocList").innerHTML = cats.map(c=>{
    const open = tocOpen.has(c);
    return '<div class="toc-cat card"><button class="toc-head" data-tcat="'+esc(c)+'">'+
      '<span class="toc-arrow">'+(open?"▾":"▸")+'</span><span class="toc-name">'+esc(c)+'</span>'+
      '<span class="toc-n">'+groups[c].length+" 张</span></button>"+
      (open?'<div class="toc-items">'+groups[c].map(p=>'<div class="toc-item" data-open-id="'+p.id+'">'+esc(p.t)+'</div>').join("")+'</div>':"")+
      "</div>";
  }).join("");
}

/* ---------- 专栏 ---------- */
function renderColumn(){
  $("colTitle").textContent = COLUMN.title;
  $("colIntro").textContent = COLUMN.intro;
  $("columnBody").innerHTML = COLUMN.sections.map(s=>
    '<div class="card"><div class="card-title">'+esc(s.h)+'</div>'+
    s.rows.map(r=>'<div class="col-row"><div class="col-t">'+esc(r.t)+'</div><div class="col-d">'+esc(r.d)+'</div></div>').join("")+'</div>').join("")+
    '<div class="card"><div class="card-title">误区：不是这样</div>'+
    COLUMN.myths.map(m=>'<div class="col-row myth"><div class="col-t">'+esc(m[0])+'</div><div class="col-d">'+esc(m[1])+'</div></div>').join("")+'</div>'+
    '<div class="card"><div class="card-title">主要依据</div><div class="col-ref">'+esc(COLUMN.refs)+'</div></div>';
}

/* ---------- 穿搭板块 ---------- */
function renderStyle(){
  $("styleBody").innerHTML = STYLE.body.map(r=>
    '<div class="style-row"><b>'+esc(r[0])+'</b><span>'+esc(r[1])+'</span><em>'+esc(r[2])+'</em></div>').join("");
  $("styleRules").innerHTML = STYLE.rules.map(r=>
    '<div class="style-row"><b>'+esc(r[0])+'</b><span>'+esc(r[1])+'</span><em>'+esc(r[2])+'</em></div>').join("");
  $("styleScenes").innerHTML = STYLE.scenes.map(sc=>
    '<div class="scene-card">'+
    '<div class="scene-head"><b>'+esc(sc.name)+'</b><span class="scene-type">'+esc(sc.type)+'</span></div>'+
    '<div class="scene-outfit">'+sc.outfit.map(o=>
      '<div class="scene-row"><span class="scene-part">'+esc(o[0])+'</span><span class="scene-item">'+esc(o[1])+'</span><span class="scene-color">'+esc(o[2])+'</span></div>').join("")+'</div>'+
    '<div class="scene-note"><span class="ev-label">依据</span>'+esc(sc.why)+'</div>'+
    '<div class="scene-note bad"><span class="ev-label">避开</span>'+esc(sc.avoid)+'</div></div>').join("");
  $("styleMyths").innerHTML = STYLE.myths.map(m=>
    '<div class="style-row myth"><b>'+esc(m[0])+'</b><span>'+esc(m[1])+'</span></div>').join("");
}

/* ---------- 身材相似博主 ---------- */
function fashCardHTML(p){
  const stats = p.stats ? '<div class="fash-stats">' + esc(p.stats) + "</div>" : "";
  const tips = (p.tips || []).map((t) => "<li>" + esc(t) + "</li>").join("");
  const outfits = (p.outfits || []).map((o) =>
    '<div class="fash-outfit">' +
    '<div class="fash-o-head"><b>' + esc(o.t) + "</b>" +
    (o.link ? '<a class="fash-link" href="' + esc(o.link) + '" target="_blank" rel="noopener">' + esc(o.linkLabel || "看视频") + " ↗</a>" : "") +
    "</div>" +
    '<div class="fash-o-d">' + esc(o.d) + "</div>" +
    "</div>"
  ).join("");
  return (
    '<div class="card fash-card">' +
    '<div class="fash-head">' +
    "<div>" +
    '<div class="fash-name">' + esc(p.name) + "</div>" +
    '<div class="fash-platform">' + esc(p.platform) + " · " + esc(p.body) + "</div>" +
    stats +
    "</div>" +
    '<div class="fash-actions">' +
    '<button class="mini-copy" data-copy-name="' + esc(p.name) + '">复制名字</button>' +
    (p.link ? '<a class="fash-link" href="' + esc(p.link) + '" target="_blank" rel="noopener">' + esc(p.linkLabel || "主页") + " ↗</a>" : "") +
    "</div>" +
    "</div>" +
    '<div class="fash-style"><span class="ev-label">风格</span>' + esc(p.style) + "</div>" +
    (tips ? '<div class="fash-tips"><div class="sec-label">他/她的穿搭技巧</div><ul>' + tips + "</ul></div>" : "") +
    '<div class="sec-label">高赞搭配（文字版）</div>' +
    outfits +
    "</div>"
  );
}
function renderFashion(){
  if (!FASHION_PEOPLE || !FASHION_PEOPLE.length) {
    $("fashionCount").textContent = "0";
    $("fashionList").innerHTML = '<div class="empty">暂无博主数据</div>';
    return;
  }
  $("fashionCount").textContent = FASHION_PEOPLE.length;
  const cats = (FASHION_CATS || []).filter((c) => FASHION_PEOPLE.some((p) => p.cat === c.key));
  $("fashionList").innerHTML = cats.map((c) => {
    const people = FASHION_PEOPLE.filter((p) => p.cat === c.key);
    if (!people.length) return "";
    return (
      '<div class="fash-cat">' +
      '<div class="fash-cat-head"><span class="fash-cat-name">' + esc(c.name) + "</span>" +
      '<span class="fash-cat-n">' + people.length + " 位</span></div>" +
      '<p class="fash-cat-desc">' + esc(c.desc) + "</p>" +
      people.map(fashCardHTML).join("") +
      "</div>"
    );
  }).join("");
}

const CATS = ["全部"].concat([...new Set(KNOWLEDGE.map((p) => p.c))]);
function renderCatChips() {
  $("catChips").innerHTML = CATS.map((c) =>
    '<button class="chip' + (c === browseCat ? " on" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>"
  ).join("");
}

function filterCards() {
  const kw = searchKw.trim().toLowerCase();
  return KNOWLEDGE.filter((p) => {
    const okCat = browseCat === "全部" || p.c === browseCat;
    const okKw = !kw ||
      p.t.toLowerCase().includes(kw) ||
      (p.s || "").toLowerCase().includes(kw) ||
      (p.d || "").toLowerCase().includes(kw) ||
      p.c.toLowerCase().includes(kw);
    return okCat && okKw;
  });
}

function cardItemHTML(p) {
  const isFav = favs.has(p.id);
  return (
    '<div class="point-item" data-open-id="' + p.id + '">' +
    '<div><p class="ppath">' + esc(p.c) + (p.s ? " · " + esc(p.s) : "") + "</p>" +
    '<p class="ptitle">' + esc(p.t) + "</p>" +
    (p.d ? '<p class="pdetail">' + esc(p.d) + "</p>" : "") +
    "</div>" +
    '<button class="star' + (isFav ? " on" : "") + '" data-fav-id="' + p.id + '">' + (isFav ? "★" : "☆") + "</button>" +
    "</div>"
  );
}

function renderBrowse() {
  const list = filterCards();
  $("cardList").innerHTML = list.length
    ? list.map(cardItemHTML).join("")
    : '<div class="empty">没有找到匹配的内容</div>';
}

function renderFav() {
  const list = ALL.filter((p) => favs.has(p.id));
  $("favList").innerHTML = list.length
    ? list.map(cardItemHTML).join("")
    : '<div class="empty">还没有收藏，去"知识"里挑几个吧</div>';
}

/* ---------- 完整卡片 ---------- */
function openFull(p) {
  modalCard = p;
  $("fullCat").textContent = p.c;
  $("fullTitle").textContent = p.t;
  $("fullSrc").textContent = "来源：" + (p.s || "综合整理");
  $("fullDetail").textContent = p.d || "";
  $("fullEx").textContent = p.ex || "";
  $("fullEx").style.display = p.ex ? "" : "none";
  $("fullAction").textContent = p.a || "";
  $("fullModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeFull() {
  $("fullModal").classList.add("hidden");
  document.body.style.overflow = "";
  modalCard = null;
}

/* ---------- 交互 ---------- */
function switchTab(name) {
  document.querySelectorAll(".tab").forEach((s) => s.classList.toggle("active", s.id === "tab-" + name));
  document.querySelectorAll("#bottomNav button").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  if (name === "browse") { renderCatChips(); renderBrowse(); }
  if (name === "toc") renderToc();
  if (name === "humor") { renderHumorChips(); renderHumorList(); }
  if (name === "style") renderStyle();
  if (name === "fashion") renderFashion();
  if (name === "column") renderColumn();
  if (name === "me") { renderStats(); renderFav(); }
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
  }
  return Promise.resolve(legacyCopy(text));
}
function legacyCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); return true; } catch (e) { return false; }
  finally { document.body.removeChild(ta); }
}

function exportData() {
  const data = {
    app: "洋芋养成",
    exportedAt: new Date().toISOString(),
    favs: Array.from(favs),
    checkins: Array.from(checkins).sort(),
    practices: Array.from(practices).sort()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "洋芋养成备份-" + todayStr() + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (Array.isArray(data.favs)) {
        favs = new Set(data.favs.filter((n) => Number.isInteger(n)));
        saveFavs();
      }
      if (Array.isArray(data.checkins)) {
        checkins = new Set(data.checkins.filter((s) => typeof s === "string"));
        saveCheckins();
      }
      if (Array.isArray(data.practices)) {
        practices = new Set(data.practices.filter((s) => typeof s === "string"));
        savePractices();
      }
      renderHead();
      renderToday();
      renderBrowse();
      renderFav();
      renderGolden();
      renderPractice();
      renderStats();
      toast("导入成功");
    } catch (e) {
      toast("备份文件格式不对");
    }
  };
  reader.readAsText(file);
}

/* ---------- 事件绑定 ---------- */
document.querySelectorAll("#bottomNav button").forEach((b) =>
  b.addEventListener("click", () => switchTab(b.dataset.tab))
);

$("checkinBtn").addEventListener("click", () => {
  const t = todayStr();
  if (checkins.has(t)) { checkins.delete(t); toast("已取消今日打卡"); }
  else { checkins.add(t); toast("打卡成功，洋芋长大了一点！"); }
  saveCheckins();
  renderToday();
});

$("shuffleBtn").addEventListener("click", () => {
  let next = currentIdx;
  while (next === currentIdx) next = Math.floor(Math.random() * CARDS.length);
  currentIdx = next;
  renderToday();
});

$("favBtn").addEventListener("click", () => {
  const p = CARDS[currentIdx];
  if (favs.has(p.id)) { favs.delete(p.id); toast("已取消收藏"); }
  else { favs.add(p.id); toast("已收藏，随时来看"); }
  saveFavs();
  renderToday();
  renderStats();
});

$("fullBtn").addEventListener("click", () => {
  openFull(CARDS[currentIdx]);
});

$("humorShuffleBtn").addEventListener("click", () => {
  let next = humorIdx;
  while (next === humorIdx) next = Math.floor(Math.random() * BANTER.length);
  humorIdx = next;
  renderHumorToday();
});

$("humorFavBtn").addEventListener("click", () => {
  const p = BANTER[humorIdx];
  if (favs.has(p.id)) { favs.delete(p.id); toast("已取消收藏"); }
  else { favs.add(p.id); toast("已收藏，随时来看"); }
  saveFavs();
  renderHumorToday();
  renderStats();
});

$("humorFullBtn").addEventListener("click", () => {
  openFull(BANTER[humorIdx]);
});

$("humorSearch").addEventListener("input", (e) => {
  humorKw = e.target.value;
  renderHumorList();
});

$("humorChips").addEventListener("click", (e) => {
  const cat = e.target.dataset.hcat;
  if (!cat) return;
  humorCat = cat;
  renderHumorChips();
  renderHumorList();
});

$("goldenShuffleBtn").addEventListener("click", () => {
  let next = goldenIdx;
  while (next === goldenIdx) next = Math.floor(Math.random() * GOLDEN.length);
  goldenIdx = next;
  renderGolden();
});

$("goldenCopyBtn").addEventListener("click", () => {
  const g = GOLDEN[goldenIdx];
  copyText(g.t + (g.tag ? "\n（" + g.tag + "）" : "")).then(() => toast("已复制"));
});

$("practiceBtn").addEventListener("click", () => {
  const t = todayStr();
  if (practices.has(t)) { practices.delete(t); toast("已取消今日练习"); }
  else { practices.add(t); toast("打卡成功，撩人手感+1！"); }
  savePractices();
  renderPractice();
  renderStats();
});

$("searchInput").addEventListener("input", (e) => {
  searchKw = e.target.value;
  renderBrowse();
});

$("catChips").addEventListener("click", (e) => {
  const cat = e.target.dataset.cat;
  if (!cat) return;
  browseCat = cat;
  renderCatChips();
  renderBrowse();
});

document.addEventListener("click", (e) => {
  const copyNameBtn = e.target.closest("[data-copy-name]");
  if (copyNameBtn) {
    copyText(copyNameBtn.dataset.copyName).then(() => toast("已复制博主名字"));
    return;
  }
  if (e.target.matches("#modalClose") || e.target.classList.contains("modal-mask")) { closeFull(); return; }
  if (e.target.matches("#modalCopy")) {
    if (modalCard) {
      copyText(modalCard.t + (modalCard.s ? "\n来源：" + modalCard.s : "") + (modalCard.d ? "\n" + modalCard.d : "") + (modalCard.ex ? "\n案例：" + modalCard.ex : "") + (modalCard.a ? "\n行动：" + modalCard.a : "")).then(() => toast("已复制"));
    }
    return;
  }
  const tocHead = e.target.closest("[data-tcat]");
  if (tocHead) {
    const c = tocHead.dataset.tcat;
    if (tocOpen.has(c)) tocOpen.delete(c); else tocOpen.add(c);
    renderToc();
    return;
  }
  const openBtn = e.target.closest("[data-open-id]");
  if (openBtn && !e.target.closest(".star")) {
    const id = parseInt(openBtn.dataset.openId, 10);
    const p = ALL.find((x) => x.id === id);
    if (p) openFull(p);
    return;
  }
  const star = e.target.closest("[data-fav-id]");
  if (star) {
    const id = parseInt(star.dataset.favId, 10);
    if (favs.has(id)) { favs.delete(id); toast("已取消收藏"); }
    else { favs.add(id); toast("已收藏"); }
    saveFavs();
    renderBrowse();
    renderFav();
    renderStats();
    if (CARDS[currentIdx] && CARDS[currentIdx].id === id) renderToday();
    if (BANTER[humorIdx] && BANTER[humorIdx].id === id) renderHumorToday();
    return;
  }
});

$("exportBtn").addEventListener("click", exportData);
$("importFile").addEventListener("change", (e) => {
  if (e.target.files[0]) importData(e.target.files[0]);
  e.target.value = "";
});
$("clearDataBtn").addEventListener("click", () => {
  if (!confirm("确定清空所有打卡和收藏记录吗？")) return;
  favs.clear();
  checkins.clear();
  practices.clear();
  saveFavs();
  saveCheckins();
  savePractices();
  renderToday();
  renderBrowse();
  renderFav();
  renderGolden();
  renderPractice();
  renderStats();
  toast("已清空");
});

/* ---------- 启动 ---------- */
renderHead();
renderToday();
renderCatChips();
renderBrowse();
renderFav();
renderStats();
renderHumorToday();
renderHumorChips();
renderHumorList();
renderGolden();
renderPractice();
renderStyle();
renderFashion();
renderToc();
renderColumn();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
