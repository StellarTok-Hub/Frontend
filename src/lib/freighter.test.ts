import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const isConnectedMock = vi.fn();
const isAllowedMock = vi.fn();
const requestAccessMock = vi.fn();
const getPublicKeyMock = vi.fn();
const getNetworkDetailsMock = vi.fn();
const signTransactionMock = vi.fn();

vi.mock('@stellar/freighter-api', () => ({
  isConnected: isConnectedMock,
  isAllowed: isAllowedMock,
  requestAccess: requestAccessMock,
  getPublicKey: getPublicKeyMock,
  getNetworkDetails: getNetworkDetailsMock,
  signTransaction: signTransactionMock,
}));

const {
  connectFreighter,
  FreighterConnectionError,
  FreighterNotInstalledError,
  getConnectedNetwork,
  isFreighterInstalled,
  signTransactionXdr,
} = await import('./freighter');

beforeEach(() => {
  isConnectedMock.mockReset();
  isAllowedMock.mockReset();
  requestAccessMock.mockReset();
  getPublicKeyMock.mockReset();
  getNetworkDetailsMock.mockReset();
  signTransactionMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('connectFreighter', () => {
  it('throws FreighterNotInstalledError when the extension is not connected', async () => {
    isConnectedMock.mockResolvedValue(false);
    await expect(connectFreighter()).rejects.toBeInstanceOf(FreighterNotInstalledError);
    expect(requestAccessMock).not.toHaveBeenCalled();
  });

  it('requests access only when not already allowed, then returns the public key', async () => {
    isConnectedMock.mockResolvedValue(true);
    isAllowedMock.mockResolvedValue(false);
    requestAccessMock.mockResolvedValue('G...');
    getPublicKeyMock.mockResolvedValue('GPUBLICKEY');

    await expect(connectFreighter()).resolves.toBe('GPUBLICKEY');
    expect(requestAccessMock).toHaveBeenCalledTimes(1);
  });

  it('skips requestAccess when access is already allowed', async () => {
    isConnectedMock.mockResolvedValue(true);
    isAllowedMock.mockResolvedValue(true);
    getPublicKeyMock.mockResolvedValue('GPUBLICKEY');

    await expect(connectFreighter()).resolves.toBe('GPUBLICKEY');
    expect(requestAccessMock).not.toHaveBeenCalled();
  });

  it('wraps a getPublicKey failure in FreighterConnectionError', async () => {
    isConnectedMock.mockResolvedValue(true);
    isAllowedMock.mockResolvedValue(true);
    getPublicKeyMock.mockRejectedValue(new Error('user rejected'));

    await expect(connectFreighter()).rejects.toBeInstanceOf(FreighterConnectionError);
  });
});

describe('getConnectedNetwork', () => {
  it('returns the network and passphrase Freighter reports', async () => {
    getNetworkDetailsMock.mockResolvedValue({
      network: 'TESTNET',
      networkPassphrase: 'Test SDF Network ; September 2015',
      networkUrl: 'https://horizon-testnet.stellar.org',
    });
    await expect(getConnectedNetwork()).resolves.toEqual({
      network: 'TESTNET',
      networkPassphrase: 'Test SDF Network ; September 2015',
    });
  });

  it('wraps a failure in FreighterConnectionError', async () => {
    getNetworkDetailsMock.mockRejectedValue(new Error('not installed'));
    await expect(getConnectedNetwork()).rejects.toBeInstanceOf(FreighterConnectionError);
  });
});

describe('signTransactionXdr', () => {
  it('passes the xdr and networkPassphrase through and returns the signed xdr', async () => {
    signTransactionMock.mockResolvedValue('SIGNED_XDR');
    const opts = { networkPassphrase: 'Test SDF Network ; September 2015' };
    await expect(signTransactionXdr('UNSIGNED_XDR', opts)).resolves.toBe('SIGNED_XDR');
    expect(signTransactionMock).toHaveBeenCalledWith('UNSIGNED_XDR', opts);
  });

  it('wraps a user rejection in FreighterConnectionError', async () => {
    signTransactionMock.mockRejectedValue(new Error('User declined access'));
    await expect(
      signTransactionXdr('UNSIGNED_XDR', { networkPassphrase: 'x' }),
    ).rejects.toBeInstanceOf(FreighterConnectionError);
  });
});

describe('isFreighterInstalled', () => {
  it('reflects isConnected()', async () => {
    isConnectedMock.mockResolvedValue(true);
    await expect(isFreighterInstalled()).resolves.toBe(true);
  });
});
