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

let firstPeriod = null
let secondPeriod = null
let futurePunishment = null

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('login').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        document.getElementById('availability').style.display = 'block';
        refreshAvailability();
    } else {
        document.getElementById('app').style.display = 'none';
        document.getElementById('login').style.display = 'block';
    }
});

document.getElementById('loginbtn').addEventListener('click', () => {
    document.getElementById('login').querySelector('p').textContent = '';
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    document.getElementById('login').querySelectorAll('input').forEach(e => {
        e.value = "";
    })
    auth.signInWithEmailAndPassword(email, password)
        .catch(err => {
            document.getElementById('login').querySelector('p').textContent = err.message;
        });
});

document.getElementById('logoutbtn').addEventListener('click', () => {
    auth.signOut();
});

function refreshAvailability() {
    Promise.all([
        db.ref("/firstPeriod").get(),
        db.ref("/secondPeriod").get(),
        db.ref("/futurePunishment").get()
    ]).then(([s1, s2, s3]) => {
        firstPeriod = s1.val();
        secondPeriod = s2.val();
        futurePunishment = s3.val();
        if (firstPeriod > 0 && secondPeriod > 0) {
            document.getElementById('availability').querySelector('p').innerText = 
`The Device is available for 2 periods today:
The first period is ${firstPeriod} minutes.
The second period is ${secondPeriod} minutes.`;
        }
        //document.getElementById('availability').querySelector('p').innerText = `${firstPeriod} + ${secondPeriod} + ${futurePunishment}`;
    });
}