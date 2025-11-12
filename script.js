// --- START OF SCRIPT ---

const API_URL = "https://keshvaggrawal.pythonanywhere.com/api/";

const APP_STATE = {
  token: localStorage.getItem('numerologyToken'),
  email: localStorage.getItem('numerologyEmail')
};

let pageSections = {}, guestCta;

document.addEventListener("DOMContentLoaded", () => {
  pageSections = {
    mainForm: document.getElementById('page-main-form'),
    report: document.getElementById('page-report'),
    login: document.getElementById('page-login'),
    register: document.getElementById('page-register'),
    loading: document.getElementById('page-loading'),
    myReports: document.getElementById('page-my-reports'),
    guestCta: document.getElementById('guest-cta')
  };
  updateNavUI();
  window.addEventListener('hashchange', navigate);
  navigate();
  attachListeners();
});

function getActiveDropdown() {
  return APP_STATE.token
    ? document.getElementById('user-menu-user')
    : document.getElementById('user-menu-guest');
}

function toggleUserMenu(e) {
  e.stopPropagation();
  const d = getActiveDropdown();
  if (d) d.classList.toggle('show');
}

function closeUserMenu() {
  const d = getActiveDropdown();
  if (d) d.classList.remove('show');
}

function navigate() {
  closeUserMenu();
  const hash = window.location.hash || '#home';
  Object.values(pageSections).forEach(s => { if (s) s.style.display = 'none'; });
  switch (hash) {
    case '#login':
      if (pageSections.login) pageSections.login.style.display = 'block';
      break;
    case '#register':
      if (pageSections.register) pageSections.register.style.display = 'block';
      break;
    case '#report':
      const rData = sessionStorage.getItem('viewReportData'), iData = sessionStorage.getItem('viewInputsData');
      if (rData && iData) {
        renderFullReport(JSON.parse(rData), JSON.parse(iData));
        if (pageSections.report) pageSections.report.style.display = 'block';
        sessionStorage.removeItem('viewReportData');
        sessionStorage.removeItem('viewInputsData');
      } else if (pageSections.report && pageSections.report.innerHTML.trim() !== '') {
        if (pageSections.report) pageSections.report.style.display = 'block';
      } else {
        window.location.hash = '#home';
        if (pageSections.mainForm) pageSections.mainForm.style.display = 'block';
      }
      break;
    case '#my-reports':
      if (APP_STATE.token && pageSections.myReports) {
        pageSections.myReports.style.display = 'block';
        loadUserReports();
      } else {
        window.location.hash = "#login";
      }
      break;
    case '#home':
    default:
      sessionStorage.removeItem('viewReportData');
      sessionStorage.removeItem('viewInputsData');
      if (pageSections.mainForm) pageSections.mainForm.style.display = 'block';
      break;
  }
}

function updateNavUI() {
  const el = document.getElementById('user-menu-email');
  if (APP_STATE.token) {
    if (el) el.textContent = APP_STATE.email;
    if (guestCta) guestCta.style.display = 'none';
  } else {
    if (el) el.textContent = "";
    if (guestCta) guestCta.style.display = 'block';
  }
}

function attachListeners() {
  const lF = document.getElementById('login-form'),
        rF = document.getElementById('register-form'),
        mF = document.getElementById('numerology-form');
  if (lF) lF.addEventListener('submit', handleUserLogin);
  if (rF) rF.addEventListener('submit', handleUserRegister);
  if (mF) mF.addEventListener('submit', handleNumerologySubmit);

  const umB = document.getElementById('user-menu-button'),
        loB = document.getElementById('nav-logout');
  if (umB) umB.addEventListener('click', toggleUserMenu);
  if (loB) loB.addEventListener('click', handleLogout);
  window.addEventListener('click', e => {
    if (umB && !umB.contains(e.target)) closeUserMenu();
  });
}

