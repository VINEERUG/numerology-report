// --- START OF SCRIPT ---
// v=5.1 AUTO-LOGIN - Mandatory Email & Auto-Signup/Login Logic Implemented

const API_URL = "https://keshvaggrawal.pythonanywhere.com/api"; 
const APP_STATE = { token: localStorage.getItem('numerologyToken'), email: localStorage.getItem('numerologyEmail') };
let pageSections = {}, guestCta; 
let CURRENT_REPORT_INPUTS = null;


document.addEventListener('DOMContentLoaded', () => {
    pageSections = {
        mainForm: document.getElementById('page-main-form'), 
        report: document.getElementById('page-report'),
        login: document.getElementById('page-login'), 
        register: document.getElementById('page-register'),
        loading: document.getElementById('page-loading'), 
        myReports: document.getElementById('page-my-reports')
    }; // <--- CLOSING BRACE ADDED HERE

    // --- FIX: Attach listener to ALL "My Reports" buttons (Header & Dropdown) ---
    const myReportButtons = [
    document.getElementById('header-my-reports'), // The one in the top bar (if any)
    document.getElementById('nav-my-reports')     // The one in the dropdown menu
    ];

    myReportButtons.forEach(btn => {
    if (btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            closeUserMenu(); // Close the dropdown if open
            window.location.hash = '#my-reports'; // Change URL hash
            if (typeof navigate === 'function') {
                navigate(); // Force navigation update
            }
        });
    }
});

    guestCta = document.getElementById('guest-cta');
    function updateNavUI() {
    const el = document.getElementById('user-menu-email');
    if (APP_STATE.token) {
        // Logged in
        if (el) el.textContent = APP_STATE.email;
        if (guestCta) guestCta.style.display = 'none';
    } else {
        // Logged out
        if (el) el.textContent = '';
        if (guestCta) guestCta.style.display = ''; // let CSS classes work
    }
}
    attachListeners();
    window.addEventListener('hashchange', navigate);
    navigate();

});

function getActiveDropdown() { return APP_STATE.token ? document.getElementById('user-menu-user') : document.getElementById('user-menu-guest'); }
function toggleUserMenu(e) { e.stopPropagation(); const d = getActiveDropdown(); if(d) d.classList.toggle('show'); }
function closeUserMenu() { const d = getActiveDropdown(); if(d) d.classList.remove('show'); }

function navigate() {
    closeUserMenu();
    const hash = window.location.hash || '#home';
    
    // 1. Hide ALL sections by ADDING 'hidden' class
    Object.values(pageSections).forEach(s => {
        if (s) {
            s.classList.add('hidden'); // Tailwind hide
            s.style.display = 'none';  // Fallback hide
        }
    });

    // Helper to Show a Section
    const showSection = (section) => {
        if (section) {
            section.classList.remove('hidden'); // Tailwind show
            section.style.display = 'block';    // Fallback show
        }
    };

    switch(hash) {
        case '#login':
            showSection(pageSections.login);
            break;
        case '#register':
            showSection(pageSections.register);
            break;
        case '#report':
            const rData = sessionStorage.getItem('viewReportData');
            const iData = sessionStorage.getItem('viewInputsData');
            
            if (hash === '#report' && rData && iData) {
                renderFullReport(JSON.parse(rData), JSON.parse(iData));
                showSection(pageSections.report);
                sessionStorage.removeItem('viewReportData');
                sessionStorage.removeItem('viewInputsData');
            } else if (pageSections.report && pageSections.report.innerHTML.trim() !== '') {
                showSection(pageSections.report);
            } else {
                window.location.hash = '#home';
                showSection(pageSections.mainForm);
            }
            break;
        case '#my-reports':
            if (APP_STATE.token) {
                showSection(pageSections.myReports);
                loadUserReports();
            } else {
                window.location.hash = '#login';
            }
            break;
        case '#home':
        default:
            sessionStorage.removeItem('viewReportData');
            sessionStorage.removeItem('viewInputsData');
            showSection(pageSections.mainForm);
            break;
    }
}

function updateNavUI() {
    const el = document.getElementById('user-menu-email');
    if(APP_STATE.token) { if(el) el.textContent=APP_STATE.email; if(guestCta) guestCta.style.display='none'; }
    else { if(el) el.textContent=''; if(guestCta) guestCta.style.display='block'; }
}

