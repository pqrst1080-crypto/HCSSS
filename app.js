(function(){
const KEYS = {
  execom:'hcs:execom', subpanels:'hcs:subpanels',
  eventsPresent:'hcs:events:present', eventsUpcoming:'hcs:events:upcoming',
  boardStudents:'hcs:board:students', boardDepartments:'hcs:board:departments',
  marketplace:'hcs:marketplace', theme:'hcs:theme',
  heritage:'hcs:heritage', session:'hcs:session'
};
const SHARED = true;

/* ---------------- ADMIN AUTH ----------------
   The password is never stored in plain text here — only a salted SHA-256
   hash is embedded, and the same hash is recomputed from whatever the
   visitor types in before comparing. This keeps the raw password out of
   the page source, but note this is still a static, front-end-only site:
   the hash itself is visible to anyone who reads this file, and a short
   password can in principle be brute-forced offline from that hash. Treat
   this as a light deterrent for casual visitors, not real backend security. */
const AUTH_SALT = 'hcs-cet-2026-salt';
const ADMIN_HASH = '328c52877213e92a980c882199db332e7ce99dd640b81312e8f602da92645f06';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

async function sha256Hex(str){
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function verifyAdmin(username, password){
  const combined = AUTH_SALT + ':' + (username||'').trim().toLowerCase() + ':' + (password||'');
  const hash = await sha256Hex(combined);
  return hash === ADMIN_HASH;
}
let isAdmin = false;

/* ---------------- STORAGE ADAPTER ----------------
   window.storage only exists inside Claude's own artifact preview. Once
   this site is downloaded and opened as a normal webpage (or hosted on
   your own domain), that API is not present. This adapter falls back to
   the browser's localStorage so the site still works standalone — but
   note localStorage is per-browser only. Inside Claude's preview, data
   is shared across everyone viewing the artifact; once hosted on your
   own domain without a real backend, each visitor's edits only save on
   their own device/browser. A shared, multi-device "everyone sees the
   same execom/leaderboard" experience after hosting would need a real
   backend database — ask if you'd like help wiring one up. */
const hasClaudeStorage = (typeof window!=='undefined' && !!window.storage
  && typeof window.storage.get==='function' && typeof window.storage.set==='function');

const store = {
  async get(key, shared){
    if(hasClaudeStorage){
      try{ return await window.storage.get(key, shared); }
      catch(e){ return null; }
    }
    try{
      const v = localStorage.getItem(key);
      return v!==null ? {key, value:v, shared} : null;
    }catch(e){ return null; }
  },
  async set(key, value, shared){
    if(hasClaudeStorage){
      try{ return await window.storage.set(key, value, shared); }
      catch(e){ console.error('Claude storage set failed', key, e); return null; }
    }
    try{
      localStorage.setItem(key, value);
      return {key, value, shared};
    }catch(e){ console.error('localStorage set failed', key, e); return null; }
  }
};

const DEFAULTS = {
  execom: [
    {id:'c1',name:'To be announced',position:'Chairperson',dept:'—',year:'—',photo:''},
    {id:'c2',name:'To be announced',position:'Vice-Chairperson I',dept:'—',year:'—',photo:''},
    {id:'c3',name:'To be announced',position:'Vice-Chairperson II',dept:'—',year:'—',photo:''},
    {id:'c4',name:'To be announced',position:'General Secretary',dept:'—',year:'—',photo:''},
    {id:'c5',name:'To be announced',position:'Joint Secretary',dept:'—',year:'—',photo:''},
    {id:'c6',name:'To be announced',position:'Treasurer',dept:'—',year:'—',photo:''},
    {id:'c7',name:'To be announced',position:'Event Coordinator — Exhibitions',dept:'—',year:'—',photo:''},
    {id:'c8',name:'To be announced',position:'Event Coordinator — Auctions',dept:'—',year:'—',photo:''},
    {id:'c9',name:'To be announced',position:'Web & Technology Lead',dept:'—',year:'—',photo:''},
    {id:'c10',name:'To be announced',position:'Publicity & Media Lead',dept:'—',year:'—',photo:''},
    {id:'c11',name:'To be announced',position:'Workshop & Outreach Coordinator',dept:'—',year:'—',photo:''},
    {id:'c12',name:'To be announced',position:'Faculty Coordinator',dept:'—',year:'—',photo:''}
  ],
  subpanels: [
    {id:'p1',name:'Web & Technology Panel',members:[
      {id:'m1',name:'Vacant',role:'Frontend Volunteer'},
      {id:'m2',name:'Vacant',role:'Listings Moderator'}
    ]},
    {id:'p2',name:'Publicity & Media Panel',members:[
      {id:'m3',name:'Vacant',role:'Social Media'},
      {id:'m4',name:'Vacant',role:'Design & Posters'}
    ]},
    {id:'p3',name:'Events & Exhibitions Panel',members:[
      {id:'m5',name:'Vacant',role:'Logistics'},
      {id:'m6',name:'Vacant',role:'Judging Desk'}
    ]},
    {id:'p4',name:'Outreach Panel (Department Leads)',members:[
      {id:'m7',name:'Vacant',role:'CSE Lead'},
      {id:'m8',name:'Vacant',role:'ECE Lead'},
      {id:'m9',name:'Vacant',role:'EEE Lead'},
      {id:'m10',name:'Vacant',role:'Mechanical Lead'},
      {id:'m11',name:'Vacant',role:'Civil Lead'}
    ]}
  ],
  eventsPresent: [
    {id:'e1',title:'Website Beta Launch & Orientation Talk',date:'Month 1',tag:'Launch',desc:'Club launch, member recruitment drive and an orientation talk on numismatics.'}
  ],
  eventsUpcoming: [
    {id:'e2',title:'Coin Grading & Preservation Workshop',date:'Month 2',tag:'Workshop',desc:'Hands-on session on grading, cleaning and preserving coins and notes.'},
    {id:'e3',title:'Inter-Department Mini Fair',date:'Month 3',tag:'Fair',desc:'Trial auction of low-value items to test the platform workflow.'},
    {id:'e4',title:'Flagship Annual Exhibition & Auction',date:'Month 5',tag:'Exhibition',desc:'Inter-department competition with judged awards across coins, currency and antiques.'}
  ],
  boardStudents: [
    {id:'s1',name:'Add your first student',dept:'CSE',points:0}
  ],
  boardDepartments: [
    {id:'d1',name:'CSE',points:0},
    {id:'d2',name:'ECE',points:0},
    {id:'d3',name:'EEE',points:0},
    {id:'d4',name:'Mechanical',points:0},
    {id:'d5',name:'Civil',points:0}
  ],
  heritage: [
    {id:'h1',year:'1939',title:'A College is Founded',desc:'Established under Maharajah Sree Chithira Thirunal Balarama Varma as the first engineering college in the princely state of Travancore, opening with 21 students each in Civil, Mechanical and Electrical Engineering.',photo:''},
    {id:'h2',year:'1957',title:'University of Kerala',desc:'Having begun as a constituent college of the University of Travancore, CET came under the newly formed University of Kerala as academic administration in the state was reorganised.',photo:''},
    {id:'h3',year:'1960',title:'A New Campus',desc:'The college moved to its present sprawling campus at Sreekaryam, the home it has grown into ever since.',photo:''},
    {id:'h4',year:'1980s',title:'Postgraduate Growth',desc:'New postgraduate programmes, including the MCA department, broadened the college beyond its founding undergraduate branches.',photo:''},
    {id:'h5',year:'2015',title:'KTU Affiliation',desc:'CET became affiliated to the newly established APJ Abdul Kalam Technological University, marking a new chapter in its academic governance.',photo:''},
    {id:'h6',year:'2020s',title:'National Recognition',desc:'Recognised in national rankings across engineering and architecture, with growing research activity in computing and space technology.',photo:''},
    {id:'h7',year:'2026',title:'Heritage & Collectibles Society Founded',desc:'HCS is chartered as a new student chapter, bringing coin, currency, stamp and antique collectors on campus together for the first time.',photo:''}
  ],
  marketplace: [
    {id:'mk1',name:'Coins',icon:'🪙',desc:'Ancient, colonial and modern coins listed by student collectors.',link:''},
    {id:'mk2',name:'Currency Notes',icon:'💴',desc:'Rare and vintage currency notes for exchange or sale.',link:''},
    {id:'mk3',name:'Stamps',icon:'📮',desc:'Postal stamps and philately collections from across eras.',link:''},
    {id:'mk4',name:'Antiques & Memorabilia',icon:'🏺',desc:'Vintage artefacts, memorabilia and heritage pieces.',link:''},
    {id:'mk5',name:'Auctions',icon:'🔨',desc:'Live and online auctions for higher-value or rare items.',link:''},
    {id:'mk6',name:'Exchange Counter',icon:'🤝',desc:'Peer-to-peer coin and currency exchange, in person or online.',link:''}
  ]
};

let editing = false;
let state = {};

async function loadKey(key, fallback){
  try{
    const res = await store.get(key, SHARED);
    if(res && res.value){ return JSON.parse(res.value); }
  }catch(e){ /* not found yet */ }
  return JSON.parse(JSON.stringify(fallback));
}
async function saveKey(key, value){
  try{
    await store.set(key, JSON.stringify(value), SHARED);
    flashSaved();
  }catch(e){ console.error('Save failed', key, e); }
}
let saveTimer=null;
function flashSaved(){
  const el = document.getElementById('saveIndicator');
  if(!el) return;
  el.classList.add('show');
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>el.classList.remove('show'),1200);
}
function uid(prefix){return prefix+'_'+Math.random().toString(36).slice(2,9);}
function initials(name){
  if(!name) return '?';
  return name.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
}
function escapeHtml(s){
  return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ---------------- THEME ---------------- */
function applyLogoTheme(theme){
  document.querySelectorAll('img[data-src-light][data-src-dark]').forEach(img=>{
    const src = theme==='dark' ? img.dataset.srcDark : img.dataset.srcLight;
    if(src && img.getAttribute('src')!==src) img.setAttribute('src', src);
  });
}
async function initTheme(){
  const root=document.documentElement;
  let theme='light';
  try{
    const res = await store.get(KEYS.theme, false);
    if(res && res.value) theme = res.value;
    else if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme='dark';
  }catch(e){
    if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme='dark';
  }
  root.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
  applyLogoTheme(theme);
}
function updateThemeIcon(theme){
  const btn=document.getElementById('themeToggle');
  if(btn) btn.textContent = theme==='dark' ? '☀' : '☾';
}
function toggleTheme(){
  const root=document.documentElement;
  const next = root.getAttribute('data-theme')==='dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  updateThemeIcon(next);
  applyLogoTheme(next);
  store.set(KEYS.theme, next, false).catch(()=>{});
}

/* ---------------- NAV ---------------- */
function initNav(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav.links a').forEach(a=>{
    const href=a.getAttribute('href');
    if(href===path || (path===''&&href==='index.html')) a.classList.add('active');
  });
  const burger=document.getElementById('navBurger');
  const links=document.querySelector('nav.links');
  if(burger && links){
    burger.addEventListener('click',()=>links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>links.classList.remove('open')));
  }
  const themeBtn=document.getElementById('themeToggle');
  if(themeBtn) themeBtn.addEventListener('click', toggleTheme);
}

