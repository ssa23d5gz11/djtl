// --- وظائف التحكم الاحترافية ---

// 1. فتح المودال للإضافة أو التعديل
function openModal(subId = null) {
    const modal = document.getElementById('add-modal');
    const title = document.getElementById('modal-title');
    const btn = document.getElementById('save-btn');
    
    if (subId) {
        // وضع التعديل
        title.innerText = "تعديل بيانات الطلب ✏️";
        btn.innerText = "تحديث البيانات بالسحابة";
        const sub = allData[currentUser.id].find(s => s.id === subId);
        document.getElementById('edit-id').value = sub.id;
        document.getElementById('s-name').value = sub.sName;
        document.getElementById('c-name').value = sub.cName;
        document.getElementById('c-phone').value = sub.cPhone;
        document.getElementById('c-order').value = sub.orderId;
        document.getElementById('s-price').value = sub.price;
        document.getElementById('c-email').value = sub.email;
        document.getElementById('c-pass').value = sub.pass;
    } else {
        // وضع الإضافة
        title.innerText = "إنشاء طلب جديد ✅";
        btn.innerText = "حفظ في نظام ديجيتال فورس";
        document.getElementById('edit-id').value = "";
        document.getElementById('add-modal').querySelectorAll('input').forEach(i => i.value = "");
    }
    modal.style.display = 'flex';
}

// 2. دالة الحفظ (إضافة أو تحديث)
async function saveSub() {
    const editId = document.getElementById('edit-id').value;
    const subData = {
        id: editId ? parseInt(editId) : Date.now(),
        sName: document.getElementById('s-name').value,
        cName: document.getElementById('c-name').value,
        cPhone: document.getElementById('c-phone').value,
        orderId: document.getElementById('c-order').value,
        price: document.getElementById('s-price').value,
        email: document.getElementById('c-email').value,
        pass: document.getElementById('c-pass').value,
        dur: document.getElementById('s-dur').value,
        // إذا كان تعديل، نحافظ على تاريخ النهاية الأصلي، إذا جديد نحسبه
        end: editId ? allData[currentUser.id].find(s => s.id == editId).end : 
             new Date().setMonth(new Date().getMonth() + parseInt(document.getElementById('s-dur').value))
    };

    if (editId) {
        const index = allData[currentUser.id].findIndex(s => s.id == editId);
        allData[currentUser.id][index] = subData;
    } else {
        allData[currentUser.id].unshift(subData);
    }

    await updateCloud();
    closeModal();
    renderSubs();
}

// 3. حذف الطلب نهائياً من السحابة
async function deleteSub(subId) {
    if (confirm("هل أنت متأكد من حذف هذا الطلب نهائياً من نظام ديجيتال فورس؟")) {
        allData[currentUser.id] = allData[currentUser.id].filter(s => s.id !== subId);
        await updateCloud();
        renderSubs();
        
        sendWebhook(WH_SUBS, "حذف طلب من النظام 🗑️", [
            {name: "الموظف", value: currentUser.name},
            {name: "رقم الطلب المحذوف", value: subId}
        ], 15548997);
    }
}

// 4. تحديث السحابة (jsonbin.io)
async function updateCloud() {
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json", "X-Master-Key": MASTER_KEY },
        body: JSON.stringify(allData)
    });
}

// 5. عداد الوقت الحي (ثانية بثانية)
function startLiveTimers() {
    setInterval(() => {
        document.querySelectorAll('.live-timer').forEach(timer => {
            const endTime = timer.getAttribute('data-end');
            const now = new Date().getTime();
            const distance = endTime - now;

            if (distance < 0) {
                timer.innerHTML = "منتهي الصلاحية ⚠️";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            timer.innerHTML = `
                <div class="timer-unit">${days}<span>يوم</span></div>
                <div class="timer-unit">${hours}<span>ساعة</span></div>
                <div class="timer-unit">${minutes}<span>دقيقة</span></div>
                <div class="timer-unit">${seconds}<span>ثانية</span></div>
            `;
        });
    }, 1000);
}

// 6. تحديث دالة الـ Render لإضافة الأزرار والوقت
function renderSubs() {
    const list = document.getElementById('subs-list');
    list.innerHTML = "";
    const myData = allData[currentUser.id] || [];
    
    myData.forEach(s => {
        list.innerHTML += `
            <div class="sub-card">
                <div class="card-actions">
                    <button class="btn-icon btn-edit" onclick="openModal(${s.id})"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-icon btn-delete" onclick="deleteSub(${s.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
                <h3>${s.sName}</h3>
                <p>العميل: <b>${s.cName}</b></p>
                <p>الجوال: <b>${s.cPhone}</b></p>
                <p>الطلب: <b>#${s.orderId}</b></p>
                <p>السعر: <b style="color:#10b981">${s.price} ر.س</b></p>
                <p>الحساب: <b>${s.email}</b></p>
                <p>الباسورد: <b>${s.pass}</b></p>
                <div class="live-timer" data-end="${s.end}">تحميل الوقت...</div>
            </div>`;
    });
}

// أضف هذه في نهاية دالة showMain
startLiveTimers();
