import Store from '@pedrouid/iso-store';
import { KeyPair } from 'mnemonic-keyring';
import { ChainJsonRpc } from 'caip-api';
import {
  BlockchainAuthenticator,
  BlockchainProvider,
} from '@json-rpc-tools/blockchain';

import { getChainSignerConnection } from './signer';

export async function generateChainAuthenticator(
  chainId: string,
  rpcUrl: string,
  keyPair: KeyPair,
  jsonrpc: ChainJsonRpc,
  store?: Store
): Promise<BlockchainAuthenticator> {
  const SignerConnection = getChainSignerConnection(chainId);
  const provider = new BlockchainProvider(rpcUrl, {
    chainId,
    routes: jsonrpc.routes.http,
    signer: {
      routes: jsonrpc.routes.signer,
      connection: new SignerConnection({ keyPair, rpcUrl }),
    },
    validator: {
      schemas: jsonrpc.schemas,
    },
  });
  await provider.connect();
  const auth = new BlockchainAuthenticator({
    provider,
    requiredApproval: jsonrpc.wallet.auth,
    store,
  });
  await auth.init();
  return auth;
}