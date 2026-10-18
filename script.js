'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safe = v => esc(v).replace(/&lt;strong&gt;(.*?)&lt;\/strong&gt;/g, '<strong>$1</strong>');
const KEY = 'aura-demo-v2';
const seed = () => ({
  name: 'Akash', dark: null, nextId: 5,
  tasks: [
    { id: 1, t: 'Design landing page', c: 'Design', p: 'Low', d: true, due: '' },
    { id: 2, t: 'Write project proposal', c: 'Work', p: 'High', d: false, due: '' },
    { id: 3, t: 'Team meeting', c: 'Work', p: 'Med', d: false, due: '' },
    { id: 4, t: 'Review analytics', c: 'Study', p: 'Low', d: false, due: '' }
  ],
  projects: [{ n: 'Website redesign', v: 72 }, { n: 'Mobile app', v: 35 }, { n: 'Brand guidelines', v: 90 }],
  msgs: [
    { id: 1, from: 'Sarah', s: 'Homepage copy is ready for review.', read: false },
    { id: 2, from: 'Dev team', s: 'Staging build passed all checks.', read: false },
    { id: 3, from: 'Priya', s: 'Can we move Friday’s sync to 3 PM?', read: true }
  ],
  activity: [['✓', 'Completed <strong>“User Research”</strong>', 'Project · Website redesign', '2h ago'], ['▰', 'Updated <strong>“Website Redesign”</strong>', 'Project · Design team', '3h ago'], ['✉', 'New message from <strong>Sarah</strong>', 'Message · Team chat', '5h ago']]
});
function load() {
  try {
    const r = JSON.parse(localStorage.getItem(KEY));
    if (!r || typeof r !== 'object' || Array.isArray(r)) return seed();
    const d = seed(), a = k => Array.isArray(r[k]) ? r[k] : d[k];
    const tasks = a('tasks').filter(t => t && typeof t.t === 'string' && Number.isFinite(+t.id)).map(t => ({ id: +t.id, t: t.t.slice(0, 80), c: String(t.c || 'Work').slice(0, 20), p: ['High', 'Med', 'Low'].includes(t.p) ? t.p : 'Med', d: !!t.d, due: /^\d{4}-\d{2}-\d{2}$/.test(t.due) ? t.due : '' }));
    return {
      name: typeof r.name === 'string' && r.name.trim() ? r.name.trim().slice(0, 30) : d.name,
      dark: typeof r.dark === 'boolean' ? r.dark : null,
      nextId: Math.max(+r.nextId || 1, ...tasks.map(t => t.id + 1)), tasks,
      projects: a('projects').filter(p => p && typeof p.n === 'string').map(p => ({ n: p.n.slice(0, 40), v: Math.min(100, Math.max(0, +p.v || 0)) })),
      msgs: a('msgs').filter(m => m && typeof m.from === 'string').map(m => ({ id: +m.id || 0, from: m.from.slice(0, 40), s: String(m.s || '').slice(0, 200), read: !!m.read })),
      activity: a('activity').filter(x => Array.isArray(x) && x.length >= 4).map(x => x.slice(0, 4).map(String)).slice(0, 20)
    };
  } catch { return seed(); }
}
let S = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage unavailable */ } };

const toastEl = $('#toast'); let tt;
function toast(m) { toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('show'), 2800); }

// Theme
const mq = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const dark = S.dark ?? mq.matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const m = $('meta[name=theme-color]'); if (m) m.content = dark ? '#0B0D14' : '#F4F5F8';
  $('.theme-state').textContent = dark ? 'Dark' : 'Light';
  $('#themeToggle').setAttribute('aria-pressed', dark);
}
$('#themeToggle').addEventListener('click', () => {
  const root = document.documentElement; root.classList.add('theme-anim'); setTimeout(() => root.classList.remove('theme-anim'), 380);
  S.dark = root.dataset.theme !== 'dark'; save(); applyTheme();
});
mq.addEventListener?.('change', () => { if (S.dark === null) applyTheme(); });

// Header text from the real date
const now = new Date(), hr = now.getHours();
function head() {
  $('#today').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
  $('#greeting').textContent = `Good ${hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : 'evening'}, ${S.name}`;
  $('#year').textContent = now.getFullYear();
  $('.profile-mini strong').firstChild.textContent = `Hi, ${S.name}! `;
  $('.user-label').textContent = S.name;
  $('.user-avatar').textContent = S.name[0].toUpperCase();
}

