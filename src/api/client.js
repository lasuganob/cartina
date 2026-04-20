const BASE_URL = import.meta.env.VITE_GAS_BASE_URL?.trim();

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

  try {
    response = await fetch(buildUrl(path, options.params), {
      method: options.method || 'GET',
      headers: {
        ...(options.body ? { 'Content-Type': 'text/plain;charset=utf-8' } : {}),
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch (error) {
    throw new Error(
      'Could not reach Google Apps Script. Check deployment access, browser CORS/network, and the VITE_GAS_BASE_URL value.'
    );
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
    throw new Error(data.message || 'Google Apps Script returned an error.');
  }

  return data;
}

export const apiClient = {
  // --- READ (GET) ---
  getTrips() {
    return request('/trips');
  },
  getNextTripId() {
    return request('/trips/next-id');
  },
  getNextTripChecklistIds(count) {
    return request('/trip-checklist/next-ids', {
      params: { count }
    });
  },
  getNextInventoryItemId() {
    return request('/inventory-items/next-id');
  },
  getNextStoreId() {
    return request('/stores/next-id');
  },
  getNextCategoryId() {
    return request('/categories/next-id');
  },
  getInventoryItems() {
    return request('/inventory-items');
  },
  getStores() {
    return request('/stores');
  },
  getCategories() {
    return request('/categories');
  },
  // --- WRITE (POST) ---
  createTrip(payload) {
    return request('/trips', {
      method: 'POST',
      body: payload
    });
  },
  updateTrip(payload) {
    return request('/trips/update', {
      method: 'POST',
      body: {
        ...payload,
        base_updated_at: payload.updated_at
      }
    });
  },
  createInventoryItem(payload) {
    return request('/inventory-items', {
      method: 'POST',
      body: payload
    });
  },
  updateInventoryItem(payload) {
    return request('/inventory-items/update', {
      method: 'POST',
      body: {
        ...payload,
        base_updated_at: payload.updated_at
      }
    });
  },
  deleteInventoryItem(payload) {
    return request('/inventory-items/delete', {
      method: 'POST',
      body: {
        ...payload,
        base_updated_at: payload.updated_at
      }
    });
  },
  replaceTripChecklist(payload) {
    return request('/trip-checklist/replace', {
      method: 'POST',
      body: {
        ...payload,
        base_updated_at: payload.base_updated_at
      }
    });
  },
  // Stores
  createStore(payload) {
    return request('/stores', {
      method: 'POST',
      body: payload
    });
  },
  updateStore(payload) {
    return request('/stores/update', {
      method: 'POST',
      body: {
        ...payload,
        base_updated_at: payload.updated_at
      }
    });
  },
  deleteStore(payload) {
    return request('/stores/delete', {
      method: 'POST',
      body: {
        ...payload,
        base_updated_at: payload.updated_at
      }
    });
  },
  // Categories
  createCategory(payload) {
    return request('/categories', {
      method: 'POST',
      body: payload
    });
  },
  updateCategory(payload) {
    return request('/categories/update', {
      method: 'POST',
      body: {
        ...payload,
        base_updated_at: payload.updated_at
      }
    });
  },
  deleteCategory(payload) {
    return request('/categories/delete', {
      method: 'POST',
      body: {
        ...payload,
        base_updated_at: payload.updated_at
      }
    });
  }
};
