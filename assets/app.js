const app=document.getElementById("app"), walletBtn=document.getElementById("walletBtn");let wallet=localStorage.getItem("g2w_demo_wallet")||"";let won=localStorage.getItem("g2w_demo_goal")==="1";
const API_BASE = "";
let audioCtx=null;
function audio(){audioCtx ||= new (window.AudioContext||window.webkitAudioContext)(); if(audioCtx.state==="suspended")audioCtx.resume(); return audioCtx}
function tone(freq,dur,type="sine",gain=.045,slide=0){
 const c=audio(),o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,c.currentTime);
 if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),c.currentTime+dur);
 g.gain.setValueAtTime(gain,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+dur);
 o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+dur);
}
function crowd(){tone(95,.35,"sawtooth",.018,20);setTimeout(()=>tone(125,.5,"triangle",.022,35),120)}
function kick(){tone(90,.07,"triangle",.08,-35);setTimeout(()=>tone(48,.12,"sine",.035,-10),35)}
function whoosh(){tone(260,.22,"sawtooth",.025,-190)}
function saveSound(){tone(170,.15,"square",.045,-100);setTimeout(()=>tone(95,.22,"triangle",.035,-35),70)}
function goalSound(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.18,"square",.045),i*90));setTimeout(crowd,360)}
 // Set this to your production verification API. Real WL must NEVER be stored only in localStorage.
