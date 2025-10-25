// backend/templates/passwordResetTemplate.js
// Responsive, branded password reset email template

export function passwordResetTemplate({ name, resetLink }) {
  return `
    <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px;">
      <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #e2e8f0; padding: 32px;">
        <h2 style="color: #2563eb; margin-bottom: 16px;">Reset Your StudyHub Password</h2>
        <p style="font-size: 16px; color: #334155;">${name ? `Hi ${name},` : 'Hello,'}</p>
        <p style="font-size: 16px; color: #334155; margin-bottom: 24px;">
          You requested a password reset. Click the button below to set a new password. This link will expire in 15 minutes.
        </p>
        <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
        <p style="font-size: 14px; color: #64748b; margin-top: 24px;">If you did not request this, you can safely ignore this email.</p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 16px;">&copy; ${new Date().getFullYear()} StudyHub</p>
      </div>
    </div>
  `;
}
