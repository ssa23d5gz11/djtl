// روابط الويب هوك الخاصة بك
const WH_LOGIN = "https://discordapp.com/api/webhooks/1485838219164651600/KaTa85eG5kGil6tPrlQsfQOhbCIKj6tiV8qumuO8zBEAel2XU7siKNW6WANstT-TqTzl";
const WH_SUBS = "https://discordapp.com/api/webhooks/1485840050183868521/cSS_nWhT0bnhcTRTPTNsN9_X4oGtNHEt8I81JoqnmMfrzhvUp6Q1QR32ETFrGPb6uBkp";
const WH_STATUS = "https://discordapp.com/api/webhooks/1485910281686351913/8xG_slRzVKs3Co9Iz8eC23yYBwwlIUA-9ShcvYA4cAMmqJEPmGrjxkkRjzOUNH-iba66";

let currentUser = null;
let subscriptions = [];

// نظام التحقق الفوري عند فتح الموقع
window.onload = () => {
    const saved = localStorage.getItem('df_user_session');
    if (saved) {
        // إذا كان مسجل سابقاً، ادخله فوراً بدون شاشة تسجيل
        currentUser = JSON.parse(saved);
        startDashboard();
    } else {
        // إذا أول مرة، اظهر شاشة التسجيل
        hideLoader();
        showView('auth-view');
    }
};

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function hideLoader() { document.getElementById('loader').style.display = 'none'; }

// تسجيل الدخول الأول (حفظ دائم)
document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    currentUser = {
        name: document.getElementById('login-name').value,
        phone: document.getElementById('login-phone').value,
        id: Date.now() // معرف فريد للمتصفح
    };
    
    // الحفظ في ذاكرة المتصفح الدائمة
    localStorage.setItem('df_user_session', JSON.stringify(currentUser));
    
    await sendWH(WH_LOGIN, "تسجيل موظف جديد لأول مرة 👤", [
        { name: "الموظف", value: currentUser.name, inline: true },
        { name: "الجوال", value: currentUser.phone, inline: true },
        { name: "النظام", value: "تم حفظ بصمة الجهاز بنجاح" }
    ], 3447003);

    startDashboard();
};

async function startDashboard() {
    showView('main-view');
    document.getElementById('header-user-name').textContent = "مرحباً " + currentUser.name;
    
    // استرجاع الاشتراكات الخاصة بهذا الجهاز
    const savedSubs = localStorage.getItem(`df_data_${currentUser.phone}`);
    subscriptions = savedSubs ? JSON.parse(savedSubs) : [];
    
    renderSubs();
    hideLoader();

    // ويب هوك الاتصال (يرسل في كل مرة يفتح الموقع)
    await sendWH(WH_STATUS, "الإداري متصل الآن 🟢", [
        { name: "الاسم", value: currentUser.name },
        { name: "وقت الدخول", value: new Date().toLocaleTimeString('ar-SA') }
    ], 5763719);

    setInterval(updateTimers, 1000);
}

// إضافة اشتراك وإرسال ويب هوك كامل البيانات
document.getElementById('add-sub-form').onsubmit = async (e) => {
    e.preventDefault();
    const dur = parseInt(document.getElementById('s-duration').value);
    const end = new Date();
    end.setMonth(end.getMonth() + dur);

    const sub = {
        id: Date.now(),
        subName: document.getElementById('s-name').value,
        cusName: document.getElementById('c-name').value,
        cusPhone: document.getElementById('c-phone').value,
        orderId: document.getElementById('c-order').value,
        price: document.getElementById('s-price').value,
        profile: document.getElementById('s-profile').value,
        type: document.getElementById('s-type').value,
        email: document.getElementById('s-email').value || "لا يوجد",
        endTime: end.getTime()
    };

    subscriptions.unshift(sub);
    localStorage.setItem(`df_data_${currentUser.phone}`, JSON.stringify(subscriptions));
    
    renderSubs();
    closeModal('add-modal');
    e.target.reset();

    // ويب هوك الإضافة (الآن يرسل كل شيء)
    await sendWH(WH_SUBS, "تم إضافة اشتراك جديد بواسطة الموظف ✅", [
        { name: "الموظف", value: currentUser.name },
        { name: "الاشتراك", value: sub.subName, inline: true },
        { name: "العميل", value: sub.cusName, inline: true },
        { name: "رقم الطلب", value: sub.orderId, inline: true },
        { name: "السعر", value: sub.price + " ر.س", inline: true },
        { name: "المدة", value: dur + " شهر", inline: true },
        { name: "البروفايل", value: "بروفايل رقم " + sub.profile, inline: true },
        { name: "نوع الحساب", value: sub.type, inline: true },
        { name: "الإيميل", value: sub.email }
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
                <p>الطلب: <b>#${s.orderId}</b></p>
                <p>السعر: <b style="color:#10b981">${s.price} ر.س</b></p>
            </div>
            <div class="timer-container" data-end="${s.endTime}"></div>
        `;
        container.appendChild(div);
    });
}

function updateTimers() {
    document.querySelectorAll('.timer-container').forEach(box => {
        const diff = parseInt(box.dataset.end) - Date.now();
        if (diff <= 0) { box.innerHTML = "<b style='color:#f43f5e'>انتهت المدة</b>"; return; }
        const d = Math.floor(diff/86400000), h = Math.floor((diff/3600000)%24), m = Math.floor((diff/60000)%60), s = Math.floor((diff/1000)%60);
        box.innerHTML = `<div class="time-box"><span class="t-val">${d}</span><span class="t-lbl">يوم</span></div>
                         <div class="time-box"><span class="t-val">${h}</span><span class="t-lbl">ساعة</span></div>
                         <div class="time-box"><span class="t-val">${m}</span><span class="t-lbl">دقيقة</span></div>
                         <div class="time-box"><span class="t-val">${s}</span><span class="t-lbl">ثانية</span></div>`;
    });
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

async function sendWH(url, title, fields, color) {
    try {
        await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ embeds: [{ title, fields, color, footer: {text: "Digital Force v2.0"}, timestamp: new Date() }] })
        });
    } catch(e) { console.error("Webhook Error"); }
}