function attachListeners() {
    const lF = document.getElementById('login-form'), rF = document.getElementById('register-form'), mF = document.getElementById('numerology-form');
    if(lF) lF.addEventListener('submit', handleUserLogin); if(rF) rF.addEventListener('submit', handleUserRegister); if(mF) mF.addEventListener('submit', handleNumerologySubmit);
    const umB = document.getElementById('user-menu-button'), loB = document.getElementById('nav-logout');
    if(umB) umB.addEventListener('click', toggleUserMenu); if(loB) loB.addEventListener('click', handleLogout);
    window.addEventListener('click', (e) => { if(umB && !umB.contains(e.target)) closeUserMenu(); });
}

async function handleUserLogin(e) { e.preventDefault(); showLoading(); apiCall('/user-login', {email:e.target.email.value, password:e.target.password.value}, (d)=>{ if(d.ok){ setLogin(d.email,d.token); window.location.hash='#home'; } else { showErr('login-error', d.error); navigate(); } }); }
async function handleUserRegister(e) { e.preventDefault(); showLoading(); apiCall('/register', {email:e.target.email.value, password:e.target.password.value}, (d)=>{ if(d.ok) handleUserLogin(e); else { showErr('register-error', d.error); navigate(); } }); }
function handleLogout() { closeUserMenu(); clearLogin(); window.location.hash='#home'; }

async function handleNumerologySubmit(e) {
    e.preventDefault();
    document.getElementById('form-error').style.display = 'none';

    // 1. GET DATA
    // We look for e.target.email (new HTML) or fall back to e.target.emailOptional (old HTML compatibility)
    const emailInput = e.target.email || e.target.emailOptional;
    const emailVal = emailInput ? emailInput.value.trim() : "";

    // 2. VALIDATION (Mandatory Email)
    if (!emailVal) {
        showErr('form-error', 'Email address is required.');
        return;
    }

    showLoading();

    const FIXED_PASSWORD = "123456"; 
    let loginSuccess = false;

    try {
        // 3. ATTEMPT REGISTRATION
        const regRes = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailVal, password: FIXED_PASSWORD })
        });
        const regData = await regRes.json();

        if (regRes.ok) {
            // CASE A: NEW USER
            // Registration worked, now auto-login
            await performAutoLogin(emailVal, FIXED_PASSWORD);
            loginSuccess = true;
        } 
        else if (regData.error && (regData.error.toLowerCase().includes('exist') || regData.error.toLowerCase().includes('taken'))) {
            // CASE B: OLD USER (Email exists)
            // Try to login with the fixed password
            const loginOk = await performAutoLogin(emailVal, FIXED_PASSWORD);
            
            if (loginOk) {
                // Password was 123456, login success
                loginSuccess = true;
            } else {
                // CASE C: OLD USER WITH DIFFERENT PASSWORD
                // 1. Stop loading
                if(pageSections.loading) pageSections.loading.style.display = 'none';
                if(pageSections.mainForm) pageSections.mainForm.style.display = 'block';

                // 2. Alert and Redirect
                alert("This email is already registered with a different password. Please log in manually.");
                
                // 3. Go to Login Page
                window.location.hash = '#login';
                
                // 4. Pre-fill email in login form
                setTimeout(() => {
                    const loginForm = document.getElementById('login-form');
                    if (loginForm && loginForm.email) {
                        loginForm.email.value = emailVal;
                        if(loginForm.password) loginForm.password.focus();
                    }
                }, 100);
                return; // STOP execution here
            }
        } 
        else {
            // Generic Error
            showErr('form-error', regData.error || "Registration failed.");
            if(pageSections.loading) pageSections.loading.style.display = 'none';
            if(pageSections.mainForm) pageSections.mainForm.style.display = 'block';
            return;
        }

        // 4. CALCULATE REPORT (Only if logged in)
        if (loginSuccess) {
            const p = {
                firstName: e.target.firstName.value,
                middleName: e.target.middleName.value,
                lastName: e.target.lastName.value,
                dob: e.target.dob.value,
                gender: e.target.gender.value,
                mobile: e.target.mobile.value,
                // We map the new mandatory email back to 'emailOptional' key 
                // so your Python backend (which expects this key) doesn't break.
                emailOptional: emailVal, 
                carNumber: e.target.carNumber.value
            };

            // Call your existing apiCall function
            apiCall('/calc', p, (d) => {
                if(d.ok){
                    d.reportType === 'full' ? renderFullReport(d.report, p) : renderTeaserReport(d.report);
                    window.location.hash = '#report';
                    
                    // Show the green credential box
                    showCredentials(emailVal, FIXED_PASSWORD);
                } else {
                    showErr('form-error', d.error);
                    navigate();
                }
            }, true); // true = authorized call
        }

    } catch (err) {
        console.error(err);
        showErr('form-error', 'Network error during signup process.');
        navigate();
    }
}

