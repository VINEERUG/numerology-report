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

// --- Add this function to support past reports ---
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
        reportsEl.innerHTML = data.reports.map(r =>
          `<div><b>${r.firstName}</b> - ${r.dob}</div>`
        ).join('');
      } else {
        reportsEl.textContent = "No reports found.";
      }
    })
    .catch(() => {
      reportsEl.textContent = "Error loading reports.";
    });
}

// (Add/keep your renderFullReport and renderTeaserReport and any UI support functions as needed)
