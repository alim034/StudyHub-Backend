// backend/templates/welcomeTemplate.js
// Responsive, branded welcome email template for StudyHub

export function welcomeTemplate({ name, lang = 'en' }) {
  // For multi-language, add more blocks here
  const messages = {
    en: {
      subject: 'Welcome to StudyHub!',
      greeting: `Welcome${name ? `, ${name}` : ''}!`,
      body: 'Your account has been created successfully. Start collaborating and learning with your peers on StudyHub.',
      cta: 'Go to StudyHub',
    },
    // Add more languages as needed
  };
  const msg = messages[lang] || messages.en;
  return {
    subject: msg.subject,
    html: `
      <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px;">
        <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #e2e8f0; padding: 32px;">
          <h2 style="color: #2563eb; margin-bottom: 16px;">${msg.greeting}</h2>
          <p style="font-size: 16px; color: #334155; margin-bottom: 24px;">${msg.body}</p>
          <a href="${process.env.CLIENT_URL}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 16px;">${msg.cta}</a>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 16px;">&copy; ${new Date().getFullYear()} StudyHub</p>
        </div>
      </div>
    `
  };
}
