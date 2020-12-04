import { ChainID } from 'caip';
import { getChainConfig, getChainJsonRpc } from 'caip-api';
import {
  BlockchainAuthenticator,
  BlockchainProvider,
} from '@json-rpc-tools/blockchain';
import { JsonRpcProvider } from '@json-rpc-tools/provider';

import {
  ChainAuthenticatorsMap,
  GenerateChainAuthenticatorsOptions,
} from './types';
import { BlockchainSignerConnection } from './signer';

import * as blockchain from '../';

export function getChainSigner(
  chainId: string
): typeof BlockchainSignerConnection {
  const { namespace } = ChainID.parse(chainId);
  const signer = blockchain.signer[namespace];

  if (!signer) {
    throw new Error(`No matching signer for chainId: ${chainId}`);
  }
  return signer;
}

export function generateChainAuthenticators(
  opts: GenerateChainAuthenticatorsOptions
): ChainAuthenticatorsMap {
  const map: ChainAuthenticatorsMap = {};
  opts.chainIds.forEach((chainId: string) => {
    const config = getChainConfig(chainId);
    const keyPair = opts.keyring.getKeyPair(config.derivationPath);
    const SignerConnection = getChainSigner(chainId);
    const http = new JsonRpcProvider(config.rpcUrl);
    const connection = new SignerConnection({ keyPair, provider: http });
    // TODO: make caip-api jsonrpc schemas required
    const { state, schemas } = getChainJsonRpc(chainId);
    const provider = new BlockchainProvider({
      providers: {
        http,
        signer: new JsonRpcProvider(connection),
      },
      routes: {
        // TODO: add wildcard support for jsonrpc routes
        http: ['*'],
        signer: Object.keys(schemas || []),
      },
      state,
      schemas,
    });
    const auth = new BlockchainAuthenticator(provider, opts.store);
    map[chainId] = auth;
  });
  return map;
}
