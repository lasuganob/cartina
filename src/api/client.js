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
  getTrips() {
    return request('/trips');
  },
  createTrip(payload) {
    return request('/trips', {
      method: 'POST',
      body: payload
    });
  },
  updateTrip(payload) {
    return request('/trips/update', {
      method: 'POST',
      body: payload
    });
  },
  replaceTripChecklist(payload) {
    return request('/trip-checklist/replace', {
      method: 'POST',
      body: payload
    });
  }
};
