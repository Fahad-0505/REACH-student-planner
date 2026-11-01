
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
      <div class="card" style="margin-top:16px"><h2>Upcoming unit deadlines</h2><div class="sub">Dates confirmed from unit outlines and assignments.</div>${upcoming.length ? `<div class="deadline-list" sty