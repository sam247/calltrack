import { twilioClient } from './client';
import type { Database } from '@/integrations/supabase/types';

export interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  region: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
  };
}

/**
 * Search for available phone numbers in a specific area code or country
 */
export async function searchAvailableNumbers(
  areaCode?: string,
  country: string = 'US',
  limit: number = 10
): Promise<AvailableNumber[]> {
  try {
    const searchParams: any = {
      limit,
    };

    if (areaCode) {
      searchParams.areaCode = areaCode;
    } else {
      searchParams.countryCode = country;
    }

    const availableNumbers = await twilioClient.availablePhoneNumbers(country)
      .local
      .list(searchParams);

    return availableNumbers.map((number) => ({
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      region: number.region || '',
      capabilities: {
        voice: number.capabilities?.voice || false,
        sms: number.capabilities?.sms || false,
      },
    }));
  } catch (error) {
    console.error('Error searching for available numbers:', error);
    throw new Error('Failed to search for available phone numbers');
  }
}

/**
 * Purchase a phone number from Twilio
 */
export async function purchasePhoneNumber(
  phoneNumber: string,
  webhookUrl: string
): Promise<{ phoneNumberSid: string; phoneNumber: string }> {
  try {
    const incomingPhoneNumber = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber,
      voiceUrl: webhookUrl,
      voiceMethod: 'POST',
      statusCallback: webhookUrl,
      statusCallbackMethod: 'POST',
    });

    return {
      phoneNumberSid: incomingPhoneNumber.sid,
      phoneNumber: incomingPhoneNumber.phoneNumber,
    };
  } catch (error: any) {
    console.error('Error purchasing phone number:', error);
    throw new Error(`Failed to purchase phone number: ${error.message}`);
  }
}

/**
 * Update phone number configuration (webhook URL, forwarding number, etc.)
 */
export async function updatePhoneNumber(
  phoneNumberSid: string,
  options: {
    voiceUrl?: string;
    forwardingNumber?: string;
    statusCallback?: string;
  }
): Promise<void> {
  try {
    const updateParams: any = {};

    if (options.voiceUrl) {
      updateParams.voiceUrl = options.voiceUrl;
      updateParams.voiceMethod = 'POST';
    }

    if (options.statusCallback) {
      updateParams.statusCallback = options.statusCallback;
      updateParams.statusCallbackMethod = 'POST';
    }

    await twilioClient.incomingPhoneNumbers(phoneNumberSid).update(updateParams);
  } catch (error: any) {
    console.error('Error updating phone number:', error);
    throw new Error(`Failed to update phone number: ${error.message}`);
  }
}

/**
 * Release a phone number back to Twilio
 */
export async function releasePhoneNumber(phoneNumberSid: string): Promise<void> {
  try {
    await twilioClient.incomingPhoneNumbers(phoneNumberSid).remove();
  } catch (error: any) {
    console.error('Error releasing phone number:', error);
    throw new Error(`Failed to release phone number: ${error.message}`);
  }
}

/**
 * Get phone number details
 */
export async function getPhoneNumber(phoneNumberSid: string) {
  try {
    return await twilioClient.incomingPhoneNumbers(phoneNumberSid).fetch();
  } catch (error: any) {
    console.error('Error fetching phone number:', error);
    throw new Error(`Failed to fetch phone number: ${error.message}`);
  }
}