/* ---------------- AUTH / SIGN-IN ---------------- */
function setEditingUI(){
  document.body.classList.toggle('editing', editing);
  const editBtn=document.getElementById('editToggle');
  if(editBtn){
    editBtn.textContent = editing?'Edit Mode: On':'Edit Mode: Off';
    editBtn.classList.toggle('on', editing);
  }
}
function setAdminUI(admin){
  isAdmin = admin;
  const signInBtn=document.getElementById('signInBtn');
  const authPanel=document.getElementById('authPanel');
  const editBtn=document.getElementById('editToggle');
  const signOutBtn=document.getElementById('signOutBtn');
  const badge=document.getElementById('adminBadge');
  if(signInBtn) signInBtn.hidden = admin;
  if(authPanel) authPanel.hidden = true;
  if(editBtn) editBtn.hidden = !admin;
  if(signOutBtn) signOutBtn.hidden = !admin;
  if(badge) badge.hidden = !admin;
  if(!admin){ editing = false; }
  setEditingUI();
  renderCurrentPage();
}
async function restoreSession(){
  try{
    const res = await store.get(KEYS.session, false);
    if(res && res.value){
      const sess = JSON.parse(res.value);
      if(sess && sess.role==='admin' && (Date.now()-sess.ts) < SESSION_TTL_MS){
        setAdminUI(true);
        return;
      }
    }
  }catch(e){ /* no session yet */ }
  setAdminUI(false);
}
function initAuth(){
  const signInBtn=document.getElementById('signInBtn');
  const authPanel=document.getElementById('authPanel');
  const tabs=document.querySelectorAll('.auth-tab');
  const continueBtn=document.getElementById('continueStudentBtn');
  const loginBtn=document.getElementById('adminLoginBtn');
  const signOutBtn=document.getElementById('signOutBtn');
  const editBtn=document.getElementById('editToggle');
  const errorEl=document.getElementById('authError');
  const userInp=document.getElementById('adminUser');
  const passInp=document.getElementById('adminPass');

  if(signInBtn && authPanel){
    signInBtn.addEventListener('click',()=>{ authPanel.hidden = !authPanel.hidden; });
    document.addEventListener('click',(e)=>{
      if(!authPanel.hidden && !authPanel.contains(e.target) && e.target!==signInBtn){
        authPanel.hidden = true;
      }
    });
  }
  tabs.forEach(tab=>{
    tab.addEventListener('click',()=>{
      tabs.forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.auth-tab-panel').forEach(p=>p.classList.remove('active'));
      document.getElementById('auth'+(tab.dataset.role==='admin'?'Admin':'Student')).classList.add('active');
      if(errorEl) errorEl.hidden = true;
    });
  });
  if(continueBtn) continueBtn.addEventListener('click',()=>{ authPanel.hidden = true; });
  if(loginBtn){
    loginBtn.addEventListener('click', async ()=>{
      loginBtn.disabled = true;
      try{
        const ok = await verifyAdmin(userInp.value, passInp.value);
        if(ok){
          passInp.value='';
          if(errorEl) errorEl.hidden = true;
          setAdminUI(true); // grant access immediately, don't block on persistence
          store.set(KEYS.session, JSON.stringify({role:'admin', ts:Date.now()}), false)
            .catch(e=>console.error('Session save failed', e));
        }else{
          if(errorEl){ errorEl.textContent='Incorrect username or password.'; errorEl.hidden = false; }
        }
      }catch(e){
        console.error('Login error', e);
        if(errorEl){ errorEl.textContent='Sign-in failed unexpectedly. Check the browser console for details.'; errorEl.hidden = false; }
      }finally{
        loginBtn.disabled = false;
      }
    });
    passInp.addEventListener('keydown', e=>{ if(e.key==='Enter') loginBtn.click(); });
  }
  if(signOutBtn){
    signOutBtn.addEventListener('click', async ()=>{
      setAdminUI(false);
      store.set(KEYS.session, JSON.stringify({role:'none', ts:0}), false)
        .catch(e=>console.error('Session clear failed', e));
    });
  }
  if(editBtn){
    editBtn.addEventListener('click',()=>{
      if(!isAdmin) return;
      editing=!editing;
      setEditingUI();
      renderCurrentPage();
    });
  }
}