// Tasks
let filter = 'All', view = 'Dashboard', query = '', prevView = null, editId = null;
const pc = p => ({ High: 'priority-high', Med: 'priority-medium', Low: 'priority-low' }[p] || 'priority-medium');
function taskRow(t, full) {
  return `<div class="task-row" data-id="${t.id}"><label class="task-check"><input type="checkbox" ${t.d ? 'checked' : ''} aria-label="Mark “${esc(t.t)}” complete"><span class="custom-check">✓</span></label>
  <span class="task-text ${t.d ? 'done' : ''}">${esc(t.t)}<small>${esc(t.c)}${t.due ? ' · due ' + new Date(t.due + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</small></span>
  ${t.d ? '<span class="task-tag tag-green">Done</span>' : `<span class="task-priority ${pc(t.p)}">${esc(t.p)}</span>`}
  ${full ? `<button class="row-edit" type="button" aria-label="Edit “${esc(t.t)}”">✎</button><button class="row-delete" type="button" aria-label="Delete “${esc(t.t)}”">×</button>` : ''}</div>`;
}
function renderTasks() {
  const full = view === 'Tasks', q = query.toLowerCase();
  let list = S.tasks.filter(t => (t.t + ' ' + t.c).toLowerCase().includes(q));
  if (full && filter !== 'All') list = list.filter(t => (filter === 'Done') === t.d);
  if (!full) list = list.slice(0, 5);
  $('#taskList').innerHTML = (full ? `<div class="chips" role="group" aria-label="Filter tasks">${['All', 'Open', 'Done'].map(f => `<button type="button" class="chip" data-f="${f}" aria-pressed="${f === filter}">${f}</button>`).join('')}</div>` : '') + list.map(t => taskRow(t, full)).join('');
  $('#taskEmpty').hidden = list.length > 0;
  $('#taskEmpty').textContent = q ? `No tasks match “${query}”.` : 'No tasks here yet. Add one to get started.';
  const open = S.tasks.filter(t => !t.d).length;
  $('#taskCount').textContent = S.tasks.length; $('#navCount').textContent = open;
  renderCalendar();
}
function logAct(i, txt) { S.activity.unshift([i, txt, 'Task · Just now', 'now']); S.activity = S.activity.slice(0, 20); }
$('#taskList').addEventListener('click', e => {
  const row = e.target.closest('.task-row'), chip = e.target.closest('.chip');
  if (chip) { filter = chip.dataset.f; return renderTasks(); }
  if (!row) return;
  const t = S.tasks.find(x => x.id === +row.dataset.id); if (!t) return;
  if (e.target.closest('.row-edit')) return openTask('', t);
  if (e.target.closest('.row-delete')) { S.tasks = S.tasks.filter(x => x !== t); logAct('✕', `Deleted <strong>“${t.t}”</strong>`); toast('Task deleted.'); }
  else {
    if (e.target.closest('.task-check')) { if (!e.target.matches('input')) return; t.d = e.target.checked; } else t.d = !t.d;
    logAct('✓', `${t.d ? 'Completed' : 'Reopened'} <strong>“${t.t}”</strong>`); toast(t.d ? 'Task completed.' : 'Task moved back to open.');
  }
  save(); renderTasks(); renderActivity();
});
const dlg = $('#taskDialog');
function openTask(dueIso = '', t = null) {
  editId = t ? t.id : null;
  $('#taskName').value = t ? t.t : ''; $('#taskDue').value = t ? t.due : dueIso; $('#taskErr').textContent = '';
  $('#taskCategory').value = t ? t.c : 'Work'; $('#taskPriority').value = t ? t.p : 'Med';
  $('#dlgTitle').textContent = t ? 'Edit task' : 'Create a task'; $('.dialog-kicker').textContent = t ? 'EDIT TASK' : 'NEW TASK';
  if (dlg.showModal) { dlg.showModal(); $('#taskName').focus(); } else toast('Your browser does not support dialogs. Please update it.');
}
['#addTaskTop', '#addTaskSide'].forEach(s => $(s).addEventListener('click', () => openTask()));
$$('[data-close]', dlg).forEach(b => b.addEventListener('click', () => dlg.close()));
dlg.addEventListener('click', e => { if (e.target !== dlg) return; const r = dlg.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close(); });
$('#taskForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#taskName').value.trim().replace(/\s+/g, ' ');
  const err = name.length < 2 ? 'Enter a task name of at least 2 characters.' : S.tasks.some(t => t.id !== editId && t.t.toLowerCase() === name.toLowerCase()) ? 'A task with this name already exists.' : '';
  $('#taskErr').textContent = err;
  if (err) return $('#taskName').focus();
  const vals = { t: name, c: $('#taskCategory').value, p: $('#taskPriority').value, due: $('#taskDue').value }, wasEdit = editId !== null;
  if (wasEdit) Object.assign(S.tasks.find(x => x.id === editId) || {}, vals);
  else { S.tasks.unshift({ id: S.nextId++, d: false, ...vals }); logAct('✓', `Added <strong>“${name}”</strong>`); }
  editId = null; save(); dlg.close(); renderTasks(); renderActivity(); toast(wasEdit ? 'Task updated.' : 'Task added.');
});

