export function getWelcomeEmailTemplate(name: string, workspaceName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to CallTrack</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to CallTrack!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name || 'there'},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Welcome to CallTrack! We're excited to help you track and attribute your phone calls.
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your workspace <strong>${workspaceName}</strong> has been created successfully. Here's what you can do next:
    </p>
    
    <ul style="font-size: 16px; margin-bottom: 30px; padding-left: 20px;">
      <li style="margin-bottom: 10px;">Install the tracking snippet on your website</li>
      <li style="margin-bottom: 10px;">Set up your first tracking number</li>
      <li style="margin-bottom: 10px;">Start tracking which marketing sources generate calls</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.calltrack.com'}/onboarding" 
         style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Complete Setup
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      If you have any questions, feel free to reach out to our support team.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} CallTrack. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

