/**
 * OrdinaryMatter — REST API Service
 *
 * HTTP client for the relay server REST endpoints.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SERVER_URL: 'om_server_url',
  AUTH_TOKEN: 'om_auth_token',
  DEVICE_INFO: 'om_device_info',
};

class ApiService {
  private baseUrl: string = '';
  private token: string = '';

  /**
   * Initialize from stored values.
   */
  async init(): Promise<{ serverUrl: string; token: string } | null> {
    try {
      const serverUrl = await AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL);
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

      if (serverUrl && token) {
        this.baseUrl = serverUrl;
        this.token = token;
        return { serverUrl, token };
      }
    } catch {
      // Storage error
    }
    return null;
  }

  /**
   * Save connection info.
   */
  async saveConnection(serverUrl: string, token: string): Promise<void> {
    this.baseUrl = serverUrl;
    this.token = token;
    await AsyncStorage.setItem(STORAGE_KEYS.SERVER_URL, serverUrl);
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  /**
   * Clear stored connection info.
   */
  async clearConnection(): Promise<void> {
    this.baseUrl = '';
    this.token = '';
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.SERVER_URL,
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.DEVICE_INFO,
    ]);
  }

  /**
   * Make an authenticated request to the relay server.
   */
  private async request<T>(
    method: string,
    path: string,
    body?: any,
    requiresAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ─── Health ─────────────────────────────────────────────

  async health(): Promise<{ ok: boolean; version: string }> {
    return this.request('GET', '/api/health', undefined, false);
  }

  // ─── Pairing ────────────────────────────────────────────

  async pair(
    serverUrl: string,
    code: string,
    deviceName: string,
    platform: string
  ): Promise<{ token: string; device: any }> {
    this.baseUrl = serverUrl;

    const result = await this.request<{ token: string; device: any }>(
      'POST',
      '/api/pair',
      { code, deviceName, platform },
      false
    );

    // Save connection
    this.token = result.token;
    await this.saveConnection(serverUrl, result.token);

    return result;
  }

  async unpair(): Promise<void> {
    try {
      await this.request('POST', '/api/unpair');
    } catch {
      // OK if server is unreachable
    }
    await this.clearConnection();
  }

  // ─── Status ─────────────────────────────────────────────

  async getStatus(): Promise<any> {
    return this.request('GET', '/api/status');
  }

  // ─── Sessions ───────────────────────────────────────────

  async getSessions(): Promise<any[]> {
    return this.request('GET', '/api/sessions');
  }

  async getSession(id: string): Promise<any> {
    return this.request('GET', `/api/sessions/${encodeURIComponent(id)}`);
  }

  // ─── Notifications ─────────────────────────────────────

  async getNotifications(): Promise<any[]> {
    return this.request('GET', '/api/notifications');
  }

  async markNotificationsRead(ids: string[] = []): Promise<void> {
    await this.request('POST', '/api/notifications/read', { ids });
  }

  // ─── Device ─────────────────────────────────────────────

  async getDevice(): Promise<any> {
    return this.request('GET', '/api/device');
  }

  // ─── Getters ────────────────────────────────────────────

  get serverUrl(): string {
    return this.baseUrl;
  }

  get isConfigured(): boolean {
    return this.baseUrl.length > 0 && this.token.length > 0;
  }

  get authToken(): string {
    return this.token;
  }
}

export const apiService = new ApiService();
export { STORAGE_KEYS };
