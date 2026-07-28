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
const audio = new Audio("https://www.myinstants.com/media/sounds/cuckoo-clock-alarm.mp3");
let i0 = null;
let i1 = null;

auth.onAuthStateChanged(user => {
    if (user) {
        i0 = setInterval(() => {
            let date = new Date();
            if (date.getHours() < 12) {date.setHours(0, 0, 0, 0);}
            else {date.setHours(12, 0, 0, 0);}
            date = date.getTime()
            db.ref("/lastLogin").get().then(s0 => {
                if (date - s0.val() >= 43200000) {
                    db.ref().update({
                        "/firstPeriod": 15,
                        "/secondPeriod": 15,
                        "/lastLogin": date
                    }).then(() => {
                        location.reload();
                    });
                }
            });
        }, 500);
        i1 = setInterval(() => {
            db.ref("/releaseEnd").get().then(s0 => {
                if (s0.val() > 0 && s0.val() < Date.now()) {
                    document.getElementById('alarm').style.display = 'flex';
                    if (audio.paused) {audio.play();}
                }
            });
        }, 500);
        document.getElementById('login').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        refreshAvailability();
    } else {
        document.getElementById('app').style.display = 'none';
        document.getElementById('login').style.display = 'block';
    }
});

document.getElementById('loginBtn').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (email && password) {
        document.getElementById('login').querySelectorAll('input').forEach(e => {e.value = '';})
        auth.signInWithEmailAndPassword(email, password).catch(err => {alert(err.message);});
    } else {alert('You have to fill both fields!')}
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    clearInterval(i0);
    i0 = null;
    clearInterval(i1);
    i1 = null;
    auth.signOut();});

document.getElementById('refreshBtn').addEventListener('click', () => {location.reload();});

document.getElementById('releaseBtn').addEventListener('click', () => {
    Promise.all([
        db.ref("/firstPeriod").get(),
        db.ref("/secondPeriod").get(),
    ]).then(([s0, s1]) => {
        let d = null
        if (s0.val() > 0) {
            d = {
            "/releaseEnd": Date.now() + s0.val()*60*1000,
            "/firstPeriod": 0,};
        } else {
            d = {
            "/releaseEnd": Date.now() + s1.val()*60*1000,
            "/secondPeriod": 0,};
        }
        db.ref().update(d).then(() => {
            refreshAvailability();
        });
    });
});

document.getElementById('punishBtn').addEventListener('click', () => {
    document.getElementById('availability').style.display = 'none';
    document.getElementById('punish').style.display = 'block';
});

document.getElementById('okBtn').addEventListener('click', () => {
    const punishmentTime = parseInt(document.getElementById("time").value, 10);
    if (punishmentTime) {
        Promise.all([
            db.ref("/firstPeriod").get(),
            db.ref("/secondPeriod").get(),
        ]).then(([s0, s1]) => {
            const firstPeriod = s0.val()
            const secondPeriod = s1.val()
            if (firstPeriod + secondPeriod - punishmentTime >= 0) {
                let d = null
                if (punishmentTime === firstPeriod + secondPeriod) {
                    d = {
                    "/firstPeriod": 0,
                    "/secondPeriod": 0,};
                } else if (punishmentTime > firstPeriod) {
                    d = {
                    "/firstPeriod": 0,
                    "/secondPeriod": secondPeriod - punishmentTime + firstPeriod,}
                } else {
                    d = {"/firstPeriod": firstPeriod - punishmentTime}
                }
                db.ref().update(d).then(() => {
                    document.getElementById("time").value = '';
                    document.getElementById('punish').style.display = 'none';
                    refreshAvailability();
                });
            } else {
                alert('Punishment time is too long!')
            }
        });
    } else {
        alert('No value entered')
    }
});

document.getElementById('cancelBtn').addEventListener('click', () => {
    document.getElementById("time").value = ''
    document.getElementById('punish').style.display = 'none';
    document.getElementById('availability').style.display = 'block';
});

function refreshAvailability() {
    document.getElementById('releaseBtn').style.display = 'none';
    document.getElementById('punishBtn').style.display = 'none';
    document.getElementById('availability').style.display = 'block';
    const el = document.getElementById('availability').querySelector('p')
    el.innerHTML = "<span class='centered0'>LOADING&nbsp;&nbsp;&nbsp;</span>"
    let i = setInterval(() => {
        const content = el.innerText.replace(/\u00A0/g, '');
        const nb = (el.innerText.match(/\u00A0/g) || []).length - 1
        if (!(content === 'LOADING...')) {
            el.innerHTML = `<span class='centered0'>${content+'.'+'\u00A0'.repeat(nb)}</span>`
        } else {
            el.innerHTML = `<span class='centered0'>LOADING&nbsp;&nbsp;&nbsp;</span>`
        }
    }, 150);
    Promise.all([
        db.ref("/firstPeriod").get(),
        db.ref("/secondPeriod").get(),
        db.ref("/lastLogin").get(),
        db.ref("/releaseEnd").get()
    ]).then(([s0, s1, s2, s3]) => {
        const firstPeriod = s0.val();
        const secondPeriod = s1.val();
        const dayName = new Date(s2.val()).toLocaleDateString('en-US', { weekday: 'long' });
        const daydate = new Date(s2.val()).toLocaleDateString('en-CA');
        const releaseEnd = s3.val()
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
        clearInterval(i)
        i = null
        el.innerHTML = text
        if (!(firstPeriod === 0 && secondPeriod === 0)) {
            document.getElementById('punishBtn').style.display = 'inline-block';
            if (releaseEnd === 0) {
                document.getElementById('releaseBtn').style.display = 'inline-block';
            }
        }
        document.getElementById('availability').style.display = 'block';
    });
}

document.getElementById('pauseAudioBtn').addEventListener('click', () => {
        db.ref("/releaseEnd").set(0).then(() => {
            document.getElementById('alarm').style.display = 'none';
            audio.pause();
            audio.currentTime = 0;
            refreshAvailability();
        });
});