/* ---------------- EXECOM ---------------- */
function renderExecom(){
  const wrap = document.getElementById('execomGrid');
  if(!wrap) return;
  wrap.innerHTML='';
  state.execom.forEach((m,i)=>{
    const card=document.createElement('div');
    card.className='specimen';
    card.innerHTML=`
      <button class="card-remove" title="Remove">✕</button>
      <div class="catalog-no">Member No. ${String(i+1).padStart(3,'0')}</div>
      <div class="photo-frame">${m.photo?`<img src="${escapeHtml(m.photo)}" alt="">`:initials(m.name)}</div>
      <input class="name-field" data-f="name" value="${escapeHtml(m.name)}" ${editing?'':'readonly'}>
      <div class="leader-row"><span class="lab">Position</span><input class="editable-field" data-f="position" value="${escapeHtml(m.position)}" ${editing?'':'readonly'}></div>
      <div class="leader-row"><span class="lab">Dept</span><input class="editable-field" data-f="dept" value="${escapeHtml(m.dept)}" ${editing?'':'readonly'}></div>
      <div class="leader-row"><span class="lab">Year</span><input class="editable-field" data-f="year" value="${escapeHtml(m.year)}" ${editing?'':'readonly'}></div>
      <div class="leader-row"><span class="lab">Photo URL</span><input class="editable-field" data-f="photo" placeholder="paste image link" value="${escapeHtml(m.photo)}" ${editing?'':'readonly'}></div>
    `;
    card.querySelectorAll('input').forEach(inp=>{
      inp.addEventListener('change',()=>{
        m[inp.dataset.f]=inp.value;
        saveKey(KEYS.execom, state.execom);
        renderExecom();
      });
    });
    card.querySelector('.card-remove').addEventListener('click',()=>{
      state.execom.splice(i,1);
      saveKey(KEYS.execom, state.execom);
      renderExecom();
    });
    wrap.appendChild(card);
  });
  const addCard=document.createElement('button');
  addCard.className='add-card';
  addCard.textContent='+ Add Execom Member';
  addCard.addEventListener('click',()=>{
    state.execom.push({id:uid('c'),name:'New Member',position:'Position',dept:'Dept',year:'Year',photo:''});
    saveKey(KEYS.execom, state.execom);
    renderExecom();
  });
  wrap.appendChild(addCard);
}

