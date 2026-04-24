const tokenInput = document.getElementById('token');
const entitySelect = document.getElementById('entity');
const pageInput = document.getElementById('page');
const limitInput = document.getElementById('limit');
const statusEl = document.getElementById('status');
const summaryEl = document.getElementById('summary');
const rawResultEl = document.getElementById('rawResult');
const tableWrapEl = document.getElementById('tableWrap');
const tableHeadEl = document.getElementById('tableHead');
const tableBodyEl = document.getElementById('tableBody');

const tokenKey = 'erp_admin_token';
const savedToken = localStorage.getItem(tokenKey) || '';
tokenInput.value = savedToken;

let currentRows = [];

function normalizeNumberInput(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (Number.isFinite(min) && parsed < min) return min;
  if (Number.isFinite(max) && parsed > max) return max;
  return parsed;
}

function setStatus(message, kind = '') {
  statusEl.className = `status ${kind}`.trim();
  statusEl.textContent = message;
}

function getToken() {
  return tokenInput.value.trim();
}

function saveToken(token) {
  tokenInput.value = token;
  localStorage.setItem(tokenKey, token);
}

function hideRawResult() {
  rawResultEl.hidden = true;
  rawResultEl.textContent = '';
}

function showRawResult(data) {
  rawResultEl.hidden = false;
  rawResultEl.textContent = JSON.stringify(data, null, 2);
}

function flattenRow(source, prefix = '', target = {}) {
  if (source == null) return target;

  if (Array.isArray(source)) {
    target[prefix || 'value'] = source.map((item) => {
      if (item && typeof item === 'object') {
        return JSON.stringify(item);
      }
      return item;
    }).join('; ');
    return target;
  }

  if (typeof source !== 'object') {
    target[prefix || 'value'] = source;
    return target;
  }

  Object.entries(source).forEach(([key, value]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;

    if (value == null) {
      target[nextPrefix] = '';
      return;
    }

    if (Array.isArray(value)) {
      target[nextPrefix] = value.map((item) => {
        if (item && typeof item === 'object') return JSON.stringify(item);
        return item;
      }).join('; ');
      return;
    }

    if (value instanceof Date) {
      target[nextPrefix] = value.toISOString();
      return;
    }

    if (typeof value === 'object') {
      flattenRow(value, nextPrefix, target);
      return;
    }

    target[nextPrefix] = value;
  });

  return target;
}

function renderTable(rows) {
  tableHeadEl.innerHTML = '';
  tableBodyEl.innerHTML = '';

  if (!rows.length) {
    tableWrapEl.hidden = true;
    return;
  }

  const flattenedRows = rows.map((row) => flattenRow(row));
  const headers = [];
  const headerSet = new Set();

  flattenedRows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!headerSet.has(key)) {
        headerSet.add(key);
        headers.push(key);
      }
    });
  });

  const limitedHeaders = headers.slice(0, 16);

  const headRow = document.createElement('tr');
  limitedHeaders.forEach((header) => {
    const th = document.createElement('th');
    th.textContent = header;
    headRow.appendChild(th);
  });
  tableHeadEl.appendChild(headRow);

  flattenedRows.forEach((row) => {
    const tr = document.createElement('tr');
    limitedHeaders.forEach((header) => {
      const td = document.createElement('td');
      const value = row[header];
      td.textContent = value == null ? '' : String(value);
      tr.appendChild(td);
    });
    tableBodyEl.appendChild(tr);
  });

  tableWrapEl.hidden = false;
}

async function fetchJson(url, options = {}) {
  const token = getToken();
  if (!token) {
    throw new Error('Token required. Save or paste an admin token first.');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

async function loadEntities() {
  setStatus('Loading entity options...');
  hideRawResult();

  try {
    const payload = await fetchJson('/api/v1/imports/entities');
    const entities = payload?.data || [];

    entitySelect.innerHTML = '';

    entities.forEach((entity, index) => {
      const option = document.createElement('option');
      option.value = entity.key;
      option.textContent = entity.label;
      if (index === 0) option.selected = true;
      entitySelect.appendChild(option);
    });

    setStatus('Entity options loaded.', 'ok');
  } catch (error) {
    setStatus(error.message, 'err');
  }
}

async function loadData() {
  const entity = entitySelect.value;
  const page = normalizeNumberInput(pageInput.value, 1, 1, 100000);
  const limit = normalizeNumberInput(limitInput.value, 50, 1, 500);

  pageInput.value = String(page);
  limitInput.value = String(limit);

  if (!entity) {
    setStatus('Select an entity first.', 'err');
    return;
  }

  setStatus(`Loading ${entity} records...`);
  hideRawResult();

  try {
    const payload = await fetchJson(`/api/v1/imports/data/${encodeURIComponent(entity)}?page=${page}&limit=${limit}`);
    const data = payload?.data || {};

    currentRows = data.records || [];

    summaryEl.hidden = false;
    summaryEl.textContent = `Entity: ${data.entity || entity} | Total: ${data.total || 0} | Page: ${data.page || page} | Limit: ${data.limit || limit} | Returned: ${data.count || currentRows.length}`;

    renderTable(currentRows);
    showRawResult(data);
    setStatus(`Loaded ${currentRows.length} rows.`, 'ok');
  } catch (error) {
    summaryEl.hidden = true;
    tableWrapEl.hidden = true;
    showRawResult({ error: error.message });
    setStatus(error.message, 'err');
  }
}

async function exportData(format) {
  const entity = entitySelect.value;
  const page = normalizeNumberInput(pageInput.value, 1, 1, 100000);
  const limit = normalizeNumberInput(limitInput.value, 50, 1, 5000);
  const token = getToken();

  if (!token) {
    setStatus('Token required. Save or paste an admin token first.', 'err');
    return;
  }

  if (!entity) {
    setStatus('Select an entity first.', 'err');
    return;
  }

  setStatus(`Exporting ${entity} as ${format.toUpperCase()}...`);

  try {
    const response = await fetch(`/api/v1/imports/export/${encodeURIComponent(entity)}?format=${encodeURIComponent(format)}&page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const message = payload?.error?.message || `Export failed (${response.status})`;
      throw new Error(message);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entity}_export.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setStatus(`Exported ${entity} as ${format.toUpperCase()}.`, 'ok');
  } catch (error) {
    setStatus(error.message, 'err');
  }
}

document.getElementById('saveTokenBtn').addEventListener('click', () => {
  const token = getToken();
  if (!token) {
    setStatus('Paste a token before saving.', 'err');
    return;
  }

  saveToken(token);
  setStatus('Token saved in this browser.', 'ok');
  loadEntities();
});

document.getElementById('clearTokenBtn').addEventListener('click', () => {
  localStorage.removeItem(tokenKey);
  tokenInput.value = '';
  setStatus('Token cleared.', 'ok');
});

document.getElementById('loadBtn').addEventListener('click', () => {
  loadData();
});

document.getElementById('exportCsvBtn').addEventListener('click', () => {
  exportData('csv');
});

document.getElementById('exportJsonBtn').addEventListener('click', () => {
  exportData('json');
});

if (savedToken) {
  loadEntities();
}
