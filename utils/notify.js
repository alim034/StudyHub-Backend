// Notification utility stubs for StudyHub

export function sendEmail({ to, subject, text }) {
  console.log(`[EMAIL STUB] To: ${to}, Subject: ${subject}, Body: ${text}`);
}

export function sendPush({ userId, title, body, data }) {
  console.log(`[PUSH STUB] To UserID: ${userId}, Title: ${title}, Body: ${body}, Data: ${JSON.stringify(data)}`);
}