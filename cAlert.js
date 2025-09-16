!function(g,f){typeof exports==='object'&&typeof module!=='undefined'?module.exports=f():typeof define==='function'&&define.amd?define(f):(g.cAlert=f());}(this,function(){
const C={O:'a-overlay',M:'a-modal',I:'a-icon',T:'a-title',Tx:'a-text',B:'a-btn'};
const U={
ce(t,c=''){const e=document.createElement(t);c&&e.classList.add(c);return e;},
ap(p,cs){cs.forEach(c=>p.appendChild(c));},
rm(e){e&&e.parentElement&&e.parentElement.removeChild(e);}
};
function injectCSS(){
if(document.getElementById('a-css'))return;
const s=U.ce('style');
s.id='a-css';
s.textContent=`
.${C.O}{
position:fixed;top:0;left:0;width:100vw;height:100vh;
background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;
z-index:9999;visibility:hidden;opacity:0;
transition:opacity 2s ease, visibility 2s ease;
}
.${C.O}.show{
visibility:visible;opacity:1;
}
.${C.M}{
width:85%;max-width:380px;background:#fff;border-radius:8px;padding:20px;
text-align:center;box-shadow:0 2px 15px rgba(0,0,0,0.1);
transform:translateY(20px);opacity:0;
transition:transform 2s ease, opacity 2s ease;
}
.${C.O}.show .${C.M}{
transform:translateY(0);opacity:1;
}
.${C.I}{
width:48px;height:48px;margin:0 auto 15px;border-radius:50%;
background:#e8f5e9;color:#4caf50;display:flex;align-items:center;justify-content:center;
font-size:24px;
}
.${C.T}{
font-size:18px;color:#333;margin:0 0 10px;
}
.${C.Tx}{
font-size:14px;color:#666;margin:0 0 20px;line-height:1.5;
}
.${C.B}{
padding:8px 20px;border:none;border-radius:4px;
background:#2196f3;color:#fff;font-size:14px;
transition:background 0.3s ease;
}
.${C.B}:hover{
background:#1976d2;
}
`;
document.head.appendChild(s);
}
class Alert{
constructor(){
injectCSS();
this.ol=null;
this.res=null;
this.tm=null;
}
b(opts){
this.ol=U.ce('div',C.O);
const m=U.ce('div',C.M);
const i=U.ce('div',C.I);i.textContent='✓';
const t=U.ce('h3',C.T);t.textContent=opts.t;
const tx=U.ce('p',C.Tx);tx.textContent=opts.tx;
const btn=U.ce('button',C.B);btn.textContent='确定';
btn.addEventListener('click',()=>this.cl());
U.ap(m,[i,t,tx,btn]);
U.ap(this.ol,[m]);
document.body.appendChild(this.ol);
setTimeout(()=>this.ol.classList.add('show'),10);
opts.tm&&(this.tm=setTimeout(()=>this.cl(),opts.tm));
}
cl(){
if(!this.ol)return;
this.ol.classList.remove('show');
clearTimeout(this.tm);
setTimeout(()=>{
U.rm(this.ol);
this.res&&this.res();
},2000);
}
s(t,tx,o={}){
return new Promise(res=>{
this.res=res;
this.b({t,tx,...o});
});
}
}
const aIns=new Alert();
return{
s:(t,tx,o)=>aIns.s(t,tx,o),
cl:()=>aIns.cl()
};
});
