const WH_LOGIN = "https://discordapp.com/api/webhooks/1485838219164651600/KaTa85eG5kGil6tPrlQsfQOhbCIKj6tiV8qumuO8zBEAel2XU7siKNW6WANstT-TqTzl";
const WH_SUBS = "https://discordapp.com/api/webhooks/1485840050183868521/cSS_nWhT0bnhcTRTPTNsN9_X4oGtNHEt8I81JoqnmMfrzhvUp6Q1QR32ETFrGPb6uBkp";
const WH_STATUS = "https://discordapp.com/api/webhooks/1485910281686351913/8xG_slRzVKs3Co9Iz8eC23yYBwwlIUA-9ShcvYA4cAMmqJEPmGrjxkkRjzOUNH-iba66";

let currentUser = null;
let subscriptions = [];

// عند تشغيل الموقع
window.onload = async () => {
    const saved = localStorage.getItem('df_persistent_user');
    if (saved) {
        currentUser = JSON.parse(saved);
        startApp();
    } else {
        hideLoader();
        showView('auth-view');
    }
};

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function hideLoader() { document.getElementById('loader').style.display = 'none'; }

// تسجيل الدخول (لمرة واحدة)
document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    currentUser = {
        name: document.getElementById('login-name').value,
        phone: document.getElementById('login-phone').value,
        loginTime: new Date().toLocaleString('ar-SA')
    };
    
    localStorage.setItem('df_persistent_user', JSON.stringify(currentUser));
    
    await sendWH(WH_LOGIN, "تسجيل دخول جديد (دائم) 📱", [
        { name: "الموظف", value: currentUser.name, inline: true },
        { name: "رقم الجوال", value: currentUser.phone, inline: true },
        { name: "الحالة", value: "تم ربط الجهاز بنجاح ✅" }
    ], 3447003);

    startApp();
};

async function startApp() {
    showView('main-view');
    document.getElementById('header-user-name').textContent = currentUser.name;
    
    // سحب البيانات المخزنة لهذا الموظف تحديداً
    const data = localStorage.getItem(`subs_${currentUser.phone}`);
    subscriptions = data ? JSON.parse(data) : [];
    
    renderSubs();
    hideLoader();

    // ويب هوك الاتصال الحالي
    await sendWH(WH_STATUS, "الموظف متصل الآن 🟢", [
        { name: "الإداري", value: currentUser.name },
        { name: "وقت الدخول", value: new Date().toLocaleTimeString('ar-SA') },
        { name: "الجهاز", value: navigator.userAgent.substring(0, 50) }
    ], 3066993);

    setInterval(updateTimers, 1000);
}

// إضافة طلب
document.getElementById('add-sub-form').onsubmit = async (e) => {
    e.preventDefault();
    const duration = parseInt(document.getElementById('s-duration').value);
    const end = new Date();
    end.setMonth(end.getMonth() + duration);

    const newSub = {
        id: Date.now(),
        subName: document.getElementById('s-name').value,
        cusName: document.getElementById('c-name').value,
        cusPhone: document.getElementById('c-phone').value,
        orderId: document.getElementById('c-order').value,
        price: document.getElementById('s-price').value,
        profile: document.getElementById('s-profile').value,
        type: document.getElementById('s-type').value,
        email: document.getElementById('s-email').value || "غير متوفر",
        endTime: end.getTime()
    };

    subscriptions.unshift(newSub);
    localStorage.setItem(`subs_${currentUser.phone}`, JSON.stringify(subscriptions));
    renderSubs();
    closeModal('add-modal');
    e.target.reset();

    // ويب هوك الطلب الجديد شامل البيانات
    await sendWH(WH_SUBS, "إنشاء طلب جديد 💎", [
        { name: "الموظف المسؤول", value: currentUser.name },
        { name: "الاشتراك", value: newSub.subName, inline: true },
        { name: "العميل", value: newSub.cusName, inline: true },
        { name: "المدة", value: duration + " شهر", inline: true },
        { name: "رقم البروفايل", value: newSub.profile, inline: true },
        { name: "نوع الحساب", value: newSub.type, inline: true },
        { name: "السعر", value: newSub.price + " ر.س", inline: true }
    ], 1752220);
};

function renderSubs() {
    const container = document.getElementById('subs-container');
    container.innerHTML = '';
    document.getElementById('count-active').textContent = subscriptions.length;

    subscriptions.forEach(s => {
        const div = document.createElement('div');
        div.className = 'sub-card';
        div.innerHTML = `
            <span class="sub-tag">P-${s.profile} | ${s.type}</span>
            <h3 class="card-title">${s.subName}</h3>
            <div class="card-info">
                <p>العميل: <b>${s.cusName}</b></p>
                <p>رقم الجوال: <b>${s.cusPhone}</b></p>
                <p>رقم الطلب: <b>${s.orderId}</b></p>
                <p>السعر: <b style="color:var(--accent)">${s.price} ر.س</b></p>
            </div>
            <div class="timer-container" data-end="${s.endTime}"></div>
        `;
        container.appendChild(div);
    });
}

function updateTimers() {
    document.querySelectorAll('.timer-container').forEach(box => {
        const diff = parseInt(box.dataset.end) - Date.now();
        if (diff <= 0) { box.innerHTML = "<b style='color:var(--danger)'>منتهي</b>"; return; }
        
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff / 3600000) % 24);
        const m = Math.floor((diff / 60000) % 60);
        const s = Math.floor((diff / 1000) % 60);

        box.innerHTML = `
            <div class="time-box"><span class="t-val">${d}</span><span class="t-lbl">يوم</span></div>
            <div class="time-box"><span class="t-val">${h}</span><span class="t-lbl">ساعة</span></div>
            <div class="time-box"><span class="t-val">${m}</span><span class="t-lbl">دقيقة</span></div>
            <div class="time-box"><span class="t-val">${s}</span><span class="t-lbl">ثانية</span></div>
        `;
    });
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

async function sendWH(url, title, fields, color) {
    try {
        await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                embeds: [{
                    title, fields, color, 
                    footer: { text: "Digital Force OS" },
                    timestamp: new Date()
                }]
            })
        });
    } catch(e) {}
}
