const areaNames = {
  A: "걸매리 마을회관 A",
  B: "걸매리 마을회관 B",
  C: "걸매리 인주공단 A",
  D: "걸매리 인주공단 B"
};

const areaData = { A: housesA, B: housesB, C: housesC, D: housesD };
let currentArea = "A";
let currentIndex = 0;
let currentHouses = areaData[currentArea];

function key(type, index=currentIndex){ return "geolmaeri_" + currentArea + "_" + index + "_" + type; }
function statusLabel(s){ return {visit:"방문함", absent:"부재", reject:"방문거절", closed:"폐문부재"}[s] || "미기록"; }

function loadArea(area){
  saveMemo();
  currentArea = area;
  currentHouses = areaData[area] || [];
  currentIndex = 0;
  document.getElementById("areaTitle").innerText = areaNames[area];
  hideReport();
  loadHouse();
}

function loadHouse(){
  if(!currentHouses.length){return;}
  const house = currentHouses[currentIndex];
  document.getElementById("current").innerText = currentIndex + 1;
  document.getElementById("total").innerText = currentHouses.length;
  document.getElementById("houseNumber").innerText = house.number || "-";
  document.getElementById("houseName").innerText = house.name || "이름 없음";
  document.getElementById("houseAddress").innerText = house.address || "";
  document.getElementById("memo").value = localStorage.getItem(key("memo")) || "";
  renderSelectedStatus();
  updateProgress();
}

function setStatus(status){
  localStorage.setItem(key("status"), status);
  renderSelectedStatus();
  updateProgress();
}

function renderSelectedStatus(){
  const status = localStorage.getItem(key("status")) || "";
  ["visit","absent","reject","closed"].forEach(s=>{
    const btn = document.getElementById("btn_"+s);
    if(btn) btn.classList.toggle("selected", status === s);
  });
}

function saveMemo(){
  const memo = document.getElementById("memo");
  if(memo) localStorage.setItem(key("memo"), memo.value);
}

function nextHouse(){
  saveMemo();
  if(currentIndex < currentHouses.length - 1){ currentIndex++; loadHouse(); }
  else { showReport(); }
}
function prevHouse(){ saveMemo(); if(currentIndex > 0){ currentIndex--; loadHouse(); } }

function updateProgress(){
  let done = 0;
  currentHouses.forEach((h, i)=>{ if(localStorage.getItem("geolmaeri_"+currentArea+"_"+i+"_status")) done++; });
  const percent = currentHouses.length ? Math.round(done / currentHouses.length * 100) : 0;
  document.getElementById("progressFill").style.width = percent + "%";
  document.getElementById("progressPercent").innerText = percent + "%";
}

function buildReport(){
  const counts = {visit:0, absent:0, reject:0, closed:0, none:0};
  currentHouses.forEach((h,i)=>{ const s = localStorage.getItem("geolmaeri_"+currentArea+"_"+i+"_status") || "none"; counts[s]++; });
  const done = counts.visit + counts.absent + counts.reject + counts.closed;
  const percent = currentHouses.length ? Math.round(done/currentHouses.length*100) : 0;
  return `${areaNames[currentArea]}

총 대상: ${currentHouses.length}호
기록 완료: ${done}호
진행률: ${percent}%

방문함: ${counts.visit}호
부재: ${counts.absent}호
방문거절: ${counts.reject}호
폐문부재: ${counts.closed}호
미기록: ${counts.none}호`;
}

function showReport(){ saveMemo(); document.getElementById("reportText").innerText = buildReport(); document.getElementById("cardView").classList.add("hidden"); document.getElementById("reportView").classList.remove("hidden"); }
function hideReport(){ document.getElementById("reportView").classList.add("hidden"); document.getElementById("cardView").classList.remove("hidden"); }
function copyReport(){ navigator.clipboard.writeText(buildReport()).then(()=>alert("복사되었습니다.")); }

document.addEventListener("DOMContentLoaded", function(){
  document.getElementById("memo").addEventListener("input", saveMemo);
  loadArea("A");
  if("serviceWorker" in navigator){ navigator.serviceWorker.register("sw.js").catch(()=>{}); }
});
