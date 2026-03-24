const WEBHOOK_LOGS = "https://discordapp.com/api/webhooks/1485838219164651600/KaTa85eG5kGil6tPrlQsfQOhbCIKj6tiV8qumuO8zBEAel2XU7siKNW6WANstT-TqTzl";
const WEBHOOK_SUBS = "https://discordapp.com/api/webhooks/1485840050183868521/cSS_nWhT0bnhcTRTPTNsN9_X4oGtNHEt8I81JoqnmMfrzhvUp6Q1QR32ETFrGPb6uBkp";

let employee = null;
let subs = [];

document.addEventListener('DOMContentLoaded', () => {
    const savedEmp = localStorage.getItem('df_emp_v2');
    if (savedEmp) {
        employee = JSON.parse(savedEmp);
        loadDashboard();
    } else {
        showView('welcome-view');
    }
});

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// دخول الموظف
document.getElementById('employee-form').onsubmit = async (e) => {
    e.preventDefault();
    employee = { name: document.getElementById('emp-name').value, id: document.getElementById('emp-id').value };
    localStorage.setItem('df_emp_v2', JSON.stringify(employee));
    
    await sendDiscord(WEBHOOK_LOGS, "تسجيل دخول إداري 👤", [
        { name: "الإداري", value: employee.name, inline: true },
        { name: "الرقم الوظيفي", value: employee.id, inline: true }
    ], 3447003);
    
    loadDashboard();
};

function loadDashboard() {
    showView('dashboard-view');
    document.getElementById('display-emp-name').textContent = employee.name;
    const data = localStorage.getItem(`df_subs_v2_${employee.id}`);
    subs = data ? JSON.parse(data) : [];
    renderSubs();
    setInterval(updateTimers, 1000);
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// إضافة اشتراك
document.getElementById('subscription-form').onsubmit = async (e) => {
    e.preventDefault();
    const newSub = {
        id: Date.now(),
        subName: document.getElementById('sub-name').value,
        cusName: document.getElementById('cus-name').value,
        cusPhone: document.getElementById('cus-phone').value,
        cusOrder: document.getElementById('cus-order').value,
        price: document.getElementById('sub-price').value,
        duration: document.getElementById('sub-duration').value,
        email: document.getElementById('sub-email').value || "لا يوجد",
        profile: document.getElementById('sub-profile').value,
        accType: document.getElementById('sub-private').value,
        endTime: new Date().setMonth(new Date().getMonth() + parseInt(document.getElementById('sub-duration').value))
    };
    
    subs.unshift(newSub);
    saveData();
    renderSubs();
    closeModal('add-sub-modal');
    e.target.reset();

    await sendDiscord(WEBHOOK_SUBS, "إنشاء اشتراك جديد 💎", [
        { name: "بواسطة الموظف", value: employee.name },
        { name: "الاشتراك", value: newSub.subName, inline: true },
        { name: "العميل", value: newSub.cusName, inline: true },
        { name: "البروفايل", value: newSub.profile, inline: true },
        { name: "نوع الحساب", value: newSub.accType, inline: true },
        { name: "السعر", value: newSub.price + " ر.س", inline: true },
        { name: "رقم الطلب", value: newSub.cusOrder, inline: true }
    ], 3066993);
};

// حذف اشتراك
async function deleteSub(id) {
    if(confirm('سيتم حذف بيانات العميل نهائياً، هل أنت متأكد؟')) {
        const item = subs.find(s => s.id === id);
        subs = subs.filter(s => s.id !== id);
        saveData();
        renderSubs();
        await sendDiscord(WEBHOOK_SUBS, "حذف عميل 🗑️", [
            { name: "الموظف", value: employee.name },
            { name: "العميل المحذوف", value: item.cusName }
        ], 15158332);
    }
}

// تعديل شامل
function openEdit(id) {
    const s = subs.find(item => item.id === id);
    document.getElementById('edit-id').value = s.id;
    document.getElementById('edit-sub-name').value = s.subName;
    document.getElementById('edit-cus-name').value = s.cusName;
    document.getElementById('edit-cus-phone').value = s.cusPhone;
    document.getElementById('edit-cus-order').value = s.cusOrder;
    document.getElementById('edit-sub-price').value = s.price;
    document.getElementById('edit-sub-email').value = s.email;
    document.getElementById('edit-sub-profile').value = s.profile;
    document.getElementById('edit-sub-private').value = s.accType;
    openModal('edit-sub-modal');
}

document.getElementById('edit-form').onsubmit = async (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('edit-id').value);
    const idx = subs.findIndex(s => s.id === id);
    
    // تحديث كل القيم
    subs[idx].subName = document.getElementById('edit-sub-name').value;
    subs[idx].cusName = document.getElementById('edit-cus-name').value;
    subs[idx].cusPhone = document.getElementById('edit-cus-phone').value;
    subs[idx].cusOrder = document.getElementById('edit-cus-order').value;
    subs[idx].price = document.getElementById('edit-sub-price').value;
    subs[idx].email = document.getElementById('edit-sub-email').value;
    subs[idx].profile = document.getElementById('edit-sub-profile').value;
    subs[idx].accType = document.getElementById('edit-sub-private').value;

    saveData();
    renderSubs();
    closeModal('edit-sub-modal');

    await sendDiscord(WEBHOOK_SUBS, "تعديل بيانات عميل 📝", [
        { name: "الموظف المعدل", value: employee.name },
        { name: "الاشتراك", value: subs[idx].subName, inline: true },
        { name: "اسم العميل", value: subs[idx].cusName, inline: true },
        { name: "بروفايل جديد", value: subs[idx].profile, inline: true },
        { name: "النوع الجديد", value: subs[idx].accType, inline: true }
    ], 15844367);
};