/* ---------------- SUBPANELS ---------------- */
function renderPanels(){
  const wrap=document.getElementById('panelsWrap');
  if(!wrap) return;
  wrap.innerHTML='';
  state.subpanels.forEach((panel,pi)=>{
    const block=document.createElement('div');
    block.className='panel-block';
    block.innerHTML=`
      <div class="panel-head">
        <input class="panel-title-field" value="${escapeHtml(panel.name)}" ${editing?'':'readonly'} data-panel-name>
        <button class="card-remove" style="position:static;${editing?'display:block':'display:none'}" data-remove-panel>✕ Remove Panel</button>
      </div>
      <div class="panel-members"></div>
      <button class="add-row-btn" data-add-member>+ Add Member</button>
    `;
    const nameInput=block.querySelector('[data-panel-name]');
    nameInput.addEventListener('change',()=>{
      panel.name=nameInput.value;
      saveKey(KEYS.subpanels,state.subpanels);
    });
    block.querySelector('[data-remove-panel]').addEventListener('click',()=>{
      state.subpanels.splice(pi,1);
      saveKey(KEYS.subpanels,state.subpanels);
      renderPanels();
    });
    const membersWrap=block.querySelector('.panel-members');
    panel.members.forEach((mem,mi)=>{
      const row=document.createElement('div');
      row.className='pm-row';
      row.innerHTML=`
        <div class="photo-frame">${initials(mem.name)}</div>
        <div class="pm-info">
          <input class="pm-name" value="${escapeHtml(mem.name)}" data-f="name" ${editing?'':'readonly'}>
          <input class="pm-role" value="${escapeHtml(mem.role)}" data-f="role" ${editing?'':'readonly'}>
        </div>
        <button class="pm-remove">✕</button>
      `;
      row.querySelectorAll('input').forEach(inp=>{
        inp.addEventListener('change',()=>{
          mem[inp.dataset.f]=inp.value;
          saveKey(KEYS.subpanels,state.subpanels);
        });
      });
      row.querySelector('.pm-remove').addEventListener('click',()=>{
        panel.members.splice(mi,1);
        saveKey(KEYS.subpanels,state.subpanels);
        renderPanels();
      });
      membersWrap.appendChild(row);
    });
    block.querySelector('[data-add-member]').addEventListener('click',()=>{
      panel.members.push({id:uid('m'),name:'New Member',role:'Role'});
      saveKey(KEYS.subpanels,state.subpanels);
      renderPanels();
    });
    wrap.appendChild(block);
  });
}

