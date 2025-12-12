export function getUsageAlertEmailTemplate(
  workspaceName: string,
  callsUsed: number,
  callsIncluded: number,
  planTier: string
): string {
  const percentage = (callsUsed / callsIncluded) * 100;
  const isOverLimit = callsUsed >= callsIncluded;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Usage Alert - CallTrack</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${isOverLimit ? '#ef4444' : '#f59e0b'}; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">
      ${isOverLimit ? '⚠️ Usage Limit Reached' : '📊 Usage Alert'}
    </h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your workspace <strong>${workspaceName}</strong> has ${isOverLimit ? 'reached' : 'used'} 
      <strong>${callsUsed} of ${callsIncluded}</strong> included calls for your ${planTier} plan 
      (${Math.round(percentage)}%).
    </p>
    
    ${isOverLimit ? `
    <div style="background: #fee2e2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #991b1b; font-weight: 600;">
        ⚠️ You've reached your plan limit. Additional calls will be charged as overage.
      </p>
    </div>
    ` : `
    <div style="background: #fef3c7; border: 1px solid #fde68a; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e;">
        You're approaching your plan limit. Consider upgrading to avoid overage charges.
      </p>
    </div>
    `}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.calltrack.com'}/dashboard/settings" 
         style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        ${isOverLimit ? 'Upgrade Plan' : 'View Usage'}
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      This is an automated alert. You can manage your usage and billing in your dashboard.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} CallTrack. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

