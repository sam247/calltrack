import twilio from 'twilio';

if (!process.env.TWILIO_ACCOUNT_SID) {
  throw new Error('TWILIO_ACCOUNT_SID is not set');
}

if (!process.env.TWILIO_AUTH_TOKEN) {
  throw new Error('TWILIO_AUTH_TOKEN is not set');
}

// Initialize Twilio client
export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export type TwilioCallStatus = 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer' | 'canceled';

