// يعمل في <head> قبل ظهور الصفحة:
// 1) يضيف للصفحة الصنف user أو guest (لإظهار/إخفاء العناصر بالـ CSS)
// 2) يحمي الصفحات: data-need="login" للمسجّلين فقط، و data-need="guest" للزوار فقط
(function () {
  var logged = !!localStorage.getItem('lf_session');
  var html = document.documentElement;
  html.classList.add(logged ? 'user' : 'guest');

  var need = html.getAttribute('data-need');
  if (need === 'login' && !logged) location.replace('login.html?need=1');
  if (need === 'guest' && logged) location.replace('index.html');
})();
