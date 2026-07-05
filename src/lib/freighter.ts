import {
  isConnected,
  isAllowed,
  requestAccess,
  getPublicKey,
  getNetworkDetails,
  signTransaction,
} from '@stellar/freighter-api';

export class FreighterNotInstalledError extends Error {
  constructor() {
    super('Freighter wallet extension is not installed.');
    this.name = 'FreighterNotInstalledError';
  }
}

export class FreighterConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FreighterConnectionError';
  }
}

export async function isFreighterInstalled(): Promise<boolean> {
  return isConnected();
}

/**
 * Prompts the Freighter extension for account access and returns the
 * user's public key. Throws if the extension is missing or the user declines.
 */
export async function connectFreighter(): Promise<string> {
  const installed = await isFreighterInstalled();
  if (!installed) throw new FreighterNotInstalledError();

  const allowed = await isAllowed();
  if (!allowed) {
    await requestAccess();
  }

  try {
    return await getPublicKey();
  } catch (err) {
    throw new FreighterConnectionError(
      err instanceof Error ? err.message : 'Could not read wallet address.',
    );
  }
}

export async function getConnectedNetwork(): Promise<{
  network: string;
  networkPassphrase: string;
}> {
  try {
    const details = await getNetworkDetails();
    return { network: details.network, networkPassphrase: details.networkPassphrase };
  } catch (err) {
    throw new FreighterConnectionError(
      err instanceof Error ? err.message : 'Could not read Freighter network.',
    );
  }
}

/**
 * Hands an unsigned transaction envelope (XDR) to Freighter for the user to
 * review and sign. The frontend never sees or handles a private key.
 */
export async function signTransactionXdr(
  xdr: string,
  opts: { networkPassphrase: string },
): Promise<string> {
  try {
    return await signTransaction(xdr, { networkPassphrase: opts.networkPassphrase });
  } catch (err) {
    throw new FreighterConnectionError(
      err instanceof Error ? err.message : 'Transaction signing was rejected.',
    );
  }
}
