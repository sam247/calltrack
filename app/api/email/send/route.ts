import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { sendEmail } from '@/lib/email/client';
import { getWelcomeEmailTemplate } from '@/lib/email/templates/welcome';
import { getUsageAlertEmailTemplate } from '@/lib/email/templates/usage-alert';
import { getWeeklyReportEmailTemplate } from '@/lib/email/templates/weekly-report';

export const dynamic = 'force-dynamic';

/**
 * POST /api/email/send
 * Send transactional emails
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, ...data } = body;

    let emailHtml: string;
    let subject: string;
    let to: string;

    switch (type) {
      case 'welcome': {
        const { email, name, workspaceName } = data;
        if (!email || !workspaceName) {
          return NextResponse.json(
            { error: 'email and workspaceName required' },
            { status: 400 }
          );
        }
        to = email;
        subject = 'Welcome to CallTrack!';
        emailHtml = getWelcomeEmailTemplate(name || 'there', workspaceName);
        break;
      }

      case 'usage-alert': {
        const { email, workspaceName, callsUsed, callsIncluded, planTier } = data;
        if (!email || !workspaceName || callsUsed === undefined || callsIncluded === undefined) {
          return NextResponse.json(
            { error: 'email, workspaceName, callsUsed, and callsIncluded required' },
            { status: 400 }
          );
        }
        to = email;
        subject = 'CallTrack Usage Alert';
        emailHtml = getUsageAlertEmailTemplate(
          workspaceName,
          callsUsed,
          callsIncluded,
          planTier || 'starter'
        );
        break;
      }

      case 'weekly-report': {
        const { email, workspaceName, stats } = data;
        if (!email || !workspaceName || !stats) {
          return NextResponse.json(
            { error: 'email, workspaceName, and stats required' },
            { status: 400 }
          );
        }
        to = email;
        subject = 'Your Weekly CallTrack Report';
        emailHtml = getWeeklyReportEmailTemplate(workspaceName, stats);
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    const result = await sendEmail({
      to,
      subject,
      html: emailHtml,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