// Activity
function renderActivity() {
  const a = S.activity.slice(0, 5);
  $('#activityList').innerHTML = a.length ? a.map(r => `<div class="activity-row"><span class="activity-icon activity-done">${esc(r[0])}</span><div><p>${safe(r[1])}</p><small>${esc(r[2])}</small></div><time>${esc(r[3])}</time></div>`).join('') : '<p class="empty-search">No recent activity.</p>';
}
$('#clearActivity').addEventListener('click', () => { S.activity = []; save(); renderActivity(); toast('Activity cleared.'); });

// Calendar (real dates; dots mark task due dates)
let cal = new Date(now.getFullYear(), now.getMonth(), 1), selDay = '';
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
function renderCalendar() {
  const grid = $('#calendarGrid'), y = cal.getFullYear(), m = cal.getMonth();
  const first = (new Date(y, m, 1).getDay() + 6) % 7, dim = new Date(y, m + 1, 0).getDate();
  let html = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => `<span class="day-name">${d}</span>`).join('');
  for (let i = 0; i < first; i++) html += '<span></span>';
  for (let d = 1; d <= dim; d++) {
    const k = iso(y, m, d), ev = S.tasks.some(t => t.due === k && !t.d), td = k === iso(now.getFullYear(), now.getMonth(), now.getDate());
    html += `<button type="button" class="calendar-day${ev ? ' has-event' : ''}${td ? ' today' : ''}${k === selDay ? ' selected' : ''}" aria-pressed="${k === selDay}" data-d="${k}" aria-label="${k}${ev ? ', task due' : ''}">${d}</button>`;
  }
  grid.innerHTML = html;
  $('#calTitle').textContent = cal.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
$('#calendarGrid').addEventListener('click', e => {
  const b = e.target.closest('.calendar-day'); if (!b) return;
  const due = S.tasks.filter(t => t.due === b.dataset.d);
  $('#dayInfo').textContent = due.length ? `${b.dataset.d}: ${due.map(t => t.t).join(', ')}` : `${b.dataset.d}: nothing due.`;
  selDay = b.dataset.d; $('#addForDay').hidden = false; renderCalendar(); $('.calendar-day.selected')?.focus();
});
$('#addForDay').addEventListener('click', () => openTask(selDay));
$('#prevMonth').addEventListener('click', () => { cal.setMonth(cal.getMonth() - 1); renderCalendar(); });
$('#nextMonth').addEventListener('click', () => { cal.setMonth(cal.getMonth() + 1); renderCalendar(); });

