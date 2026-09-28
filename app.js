
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const menu=$(".menu"),links=$(".links");
if(menu)menu.addEventListener("click",()=>links.classList.toggle("open"));

function saveLocal(k,v){try{localStorage.setItem(k,String(v))}catch(e){}}
function loadLocal(k,d){try{return localStorage.getItem(k)??d}catch(e){return d}}