async function apiCall(ept, body, cb, auth=false) {
    try { const h={'Content-Type':'application/json'}; if(auth&&APP_STATE.token) h['Authorization']=`Bearer ${APP_STATE.token}`;
        const r=await fetch(`${API_URL}${ept}`,{method:'POST',headers:h,body:JSON.stringify(body)}); const d=await r.json(); cb(d); }
    catch(e) { showErr(ept.includes('login')?'login-error':ept.includes('register')?'register-error':'form-error', 'Network error.'); navigate(); }
}
function setLogin(e,t) { APP_STATE.token=t; APP_STATE.email=e; localStorage.setItem('numerologyToken',t); localStorage.setItem('numerologyEmail',e); updateNavUI(); }
function clearLogin() { APP_STATE.token=null; APP_STATE.email=null; localStorage.removeItem('numerologyToken'); localStorage.removeItem('numerologyEmail'); updateNavUI(); }
function showLoading() { Object.values(pageSections).forEach(s=>{if(s)s.style.display='none'}); pageSections.loading.style.display='block'; }
function showErr(id,m) { const el=document.getElementById(id); if(el){el.textContent=m||'Error'; el.style.display='block';} }

function renderTeaserReport(r) {
    pageSections.report.innerHTML=`<div class="result-card p-6 text-center"><h2 class="font-serif text-3xl text-white mb-4">Basic Numbers</h2><div class="flex justify-center gap-8"><div><p class="text-purple-300">Driver</p><p class="text-6xl font-bold text-white">${r.driverNumber}</p></div><div><p class="text-purple-300">Conductor</p><p class="text-6xl font-bold text-white">${r.conductorNumber}</p></div></div><div class="mt-8 p-4 bg-gray-900/50 rounded"><p class="text-white">Want full report?</p><div class="mt-4"><a href="#login" class="px-6 py-2 bg-violet-600 text-white rounded mr-2">Login</a><a href="#register" class="px-6 py-2 bg-pink-600 text-white rounded">Sign Up</a></div></div><div class="text-center mt-8"><a href="#home" class="text-gray-400">Back</a></div></div>`;
}

