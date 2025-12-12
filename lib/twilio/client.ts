import twilio from 'twilio';

let twilioInstance: ReturnType<typeof twilio> | null = null;

/**
 * Get Twilio client instance (lazy initialization)
 * This allows the build to complete even if Twilio credentials are not set
 */
function getTwilioClient() {
  if (!twilioInstance) {
    if (!process.env.TWILIO_ACCOUNT_SID) {
      throw new Error('TWILIO_ACCOUNT_SID is not set');
    }
    if (!process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('TWILIO_AUTH_TOKEN is not set');
    }
    twilioInstance = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return twilioInstance;
}

// Lazy proxy that only initializes Twilio when actually used
export const twilioClient = new Proxy({} as ReturnType<typeof twilio>, {
  get(_target, prop) {
    const instance = getTwilioClient();
    const value = instance[prop as keyof typeof instance];
    // If it's a function, bind it to the instance
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
}) as ReturnType<typeof twilio>;

export type TwilioCallStatus = 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer' | 'canceled';

