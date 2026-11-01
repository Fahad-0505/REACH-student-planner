
(() => {
  const oldWire = wire;

  function wireNavAndUnit(root) {
    root.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => nav(b.dataset.nav)));
    root.querySelectorAll('[data-open-assignment]').forEach(b => b.addEventListener('click', () => {
      selectedAssignmentId = Number(b.dataset.openAssignment);
      nav('plan-view');
    }));
    root.querySelectorAll('[data-open-unit]').forEach(b => b.addEventListener('click', () => {
      selectedUnitCode = b.dataset.openUnit;
      nav('unit-detail');
    }));
    root.querySelectorAll('[data-upload-outline]').forEach(b => b.addEventListener('click', () => {
      selectedUnitCode = b.dataset.uploadOutline;
      nav('outline-upload');
    }));
  }

  views['outline-upload'] = function () {
    const hasUnits = state.units.length > 0;
    const target = selectedUnitCode && state.units.some(u => u.code === selectedUnitCode) ? selectedUnitCode : '';
    return `<div class="wizard">
      <div class="eyebrow">Unit outline · 1 / 2</div>
      <h1>Upload. Review. Plan.</h1>
      <div class="sub">For text-based PDFs, the planner reads the outline on this device and suggests assessments, weights and due dates. You review everything before it is used.</div>
      <div class="card" style="margin-top:18px">
        <form id="outlineForm">
          ${hasUnits ? `<div class="field"><label>Unit</label><select class="select" name="unit"><option value="">Choose a unit</option>${state.units.map(u => `<option value="${esc(u.code)}" ${u.code === target ? 'selected' : ''}>${esc(u.code)} · ${esc(u.name)}</option>`).join('')}</select></div><div class="divider"></div>` : ''}
          <div class="eyebrow">Or add a new unit</div>
          <div class="grid g2" style="margin-top:10px">
            <div class="field"><label>Unit code</label><input class="input" name="newCode" placeholder="e.g. PSY204"></div>
            <div class="field"><label>Unit name</label><input class="input" name="newName" placeholder="e.g. Research Methods"></div>
          </div>
          <div class="field"><label>Unit outline PDF</label><div class="file-box"><input type="file" name="file" accept=".pdf,.txt,application/pdf,text/plain" required></div></div>
          <div class="notice"><strong>Private by design.</strong> The file is analysed locally in your browser. It is not uploaded to REACH or a third-party AI service.</div>
          <button class="btn btn-primary" type="submit" id="outlineReadButton">Read outline & review →</button>
        </form>
      </div>
    </div>`;
  };

  views['outline-review'] = function () {
    const o = state.outlineDraft || {};
    const items = o.assessments?.length ? o.assessments : [{ title: '', type: 'Assessment', weight: '', dueDate: '', dueTime: '17:00' }];
    return `<div class="wizard">
      <div class="eyebrow">Unit outline · 2 / 2</div>
      <h1>Check what the planner found.</h1>
      <div class="sub">These are suggestions from the uploaded outline. Correct anything before confirming—especially dates and weighting.</div>
      <div class="card" style="margin-top:18px">
        <div class="grid g2">
          <div class="field"><label>Unit code</label><input class="input" id="outlineCode" value="${esc(o.code || '')}"></div>
          <div class="field"><label>Unit name</label><input class="input" id="outlineName" value="${esc(o.name || '')}"></div>
        </div>
        <div class="field"><label>Teaching period (optional)</label><input class="input" id="outlinePeriod" value="${esc(o.period || '')}" placeholder="e.g. Semester 2, 2026"></div>
        <div class="analysis-state"><span>✓</span><div><strong>${esc(o.fileName || 'Outline')}</strong><div class="sub">${o.assessments?.length ? `${o.assessments.length} possible assessment${o.assessments.length === 1 ? '' : 's'} found` : 'No assessment table was confidently detected — add or edit the rows below.'}</div></div></div>
        <h2 style="margin-top:20px">Assessment suggestions</h2>
        <div class="sub">Nothing is added to Assignments until you confirm.</div>
        <div id="assessmentRows">${items.map(assessmentEditorRow).join('')}</div>
        <button class="btn btn-soft" type="button" id="addAssessmentRow" style="margin-top:12px;width:100%">＋ Add another assessment</button>
        <div class="callout" style="margin-top:14px">Academic integrity: the tool only extracts planning information such as assessment names, weights and deadlines. It does not write assessment content.</div>
        <div class="toolbar" style="margin-top:14px"><button class="btn btn-outline" data-nav="outline-upload">← Back</button><button class="btn btn-primary" id="confirmOutline">Confirm unit & assessments</button></div>
      </div>
    </div>`;
  };

  views['unit-detail'] = function () {
    const u = selectedUnit();
    if (!u) return `<div class="empty"><h2>Unit not found</h2><button class="btn btn-primary" data-nav="semester-setup">Back to units</button></div>`;
    const aa = state.assignments.filter(a => a.unit === u.code).sort((a, b) => new Date(a.due) - new Date(b.due));
    return `<div class="eyebrow">Unit</div>
      <h1>${esc(u.code)} · ${esc(u.name)}</h1>
      <div class="sub">${u.teachingPeriod ? esc(u.teachingPeriod) : 'Your unit overview'}</div>
      <div class="unit-summary"><div class="kpi"><strong>${aa.length}</strong><span>Assessments</span></div><div class="kpi"><strong>${u.outlineConfirmed ? '✓' : '—'}</strong><span>${u.outlineConfirmed ? 'Outline reviewed' : 'Outline not added'}</span></div></div>
      <div class="card"><div class="page-head" style="margin-bottom:8px"><div><h2>Unit outline</h2><div class="sub">${u.outlineFile ? esc(u.outlineFile) : 'Upload the outline to identify assessment dates.'}</div></div><button class="btn btn-soft" data-upload-outline="${esc(u.code)}">${u.outlineConfirmed ? 'Replace outline' : 'Upload outline'}</button></div></div>
      <div class="card" style="margin-top:16px"><div class="page-head" style="margin-bottom:8px"><div><h2>Assessments & deadlines</h2><div class="sub">Confirmed dates feed the Assignments screen and planner.</div></div><button class="btn btn-soft" data-nav="add-assignment">＋ Add manually</button></div>
        ${aa.length ? `<div class="deadline-list">${aa.map(a => `<button class="deadline-item unit-open" data-open-assignment="${a.id}"><div class="status">${a.weight || 0}%</div><div class="row-main"><strong>${esc(a.title)}</strong><small>${esc(a.type || 'Assessment')} · Due ${fmtDue(a.due)}</small></div><span class="chevron">›</span></button>`).join('')}</div>` : `<div class="empty">No assessments confirmed for this unit yet.</div>`}
      </div>
      <button class="btn btn-outline flow-next" data-nav="semester-setup">← All units</button>`;
  };

  views.settings = function () {
    return `<div class="eyebrow">Profile & settings</div><h1>Make the planner yours.</h1>
      <div class="grid g2">
        <div class="card"><h2>Profile</h2><div class="field"><label>First name</label><input class="input" id="nameInput" value="${esc(state.name)}"></div><button class="btn btn-primary" id="saveProfile">Save profile</button></div>
        <div class="card"><h2>Preferences</h2><div class="settings-list">
          <div class="setting"><div><strong>Appearance</strong><div class="sub">Use the mode that feels easiest on your eyes.</div></div><div class="theme-choice"><button class="chip ${state.theme === 'light' ? 'active' : ''}" data-theme="light">☀ Light</button><button class="chip ${state.theme === 'dark' ? 'active' : ''}" data-theme="dark">☾ Dark</button></div></div>
          <div class="divider"></div><div class="setting"><div><strong>Gentle reminders</strong><div class="sub">Supportive, not nagging.</div></div><button class="switch ${state.notifications ? 'on' : ''}" id="notifSwitch" aria-label="Toggle reminders"></button></div>
          <div class="divider"></div><div class="setting"><div><strong>Data storage</strong><div class="sub">Working planner data stays on this device.</div></div><span class="status">Local-first</span></div>
        </div></div>
      </div>
      <div class="card" style="margin-top:16px"><div class="page-head" style="margin-bottom:8px"><div><h2>Units</h2><div class="sub">Tap a unit to open assessments and deadlines.</div></div><button class="btn btn-soft" data-nav="outline-upload">＋ Add / upload</button></div>
        ${state.units.length ? state.units.map((u, i) => `<div class="row unit-row"><button class="unit-open" data-open-unit="${esc(u.code)}"><div class="row-main"><strong>${esc(u.code)} · ${esc(u.name)}</strong><div class="unit-meta">${u.outlineConfirmed ? `<span class="status">Outline confirmed</span>` : `<span class="status yellow">Outline not added</span>`}<span class="status blue">${state.assignments.filter(a => a.unit === u.code).length} assessments</span></div>${u.teachingPeriod ? `<small>${esc(u.teachingPeriod)}</small>` : ''}</div><span class="chevron">›</span></button><button class="btn btn-outline" data-remove-unit="${i}">Remove</button></div>`).join('') : `<div class="empty">No units yet.</div>`}
        <form id="unitForm" class="grid g3" style="margin-top:14px"><input class="input" name="code" placeholder="Unit code" required><input class="input" name="name" placeholder="Unit name" required><button class="btn btn-primary">Add unit</button></form>
      </div>
      <div class="card" style="margin-top:16px"><h2>Data & handover</h2><div class="sub">Export a backup before changing devices. The file contains planner data only.</div><div class="toolbar" style="margin-top:12px"><button class="btn btn-soft" id="exportData">Export backup</button><label class="btn btn-outline">Import backup<input id="importData" type="file" accept="application/json" hidden></label><button class="btn btn-danger" id="resetData">Reset demo data</button></div></div>`;
  };

  views.planner = function () {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const upcoming = [...state.assignments].filter(a => new Date(a.due).getTime() > Date.now() - 86400000).sort((a, b) => new Date(a.due) - new Date(b.due)).slice(0, 4);
    return `<div class="page-head"><div><div class="eyebrow">Planner</div><h1>A plan that fits you.</h1><div class="sub">Build around your life, not the other way round.</div></div><button class="btn btn-soft" data-nav="availability">Edit availability</button></div>
      <div class="card" style="background:linear-gradient(135deg,#20552f,#36783f);color:white"><div class="eyebrow" style="color:#c9f5d2">Room for real life</div><strong style="font-size:34px;display:block;margin:6px 0">6h 30m</strong><div>of 9h available · 2h 30m free</div></div>
      <div class="week" style="margin-top:16px">${days.map((d, idx) => `<div class="day ${idx === 2 ? 'today' : ''}"><strong>${d}</strong>${state.commitments.filter(c => c.day === d).map(c => `<div class="event ${c.kind}"><b>${c.time}</b><br>${esc(c.title)}</div>`).join('')}</div>`).join('')}</div>
      <div class="card" style="margin-top:16px"><h2>Upcoming unit deadlines</h2><div class="sub">Dates confirmed from unit outlines and assignments.</div>${upcoming.length ? `<div class="deadline-list" style="margin-top:12px">${upcoming.map(a => `<button class="deadline-item unit-open" data-open-assignment="${a.id}"><div class="status">${esc(a.unit)}</div><div class="row-main"><strong>${esc(a.title)}</strong><small>Due ${fmtDue(a.due)}</small></div><span class="chevron">›</span></button>`).join('')}</div>` : `<div class="empty">No upcoming deadlines yet.</div>`}</div>
      <div class="callout" style="margin-top:16px"><h3>Let's spread things out</h3><p>Short blocks, a little buffer, no cramming.</p><button class="btn btn-primary" data-nav="today">▹ Start a ${state.focusMinutes}-min focus</button></div>`;
  };

  function wireCustomSettings(root) {
    wireNavAndUnit(root);
    root.querySelectorAll('[data-theme]').forEach(b => b.addEventListener('click', () => {
      state.theme = b.dataset.theme;
      save(); render(); toast(`${state.theme === 'dark' ? 'Dark' : 'Light'} mode on`);
    }));
    const ns = root.querySelector('#notifSwitch');
    if (ns) ns.addEventListener('click', () => { state.notifications = !state.notifications; save(); render(); });
    const sp = root.querySelector('#saveProfile');
    if (sp) sp.addEventListener('click', () => { state.name = root.querySelector('#nameInput').value.trim() || 'Alex'; save(); toast('Profile saved'); });
    root.querySelectorAll('[data-remove-unit]').forEach(b => b.addEventListener('click', () => { state.units.splice(+b.dataset.removeUnit, 1); save(); render(); }));
    const uf = root.querySelector('#unitForm');
    if (uf) uf.addEventListener('submit', e => {
      e.preventDefault(); const fd = new FormData(uf); const code = String(fd.get('code') || '').trim().toUpperCase(); const name = String(fd.get('name') || '').trim();
      if (!code || !name) return; if (state.units.some(u => u.code === code)) { toast('That unit already exists'); return; }
      state.units.push({ code, name, outlineConfirmed: false }); save(); toast('Unit added'); render();
    });
    const exp = root.querySelector('#exportData');
    if (exp) exp.addEventListener('click', () => { const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'REACH-Student-Planner-backup.json'; a.click(); URL.revokeObjectURL(a.href); });
    const imp = root.querySelector('#importData');
    if (imp) imp.addEventListener('change', async () => { try { state = JSON.parse(await imp.files[0].text()); save(); toast('Backup imported'); render(); } catch { toast('That backup file could not be read'); } });
    const reset = root.querySelector('#resetData');
    if (reset) reset.addEventListener('click', () => { if (confirm('Reset planner to demo data?')) { state = structuredClone(defaults); save(); render(); } });
  }

  function wireOutlineUpload(root) {
    wireNavAndUnit(root);
    const of = root.querySelector('#outlineForm');
    if (!of) return;
    of.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(of);
      const existingCode = String(fd.get('unit') || '').trim();
      const newCode = String(fd.get('newCode') || '').trim().toUpperCase();
      const newName = String(fd.get('newName') || '').trim();
      const file = fd.get('file');
      const code = newCode || existingCode;
      let existing = state.units.find(u => u.code === code);
      const name = newName || existing?.name || '';
      if (!code) { toast('Choose an existing unit or enter a new unit code'); return; }
      if (newCode && !newName && !existing) { toast('Enter a name for the new unit'); return; }
      if (!file || !file.name) { toast('Choose a unit outline PDF'); return; }
      if (newCode && newName && !existing) { state.units.push({ code: newCode, name: newName, outlineConfirmed: false }); existing = state.units[state.units.length - 1]; }
      const btn = root.querySelector('#outlineReadButton'); if (btn) { btn.disabled = true; btn.textContent = 'Reading outline…'; }
      toast('Reading the outline on this device…');
      try {
        const parsed = await extractOutlinePdf(file);
        state.outlineDraft = { code, name: name || existing?.name || code, fileName: file.name, period: existing?.teachingPeriod || '', assessments: parsed.assessments, extractedTextChars: parsed.text.length };
        selectedUnitCode = code; save(); nav('outline-review');
      } catch (err) {
        toast(err?.message || 'Could not read that outline');
        if (btn) { btn.disabled = false; btn.textContent = 'Read outline & review →'; }
      }
    });
  }

  function wireOutlineReview(root) {
    wireNavAndUnit(root);
    const wireRemove = () => root.querySelectorAll('[data-remove-extracted]').forEach(b => {
      if (b.dataset.wired) return; b.dataset.wired = '1';
      b.addEventListener('click', () => b.closest('[data-assessment-row]')?.remove());
    });
    wireRemove();
    const add = root.querySelector('#addAssessmentRow');
    if (add) add.addEventListener('click', () => {
      const host = root.querySelector('#assessmentRows');
      host?.insertAdjacentHTML('beforeend', assessmentEditorRow({ title: '', type: 'Assessment', weight: '', dueDate: '', dueTime: '17:00' }, host.querySelectorAll('[data-assessment-row]').length));
      wireRemove();
    });
    const co = root.querySelector('#confirmOutline');
    if (!co) return;
    co.addEventListener('click', () => {
      const code = (root.querySelector('#outlineCode')?.value || '').trim().toUpperCase();
      const name = (root.querySelector('#outlineName')?.value || '').trim();
      const period = (root.querySelector('#outlinePeriod')?.value || '').trim();
      if (!code || !name) { toast('Unit code and name are required'); return; }
      const extracted = [...root.querySelectorAll('[data-assessment-row]')].map(row => ({
        title: (row.querySelector('[data-a="title"]')?.value || '').trim(),
        type: row.querySelector('[data-a="type"]')?.value || 'Assessment',
        weight: +(row.querySelector('[data-a="weight"]')?.value || 0),
        date: row.querySelector('[data-a="date"]')?.value || '',
        time: row.querySelector('[data-a="time"]')?.value || '17:00'
      })).filter(x => x.title);
      let unit = state.units.find(u => u.code === code);
      if (!unit) { unit = { code, name }; state.units.push(unit); }
      unit.name = name; unit.outlineConfirmed = true; unit.outlineFile = state.outlineDraft?.fileName || unit.outlineFile || '';
      unit.teachingPeriod = period; unit.outlineConfirmedAt = new Date().toISOString(); unit.extractedAssessmentCount = extracted.length;
      for (const x of extracted) {
        if (!x.date) continue;
        const due = `${x.date}T${x.time || '17:00'}`;
        const duplicate = state.assignments.some(a => a.unit === code && a.title.toLowerCase() === x.title.toLowerCase() && a.due.slice(0, 10) === x.date);
        if (!duplicate) state.assignments.push({ id: Date.now() + Math.floor(Math.random() * 10000), unit: code, title: x.title, due, weight: Math.max(0, Math.min(100, x.weight || 0)), type: x.type, brief: 'Imported from reviewed unit outline.', source: 'unit-outline', steps: stepsForType(x.type) });
      }
      state.assignments.sort((a, b) => new Date(a.due) - new Date(b.due));
      selectedUnitCode = code; state.outlineConfirmed = true; state.outlineDraft = null; save();
      const dated = extracted.filter(x => x.date).length;
      toast(`${code} saved · ${dated} dated assessment${dated === 1 ? '' : 's'} added`);
      nav('unit-detail');
    });
  }

  wire = function (root) {
    if (screen === 'outline-upload') return wireOutlineUpload(root);
    if (screen === 'outline-review') return wireOutlineReview(root);
    if (screen === 'unit-detail') return wireNavAndUnit(root);
    if (screen === 'settings') return wireCustomSettings(root);
    oldWire(root);
    root.querySelectorAll('[data-open-unit]').forEach(b => b.addEventListener('click', () => { selectedUnitCode = b.dataset.openUnit; nav('unit-detail'); }));
    root.querySelectorAll('[data-upload-outline]').forEach(b => b.addEventListener('click', () => { selectedUnitCode = b.dataset.uploadOutline; nav('outline-upload'); }));
  };

  render();
})();