function renderFullReport(r, i) {
    // 1. SAVE INPUTS GLOBALLY (Required for the re-check feature)
    CURRENT_REPORT_INPUTS = i;

    const c = pageSections.report;
    const zs={'Aries':'♈','Taurus':'♉','Gemini':'♊','Cancer':'♋','Leo':'♌','Virgo':'♍','Libra':'♎','Scorpio':'♏','Sagittarius':'♐','Capricorn':'♑','Aquarius':'♒','Pisces':'♓'};
    const ni={1:{title:"The Leader",text:"Leader, independent, ambitious, and innovative."},
              2:{title:"The Peacemaker",text:"Diplomatic, sensitive, nurturing, and cooperative."},
              3:{title:"The Communicator",text:"Creative, expressive, optimistic, and charismatic."},
              4:{title:"The Builder",text:"Practical, disciplined, organized, and reliable."},
              5:{title:"The Adventurer",text:"Adventurous, freedom-loving, dynamic, and curious."},
              6:{title:"The Nurturer",text:"Caring, responsible, harmonious, and family-oriented."},
              7:{title:"The Seeker",text:"Intellectual, spiritual, introspective, and analytical."},
              8:{title:"The Powerhouse",text:"Ambitious, determined, powerful, and business-minded."},
              9:{title:"The Humanitarian",text:"Compassionate, idealistic, humanitarian, and courageous."},
              11:{title:"The Visionary",text:"The intuitive visionary with heightened spiritual insight and charismatic leadership. A psychic number with deep emotional sensitivity and inspirational power."},
              22:{title:"The Master Builder",text:"The master builder who turns dreams into reality through practical and visionary skills. Ambitious and determined, with the ability to create lasting positive change."},
              33:{title:"The Master Teacher",text:"The master teacher and healer driven by compassion and selfless service. Embodies spiritual wisdom and uplifts humanity through love and guidance."}};
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

    // --- CORRECT 4-COLUMN (Text|Icon|Text|Icon) GRID ---
    function createGridChecklistCard(title, items, delay) {
        let listHTML = '';
        (items || []).forEach(item => {
            const icon = item.isCompliant ? '<span class="text-green-400 font-bold text-xl">✔</span>' : '<span class="text-red-400 font-bold text-xl">✘</span>';
            // Cell 1: Label (left-aligned)
            listHTML += `<div class="flex items-center justify-start p-3 bg-gray-900/30 rounded-lg min-h-[50px]">
                             <span class="text-gray-300 text-sm">${item.label}</span>
                         </div>`;
            // Cell 2: Icon (right-aligned)
            listHTML += `<div class="flex items-center justify-end p-3 bg-gray-900/30 rounded-lg min-h-[50px]">
                             ${icon}
                         </div>`;
        });
        
        // Mobile (2-col): Text (full) | Icon (auto)
        // Desktop (4-col): Text (full) | Icon (auto) | Text (full) | Icon (auto)
        return `<div class="result-card p-6" style="animation-delay: ${delay}ms;">
                    <h3 class="font-serif text-2xl text-white mb-4 text-center">${title}</h3>
                    <div class="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr_auto] gap-x-4 gap-y-2">
                        ${listHTML}
                    </div>
                </div>`;
    }

    function createStandardChecklistCard(title, items, delay) {
        let listHTML = '';
        (items || []).forEach(item => {
            const icon = item.isCompliant ? '<span class="text-green-400 font-bold text-xl">✔</span>' : '<span class="text-red-400 font-bold text-xl">✘</span>';
            listHTML += `<li class="flex w-full justify-between items-center py-3 border-b border-gray-700 last:border-b-0"><span class="text-gray-300 text-sm flex-grow">${item.label}</span><span class="flex-shrink-0 ml-3">${icon}</span></li>`;
        });
        return `<div class="result-card p-6" style="animation-delay: ${delay}ms;"><h3 class="font-serif text-2xl text-white mb-4 text-center">${title}</h3><ul class="w-full">${listHTML}</ul></div>`;
    }

    function createCard(t, v, interp, d, f='', ruler=null) {
        const isLong = t==='Master Number'||t==='Lucky Colors'||t==='Lucky Numbers', style = isLong ? 'style="white-space:normal;overflow-wrap:break-word;line-height:1.3;"' : '';
        const numClass = isLong ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl';
        return `<div class="result-card p-6" style="animation-delay:${d}ms"><div class="flex justify-between items-start mb-2"><div><p class="text-purple-300">${t}</p>${ruler?`<p class="text-sm text-purple-300 mb-2">Ruler: ${ruler.name}</p>`:''}<h3 class="font-serif text-xl text-white">${interp?.title||''}</h3></div><div class="${numClass} font-bold text-right" ${style}>${v}</div></div><p class="text-gray-400 text-sm">${interp?.text||''}</p>${f?`<div class="mt-4 pt-3 border-t border-gray-700 text-sm text-purple-200">${f}</div>`:''}</div>`;
    }

    function createLoShu(t, counts, d, expl='') {
        let trs=''; [[4,9,2],[3,5,7],[8,1,6]].forEach(row=>{ let tds=''; row.forEach(n=>{ const c=counts[n]||0; tds+=`<td class="loshu-cell ${c>0?'has-number':''} h-16 w-16 text-center text-xl align-middle p-1">${c>0?String(n).repeat(c):'&nbsp;'}</td>`; }); trs+=`<tr>${tds}</tr>`; });
        return `<div class="result-card p-6" style="animation-delay:${d}ms"><h3 class="font-serif text-2xl text-white mb-2 text-center">${t}</h3>${expl?`<p class="text-center text-sm text-gray-400 mb-4">${expl}</p>`:''}<table class="w-full border-collapse bg-gray-900/50"><tbody>${trs}</tbody></table></div>`;
    }

    // This function is inside renderFullReport
    
function formatDateWithOrdinal(dateString) {
    const dateParts = dateString.split('-').map(Number);
    // Date.UTC avoids local time zone shifts
    const date = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2])); 
    const day = date.getUTCDate();
    
    // This array is 0-indexed for [day % 10]. 
    // 0='th', 1='st', 2='nd', 3='rd', 4='th', etc.
    const suffixes = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];
    
    // This handles 11th, 12th, 13th which are always "th"
    const suffix = (day > 10 && day < 14) ? 'th' : suffixes[day % 10];
    
    const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
    const year = date.getUTCFullYear();
    return `${day}${suffix} ${month} ${year}`;
}

    let d=100, h=(t)=>`<h2 class="font-serif text-2xl text-white mt-8 mb-4 border-b border-purple-500/30 pb-2">${t}</h2>`;
    let fullName = i.firstName;
    
    if (i.middleName) {fullName += " " + i.middleName;
        }
    fullName += " " + i.lastName;

    const formattedName = fullName.toUpperCase();
    
    let html=`<div class="result-card p-6 mb-8"><h2 class="font-serif text-3xl font-bold text-white mb-4">Numerology Report for</h2><p class="text-purple-300">For: <span class="text-white">${formattedName}</span> | DOB: <span class="text-white">${formatDateWithOrdinal(i.dob)}</span></p></div>`;
    
    // --- NEW: Name Spelling Check Form ---
    const recheckFormHTML = `
    <div class="result-card p-6 mb-8" style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(139, 92, 246, 0.3);">
        <h4 class="text-xl text-purple-300 mb-4 font-serif">Try New Name Spelling</h4>
        
        <!-- UPDATED CONTAINER: Added 'flex-wrap' and 'items-center' -->
        <div class="flex flex-row flex-wrap md:flex-nowrap gap-4 items-center">
            
            <!-- UPDATED INPUTS: Added 'min-w-0' to allow shrinking -->
            <input type="text" id="recheck-fname" value="${i.firstName}" placeholder="First Name" 
                class="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 flex-1 min-w-0 w-full md:w-auto focus:outline-none focus:border-purple-500">
            
            <input type="text" id="recheck-mname" value="${i.middleName || ''}" placeholder="Middle Name" 
                class="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 flex-1 min-w-0 w-full md:w-auto focus:outline-none focus:border-purple-500">
            
            <input type="text" id="recheck-lname" value="${i.lastName}" placeholder="Last Name" 
                class="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 flex-1 min-w-0 w-full md:w-auto focus:outline-none focus:border-purple-500">
            
            <!-- UPDATED BUTTON: Added 'shrink-0' so it never gets cut off -->
            <button onclick="handleRecheckName()" 
                class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded transition-colors duration-200 shrink-0">
                Check
            </button>
        </div>
        
        <p class="text-xs text-gray-400 mt-2">Modify the spelling above to see how it affects the vibration (Total Name, Soul Urge, etc.). DOB remains unchanged.</p>
    </div>
    `;

    html += recheckFormHTML;


    // --- ADDED (Moolank) and (Bhagyank) ---
    html += h("Core Numbers Analysis") + `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">${createCard('Driver (Moolank)',r.driverNumber,ni[r.driverNumber],d+=100,'',r.driverRuler)}${createCard('Conductor (Bhagyank)',r.conductorNumber,ni[r.conductorNumber],d+=100,'',r.conductorRuler)}</div>`;
    
    const harmData = cd[r.driverNumber]?.[r.conductorNumber] || {title:"Unique Pair",type:"N/A",text:""};
    html += `<div class="mt-6">${createCard(`Core Number Harmony (${harmData.type||'N/A'})`, `${r.driverNumber}-${r.conductorNumber}`, harmData, d+=100)}</div>`;
    html += `<div class="mt-4">${createStandardChecklistCard('Harmony Checklist', r.coreHarmonyList, d+=100)}</div>`;
    // Helper to format "Total (Single)" e.g., "14 (5)"

    // --- START: Name Analysis with Breakdown in Total Name Card ---
    
    html += h('Name Numbers Analysis');
    html += '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">';
   
    // 1. Build the breakdown string for the last line
    let breakdownLine = `FName ${r.firstNameNumber}`;
    if (r.middleNameTotal > 0) { // Check if Middle Name exists
        breakdownLine += ` + MName ${r.middleNameNumber}`;
    }
    breakdownLine += ` + LName ${r.lastNameNumber}`;

    // 2. Get the original info for the Total Name card
    const originalTotalNameInfo = ni[r.fullNameNumber];

    // 3. Create a NEW info object with the added breakdown line
    const modifiedTotalNameInfo = {
        title: originalTotalNameInfo.title,
        // Append the breakdown line to the existing description
        text: originalTotalNameInfo.text + `<div class="mt-4 pt-2 border-t border-gray-700/50 text-sm text-gray-400">${breakdownLine}</div>`
    };

    // 4. Create the cards, using the MODIFIED info for Total Name
    html += createCard('Total Name', r.fullNameNumber, modifiedTotalNameInfo, d+100);
    html += createCard('Soul Urge', r.soulUrgeNumber, ni[r.soulUrgeNumber], d+100);
    html += createCard('Personality', r.personalityNumber, ni[r.personalityNumber], d+100);

    html += '</div>';
    // --- END: Name Analysis ---

    const corrTitle = r.nameCorrectionRequired === "Yes" ? "Correction Recommended" : r.nameCorrectionRequired === "Optional" ? "Correction Optional" : "Harmonious Name";
    html += `<div class="mt-6">${createCard('Name Correction Required', r.nameCorrectionRequired, {title: corrTitle, text: "See detailed checklist below."}, d+=100)}</div>`;
    html += `<div class="mt-4">${createStandardChecklistCard('Name Correction Checklist', r.nameChecklist, d+=100)}</div>`;

    html += h("Cosmic Influences") + `<div class="grid grid-cols-1 md:grid-cols-3 gap-4">${
        createCard('Zodiac Sun Sign',zs[r.zodiacSign]||'?',{title:r.zodiacSign,text:"Element"},d+=100)}${
        createCard('Kua',r.kuaNumber,ni[r.kuaNumber],d+=100)}${
        createCard('Success',r.successNumber,ni[r.successNumber],d+=100)}</div>`;