// Chart period
const DATA = { 'This week': [38, 55, 80, 68, 90, 90, 94], 'Last week': [30, 45, 52, 60, 66, 70, 82] };
let period = 'This week';
function renderChart() {
  const v = DATA[period], pts = v.map((n, i) => [10 + i * 102, Math.round(203 - n * 1.88)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p.join(' ')).join(' ');
  $('.chart-line').setAttribute('d', line);
  $('.chart-area').setAttribute('d', `${line} L622 203 L10 203 Z`);
  $$('.chart-points circle').forEach((c, i) => { c.setAttribute('cy', pts[i][1]); c.innerHTML = `<title>${v[i]}%</title>`; });
  $('.chart-tooltip').setAttribute('display', 'none');
  const avg = Math.round(v.reduce((a, b) => a + b) / v.length), other = DATA[period === 'This week' ? 'Last week' : 'This week'];
  const oAvg = Math.round(other.reduce((a, b) => a + b) / other.length);
  $('#chartNoteText').textContent = `Average score ${avg}% (sample data)`;
  $('#chartDelta').innerHTML = `${avg - oAvg >= 0 ? '+' : ''}${avg - oAvg} pts <small>vs. ${period === 'This week' ? 'last week' : 'this week'}</small>`;
  $('#periodSelect').innerHTML = `${period} <span>⌄</span>`;
}
$('#periodSelect').addEventListener('click', () => { period = period === 'This week' ? 'Last week' : 'This week'; renderChart(); });
$('#inspireBtn').addEventListener('click', () => toast(['Small steps add up.', 'Done is better than perfect.', 'Consistency beats intensity.'][Math.floor(Math.random() * 3)]));

// Views
const SHOW = { Dashboard: null, Tasks: ['.todo-panel'], Calendar: ['.calendar-panel'], Analytics: ['.stat-grid', '.productivity-panel'], Activity: ['.activity-panel'] };
const EXTRA = { Projects: projectsView, Messages: messagesView, Settings: settingsView };
function setView(v) {
  view = v; $('#pageTitle').textContent = v;
  $$('.nav-item[data-view]').forEach(i => { const on = i.dataset.view === v; i.classList.toggle('active', on); if (on) i.setAttribute('aria-current', 'page'); else i.removeAttribute('aria-current'); });
  const extra = v in EXTRA, show = SHOW[v];
  $$('.stat-grid, .dashboard-grid > *, .welcome-row').forEach(el => { el.hidden = extra || (show !== null && !show.some(s => el.matches(s)) && !(el.matches('.welcome-row') && v === 'Dashboard')); });
  $('.dashboard-grid').hidden = extra; $('.dashboard-grid').classList.toggle('single', show !== null && !extra);
  $('#viewExtra').hidden = !extra; if (extra) EXTRA[v]();
  setDrawer(false); syncUnread(); renderTasks();
  $('#main').focus({ preventScroll: true }); window.scrollTo({ top: 0 });
}
$$('[data-view]').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
function setDrawer(o) {
  $('#sidebar').classList.toggle('open', o); $('#menuToggle').setAttribute('aria-expanded', o); document.body.classList.toggle('drawer-open', o);
  $('#sidebar').inert = innerWidth <= 900 && !o;
}
$('#menuToggle').addEventListener('click', () => setDrawer(!$('#sidebar').classList.contains('open')));
$('#drawerClose').addEventListener('click', () => { setDrawer(false); $('#menuToggle').focus(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#sidebar').classList.contains('open')) { setDrawer(false); $('#menuToggle').focus(); } });
addEventListener('resize', () => setDrawer($('#sidebar').classList.contains('open') && innerWidth <= 900));
document.addEventListener('click', e => { if (innerWidth <= 900 && !e.target.closest('#sidebar, #menuToggle')) setDrawer(false); });
const syncUnread = () => { $('.unread-dot').hidden = !S.msgs.some(m => !m.read); };
$('#notifyBtn').addEventListener('click', () => setView('Messages'));
$('#userButton').addEventListener('click', () => setView('Settings'));

function projectsView() {
  $('#viewExtra').innerHTML = `<div class="panel"><div class="panel-heading"><div><h2>Projects</h2><p>Drag a slider to update progress. Saved in this browser.</p></div></div><div class="proj-list">${S.projects.map((p, i) => `<div class="proj"><label for="pr${i}">${esc(p.n)}</label><input type="range" id="pr${i}" data-i="${i}" min="0" max="100" value="${p.v}"><output>${p.v}%</output></div>`).join('')}</div></div>`;
}
function messagesView() {
  const unread = S.msgs.filter(m => !m.read).length;
  $('#viewExtra').innerHTML = `<div class="panel"><div class="panel-heading"><div><h2>Messages <span class="heading-count">${unread} unread</span></h2><p>Sample inbox. Select a message to mark it read.</p></div></div><div class="activity-list">${S.msgs.length ? S.msgs.map(m => `<button type="button" class="msg ${m.read ? '' : 'unread'}" data-id="${m.id}"><strong>${esc(m.from)}</strong><span>${esc(m.s)}</span></button>`).join('') : '<p class="empty-search">Inbox is empty.</p>'}</div></div>
  <div class="panel enquiry"><div class="panel-heading"><div><h2>Contact Mr Akash</h2><p>Want a dashboard like this? Send an enquiry.</p></div></div>
  <form id="enqForm" novalidate><div class="hp" aria-hidden="true"><label>Company <input name="company" tabindex="-1" autocomplete="off"></label></div>
  <label class="form-label" for="enName">Name</label><input class="form-input" id="enName" name="name" maxlength="80" autocomplete="name" aria-describedby="enNameE"><p class="form-error" id="enNameE"></p>
  <label class="form-label" for="enEmail">Email</label><input class="form-input" id="enEmail" name="email" type="email" maxlength="120" autocomplete="email" aria-describedby="enEmailE"><p class="form-error" id="enEmailE"></p>
  <label class="form-label" for="enMsg">Message</label><textarea class="form-input" id="enMsg" name="message" rows="4" maxlength="1500" aria-describedby="enMsgE"></textarea><p class="form-error" id="enMsgE"></p>
  <button class="button button-primary" id="enBtn" type="submit">Send enquiry</button><p class="form-status" id="enStatus" role="status"></p></form></div>`;
}
function settingsView() {
  $('#viewExtra').innerHTML = `<div class="panel"><div class="panel-heading"><div><h2>Settings</h2><p>Stored only in this browser.</p></div></div>
  <label class="form-label" for="setName">Display name</label><input class="form-input narrow" id="setName" maxlength="30" value="${esc(S.name)}"><p class="form-error" id="setErr" role="alert"></p>
  <div class="dialog-actions left"><button class="button button-primary" id="saveName" type="button">Save name</button><button class="button button-quiet" id="expBtn2" type="button">Export tasks (CSV)</button><button class="button button-quiet" id="resetBtn2" type="button">Reset demo data</button></div></div>`;
}
$('#viewExtra').addEventListener('input', e => {
  if (e.target.matches('input[type=range]')) { S.projects[+e.target.dataset.i].v = +e.target.value; e.target.nextElementSibling.textContent = e.target.value + '%'; save(); }
});
$('#viewExtra').addEventListener('click', e => {
  const m = e.target.closest('.msg');
  if (m) { const x = S.msgs.find(q => q.id === +m.dataset.id); if (x) { x.read = true; save(); syncUnread(); messagesView(); } }
  if (e.target.id === 'saveName') {
    const n = $('#setName').value.trim();
    if (n.length < 2) return void ($('#setErr').textContent = 'Enter at least 2 characters.');
    S.name = n; save(); head(); toast('Name saved.');
  }
  if (e.target.id === 'expBtn2') exportCsv();
  if (e.target.id === 'resetBtn2') resetDemo();
});
$('#viewExtra').addEventListener('submit', async e => {
  if (e.target.id !== 'enqForm') return;
  e.preventDefault();
  const f = e.target, v = Object.fromEntries(new FormData(f)), st = $('#enStatus'), btn = $('#enBtn');
  const er = { name: v.name.trim().length < 2 ? 'Enter your name.' : '', email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim()) ? '' : 'Enter a valid email address.', message: v.message.trim().length < 10 ? 'Write at least 10 characters.' : '' };
  $('#enNameE').textContent = er.name; $('#enEmailE').textContent = er.email; $('#enMsgE').textContent = er.message;
  if (er.name || er.email || er.message) return void (st.textContent = 'Please fix the highlighted fields.');
  btn.disabled = true; btn.textContent = 'Sending…'; st.textContent = '';
  try {
    const r = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Something went wrong.');
    st.textContent = j.mode === 'live' ? 'Thanks. Your enquiry was sent.' : 'Demo mode: your message was validated but not delivered, because email is not configured.';
    f.reset();
  } catch (err) {
    st.textContent = err instanceof TypeError ? 'Could not reach the server. The enquiry form works once the site is deployed with its API.' : err.message;
  } finally { btn.disabled = false; btn.textContent = 'Send enquiry'; }
});

// Search
const sb = $('.search-box'), si = $('#searchInput');
si.addEventListener('input', () => { query = si.value.trim(); if (query && view !== 'Tasks') { prevView = view; setView('Tasks'); } else if (!query && prevView) { const v = prevView; prevView = null; setView(v); } else renderTasks(); });
si.addEventListener('keydown', e => { if (e.key === 'Escape') { si.value = ''; query = ''; sb.classList.remove('search-open'); si.blur(); renderTasks(); } });
sb.addEventListener('click', () => { if (innerWidth <= 620) { sb.classList.add('search-open'); si.focus(); } });
document.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); sb.classList.add('search-open'); si.focus(); } });

// Export + reset
function exportCsv() {
  const safe = v => { v = String(v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return `"${v.replaceAll('"', '""')}"`; };
  const rows = [['Task', 'Category', 'Priority', 'Due', 'Status'], ...S.tasks.map(t => [t.t, t.c, t.p, t.due, t.d ? 'Complete' : 'Open'])];
  const url = URL.createObjectURL(new Blob(['\ufeff', rows.map(r => r.map(safe).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'aura-tasks.csv' });
  document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast('Tasks exported.');
}
$('#exportBtn').addEventListener('click', exportCsv);
function resetDemo() {
  if (!confirm('Reset all demo data in this browser?')) return;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  S = seed(); filter = 'All'; query = ''; si.value = ''; head(); applyTheme(); renderActivity(); renderChart(); setView('Dashboard'); toast('Demo data reset.');
}
$('#resetDemo').addEventListener('click', resetDemo);

head(); applyTheme(); renderActivity(); renderChart(); setView('Dashboard');
