// --- إعدادات الربط السحابي (المفتاح الخاص بك) ---
const MASTER_KEY = "$2a$10$7zecodA9NGZ0ZnvpBl/toeVivas2Yaz9iRu6QZ94lr/1aq1s1C4cu";
const BIN_ID = "65fc068e2662a24a873c3686"; // ملاحظة: يفضل إنشاء BIN جديد ووضع رقمه هنا لتجنب التداخل
const WH_SUBS = "https://discordapp.com/api/webhooks/1485840050183868521/cSS_nWhT0bnhcTRTPTNsN9_X4oGtNHEt8I81JoqnmMfrzhvUp6Q1QR32ETFrGPb6uBkp";

// --- قائمة الموظفين المعتمدين (3 فقط) ---
const ALLOWED_USERS = [
    { name: "سامر", phone: "0500000000" },
    { name: "محمد", phone: "0511111111" },
    { name: "علي", phone: "0522222222" }
]; // غير الأرقام والأسماء حسب موظفينك

let currentUser = null;
let subscriptions = [];
let allCloudData = {};

window.onload = async () => {
    const session = localStorage.getItem('df_cloud_session');
    if (session) {
        currentUser = JSON.parse(session);
        await syncWithCloud();
        startApp();
    } else {
        hideLoader();
        showView('auth-view');
    }
};

async function syncWithCloud() {
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { "X-Master-Key": MASTER_KEY }
        });
        const json = await res.json();
        allCloudData = json.record || {};
        if (currentUser && allCloudData[currentUser.phone]) {
            subscriptions = allCloudData[currentUser.phone];
        }
    } catch (e) { console.error("Cloud Sync Failed"); }
}

async function saveToCloud() {
    try {
        allCloudData[currentUser.phone] = subscriptions;
        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: { "Content-Type": "application/json", "X-Master-Key": MASTER_KEY },
            body: JSON.stringify(allCloudData)
        });
    } catch (e) { console.error("Cloud Save Failed"); }
}

document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('login-name').value;
    const phone = document.getElementById('login-phone').value;

    // التحقق من أن الشخص من ضمن الـ 3 المعتمدين
    const isAllowed = ALLOWED_USERS.find(u => u.phone === phone && u.name === name);
    
    if (!isAllowed) {
        alert("عذراً، هذا الحساب غير مسجل في قائمة الموظفين المعتمدين.");
        return;
    }

    document.getElementById('loader').style.display = 'flex';
    currentUser = { name, phone };
    localStorage.setItem('df_cloud_session', JSON.stringify(currentUser));
    
    await syncWithCloud();
    startApp();
};

function startApp() {
    hideLoader();
    showView('main-view');
    document.getElementById('header-user-name').textContent = "مرحباً " + currentUser.name;
    renderSubs();
    setInterval(updateTimers, 1000);
}

document.getElementById('add-sub-form').onsubmit = async (e) => {
    e.preventDefault();
    const dur = parseInt(document.getElementById('s-duration').value);
    const sub = {
        id: Date.now(),
        subName: document.getElementById('s-name').value,
        cusName: document.getElementById('c-name').value,
        cusPhone: document.getElementById('c-phone').value,
        orderId: document.getElementById('c-order').value,
        price: document.getElementById('s-price').value,
        profile: document.getElementById('s-profile').value,
        type: document.getElementById('s-type').value,
        endTime: new Date().setMonth(new Date().getMonth() + dur)
    };

    subscriptions.unshift(sub);
    renderSubs();
    closeModal('add-modal');
    await saveToCloud(); // حفظ فوري في السحابة بمفتاحك الخاص
    
    // ويب هوك ديسكورد
    fetch(WH_SUBS, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ embeds: [{ title: "طلب جديد سحابي ✅", fields: [
            {name:"الموظف", value:currentUser.name}, {name:"العميل", value:sub.cusName}, {name:"السعر", value:sub.price}
        ], color: 1752220 }]})
    });
};

function renderSubs() {
    const cont = document.getElementById('subs-container');
    cont.innerHTML = '';
    subscriptions.forEach(s => {
        const div = document.createElement('div');
        div.className = 'sub-card';
        div.innerHTML = `<h3>${s.subName}</h3><p>العميل: ${s.cusName}</p><p>الطلب: #${s.orderId}</p>
                         <div class="timer-container" data-end="${s.endTime}"></div>`;
        cont.appendChild(div);
    });
}

function updateTimers() {
    document.querySelectorAll('.timer-container').forEach(box => {
        const diff = new Date(parseInt(box.dataset.end)) - Date.now();
        if (diff <= 0) { box.innerHTML = "منتهي"; return; }
        const d = Math.floor(diff/86400000), h = Math.floor((diff/3600000)%24), m = Math.floor((diff/60000)%60);
        box.innerHTML = `<span>باقي: ${d} يوم و ${h} ساعة</span>`;
    });
}

function showView(id) { document.getElementById(id).style.display = 'block'; }
function hideLoader() { document.getElementById('loader').style.display = 'none'; }
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