const masterNumberValue = r.masterNumber.split(' ')[0];
const masterDesc = ni[masterNumberValue] ? ni[masterNumberValue].text : "High potential.";    
html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

    ${createCard('Karmic Debt', `<span class="text-3xl md:text-4xl">${r.karmicDebt}</span>`, {title: "Indicator", text: "Past life lessons."}, d+=100)}
    ${createCard("Master Number",`<span class="text-3xl md:text-4xl">${r.masterNumber}</span>`, { title: "Indicator", text: masterDesc }, d+=100)}
</div>`;

    html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">${createCard('Lucky Numbers',r.luckyNumbers,{title:"Harmonious",text:""},d+=100)}${createCard('Lucky Colors',r.luckyColors,{title:"Vibrational",text:""},d+=100)}</div>`;

    const gridExpl = `Includes Moolank (${r.driverNumber}), Bhagyank (${r.conductorNumber}), Kua No. (${r.kuaNumber}), & Name No. (${r.fullNameNumber}).`;
    html += h("Charts & Planes Analysis") + `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">${createLoShu('Birth Chart',r.baseGridCounts,d+=100)}${createLoShu('Full Chart',r.fullGridCounts,d+=100,gridExpl)}</div>`;
    
    let warningsHTML = '';
    if (r.repetitionRemedyRequired) warningsHTML += `<span class="inline-block mx-2 mb-2">⚠ **Repeated Numbers**</span>`;
    if (r.missingNumbers && r.missingNumbers.length > 0) warningsHTML += `<span class="inline-block mx-2 mb-2">⚠ **Missing Numbers:** ${r.missingNumbers.join(', ')}</span>`;
    
    if (warningsHTML) {
        const finalWarningsText = `Remedy required for: ${warningsHTML}`.replace(/\*\*/g, '<strong>').replace(/<\/span><span/g, '</span> & <span');
        html += `<div class="text-center mb-6" style="animation-delay: ${d+=100}ms;"><div class="bg-yellow-400/10 text-yellow-400 font-semibold py-3 px-4 rounded-lg">${finalWarningsText}</div></div>`;
    }

    const planeOrder = ['Golden Rajyog (4-5-6)', 'Silver Rajyog (2-5-8)', 'Mind Plane (4-9-2)', 'Heart Plane (3-5-7)', 'Practical Plane (8-1-6)', 'Action Plane (2-7-6)', 'Will Plane (9-5-1)', 'Vision Plane (4-3-8)', '3rd Rajyog (9-5-1)', '4th Rajyog (8-1-6)'];
    let planes=[]; if(r.planesData){ planeOrder.forEach(k=>{ if(r.planesData.hasOwnProperty(k)) planes.push({label:k,isCompliant:r.planesData[k]}); }); }
    html += `<div class="mt-6">${createGridChecklistCard('Numerology Planes', planes, d+=100)}</div>`;

    if(r.mobileAnalysis!=='No mobile provided.') {
     html += `<div class="mt-6">
        ${createCard('Mobile Analysis', 
        `<span style="font-size: 1.25rem; line-height: 1.3; display: block; overflow-wrap: break-word; word-break: break-all;">${r.mobileNumber}</span>`, 
        {title:"Compatibility",text:r.mobileAnalysis}, d+=100)}
     </div>`;
    }

    if(r.carAnalysis!=='No car provided.') html+=`<div class="mt-6">${createCard('Car Analysis',`<span style="font-size: 1.75rem; line-height: 1.5rem;">${r.carNumber}</span>`,{title:"Compatibility",text:r.carAnalysis},d+=100)}</div>`;
   
   const createEmailCard = (title, data) => {
    if (!data) return '';
    const color = data.compatibility === 'Excellent' ? 'text-green-400' : 
                  (data.compatibility === 'Avoid' || data.compatibility === 'Challenging' ? 'text-red-400' : 'text-yellow-400');
    
    return `<div class="mt-6 result-card p-6 mb-4 border border-purple-500/30 rounded-lg">
        <h3 class="text-xl font-bold text-white mb-2">${title}</h3>
        <p class="text-gray-300">Email: <span class="text-white">${data.email}</span></p>
        <p class="text-gray-300">Vibration: <span class="text-purple-300 font-bold text-2xl">${data.number}</span></p>
        <p class="mt-2 text-lg">Status: <span class="${color} font-bold">${data.compatibility}</span></p>
    </div>`;
};