async function handleUserLogin(e) {
  e.preventDefault();
  showLoading();
  apiCall('client-login', {
    email: e.target.email.value,
    password: e.target.password.value
  }, (d) => {
    if (d.ok) {
      setLogin(d.email, d.token);
      window.location.hash = "#home";
    } else {
      showErr('login-error', d.error);
      navigate('/');
    }
  });
}

async function handleUserRegister(e) {
  e.preventDefault();
  showLoading();
  apiCall('register', {
    email: e.target.email.value,
    password: e.target.password.value
  }, (d) => {
    if (d.ok) handleUserLogin(e);
    else { showErr('register-error', d.error); navigate('/'); }
  });
}

function handleLogout() {
  closeUserMenu();
  clearLogin();
  window.location.hash = "#home";
}

async function handleNumerologySubmit(e) {
  e.preventDefault();
  document.getElementById('form-error').style.display = 'none';
  showLoading();
  const p = {
    firstName: e.target.firstName.value,
    middleName: e.target.middleName.value,
    lastName: e.target.lastName.value,
    dob: e.target.dob.value,
    gender: e.target.gender.value,
    mobile: e.target.mobile.value,
    carNumber: e.target.carNumber.value
  };
  apiCall('calc', p, (d) => {
    if (d.ok && d.report) {
      d.reportType === "full" ? renderFullReport(d.report, p) : renderTeaserReport(d.report);
      window.location.hash = "#report";
    } else {
      showErr('form-error', d.error);
      navigate('/');
    }
  }, true);
}

async function apiCall(ept, body, cb, auth = false) {
  try {
    const h = { "Content-Type": "application/json" };
    if (auth && APP_STATE.token) h["Authorization"] = `Bearer ${APP_STATE.token}`;
    const r = await fetch(API_URL + ept, {
      method: "POST",
      headers: h,
      body: JSON.stringify(body)
    });
    const d = await r.json();
    cb(d);
  } catch (e) {
    showErr(
      ept.includes("login") ? "login-error"
      : ept.includes("register") ? "register-error"
      : "form-error",
      "Network error."
    );
    navigate('/');
  }
}

function setLogin(e, t) {
  APP_STATE.token = t;
  APP_STATE.email = e;
  localStorage.setItem('numerologyToken', t);
  localStorage.setItem('numerologyEmail', e);
  updateNavUI();
}

function clearLogin() {
  APP_STATE.token = null;
  APP_STATE.email = null;
  localStorage.removeItem('numerologyToken');
  localStorage.removeItem('numerologyEmail');
  updateNavUI();
}

function showLoading() {
  Object.values(pageSections).forEach(s => { if (s) s.style.display = 'none'; });
  if (pageSections.loading) pageSections.loading.style.display = 'block';
}

function showErr(id, m) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = m + " Error";
    el.style.display = "block";
  }
}

function renderTeaserReport(r) {
    pageSections.report.innerHTML=`<div class="result-card p-6 text-center"><h2 class="font-serif text-3xl text-white mb-4">Basic Numbers</h2><div class="flex justify-center gap-8"><div><p class="text-purple-300">Driver</p><p class="text-6xl font-bold text-white">${r.driverNumber}</p></div><div><p class="text-purple-300">Conductor</p><p class="text-6xl font-bold text-white">${r.conductorNumber}</p></div></div><div class="mt-8 p-4 bg-gray-900/50 rounded"><p class="text-white">Want full report?</p><div class="mt-4"><a href="#login" class="px-6 py-2 bg-violet-600 text-white rounded mr-2">Login</a><a href="#register" class="px-6 py-2 bg-pink-600 text-white rounded">Sign Up</a></div></div><div class="text-center mt-8"><a href="#home" class="text-gray-400">Back</a></div></div>`;
}

