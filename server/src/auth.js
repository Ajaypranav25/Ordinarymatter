/**
 * OrdinaryMatter — Auth & Device Pairing
 * 
 * Simple token-based authentication for single-device pairing.
 * Generates pairing codes, validates them, and issues JWT tokens.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate a random secret on each server start
const JWT_SECRET = crypto.randomBytes(32).toString('hex');
const TOKEN_EXPIRY = '30d'; // Paired device stays connected for 30 days
const PAIRING_CODE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

class AuthManager {
  constructor(stateManager) {
    this.state = stateManager;
    this.currentPairingCode = null;
    this.pairingCodeExpiresAt = null;
    this.generatePairingCode();
  }

  /**
   * Generate a new 6-digit pairing code.
   */
  generatePairingCode() {
    this.currentPairingCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.pairingCodeExpiresAt = Date.now() + PAIRING_CODE_EXPIRY_MS;
    return this.currentPairingCode;
  }

  /**
   * Get the current pairing code (for display on PC).
   */
  getPairingInfo() {
    // Regenerate if expired
    if (Date.now() > this.pairingCodeExpiresAt) {
      this.generatePairingCode();
    }

    return {
      code: this.currentPairingCode,
      expiresAt: new Date(this.pairingCodeExpiresAt).toISOString(),
      expiresInSeconds: Math.max(0, Math.floor((this.pairingCodeExpiresAt - Date.now()) / 1000)),
    };
  }

  /**
   * Attempt to pair a device using a pairing code.
   * Returns a JWT token on success, null on failure.
   */
  pair(code, deviceInfo = {}) {
    // Check if code matches and hasn't expired
    if (
      code !== this.currentPairingCode ||
      Date.now() > this.pairingCodeExpiresAt
    ) {
      return null;
    }

    // Generate device ID and JWT
    const deviceId = crypto.randomBytes(8).toString('hex');
    const token = jwt.sign(
      {
        deviceId,
        deviceName: deviceInfo.deviceName || 'Mobile Device',
        pairedAt: new Date().toISOString(),
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    // Store paired device
    this.state.pairedDevice = {
      id: deviceId,
      name: deviceInfo.deviceName || 'Mobile Device',
      platform: deviceInfo.platform || 'unknown',
      pairedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    };

    // Invalidate the pairing code
    this.currentPairingCode = null;
    this.pairingCodeExpiresAt = 0;

    return { token, device: this.state.pairedDevice };
  }

  /**
   * Verify a JWT token. Returns the decoded payload or null.
   */
  verifyToken(token) {
    if (!token) return null;

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      // Update last seen
      if (this.state.pairedDevice && this.state.pairedDevice.id === decoded.deviceId) {
        this.state.pairedDevice.lastSeen = new Date().toISOString();
      }

      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Unpair the current device.
   */
  unpair() {
    this.state.pairedDevice = null;
    this.generatePairingCode(); // Generate new code for re-pairing
  }

  /**
   * Express middleware to verify auth token.
   * Allows pairing endpoints without auth.
   */
  middleware() {
    return (req, res, next) => {
      // Allow pairing and status endpoints without auth
      const openPaths = ['/api/pair', '/api/health'];
      if (openPaths.some(p => req.path.startsWith(p))) {
        return next();
      }

      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : req.query.token;

      const decoded = this.verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized. Pair your device first.' });
      }

      req.device = decoded;
      next();
    };
  }

  /**
   * Verify a WebSocket connection's auth token.
   */
  verifyWebSocket(url) {
    try {
      const params = new URLSearchParams(url.split('?')[1] || '');
      const token = params.get('token');
      return this.verifyToken(token);
    } catch {
      return null;
    }
  }
}

module.exports = { AuthManager };
