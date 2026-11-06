/* =========================================================
   مفقوداتي الجامعية — المرحلة الأولى (HTML + CSS + JavaScript)
   لا يوجد خادم في هذه المرحلة، لذلك تُحفظ البيانات في متصفح
   المستخدم باستخدام localStorage. في المرحلة الثانية ستنتقل
   هذه الوظائف إلى PHP على الخادم.
   ========================================================= */

// ---------- 1) البيانات الثابتة ----------
const FACULTIES = {
  1: { name: 'كلية الطب', slug: 'medicine' },
  2: { name: 'كلية العلوم الرياضية والحاسوب', slug: 'mathcs' },
  3: { name: 'كلية الصيدلة', slug: 'pharmacy' }
};

// ---------- 2) دوال التخزين (localStorage) ----------
function load(key) { return JSON.parse(localStorage.getItem(key) || '[]'); }
function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); return true; }
  catch (e) { alert('مساحة التخزين في المتصفح امتلأت، جرّب صورة أصغر.'); return false; }
}
function nextId(list) { return list.length ? Math.max(...list.map(x => x.id)) + 1 : 1; }

function currentUser() {
  const id = Number(localStorage.getItem('lf_session'));
  return load('lf_users').find(u => u.id === id) || null;
}

// ---------- 3) دوال مساعدة ----------
// تحويل الرموز الخاصة حتى لا يُنفَّذ أي كود يكتبه المستخدم (حماية من XSS)
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmtDate(iso) {
  const d = new Date(iso);
  return d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');
}
// تشفير كلمة المرور بـ SHA-256 قبل حفظها (لا تُحفظ كما هي)
async function hashPassword(text) {
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 0; for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0; return 'h' + h;
}
function showAlert(msg, type = 'danger') {
  const box = document.getElementById('formAlert');
  if (box) box.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}
function facultyLogo(user) {
  const f = user && FACULTIES[user.faculty_id];
  return f ? `assets/faculties/${f.slug}.png` : 'assets/logo.png';
}

// ---------- 4) بطاقة الغرض ----------
function cardHTML(it, user) {
  const fac = it.faculty_id ? FACULTIES[it.faculty_id].name : 'مكان آخر';
  const returned = it.status === 'returned';
  const img = it.image
    ? `<img src="${it.image}" class="card-img-top item-img" alt="${esc(it.title)}">`
    : `<div class="item-img no-img">📦</div>`;
  const badge = returned
    ? `<span class="badge bg-success"><i class="bi bi-check2-circle"></i> تم التسليم لصاحبه</span>`
    : `<span class="badge bg-danger">مفقود</span>`;
  // زر خاص بصاحب المنشور فقط
  const btn = (!returned && user && it.user_id === user.id)
    ? `<button class="btn btn-returned btn-sm w-100 mt-3" data-return="${it.id}"><i class="bi bi-check2-circle"></i> تم التسليم لصاحبه</button>`
    : '';
  const date = returned ? 'سُلّم في ' + fmtDate(it.returned_at) : fmtDate(it.created_at);
  return `
  <div class="col-12 col-sm-6 col-lg-4">
    <div class="card h-100 item-card">
      ${img}
      <div class="card-body">
        ${badge}
        <span class="badge bg-light text-dark border">${esc(fac)}</span>
        <h5 class="card-title mt-2">${esc(it.title)}</h5>
        <p class="card-text text-muted small">${esc(it.description)}</p>
        <p class="mb-1 small">📍 ${esc(it.place)}</p>
        <p class="mb-0 small">📞 ${esc(it.contact)}</p>
        ${btn}
      </div>
      <div class="card-footer small text-muted">${date}</div>
    </div>
  </div>`;
}
function renderList(el, items, user, emptyMsg) {
  el.innerHTML = items.length ? items.map(it => cardHTML(it, user)).join('') : `<p class="text-muted">${emptyMsg}</p>`;
}

// ---------- 5) شريط التنقل (يعمل في كل الصفحات) ----------
const user = currentUser();
const params = new URLSearchParams(location.search);
document.getElementById('year').textContent = new Date().getFullYear();