function renderSubs() {
    const list = document.getElementById('subscriptions-list');
    list.innerHTML = subs.length ? '' : '<p style="text-align:center;color:gray;padding:20px;">لا يوجد اشتراكات نشطة</p>';
    subs.forEach(s => {
        const card = document.createElement('div');
        card.className = 'sub-card';
        card.innerHTML = `
            <div class="card-actions">
                <button class="action-btn edit-btn" onclick="openEdit(${s.id})"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="action-btn delete-btn" onclick="deleteSub(${s.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class="sub-header">
                <span class="sub-title">${s.subName} <span class="tag">P-${s.profile}</span></span>
                <span class="sub-price">${s.price} ر.س</span>
            </div>
            <div class="sub-details">
                <p><span>العميل:</span> ${s.cusName} (${s.cusPhone})</p>
                <p><span>الطلب:</span> ${s.cusOrder} | <span>النوع:</span> ${s.accType}</p>
                <p><span>الإيميل:</span> ${s.email}</p>
            </div>
            <div class="timer-box" data-end="${s.endTime}"></div>
        `;
        list.appendChild(card);
    });
}

function updateTimers() {
    document.querySelectorAll('.timer-box').forEach(box => {
        const diff = parseInt(box.dataset.end) - Date.now();
        if (diff <= 0) { box.innerHTML = "<span style='color:var(--danger)'>منتهي الصلاحية</span>"; return; }
        const d = Math.floor(diff/(1000*60*60*24)), h = Math.floor((diff/(1000*60*60))%24), m = Math.floor((diff/(1000*60))%60), s = Math.floor((diff/1000)%60);
        box.innerHTML = `<div class="time-unit"><span class="time-val">${d}</span><span class="time-label">يوم</span></div>
                         <div class="time-unit"><span class="time-val">${h}</span><span class="time-label">ساعة</span></div>
                         <div class="time-unit"><span class="time-val">${m}</span><span class="time-label">دقيقة</span></div>
                         <div class="time-unit"><span class="time-val">${s}</span><span class="time-label">ثانية</span></div>`;
    });
}

function saveData() { localStorage.setItem(`df_subs_v2_${employee.id}`, JSON.stringify(subs)); }

async function sendDiscord(url, title, fields, color) {
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [{ title, fields, color, footer: { text: "ديجيتال فورس - نظام الإدارة" }, timestamp: new Date() }] })
        });
    } catch (e) { console.error("Webhook Error"); }
}
