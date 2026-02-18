'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuth } from '@/lib/auth-context';
import { auth, userProfile } from '@/lib/supabase';
import { linkWalletToAccount, unlinkWalletFromAccount } from '@/lib/siwe';
import {
  Settings,
  Wallet,
  Mail,
  Shield,
  Link as LinkIcon,
  Unlink,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const isWalletLinked = !!profile?.wallet_address;
  const linkedSocials = profile?.linked_socials || {};

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  // Link wallet
  const handleLinkWallet = async () => {
    if (!user || !address || !chainId) {
      setMessage({ type: 'error', text: 'Please connect your wallet first' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await linkWalletToAccount(user.id, address, chainId, async (msg) => {
        return await signMessageAsync({ message: msg });
      });

      if (result.success) {
        await refreshProfile();
        setMessage({ type: 'success', text: 'Wallet linked successfully!' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to link wallet' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  // Unlink wallet
  const handleUnlinkWallet = async () => {
    if (!user) return;

    if (!confirm('Are you sure you want to unlink your wallet?')) return;

    setLoading(true);
    setMessage(null);

    try {
      const result = await unlinkWalletFromAccount(user.id);

      if (result.success) {
        await refreshProfile();
        setMessage({ type: 'success', text: 'Wallet unlinked successfully!' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to unlink wallet' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  // Link social account
  const handleLinkSocial = async (provider: 'google' | 'twitter') => {
    setLoading(true);
    setMessage(null);

    try {
      const { error } = provider === 'google'
        ? await auth.signInWithGoogle()
        : await auth.signInWithTwitter();

      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to link account' });
      } else {
        setMessage({ type: 'success', text: `${provider} account linked!` });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  // Unlink social account
  const handleUnlinkSocial = async (provider: 'google' | 'twitter') => {
    if (!user) return;

    if (!confirm(`Are you sure you want to unlink your ${provider} account?`)) return;

    setLoading(true);
    setMessage(null);

    try {
      await userProfile.unlinkSocial(user.id, provider);
      await refreshProfile();
      setMessage({ type: 'success', text: `${provider} account unlinked!` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const handleUpdatePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await auth.updatePassword(newPassword);

      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to update password' });
      } else {
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-purple-400" />
        <h1 className="text-3xl font-bold text-white">Account Settings</h1>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/50 text-green-400'
              : 'bg-red-500/10 border border-red-500/50 text-red-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Account Information */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Account Information
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <p className="text-white font-medium">{user?.email || 'No email'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-sm text-slate-400">User ID</p>
                <p className="text-white font-mono text-sm">{user?.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Connection
          </h3>

          {isWalletLinked ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-400">Linked Wallet</p>
                  <p className="text-white font-mono text-sm">
                    {profile.wallet_address?.slice(0, 6)}...{profile.wallet_address?.slice(-4)}
                  </p>
                </div>
                <button
                  onClick={handleUnlinkWallet}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50"
                >
                  <Unlink className="w-4 h-4" />
                  Unlink
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm mb-4">
                Link your Ethereum wallet to access Web3 features
              </p>

              <div className="flex items-center gap-4">
                {!address ? (
                  <ConnectButton />
                ) : (
                  <button
                    onClick={handleLinkWallet}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LinkIcon className="w-4 h-4" />
                    )}
                    Link Wallet
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Linked Accounts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Linked Accounts
          </h3>

          <div className="space-y-3">
            {/* Google */}
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">Google</p>
                  <p className="text-sm text-slate-400">
                    {linkedSocials.google ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              {linkedSocials.google ? (
                <button
                  onClick={() => handleUnlinkSocial('google')}
                  disabled={loading}
                  className="px-4 py-2 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/10 transition-all disabled:opacity-50"
                >
                  Unlink
                </button>
              ) : (
                <button
                  onClick={() => handleLinkSocial('google')}
                  disabled={loading}
                  className="px-4 py-2 text-purple-400 border border-purple-500/50 rounded-lg hover:bg-purple-500/10 transition-all disabled:opacity-50"
                >
                  Link
                </button>
              )}
            </div>

            {/* Twitter */}
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">X (Twitter)</p>
                  <p className="text-sm text-slate-400">
                    {linkedSocials.twitter ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              {linkedSocials.twitter ? (
                <button
                  onClick={() => handleUnlinkSocial('twitter')}
                  disabled={loading}
                  className="px-4 py-2 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/10 transition-all disabled:opacity-50"
                >
                  Unlink
                </button>
              ) : (
                <button
                  onClick={() => handleLinkSocial('twitter')}
                  disabled={loading}
                  className="px-4 py-2 text-purple-400 border border-purple-500/50 rounded-lg hover:bg-purple-500/10 transition-all disabled:opacity-50"
                >
                  Link
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Security */}
        {user?.email && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                onClick={handleUpdatePassword}
                disabled={loading || !newPassword || !confirmNewPassword}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-red-400 mb-4">Danger Zone</h3>
          <p className="text-slate-400 text-sm mb-4">
            Once you sign out, you&apos;ll need to sign in again to access your account.
          </p>
          <button
            onClick={() => signOut()}
            className="px-6 py-3 bg-red-500/10 border border-red-500/50 text-red-400 font-semibold rounded-lg hover:bg-red-500/20 transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