function renderFullReport(r, i) {
    const c = pageSections.report;
    const zs={'Aries':'♈','Taurus':'♉','Gemini':'♊','Cancer':'♋','Leo':'♌','Virgo':'♍','Libra':'♎','Scorpio':'♏','Sagittarius':'♐','Capricorn':'♑','Aquarius':'♒','Pisces':'♓'};
    const ni={1:{title:"The Leader",text:"Core identity."},2:{title:"The Peacemaker",text:"Core identity."},3:{title:"The Communicator",text:"Core identity."},4:{title:"The Builder",text:"Core identity."},5:{title:"The Adventurer",text:"Core identity."},6:{title:"The Nurturer",text:"Core identity."},7:{title:"The Seeker",text:"Core identity."},8:{title:"The Powerhouse",text:"Core identity."},9:{title:"The Humanitarian",text:"Core identity."},11:{title:"The Visionary",text:"Master Number."},22:{title:"The Master Builder",text:"Master Number."},33:{title:"The Master Teacher",text:"Master Number."}};
    const cd={1:{1:{title:"The Royal Combination",type:"Friendly",text:"Sun driving Sun. Powerful and ambitious."},
    2:{title:"The King and Queen",type:"Neutral",text:"Sun and Moon. Balance authority with sensitivity."},
    3:{title:"The Respected Leader",type:"Friendly",text:"Sun and Jupiter. Wisdom guides leadership."},
    4:{title:"The Eclipsed King",type:"Enemy",text:"Sun and Rahu. Unexpected challenges to authority."},
    5:{title:"The Charismatic Leader",type:"Friendly",text:"Sun and Mercury. Intellect fuels leadership."},
    6:{title:"The King's Indulgence",type:"Enemy",text:"Sun and Venus. Struggle between duty and luxury."},
    7:{title:"The Solitary King",type:"Neutral",text:"Sun and Ketu. Intuitive, spiritual leadership."},
    8:{title:"The King vs. Judge",type:"Enemy",text:"Sun and Saturn. Success through immense struggle."},
    9:{title:"The Warrior King",type:"Friendly",text:"Sun and Mars. Unstoppable energy and command."}},
    2:{1:{title:"The Queen and King",type:"Neutral",text:"Moon driving Sun. Inner sensitivity, outer power."},
    2:{title:"The Pure Heart",type:"Friendly",text:"Moon driving Moon. deeply emotional and intuitive."},
    3:{title:"The Nurturing Guru",type:"Neutral",text:"Moon and Jupiter. Wisdom delivered with care."},
    4:{title:"The Emotional Storm",type:"Neutral",text:"Moon and Rahu. Mental anxiety and high creativity."},
    5:{title:"Emotional Intelligence",type:"Friendly",text:"Moon and Mercury. Connecting with others easily."},
    6:{title:"The Loving Caregiver",type:"Neutral",text:"Moon and Venus. Creates harmony and beauty."},
    7:{title:"The Solitary Creator",type:"Friendly",text:"Moon and Ketu. Deeply intuitive and artistic."},
    8:{title:"The Stone Heart",type:"Enemy",text:"Moon and Saturn. Emotional restriction and discipline."},
    9:{title:"The Emotional Warrior",type:"Neutral",text:"Moon and Mars. Passionate but volatile."}},
    3:{1:{title:"The Royal Guru",type:"Friendly",text:"Jupiter driving Sun. Wisdom guides power."},
    2:{title:"The Wise Counselor",type:"Neutral",text:"Jupiter and Moon. Emotional wisdom."},
    3:{title:"The Double Jupiter",type:"Friendly",text:"Pure expansion and knowledge."},
    4:{title:"The Structured Thinker",type:"Neutral",text:"Jupiter and Rahu. Unconventional wisdom."},
    5:{title:"The Charismatic Teacher",type:"Friendly",text:"Jupiter and Mercury. Great communication of ideas."},
    6:{title:"The Balanced Guru",type:"Enemy",text:"Jupiter and Venus. Conflict between wisdom and luxury."},
    7:{title:"The Spiritual Master",type:"Friendly",text:"Jupiter and Ketu. Deep spiritual insight."},
    8:{title:"The Wise Judge",type:"Enemy",text:"Jupiter and Saturn. Practical, grounded wisdom."},
    9:{title:"The Righteous Commander",type:"Friendly",text:"Jupiter and Mars. Wisdom in action."}},
    4:{1:{title:"The Reliable Foundation",type:"Friendly",text:"Rahu driving Sun. Unconventional leadership."},
    2:{title:"The Emotional Storm",type:"Enemy",text:"Rahu and Moon. Mental volatility."},
    3:{title:"The Unconventional Teacher",type:"Neutral",text:"Rahu and Jupiter. Unique wisdom."},
    4:{title:"The Game Changer",type:"Enemy",text:"Double Rahu. Extreme ups and downs."},
    5:{title:"The Quick-Witted Problem Solver",type:"Friendly",text:"Rahu and Mercury. Sharp, cunning intellect."},
    6:{title:"The Rebellious Artist",type:"Friendly",text:"Rahu and Venus. Unconventional relationships/art."},
    7:{title:"The Great Reformer",type:"Friendly",text:"Rahu and Ketu. Deep investigative skills."},
    8:{title:"The Sudden Wealth",type:"Enemy",text:"Rahu and Saturn. unexpected gains or losses."},
    9:{title:"The Reckless Force",type:"Enemy",text:"Rahu and Mars. High energy, accident prone."}},
    5:{1:{title:"The Smart Leader",type:"Friendly",text:"Mercury driving Sun. Intelligent authority."},
    2:{title:"The Persuasive Speaker",type:"Friendly",text:"Mercury and Moon. Emotional connection in speech."},
    3:{title:"The Knowledge Broker",type:"Friendly",text:"Mercury and Jupiter. Business with wisdom."},
    4:{title:"The Calculated Risk-Taker",type:"Neutral",text:"Mercury and Rahu. Sharp business sense."},
    5:{title:"The Double Agent",type:"Friendly",text:"Pure intellect and adaptability."},
    6:{title:"The Charming Negotiator",type:"Friendly",text:"Mercury and Venus. Success in media/arts."},
    7:{title:"The Inquisitive Analyst",type:"Neutral",text:"Mercury and Ketu. Deep research skills."},
    8:{title:"The Strategic Planner",type:"Neutral",text:"Mercury and Saturn. Long-term business success."},
    9:{title:"The Sharp Debater",type:"Neutral",text:"Mercury and Mars. Quick, aggressive intellect."}},
    6:{1:{title:"The Diplomat vs. King",type:"Enemy",text:"Venus driving Sun. Conflict of ego and harmony."},
    2:{title:"The Loving Caregiver",type:"Neutral",text:"Venus and Moon. Nurturing and artistic."},
    3:{title:"The Luxurious Teacher",type:"Enemy",text:"Venus and Jupiter. Wisdom with style."},
    4:{title:"The Rebellious Artist",type:"Friendly",text:"Venus and Rahu. Unconventional creativity."},
    5:{title:"The Charming Negotiator",type:"Friendly",text:"Venus and Mercury. Social and business charm."},
    6:{title:"The Life of Pleasure",type:"Friendly",text:"Double Venus. Focus on luxury and love."},
    7:{title:"The Spiritual Artist",type:"Friendly",text:"Venus and Ketu. Finding divine beauty."},
    8:{title:"The Disciplined Creator",type:"Neutral",text:"Venus and Saturn. Lasting success in arts/business."},
    9:{title:"The Passionate Protector",type:"Neutral",text:"Venus and Mars. Intense passion and energy."}},
    7:{1:{title:"The Solitary King",type:"Neutral",text:"Ketu driving Sun. Spiritual authority."},
    2:{title:"The Solitary Creator",type:"Neutral",text:"Ketu and Moon. Intuitive creativity."},
    3:{title:"The Deep Thinker",type:"Friendly",text:"Ketu and Jupiter. Profound wisdom."},
    4:{title:"The Code Breaker",type:"Friendly",text:"Ketu and Rahu. Investigative genius."},
    5:{title:"The Quiet Analyst",type:"Neutral",text:"Ketu and Mercury. Deep research."},
    6:{title:"The Spiritual Artist",type:"Friendly",text:"Ketu and Venus. Spiritual approach to love/art."},
    7:{title:"The Mystic",type:"Neutral",text:"Double Ketu. Deeply spiritual and detached."},
    8:{title:"The Isolated Hermit",type:"Enemy",text:"Ketu and Saturn. Deep solitude and discipline."},
    9:{title:"The Angry Mystic",type:"Enemy",text:"Ketu and Mars. Inner volatility."}},
    8:{1:{title:"The Judge vs. King",type:"Enemy",text:"Saturn driving Sun. Struggle with authority."},
    2:{title:"The Stone Heart",type:"Enemy",text:"Saturn and Moon. Emotional hardship."},
    3:{title:"The Disciplined Teacher",type:"Friendly",text:"Saturn and Jupiter. Practical wisdom."},
    4:{title:"The Builder of Foundations",type:"Enemy",text:"Saturn and Rahu. Struggle for stability."},
    5:{title:"The Strategic Planner",type:"Friendly",text:"Saturn and Mercury. Serious business mind."},
    6:{title:"The Disciplined Creator",type:"Friendly",text:"Saturn and Venus. Wealth through hard work."},
    7:{title:"The Isolated Hermit",type:"Neutral",text:"Saturn and Ketu. Deep detachment."},
    8:{title:"The Master of Karma",type:"Enemy",text:"Double Saturn. Life of immense discipline."},
    9:{title:"Immovable Object vs Force",type:"Neutral",text:"Saturn and Mars. Enduring energy."}},
    9:{1:{title:"The Warrior King",type:"Friendly",text:"Mars driving Sun. Unbeatable energy."},
    2:{title:"The Emotional Warrior",type:"Enemy",text:"Mars and Moon. Volatile emotions."},
    3:{title:"The Righteous Commander",type:"Friendly",text:"Mars and Jupiter. Principled action."},
    4:{title:"The Reckless Force",type:"Enemy",text:"Mars and Rahu. Dangerous energy."},
    5:{title:"The Quick-Witted Warrior",type:"Friendly",text:"Mars and Mercury. Sharp tongue."},
    6:{title:"The Passionate Protector",type:"Neutral",text:"Mars and Venus. Intense romance."},
    7:{title:"The Angry Mystic",type:"Enemy",text:"Mars and Ketu. Frustrated energy."},
    8:{title:"Immovable Object vs Force",type:"Enemy",text:"Mars and Saturn.Constant struggle."},
    9:{title:"The Double Mars",type:"Friendly",text:"Pure fire and energy."}}};

function loadUserReports() {
  const reportsEl = pageSections.myReports;
  if (!APP_STATE.token || !reportsEl) return;
  reportsEl.textContent = "Loading reports...";
  fetch(API_URL + "my-reports", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${APP_STATE.token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.ok && data.reports && data.reports.length) {
        reportsEl.innerHTML = data.reports
          .map((r, idx) =>
            `<div style="margin-bottom: 16px;">
              <b>${r.firstName}</b> - ${r.dob}
              <button onclick="viewReport(${idx})" style="margin-left:12px;">View Report</button>
            </div>`
          ).join('');
        // Save entire list in sessionStorage (or a global JS variable)
        window.LOADED_REPORTS = data.reports;
      } else {
        reportsEl.textContent = "No reports found.";
      }
    })
    .catch(() => {
      reportsEl.textContent = "Error loading reports.";
    });
}

// Add this function globally in the same file:
function viewReport(idx) {
  const reports = window.LOADED_REPORTS;
  if (reports && reports[idx]) {
    const report = reports[idx];
    sessionStorage.setItem('viewReportData', JSON.stringify(report.reportData));
    sessionStorage.setItem('viewInputsData', JSON.stringify(report.inputs));
    window.location.hash = '#report';
  }
}


// (Add/keep your renderFullReport and renderTeaserReport and any UI support functions as needed)


