if ('serviceWorker' in navigator) {navigator.serviceWorker.register('SW.js');}
function getCookie(name) {
    const cookie=document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return cookie ? cookie[2] : null;
}
function setCookie(name, value='', expires=null) {
    if (expires) {
        document.cookie=`${name}=${value}; expires=${expires.toUTCString()}; path=${window.location.pathname}`
    } else {
        document.cookie=`${name}=${value}; path=${window.location.pathname}`
    }
}
function browseCookies() {
    document.cookie.split('; ').forEach(function(cookie) {
        console.log(cookie)
    });
}
const fbConf = {
    apiKey: 'AIzaSyD_wdSmJfQxNxvNkTSwoVu-Yd2nbzbWPsw',
    authDomain: 'moderationdb.firebaseapp.com',
    databaseURL: 'https://moderationdb-default-rtdb.firebaseio.com',
    projectId: 'moderationdb',
    storageBucket: 'moderationdb.firebasestorage.app',
    messagingSenderId: '279369179271',
    appId: '1:279369179271:web:545798f6d9b14d6c8a9822'
};
firebase.initializeApp(fbConf); const db = firebase.database(); const auth = firebase.auth();
let setPage = null;
let loadingTimer = null;
let dailyRefreshTimer = null;
let alarmTimer = null;
let firstPeriod = null;
let secondPeriod = null;
let releaseEnd = null;
let lastLogin = null;
const loginEl = document.getElementById('login');
const email = document.getElementById('email');
const appEl = document.getElementById('app');
const availabilityEl = document.getElementById('availability');
const availabilityPEl = availabilityEl.querySelector('p');
const punishBtnEl = document.getElementById('punishBtn');
const punishEl = document.getElementById('punish');
const timeEl = document.getElementById('time');
const releaseBtnEl = document.getElementById('releaseBtn');
const alarmEl = document.getElementById('alarm');

function loadingScr() {
    if (loadingTimer === null) {
        loginEl.style.display = 'none'; appEl.style.display = 'block';
        loadingTimer = setInterval(() => {
            const content = availabilityPEl.innerText.replace(/\u00A0/g,'');
            const nb = (availabilityPEl.innerText.match(/\u00A0/g) || []).length - 1
            if (!(content === 'LOADING...')) {
                availabilityPEl.innerHTML = `<span class='centered0'>${content+'.'+'\u00A0'.repeat(nb)}</span>`
            } else {
                availabilityPEl.innerHTML = `<span class='centered0'>LOADING&nbsp;&nbsp;&nbsp;</span>`
            }
        }, 150);
    }
}

function getLoginDate() {
    let date = new Date();
    if (date.getHours() < 12) {date.setHours(0, 0, 0, 0)}
    else {date.setHours(12, 0, 0, 0)}
    return date.getTime()
}

if (getCookie('loggedin') === 'True') {loadingScr()}
else {email.focus();}
auth.onAuthStateChanged(user => { if (user) {
    console.log('Hi')
    setCookie('loggedin', 'True');
    setPage = (s) => {
        lastLogin = s.child('lastLogin').val()
        let date0 = getLoginDate()
        if (date0 - lastLogin >= 43200000) {
            console.log('l0')
            db.ref().update({
                '/firstPeriod': 15,
                '/secondPeriod': 15,
                '/lastLogin': date0
            });
            return;
        }
        firstPeriod = s.child('firstPeriod').val(); secondPeriod = s.child('secondPeriod').val(); releaseEnd = s.child('releaseEnd').val();
        if (dailyRefreshTimer === null) {
            dailyRefreshTimer = setInterval(() => {
                let date1 = getLoginDate()
                if (date1 - lastLogin >= 43200000) {
                    console.log('l1')
                    db.ref().update({
                        '/firstPeriod': 15,
                        '/secondPeriod': 15,
                        '/lastLogin': date1
                    });
                }
            }, 60000);
        }
        if (alarmTimer === null) {
            alarmTimer = setInterval(async () => {
                if (alarmEl.style.display !== 'flex' && releaseEnd > 0 && releaseEnd < Date.now()) {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.showNotification("Alert!", {
                        body: "The Release Period is Over!",
                        icon: "Favicon.png",
                    });
                    alarmEl.style.display = 'flex';
                }
            }, 1000);
        }
        refreshAvailability();
    };
    db.ref('/').on('value', setPage)
}})

