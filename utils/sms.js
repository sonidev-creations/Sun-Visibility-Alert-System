// sms.js
import Twilio from 'twilio';

// Twilio credentials and numbers
const accountSid = 'YOUR_TWILIO_ACCOUNT_SID'; // Your Twilio Account SID
const authToken = 'YOUR_TWILIO_AUTH_TOKEN';    // Your Twilio Auth Token
const twilioNumber = 'YOUR_TWILIO_PHONE';                     // Your Twilio phone number
const alertPhone = 'YOUR_ALERT_PHONE';                     // Your phone number to receive alerts

// Create Twilio client
const client = new Twilio(accountSid, authToken);

/**
 * Send SMS
 * @param {string} body - Message content
 */
export const sendSms = async (body) => {
  try {
    const message = await client.messages.create({
      from: twilioNumber,
      to: alertPhone,
      body
    });
    console.log('✅ SMS sent! SID:', message.sid);
    return message;
  } catch (err) {
    console.error('❌ Error sending SMS:', err);
    throw err;
  }
};

// Demo usage example
// (Uncomment to test)
// sendSms('🌞 Sun Status: Visible\n💧 Humidity: 68%');
