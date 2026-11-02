
/* REACH Student Planner — wellbeing + account release patch
   Adds: real brief parsing, understanding checks, custom plans, rewards,
   optional Supabase account sync, accessibility polish.
*/
(() => {
  const SUPABASE_URL = 'https://ihqjwltganivvmkkehlk.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_rYNGSAYibuEuB9ruCwe88g_Vbu8KkqS';
  const MAX_BRIEF_CHARS = 220000;

  const previousWire = wire;
  const previousSave = save;
  let sb = null;
  let authUser = null;
  let cloudSyncTimer = null;
  let cloudApplying = false;
  let authInitialised = false;
  let authRecoveryMode = false;

  const style = document.createElement('style');
  style.textContent = `
    :focus-visible{outline:3px solid #78c58e;outline-offset:3px}
    button,.btn,.chip,.check,.switch,input,select,textarea{min-height:44px}
    .brief-insight-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
    .brief-insight{padding:13px;border:1px solid var(--line);border-radius:16px;background:var(--mint)}
    .brief-insight strong{display:block;margin-bottom:4px}
    .feedback-list{display:grid;gap:9px;margin-top:12px}
    .feedback-item{padding:12px 14px;border-radius:15px;border:1px solid var(--line);background:var(--mint)}
    .feedback-item.missing{background:var(--yellow)}
    .feedback-score{display:flex;align-items:center;gap:12px;margin:12px 0}
    .score-badge{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:var(--mint);font-weight:900;font-size:18px}
    .plan-editor{display:grid;gap:10px;margin-top:14px}
    .plan-row{display:grid;grid-template-columns:minmax(0,1fr) 82px 132px auto;gap:8px;align-items:end;padding:12px;border:1px solid var(--line);border-radius:16px;background:var(--mint)}
    .reward-list{display:grid;gap:10px;margin-top:12px}
    .reward-card{padding:16px;border:1px solid var(--line);border-radius:20px;background:linear-gradient(135deg,var(--yellow),var(--lav))}
    .reward-card.unlocked{box-shadow:0 0 0 2px rgba(83,174,100,.18)}
    .reward-card.claimed{opacity:.72}
    .auth-panel{display:grid;gap:12px}
    .sync-state{font-size:12px;color:var(--muted)}
    html.dark .brief-insight,html.dark .feedback-item,html.dark .plan-row{background:#14281c!important;border-color:#355441!important}
    html.dark .feedback-item.missing{background:#443b20!important;color:#f8e6a0!important}
    html.dark .reward-card{background:linear-gradient(135deg,#40371d,#302944)!important}
    @media(max-width:420px){
      .brief-insight-grid{grid-template-columns:1fr}
      .plan-row{grid-template-columns:1fr 82px}
      .plan-row .plan-date-field{grid-column:1/-1}
      .plan-row .remove-plan-step{grid-column:1/-1}
    }
    @media(prefers-reduced-motion:reduce){
      *,*::before,*::after{scroll-behavior:auto!important;animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
    }
  `;
  document.head.appendChild(style);

  function ensureStateShape() {
    if (!Array.isArray(state.rewards)) state.rewards = [];
    if (!state.accountPrefs) state.accountPrefs = { cloudSync: true };
    if (!state.lastSavedAt) state.lastSavedAt = new Date().toISOString();
    if (!Array.isArray(state.focusHistory)) state.focusHistory = [];
  }
  ensureStateShape();

  function normaliseText(s='') {
    return String(s).replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
  }
  function escapeRegExp(s='') {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  }
  function briefFingerprint(text='') {
    const s=normaliseText(text);let h=2166136261;
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
    return (h>>>0).toString(16).padStart(8,'0');
  }
  function isoDate(d){
    if(!(d instanceof Date)||Number.isNaN(d.valueOf()))return '';
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  function withArticle(label='assessment'){
    const x=String(label||'assessment').toLowerCase();return `${/^[aeiou]/i.test(x)?'an':'a'} ${x}`;
  }
  function distributePlanDates(steps=[],draft={}){
    const due=draft.date?new Date(`${draft.date}T12:00:00`):null;
    if(!due||Number.isNaN(due.valueOf()))return steps.map(s=>[s[0],s[1],!!s[2],s[3]||'']);
    const now=new Date();now.setHours(12,0,0,0);
    const last=new Date(due);last.setDate(last.getDate()-1);
    const start=last<now?new Date(due):now;
    const span=Math.max(0,Math.round((last-start)/86400000));
    const maxIndex=Math.max(1,steps.length-1);
    return steps.map((s,i)=>{
      const d=new Date(start);d.setDate(start.getDate()+Math.round(span*(i/maxIndex)));
      return [s[0],s[1],!!s[2],s[3]||isoDate(d)];
    });
  }
  function sentenceChunks(text='') {
    return normaliseText(text).split(/(?<=[.!?])\s+|\n+/).map(s=>s.trim()).filter(s=>s.length > 8);
  }
  const STOP = new Set(('the a an and or but if to of in on for with from by as at is are was were be been being this that these those your you student students assignment assessment task will should must can could into about than then their they them it its we our use using used include including based required require requires demonstrate provide produce submit submission work topic unit course criteria marking marks word words').split(/\s+/));
  function tokens(text='') {
    return normaliseText(text).toLowerCase().match(/[a-z][a-z0-9'-]{2,}/g)?.filter(w=>!STOP.has(w)) || [];
  }
  function topKeywords(text='', limit=14) {
    const counts = new Map();
    for (const w of tokens(text)) counts.set(w,(counts.get(w)||0)+1);
    return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([w])=>w);
  }
  const ACTION_GROUPS = {
    analyse:['analyse','analyze','analysis','examine','investigate'],
    evaluate:['evaluate','evaluation','assess','critique','critical'],
    compare:['compare','comparison','contrast','differentiate'],
    explain:['explain','explanation','describe','outline'],
    discuss:['discuss','discussion','explore'],
    reflect:['reflect','reflection','reflective'],
    justify:['justify','justification','rationale','defend'],
    recommend:['recommend','recommendation','propose','proposal'],
    design:['design','develop','create','build'],
    calculate:['calculate','calculation','solve','compute'],
    apply:['apply','application','use'],
    synthesise:['synthesise','synthesize','integrate','combine']
  };
  function detectActions(text='') {
    const lower = normaliseText(text).toLowerCase();
    return Object.entries(ACTION_GROUPS).filter(([,words])=>words.some(w=>new RegExp('\\b'+escapeRegExp(w)+'\\b').test(lower))).map(([k])=>k);
  }
  function detectDeliverable(text='', fallback='Assessment') {
    const x = normaliseText(text).toLowerCase();
    const types = [
      ['Presentation',/\bpresentation\b|\bslides?\b|\boral\b/],
      ['Report',/\breport\b|\bcase study\b/],
      ['Essay',/\bessay\b|\bpaper\b/],
      ['Portfolio',/\bportfolio\b/],
      ['Reflection',/\breflection\b|\breflective\b/],
      ['Problem set',/\bproblem set\b|\bworksheet\b/],
      ['Project',/\bproject\b|\bproposal\b/],
      ['Quiz',/\bquiz\b/],
      ['Exam',/\bexam\b|\btest\b/]
    ];
    for (const [name,re] of types) if (re.test(x)) return name;
    return fallback || 'Assessment';
  }
  function firstMatch(text, regex) {
    const m = String(text).match(regex);
    return m ? m[0].replace(/\s+/g,' ').trim() : '';
  }
  function analyseBrief(text='', draft={}) {
    const clean = normaliseText(text).slice(0, MAX_BRIEF_CHARS);
    const actions = detectActions(clean);
    const deliverable = detectDeliverable(clean, draft.type);
    const wordCount = firstMatch(clean, /\b(?:approximately|about|maximum|max\.?|minimum|min\.?|up to)?\s*(?:\d{1,3}(?:,\d{3})+|\d{3,5})(?:\s*(?:-|–|to)\s*(?:\d{1,3}(?:,\d{3})+|\d{3,5}))?\s*words?\b/i);
    const referencing = firstMatch(clean, /\b(?:APA\s*(?:7|7th)?(?:\s*edition)?|Harvard|Chicago|IEEE|Vancouver|AGLC\s*\d*)\b/i);
    const sourceRequirement = firstMatch(clean, /\b(?:(?:minimum|at least|use|include)\s+\d+\s+)?(?:peer[- ]reviewed|academic|scholarly)\s+(?:sources?|references?|articles?|literature)\b/i);
    const sections = ['executive summary','introduction','background','method','methodology','analysis','discussion','recommendations','reflection','conclusion','reference list','appendix']
      .filter(x=>new RegExp('\\b'+escapeRegExp(x)+'\\b','i').test(clean));
    const keyInstructions = sentenceChunks(clean).filter(s=>/\b(must|required|should|need to|task is to|you are to|you will|submit|include|demonstrate|analyse|analyze|evaluate|compare|explain|discuss|reflect|justify|recommend|design)\b/i.test(s)).slice(0,6);
    const keywords = topKeywords(clean,14);
    const requirements = [];
    requirements.push(`Produce ${withArticle(deliverable)}`);
    if (actions.length) requirements.push(`Use the task actions: ${actions.join(', ')}`);
    if (wordCount) requirements.push(`Meet the stated length: ${wordCount}`);
    if (referencing) requirements.push(`Use ${referencing} referencing`);
    if (sourceRequirement) requirements.push(`Meet the source requirement: ${sourceRequirement}`);
    if (sections.length) requirements.push(`Include/consider: ${sections.slice(0,6).join(', ')}`);
    return {deliverable,actions,wordCount,referencing,sourceRequirement,sections,keyInstructions,keywords,requirements,textChars:clean.length};
  }

  function hasAny(text, words) {
    const lower = String(text).toLowerCase();
    return words.some(w=>new RegExp('\\b'+escapeRegExp(w)+'\\b','i').test(lower));
  }
  function evaluateUnderstanding(understanding='', analysis={}) {
    const u = normaliseText(understanding);
    const checks = [];
    const deliverableWords = {
      Essay:['essay','paper'],
      Report:['report','case study'],
      Presentation:['presentation','slides','oral'],
      Portfolio:['portfolio'],
      Reflection:['reflection','reflective'],
      'Problem set':['problem','problems','worksheet','calculations'],
      Project:['project','proposal'],
      Quiz:['quiz'],
      Exam:['exam','test']
    };
    checks.push({label:`Produce ${withArticle(analysis.deliverable||'assessment')}`,ok:hasAny(u,deliverableWords[analysis.deliverable]||[String(analysis.deliverable||'assessment').toLowerCase()])});
    for (const action of (analysis.actions||[]).slice(0,4)) checks.push({label:`${action[0].toUpperCase()+action.slice(1)} as the brief asks`,ok:hasAny(u,ACTION_GROUPS[action]||[action])});
    if (analysis.wordCount) {
      const nums = analysis.wordCount.match(/\d{3,5}/g)||[];
      checks.push({label:`Recognise the length requirement (${analysis.wordCount})`,ok:nums.some(n=>u.includes(n))||/\bword count\b|\blength\b/i.test(u)});
    }
    if (analysis.referencing) checks.push({label:`Use ${analysis.referencing} referencing`,ok:hasAny(u,[analysis.referencing.toLowerCase().replace(/\s+/g,' '),'referencing','references','cite','citation'])});
    if (analysis.sourceRequirement) checks.push({label:'Use the required academic/peer-reviewed sources',ok:/peer[- ]review|academic source|scholarly|research|sources|literature|references/i.test(u)});
    if (analysis.sections?.length) checks.push({label:`Follow the required structure (${analysis.sections.slice(0,3).join(', ')})`,ok:analysis.sections.some(x=>u.toLowerCase().includes(x))||/\bstructure\b|\bsections?\b/i.test(u)});
    const uLower=u.toLowerCase();
    for(const instruction of (analysis.keyInstructions||[]).slice(0,4)){
      const instructionTokens=[...new Set(tokens(instruction))].slice(0,10);
      const hits=instructionTokens.filter(k=>uLower.includes(k));
      const instructionActions=detectActions(instruction);
      const actionHit=instructionActions.some(a=>hasAny(u,ACTION_GROUPS[a]||[a]));
      const needed=Math.min(2,Math.max(1,instructionTokens.length));
      checks.push({label:`Address: ${instruction.slice(0,105)}${instruction.length>105?'…':''}`,ok:hits.length>=needed||(actionHit&&hits.length>=1)});
    }
    const keywordHits = (analysis.keywords||[]).filter(k=>uLower.includes(k.toLowerCase()));
    const keyScore = analysis.keywords?.length ? Math.min(1,keywordHits.length/Math.min(6,analysis.keywords.length)) : 0.5;
    const base = checks.length ? checks.filter(c=>c.ok).length/checks.length : 0.5;
    let score = Math.round((base*0.8+keyScore*0.2)*100);
    if (u.length < 20) score = Math.min(score,25);
    const status = score >= 75 ? 'strong' : score >= 45 ? 'partial' : 'review';
    return {
      score,status,
      captured:checks.filter(c=>c.ok).map(c=>c.label),
      missing:checks.filter(c=>!c.ok).map(c=>c.label),
      keywordHits
    };
  }

  async function extractPdfText(file) {
    if (!window.pdfjsLib) throw new Error('PDF reader could not load. Check the internet connection and try again.');
    pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({data}).promise;
    const lines = [];
    for (let p=1;p<=pdf.numPages;p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const rows = new Map();
      for (const item of content.items) {
        const y=Math.round((item.transform?.[5]||0)/2)*2;
        const arr=rows.get(y)||[];
        arr.push({x:item.transform?.[4]||0,s:item.str||''});
        rows.set(y,arr);
      }
      const pageLines=[...rows.entries()].sort((a,b)=>b[0]-a[0]).map(([,arr])=>arr.sort((a,b)=>a.x-b.x).map(x=>x.s).join(' ').replace(/\s+/g,' ').trim()).filter(Boolean);
      lines.push(...pageLines);
    }
    const text=normaliseText(lines.join('\n'));
    if(text.length<40) throw new Error('This PDF appears to be scanned/image-based. Please paste the brief text instead.');
    return text;
  }
  async function extractDocumentText(file) {
    if (!file || !file.name) return '';
    const name=file.name.toLowerCase();
    if (file.type==='text/plain'||name.endsWith('.txt')||name.endsWith('.md')) return normaliseText(await file.text());
    if (name.endsWith('.pdf')||file.type==='application/pdf') return extractPdfText(file);
    if (name.endsWith('.docx')) {
      if (!window.mammoth) throw new Error('Word reader could not load. Check the internet connection and try again.');
      const result=await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
      const text=normaliseText(result.value||'');
      if(text.length<20) throw new Error('No readable text was found in this Word file.');
      return text;
    }
    throw new Error('Please use PDF, DOCX or TXT for automatic brief reading.');
  }

  function generatePlanSteps(draft={}) {
    const a=draft.briefAnalysis||{};
    const t=(draft.type||a.deliverable||'Assessment').toLowerCase();
    const steps=[['Review brief & make a requirements checklist',20,false]];
    if(a.sourceRequirement||/essay|report|project|presentation|reflection/.test(t)) steps.push(['Find and organise useful sources',45,false]);
    if(/problem|quiz|exam/.test(t)) {
      steps.push(['Review key concepts and worked examples',40,false],['Complete practice questions',60,false],['Check difficult areas',35,false]);
    } else if(/presentation/.test(t)) {
      steps.push(['Plan the story and slide structure',35,false],['Build slides in small sections',75,false],['Rehearse and adjust timing',40,false]);
    } else if(/report|project/.test(t)) {
      steps.push(['Organise evidence and section headings',35,false],['Draft the analysis in small sections',90,false],['Develop recommendations / final sections',50,false]);
    } else if(/reflection/.test(t)) {
      steps.push(['Choose key experiences or evidence',30,false],['Link experiences to concepts',45,false],['Draft reflection in small sections',75,false]);
    } else {
      steps.push(['Organise notes and key evidence',30,false],['Create a clear structure',40,false],['Draft one section at a time',90,false]);
    }
    if(a.referencing) steps.push([`Check ${a.referencing} citations and reference list`,30,false]);
    steps.push(['Final review against the marking criteria',30,false],['Proofread and submit',20,false]);
    return steps;
  }

  function briefAnalysisHtml(a={}) {
    const insights=[
      ['Deliverable',a.deliverable||'Not clear'],
      ['Task actions',(a.actions||[]).join(', ')||'Review manually'],
      ['Length',a.wordCount||'Not detected'],
      ['Referencing',a.referencing||'Not detected'],
      ['Sources',a.sourceRequirement||'Not detected'],
      ['Structure',(a.sections||[]).slice(0,5).join(', ')||'Not detected'],
      ['Key topics',(a.keywords||[]).slice(0,6).join(', ')||'Not detected']
    ];
    return `<div class="brief-insight-grid">${insights.map(([k,v])=>`<div class="brief-insight"><strong>${esc(k)}</strong><span class="sub">${esc(v)}</span></div>`).join('')}</div>`;
  }

  function weekStartMonday(base=new Date()) {
    const d=new Date(base);d.setHours(12,0,0,0);const offset=(d.getDay()+6)%7;d.setDate(d.getDate()-offset);return d;
  }
  function scheduledTasks() {
    const rows=[];
    for(const a of state.assignments||[])for(const s of a.steps||[])rows.push({assignment:a,step:s,date:s?.[3]||'',done:!!s?.[2]});
    return rows;
  }
  function reminderDueText(due) {
    const diff=new Date(due)-new Date(), hours=Math.round(diff/3600000);
    if(hours<0)return 'is overdue';
    if(hours<24)return `is due in about ${Math.max(1,hours)} hour${hours===1?'':'s'}`;
    const days=Math.ceil(hours/24);return `is due in ${days} day${days===1?'':'s'}`;
  }
  function maybeSendGentleReminder() {
    try{
      if(!state.notifications||!('Notification' in window)||Notification.permission!=='granted')return;
      const now=Date.now();
      const candidates=(state.assignments||[]).filter(a=>a?.due&&doneCount(a)<(a.steps?.length||0))
        .map(a=>({a,ms:new Date(a.due).getTime()-now}))
        .filter(x=>x.ms<=48*3600000&&x.ms>=-7*24*3600000)
        .sort((x,y)=>x.ms-y.ms);
      if(!candidates.length)return;
      const {a}=candidates[0],day=isoDate(new Date()),key=`${a.id}:${day}`,storeKey='reach-gentle-reminders-v1';
      const seen=JSON.parse(localStorage.getItem(storeKey)||'{}');
      if(seen[key])return;
      new Notification('REACH Student Planner',{body:`${a.title} ${reminderDueText(a.due)}. Choose one small step — you do not need to do everything at once.`,tag:`reach-${a.id}-${day}`});
      seen[key]=Date.now();localStorage.setItem(storeKey,JSON.stringify(seen));
    }catch(err){console.warn('Reminder unavailable',err)}
  }
  async function setGentleReminders(enabled) {
    if(!enabled){state.notifications=false;save();toast('Gentle reminders off');return}
    if(!('Notification' in window)){state.notifications=false;save();toast('Browser reminders are not supported on this device');return}
    let permission=Notification.permission;
    if(permission==='default')permission=await Notification.requestPermission();
    state.notifications=permission==='granted';save();
    toast(state.notifications?'Gentle reminders on while the app is open':'Reminder permission was not enabled');
    if(state.notifications)maybeSendGentleReminder();
  }

  function planRow(step, idx) {
    return `<div class="plan-row" data-plan-row>
      <div class="field"><label>Task</label><input class="input" data-plan-title value="${esc(step?.[0]||'')}"></div>
      <div class="field"><label>Minutes</label><input class="input" type="number" min="5" max="300" step="5" data-plan-mins value="${Number(step?.[1]||30)}"></div>
      <div class="field plan-date-field"><label>Target date</label><input class="input" type="date" data-plan-date value="${esc(step?.[3]||'')}"></div>
      <button class="btn btn-outline remove-plan-step" type="button" aria-label="Remove task">Remove</button>
    </div>`;
  }

  function rewardCard(r) {
    const unlocked=state.points>=Number(r.points||0);
    const cls=r.claimed?'claimed':unlocked?'unlocked':'';
    return `<div class="reward-card ${cls}">
      <div class="eyebrow">${r.claimed?'Enjoyed':unlocked?'Unlocked':'Your reward'}</div>
      <h3>${esc(r.title)}</h3>
      <div class="sub">${Number(r.points)} points ${unlocked&&!r.claimed?'· You earned this':r.claimed?'· Marked as enjoyed':'· Keep taking small steps'}</div>
      <div class="toolbar" style="margin-top:10px">
        ${unlocked&&!r.claimed?`<button class="btn btn-primary" data-claim-reward="${esc(r.id)}">Treat myself</button>`:''}
        <button class="btn btn-outline" data-remove-reward="${esc(r.id)}">Remove</button>
      </div>
    </div>`;
  }


  views['add-assignment']=function(){
    if(!state.units?.length)return `<div class="wizard"><div class="eyebrow">Add assignment</div><h1>Add your unit first.</h1><div class="sub">Assignments stay connected to a unit so deadlines, outlines and plans remain organised.</div><div class="card" style="margin-top:16px"><div class="notice">Add a unit manually or upload its unit outline, then come back to create the assignment.</div><button class="btn btn-primary" style="margin-top:14px;width:100%" data-nav="outline-upload">Add a unit / outline →</button></div></div>`;
    return `<div class="wizard"><div class="eyebrow">Add assignment · 1 / 4</div><h1>Start with the basics.</h1><div class="sub">One assignment. Four calm steps: details, brief, understanding and a plan you can edit.</div>
      <div class="steps"><div class="on"></div><div></div><div></div><div></div></div>
      <div class="card"><form id="assignmentDetails"><div class="field"><label>Unit</label><select class="select" name="unit">${state.units.map(u=>`<option value="${esc(u.code)}">${esc(u.code)} · ${esc(u.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Assignment title</label><input class="input" name="title" required placeholder="e.g. Research methods essay"></div>
      <div class="grid g2"><div class="field"><label>Assignment type</label><select class="select" name="type"><option>Essay</option><option>Report</option><option>Presentation</option><option>Problem set</option><option>Project</option><option>Reflection</option><option>Portfolio</option><option>Quiz</option><option>Exam</option></select></div><div class="field"><label>Weighting</label><input class="input" type="number" min="0" max="100" name="weight" value="30"></div></div>
      <div class="grid g2"><div class="field"><label>Due date</label><input class="input" type="date" name="date" required></div><div class="field"><label>Due time</label><input class="input" type="time" name="time" value="17:00"></div></div>
      <button class="btn btn-primary" type="submit">Next: add the brief →</button></form></div>
      <div class="notice" style="margin-top:16px">This tool helps you understand and plan your assignment. It does not write the assignment for you.</div></div>`;
  };

  views['add-brief']=function(){
    const d=state.draft||{};
    return `<div class="wizard"><div class="eyebrow">Add assignment · 2 / 4</div><h1>Let’s read the brief.</h1>
      <div class="sub">Upload the actual brief or paste the instructions. The planner extracts planning requirements; it does not write the assignment.</div>
      <div class="steps"><div class="on"></div><div class="on"></div><div></div><div></div></div>
      <div class="card"><form id="smartAssignmentBrief">
        <div class="field"><label>Upload brief</label><div class="file-box"><input type="file" name="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"></div><div class="sub">PDF, DOCX or TXT. Scanned PDFs may need pasted text.</div></div>
        <div class="field"><label>Or paste the assignment brief / instructions</label><textarea class="textarea" name="brief" placeholder="Paste the actual instructions here...">${esc(d.briefText||d.brief||'')}</textarea></div>
        <div class="notice"><strong>Privacy:</strong> the document is read in your browser. The original file is not uploaded. If you sign in, the extracted text and planning data can be synced to your account.</div>
        <div class="toolbar"><button class="btn btn-outline" type="button" data-nav="add-assignment">← Back</button><button class="btn btn-primary" id="readBriefButton" type="submit">Read brief & continue →</button></div>
      </form></div></div>`;
  };

  views['add-understanding']=function(){
    const d=state.draft||{}, a=d.briefAnalysis||{};
    return `<div class="wizard"><div class="eyebrow">Add assignment · 3 / 4</div><h1>What is the brief asking?</h1>
      <div class="sub">First check what the planner identified, then explain it in your own words.</div>
      <div class="card" style="margin-top:16px"><h2>Brief insights</h2>${briefAnalysisHtml(a)}
        ${(d.briefFileName||d.briefTextChars)?`<div class="notice" style="margin-top:12px"><strong>Document read:</strong> ${esc(d.briefFileName||'Pasted instructions')} · ${Number(d.briefTextChars||d.briefText?.length||0).toLocaleString('en-AU')} characters · Brief ID ${esc(d.briefFingerprint||'—')}</div>`:''}
        ${(a.keyInstructions||[]).length?`<div class="callout" style="margin-top:12px"><strong>Key instructions detected</strong><div class="feedback-list">${a.keyInstructions.slice(0,4).map(x=>`<div class="feedback-item">${esc(x.slice(0,220))}</div>`).join('')}</div></div>`:''}
      </div>
      <div class="card" style="margin-top:16px"><form id="smartUnderstanding"><div class="field"><label>In your own words, what do you think you need to do?</label><textarea class="textarea" name="understanding" required placeholder="For example: I need to compare..., use evidence..., and submit...">${esc(d.understanding||'')}</textarea></div>
        <div class="callout">A rough explanation is enough. The check looks for the requirements in your actual brief, not perfect wording.</div>
        <div class="toolbar" style="margin-top:14px"><button class="btn btn-outline" type="button" data-nav="add-brief">← Back</button><button class="btn btn-primary" type="submit">Compare with my brief →</button></div>
      </form></div></div>`;
  };

  views['understanding-check']=function(){
    const d=state.draft||{}, ev=d.understandingEvaluation||evaluateUnderstanding(d.understanding||'',d.briefAnalysis||{});
    const label=ev.status==='strong'?'You captured the main requirements.':ev.status==='partial'?'You have part of it — a few things need checking.':'Review the brief again before planning.';
    return `<div class="wizard"><div class="eyebrow">Understanding check</div><h1>A clearer starting point.</h1>
      <div class="card"><div class="feedback-score"><div class="score-badge">${ev.score}%</div><div><strong>${esc(label)}</strong><div class="sub">This is a planning check, not a grade or academic judgement.</div></div></div>
        <h3>What your explanation covered</h3>
        <div class="feedback-list">${ev.captured.length?ev.captured.map(x=>`<div class="feedback-item">✓ ${esc(x)}</div>`).join(''):`<div class="feedback-item">I could not confidently match a key requirement yet.</div>`}</div>
        ${ev.missing.length?`<h3 style="margin-top:16px">Check these before you start</h3><div class="feedback-list">${ev.missing.map(x=>`<div class="feedback-item missing">○ ${esc(x)}</div>`).join('')}</div>`:''}
        <div class="callout" style="margin-top:14px"><strong>Your explanation</strong><br>${esc(d.understanding||'')}</div>
        <div class="toolbar" style="margin-top:16px"><button class="btn btn-outline" data-nav="add-understanding">Edit my understanding</button><button class="btn btn-primary" id="prepareCustomPlan">Review & customise my plan →</button></div>
      </div></div>`;
  };

  views['plan-customize']=function(){
    const pd=state.planDraft||{};
    const steps=pd.steps?.length?pd.steps:generatePlanSteps(pd);
    const editing=!!pd.editingId;
    return `<div class="wizard"><div class="eyebrow">${editing?'Edit assignment plan':'Add assignment · 4 / 4'}</div><h1>Make the plan fit your life.</h1>
      <div class="sub">Change the tasks, remove anything unhelpful, add your own steps, set realistic time estimates, and choose target dates that fit your week.</div>
      <div class="card" style="margin-top:16px"><div id="planRows" class="plan-editor">${steps.map(planRow).join('')}</div>
        <button class="btn btn-soft" style="width:100%;margin-top:12px" id="addPlanStep">＋ Add my own task</button>
        <div class="notice" style="margin-top:12px">Time estimates and target dates are suggestions. Move them around to match your energy, classes, work, appointments and available study blocks.</div>
        <div class="toolbar" style="margin-top:14px"><button class="btn btn-outline" data-nav="${editing?'plan-view':'understanding-check'}">← Back</button><button class="btn btn-primary" id="saveCustomPlan">${editing?'Save changes':'Save assignment plan'}</button></div>
      </div></div>`;
  };

  views['plan-view']=function(){
    const a=selectedAssignment();
    if(!a)return `<div class="empty"><h2>No assignment selected</h2><button class="btn btn-primary" data-nav="add-assignment">Add assignment</button></div>`;
    return `<div class="eyebrow">Assignment plan</div><h1>Small steps. Room to breathe.</h1>${assignmentCard(a,true)}
      <div class="toolbar" style="margin-top:14px"><button class="btn btn-soft" id="editAssignmentPlan">Edit tasks & timing</button><button class="btn btn-outline" data-nav="planner">Open planner</button><button class="btn btn-outline" id="deleteAssignment">Delete assignment</button></div>
      ${a.briefAnalysis?`<div class="card" style="margin-top:16px"><h2>What the brief asks for</h2>${briefAnalysisHtml(a.briefAnalysis)}${a.briefFileName?`<div class="sub" style="margin-top:10px">Source: ${esc(a.briefFileName)}</div>`:''}</div>`:''}`;
  };

  views.planner=function(){
    const labels=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],start=weekStartMonday(),tasks=scheduledTasks();
    const days=labels.map((label,i)=>{const date=new Date(start);date.setDate(start.getDate()+i);return {label,date,key:isoDate(date)}});
    const weekKeys=new Set(days.map(d=>d.key));
    const weekTasks=tasks.filter(t=>t.date&&weekKeys.has(t.date)&&!t.done);
    const undated=tasks.filter(t=>!t.date&&!t.done);
    return `<div class="page-head"><div><div class="eyebrow">Planner</div><h1>A plan that fits you.</h1><div class="sub">Your real commitments and assignment target dates, in one place.</div></div><button class="btn btn-soft" data-nav="availability">Edit commitments</button></div>
      <div class="card" style="background:linear-gradient(135deg,#20552f,#36783f);color:white"><div class="eyebrow" style="color:#c9f5d2">Planned study remaining</div><strong style="font-size:34px;display:block;margin:6px 0">${fmtMins(totalPlanned())}</strong><div>${weekTasks.length} assignment task${weekTasks.length===1?'':'s'} scheduled this week · ${state.commitments.length} recurring commitment${state.commitments.length===1?'':'s'}</div></div>
      <div class="week" style="margin-top:16px">${days.map(d=>`<div class="day ${d.key===isoDate(new Date())?'today':''}"><strong>${d.label}</strong><small>${d.date.toLocaleDateString('en-AU',{day:'numeric',month:'short'})}</small>
        ${state.commitments.filter(x=>x.day===d.label).map(x=>`<div class="event ${esc(x.kind||'personal')}"><b>${esc(x.time||'')}</b><br>${esc(x.title||'')}</div>`).join('')}
        ${tasks.filter(t=>t.date===d.key&&!t.done).map(t=>`<div class="event study"><b>${esc(t.assignment.unit||'Assignment')}</b><br>${esc(t.step[0])}<br><small>${Number(t.step[1]||0)} min</small></div>`).join('')}
      </div>`).join('')}</div>
      <div class="callout"><h3>Keep it adjustable</h3><p>${undated.length?`${undated.length} unfinished task${undated.length===1?' has':'s have'} no target date yet. Open the assignment and choose dates that fit your week.`:'Move target dates whenever your week changes. The plan is here to support you, not punish you.'}</p><button class="btn btn-primary" data-nav="assignments">Review assignment plans</button></div>`;
  };

  views.progress=function(){
    ensureStateShape();
    const pending=[...state.rewards].filter(r=>!r.claimed).sort((a,b)=>a.points-b.points);
    const next=pending.find(r=>r.points>state.points)||pending[0]||null;
    const completed=state.assignments.reduce((n,a)=>n+doneCount(a),0);
    return `<div class="eyebrow">Progress</div><h1>Look how far you’ve grown.</h1><div class="sub">Progress is more than a finished assignment. Rewards are chosen by you — never taken away.</div>
      <div class="card" style="margin-top:18px;background:linear-gradient(135deg,var(--mint),var(--lav))"><div class="eyebrow">Your growth points</div><strong style="font-size:54px">${state.points}</strong><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100,next?state.points/Math.max(1,next.points)*100:100)}%"></div></div><div class="sub">${next?`${Math.max(0,next.points-state.points)} points until “${esc(next.title)}”`:'Your rewards are yours to enjoy.'}</div></div>
      <div class="kpi-grid" style="margin-top:14px"><div class="kpi"><strong>${completed}</strong><span>Small steps done</span></div><div class="kpi"><strong>${state.focusHistory.length}</strong><span>Focus sessions</span></div><div class="kpi"><strong>${state.rewards.filter(r=>r.claimed).length}</strong><span>Rewards enjoyed</span></div><div class="kpi"><strong>${state.rewards.filter(r=>state.points>=r.points&&!r.claimed).length}</strong><span>Rewards ready</span></div></div>
      <div class="card" style="margin-top:16px"><h2>Your rewards</h2><div class="sub">Add something you genuinely enjoy — a hobby, favourite food, game, walk, movie, café visit or anything meaningful to you.</div>
        <div class="reward-list">${state.rewards.length?state.rewards.map(rewardCard).join(''):`<div class="empty">No rewards added yet.</div>`}</div>
        <form id="rewardForm" class="grid g2" style="margin-top:14px"><div class="field"><label>My reward</label><input class="input" name="title" required placeholder="e.g. 1 hour of gaming"></div><div class="field"><label>Unlock at</label><input class="input" type="number" min="20" max="5000" step="10" name="points" value="250" required></div><button class="btn btn-primary" style="grid-column:1/-1">Add reward</button></form>
      </div>
      <div class="card" style="margin-top:16px"><h2>A week of little wins</h2><div class="bar-chart">${state.activity.map(x=>`<div class="bar ${x.mins?'active':''}" style="height:${30+x.mins*1.6}px"><span>${x.day}</span></div>`).join('')}</div></div>`;
  };

  const priorSettingsView=views.settings;
  views.settings=function(){
    const base=priorSettingsView();
    const account=authUser?`<div class="card" style="margin-top:16px"><h2>Your account</h2><div class="auth-panel"><div><strong>${esc(authUser.email||'Signed in')}</strong><div class="sync-state">Your planner can sync through REACH Student Planner’s Supabase account storage.</div></div><button class="btn btn-soft" id="syncNow">Sync now</button><div class="toolbar"><button class="btn btn-outline" id="signOutAccount">Sign out</button><button class="btn btn-outline" id="signOutAndClear">Sign out & clear this device</button></div><button class="btn btn-outline" id="deleteCloudPlanner">Delete my synced planner data</button></div></div>`:
      `<div class="card" style="margin-top:16px"><h2>Account & sync</h2><div class="sub">You can keep using the planner only on this device, or create an account to sync your profile, units, assignments, extracted brief text, plans, rewards and progress across devices.</div><form id="authForm" class="auth-panel" style="margin-top:12px"><input class="input" type="email" name="email" autocomplete="email" placeholder="Email" required><input class="input" type="password" name="password" autocomplete="current-password" minlength="8" placeholder="Password (8+ characters)" required><div class="toolbar"><button class="btn btn-primary" type="submit" data-auth-action="signin">Sign in</button><button class="btn btn-outline" type="button" id="createAccount">Create account</button></div><button class="btn btn-outline" type="button" id="forgotPassword">Forgot password</button></form><div class="notice" style="margin-top:12px">Account sync is optional. Email confirmation may be required after sign-up. The original uploaded brief file is not stored in the cloud.</div></div>`;
    const recovery=authRecoveryMode?`<div class="card" style="margin-top:16px"><h2>Choose a new password</h2><form id="passwordRecoveryForm" class="auth-panel"><input class="input" type="password" name="password" autocomplete="new-password" minlength="8" placeholder="New password (8+ characters)" required><button class="btn btn-primary" type="submit">Update password</button></form></div>`:'';
    return base+account+recovery+`<div class="card" style="margin-top:16px"><h2>Wellbeing & privacy</h2><div class="sub">REACH Student Planner supports organisation, focus and study wellbeing. It is not a medical, diagnostic, counselling or emergency service. Students stay in control of plans and can edit or reschedule tasks without penalty.</div></div>`;
  };

  function wireNav(root){
    root.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.nav)));
  }

  function wireBrief(root){
    wireNav(root);
    const form=root.querySelector('#smartAssignmentBrief');
    if(!form)return;
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const fd=new FormData(form), file=fd.get('file'), pasted=normaliseText(fd.get('brief')||'');
      if((!file||!file.name)&&!pasted){toast('Upload a brief or paste the instructions');return}
      const btn=root.querySelector('#readBriefButton');
      if(btn){btn.disabled=true;btn.textContent='Reading brief…'}
      try{
        const fileText=file&&file.name?await extractDocumentText(file):'';
        const combined=normaliseText([fileText,pasted].filter(Boolean).join('\n\nAdditional notes:\n')).slice(0,MAX_BRIEF_CHARS);
        if(combined.length<30)throw new Error('I could not find enough readable text. Paste the brief instructions and try again.');
        const analysis=analyseBrief(combined,state.draft||{});
        state.draft=Object.assign(state.draft||{},{
          brief:combined.slice(0,1800),
          briefText:combined,
          briefFileName:file?.name||state.draft?.briefFileName||'',
          fileName:file?.name||state.draft?.fileName||'',
          briefTextChars:combined.length,
          briefFingerprint:briefFingerprint(combined),
          briefAnalysis:analysis
        });
        save(); nav('add-understanding');
      }catch(err){
        toast(err?.message||'Could not read that brief');
        if(btn){btn.disabled=false;btn.textContent='Read brief & continue →'}
      }
    });
  }

  function wireUnderstanding(root){
    wireNav(root);
    const form=root.querySelector('#smartUnderstanding');
    if(!form)return;
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const understanding=normaliseText(new FormData(form).get('understanding')||'');
      if(understanding.length<8){toast('Add a little more about what you think the task is asking');return}
      const evaluation=evaluateUnderstanding(understanding,state.draft?.briefAnalysis||{});
      state.draft=Object.assign(state.draft||{},{understanding,understandingEvaluation:evaluation});
      save(); nav('understanding-check');
    });
  }

  function wireUnderstandingCheck(root){
    previousWire(root);
    const b=root.querySelector('#prepareCustomPlan');
    if(b)b.addEventListener('click',()=>{
      const d=state.draft||{};
      state.planDraft=Object.assign({},d,{steps:distributePlanDates(generatePlanSteps(d),d)});
      save();nav('plan-customize');
    });
  }

  function wirePlanCustomize(root){
    wireNav(root);
    function bindRemove(){root.querySelectorAll('.remove-plan-step').forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.addEventListener('click',()=>b.closest('[data-plan-row]')?.remove())})}
    bindRemove();
    const add=root.querySelector('#addPlanStep');
    if(add)add.addEventListener('click',()=>{root.querySelector('#planRows')?.insertAdjacentHTML('beforeend',planRow(['My task',30,false],999));bindRemove()});
    const saveBtn=root.querySelector('#saveCustomPlan');
    if(saveBtn)saveBtn.addEventListener('click',()=>{
      const rows=[...root.querySelectorAll('[data-plan-row]')];
      const steps=rows.map(r=>[(r.querySelector('[data-plan-title]')?.value||'').trim(),Math.max(5,Math.min(300,+(r.querySelector('[data-plan-mins]')?.value||30))),false,(r.querySelector('[data-plan-date]')?.value||'')]).filter(s=>s[0]);
      if(!steps.length){toast('Add at least one task to your plan');return}
      const pd=state.planDraft||{};
      if(pd.editingId){
        const a=state.assignments.find(x=>x.id===pd.editingId);
        if(a){const oldDone=new Map((a.steps||[]).map(s=>[s[0],!!s[2]]));a.steps=steps.map(s=>[s[0],s[1],oldDone.get(s[0])||false,s[3]||'']);selectedAssignmentId=a.id}
      }else{
        const d=state.draft||pd;
        if(!d.title){toast('Assignment details are missing');return}
        const id=Date.now();
        state.assignments.unshift({
          id,unit:d.unit,title:d.title,due:`${d.date}T${d.time||'17:00'}`,weight:d.weight,type:d.type,
          brief:d.brief||'',briefText:d.briefText||'',briefFileName:d.briefFileName||d.fileName||'',briefTextChars:d.briefTextChars||d.briefText?.length||0,briefFingerprint:d.briefFingerprint||briefFingerprint(d.briefText||d.brief||''),
          briefAnalysis:d.briefAnalysis||null,understanding:d.understanding||'',understandingEvaluation:d.understandingEvaluation||null,
          steps:steps
        });
        selectedAssignmentId=id; state.draft=null;
      }
      state.planDraft=null; save();toast(pd.editingId?'Plan updated':'Assignment plan created');nav('plan-view');
    });
  }

  function wireProgress(root){
    previousWire(root);
    const rf=root.querySelector('#rewardForm');
    if(rf)rf.addEventListener('submit',e=>{
      e.preventDefault();const fd=new FormData(rf),title=normaliseText(fd.get('title')||''),points=Math.max(20,+fd.get('points')||250);
      if(!title)return;state.rewards.push({id:'reward-'+Date.now(),title,points,claimed:false});save();toast('Reward added');render();
    });
    root.querySelectorAll('[data-claim-reward]').forEach(b=>b.addEventListener('click',()=>{const r=state.rewards.find(x=>x.id===b.dataset.claimReward);if(r&&state.points>=r.points){r.claimed=true;r.claimedAt=new Date().toISOString();save();toast('Enjoy it — you earned this');render()}}));
    root.querySelectorAll('[data-remove-reward]').forEach(b=>b.addEventListener('click',()=>{state.rewards=state.rewards.filter(x=>x.id!==b.dataset.removeReward);save();render()}));
  }

  function wirePlanView(root){
    previousWire(root);
    // Replace old step listeners to make points reversible and prevent repeated point farming.
    root.querySelectorAll('[data-step]').forEach(old=>{
      const b=old.cloneNode(true);old.replaceWith(b);
      b.addEventListener('click',()=>{
        const [aid,i]=b.dataset.step.split(':').map(Number),a=state.assignments.find(x=>x.id===aid);
        if(!a||!a.steps?.[i])return;
        const was=!!a.steps[i][2];a.steps[i][2]=!was;
        state.points=Math.max(0,state.points+(was?-10:10));
        save();render();
      });
    });
    const edit=root.querySelector('#editAssignmentPlan');
    if(edit)edit.addEventListener('click',()=>{
      const a=selectedAssignment();if(!a)return;
      state.planDraft={editingId:a.id,title:a.title,unit:a.unit,type:a.type,weight:a.weight,date:(a.due||'').slice(0,10),time:(a.due||'').slice(11,16),brief:a.brief,briefText:a.briefText,briefAnalysis:a.briefAnalysis,steps:(a.steps||[]).map(s=>[s[0],s[1],s[2],s[3]||''])};
      save();nav('plan-customize');
    });
    const del=root.querySelector('#deleteAssignment');
    if(del)del.addEventListener('click',()=>{
      const a=selectedAssignment();if(!a)return;
      if(!confirm(`Delete “${a.title}” and its saved brief/plan? Growth points already earned will stay.`))return;
      state.assignments=state.assignments.filter(x=>x.id!==a.id);selectedAssignmentId=state.assignments[0]?.id||null;save();toast('Assignment deleted');nav('assignments');
    });
  }

  function wireAssignmentsOrHome(root){
    previousWire(root);
    root.querySelectorAll('[data-step]').forEach(old=>{
      const b=old.cloneNode(true);old.replaceWith(b);
      b.addEventListener('click',()=>{
        const [aid,i]=b.dataset.step.split(':').map(Number),a=state.assignments.find(x=>x.id===aid);
        if(!a||!a.steps?.[i])return;
        const was=!!a.steps[i][2];a.steps[i][2]=!was;
        state.points=Math.max(0,state.points+(was?-10:10));save();render();
      });
    });
  }

  async function initCloud(){
    if(authInitialised||!window.supabase?.createClient)return;
    authInitialised=true;
    try{
      sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      const {data:{session}}=await sb.auth.getSession();
      authUser=session?.user||null;
      if(authUser)await loadCloudState();
      sb.auth.onAuthStateChange(async(event,session)=>{
        const previousId=authUser?.id||null;
        authUser=session?.user||null;
        if(event==='PASSWORD_RECOVERY'){
          authRecoveryMode=true;screen='settings';render();
        }
        if(authUser&&authUser.id!==previousId&&event!=='PASSWORD_RECOVERY')await loadCloudState();
        const pill=document.getElementById('syncPill');if(pill)pill.textContent=authUser?'Synced account':'Saved on this device';
        if(screen==='settings')render();
      });
      const pill=document.getElementById('syncPill');if(pill)pill.textContent=authUser?'Synced account':'Saved on this device';
    }catch(err){console.warn('Cloud sync unavailable',err)}
  }
  async function loadCloudState(){
    if(!sb||!authUser)return;
    try{
      const {data,error}=await sb.from('planner_state').select('data,updated_at').eq('user_id',authUser.id).maybeSingle();
      if(error)throw error;
      if(data?.data&&Object.keys(data.data).length){
        cloudApplying=true;
        const cloud=data.data;
        state=Object.assign(structuredClone(defaults),cloud);
        state.units=Array.isArray(cloud.units)?cloud.units:structuredClone(defaults.units);
        ensureStateShape();
        localStorage.setItem(KEY,JSON.stringify(state));
        cloudApplying=false;applyTheme();render();toast('Your account planner is loaded');
      }else{
        await syncCloudNow();
      }
    }catch(err){console.warn('Could not load cloud planner',err);toast('Account connected, but cloud data could not be loaded')}
  }
  async function syncCloudNow(){
    if(!sb||!authUser||cloudApplying)return;
    ensureStateShape();
    try{
      const payload={...state,lastSavedAt:new Date().toISOString()};
      state.lastSavedAt=payload.lastSavedAt;
      const {error}=await sb.from('planner_state').upsert({user_id:authUser.id,data:payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});
      if(error)throw error;
      const pill=document.getElementById('syncPill');if(pill)pill.textContent='Synced';
      return true;
    }catch(err){console.warn('Cloud sync failed',err);const pill=document.getElementById('syncPill');if(pill)pill.textContent='Saved locally · sync pending';return false}
  }
  save=function(){
    ensureStateShape();state.lastSavedAt=new Date().toISOString();previousSave();
    if(authUser&&!cloudApplying){clearTimeout(cloudSyncTimer);cloudSyncTimer=setTimeout(syncCloudNow,700)}
  };

  function wireSettings(root){
    previousWire(root);
    const originalReminder=root.querySelector('#notifSwitch');
    if(originalReminder){const reminder=originalReminder.cloneNode(true);originalReminder.replaceWith(reminder);reminder.addEventListener('click',async()=>{await setGentleReminders(!state.notifications);render()})}
    const form=root.querySelector('#authForm');
    if(form)form.addEventListener('submit',async e=>{
      e.preventDefault();if(!sb){toast('Account service is still loading');return}
      const fd=new FormData(form),email=String(fd.get('email')||'').trim(),password=String(fd.get('password')||'');
      const {error}=await sb.auth.signInWithPassword({email,password});
      if(error)toast(error.message);else toast('Signed in — loading your planner');
    });
    const create=root.querySelector('#createAccount');
    if(create)create.addEventListener('click',async()=>{
      if(!sb){toast('Account service is still loading');return}
      const form=root.querySelector('#authForm'),fd=new FormData(form),email=String(fd.get('email')||'').trim(),password=String(fd.get('password')||'');
      if(!email||password.length<8){toast('Enter an email and a password of at least 8 characters');return}
      const {data,error}=await sb.auth.signUp({email,password,options:{data:{first_name:state.name||''}}});
      if(error)toast(error.message);else if(data.session)toast('Account created and signed in');else toast('Account created — check your email to confirm it');
    });
    const forgot=root.querySelector('#forgotPassword');if(forgot)forgot.addEventListener('click',async()=>{
      if(!sb){toast('Account service is still loading');return}
      const email=String(new FormData(root.querySelector('#authForm')).get('email')||'').trim();
      if(!email){toast('Enter your email first');return}
      const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
      if(error)toast(error.message);else toast('Password reset email sent');
    });
    const recovery=root.querySelector('#passwordRecoveryForm');if(recovery)recovery.addEventListener('submit',async e=>{
      e.preventDefault();if(!sb)return;
      const password=String(new FormData(recovery).get('password')||'');
      if(password.length<8){toast('Use at least 8 characters');return}
      const {error}=await sb.auth.updateUser({password});
      if(error)toast(error.message);else{authRecoveryMode=false;toast('Password updated');render()}
    });
    const sync=root.querySelector('#syncNow');if(sync)sync.addEventListener('click',async()=>{const ok=await syncCloudNow();toast(ok?'Planner synced':'Saved locally — cloud sync still pending')});
    const out=root.querySelector('#signOutAccount');if(out)out.addEventListener('click',async()=>{
      if(sb)await sb.auth.signOut();authUser=null;render();toast('Signed out — local planner kept on this device');
    });
    const clearOut=root.querySelector('#signOutAndClear');if(clearOut)clearOut.addEventListener('click',async()=>{
      if(!confirm('Sign out and remove the planner copy stored on this device? Your synced account data will stay in the cloud.'))return;
      if(sb)await sb.auth.signOut();authUser=null;state=structuredClone(defaults);ensureStateShape();localStorage.setItem(KEY,JSON.stringify(state));applyTheme();render();toast('Signed out and cleared this device');
    });
    const del=root.querySelector('#deleteCloudPlanner');if(del)del.addEventListener('click',async()=>{
      if(!sb||!authUser)return;
      if(!confirm('Delete the planner data synced to this account? This cannot be undone. Your login account will remain.'))return;
      const {error}=await sb.from('planner_state').delete().eq('user_id',authUser.id);
      if(error){toast(error.message);return}
      state=structuredClone(defaults);ensureStateShape();localStorage.setItem(KEY,JSON.stringify(state));applyTheme();toast('Synced planner data deleted');render();
    });
  }

  wire=function(root){
    if(screen==='add-brief')return wireBrief(root);
    if(screen==='add-understanding')return wireUnderstanding(root);
    if(screen==='understanding-check')return wireUnderstandingCheck(root);
    if(screen==='plan-customize')return wirePlanCustomize(root);
    if(screen==='progress')return wireProgress(root);
    if(screen==='plan-view')return wirePlanView(root);
    if(screen==='settings')return wireSettings(root);
    return wireAssignmentsOrHome(root);
  };

  initCloud();
  render();
  setTimeout(maybeSendGentleReminder,1800);
  setInterval(maybeSendGentleReminder,20*60*1000);
})();
