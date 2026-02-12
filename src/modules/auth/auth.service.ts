import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: `"Cartzy" <${process.env.SMTP_USER}> `,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.log("Email sending failed:", error);
    throw new Error("Failed to send email");
  }
}

export async function sendResetPasswordEmail(to: string, token: string) {
  const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const html = `
    <p>Click the link below to reset your password:</p>
    <a href="${resetURL}">${resetURL}</a>
  `;
  await sendEmail(to, "Reset Your Password", html);
}