/* ---------------- EVENTS ---------------- */
function renderEvents(listKey, wrapId){
  const wrap=document.getElementById(wrapId);
  if(!wrap) return;
  wrap.innerHTML='';
  state[listKey].forEach((ev,i)=>{
    const card=document.createElement('div');
    card.className='event-card';
    card.innerHTML=`
      <div class="event-date"><input value="${escapeHtml(ev.date)}" data-f="date" ${editing?'':'readonly'} style="text-align:center;font-family:var(--mono);color:var(--oxblood);"></div>
      <div class="event-body">
        <input class="event-tag" style="width:auto;display:inline-block;" value="${escapeHtml(ev.tag)}" data-f="tag" ${editing?'':'readonly'}>
        <input class="event-title" style="font-family:var(--serif-display);font-size:1.1rem;" value="${escapeHtml(ev.title)}" data-f="title" ${editing?'':'readonly'}>
        <textarea class="event-desc" data-f="desc" ${editing?'':'readonly'}>${escapeHtml(ev.desc)}</textarea>
      </div>
      <button class="card-remove" style="position:static;${editing?'':'display:none'}">✕</button>
    `;
    card.querySelectorAll('input,textarea').forEach(inp=>{
      inp.addEventListener('change',()=>{
        ev[inp.dataset.f]=inp.value;
        saveKey(KEYS[listKey], state[listKey]);
      });
    });
    card.querySelector('.card-remove').addEventListener('click',()=>{
      state[listKey].splice(i,1);
      saveKey(KEYS[listKey], state[listKey]);
      renderEvents(listKey,wrapId);
    });
    wrap.appendChild(card);
  });
}

