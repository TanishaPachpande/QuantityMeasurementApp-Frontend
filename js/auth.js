var PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{6,}$/;

function switchTab(tab) {
  var allTabs = document.querySelectorAll('.tab');
  var allPanels = document.querySelectorAll('.form-panel');

  for (var i = 0; i < allTabs.length; i++) {
    allTabs[i].classList.remove('active');
  }
  for (var i = 0; i < allPanels.length; i++) {
    allPanels[i].classList.remove('active');
  }

  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('panel-' + tab).classList.add('active');
  clearAllErrors();
}

function togglePw(inputId, iconEl) {
  var input = document.getElementById(inputId);

  if (input.type === 'password') {
    input.type = 'text';
    iconEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  } else {
    input.type = 'password';
    iconEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  }
}

function setError(errId, inputId, show) {
  var errEl = document.getElementById(errId);
  var inputEl = document.getElementById(inputId);

  if (show) {
    errEl.classList.add('show');
    inputEl.classList.add('error');
  } else {
    errEl.classList.remove('show');
    inputEl.classList.remove('error');
  }
}

function clearAllErrors() {
  var errors = document.querySelectorAll('.error-msg');
  var inputs = document.querySelectorAll('input');

  for (var i = 0; i < errors.length; i++) {
    errors[i].classList.remove('show');
  }
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].classList.remove('error');
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showToast(message) {
  var toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(function() {
    toast.classList.remove('show');
  }, 3000);
}

function doLogin() {
  var email = document.getElementById('login-email').value.trim();
  var pw = document.getElementById('login-pw').value;
  var valid = true;

  if (!isValidEmail(email)) {
    setError('login-email-err', 'login-email', true);
    valid = false;
  } else {
    setError('login-email-err', 'login-email', false);
  }

  if (!PASSWORD_REGEX.test(pw)) {
    setError('login-pw-err', 'login-pw', true);
    valid = false;
  } else {
    setError('login-pw-err', 'login-pw', false);
  }

  if (valid) {
    localStorage.setItem('qm_user', email);
    showToast('🎉 Login Successful! Redirecting to Dashboard...');
    window.location.href = 'dashboard.html';
  }
}

function doSignup() {
  var name = document.getElementById('signup-name').value.trim();
  var email = document.getElementById('signup-email').value.trim();
  var pw = document.getElementById('signup-pw').value;
  var mobile = document.getElementById('signup-mobile').value.trim();
  var valid = true;

  if (!name) {
    setError('signup-name-err', 'signup-name', true);
    valid = false;
  } else {
    setError('signup-name-err', 'signup-name', false);
  }

  if (!isValidEmail(email)) {
    setError('signup-email-err', 'signup-email', true);
    valid = false;
  } else {
    setError('signup-email-err', 'signup-email', false);
  }

  if (!PASSWORD_REGEX.test(pw)) {
    setError('signup-pw-err', 'signup-pw', true);
    valid = false;
  } else {
    setError('signup-pw-err', 'signup-pw', false);
  }

  if (!/^\d{10}$/.test(mobile)) {
    setError('signup-mobile-err', 'signup-mobile', true);
    valid = false;
  } else {
    setError('signup-mobile-err', 'signup-mobile', false);
  }

  if (valid) {
    localStorage.setItem('qm_user', email);
    showToast('🎉 Registration Successful! Redirecting to Login...');
    setTimeout(function() {
      window.location.href = 'index.html';
    }, 3000);
  }
}

window.onload = function() {

  var signupPw = document.getElementById('signup-pw');
  if (signupPw) {
    signupPw.oninput = function() {
      if (this.value.length > 0) {
        setError('signup-pw-err', 'signup-pw', !PASSWORD_REGEX.test(this.value));
      } else {
        setError('signup-pw-err', 'signup-pw', false);
      }
    };
  }

  var loginPw = document.getElementById('login-pw');
  if (loginPw) {
    loginPw.oninput = function() {
      if (this.value.length > 0) {
        setError('login-pw-err', 'login-pw', !PASSWORD_REGEX.test(this.value));
      } else {
        setError('login-pw-err', 'login-pw', false);
      }
    };
    loginPw.onkeydown = function(e) {
      if (e.key === 'Enter') doLogin();
    };
  }

  var mobileInput = document.getElementById('signup-mobile');
  if (mobileInput) {
    mobileInput.oninput = function() {
      if (this.value.length > 0) {
        setError('signup-mobile-err', 'signup-mobile', !/^\d{10}$/.test(this.value));
      } else {
        setError('signup-mobile-err', 'signup-mobile', false);
      }
    };
    mobileInput.onkeypress = function(e) {
      if (!/\d/.test(e.key)) e.preventDefault();
    };
    mobileInput.onkeydown = function(e) {
      if (e.key === 'Enter') doSignup();
    };
  }

};