html += createEmailCard('Email Compatibility (Form Input)', r.emailAnalysisForm);
html += createEmailCard('Email Compatibility (Login Account)', r.emailAnalysisLogin);
    
    c.innerHTML = html + `<div class="text-center mt-8"><a href="#home" class="text-gray-400 hover:text-white">Back to Form</a></div>`;
    c.querySelectorAll('.result-card').forEach(card => void card.offsetWidth);
}

async function loadUserReports() {
    const c = document.getElementById('past-reports-container');
    c.innerHTML = '<p class="text-gray-400">Loading...</p>';
    try {
        const r = await fetch(`${API_URL}/my-reports`, {
            headers: { 'Authorization': `Bearer ${APP_STATE.token}` }
        });
        const d = await r.json();
        
        if (d.ok && d.reports.length) {
            APP_STATE.cachedReports = d.reports; 
            
            c.innerHTML = d.reports.map(r => {
                // FALLBACK: Use empty string if lastName is null/undefined
                const lastName = r.lastName || '';
                return `
                <div class="past-report-card flex justify-between items-center mb-2 p-3 bg-gray-800 rounded">
                    <div>
                        <strong class="text-white">${r.firstName} ${lastName}</strong>
                        <br>
                        <span class="text-sm text-gray-400">${r.dob}</span>
                    </div>
                    <button onclick='restoreReport(${JSON.stringify(r)})' 
                            class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors">
                        View
                    </button>
                </div>`;
            }).join('');
        } else {
            APP_STATE.cachedReports = []; 
            c.innerHTML = '<p class="text-gray-400">No reports.</p>';
        }
    } catch (e) {
        c.innerHTML = '<p class="text-red-400">Error loading reports.</p>';
    }
}

