// backend/templates/invitationTemplate.js
// Generates a responsive HTML invitation email with CTA

export function invitationTemplate({ roomName, inviteLink, appName = 'StudyHub' }) {
  const safeRoom = (roomName || 'your StudyHub room').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeLink = inviteLink;
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName} Invitation</title>
    <style>
      /* Basic reset */
      body { margin: 0; padding: 0; background: #f6f7fb; font-family: Arial, Helvetica, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 24px; }
      .card { background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); padding: 24px; }
      .logo { font-size: 22px; font-weight: 700; color: #3b82f6; }
      .title { font-size: 20px; font-weight: 600; color: #111827; margin: 16px 0 8px; }
      .text { font-size: 14px; color: #374151; line-height: 1.6; }
      .cta { display: inline-block; margin-top: 16px; padding: 12px 20px; background: #3b82f6; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; }
      .footer { font-size: 12px; color: #6b7280; margin-top: 20px; }
      .link { color: #2563eb; word-break: break-all; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <div class="logo">🚀 ${appName}</div>
        <div class="title">You're invited to join ${safeRoom}</div>
        <p class="text">
          You've been invited to collaborate in <strong>${safeRoom}</strong> on ${appName}. Click the button below to accept your invitation.
        </p>
        <p>
          <a class="cta" href="${safeLink}" target="_blank" rel="noopener">Accept Invitation</a>
        </p>
        <p class="footer">
          If the button doesn't work, copy and paste this link into your browser:
          <br />
          <a class="link" href="${safeLink}" target="_blank" rel="noopener">${safeLink}</a>
        </p>
        <p class="footer">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    </div>
  </body>
  </html>`;
}

export default { invitationTemplate };
