export function getWeeklyReportEmailTemplate(
  workspaceName: string,
  stats: {
    totalCalls: number;
    completedCalls: number;
    topSource: string;
    topCampaign: string;
    conversionRate: number;
  }
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Report - CallTrack</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📊 Weekly Report</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
    
    <p style="font-size: 16px; margin-bottom: 30px;">
      Here's your weekly summary for <strong>${workspaceName}</strong>:
    </p>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
        <span style="font-size: 16px;">Total Calls</span>
        <strong style="font-size: 18px; color: #667eea;">${stats.totalCalls}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
        <span style="font-size: 16px;">Completed Calls</span>
        <strong style="font-size: 18px; color: #10b981;">${stats.completedCalls}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
        <span style="font-size: 16px;">Conversion Rate</span>
        <strong style="font-size: 18px;">${Math.round(stats.conversionRate)}%</strong>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="font-size: 16px;">Top Source</span>
        <strong style="font-size: 18px;">${stats.topSource || 'N/A'}</strong>
      </div>
    </div>
    
    ${stats.topCampaign ? `
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #1e40af;">
        🎯 <strong>Top Campaign:</strong> ${stats.topCampaign}
      </p>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.calltrack.com'}/dashboard" 
         style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        View Full Dashboard
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      This is an automated weekly report. You can manage your email preferences in your dashboard settings.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} CallTrack. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

