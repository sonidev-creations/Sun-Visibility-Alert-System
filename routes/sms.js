// routes/sms.js
import express from 'express';
import { sendAlerts } from '../services/alertService.js';

const router = express.Router();

// POST /api/sms/send  -> triggers immediate SMS and returns the composed message
router.post('/send', async (req, res) => {
  try {
    const result = await sendAlerts();
    res.json({ success: true, sid: result.sid, message: result.body });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
