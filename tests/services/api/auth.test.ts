import { authApi } from '@/services/api/auth';
import { apiClient } from '@/services/api/client';

jest.mock('@/services/api/client', () => ({
  apiClient: {
    clearCookies: jest.fn(),
    postUrlEncoded: jest.fn(),
    getCookies: jest.fn(),
  },
}));

jest.mock('@/services/connectivity-log', () => ({
  clogDebug: jest.fn(),
  clogError: jest.fn(),
  clogInfo: jest.fn(),
  clogWarn: jest.fn(),
}));

const mockApiClient = apiClient as unknown as {
  clearCookies: jest.Mock;
  postUrlEncoded: jest.Mock;
  getCookies: jest.Mock;
};

describe('authApi.login', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('accepts legacy qBittorrent login success responses', async () => {
    mockApiClient.postUrlEncoded.mockResolvedValue('Ok.');
    mockApiClient.getCookies.mockReturnValue('SID=abc123');

    await expect(authApi.login('admin', 'password')).resolves.toEqual({ status: 'Ok' });
  });

  it('accepts qBittorrent 5.2 empty login responses when a session cookie is captured', async () => {
    mockApiClient.postUrlEncoded.mockResolvedValue('');
    mockApiClient.getCookies.mockReturnValue('QBT_SID_8080=abc123');

    await expect(authApi.login('admin', 'password')).resolves.toEqual({ status: 'Ok' });
  });

  it('rejects empty login responses without a session cookie', async () => {
    mockApiClient.postUrlEncoded.mockResolvedValue('');
    mockApiClient.getCookies.mockReturnValue('');

    await expect(authApi.login('admin', 'password')).resolves.toEqual({ status: 'Fails' });
  });

  it('rejects explicit qBittorrent login failure responses', async () => {
    mockApiClient.postUrlEncoded.mockResolvedValue('Fails.');
    mockApiClient.getCookies.mockReturnValue('');

    await expect(authApi.login('admin', 'wrong-password')).resolves.toEqual({ status: 'Fails' });
  });
});
