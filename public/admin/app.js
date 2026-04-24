const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const tokenInput = document.getElementById('token');
const workbookInput = document.getElementById('workbook');
const dropzone = document.getElementById('dropzone');
const fileNameEl = document.getElementById('fileName');
const dryRunInput = document.getElementById('dryRun');
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');

const tokenKey = 'erp_admin_token';
const savedToken = localStorage.getItem(tokenKey) || '';
tokenInput.value = savedToken;

function setFileName(file) {
  fileNameEl.textContent = file ? `${file.name} (${Math.round(file.size / 1024)} KB)` : 'No file selected.';
}

function setStatus(message, kind = '') {
  statusEl.className = `status ${kind}`.trim();
  statusEl.textContent = message;
}

function showResult(value) {
  resultEl.hidden = false;
  resultEl.textContent = JSON.stringify(value, null, 2);
}

function hideResult() {
  resultEl.hidden = true;
  resultEl.textContent = '';
}

function getToken() {
  return tokenInput.value.trim();
}

function saveToken(token) {
  tokenInput.value = token;
  localStorage.setItem(tokenKey, token);
}

function selectedFile() {
  return workbookInput.files && workbookInput.files[0] ? workbookInput.files[0] : null;
}

function setSelectedFile(file) {
  const dataTransfer = new DataTransfer();
  if (file) {
    dataTransfer.items.add(file);
  }
  workbookInput.files = dataTransfer.files;
  setFileName(file);
}

emailInput.value = 'admin@erp.demo.edu';

document.getElementById('fillDemoBtn').addEventListener('click', () => {
  emailInput.value = 'admin@erp.demo.edu';
  passwordInput.value = 'Demo@1234';
  setStatus('Demo credentials filled.', 'ok');
});

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    setStatus('Enter the admin email and password.', 'err');
    return;
  }

  setStatus('Signing in...', '');
  hideResult();

  try {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = payload?.error?.message || `Login failed (${response.status})`;
      throw new Error(message);
    }

    const token = payload?.data?.token;
    if (!token) {
      throw new Error('Login succeeded but no token was returned.');
    }

    saveToken(token);
    setStatus(`Signed in as ${payload?.data?.user?.name || email}. Token saved.`, 'ok');
    showResult({ user: payload?.data?.user, expiresIn: payload?.data?.expiresIn });
  } catch (error) {
    setStatus(error.message, 'err');
  }
});

dropzone.addEventListener('click', () => workbookInput.click());

dropzone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    workbookInput.click();
  }
});

dropzone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('dragover');

  const file = event.dataTransfer.files && event.dataTransfer.files[0];
  if (file) {
    setSelectedFile(file);
    setStatus(`Selected ${file.name}.`, 'ok');
  }
});

workbookInput.addEventListener('change', () => {
  setSelectedFile(selectedFile());
});

document.getElementById('saveTokenBtn').addEventListener('click', () => {
  const token = getToken();
  if (!token) {
    setStatus('Paste a token before saving.', 'err');
    return;
  }

  saveToken(token);
  setStatus('Token saved in this browser.', 'ok');
});

document.getElementById('clearTokenBtn').addEventListener('click', () => {
  localStorage.removeItem(tokenKey);
  tokenInput.value = '';
  setStatus('Token cleared.', 'ok');
});

document.getElementById('downloadTemplateBtn').addEventListener('click', async () => {
  const token = getToken();
  if (!token) {
    setStatus('Token required to download the template.', 'err');
    return;
  }

  setStatus('Downloading template...', '');
  hideResult();

  try {
    const response = await fetch('/api/v1/imports/template', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Template download failed (${response.status})`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'erp_import_template.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setStatus('Template downloaded.', 'ok');
  } catch (error) {
    setStatus(error.message, 'err');
  }
});

document.getElementById('resetBtn').addEventListener('click', () => {
  setSelectedFile(null);
  dryRunInput.checked = true;
  hideResult();
  setStatus('Form reset.', 'ok');
});

document.getElementById('importBtn').addEventListener('click', async () => {
  const token = getToken();
  const file = selectedFile();

  if (!token) {
    setStatus('Token required to upload the workbook.', 'err');
    return;
  }

  if (!file) {
    setStatus('Choose an .xlsx workbook first.', 'err');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('dryRun', String(dryRunInput.checked));

  setStatus(dryRunInput.checked ? 'Validating workbook...' : 'Importing workbook...', '');
  hideResult();

  try {
    const response = await fetch('/api/v1/imports/workbook', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = payload?.error?.message || `Import failed (${response.status})`;
      showResult({
        status: response.status,
        error: payload?.error || null
      });
      throw new Error(message);
    }

    setStatus(payload?.data?.message || 'Import completed.', 'ok');
    showResult(payload.data);
  } catch (error) {
    setStatus(error.message, 'err');
  }
});

setFileName(selectedFile());