loginEl.querySelector('form').addEventListener('submit', async function(e) {
    e.preventDefault()
    const password = document.getElementById('password');
    let m = email.value; let p = password.value
    if (m && p) {
        loadingScr()
        if (Notification.permission === "default") {
            await Notification.requestPermission();
        }
        auth.signInWithEmailAndPassword(m, p)
        .catch(err => {
            clearInterval(loadingTimer); loadingTimer = null
            if (err.message === 'Firebase: Error (auth/invalid-login-credentials).') {
                alert("Invalid Credentials!")
            } else {
                alert(err.message)
            }
            appEl.style.display = 'none'; loginEl.style.display = 'block';
        });
    } else {
        if (m) {
            alert('You have to fill the passowrd field!')
        } else if (p) {
            alert('You have to fill the email field!')
        } else{
            alert("You haven't filled any of the fields!")
        }
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    setCookie('loggedin', '', new Date(0))
    auth.signOut();
    location.reload()
});

document.getElementById('refreshBtn').addEventListener('click', () => {location.reload()});

releaseBtnEl.addEventListener('click', () => {
    availabilityEl.style.display = 'none';
    let d = null
    if (firstPeriod > 0) {
        d = {
        '/releaseEnd': Date.now() + firstPeriod*60*1000,
        '/firstPeriod': 0,};
    } else {
        d = {
        '/releaseEnd': Date.now() + secondPeriod*60*1000,
        '/secondPeriod': 0,};
    }
    db.ref().update(d)
});

punishBtnEl.addEventListener('click', () => {
    availabilityEl.style.display = 'none';
    punishEl.style.display = 'block';
    timeEl.focus();
});

punishEl.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault()
    let punishmentTime = timeEl.value
    if (punishmentTime) {
        if (punishmentTime = parseInt(punishmentTime, 10)) {
            timeEl.value = '';
            if (firstPeriod + secondPeriod - punishmentTime >= 0) {
                punishEl.style.display = 'none';
                let d;
                if (punishmentTime === firstPeriod + secondPeriod) {
                    d = {
                    '/firstPeriod': 0,
                    '/secondPeriod': 0,};
                } else if (punishmentTime > firstPeriod) {
                    d = {
                    '/firstPeriod': 0,
                    '/secondPeriod': secondPeriod - punishmentTime + firstPeriod,}
                } else {
                    d = {'/firstPeriod': firstPeriod - punishmentTime}
                }
                db.ref().update(d)
            } else {
                alert('Punishment time is too long!')
            }
        } else {
            alert('You have to enter an integar bigger than 0!')
        }
    } else {
        alert('You have to enter a value!')
    }
})

document.getElementById('cancelBtn').addEventListener('click', function(e) {
    e.preventDefault()
    timeEl.value = ''
    punishEl.style.display = 'none';
    availabilityEl.style.display = 'block';
});

function refreshAvailability() {
    console.log('Refreshed')
    const dayName = new Date(lastLogin).toLocaleDateString('en-US', {weekday: 'long'});
    const daydate = new Date(lastLogin).toLocaleDateString('en-CA');
    let title = `<span class='centered1'>As of <b>${dayName}, ${daydate}</b>:</span><br>`
    let text = ''
    if (firstPeriod > 0 && secondPeriod > 0) {
        text += `The Device is available for <b>2</b> periods:<br>
The first period is <b>${firstPeriod}</b> ${firstPeriod > 1 ? 'minutes' : 'minute'} long.<br>
The second period is <b>${secondPeriod}</b> ${secondPeriod > 1 ? 'minutes' : 'minute'} long.`;
    } else if (firstPeriod > 0) {
        text += `The Device is available for <b>1</b> period:<br>
That period is <b>${firstPeriod}</b> ${firstPeriod > 1 ? 'minutes' : 'minute'} long.`;
    } else if (secondPeriod > 0) {
        text += `The Device is available for <b>1</b> period:<br>
That period is <b>${secondPeriod}</b> ${secondPeriod > 1 ? 'minutes' : 'minute'} long.`;
    } else {
        text += `The Device is <b>no longer</b> available.`;
    }
    if (releaseEnd > 0) {
        text = `The Device is currently released.<br>
It must me taken at <b>${new Date(releaseEnd).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', second: '2-digit'})}</b>.<br>` + text;
    }
    if (!(firstPeriod === 0 && secondPeriod === 0)) {
        punishBtnEl.style.display = 'inline-block';
        if (releaseEnd === 0) {
            releaseBtnEl.style.display = 'inline-block';
        } else {
            releaseBtnEl.style.display = 'none';
        }
    } else {
        punishBtnEl.style.display = 'none'; releaseBtnEl.style.display = 'none';
    }
    clearInterval(loadingTimer); loadingTimer = null
    availabilityPEl.innerHTML = title + text
    availabilityEl.style.display = 'block';
}

document.getElementById('pauseAlarmBtn').addEventListener('click', () => {
    alarmEl.style.display = 'none';
    db.ref('/releaseEnd').set(0);
});