// --- إعدادات الربط السحابي (من صورتك) ---
const MASTER_KEY = "$2a$10$7zecodA9NGZ0ZnvpBl/toeVivas2Yaz9iRu6QZ94lr/1aq1s1C4cu";
const BIN_ID = "69c24c76aa77b81da913b2f7"; // رقم الـ Bin اللي في صورتك
const WH_SUBS = "https://discordapp.com/api/webhooks/1485840050183868521/cSS_nWhT0bnhcTRTPTNsN9_X4oGtNHEt8I81JoqnmMfrzhvUp6Q1QR32ETFrGPb6uBkp";

let currentUser = null;
let allCloudData = {};

// 1. تسجيل الدخول والتحقق من الرقم
async function login() {
    const name = document.getElementById('login-name').value;
    const phone = document.getElementById('login-phone').value;

    if(!name || !phone) return alert("ادخل بياناتك كاملة");

    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { "X-Master-Key": MASTER_KEY }
        });
        const json = await res.json();
        allCloudData = json.record;

        // التحقق: هل الرقم موجود في الـ Bin اللي بالصورة؟
        if (allCloudData.hasOwnProperty(phone)) {
            currentUser = { name, phone };
            localStorage.setItem('df_session', JSON.stringify(currentUser));
            startDashboard();
        } else {
            alert("عذراً، هذا الرقم غير مسموح له بالدخول للسحابة.");
        }
    } catch (e) {
        alert("خطأ في الاتصال بالسحابة، تأكد من مفتاح الـ API");
    }
}

// 2. إضافة اشتراك وحفظه فوراً في السحابة
async function addSubscription() {
    const sub = {
        id: Date.now(),
        name: document.getElementById('s-name').value,
        customer: document.getElementById('c-name').value,
        price: document.getElementById('s-price').value,
        addedBy: currentUser.name
    };

    // إضافة الاشتراك للموظف المعين في السحابة
    allCloudData[currentUser.phone].unshift(sub);

    // تحديث السحابة (PUT) لضمان عدم ضياع البيانات
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: 'PUT',
        headers: { 
            "Content-Type": "application/json", 
            "X-Master-Key": MASTER_KEY 
        },
        body: JSON.stringify(allCloudData)
    });

    renderSubs();
    alert("تم الحفظ في السحابة بنجاح ✅");
    
    // ويب هوك ديسكورد
    fetch(WH_SUBS, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            embeds: [{
                title: "إضافة سحابية جديدة ☁️",
                fields: [
                    { name: "الموظف", value: currentUser.name },
                    { name: "الاشتراك", value: sub.name },
                    { name: "السعر", value: sub.price + " ر.س" }
                ],
                color: 3447003
            }]
        })
    });
}

// 3. عرض الاشتراكات
function renderSubs() {
    const list = document.getElementById('subs-list');
    list.innerHTML = "";
    const mySubs = allCloudData[currentUser.phone] || [];
    mySubs.forEach(s => {
        list.innerHTML += `
            <div style="background:#161b22; padding:15px; border-radius:10px; margin-top:10px; border-right:4px solid #58a6ff">
                <b>📦 ${s.name}</b><br>
                <small>العميل: ${s.customer} | السعر: ${s.price}</small>
            </div>`;
    });
}

function startDashboard() {
    document.getElementById('auth-view').style.display = 'none';
    document.getElementById('main-view').style.display = 'block';
    document.getElementById('welcome-msg').innerText = "مرحباً " + currentUser.name;
    renderSubs();
}
