let currentArea = "A";
let currentIndex = 0;
let currentHouses = [];
let map = null;
let markers = [];
let userMarker = null;
const statusText = {visit:"방문함", absent:"부재", reject:"방문거절", closed:"폐문부재"};
const areaCenters = {
  A:[36.88120,126.88230],
  B:[36.88215,126.88430],
  C:[36.87480,126.88900],
  D:[36.87280,126.89500]
};
function showApp(){document.getElementById("intro").classList.remove("active");document.getElementById("app").classList.add("active");loadArea("A");}
function storageKey(index,type){return "v3_geolmaeri_"+currentArea+"_"+index+"_"+type;}
function loadArea(area){
  saveMemo(); currentArea=area; currentIndex=0; currentHouses=AREAS[area].houses;
  document.getElementById("areaTitle").innerText=AREAS[area].title;
  document.querySelectorAll(".areaSelect button").forEach(btn=>btn.classList.remove("activeArea"));
  const mapIndex={A:0,B:1,C:2,D:3}; document.querySelectorAll(".areaSelect button")[mapIndex[area]].classList.add("activeArea");
  hideReport(); loadHouse(); refreshMapMarkers();
}
function loadHouse(){
  const house=currentHouses[currentIndex]; if(!house) return;
  document.getElementById("current").innerText=currentIndex+1;
  document.getElementById("total").innerText=currentHouses.length;
  document.getElementById("houseNumber").innerText=house.number||"-";
  document.getElementById("houseName").innerText=house.name||"이름 없음";
  document.getElementById("houseAddress").innerText=house.address||"-";
  document.getElementById("memo").value=localStorage.getItem(storageKey(currentIndex,"memo"))||"";
  updateStatusButtons(); updateProgress(); highlightCurrentMarker();
}
function setStatus(status){localStorage.setItem(storageKey(currentIndex,"status"),status);updateStatusButtons();updateProgress();refreshMapMarkers();}
function updateStatusButtons(){
  const selected=localStorage.getItem(storageKey(currentIndex,"status"))||"";
  ["visit","absent","reject","closed"].forEach(s=>{const btn=document.getElementById("btn_"+s);if(btn)btn.classList.toggle("selected",selected===s);});
}
function saveMemo(){const memo=document.getElementById("memo");if(!memo||!currentHouses.length)return;localStorage.setItem(storageKey(currentIndex,"memo"),memo.value);}
function nextHouse(){saveMemo();if(currentIndex<currentHouses.length-1){currentIndex++;loadHouse();}else{showReport();}}
function prevHouse(){saveMemo();if(currentIndex>0){currentIndex--;loadHouse();}}
function getCounts(){
  const counts={visit:0,absent:0,reject:0,closed:0,done:0};
  currentHouses.forEach((h,i)=>{const s=localStorage.getItem("v3_geolmaeri_"+currentArea+"_"+i+"_status");if(s){counts.done++;if(counts[s]!==undefined)counts[s]++;}});
  return counts;
}
function updateProgress(){const counts=getCounts();const percent=currentHouses.length?Math.round(counts.done/currentHouses.length*100):0;document.getElementById("progressFill").style.width=percent+"%";document.getElementById("progressPercent").innerText=percent+"%";}
function buildReport(){const c=getCounts();const total=currentHouses.length;const percent=total?Math.round(c.done/total*100):0;return `${AREAS[currentArea].title}\n\n총 대상: ${total}호\n기록 완료: ${c.done}호\n방문함: ${c.visit}호\n부재: ${c.absent}호\n방문거절: ${c.reject}호\n폐문부재: ${c.closed}호\n남은 집: ${total-c.done}호\n\n진행률: ${percent}%`;}
function showReport(){saveMemo();document.getElementById("reportText").innerText=buildReport();document.getElementById("report").classList.remove("hidden");}
function hideReport(){const r=document.getElementById("report");if(r)r.classList.add("hidden");}
function copyReport(){const text=document.getElementById("reportText").innerText;navigator.clipboard.writeText(text).then(()=>alert("복사되었습니다.")).catch(()=>alert("복사가 안 되면 결과 내용을 길게 눌러 복사하세요."));}
function getHouseLatLng(index){
  const c=areaCenters[currentArea]||areaCenters.A;
  const cols=7;
  const row=Math.floor(index/cols);
  const col=index%cols;
  const lat=c[0]+(row-3)*0.00018+(col%2)*0.00005;
  const lng=c[1]+(col-3)*0.00022+(row%2)*0.00004;
  return [lat,lng];
}
function getMarkerClass(status){return "marker_"+(status||"none");}
function makeIcon(label,status){
  return L.divIcon({className:"",html:`<div class="markerLabel ${getMarkerClass(status)}">${label}</div>`,iconSize:[30,30],iconAnchor:[15,15],popupAnchor:[0,-12]});
}
function initMap(){
  if(map || typeof L==="undefined") return;
  map=L.map("map").setView(areaCenters[currentArea],16);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"&copy; OpenStreetMap"}).addTo(map);
}
function showMap(){
  document.getElementById("mapPanel").classList.remove("hidden");
  initMap();
  setTimeout(()=>{map.invalidateSize();refreshMapMarkers();fitAreaMap();},100);
}
function hideMap(){document.getElementById("mapPanel").classList.add("hidden");}
function refreshMapMarkers(){
  if(!map) return;
  markers.forEach(m=>map.removeLayer(m)); markers=[];
  currentHouses.forEach((h,i)=>{
    const status=localStorage.getItem("v3_geolmaeri_"+currentArea+"_"+i+"_status")||"";
    const marker=L.marker(getHouseLatLng(i),{icon:makeIcon(i+1,status)}).addTo(map);
    marker.bindPopup(`<b>${i+1}. ${h.number||"-"}</b><br>${h.address||""}<br>${h.name||""}<br>${status?"상태: "+statusText[status]:"미기록"}`);
    marker.on("click",()=>{saveMemo();currentIndex=i;loadHouse();});
    markers.push(marker);
  });
  highlightCurrentMarker();
}
function highlightCurrentMarker(){
  if(!map||!markers.length) return;
  markers.forEach((m,i)=>{const el=m.getElement(); if(el){el.style.transform = i===currentIndex ? "scale(1.25)" : ""; el.style.zIndex = i===currentIndex ? "1000" : "";}});
}
function focusCurrentHouse(){
  if(!map) return;
  const ll=getHouseLatLng(currentIndex);
  map.setView(ll,18);
  if(markers[currentIndex]) markers[currentIndex].openPopup();
}
function fitAreaMap(){
  if(!map||!markers.length) return;
  const group=L.featureGroup(markers);
  map.fitBounds(group.getBounds().pad(0.2));
}
function showMyLocation(){
  if(!navigator.geolocation){alert("이 기기에서 현재 위치를 사용할 수 없습니다.");return;}
  initMap();
  navigator.geolocation.getCurrentPosition(pos=>{
    const ll=[pos.coords.latitude,pos.coords.longitude];
    if(userMarker) map.removeLayer(userMarker);
    const icon=L.divIcon({className:"",html:'<div class="currentPulse"></div>',iconSize:[24,24],iconAnchor:[12,12]});
    userMarker=L.marker(ll,{icon}).addTo(map).bindPopup("현재 위치").openPopup();
    map.setView(ll,18);
  },()=>alert("현재 위치 권한을 허용해 주세요."),{enableHighAccuracy:true,timeout:10000});
}
document.addEventListener("DOMContentLoaded",()=>{document.getElementById("memo").addEventListener("input",saveMemo);});