/* ---------------- BOARDS ---------------- */
function renderStudentBoard(){
  const tbody=document.querySelector('#studentBoard tbody');
  if(!tbody) return;
  const sorted=[...state.boardStudents].sort((a,b)=>b.points-a.points);
  tbody.innerHTML='';
  sorted.forEach((row,i)=>{
    const realIndex=state.boardStudents.indexOf(row);
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td class="rank" data-label="Rank">${i+1}</td>
      <td data-label="Student"><input value="${escapeHtml(row.name)}" data-f="name" ${editing?'':'readonly'}></td>
      <td data-label="Department"><input value="${escapeHtml(row.dept)}" data-f="dept" ${editing?'':'readonly'}></td>
      <td class="points" data-label="Points"><input class="points-input" type="number" value="${row.points}" data-f="points" ${editing?'':'readonly'}></td>
      <td data-label=""><button class="row-remove">✕</button></td>
    `;
    tr.querySelectorAll('input').forEach(inp=>{
      inp.addEventListener('change',()=>{
        const val = inp.dataset.f==='points'? (parseInt(inp.value)||0) : inp.value;
        state.boardStudents[realIndex][inp.dataset.f]=val;
        saveKey(KEYS.boardStudents,state.boardStudents);
        renderStudentBoard();
      });
    });
    tr.querySelector('.row-remove').addEventListener('click',()=>{
      state.boardStudents.splice(realIndex,1);
      saveKey(KEYS.boardStudents,state.boardStudents);
      renderStudentBoard();
    });
    tbody.appendChild(tr);
  });
}
function renderDeptBoard(){
  const tbody=document.querySelector('#deptBoard tbody');
  if(!tbody) return;
  const sorted=[...state.boardDepartments].sort((a,b)=>b.points-a.points);
  tbody.innerHTML='';
  sorted.forEach((row,i)=>{
    const realIndex=state.boardDepartments.indexOf(row);
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td class="rank" data-label="Rank">${i+1}</td>
      <td data-label="Department"><input value="${escapeHtml(row.name)}" data-f="name" ${editing?'':'readonly'}></td>
      <td class="points" data-label="Points"><input class="points-input" type="number" value="${row.points}" data-f="points" ${editing?'':'readonly'}></td>
      <td data-label=""><button class="row-remove">✕</button></td>
    `;
    tr.querySelectorAll('input').forEach(inp=>{
      inp.addEventListener('change',()=>{
        const val = inp.dataset.f==='points'? (parseInt(inp.value)||0) : inp.value;
        state.boardDepartments[realIndex][inp.dataset.f]=val;
        saveKey(KEYS.boardDepartments,state.boardDepartments);
        renderDeptBoard();
      });
    });
    tr.querySelector('.row-remove').addEventListener('click',()=>{
      state.boardDepartments.splice(realIndex,1);
      saveKey(KEYS.boardDepartments,state.boardDepartments);
      renderDeptBoard();
    });
    tbody.appendChild(tr);
  });
}

