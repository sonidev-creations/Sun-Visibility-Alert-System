// routes/smsStatus.js
import express from 'express';
const router = express.Router();

// Twilio will POST JSON/x-www-form-urlencoded data when status changes
router.post('/sms-status', express.urlencoded({ extended: false }), (req, res) => {
  // req.body contains MessageSid, MessageStatus, To, From, etc.
  console.log('Twilio status callback:', req.body);
  // save to DB if needed
  res.sendStatus(200);
});

export default router;
