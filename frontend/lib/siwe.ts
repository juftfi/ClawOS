import { SiweMessage } from 'siwe';
import { userProfile } from './supabase';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export interface SiweAuthResult {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
}

// Create SIWE message for signing
export function createSiweMessage(address: string, chainId: number): SiweMessage {
  const domain = window.location.host;
  const origin = window.location.origin;

  return new SiweMessage({
    domain,
    address,
    statement: 'Sign in with Ethereum to AgentOS',
    uri: origin,
    version: '1',
    chainId,
    nonce: generateNonce(),
    issuedAt: new Date().toISOString(),
  });
}

// Generate a random nonce
function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// Sign in with wallet
export async function signInWithWallet(
  address: string,
  chainId: number,
  signMessage: (message: string) => Promise<string>
): Promise<SiweAuthResult> {
  try {
    // Step 1: Create SIWE message
    const message = createSiweMessage(address, chainId);
    const messageStr = message.prepareMessage();

    // Step 2: Sign the message with wallet
    const signature = await signMessage(messageStr);

    // Step 3: Verify signature on backend
    const response = await fetch(`${BACKEND_URL}/api/auth/wallet/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include cookies
      body: JSON.stringify({
        message: messageStr,
        signature,
        address,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || 'Wallet authentication failed',
      };
    }

    const data = await response.json();

    return {
      success: true,
      token: data.token,
      user: data.user,
      message: 'Successfully signed in with wallet',
    };
  } catch (error: any) {
    console.error('SIWE error:', error);
    return {
      success: false,
      message: error.message || 'An error occurred during wallet authentication',
    };
  }
}

// Link wallet to existing account
export async function linkWalletToAccount(
  userId: string,
  address: string,
  chainId: number,
  signMessage: (message: string) => Promise<string>
): Promise<{ success: boolean; message?: string }> {
  try {
    // Step 1: Create SIWE message
    const message = createSiweMessage(address, chainId);
    const messageStr = message.prepareMessage();

    // Step 2: Sign the message
    const signature = await signMessage(messageStr);

    // Step 3: Verify and link on backend
    const response = await fetch(`${BACKEND_URL}/api/auth/wallet/link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        message: messageStr,
        signature,
        address,
        userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || 'Failed to link wallet',
      };
    }

    // Update user profile in Supabase
    await userProfile.linkWallet(userId, address);

    return {
      success: true,
      message: 'Wallet linked successfully',
    };
  } catch (error: any) {
    console.error('Link wallet error:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while linking wallet',
    };
  }
}

// Unlink wallet from account
export async function unlinkWalletFromAccount(
  userId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/wallet/unlink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || 'Failed to unlink wallet',
      };
    }

    // Update user profile in Supabase
    await userProfile.unlinkWallet(userId);

    return {
      success: true,
      message: 'Wallet unlinked successfully',
    };
  } catch (error: any) {
    console.error('Unlink wallet error:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while unlinking wallet',
    };
  }
}
