const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { SiweMessage } = require('siwe');
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// Initialize Supabase client (backend)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No authentication token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

// POST /api/auth/wallet/verify - Verify SIWE signature and authenticate
router.post('/wallet/verify', async (req, res) => {
  try {
    const { message, signature, address } = req.body;

    if (!message || !signature || !address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
    }

    // Parse and verify SIWE message
    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature });

    if (fields.data.address.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: 'Address mismatch',
      });
    }

    // Create or get user from Supabase (if available)
    let userId = null;
    let userEmail = null;

    if (supabase) {
      // Check if user with this wallet already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', address.toLowerCase())
        .single();

      if (existingProfile) {
        userId = existingProfile.id;
        userEmail = existingProfile.email;
      } else {
        // Create new user profile
        const { data: newProfile, error } = await supabase
          .from('user_profiles')
          .insert({
            wallet_address: address.toLowerCase(),
            email: null,
            linked_socials: null,
          })
          .select()
          .single();

        if (error) {
          logger.error('Error creating user profile:', error);
        } else {
          userId = newProfile.id;
        }
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        address: address.toLowerCase(),
        userId,
        email: userEmail,
        authMethod: 'wallet',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      success: true,
      message: 'Wallet authenticated successfully',
      token,
      user: {
        id: userId,
        address: address.toLowerCase(),
        email: userEmail,
      },
    });
  } catch (error) {
    logger.error('Wallet verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Wallet verification failed',
      error: error.message,
    });
  }
});

// POST /api/auth/wallet/link - Link wallet to existing account
router.post('/wallet/link', verifyToken, async (req, res) => {
  try {
    const { message, signature, address, userId } = req.body;

    if (!message || !signature || !address || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
    }

    // Verify user from token matches userId
    if (req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Parse and verify SIWE message
    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature });

    if (fields.data.address.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: 'Address mismatch',
      });
    }

    // Update user profile in Supabase
    if (supabase) {
      // Check if wallet is already linked to another account
      const { data: existingWallet } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', address.toLowerCase())
        .single();

      if (existingWallet && existingWallet.id !== userId) {
        return res.status(400).json({
          success: false,
          message: 'This wallet is already linked to another account',
        });
      }

      // Link wallet to user profile
      const { error } = await supabase
        .from('user_profiles')
        .update({ wallet_address: address.toLowerCase() })
        .eq('id', userId);

      if (error) {
        logger.error('Error linking wallet:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to link wallet',
        });
      }
    }

    return res.json({
      success: true,
      message: 'Wallet linked successfully',
    });
  } catch (error) {
    logger.error('Wallet link error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to link wallet',
      error: error.message,
    });
  }
});

// POST /api/auth/wallet/unlink - Unlink wallet from account
router.post('/wallet/unlink', verifyToken, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId',
      });
    }

    // Verify user from token matches userId
    if (req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Unlink wallet from user profile
    if (supabase) {
      const { error } = await supabase
        .from('user_profiles')
        .update({ wallet_address: null })
        .eq('id', userId);

      if (error) {
        logger.error('Error unlinking wallet:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to unlink wallet',
        });
      }
    }

    return res.json({
      success: true,
      message: 'Wallet unlinked successfully',
    });
  } catch (error) {
    logger.error('Wallet unlink error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to unlink wallet',
      error: error.message,
    });
  }
});

// POST /api/auth/logout - Logout user
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// GET /api/auth/session - Get current session
router.get('/session', verifyToken, async (req, res) => {
  try {
    let userProfile = null;

    if (supabase && req.user.userId) {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', req.user.userId)
        .single();

      userProfile = data;
    }

    return res.json({
      success: true,
      user: {
        id: req.user.userId,
        address: req.user.address,
        email: req.user.email,
        authMethod: req.user.authMethod,
        profile: userProfile,
      },
    });
  } catch (error) {
    logger.error('Session retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve session',
    });
  }
});

// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh', verifyToken, (req, res) => {
  try {
    // Generate new token with same data
    const token = jwt.sign(
      {
        address: req.user.address,
        userId: req.user.userId,
        email: req.user.email,
        authMethod: req.user.authMethod,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set new HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      success: true,
      message: 'Token refreshed successfully',
      token,
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to refresh token',
    });
  }
});

module.exports = router;
module.exports.verifyToken = verifyToken;
