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
app.innerHTML=`<section class="game progame realgame">
<div class="game-top"><div><div class="eyebrow">PENALTY SHOOTOUT</div><h1>THE FINAL KICK</h1></div><div class="difficulty"><span>MODE</span><b>PRO • 1 SHOT</b></div></div>
<p class="gameintro">Desktop: drag the mouse from the ball toward the target. Mobile: drag your finger. Aim first, set power, then release. The keeper reacts to the shot.</p>
<div class="canvas-wrap"><canvas id="penaltyCanvas"></canvas><div class="touch-help">DRAG FROM THE BALL → AIM → RELEASE</div><div class="camera-label">STADIUM CAM • PENALTY SPOT</div></div>
<div class="powerbar"><span>POWER</span><div><i id="powerfill"></i></div><b id="powertxt">0%</b></div>
<div class="shotstats"><span>AIM <b id="aimread">CENTER</b></span><span>KEEPER <b id="keeperread">WATCHING</b></span><span>ATTEMPTS <b id="attempts">0</b></span></div>
<div class="message" id="msg">DRAG THE BALL TO AIM</div>
<button class="shoot" id="resetShot">RESET SHOT</button></section>`;

const canvas=document.getElementById('penaltyCanvas'),ctx=canvas.getContext('2d'),wrap=canvas.parentElement;
const fill=document.getElementById('powerfill'),pt=document.getElementById('powertxt'),msg=document.getElementById('msg'),aimread=document.getElementById('aimread'),kr=document.getElementById('keeperread'),attemptsEl=document.getElementById('attempts');
let W=0,H=0,dpr=1,shot=false,drag=false,resetTimer=null,attempt=0,last=performance.now(),audioStarted=false;
let keeper={x:.5,target:.5,v:.24,dive:0,diveX:.5},ball={x:.5,y:.83,z:0,visible:true},player={x:.5,y:.87,phase:0};
let aim={x:.5,y:.18,power:0,active:false};
function resize(){const r=wrap.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);W=r.width;H=Math.max(460,Math.min(700,r.width*.64));canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function sx(x){return x*W}
function sy(y){return y*H}
function lerp(a,b,t){return a+(b-a)*t}
function roundRect(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
function draw(){
 ctx.clearRect(0,0,W,H);
 const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#071326');sky.addColorStop(.32,'#142e4d');sky.addColorStop(.48,'#07522c');sky.addColorStop(1,'#021d11');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 // floodlights
 for(const [x,y] of [[.08,.05],[.92,.05]]){const g=ctx.createRadialGradient(sx(x),sy(y),2,sx(x),sy(y),W*.22);g.addColorStop(0,'#fff',.3);g.addColorStop(1,'#fff',0);ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
 // crowd / stands
 ctx.fillStyle='#08101e';ctx.fillRect(0,sy(.02),W,sy(.23));
 for(let y=sy(.07);y<sy(.22);y+=13){for(let x=4;x<W;x+=16){ctx.fillStyle=['#dbe9ff','#ffcf8a','#73ff8c','#9faec4'][((x/16+y/13)|0)%4];ctx.globalAlpha=.45;ctx.fillRect(x,y,3,3)}}ctx.globalAlpha=1;
 // pitch perspective
 ctx.beginPath();ctx.moveTo(sx(.02),sy(.23));ctx.lineTo(sx(.98),sy(.23));ctx.lineTo(sx(1.12),H);ctx.lineTo(sx(-.12),H);ctx.closePath();ctx.fillStyle='#07552e';ctx.fill();
 for(let i=0;i<10;i++){ctx.fillStyle=i%2?'#07502b':'#084f2b';ctx.beginPath();ctx.moveTo(sx(i/10-.05),sy(.23));ctx.lineTo(sx((i+1)/10-.05),sy(.23));ctx.lineTo(sx((i+1)*.12-.05),H);ctx.lineTo(sx(i*.12-.05),H);ctx.closePath();ctx.fill()}
 // pitch markings
 ctx.strokeStyle='#ffffff38';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx(.14),H);ctx.lineTo(sx(.28),sy(.25));ctx.moveTo(sx(.86),H);ctx.lineTo(sx(.72),sy(.25));ctx.stroke();
 // goal
 const gl=sx(.25),gr=sx(.75),gt=sy(.14),gb=sy(.34);ctx.fillStyle='#ffffff08';ctx.fillRect(gl,gt,gr-gl,gb-gt);ctx.strokeStyle='#fff';ctx.lineWidth=7;ctx.strokeRect(gl,gt,gr-gl,gb-gt);
 ctx.strokeStyle='#ffffff35';ctx.lineWidth=1;for(let x=gl;x<gr;x+=18){ctx.beginPath();ctx.moveTo(x,gt);ctx.lineTo(x+(x-gl)*.12,gb);ctx.stroke()}for(let y=gt;y<gb;y+=16){ctx.beginPath();ctx.moveTo(gl,y);ctx.lineTo(gr,y);ctx.stroke()}
 // target marker
 if(!shot&&aim.active){const tx=sx(aim.x),ty=sy(aim.y);ctx.strokeStyle='#73ff8c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(tx,ty,14,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(tx-22,ty);ctx.lineTo(tx+22,ty);ctx.moveTo(tx,ty-22);ctx.lineTo(tx,ty+22);ctx.stroke();
 const bx=sx(ball.x),by=sy(ball.y);ctx.strokeStyle='#35e7ff88';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(tx,ty);ctx.stroke()}
 // keeper shadow + body
 const kd=keeper.dive, kx=sx(keeper.x)+kd*W*.16, ky=sy(.30);ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(kx,sy(.37),40,9,0,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.translate(kx,ky);ctx.rotate(kd*.42);ctx.fillStyle='#ff315f';roundRect(ctx,-23,-35,46,62,9);ctx.fillStyle='#ffc09a';ctx.beginPath();ctx.arc(0,-48,13,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffc09a';roundRect(ctx,-52,-26,28,13,7);roundRect(ctx,24,-26,28,13,7);ctx.fillStyle='#101827';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText('GK',0,0);ctx.restore();
 // player with run-up / kick pose
 const py=sy(player.y),px=sx(player.x),phase=player.phase;ctx.save();ctx.translate(px,py);ctx.rotate(phase*.18);ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(0,8,32,8,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#1bb7ff';roundRect(ctx,-17,-67,34,48,7);ctx.fillStyle='#b97958';ctx.beginPath();ctx.arc(0,-82,13,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f0f4fa';ctx.save();ctx.rotate(-.12+phase*.7);roundRect(ctx,-13,-20,9,48,4);ctx.restore();ctx.save();ctx.rotate(.2-phase*1.1);roundRect(ctx,4,-20,9,48,4);ctx.restore();ctx.restore();
 // ball
 if(ball.visible){const bx=sx(ball.x),by=sy(ball.y-ball.z);const rad=7+ball.z*13;ctx.fillStyle='#0007';ctx.beginPath();ctx.ellipse(bx,sy(ball.y)+6,rad*1.2,rad*.35,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bx,by,rad,0,Math.PI*2);ctx.fill();ctx.fillStyle='#202833';for(let a=0;a<5;a++){const q=a*1.256;ctx.beginPath();ctx.arc(bx+Math.cos(q)*rad*.48,by+Math.sin(q)*rad*.48,rad*.16,0,Math.PI*2);ctx.fill()}}
 if(shot&&ball.z>.02){ctx.strokeStyle='#ffffff35';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx(ball.x),sy(ball.y));ctx.lineTo(sx(ball.x),sy(ball.y-ball.z));ctx.stroke()}
 requestAnimationFrame(loop)
}
function loop(now){const dt=Math.min(.032,(now-last)/1000);last=now;if(!shot){keeper.x+=keeper.v*dt*(keeper.dive===0?1:0);if(keeper.x>.70||keeper.x<.30)keeper.v*=-1;keeper.target=keeper.x;player.phase=Math.sin(now/180)*.015}else if(shot){const t=performance.now()-shot.t, p=clamp(t/950,0,1),e=1-Math.pow(1-p,3);ball.x=lerp(ball.startX,ball.endX,e);ball.y=lerp(ball.startY,ball.endY,e);ball.z=1.9*Math.sin(Math.PI*p)*(0.75+aim.power*.006);player.phase=lerp(.1,-.9,clamp(t/330,0,1));if(t>250&&keeper.dive===0){keeper.dive=ball.endX>keeper.x?1:-1;keeper.diveX=keeper.x}if(p>=1&&!shot.done)finishShot()}
draw()}
function pos(e){const r=canvas.getBoundingClientRect();return{x:clamp((e.clientX-r.left)/r.width,0,1),y:clamp((e.clientY-r.top)/r.height,0,1)}}
function down(e){if(shot)return;const p=pos(e);if(Math.hypot(p.x-ball.x,(p.y-ball.y)*.75)<.13){drag=true;aim.active=true;canvas.setPointerCapture?.(e.pointerId);audio();}}
function move(e){if(!drag||shot)return;e.preventDefault();const p=pos(e);aim.x=clamp(p.x,.17,.83);aim.y=clamp(p.y,.08,.34);const dx=aim.x-ball.x,dy=ball.y-aim.y;aim.power=clamp(Math.hypot(dx,dy)*145,18,100);fill.style.width=aim.power+'%';pt.textContent=Math.round(aim.power)+'%';aimread.textContent=aim.x<.38?'LEFT':aim.x>.62?'RIGHT':'CENTER';kr.textContent=Math.round(keeper.x*100)+'%';msg.textContent=aim.power>=82?'RELEASE — MAX POWER':'DRAG FARTHER FOR POWER'}
function up(e){if(!drag||shot)return;drag=false;if(aim.power<45){msg.textContent='MORE POWER — TRY AGAIN';aim.active=false;return}fire()}
function fire(){shot={t:performance.now(),startX:ball.x,startY:ball.y,endX:aim.x,endY:aim.y,done:false};attempt++;attemptsEl.textContent=attempt;msg.textContent='RUN-UP • STRIKE • WATCH';fill.style.width=aim.power+'%';audio();kick();whoosh()}
function finishShot(){shot.done=true;const dx=Math.abs(aim.x-keeper.x),high=aim.y<.18,corner=aim.x<.36||aim.x>.64,powerGate=aim.power>=84;const keeperReach=.085+(100-aim.power)*.00022;const inside=aim.x>.27&&aim.x<.73&&aim.y>.13&&aim.y<.34;const saved=inside&&dx<keeperReach;const success=inside&&corner&&high&&powerGate&&!saved;
 if(success){goalSound();msg.textContent='⚽ TOP-CORNER PENALTY — WL UNLOCKED';won=true;localStorage.setItem('g2w_demo_goal','1');setTimeout(()=>location.hash='/claim',1400)}else if(saved){saveSound();msg.textContent='🧤 SAVED — GOALKEEPER READ IT'}else{tone(150,.15,'sine',.03,-80);msg.textContent=powerGate?'❌ JUST WIDE / TOO CENTRAL':'❌ NOT ENOUGH POWER'}
 if(!success){resetTimer=setTimeout(reset,1200)}}
function reset(){shot=false;ball={x:.5,y:.83,z:0,visible:true};player={x:.5,y:.87,phase:0};keeper={x:.5,target:.5,v:(Math.random()>.5?.24:-.24),dive:0,diveX:.5};aim={x:.5,y:.18,power:0,active:false};fill.style.width='0%';pt.textContent='0%';aimread.textContent='CENTER';kr.textContent='WATCHING';msg.textContent='DRAG THE BALL TO AIM'}
canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move,{passive:false});canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
document.getElementById('resetShot').onclick=()=>{if(resetTimer)clearTimeout(resetTimer);reset()};
requestAnimationFrame(loop);
}

function claim(){app.innerHTML=`<section class="claim"><div class="eyebrow">WHITELIST CLAIM</div><h1>${won?"YOU EARNED WL":"WL IS LOCKED"}</h1><p style="color:var(--muted)">${won?"Your goal was successful. Secure your spot with your wallet address.":"Score a goal first. The whitelist is earned through the challenge."}</p><div class="card"><label>WALLET ADDRESS</label><input class="input" id="wa" placeholder="0x... / wallet address" value="${wallet}"><button class="primary" id="claimbtn" style="width:100%">CLAIM WL</button><div class="message" id="cm"></div></div></section>`;let b=document.getElementById("claimbtn");b.onclick=()=>{let v=document.getElementById("wa").value.trim(),m=document.getElementById("cm");if(!won){m.textContent="Complete the goal challenge first.";return}if(!v){m.textContent="Enter your wallet address.";return}serverClaim(v).then(res=>{
if(res.demo){m.textContent="DEMO ONLY — connect this site to the production claim API before distributing real WL.";return}
m.textContent=res.message||"✓ WL CLAIMED";b.disabled=true;b.textContent="WL CLAIMED";
}).catch(()=>m.textContent="Claim server unavailable. Your WL was NOT issued.");}};
function rules(){app.innerHTML=`<section class="section"><div class="eyebrow">RULEBOOK</div><h1>RULES</h1><div class="grid"><div class="card"><h3>ONE GOAL</h3><p>Score one successful penalty to unlock the WL claim page.</p></div><div class="card"><h3>ONE WALLET</h3><p>One wallet can receive one whitelist spot in the production version.</p></div><div class="card"><h3>NO TASKS</h3><p>No forced social tasks. The qualification is the football challenge itself.</p></div><div class="card"><h3>DIFFICULT BY DESIGN</h3><p>The keeper moves and the scoring window is intentionally narrow.</p></div><div class="card"><h3>ANTI-CHEAT</h3><p>Real WL is never awarded from browser storage. Production must verify the game result on a server and record the wallet claim in a database.</p></div><div class="card"><h3>WL SUPPLY</h3><p>When the campaign allocation is exhausted, claims close automatically.</p></div></div></section>`}
function leaderboard(){let list=JSON.parse(localStorage.getItem("g2w_lb")||"[]");app.innerHTML=`<section class="section"><div class="eyebrow">COMMUNITY</div><h1>LEADERBOARD</h1><p style="color:var(--muted)">Production version can show verified goals and claim status from the backend.</p><div class="card"><table class="table"><thead><tr><th>#</th><th>PLAYER</th><th>STATUS</th></tr></thead><tbody>${list.length?list.map((x,i)=>`<tr><td>${i+1}</td><td>${x.slice(0,7)}...${x.slice(-4)}</td><td style="color:var(--green)">WL</td></tr>`).join(""):`<tr><td colspan="3" class="empty">No verified players yet.</td></tr>`}</tbody></table></div></section>`}
function route(){let r=location.hash.slice(1)||"/";if(r==="/play")play();else if(r==="/claim")claim();else if(r==="/rules")rules();else if(r==="/leaderboard")leaderboard();else home();window.scrollTo(0,0)}addEventListener("hashchange",route);route();
