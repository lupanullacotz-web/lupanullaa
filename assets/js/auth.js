(function () {
  'use strict';

  var state = {
    mode: new URLSearchParams(window.location.search).get('mode') === 'signup' ? 'signup' : 'login',
    otp: ''
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem('lupanullaUsers') || '{}');
    } catch (error) {
      return {};
    }
  }

  function saveUsers(users) {
    localStorage.setItem('lupanullaUsers', JSON.stringify(users));
  }

  function finishAuth(profile) {
    var session = {
      id: profile.id || ('user-' + Date.now()),
      name: profile.name || 'Mwanafunzi',
      email: profile.email || '',
      phone: profile.phone || '',
      provider: profile.provider || 'email',
      signedInAt: new Date().toISOString()
    };
    localStorage.setItem('lupanullaSession', JSON.stringify(session));
    window.location.href = '/dashboard.html';
  }

  function setMessage(text, kind) {
    var el = $('#auth-message');
    if (!el) return;
    el.textContent = text || '';
    el.className = 'mt-4 text-sm font-bold ' + (kind === 'error' ? 'text-rose-700' : 'text-slate-600');
  }

  function setMode(mode) {
    state.mode = mode === 'signup' ? 'signup' : 'login';
    document.querySelectorAll('[data-auth-tab]').forEach(function (tab) {
      var active = tab.getAttribute('data-auth-tab') === state.mode;
      tab.classList.toggle('bg-white', active);
      tab.classList.toggle('shadow-sm', active);
      tab.classList.toggle('text-slate-950', active);
      tab.classList.toggle('text-slate-600', !active);
    });

    $('#auth-title').textContent = state.mode === 'signup' ? 'Fungua akaunti mpya' : 'Ingia kwenye akaunti';
    $('#auth-copy').textContent = state.mode === 'signup'
      ? 'Jisajili kisha utafunguliwa dashboard yako moja kwa moja.'
      : 'Chagua njia unayotaka kutumia kuendelea.';
    $('#name-row').classList.toggle('hidden', state.mode !== 'signup');
    $('#email-submit').textContent = state.mode === 'signup' ? 'Jisajili' : 'Ingia';
    setMessage('');
  }

  function handleProvider(provider) {
    if (provider === 'phone') {
      $('#phone-panel').classList.toggle('hidden');
      return;
    }

    if (provider === 'google') {
      finishAuth({
        id: 'google-' + Date.now(),
        name: 'Mtumiaji wa Google',
        email: 'google-user@lupanulla.local',
        provider: 'google'
      });
    }
  }

  function handleEmail(event) {
    event.preventDefault();
    var email = normalizeEmail($('#auth-email').value);
    var password = $('#auth-password').value;
    var name = ($('#auth-name') && $('#auth-name').value.trim()) || email.split('@')[0] || 'Mwanafunzi';

    if (!email || password.length < 6) {
      setMessage('Weka email sahihi na nenosiri lenye angalau herufi 6.', 'error');
      return;
    }

    var users = getUsers();
    if (state.mode === 'signup') {
      users[email] = { name: name, email: email, password: password, provider: 'email' };
      saveUsers(users);
      finishAuth(users[email]);
      return;
    }

    if (!users[email]) {
      setMessage('Akaunti haijapatikana. Bonyeza Jisajili kwanza.', 'error');
      return;
    }

    if (users[email].password !== password) {
      setMessage('Nenosiri si sahihi.', 'error');
      return;
    }

    finishAuth(users[email]);
  }

  function sendOtp() {
    var phone = ($('#phone-number').value || '').trim();
    if (phone.length < 9) {
      setMessage('Weka namba ya simu kwanza.', 'error');
      return;
    }
    state.otp = String(Math.floor(100000 + Math.random() * 900000));
    $('#otp-note').textContent = 'OTP yako ya majaribio ni ' + state.otp + '.';
    setMessage('OTP imetengenezwa. Iweke kwenye kisanduku cha OTP.');
  }

  function verifyOtp() {
    var phone = ($('#phone-number').value || '').trim();
    var code = ($('#phone-code').value || '').trim();
    if (!state.otp || code !== state.otp) {
      setMessage('OTP si sahihi. Jaribu tena.', 'error');
      return;
    }
    finishAuth({
      id: 'phone-' + phone.replace(/\D/g, ''),
      name: 'Mtumiaji wa Simu',
      phone: phone,
      provider: 'phone'
    });
  }

  function wireDashboardSession() {
    var raw = localStorage.getItem('lupanullaSession');
    if (!raw) return;
    var session;
    try { session = JSON.parse(raw); } catch (error) { return; }
    if (!session || !session.name) return;

    document.querySelectorAll('[data-auth-name]').forEach(function (el) {
      el.textContent = session.name;
    });

    var heroName = document.getElementById('dashboard-user-name');
    if (heroName) heroName.textContent = session.name.split(' ')[0] || session.name;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.body && document.body.hasAttribute('data-dashboard-auth')) {
      wireDashboardSession();
      return;
    }

    if (!document.getElementById('email-auth-form')) return;

    setMode(state.mode);
    document.querySelectorAll('[data-auth-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        setMode(tab.getAttribute('data-auth-tab'));
      });
    });
    document.querySelectorAll('[data-provider]').forEach(function (button) {
      button.addEventListener('click', function () {
        handleProvider(button.getAttribute('data-provider'));
      });
    });
    $('#email-auth-form').addEventListener('submit', handleEmail);
    $('#send-otp').addEventListener('click', sendOtp);
    $('#verify-otp').addEventListener('click', verifyOtp);
  });
})();