// --- IMPORTANT: This function must be OUTSIDE loadUserReports ---
function restoreReport(r) {
    sessionStorage.setItem("viewReportData", JSON.stringify(r.reportData));
    sessionStorage.setItem("viewInputsData", JSON.stringify(r.inputs));
    
    // Set global inputs so recheck works immediately
    CURRENT_REPORT_INPUTS = r.inputs;
    
    window.location.hash = "#report";
}

async function handleRecheckName() {
    if (!CURRENT_REPORT_INPUTS) return;

    // 1. Get New Values
    const newFirst = document.getElementById('recheck-fname').value.trim();
    const newMiddle = document.getElementById('recheck-mname').value.trim();
    const newLast = document.getElementById('recheck-lname').value.trim();

    if (!newFirst) {
        alert("First Name is required");
        return;
    }

    // 2. Define the inputs we are looking for
    // (Combining new name with original DOB/Gender)
    const targetPayload = {
        ...CURRENT_REPORT_INPUTS,
        firstName: newFirst,
        middleName: newMiddle,
        lastName: newLast
    };

    // 3. CACHE CHECK: Look for existing report
    // We check if we have reports loaded and if any match our target
    if (APP_STATE.cachedReports && APP_STATE.cachedReports.length > 0) {
        
        const found = APP_STATE.cachedReports.find(r => {
            const i = r.inputs;
            // Compare Name (Case Insensitive) and DOB
            return i.firstName.toLowerCase() === newFirst.toLowerCase() &&
                   (i.middleName || '').toLowerCase() === (newMiddle || '').toLowerCase() &&
                   i.lastName.toLowerCase() === newLast.toLowerCase() &&
                   i.dob === CURRENT_REPORT_INPUTS.dob;
        });

        if (found) {
            console.log("Loading from Cache/History...");
            // A. Hide Loading (if it was somehow shown)
            if(pageSections.loading) pageSections.loading.style.display = 'none';
            
            // B. Render the FOUND report immediately
            renderFullReport(found.reportData, targetPayload);
            
            // C. Show Report Section
            if(pageSections.report) pageSections.report.style.display = 'block';
            window.scrollTo(0, 0);
            
            // D. Stop here. Do NOT call API.
            return; 
        }
    }

    // 4. API CALL (Only runs if 'found' was false)
    if(pageSections.loading) pageSections.loading.style.display = 'block';
    if(pageSections.report) pageSections.report.style.display = 'none';

    apiCall('/calc', targetPayload, (d) => {
        if(pageSections.loading) pageSections.loading.style.display = 'none';

        if (d.ok) {
            if (d.reportType === 'full') {
                renderFullReport(d.report, targetPayload);
                
                // OPTIONAL: Add this new report to our local cache 
                // so if they click "Check" again immediately, it hits cache.
                if(!APP_STATE.cachedReports) APP_STATE.cachedReports = [];
                APP_STATE.cachedReports.push({
                    inputs: targetPayload,
                    reportData: d.report,
                    firstName: targetPayload.firstName,
                    lastName: targetPayload.lastName,
                    dob: targetPayload.dob
                });
                
            } else {
                renderTeaserReport(d.report);
            }
            
            if(pageSections.report) pageSections.report.style.display = 'block';
            window.scrollTo(0, 0);
            
            // Update hash if needed
            if(window.location.hash !== '#report') {
                window.location.hash = '#report';
            }

        } else {
            alert(d.error || "Error checking new name");
            if(pageSections.report) pageSections.report.style.display = 'block';
        }
    }, true);
}

