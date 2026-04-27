const BASE_URL = import.meta.env.VITE_GAS_BASE_URL?.trim();
const READ_TIMEOUT_MS = 12000;
const WRITE_TIMEOUT_MS = 4000;

function buildUrl(path, params) {
  const url = new URL(BASE_URL);
  url.searchParams.set('path', path);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
}

async function request(path, options = {}) {
  if (!BASE_URL) {
    throw new Error('Missing VITE_GAS_BASE_URL environment variable.');
  }

  let response;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), options.timeoutMs || READ_TIMEOUT_MS);

  try {
    response = await fetch(buildUrl(path, options.params), {
      method: options.method || 'GET',
      headers: {
        ...(options.body ? { 'Content-Type': 'text/plain;charset=utf-8' } : {}),
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Google Apps Script request timed out. The connection may be unstable.');
    }
    throw new Error(
      'Could not reach Google Apps Script. Check deployment access, browser CORS/network, and the VITE_GAS_BASE_URL value.'
    );
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const rawText = await response.text();

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (error) {
    throw new Error(
      'Google Apps Script did not return JSON. Check that the web app is deployed correctly and the URL points to /exec.'
    );
  }

  if (data.success === false) {
    if (data.conflict) {
      return data;
    }
    throw new Error(data.message || 'Google Apps Script returned an error.');
  }

  return data;
}

export const apiClient = {
  getTrips() {
    return request('/trips', { timeoutMs: READ_TIMEOUT_MS });
  },
  getInventoryItems() {
    return request('/inventory-items', { timeoutMs: READ_TIMEOUT_MS });
  },
  getStores() {
    return request('/stores', { timeoutMs: READ_TIMEOUT_MS });
  },
  getCategories() {
    return request('/categories', { timeoutMs: READ_TIMEOUT_MS });
  },
  createTrip(payload) {
    return request('/trips', {
      method: 'POST',
      body: payload,
      timeoutMs: WRITE_TIMEOUT_MS
    });
  },
  updateTrip(payload) {
    return request('/trips/update', {
      method: 'POST',
      body: {
        ...payload,
        base_updated_at: payload.updated_at
      },
      timeoutMs: WRITE_TIMEOUT_MS
    });
  },
  createInventoryItem(payload) {
    return request('/inventory-items', {
      method: 'POST',
      body: payload,
      timeoutMs: WRITE_TIMEOUT_MS
    });
  },
  updateInventoryItem(payload) {
    return request('/inventory-items/update', {
      method: 'POST',
      body: {
        ...payload,
        base_updated_at: payload.updated_at
      },
      timeoutMs: WRITE_TIMEOUT_MS
    });
  },
  deleteInventoryItem(payload) {
    return request('/inventory-items/delete', {
      method: 'POST',
      body: {
        ...payload,
        base_updated_at: payload.updated_at
      },
      timeoutMs: WRITE_TIMEOUT_MS
    });
  },
  replaceTripChecklist(payload) {
    return request('/trip-checklist/replace', {
      method: 'POST',
      body: {
        ...payload,
        base_updated_at: payload.base_updated_at
      },
      timeoutMs: WRITE_TIMEOUT_MS
    });
  },
  // Stores
  createStore(payload) {
    return request('/stores', {
      method: 'POST',
      body: payload,
      timeoutMs: WRITE_TIMEOUT_MS
    });
  },
  updateStore(payload) {
    return request('/stores/update', {
      method: 'POST',
      body: {
        ...payload,
        base_updated_at: payload.updated_at
      },
      timeoutMs: WRITE_TIMEOUT_MS
    });
  },
  deleteStore(payload) {
    return request('/stores/delete', {
      method: 'POST',
      body: {
        ...payload,
        base_updated_at: payload.updated_at
      },
      timeoutMs: WRITE_TIMEOUT_MS
    });
  },
  // Categories
  createCategory(payload) {
    return request('/categories', {
      method: 'POST',
      body: payload,
      timeoutMs: WRITE_TIMEOUT_MS
    });
  },
  updateCategory(payload) {
    return request('/categories/update', {
      method: 'POST',
      body: {
        ...payload,
        base_updated_at: payload.updated_at
      },
      timeoutMs: WRITE_TIMEOUT_MS
    });
  },
  deleteCategory(payload) {
    return request('/categories/delete', {
      method: 'POST',
      body: {
        ...payload,
        base_updated_at: payload.updated_at
      },
      timeoutMs: WRITE_TIMEOUT_MS
    });
  }
};
