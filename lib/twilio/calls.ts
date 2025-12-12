import { twilioClient } from './client';
import twilio from 'twilio';
import type { TwilioCallStatus } from './client';

export interface CallForwardingOptions {
  to: string; // The number to forward to
  from: string; // The tracking number
  callSid?: string; // Existing call SID if updating
  recordingEnabled?: boolean;
  recordingStatusCallback?: string;
}

/**
 * Forward an incoming call to a destination number
 */
export async function forwardCall(options: CallForwardingOptions): Promise<string> {
  try {
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Add recording if enabled
    if (options.recordingEnabled) {
      const dial = twiml.dial({
        record: 'record-from-answer',
        recordingStatusCallback: options.recordingStatusCallback,
        recordingStatusCallbackMethod: 'POST',
      });
      dial.number(options.to);
    } else {
      twiml.dial(options.to);
    }

    return twiml.toString();
  } catch (error: any) {
    console.error('Error creating call forwarding TwiML:', error);
    throw new Error(`Failed to forward call: ${error.message}`);
  }
}

/**
 * Get call details from Twilio
 */
export async function getCallDetails(callSid: string) {
  try {
    return await twilioClient.calls(callSid).fetch();
  } catch (error: any) {
    console.error('Error fetching call details:', error);
    throw new Error(`Failed to fetch call details: ${error.message}`);
  }
}

/**
 * Get call recordings
 */
export async function getCallRecordings(callSid: string) {
  try {
    return await twilioClient.calls(callSid).recordings.list();
  } catch (error: any) {
    console.error('Error fetching call recordings:', error);
    throw new Error(`Failed to fetch call recordings: ${error.message}`);
  }
}

/**
 * Hang up an active call
 */
export async function hangupCall(callSid: string): Promise<void> {
  try {
    await twilioClient.calls(callSid).update({ status: 'completed' });
  } catch (error: any) {
    console.error('Error hanging up call:', error);
    throw new Error(`Failed to hang up call: ${error.message}`);
  }
}

