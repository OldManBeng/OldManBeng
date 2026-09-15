function L(h){h=h.replace('#','');if(h.length===3)h=[...h].map(c=>c+c).join('');const c=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4));return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];}
function CR(a,b){const[l1,l2]=[L(a),L(b)].sort((x,y)=>y-x);return ((l1+0.05)/(l2+0.05)).toFixed(2);}
function mix(fg,alpha,bg){const p=(c)=>[0,2,4].map(i=>parseInt(c.slice(i,i+2),16));const f=p(fg),b=p(bg);const o=f.map((v,i)=>Math.round(v*alpha+b[i]*(1-alpha)));return '#'+o.map(v=>v.toString(16).padStart(2,'0')).join('');}
const rows=[
 // 主 CTA 候选底色（白字）
 ['white on #B85A0A','#FFFFFF','#B85A0A'],
 ['white on #AD5409','#FFFFFF','#AD5409'],
 ['white on #9A4E0B','#FFFFFF','#9A4E0B'],
 // 夜间 chip 实底方案
 ['#F2ECDD on #2E3350','#F2ECDD','#2E3350'],
 ['#C9CFEA on #2E3350','#C9CFEA','#2E3350'],
 ['#AAB2D6 on #2E3350','#AAB2D6','#2E3350'],
 // 其余
 ['n5 on n1','#8A6D3B','#FBF3E4'],
 ['n6 on 夜罩后 n0','#5F4A2A',mix('282C44',0.24,'FFFDF8')],
 ['n5 on 夜罩后 n0','#8A6D3B',mix('282C44',0.24,'FFFDF8')],
 ['n6 on 夜罩后 n2','#5F4A2A',mix('282C44',0.24,'F4E8D2')],
 ['success on n2','#2F7D46','#F4E8D2'],
 ['danger on n2','#B3382C','#F4E8D2'],
 ['#C2620E on n2','#C2620E','#F4E8D2'],
 ['#9A4E0B on n2','#9A4E0B','#F4E8D2'],
 ['#454E75 on n2','#454E75','#F4E8D2'],
];
for(const[n,a,b]of rows)console.log(CR(a,b).padStart(6), n);