/* ---------------- MARKETPLACE ---------------- */
function renderMarketplace(){
  const wrap=document.getElementById('marketGrid');
  if(!wrap) return;
  wrap.innerHTML='';
  state.marketplace.forEach((tile,i)=>{
    const el=document.createElement(editing?'div':'a');
    el.className='market-tile';
    if(!editing){
      el.href = tile.link || '#';
      if(tile.link) el.target='_blank';
    }
    el.innerHTML=`
      <button class="card-remove" style="${editing?'display:block':'display:none'}">✕</button>
      <div class="market-badge">${tile.link?'Linked':'No Link'}</div>
      <div class="market-icon">${tile.icon}</div>
      <input class="name-field" style="font-family:var(--serif-display);font-size:1.1rem;" data-f="name" value="${escapeHtml(tile.name)}" ${editing?'':'readonly'}>
      <textarea class="market-desc" data-f="desc" ${editing?'':'readonly'} style="border:none;background:transparent;font:inherit;resize:vertical;color:inherit;">${escapeHtml(tile.desc)}</textarea>
      ${editing?`<input class="market-link-input" placeholder="https://... paste listing/form link" data-f="link" value="${escapeHtml(tile.link)}">`
                :`<div class="market-link-row">${tile.link?escapeHtml(tile.link):'Link coming soon'}</div>`}
    `;
    el.querySelectorAll('input,textarea').forEach(inp=>{
      inp.addEventListener('click',e=>{ if(editing) e.preventDefault(); });
      inp.addEventListener('change',()=>{
        tile[inp.dataset.f]=inp.value;
        saveKey(KEYS.marketplace,state.marketplace);
        renderMarketplace();
      });
    });
    const rm=el.querySelector('.card-remove');
    if(rm) rm.addEventListener('click',(e)=>{
      e.preventDefault();
      state.marketplace.splice(i,1);
      saveKey(KEYS.marketplace,state.marketplace);
      renderMarketplace();
    });
    wrap.appendChild(el);
  });
  if(editing){
    const addCard=document.createElement('button');
    addCard.className='add-card';
    addCard.style.display='flex';
    addCard.textContent='+ Add Category';
    addCard.addEventListener('click',()=>{
      state.marketplace.push({id:uid('mk'),name:'New Category',icon:'📦',desc:'Description here.',link:''});
      saveKey(KEYS.marketplace,state.marketplace);
      renderMarketplace();
    });
    wrap.appendChild(addCard);
  }
}

function renderCurrentPage(){
  renderExecom();
  renderPanels();
  renderEvents('eventsPresent','eventsPresentWrap');
  renderEvents('eventsUpcoming','eventsUpcomingWrap');
  renderStudentBoard();
  renderDeptBoard();
  renderMarketplace();
  renderHeritage();
}

/* ---------------- HERITAGE TIMELINE ---------------- */
function renderHeritage(){
  const wrap=document.getElementById('timelineWrap');
  if(!wrap) return;
  wrap.innerHTML='';
  state.heritage.forEach((item,i)=>{
    const el=document.createElement('div');
    el.className='timeline-item';
    el.innerHTML=`
      <div>
        <input class="timeline-year" data-f="year" value="${escapeHtml(item.year)}" ${editing?'':'readonly'}>
        <div class="timeline-photo">${item.photo?`<img src="${escapeHtml(item.photo)}" alt="">`:'No Photo Yet'}</div>
        ${editing?`<input class="timeline-photo-input" placeholder="paste image link" data-f="photo" value="${escapeHtml(item.photo)}">`:''}
        <div class="timeline-controls">
          <button class="tl-btn" data-act="up" title="Move earlier">↑</button>
          <button class="tl-btn" data-act="down" title="Move later">↓</button>
          <button class="tl-btn tl-remove" data-act="remove" title="Remove">✕</button>
        </div>
      </div>
      <div>
        <input class="timeline-title" data-f="title" value="${escapeHtml(item.title)}" ${editing?'':'readonly'}>
        <textarea class="timeline-desc" data-f="desc" ${editing?'':'readonly'}>${escapeHtml(item.desc)}</textarea>
      </div>
    `;
    el.querySelectorAll('input,textarea').forEach(inp=>{
      inp.addEventListener('change',()=>{
        item[inp.dataset.f]=inp.value;
        saveKey(KEYS.heritage,state.heritage);
        renderHeritage();
      });
    });
    const upBtn=el.querySelector('[data-act="up"]');
    const downBtn=el.querySelector('[data-act="down"]');
    const rmBtn=el.querySelector('[data-act="remove"]');
    if(upBtn) upBtn.addEventListener('click',()=>{
      if(i>0){
        [state.heritage[i-1],state.heritage[i]]=[state.heritage[i],state.heritage[i-1]];
        saveKey(KEYS.heritage,state.heritage);
        renderHeritage();
      }
    });
    if(downBtn) downBtn.addEventListener('click',()=>{
      if(i<state.heritage.length-1){
        [state.heritage[i+1],state.heritage[i]]=[state.heritage[i],state.heritage[i+1]];
        saveKey(KEYS.heritage,state.heritage);
        renderHeritage();
      }
    });
    if(rmBtn) rmBtn.addEventListener('click',()=>{
      state.heritage.splice(i,1);
      saveKey(KEYS.heritage,state.heritage);
      renderHeritage();
    });
    wrap.appendChild(el);
  });
}

