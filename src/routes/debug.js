const express = require('express');
const router = express.Router();

/**
 * @route POST /api/debug/echo
 * @desc  Echo received headers and body for debugging
 * @access Public
 */
router.post('/echo', (req, res) => {
  try {
    // Return headers and parsed body so we can inspect what the server receives
    res.json({
      success: true,
      received: {
        headers: req.headers,
        body: req.body
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
