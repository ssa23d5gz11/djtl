const MASTER_KEY = "$2a$10$7zecodA9NGZ0ZnvpBl/toeVivas2Yaz9iRu6QZ94lr/1aq1s1C4cu";
const BIN_ID = "69c2509dc3097a1dd554b7f7";

const WH_LOGIN = "https://discordapp.com/api/webhooks/1485838219164651600/KaTa85eG5kGil6tPrlQsfQOhbCIKj6tiV8qumuO8zBEAel2XU7siKNW6WANstT-TqTzl";
const WH_SUBS = "https://discordapp.com/api/webhooks/1485840050183868521/cSS_nWhT0bnhcTRTPTNsN9_X4oGtNHEt8I81JoqnmMfrzhvUp6Q1QR32ETFrGPb6uBkp";
const WH_STATUS = "https://discordapp.com/api/webhooks/1485910281686351913/8xG_slRzVKs3Co9Iz8eC23yYBwwlIUA-9ShcvYA4cAMmqJEPmGrjxkkRjzOUNH-iba66";

let currentUser = null;
let allData = {};

window.onload = async () => {
    const session = localStorage.getItem('df_sys_session');
    if (session) {
        currentUser = JSON.parse(session);
        await syncData();
        showMain();
    } else {
        hideLoader();
        document.getElementById('auth-view').style.display = 'block';
    }
};

async function syncData() {
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, { headers: { "X-Master-Key": MASTER_KEY } });
        const json = await res.json();
        allData = json.record;
    } catch (e) { console.error("Sync Error"); }
}

async function login() {
    const name = document.getElementById('login-name').value;
    const id = document.getElementById('login-id').value;
    if(!name || !id) return alert("ادخل البيانات");
    document.getElementById('loader').style.display = 'flex';
    await syncData();
    if (allData.hasOwnProperty(id)) {
        currentUser = { name, id };
        localStorage.setItem('df_sys_session', JSON.stringify(currentUser));
        sendWH(WH_LOGIN, "تسجيل دخول المؤسس 🛂", [{name:"الاسم", value:name}, {name:"ID", value:id}], 3447003);
        showMain();
    } else {
        hideLoader();
        alert("أنت غير متصل بالنظام: الرقم غير صحيح!");
    }
}

function showMain() {
    document.getElementById('auth-view').style.display = 'none';
    document.getElementById('main-view').style.display = 'block';
    document.getElementById('user-display').innerText = `مرحباً بك أيها المؤسس العظيم ${currentUser.name}`;
    renderSubs();
    startLiveTimers();
    hideLoader();
    sendWH(WH_STATUS, "المؤسس متصل الآن 🟢", [{name:"الاسم", value:currentUser.name}], 5763719);
}

function openModal(subId = null) {
    const modal = document.getElementById('add-modal');
    if (subId) {
        const s = allData[currentUser.id].find(x => x.id === subId);
        document.getElementById('modal-title').innerText = "تعديل الطلب ✏️";
        document.getElementById('edit-id').value = s.id;
        document.getElementById('s-name').value = s.sName;
        document.getElementById('c-name').value = s.cName;
        document.getElementById('c-phone').value = s.cPhone;
        document.getElementById('c-order').value = s.orderId;
        document.getElementById('s-price').value = s.price;
        document.getElementById('c-email').value = s.email;
        document.getElementById('c-pass').value = s.pass;
    } else {
        document.getElementById('modal-title').innerText = "إنشاء طلب جديد ✅";
        document.getElementById('edit-id').value = "";
        document.querySelectorAll('.modal input').forEach(i => i.value = "");
    }
    modal.style.display = 'flex';
}

async function saveSub() {
    const editId = document.getElementById('edit-id').value;
    const phone = document.getElementById('c-phone').value;
    if(phone.length !== 10) return alert("الجوال 10 أرقام!");

    const sub = {
        id: editId ? parseInt(editId) : Date.now(),
        sName: document.getElementById('s-name').value,
        cName: document.getElementById('c-name').value,
        cPhone: phone,
        orderId: document.getElementById('c-order').value,
        price: document.getElementById('s-price').value,
        email: document.getElementById('c-email').value,
        pass: document.getElementById('c-pass').value,
        end: editId ? allData[currentUser.id].find(x => x.id == editId).end : 
             new Date().setMonth(new Date().getMonth() + parseInt(document.getElementById('s-dur').value))
    };

    if(editId) {
        const idx = allData[currentUser.id].findIndex(x => x.id == editId);
        allData[currentUser.id][idx] = sub;
    } else {
        allData[currentUser.id].unshift(sub);
    }

    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: 'PUT', headers: {"Content-Type":"application/json", "X-Master-Key":MASTER_KEY},
        body: JSON.stringify(allData)
    });

    renderSubs();
    closeModal();
    sendWH(WH_SUBS, editId ? "تعديل طلب ✏️" : "طلب جديد ✅", [{name:"بواسطة", value:currentUser.name}, {name:"الاشتراك", value:sub.sName}], 1752220);
}

async function deleteSub(id) {
    if(confirm("حذف الطلب نهائياً؟")) {
        allData[currentUser.id] = allData[currentUser.id].filter(x => x.id !== id);
        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT', headers: {"Content-Type":"application/json", "X-Master-Key":MASTER_KEY},
            body: JSON.stringify(allData)
        });
        renderSubs();
    }
}

function renderSubs() {
    const list = document.getElementById('subs-list');
    list.innerHTML = "";
    (allData[currentUser.id] || []).forEach(s => {
        list.innerHTML += `
            <div class="sub-card">
                <div class="card-actions">
                    <button class="btn-icon btn-edit" onclick="openModal(${s.id})"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-icon btn-delete" onclick="deleteSub(${s.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
                <h3>${s.sName}</h3>
                <p>العميل: <b>${s.cName}</b> | جوال: <b>${s.cPhone}</b></p>
                <p>الطلب: <b>#${s.orderId}</b> | السعر: <b>${s.price}</b></p>
                <p>الحساب: <b>${s.email}</b> | الباسورد: <b>${s.pass}</b></p>
                <div class="live-timer" data-end="${s.end}"></div>
            </div>`;
    });
}

function startLiveTimers() {
    setInterval(() => {
        document.querySelectorAll('.live-timer').forEach(t => {
            const dist = t.dataset.end - Date.now();
            if(dist < 0) { t.innerHTML = "منتهي ⚠️"; return; }
            const d = Math.floor(dist/86400000), h = Math.floor((dist%86400000)/3600000), m = Math.floor((dist%3600000)/60000), s = Math.floor((dist%60000)/1000);
            t.innerHTML = `<div class="timer-unit">${d}<span>يوم</span></div><div class="timer-unit">${h}<span>ساعة</span></div><div class="timer-unit">${m}<span>دقيقة</span></div><div class="timer-unit">${s}<span>ثانية</span></div>`;
        });
    }, 1000);
}

function sendWH(url, title, fields, color) {
    fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ embeds: [{ title, fields, color, timestamp: new Date() }] }) });
}

function logout() { localStorage.removeItem('df_sys_session'); location.reload(); }
function hideLoader() { document.getElementById('loader').style.display = 'none'; }
function closeModal() { document.getElementById('add-modal').style.display = 'none'; }
