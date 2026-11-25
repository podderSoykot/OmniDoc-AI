import { describe, it, expect, beforeEach } from 'vitest';
import { AuthStorage } from '../lib/auth';

describe('AuthStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves access and refresh tokens', () => {
    const user = {
      id: 'usr-123',
      email: 'tester@omnidoc.ai',
      full_name: 'Test Engineer',
      created_at: new Date().toISOString()
    };

    AuthStorage.setAuth('access-token-123', 'refresh-token-456', user);
    expect(AuthStorage.getToken()).toBe('access-token-123');
    expect(AuthStorage.getRefreshToken()).toBe('refresh-token-456');
    expect(AuthStorage.getUser()?.email).toBe('tester@omnidoc.ai');
  });

  it('updates access token independently', () => {
    AuthStorage.updateAccessToken('new-access-token-789');
    expect(AuthStorage.getToken()).toBe('new-access-token-789');
  });

  it('clears all session storage on logout', () => {
    const user = {
      id: 'usr-123',
      email: 'tester@omnidoc.ai',
      full_name: 'Test Engineer',
      created_at: new Date().toISOString()
    };
    AuthStorage.setAuth('token', 'refresh', user);
    expect(AuthStorage.getToken()).toBe('token');

    AuthStorage.clear();
    expect(AuthStorage.getToken()).toBeNull();
    expect(AuthStorage.getRefreshToken()).toBeNull();
    expect(AuthStorage.getUser()).toBeNull();
  });
});
