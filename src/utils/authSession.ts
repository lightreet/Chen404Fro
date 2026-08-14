export const AUTH_SESSION_CHANGED_EVENT = 'chen404:auth-session-changed';

const AUTH_STORAGE_KEYS = ['token', 'refreshToken', 'user', 'remember'] as const;

export interface AuthSessionSnapshot {
  token: string;
  refreshToken: string;
  userJson: string;
  remember: boolean;
}

interface SaveAuthSessionOptions {
  token: string;
  refreshToken: string;
  userJson: string;
  remember: boolean;
}

function readStorage(storage: Storage, remember: boolean): AuthSessionSnapshot {
  return {
    token: storage.getItem('token') || '',
    refreshToken: storage.getItem('refreshToken') || '',
    userJson: storage.getItem('user') || '',
    remember,
  };
}

function hasStoredSession(snapshot: AuthSessionSnapshot) {
  return Boolean(snapshot.token || snapshot.refreshToken || snapshot.userJson);
}

function resolveActiveStorage(): Storage | null {
  const currentSession = readStorage(sessionStorage, false);
  if (hasStoredSession(currentSession)) return sessionStorage;

  const persistentSession = readStorage(localStorage, localStorage.getItem('remember') === 'true');
  if (hasStoredSession(persistentSession)) return localStorage;
  return null;
}

function clearStorage(storage: Storage) {
  AUTH_STORAGE_KEYS.forEach((key) => storage.removeItem(key));
}

function emitSessionChanged() {
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

export function readAuthSession(): AuthSessionSnapshot {
  const storage = resolveActiveStorage();
  if (!storage) {
    return { token: '', refreshToken: '', userJson: '', remember: false };
  }
  return readStorage(storage, storage === localStorage && storage.getItem('remember') === 'true');
}

export function readAccessToken() {
  return readAuthSession().token;
}

export function readRefreshToken() {
  return readAuthSession().refreshToken;
}

export function saveAuthSession(options: SaveAuthSessionOptions) {
  clearStorage(localStorage);
  clearStorage(sessionStorage);

  const storage = options.remember ? localStorage : sessionStorage;
  storage.setItem('token', options.token);
  storage.setItem('refreshToken', options.refreshToken);
  storage.setItem('user', options.userJson);
  storage.setItem('remember', String(options.remember));
  emitSessionChanged();
}

export function updateAuthTokens(token: string, refreshToken?: string) {
  const storage = resolveActiveStorage() || sessionStorage;
  storage.setItem('token', token);
  if (refreshToken !== undefined) {
    if (refreshToken) storage.setItem('refreshToken', refreshToken);
    else storage.removeItem('refreshToken');
  }
  emitSessionChanged();
}

export function updateStoredUser(userJson: string) {
  const storage = resolveActiveStorage() || sessionStorage;
  if (userJson) storage.setItem('user', userJson);
  else storage.removeItem('user');
  emitSessionChanged();
}

export function clearAuthSession() {
  clearStorage(localStorage);
  clearStorage(sessionStorage);
  emitSessionChanged();
}
