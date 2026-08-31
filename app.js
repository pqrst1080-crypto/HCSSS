(function(){
const KEYS = {
  theme: 'hcs:theme'
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
    {id:'h1',year:'1939',title:'A College is Founded',desc:'Established under Maharajah Sree Chithira Thirunal Balarama Varma as the first engineering college in the princely state of Travancore, opening with 21 students each in Civil, Mechanical and Electrical Engineering.',photo:'images/timeline_1939_founding.jpg'},
    {id:'h2',year:'1957',title:'University of Kerala',desc:'Having begun as a constituent college of the University of Travancore, CET came under the newly formed University of Kerala as academic administration in the state was reorganised.',photo:'images/timeline_1957_kerala_univ.jpg'},
    {id:'h3',year:'1960',title:'A New Campus',desc:'The college moved to its present sprawling campus at Sreekaryam, the home it has grown into ever since.',photo:'images/timeline_1960_sreekaryam.jpg'},
    {id:'h4',year:'1980s',title:'Postgraduate Growth',desc:'New postgraduate programmes, including the MCA department, broadened the college beyond its founding undergraduate branches.',photo:'images/timeline_1980s_postgraduate.jpg'},
    {id:'h5',year:'2015',title:'KTU Affiliation',desc:'CET became affiliated to the newly established APJ Abdul Kalam Technological University, marking a new chapter in its academic governance.',photo:'images/timeline_2015_ktu.jpg'},
    {id:'h6',year:'2020s',title:'National Recognition',desc:'Recognised in national rankings across engineering and architecture, with growing research activity in computing and space technology.',photo:'images/timeline_2020s_recognition.jpg'},
    {id:'h7',year:'2026',title:'Heritage & Collectibles Society Founded',desc:'HCS is chartered as a new student chapter, bringing coin, currency, stamp and antique collectors on campus together for the first time.',photo:'images/timeline_2026_collectibles.jpg'}
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

let state = {};

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
    const v = localStorage.getItem(KEYS.theme);
    if(v) theme = v;
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
  try{ localStorage.setItem(KEYS.theme, next); }catch(e){}
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

/* ---------------- EXECOM ---------------- */
function renderExecom(){
  const wrap = document.getElementById('execomGrid');
  if(!wrap) return;
  wrap.innerHTML='';
  state.execom.forEach((m,i)=>{
    const card=document.createElement('div');
    card.className='specimen';
    card.innerHTML=`
      <div class="catalog-no">Member No. ${String(i+1).padStart(3,'0')}</div>
      <div class="photo-frame">${m.photo?`<img src="${escapeHtml(m.photo)}" alt="${escapeHtml(m.name)}">`:initials(m.name)}</div>
      <div class="member-name">${escapeHtml(m.name)}</div>
      <div class="leader-row"><span class="lab">Position</span><span class="val">${escapeHtml(m.position)}</span></div>
      <div class="leader-row"><span class="lab">Dept</span><span class="val">${escapeHtml(m.dept)}</span></div>
      <div class="leader-row"><span class="lab">Year</span><span class="val">${escapeHtml(m.year)}</span></div>
    `;
    wrap.appendChild(card);
  });
}

/* ---------------- SUBPANELS ---------------- */
function renderPanels(){
  const wrap=document.getElementById('panelsWrap');
  if(!wrap) return;
  wrap.innerHTML='';
  state.subpanels.forEach(panel=>{
    const block=document.createElement('div');
    block.className='panel-block';
    block.innerHTML=`
      <div class="panel-head">
        <h3 class="panel-title">${escapeHtml(panel.name)}</h3>
      </div>
      <div class="panel-members"></div>
    `;
    const membersWrap=block.querySelector('.panel-members');
    panel.members.forEach(mem=>{
      const row=document.createElement('div');
      row.className='pm-row';
      row.innerHTML=`
        <div class="photo-frame">${initials(mem.name)}</div>
        <div class="pm-info">
          <div class="pm-name">${escapeHtml(mem.name)}</div>
          <div class="pm-role">${escapeHtml(mem.role)}</div>
        </div>
      `;
      membersWrap.appendChild(row);
    });
    wrap.appendChild(block);
  });
}

/* ---------------- EVENTS ---------------- */
function renderEvents(listKey, wrapId){
  const wrap=document.getElementById(wrapId);
  if(!wrap) return;
  wrap.innerHTML='';
  state[listKey].forEach(ev=>{
    const card=document.createElement('div');
    card.className='event-card';
    card.innerHTML=`
      <div class="event-date">${escapeHtml(ev.date)}</div>
      <div class="event-body">
        <span class="event-tag">${escapeHtml(ev.tag)}</span>
        <h3 class="event-title">${escapeHtml(ev.title)}</h3>
        <p class="event-desc">${escapeHtml(ev.desc)}</p>
      </div>
    `;
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
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td class="rank" data-label="Rank">${i+1}</td>
      <td data-label="Student">${escapeHtml(row.name)}</td>
      <td data-label="Department">${escapeHtml(row.dept)}</td>
      <td class="points" data-label="Points">${row.points}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderDeptBoard(){
  const tbody=document.querySelector('#deptBoard tbody');
  if(!tbody) return;
  const sorted=[...state.boardDepartments].sort((a,b)=>b.points-a.points);
  tbody.innerHTML='';
  sorted.forEach((row,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td class="rank" data-label="Rank">${i+1}</td>
      <td data-label="Department">${escapeHtml(row.name)}</td>
      <td class="points" data-label="Points">${row.points}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ---------------- MARKETPLACE ---------------- */
function renderMarketplace(){
  const wrap=document.getElementById('marketGrid');
  if(!wrap) return;
  wrap.innerHTML='';
  state.marketplace.forEach(tile=>{
    const el=document.createElement(tile.link?'a':'div');
    el.className='market-tile';
    if(tile.link){
      el.href = tile.link;
      el.target='_blank';
      el.rel='noopener noreferrer';
    }
    el.innerHTML=`
      <div class="market-badge">${tile.link?'Linked':'Coming Soon'}</div>
      <div class="market-icon">${tile.icon}</div>
      <h3 class="market-name">${escapeHtml(tile.name)}</h3>
      <p class="market-desc">${escapeHtml(tile.desc)}</p>
      ${tile.link ? `<div class="market-link-row">${escapeHtml(tile.link)}</div>` : ''}
    `;
    wrap.appendChild(el);
  });
}

/* ---------------- HERITAGE TIMELINE ---------------- */
function initTimelineScrollObserver(){
  const items = document.querySelectorAll('.timeline-item');
  if(!items.length) return;

  if('IntersectionObserver' in window){
    const observer = new IntersectionObserver((entries, obs)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    items.forEach(el => observer.observe(el));
  } else {
    items.forEach(el => el.classList.add('in-view'));
  }
}

function renderHeritage(){
  const wrap=document.getElementById('timelineWrap');
  if(!wrap) return;
  wrap.innerHTML='';
  state.heritage.forEach(item=>{
    const el=document.createElement('div');
    el.className='timeline-item';
    el.innerHTML=`
      <div>
        <div class="timeline-year">${escapeHtml(item.year)}</div>
        ${item.photo?`<div class="timeline-photo"><img src="${escapeHtml(item.photo)}" alt="${escapeHtml(item.title)}" loading="lazy"></div>`:''}
      </div>
      <div>
        <h3 class="timeline-title">${escapeHtml(item.title)}</h3>
        <p class="timeline-desc">${escapeHtml(item.desc)}</p>
      </div>
    `;
    wrap.appendChild(el);
  });
  initTimelineScrollObserver();
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

function wireStaticControls(){
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
  wireStaticControls();
  state = JSON.parse(JSON.stringify(DEFAULTS));
  renderCurrentPage();
}
document.addEventListener('DOMContentLoaded', init);
})();