function wireStaticControls(){
  const addTimelineBtn=document.getElementById('addTimelineBtn');
  if(addTimelineBtn) addTimelineBtn.addEventListener('click',()=>{
    state.heritage.push({id:uid('h'),year:'Year',title:'New Milestone',desc:'Describe this achievement or moment.',photo:''});
    saveKey(KEYS.heritage,state.heritage);
    renderHeritage();
  });
  const addPanelBtn=document.getElementById('addPanelBtn');
  if(addPanelBtn) addPanelBtn.addEventListener('click',()=>{
    state.subpanels.push({id:uid('p'),name:'New Sub-Panel',members:[]});
    saveKey(KEYS.subpanels,state.subpanels);
    renderPanels();
  });
  document.querySelectorAll('.add-event-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const which=btn.dataset.list;
      const listKey = which==='present'?'eventsPresent':'eventsUpcoming';
      state[listKey].push({id:uid('e'),title:'New Event',date:'TBD',tag:'Event',desc:'Description here.'});
      saveKey(KEYS[listKey],state[listKey]);
      renderEvents(listKey, which==='present'?'eventsPresentWrap':'eventsUpcomingWrap');
    });
  });
  document.querySelectorAll('.add-row-plain').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(btn.dataset.board==='students'){
        state.boardStudents.push({id:uid('s'),name:'New Student',dept:'Dept',points:0});
        saveKey(KEYS.boardStudents,state.boardStudents);
        renderStudentBoard();
      }else{
        state.boardDepartments.push({id:uid('d'),name:'New Department',points:0});
        saveKey(KEYS.boardDepartments,state.boardDepartments);
        renderDeptBoard();
      }
    });
  });
  document.querySelectorAll('.tab-strip').forEach(strip=>{
    strip.addEventListener('click',(e)=>{
      const btn=e.target.closest('.tab-btn');
      if(!btn) return;
      const section=strip.closest('section');
      strip.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      section.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
      const target = section.querySelector('#tab-'+btn.dataset.tab) || section.querySelector('#board-'+btn.dataset.tab);
      if(target) target.classList.add('active');
    });
  });
}

async function init(){
  await initTheme();
  initNav();
  initAuth();
  wireStaticControls();
  state.execom = await loadKey(KEYS.execom, DEFAULTS.execom);
  state.subpanels = await loadKey(KEYS.subpanels, DEFAULTS.subpanels);
  state.eventsPresent = await loadKey(KEYS.eventsPresent, DEFAULTS.eventsPresent);
  state.eventsUpcoming = await loadKey(KEYS.eventsUpcoming, DEFAULTS.eventsUpcoming);
  state.boardStudents = await loadKey(KEYS.boardStudents, DEFAULTS.boardStudents);
  state.boardDepartments = await loadKey(KEYS.boardDepartments, DEFAULTS.boardDepartments);
  state.marketplace = await loadKey(KEYS.marketplace, DEFAULTS.marketplace);
  state.heritage = await loadKey(KEYS.heritage, DEFAULTS.heritage);
  await restoreSession();
  renderCurrentPage();
}
document.addEventListener('DOMContentLoaded', init);
})();
