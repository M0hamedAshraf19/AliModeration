const fbConf = {
    apiKey: 'AIzaSyD_wdSmJfQxNxvNkTSwoVu-Yd2nbzbWPsw',
    authDomain: 'moderationdb.firebaseapp.com',
    databaseURL: 'https://moderationdb-default-rtdb.firebaseio.com',
    projectId: 'moderationdb',
    storageBucket: 'moderationdb.firebasestorage.app',
    messagingSenderId: '279369179271',
    appId: '1:279369179271:web:545798f6d9b14d6c8a9822'
};
firebase.initializeApp(fbConf);
const db = firebase.database();
const auth = firebase.auth();
const audio = new Audio('https://www.myinstants.com/media/sounds/cuckoo-clock-alarm.mp3');audio.loop = true;
let i0 = null; let i1 = null; let i2 = null; let i3 = null;
let firstPeriod = null; let secondPeriod = null; let releaseEnd = null; let lastLogin = null;

const alarmEl = document.getElementById('alarm');
const loginEl = document.getElementById('login');
const appEl = document.getElementById('app');
const availabilityEl = document.getElementById('availability')
const availabilityPEl = availabilityEl.querySelector('p')

auth.onAuthStateChanged(user => {
    if (user) {
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }
        loginEl.style.display = 'none';
        appEl.style.display = 'block';
        i0 = setInterval(() => {
            const content = availabilityPEl.innerText.replace(/\u00A0/g,'');
            const nb = (availabilityPEl.innerText.match(/\u00A0/g) || []).length - 1
            if (!(content === 'LOADING...')) {
                availabilityPEl.innerHTML = `<span class='centered0'>${content+'.'+'\u00A0'.repeat(nb)}</span>`
            } else {
                availabilityPEl.innerHTML = `<span class='centered0'>LOADING&nbsp;&nbsp;&nbsp;</span>`
            }
        }, 150);
        i1 = (s) => {
            if (i2 !== null) {clearInterval(i2);i2 = null}
            firstPeriod = s.child('firstPeriod').val();
            secondPeriod = s.child('secondPeriod').val();
            releaseEnd = s.child('releaseEnd').val();
            lastLogin = s.child('lastLogin').val()
            let date = new Date();
            if (date.getHours() < 12) {date.setHours(0, 0, 0, 0)}
            else {date.setHours(12, 0, 0, 0)}
            if (date.getTime() - lastLogin < 43200000) {refreshAvailability();}
            else {lastLogin = null}
            i2 = setInterval(() => {
                let date = new Date();
                if (date.getHours() < 12) {date.setHours(0, 0, 0, 0)}
                else {date.setHours(12, 0, 0, 0)}
                date = date.getTime()
                if (date - lastLogin >= 43200000) {
                    db.ref().update({
                        '/firstPeriod': 15,
                        '/secondPeriod': 15,
                        '/lastLogin': date
                    });
                }
            }, lastLogin === null ? 10 : 60000);
            if (i3 === null) {
                i3 = setInterval(() => {
                    if (audio.paused && releaseEnd > 0 && releaseEnd < Date.now()) {
                        new Notification("Alert!", {
                            body: "The Release Period is Over!",
                            icon: "Favicon.png",
                        });
                        alarmEl.style.display = 'flex';
                        audio.play();
                    }
                }, 1000);
            }
        };
        db.ref('/').on('value', i1)
    } else {
        appEl.style.display = 'none';
        loginEl.style.display = 'block';
        email.focus()
    }
});

const email = document.getElementById('email');

loginEl.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault()
    const password = document.getElementById('password');
    let m = email.value; let p = password.value
    if (m && p) {
        auth.signInWithEmailAndPassword(m, p).catch(err => {alert(err.message)});
        email.value = ''; password.value = '';
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
    db.ref('/').off('value', i1);i1 = null;
    clearInterval(i2);i2 = null;
    clearInterval(i3);i3 = null;
    auth.signOut();
});

document.getElementById('refreshBtn').addEventListener('click', () => {location.reload()});
const releaseBtnEl = document.getElementById('releaseBtn');
const punishBtnEl = document.getElementById('punishBtn');
const punishEl = document.getElementById('punish');
const timeEl = document.getElementById('time');

releaseBtnEl.addEventListener('click', () => {
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

document.getElementById('cancelBtn').addEventListener('click', () => {
    timeEl.value = ''
    punishEl.style.display = 'none';
    availabilityEl.style.display = 'block';
});

function refreshAvailability() {
    punishEl.style.display = 'none';
    releaseBtnEl.style.display = 'none';
    punishBtnEl.style.display = 'none';
    availabilityEl.style.display = 'block';
    const dayName = new Date(lastLogin).toLocaleDateString('en-US', {weekday: 'long'});
    const daydate = new Date(lastLogin).toLocaleDateString('en-CA');
    let text = `<span class='centered1'>As of <b>${dayName}, ${daydate}</b>:</span><br>`
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
        text += `<br>The Device is currently released
It must me taken at <b>${new Date(releaseEnd).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', second: '2-digit'})}</b>`;
    }
    clearInterval(i0)
    i0 = null
    availabilityPEl.innerHTML = text
    if (!(firstPeriod === 0 && secondPeriod === 0)) {
        punishBtnEl.style.display = 'inline-block';
        if (releaseEnd === 0) {
            releaseBtnEl.style.display = 'inline-block';
        }
    }
}

document.getElementById('pauseAudioBtn').addEventListener('click', () => {
    alarmEl.style.display = 'none';
    audio.pause();
    audio.currentTime = 0;
    db.ref('/releaseEnd').set(0);
});