// 1. Helper to display credentials at the top of the report
function showCredentials(email, password) {
    const reportSection = document.getElementById('page-report');
    
    // Check if box already exists to avoid duplicates
    const existingBox = document.getElementById('auto-cred-box');
    if(existingBox) existingBox.remove();

    // Create a credential box
    const credBox = document.createElement('div');
    credBox.id = 'auto-cred-box';
    credBox.style.background = '#f0fff4'; // Light green
    credBox.style.border = '2px solid #48bb78'; // Green border
    credBox.style.padding = '15px';
    credBox.style.marginBottom = '20px';
    credBox.style.borderRadius = '8px';
    credBox.style.textAlign = 'center';
    credBox.style.color = '#2f855a';
    
    credBox.innerHTML = `
        <h3 style="font-weight: bold; margin-bottom: 8px;">✅ Account Created / Logged In</h3>
        <p style="margin: 5px 0;"><strong>Login ID:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
        <p style="font-size: 0.9em; margin-top: 8px; color: #555;">(Please save these details for future login)</p>
    `;

    // Insert at the very top of the report section
    reportSection.insertBefore(credBox, reportSection.firstChild);
}

// 2. Helper to perform background login
async function performAutoLogin(email, password) {
    try {
        const r = await fetch(`${API_URL}/user-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const d = await r.json();
        if (r.ok) {
            setLogin(d.email, d.token); // Uses your existing setLogin function
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

// --- CHANGE PASSWORD LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const btnChangePass = document.getElementById('nav-change-pass');
    const modalChangePass = document.getElementById('modal-change-pass');
    const btnClosePassModal = document.getElementById('btn-close-pass-modal');
    const formChangePass = document.getElementById('form-change-pass');
    const msgChangePass = document.getElementById('msg-change-pass');

    // Open Modal
    if (btnChangePass) {
        btnChangePass.addEventListener('click', (e) => {
            e.preventDefault();
            closeUserMenu(); // Uses existing function to close dropdown
            modalChangePass.classList.remove('hidden');
            msgChangePass.style.display = 'none';
            formChangePass.reset();
        });
    }

    // Close Modal
    if (btnClosePassModal) {
        btnClosePassModal.addEventListener('click', () => {
            modalChangePass.classList.add('hidden');
        });
    }

    // Submit Form
    if (formChangePass) {
        formChangePass.addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldPass = e.target.oldPass.value;
            const newPass = e.target.newPass.value;
            
            // Helper to show messages inside modal
            const showMsg = (text, color) => {
                msgChangePass.textContent = text;
                msgChangePass.style.display = 'block';
                msgChangePass.style.color = color;
            };

            showMsg('Updating...', '#60a5fa'); // Blue

            try {
                // IMPORTANT: Ensure your backend has this route '/change-password'
                const res = await fetch(`${API_URL}/change-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${APP_STATE.token}`
                    },
                    body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass })
                });

                const data = await res.json();

                if (res.ok) {
                    showMsg('Password Changed Successfully!', '#4ade80'); // Green
                    // Update stored password if we are tracking it
                    if(localStorage.getItem('numerologyPass')) {
                        localStorage.setItem('numerologyPass', newPass);
                    }
                    if(APP_STATE.password) APP_STATE.password = newPass;
                    updateNavUI(); // Refresh UI

                    setTimeout(() => {
                        modalChangePass.classList.add('hidden');
                    }, 1500);
                } else {
                    showMsg(data.error || 'Failed to update password', '#f87171'); // Red
                }
            } catch (err) {
                showMsg('Network Error. Try again.', '#f87171');
            }
        });
    }
});

// --- END OF SCRIPT ---