/* Curtin Unit Outline assessment schedule parser */
(() => {
  const genericDetectAssessments = detectAssessmentsFromText;

  function inferOutlineYear(text='') {
    const semester = String(text).match(/\bSemester\s+[12]\s+(20\d{2})\b/i);
    if (semester) return Number(semester[1]);
    const years = [...String(text).matchAll(/\b(20\d{2})\b/g)].map(m => Number(m[1])).filter(y => y >= 2020 && y <= 2040);
    if (!years.length) return new Date().getFullYear();
    const counts = new Map();
    for (const y of years) counts.set(y, (counts.get(y) || 0) + 1);
    return [...counts.entries()].sort((a,b) => b[1] - a[1])[0][0];
  }

  function monthNumber(name='') {
    const months = {
      jan:1,january:1,feb:2,february:2,mar:3,march:3,apr:4,april:4,may:5,
      jun:6,june:6,jul:7,july:7,aug:8,august:8,sep:9,september:9,
      oct:10,october:10,nov:11,november:11,dec:12,december:12
    };
    return months[String(name).toLowerCase()] || 0;
  }

  function parseCurtinDay(lines, start, year) {
    let month = 0, day = 0;
    const first = (lines[start] || '').replace(/^Day:\s*/i,'').trim();
    const firstParts = first.split(/\s+/).filter(Boolean);
    for (const part of firstParts) {
      if (!month && monthNumber(part)) month = monthNumber(part);
      else if (!day && /^\d{1,2}$/.test(part)) day = Number(part);
    }
    for (let j=start+1; j<Math.min(lines.length,start+3) && (!month || !day); j++) {
      const parts = (lines[j] || '').split(/\s+/).filter(Boolean);
      for (const part of parts) {
        if (!month && monthNumber(part)) month = monthNumber(part);
        else if (!day && /^\d{1,2}$/.test(part)) day = Number(part);
      }
    }
    if (!month || !day) return '';
    return String(year) + '-' + String(month).padStart(2,'0') + '-' + String(day).padStart(2,'0');
  }

  function detectCurtinAssessmentSchedule(text='') {
    const raw = String(text);
    const match = raw.match(/Assessment Schedule([\s\S]*?)(?:\*Please refer|Detailed Information on assessment tasks)/i);
    if (!match) return [];
    const lines = match[1].split(/\n+/).map(x => x.replace(/\s+/g,' ').trim()).filter(Boolean);
    const year = inferOutlineYear(raw);
    const out = [];

    for (let i=0; i<lines.length; i++) {
      const row = lines[i].match(/^(\d+)\s+(.+?)\s+(\d+(?:\.\d+)?)\s*%$/);
      if (!row) continue;

      const taskNumber = Number(row[1]);
      const title = row[2].trim();
      const weight = Math.min(100, Number(row[3]));
      let dueDate = '';
      let dueTime = '17:00';
      let week = '';

      for (let j=i+1; j<Math.min(lines.length,i+10); j++) {
        if (/^(\d+)\s+(.+?)\s+(\d+(?:\.\d+)?)\s*%$/.test(lines[j])) break;
        const weekMatch = lines[j].match(/^Week:\s*(\d+)/i);
        if (weekMatch) week = weekMatch[1];
        if (/^Day:/i.test(lines[j])) dueDate = parseCurtinDay(lines,j,year) || dueDate;
        if (/^Time:/i.test(lines[j])) dueTime = parseOutlineTime(lines[j]);
      }

      out.push({
        title: title,
        type: classifyAssessment(title),
        weight: weight,
        dueDate: dueDate,
        dueTime: dueTime,
        taskNumber: taskNumber,
        week: week,
        source: 'curtin-assessment-schedule'
      });
    }
    return out;
  }

  detectAssessmentsFromText = function(text='') {
    const curtin = detectCurtinAssessmentSchedule(text);
    if (curtin.length) return curtin;
    return genericDetectAssessments(text);
  };
})();
