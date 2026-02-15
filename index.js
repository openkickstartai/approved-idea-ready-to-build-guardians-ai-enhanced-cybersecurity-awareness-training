const express = require('express');
const { getScenarios, evaluateAnswers, generateProfile } = require('./guardian');

const app = express();
app.use(express.json());

app.get('/api/scenarios', (req, res) => res.json(getScenarios()));

app.post('/api/evaluate', (req, res) => {
  const { answers } = req.body || {};
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'Provide an array of answers [{scenarioId, choiceId}]' });
  }
  res.json(generateProfile(evaluateAnswers(answers)));
});

const HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Guardians</title><style>
body{font-family:system-ui,sans-serif;max-width:660px;margin:2rem auto;padding:0 1rem;background:#0d1117;color:#c9d1d9}
h1{color:#58a6ff}h3{margin:.5rem 0}
button{background:#238636;color:#fff;border:none;padding:.6rem 1.2rem;border-radius:6px;cursor:pointer;margin:.3rem;font-size:.95rem}
button:hover{background:#2ea043}
.card{border:1px solid #30363d;border-radius:8px;padding:1.2rem;margin:1rem 0}
.big{font-size:2.2rem;font-weight:bold;color:#58a6ff}
.warn{color:#f0883e;margin:.4rem 0}
</style></head><body>
<h1>&#128737; Guardians</h1>
<p>AI-Enhanced Cybersecurity Awareness Training</p>
<div id="app"><button data-action="start">Start Training</button></div>
<script>
var S=[],I=0,A=[],el=document.getElementById("app");
el.addEventListener("click",function(e){var t=e.target;
if(t.dataset.action==="start")start();
if(t.dataset.s){A.push({scenarioId:t.dataset.s,choiceId:t.dataset.c});I++;render();}});
function start(){fetch("/api/scenarios").then(function(r){return r.json()}).then(function(d){S=d;I=0;A=[];render();});}
function render(){if(I>=S.length)return finish();var s=S[I];
var h="<div class=card><h3>"+s.title+"</h3><p>"+s.description+"</p>";
s.options.forEach(function(o){h+="<button data-s='"+s.id+"' data-c='"+o.id+"'>"+o.text+"</button>";});
h+="<p style='color:#8b949e;margin-top:1rem'>"+(I+1)+" / "+S.length+"</p></div>";el.innerHTML=h;}
function finish(){fetch("/api/evaluate",{method:"POST",headers:{"Content-Type":"application/json"},
body:JSON.stringify({answers:A})}).then(function(r){return r.json()}).then(function(r){
var h="<div class=card><div class=big>Score: "+r.overallScore+"/100</div><p>Level: <strong>"+r.level+"</strong></p>";
if(r.recommendations.length){h+="<h3>Recommendations:</h3><ul>";r.recommendations.forEach(function(t){h+="<li>"+t+"</li>";});h+="</ul>";}
if(r.details){r.details.forEach(function(d){h+="<p class=warn>"+d.title+": "+d.score+"/100 &mdash; "+d.feedback+"</p>";});}
h+="</div><button data-action=start>Retry</button>";el.innerHTML=h;});}
</script></body></html>`;

app.get('/', (req, res) => res.type('html').send(HTML));

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log('Guardians running at http://localhost:' + PORT));
}

module.exports = app;
