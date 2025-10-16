async function refreshSession() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });

  if (response.ok) {
    return;
  }

  const payload = await response.json().catch(() => ({}));
  const error = new Error(payload.message || 'Přihlášení vypršelo, přihlaste se prosím znovu.');
  error.status = response.status;
  throw error;
}

export async function apiFetch(url, options = {}) {
  const { skipAuthRefresh, ...fetchOptions } = options;
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(fetchOptions.headers || {}) },
    ...fetchOptions
  });

  if (response.status === 401 && !skipAuthRefresh && !url.startsWith('/api/auth/refresh')) {
    const originalPayload = await response.clone().json().catch(() => ({}));
    try {
      await refreshSession();
      return apiFetch(url, { ...fetchOptions, skipAuthRefresh: true });
    } catch (refreshError) {
      if (!refreshError.status) {
        refreshError.status = 401;
      }
      if (!refreshError.message) {
        refreshError.message = originalPayload.message || 'Nejste přihlášen(a).';
      }
      throw refreshError;
    }
  }

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(payload.message || 'Došlo k chybě při komunikaci se serverem.');
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function tryRefresh() {
  try {
    await apiFetch('/api/auth/refresh', { method: 'POST', skipAuthRefresh: true });
  } catch (error) {
    console.error('Refresh token selhal', error);
  }
}
