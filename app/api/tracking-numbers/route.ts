import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { searchAvailableNumbers, purchasePhoneNumber, updatePhoneNumber } from '@/lib/twilio/numbers';
import { useWorkspace } from '@/hooks/useWorkspace';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tracking-numbers
 * List tracking numbers for the current workspace
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = request.nextUrl.searchParams.get('workspace_id');
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    // Verify user has access to workspace
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: trackingNumbers, error } = await supabase
      .from('tracking_numbers' as any)
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: trackingNumbers });
  } catch (error: any) {
    console.error('Error fetching tracking numbers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tracking numbers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tracking-numbers
 * Create a new tracking number
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspace_id, phone_number, label, source, campaign, forwarding_number, area_code } = body;

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    // Verify user has access to workspace
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    const memberData = member as { role: string } | null;
    if (!memberData || (memberData.role !== 'owner' && memberData.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let twilioNumberSid: string;
    let finalPhoneNumber: string;

    if (phone_number) {
      // Purchase the specified number
      const webhookUrl = `${request.nextUrl.origin}/api/webhooks/twilio`;
      const result = await purchasePhoneNumber(phone_number, webhookUrl);
      twilioNumberSid = result.phoneNumberSid;
      finalPhoneNumber = result.phoneNumber;
    } else if (area_code) {
      // Search and purchase a number in the area code
      const availableNumbers = await searchAvailableNumbers(area_code, 'US', 1);
      if (availableNumbers.length === 0) {
        return NextResponse.json(
          { error: 'No available numbers in that area code' },
          { status: 400 }
        );
      }

      const webhookUrl = `${request.nextUrl.origin}/api/webhooks/twilio`;
      const result = await purchasePhoneNumber(availableNumbers[0].phoneNumber, webhookUrl);
      twilioNumberSid = result.phoneNumberSid;
      finalPhoneNumber = result.phoneNumber;
    } else {
      return NextResponse.json(
        { error: 'phone_number or area_code required' },
        { status: 400 }
      );
    }

    // Update webhook if forwarding number is provided
    if (forwarding_number) {
      await updatePhoneNumber(twilioNumberSid, {
        voiceUrl: `${request.nextUrl.origin}/api/webhooks/twilio`,
        statusCallback: `${request.nextUrl.origin}/api/webhooks/twilio`,
      });
    }

    // Create tracking number record
    const { data: trackingNumber, error } = await supabase
      .from('tracking_numbers' as any)
      .insert({
          workspace_id,
          phone_number: finalPhoneNumber,
          twilio_number_sid: twilioNumberSid,
          forwarding_number: forwarding_number || null,
          label: label || null,
          source: source || null,
          campaign: campaign || null,
          is_active: true,
        } as any)
        .select()
        .single() as any;

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: trackingNumber }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tracking number:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create tracking number' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tracking-numbers
 * Update a tracking number
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, label, source, campaign, forwarding_number, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    // Get tracking number and verify access
    const { data: trackingNumber } = await supabase
      .from('tracking_numbers' as any)
      .select('*, workspaces!inner(id)')
      .eq('id', id)
      .single();

    if (!trackingNumber) {
      return NextResponse.json({ error: 'Tracking number not found' }, { status: 404 });
    }

    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', trackingNumber.workspace_id)
      .eq('user_id', user.id)
      .single();

    const memberData = member as { role: string } | null;
    if (!memberData || (memberData.role !== 'owner' && memberData.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update Twilio configuration if forwarding number changed
    if (forwarding_number !== undefined && trackingNumber.twilio_number_sid) {
      await updatePhoneNumber(trackingNumber.twilio_number_sid, {
        voiceUrl: `${request.nextUrl.origin}/api/webhooks/twilio`,
        statusCallback: `${request.nextUrl.origin}/api/webhooks/twilio`,
      });
    }

    // Update database record
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (label !== undefined) updateData.label = label;
    if (source !== undefined) updateData.source = source;
    if (campaign !== undefined) updateData.campaign = campaign;
    if (forwarding_number !== undefined) updateData.forwarding_number = forwarding_number;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: updated, error } = await supabase
      .from('tracking_numbers' as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error('Error updating tracking number:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update tracking number' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tracking-numbers
 * Delete a tracking number
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    // Get tracking number and verify access
    const { data: trackingNumber } = await supabase
      .from('tracking_numbers' as any)
      .select('*, workspaces!inner(id)')
      .eq('id', id)
      .single();

    if (!trackingNumber) {
      return NextResponse.json({ error: 'Tracking number not found' }, { status: 404 });
    }

    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', trackingNumber.workspace_id)
      .eq('user_id', user.id)
      .single();

    const memberData = member as { role: string } | null;
    if (!memberData || (memberData.role !== 'owner' && memberData.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Release number from Twilio if it has a SID
    if (trackingNumber.twilio_number_sid) {
      const { releasePhoneNumber } = await import('@/lib/twilio/numbers');
      try {
        await releasePhoneNumber(trackingNumber.twilio_number_sid);
      } catch (error) {
        console.error('Error releasing phone number from Twilio:', error);
        // Continue with deletion even if Twilio release fails
      }
    }

    // Delete from database
    const { error } = await (supabase
      .from('tracking_numbers' as any)
      .delete()
      .eq('id', id) as any);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting tracking number:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete tracking number' },
      { status: 500 }
    );
  }
}

