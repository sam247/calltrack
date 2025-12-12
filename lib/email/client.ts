import { Resend } from 'resend';

let resendInstance: Resend | null = null;

/**
 * Get Resend client instance (lazy initialization)
 * This allows the build to complete even if RESEND_API_KEY is not set
 */
function getResend(): Resend {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set');
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    const resend = getResend();
    const result = await resend.emails.send({
      from: options.from || process.env.RESEND_FROM_EMAIL || 'CallTrack <noreply@calltrack.com>',
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