if (user) {
  document.getElementById('navAvatar').textContent = user.name.charAt(0);
  document.getElementById('navName').textContent = user.name;
  document.getElementById('navEmail').textContent = user.email;
  document.getElementById('navHello').textContent = user.name;
  const logo = document.getElementById('siteLogo');
  logo.src = facultyLogo(user);
  logo.alt = 'شعار ' + (FACULTIES[user.faculty_id]?.name || 'جامعة الجزيرة');
}
document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('lf_session');
  location.href = 'index.html';
});
// إغلاق القائمة في الجوال عند الضغط خارجها
document.addEventListener('click', (e) => {
  const menu = document.getElementById('menu');
  if (menu && menu.classList.contains('show') && !e.target.closest('.navbar')) {
    bootstrap.Collapse.getOrCreateInstance(menu).hide();
  }
});

// زر "تم التسليم لصاحبه" (في أي صفحة فيها بطاقات)
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-return]');
  if (!b) return;
  if (!confirm('هل تأكدت أن الغرض وصل إلى صاحبه؟ سيُنقل إلى صفحة «تم تسليمها».')) return;
  const items = load('lf_items');
  const it = items.find(x => x.id === Number(b.dataset.return));
  if (it && user && it.user_id === user.id && it.status === 'open') {
    it.status = 'returned';
    it.returned_at = new Date().toISOString();
    save('lf_items', items);
  }
  location.href = 'returned.html';
});

// ---------- 6) كل صفحة ووظيفتها ----------
const page = document.body.dataset.page;

// الرئيسية: الترحيب وآخر 6 أغراض
if (page === 'index' && user) {
  document.getElementById('heroName').textContent = user.name;
  document.getElementById('heroFaculty').textContent = FACULTIES[user.faculty_id]?.name || '';
  document.getElementById('heroLogo').src = facultyLogo(user);
  const latest = load('lf_items').filter(i => i.status === 'open').sort((a, b) => b.id - a.id).slice(0, 6);
  const box = document.getElementById('latestItems');
  if (latest.length) { renderList(box, latest, user, ''); document.getElementById('moreBtn').hidden = false; }
  else box.innerHTML = '<p class="text-muted">لا توجد أغراض منشورة بعد. <a href="add-item.html">كن أول من ينشر</a>.</p>';
}

// المفقودات: بحث وفلترة مباشرة أثناء الكتابة
if (page === 'items') {
  const q = document.getElementById('q');
  const fac = document.getElementById('facultyFilter');
  q.value = params.get('q') || '';
  fac.value = params.get('faculty') || '';
  function filter() {
    const text = q.value.trim();
    let items = load('lf_items').filter(i => i.status === 'open');
    if (text) items = items.filter(i => (i.title + ' ' + i.place + ' ' + i.description).includes(text));
    if (fac.value === 'other') items = items.filter(i => i.faculty_id === null);
    else if (fac.value) items = items.filter(i => i.faculty_id === Number(fac.value));
    items.sort((a, b) => b.id - a.id);
    renderList(document.getElementById('itemsList'), items, user, 'لا توجد نتائج مطابقة. جرّب كلمة أخرى.');
  }
  q.addEventListener('input', filter);
  fac.addEventListener('change', filter);
  document.getElementById('searchForm').addEventListener('submit', (e) => { e.preventDefault(); filter(); });
  filter();
}