async function serverClaim(address){ if(!API_BASE) return {demo:true}; const r=await fetch(API_BASE+"/claim",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({wallet:address,proof:"server-verified-game-result"})}); return r.json(); }
function connect(){wallet=prompt("Enter your wallet address (demo):",wallet||"0x");if(wallet){localStorage.setItem("g2w_demo_wallet",wallet);walletBtn.textContent=wallet.slice(0,6)+"..."+wallet.slice(-4);}}
walletBtn.onclick=connect;if(wallet)walletBtn.textContent=wallet.slice(0,6)+"..."+wallet.slice(-4);
document.getElementById("hamb").onclick=()=>{let n=document.querySelector(".mobile-nav");if(n)n.remove();else{n=document.createElement("div");n.className="mobile-nav";n.innerHTML='<a href="#/">HOME</a><a href="#/play">PLAY</a><a href="#/claim">CLAIM WL</a><a href="#/rules">RULES</a><a href="#/leaderboard">LEADERBOARD</a>';document.body.appendChild(n)}};
function home(){app.innerHTML=`<section class="hero"><div><div class="eyebrow">SKILL-BASED WL CHALLENGE</div><h1>ONE GOAL.<br><span>ONE WL.</span></h1><p>No forms. No boring tasks. No spam. Beat the goalkeeper, score a difficult goal, and unlock your whitelist spot.</p><div class="actions"><a class="primary" href="#/play">PLAY FOR WL</a><a class="secondary" href="#/rules">HOW IT WORKS</a></div></div><div class="stadium"><div class="pitch"></div><div class="goal"></div><div class="keeper"></div><div class="ball"></div></div></section><section class="stats"><div class="stat"><b>01</b><span>GOAL REQUIRED</span></div><div class="stat"><b>01</b><span>WL PER WALLET</span></div><div class="stat"><b>100%</b><span>SKILL BASED</span></div></section><section class="section"><h2>HOW IT WORKS</h2><div class="grid"><div class="card"><h3>01 — PLAY</h3><p>Enter the penalty challenge and choose your shot angle and power.</p></div><div class="card"><h3>02 — SCORE</h3><p>The goalkeeper moves. Timing matters. One clean shot gets you through.</p></div><div class="card"><h3>03 — CLAIM WL</h3><p>After a verified goal, connect your wallet and secure your whitelist spot.</p></div></div></section>`}
function play(){
app.innerHTML=`<section class="game"><div class="eyebrow">PENALTY CHALLENGE</div><h1>BEAT THE KEEPER</h1>
<p style="color:var(--muted)">Drag from the ball toward the goal to aim. The longer the drag, the harder the shot. Watch the trajectory before you shoot.</p>
<div class="gamebox"><div class="gamefield" id="field">
<div class="stadium-lights"></div><div class="field-lines"></div><div class="gamegoal"><div class="net"></div></div>
<div class="gk" id="gk"></div><div class="gameball" id="gb"></div>
<div class="aimline" id="aimline"></div><div class="target" id="target"></div>
<div class="hint" id="hint">DRAG FROM THE BALL →</div></div>
<div class="powerbar"><span>POWER</span><div><i id="powerfill"></i></div><b id="powertxt">0%</b></div>
<button class="shoot" id="shoot" disabled>DRAG TO AIM</button><div class="message" id="msg"></div></div></section>`;

const field=document.getElementById("field"), ball=document.getElementById("gb"), keeper=document.getElementById("gk"),
line=document.getElementById("aimline"),target=document.getElementById("target"),shoot=document.getElementById("shoot"),
msg=document.getElementById("msg"),hint=document.getElementById("hint"),fill=document.getElementById("powerfill"),pt=document.getElementById("powertxt");
let aiming=false, shotReady=false, aimX=0, aimY=0, power=0, k=50,dir=1, anim, locked=false;

function keeperLoop(){
 if(locked)return;
 k+=dir*(2.2+Math.random()*1.1);
 if(k>82||k<18)dir*=-1;
 keeper.style.left=k+"%";
 requestAnimationFrame(keeperLoop);
}
keeperLoop();

function pos(e){
 const r=field.getBoundingClientRect();
 const x=(e.clientX??e.touches?.[0]?.clientX)-r.left;
 const y=(e.clientY??e.touches?.[0]?.clientY)-r.top;
 return {x,y};
}
function begin(e){
 if(locked)return;
 const r=field.getBoundingClientRect(), b=ball.getBoundingClientRect();
 const bx=b.left-r.left+b.width/2, by=b.top-r.top+b.height/2;
 const p=pos(e);
 if(Math.hypot(p.x-bx,p.y-by)<70){aiming=true; audio(); e.preventDefault();}
}
function move(e){
 if(!aiming||locked)return;
 e.preventDefault();
 const r=field.getBoundingClientRect(),b=ball.getBoundingClientRect();
 const bx=b.left-r.left+b.width/2,by=b.top-r.top+b.height/2,p=pos(e);
 let dx=p.x-bx,dy=p.y-by;
 // Only aim upward; clamp direction.
 dy=Math.min(dy,-35);
 const len=Math.hypot(dx,dy); power=Math.max(0,Math.min(100,(len-30)/2.4));
 const scale=1.15;
 aimX=Math.max(65,Math.min(r.width-65,bx+dx*scale));
 aimY=Math.max(55,Math.min(r.height*.38,by+dy*scale));
 line.style.display="block";line.style.left=bx+"px";line.style.top=by+"px";
 line.style.width=Math.min(len*scale,430)+"px";line.style.transform=`rotate(${Math.atan2(dy,dx)*180/Math.PI}deg)`;
 target.style.display="block";target.style.left=aimX+"px";target.style.top=aimY+"px";
 fill.style.width=power+"%";pt.textContent=Math.round(power)+"%";
 hint.style.display="none";
 if(power>25){shotReady=true;shoot.disabled=false;shoot.textContent="⚡ SHOOT";} 
}
function end(e){if(aiming){aiming=false}}
field.addEventListener("pointerdown",begin);field.addEventListener("pointermove",move);window.addEventListener("pointerup",end);

shoot.onclick=()=>{
 if(!shotReady||locked)return;
 locked=true;shoot.disabled=true; audio(); kick(); whoosh();line.style.display="none";target.style.display="none";hint.style.display="none";
 const r=field.getBoundingClientRect(),b=ball.getBoundingClientRect();
 const bx=b.left-r.left+b.width/2,by=b.top-r.top+b.height/2;
 const tx=aimX,ty=aimY;
 const keeperX=(r.width*(k/100)), keeperY=145;
 // Aiming error increases with low power; high power has flatter/harder shot.
 const error=(100-power)*0.12;
 const finalX=tx+(Math.random()-.5)*error*2;
 const finalY=ty+(Math.random()-.5)*error;
 const goalLeft=r.width*.27,goalRight=r.width*.73,goalTop=45,goalBottom=175;
 const inside=finalX>goalLeft+12&&finalX<goalRight-12&&finalY>goalTop&&finalY<goalBottom;
 const keeperReach=52+(power*.10);
 const saved=inside && Math.hypot(finalX-keeperX,finalY-keeperY)<keeperReach;
 msg.textContent="SHOT...";
 ball.style.transition=`left .72s cubic-bezier(.2,.8,.2,1), bottom .72s ease, transform .72s ease`;
 ball.style.left=finalX+"px";ball.style.bottom=(r.height-finalY)+"px";
 setTimeout(()=>{
   if(saved){msg.textContent="🧤 SAVED! The goalkeeper read your shot.";saveSound();ball.classList.add("saved");}
   else if(inside){msg.textContent="⚽ GOAL! WL UNLOCKED.";goalSound();won=true;localStorage.setItem("g2w_demo_goal","1");setTimeout(()=>location.hash="/claim",1000);}
   else{msg.textContent="MISS! Your shot went wide.";tone(180,.12,"sine",.03,-70); }
   setTimeout(()=>{
     if(!won){locked=false;shotReady=false;shoot.disabled=true;shoot.textContent="DRAG TO AIM";
       ball.style.transition="none";ball.style.left="50%";ball.style.bottom="75px";ball.classList.remove("saved");hint.style.display="block";
       fill.style.width="0%";pt.textContent="0%"; keeperLoop();
     }
   },900);
 },760);
};
}
function claim(){app.innerHTML=`<section class="claim"><div class="eyebrow">WHITELIST CLAIM</div><h1>${won?"YOU EARNED WL":"WL IS LOCKED"}</h1><p style="color:var(--muted)">${won?"Your goal was successful. Secure your spot with your wallet address.":"Score a goal first. The whitelist is earned through the challenge."}</p><div class="card"><label>WALLET ADDRESS</label><input class="input" id="wa" placeholder="0x... / wallet address" value="${wallet}"><button class="primary" id="claimbtn" style="width:100%">CLAIM WL</button><div class="message" id="cm"></div></div></section>`;let b=document.getElementById("claimbtn");b.onclick=()=>{let v=document.getElementById("wa").value.trim(),m=document.getElementById("cm");if(!won){m.textContent="Complete the goal challenge first.";return}if(!v){m.textContent="Enter your wallet address.";return}serverClaim(v).then(res=>{
if(res.demo){m.textContent="DEMO ONLY — connect this site to the production claim API before distributing real WL.";return}
m.textContent=res.message||"✓ WL CLAIMED";b.disabled=true;b.textContent="WL CLAIMED";
}).catch(()=>m.textContent="Claim server unavailable. Your WL was NOT issued.");}};
function rules(){app.innerHTML=`<section class="section"><div class="eyebrow">RULEBOOK</div><h1>RULES</h1><div class="grid"><div class="card"><h3>ONE GOAL</h3><p>Score one successful penalty to unlock the WL claim page.</p></div><div class="card"><h3>ONE WALLET</h3><p>One wallet can receive one whitelist spot in the production version.</p></div><div class="card"><h3>NO TASKS</h3><p>No forced social tasks. The qualification is the football challenge itself.</p></div><div class="card"><h3>DIFFICULT BY DESIGN</h3><p>The keeper moves and the scoring window is intentionally narrow.</p></div><div class="card"><h3>ANTI-CHEAT</h3><p>Real WL is never awarded from browser storage. Production must verify the game result on a server and record the wallet claim in a database.</p></div><div class="card"><h3>WL SUPPLY</h3><p>When the campaign allocation is exhausted, claims close automatically.</p></div></div></section>`}
function leaderboard(){let list=JSON.parse(localStorage.getItem("g2w_lb")||"[]");app.innerHTML=`<section class="section"><div class="eyebrow">COMMUNITY</div><h1>LEADERBOARD</h1><p style="color:var(--muted)">Production version can show verified goals and claim status from the backend.</p><div class="card"><table class="table"><thead><tr><th>#</th><th>PLAYER</th><th>STATUS</th></tr></thead><tbody>${list.length?list.map((x,i)=>`<tr><td>${i+1}</td><td>${x.slice(0,7)}...${x.slice(-4)}</td><td style="color:var(--green)">WL</td></tr>`).join(""):`<tr><td colspan="3" class="empty">No verified players yet.</td></tr>`}</tbody></table></div></section>`}
function route(){let r=location.hash.slice(1)||"/";if(r==="/play")play();else if(r==="/claim")claim();else if(r==="/rules")rules();else if(r==="/leaderboard")leaderboard();else home();window.scrollTo(0,0)}addEventListener("hashchange",route);route();
