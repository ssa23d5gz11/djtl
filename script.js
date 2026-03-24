// --- إعدادات النظام المركزي ---
const MASTER_KEY = "$2a$10$7zecodA9NGZ0ZnvpBl/toeVivas2Yaz9iRu6QZ94lr/1aq1s1C4cu";
const BIN_ID = "69c24c76aa77b81da913b2f7";

// روابط الويب هوك الخاصة بك
const WH_LOGIN = "https://discordapp.com/api/webhooks/1485838219164651600/KaTa85eG5kGil6tPrlQsfQOhbCIKj6tiV8qumuO8zBEAel2XU7siKNW6WANstT-TqTzl";
const WH_SUBS = "https://discordapp.com/api/webhooks/1485840050183868521/cSS_nWhT0bnhcTRTPTNsN9_X4oGtNHEt8I81JoqnmMfrzhvUp6Q1QR32ETFrGPb6uBkp";
const WH_STATUS = "https://discordapp.com/api/webhooks/1485910281686351913/8xG_slRzVKs3Co9Iz8eC23yYBwwlIUA-9ShcvYA4cAMmqJEPmGrjxkkRjzOUNH-iba66";

let currentUser = null;
let allData = {};

// تشغيل النظام
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

// مزامنة البيانات من السحابة
async function syncData() {
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { "X-Master-Key": MASTER_KEY }
        });
        const json = await res.json();
        allData = json.record;
    } catch (e) { console.error("Cloud Sync Failed"); }
}

// تسجيل الدخول والتحقق من رقم الموظف (96, 507, 515)
async function login() {
    const name = document.getElementById('login-name').value;
    const id = document.getElementById('login-id').value;

    if(!name || !id) return alert("يرجى إدخال كافة البيانات المطلوبة");

    document.getElementById('loader').style.display = 'flex';
    await syncData();

    if (allData.hasOwnProperty(id)) {
        currentUser = { name, id };
        localStorage.setItem('df_sys_session', JSON.stringify(currentUser));
        
        // ويب هوك الدخول
        sendWebhook(WH_LOGIN, "نظام الدخول الآمن 🛂", [
            {name: "المؤسس المعتمد", value: name},
            {name: "رقم الموظف", value: id}
        ], 3447003);

        showMain();
    } else {
        hideLoader();
        alert("أنت غير متصل بالنظام: رقم الموظف غير صحيح أو غير مسجل!");
    }
}

function showMain() {
    document.getElementById('auth-view').style.display = 'none';
    document.getElementById('main-view').style.display = 'block';
    document.getElementById('user-display').innerText = `مرحباً بك أيها المؤسس العظيم ${currentUser.name}`;
    renderSubs();
    hideLoader();

    // ويب هوك حالة الاتصال
    sendWebhook(WH_STATUS, "الموظف متصل الآن بنظام ديجيتال فورس 🟢", [{name:"الاسم", value:currentUser.name}], 5763719);
}

// إضافة اشتراك جديد وحفظه سحابياً
async function addNewSub() {
    const phone = document.getElementById('c-phone').value;
    if (phone.length !== 10) return alert("خطأ: رقم جوال العميل يجب أن يكون 10 أرقام فقط!");

    const sub = {
        id: Date.now(),
        sName: document.getElementById('s-name').value,
        cName: document.getElementById('c-name').value,
        cPhone: phone,
        orderId: document.getElementById('c-order').value,
        price: document.getElementById('s-price').value,
        email: document.getElementById('c-email').value,
        pass: document.getElementById('c-pass').value,
        dur: document.getElementById('s-dur').value,
        end: new Date().setMonth(new Date().getMonth() + parseInt(document.getElementById('s-dur').value))
    };

    allData[currentUser.id].unshift(sub);
    renderSubs();
    closeModal();

    // تحديث السحابة فوراً
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json", "X-Master-Key": MASTER_KEY },
        body: JSON.stringify(allData)
    });

    // ويب هوك الطلب الجديد
    sendWebhook(WH_SUBS, "إنشاء طلب جديد بنظام ديجيتال فورس ✅", [
        {name: "الموظف", value: currentUser.name},
        {name: "الاشتراك", value: sub.sName},
        {name: "العميل", value: sub.cName},
        {name: "الحساب", value: sub.email},
        {name: "الباسورد", value: sub.pass},
        {name: "المدة", value: sub.dur + " شهر"}
    ], 1752220);
}

// عرض الاشتراكات وحساب الوقت المتبقي
function renderSubs() {
    const list = document.getElementById('subs-list');
    list.innerHTML = "";
    const myData = allData[currentUser.id] || [];
    myData.forEach(s => {
        const remaining = Math.floor((s.end - Date.now()) / 86400000);
        list.innerHTML += `
            <div class="sub-card">
                <h3>${s.sName}</h3>
                <p>العميل: <b>${s.cName}</b></p>
                <p>الجوال: <b>${s.cPhone}</b></p>
                <p>الطلب: <b>#${s.orderId}</b></p>
                <p>السعر: <b style="color:#10b981">${s.price} ر.س</b></p>
                <p>الإيميل: <b>${s.email}</b></p>
                <p>الباسورد: <b>${s.pass}</b></p>
                <div style="margin-top:10px; font-weight:900; color:#3b82f6">المتبقي: ${remaining > 0 ? remaining : 0} يوم</div>
            </div>`;
    });
}

// إرسال البيانات للديسكورد
function sendWebhook(url, title, fields, color) {
    fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ embeds: [{ title, fields, color, timestamp: new Date() }] })
    });
}

function logout() {
    localStorage.removeItem('df_sys_session');
    location.reload();
}

function hideLoader() { document.getElementById('loader').style.display = 'none'; }
function openModal() { document.getElementById('add-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('add-modal').style.display = 'none'; }