// إضافة غرض: معاينة الصورة، التحقق، الحفظ
if (page === 'add-item') {
  const form = document.getElementById('addItemForm');
  const facSel = document.getElementById('facultySelect');
  const place = document.getElementById('placeInput');
  const imgIn = document.getElementById('imageInput');
  const preview = document.getElementById('imagePreview');
  let imageData = null;

  facSel.value = user.faculty_id; // كلية المستخدم افتراضيًا
  function updatePlaceholder() {
    place.placeholder = facSel.value === 'other' ? 'مثال: كافتيريا الضو، مكتبة الرازي' : 'مثال: المكتبة، قاعة 12';
  }
  facSel.addEventListener('change', updatePlaceholder);
  updatePlaceholder();

  // تصغير الصورة ومعاينتها قبل النشر
  imgIn.addEventListener('change', () => {
    const file = imgIn.files[0];
    imageData = null; preview.style.display = 'none';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024) {
      showAlert('الصورة يجب أن تكون jpg أو png أو webp، وحجمها أقل من 2 ميغابايت.');
      imgIn.value = ''; return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 800 / img.width);
        const c = document.createElement('canvas');
        c.width = img.width * scale; c.height = img.height * scale;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        imageData = c.toDataURL('image/jpeg', 0.7);
        preview.src = imageData; preview.style.display = 'block';
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const title = d.get('title').trim(), placeVal = d.get('place').trim(), contact = d.get('contact').trim();
    if (!title || !placeVal || !contact) { showAlert('املأ الحقول المطلوبة كلها.'); return; }
    const items = load('lf_items');
    items.push({
      id: nextId(items),
      user_id: user.id,
      faculty_id: d.get('faculty_id') === 'other' ? null : Number(d.get('faculty_id')),
      title, type: d.get('type'), place: placeVal,
      description: d.get('description').trim(), contact,
      image: imageData, status: 'open',
      created_at: new Date().toISOString(), returned_at: null
    });
    if (save('lf_items', items)) location.href = 'items.html';
  });
}

// تم تسليمها
if (page === 'returned') {
  const items = load('lf_items').filter(i => i.status === 'returned')
    .sort((a, b) => new Date(b.returned_at) - new Date(a.returned_at));
  renderList(document.getElementById('returnedList'), items, user, 'لا توجد أغراض مسلّمة بعد.');
}

// تسجيل الدخول
if (page === 'login') {
  if (params.has('need')) showAlert('سجّل دخولك أولًا للاستفادة من خدمات الموقع.', 'info');
  if (params.has('ok')) showAlert('تم إنشاء حسابك، سجّل دخولك الآن.', 'success');
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    const hash = await hashPassword(d.get('password'));
    const u = load('lf_users').find(x => x.email === d.get('email').trim().toLowerCase() && x.password === hash);
    if (!u) { showAlert('البريد الإلكتروني أو كلمة المرور غير صحيحة.'); return; }
    localStorage.setItem('lf_session', u.id);
    location.href = 'index.html';
  });
}

// إنشاء حساب
if (page === 'register') {
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    const name = d.get('name').trim(), email = d.get('email').trim().toLowerCase();
    const pass = d.get('password'), pass2 = document.getElementById('password2').value;
    const faculty = Number(d.get('faculty_id'));
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || pass.length < 6) { showAlert('تأكد من الاسم والبريد، وكلمة المرور 6 أحرف على الأقل.'); return; }
    if (!FACULTIES[faculty]) { showAlert('اختر كليتك من القائمة.'); return; }
    if (pass !== pass2) { showAlert('كلمتا المرور غير متطابقتين.'); return; }
    const users = load('lf_users');
    if (users.some(u => u.email === email)) { showAlert('هذا البريد مسجّل مسبقًا.'); return; }
    users.push({ id: nextId(users), name, email, password: await hashPassword(pass), faculty_id: faculty });
    save('lf_users', users);
    location.href = 'login.html?ok=1';
  });
}

// تواصل معنا
if (page === 'contact') {
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const msgs = load('lf_messages');
    msgs.push({ id: nextId(msgs), name: d.get('name').trim(), email: d.get('email').trim(), message: d.get('message').trim(), created_at: new Date().toISOString() });
    save('lf_messages', msgs);
    form.reset();
    showAlert('وصلتنا رسالتك، شكرًا لك.', 'success');
  });
}

// إخفاء رسائل التنبيه تلقائيًا بعد 5 ثوانٍ
setInterval(() => document.querySelectorAll('.alert').forEach(a => {
  if (!a.dataset.t) a.dataset.t = Date.now();
  else if (Date.now() - a.dataset.t > 5000) a.remove();
}), 1000);
