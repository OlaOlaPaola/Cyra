import { http, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';

// Oasis Sapphire Testnet configuration
export const sapphireTestnet = defineChain({
  id: 0x5aff, // 23295
  name: 'Oasis Sapphire Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'TEST',
    symbol: 'TEST',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.sapphire.oasis.dev'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Oasis Explorer',
      url: 'https://testnet.explorer.sapphire.oasis.dev',
    },
  },
  testnet: true,
});

// Oasis Sapphire Mainnet configuration
export const sapphireMainnet = defineChain({
  id: 0x5afe, // 23294
  name: 'Oasis Sapphire',
  nativeCurrency: {
    decimals: 18,
    name: 'ROSE',
    symbol: 'ROSE',
  },
  rpcUrls: {
    default: {
      http: ['https://sapphire.oasis.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Oasis Explorer',
      url: 'https://explorer.sapphire.oasis.dev',
    },
  },
  testnet: false,
});

// Wagmi configuration for future smart contract interactions
export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, sapphireTestnet, sapphireMainnet],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [sapphireTestnet.id]: http(),
    [sapphireMainnet.id]: http(),
  },
});

// Placeholder hook for Plan4HER contract interactions
export const usePlan4HERContract = () => {
  // This will be replaced with actual contract logic later
  const mockRead = async () => {
    console.log('Mock contract read');
    return null;
  };

  const mockWrite = async () => {
    console.log('Mock contract write');
    return null;
  };

  return {
    read: mockRead,
    write: mockWrite,
  };
};
