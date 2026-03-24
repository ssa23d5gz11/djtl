// روابط الويب هوك (Webhooks)
const WH_LOGIN = "https://discordapp.com/api/webhooks/1485838219164651600/KaTa85eG5kGil6tPrlQsfQOhbCIKj6tiV8qumuO8zBEAel2XU7siKNW6WANstT-TqTzl";
const WH_SUBS = "https://discordapp.com/api/webhooks/1485840050183868521/cSS_nWhT0bnhcTRTPTNsN9_X4oGtNHEt8I81JoqnmMfrzhvUp6Q1QR32ETFrGPb6uBkp";
const WH_STATUS = "https://discordapp.com/api/webhooks/1485910281686351913/8xG_slRzVKs3Co9Iz8eC23yYBwwlIUA-9ShcvYA4cAMmqJEPmGrjxkkRjzOUNH-iba66";

let currentUser = null;
let subscriptions = [];

// دالة التشغيل الفوري والتحقق من البصمة
window.addEventListener('load', () => {
    const session = localStorage.getItem('df_persistent_session');
    
    if (session) {
        // إذا المسجل موجود، افتح النظام فوراً
        currentUser = JSON.parse(session);
        initDashboard();
    } else {
        // إذا غير موجود، اظهر شاشة التسجيل
        document.getElementById('loader').style.display = 'none';
        document.getElementById('auth-view').style.display = 'block';
    }
});

// تسجيل الدخول وحفظ البيانات للأبد
document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    
    currentUser = {
        name: document.getElementById('login-name').value,
        phone: document.getElementById('login-phone').value,
        loginDate: new Date().toLocaleString('ar-SA')
    };
    
    // حفظ البصمة في المتصفح
    localStorage.setItem('df_persistent_session', JSON.stringify(currentUser));
    
    await sendToDiscord(WH_LOGIN, "تسجيل موظف (أول مرة) 📱", [
        { name: "الإداري", value: currentUser.name },
        { name: "الجوال", value: currentUser.phone }
    ], 3447003);

    initDashboard();
};

async function initDashboard() {
    // تبديل الواجهات
    document.getElementById('auth-view').style.display = 'none';
    document.getElementById('main-view').style.display = 'block';
    document.getElementById('header-user-name').textContent = "مرحباً " + currentUser.name;
    
    // تحميل البيانات المرتبطة بهذا الموظف
    const savedData = localStorage.getItem(`data_v2_${currentUser.phone}`);
    subscriptions = savedData ? JSON.parse(savedData) : [];
    
    renderSubs();
    document.getElementById('loader').style.display = 'none';

    // ويب هوك الاتصال الحالي
    await sendToDiscord(WH_STATUS, "الإداري متصل الآن 🟢", [
        { name: "الاسم", value: currentUser.name },
        { name: "الوقت", value: new Date().toLocaleTimeString('ar-SA') }
    ], 5763719);

    setInterval(updateTimers, 1000);
}

// إضافة اشتراك وإرسال الويب هوك الشامل
document.getElementById('add-sub-form').onsubmit = async (e) => {
    e.preventDefault();
    const durationMonths = parseInt(document.getElementById('s-duration').value);
    const expireDate = new Date();
    expireDate.setMonth(expireDate.getMonth() + durationMonths);

    const subData = {
        id: Date.now(),
        subName: document.getElementById('s-name').value,
        cusName: document.getElementById('c-name').value,
        cusPhone: document.getElementById('c-phone').value,
        orderId: document.getElementById('c-order').value,
        price: document.getElementById('s-price').value,
        profile: document.getElementById('s-profile').value,
        accType: document.getElementById('s-type').value,
        email: document.getElementById('s-email').value || "لا يوجد",
        endTime: expireDate.getTime()
    };

    subscriptions.unshift(subData);
    localStorage.setItem(`data_v2_${currentUser.phone}`, JSON.stringify(subscriptions));
    
    renderSubs();
    closeModal('add-modal');
    e.target.reset();

    // إرسال كافة البيانات للدسكورد
    await sendToDiscord(WH_SUBS, "تم إنشاء طلب جديد ✅", [
        { name: "الموظف", value: currentUser.name },
        { name: "الاشتراك", value: subData.subName, inline: true },
        { name: "العميل", value: subData.cusName, inline: true },
        { name: "رقم الطلب", value: "#" + subData.orderId, inline: true },
        { name: "السعر", value: subData.price + " ر.س", inline: true },
        { name: "المدة", value: durationMonths + " شهر", inline: true },
        { name: "البروفايل", value: "رقم " + subData.profile, inline: true },
        { name: "نوع الحساب", value: subData.accType, inline: true },
        { name: "إيميل العميل", value: subData.email }
    ], 1752220);
};

function renderSubs() {
    const list = document.getElementById('subs-container');
    list.innerHTML = '';
    document.getElementById('count-active').textContent = subscriptions.length;

    subscriptions.forEach(s => {
        const card = document.createElement('div');
        card.className = 'sub-card';
        card.innerHTML = `
            <span class="sub-tag">P-${s.profile} | ${s.accType}</span>
            <h3 class="card-title">${s.subName}</h3>
            <div class="card-info">
                <p>العميل: <b>${s.cusName}</b></p>
                <p>الطلب: <b>#${s.orderId}</b></p>
                <p>السعر: <b style="color:#10b981">${s.price} ر.س</b></p>
            </div>
            <div class="timer-container" data-end="${s.endTime}"></div>
        `;
        list.appendChild(card);
    });
}

function updateTimers() {
    document.querySelectorAll('.timer-container').forEach(box => {
        const diff = parseInt(box.dataset.end) - Date.now();
        if (diff <= 0) { box.innerHTML = "<b style='color:#f43f5e'>انتهى الاشتراك</b>"; return; }
        
        const d = Math.floor(diff/86400000), h = Math.floor((diff/3600000)%24), m = Math.floor((diff/60000)%60), s = Math.floor((diff/1000)%60);
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

async function sendToDiscord(url, title, fields, color) {
    try {
        await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                embeds: [{
                    title, fields, color,
                    footer: { text: "Digital Force OS - Secure Session" },
                    timestamp: new Date()
                }]
            })
        });
    } catch(err) { console.error("Discord Error"); }
}
