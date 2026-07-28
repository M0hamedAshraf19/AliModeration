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
            let day = new Date().setUTCHours(0, 0, 0, 0)
            db.ref("/lastLogin").get().then(s0 => {
                if (day - s0.val() >= 43200000) {
                    db.ref().update({
                        "/firstPeriod": 15,
                        "/secondPeriod": 15,
                        "/lastLogin": day
                    }).then(() => {
                        location.reload();
                    });
                }
            });
        }, 500);
        i1 = setInterval(() => {
            db.ref("/releaseEnd").get().then(s0 => {
                if (s0.val() > 0 && s0.val() < Date.now()) {
                    document.getElementById('alarm').style.display = 'block';
                    if (audio.paused) {
                        audio.play();
                    }
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
    document.getElementById('login').querySelector('p').textContent = '';
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (email && password) {
        document.getElementById('login').querySelectorAll('input').forEach(e => {
            e.value = '';
        })
        auth.signInWithEmailAndPassword(email, password).catch(err => {
            document.getElementById('login').querySelector('p').textContent = err.message;
        });
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
                    d = {"/firstPeriod": firstPeriod - punishmentTime,}
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
    document.getElementById('availability').querySelector('p').innerText = 'LOADING'
    let i = setInterval(() => {
        if (!(document.getElementById('availability').querySelector('p').innerText === 'LOADING...')) {
            document.getElementById('availability').querySelector('p').innerText += '.'
        } else {
            document.getElementById('availability').querySelector('p').innerText = 'LOADING'
        }
    }, 200);
    document.getElementById('releaseBtn').style.display = 'none';
    document.getElementById('punishBtn').style.display = 'none';
    document.getElementById('availability').style.display = 'block';
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
        let text = `As of ${dayName}, ${daydate}:\n`
        if (firstPeriod > 0 && secondPeriod > 0) {
            text += `The Device is available for 2 periods:
The first period is ${firstPeriod} minutes long.
The second period is ${secondPeriod} minutes long.`;
        } else if (firstPeriod > 0) {
            text += `The Device is available for 1 period:
That period is ${firstPeriod} minutes long.`;
        } else if (secondPeriod > 0) {
            text += `The Device is available for 1 period:
That period is ${secondPeriod} minutes long.`;
        } else {
            text += `The Device is no longer available.`;
        }
        if (releaseEnd > 0) {
            text += `\nThe Device is currently released
It must me taken at ${new Date(releaseEnd).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', second: '2-digit'})}`;
        }
        clearInterval(i)
        i = null
        document.getElementById('availability').querySelector('p').innerText = text
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