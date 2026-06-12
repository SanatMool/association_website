import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Gmail App Password (not your regular password)
  },
});

export async function sendMail({
  to,
  subject,
  html,
  fromName,
}: {
  to: string | string[];
  subject: string;
  html: string;
  fromName?: string; // association name — overrides env var
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[mailer] SMTP_USER or SMTP_PASS not set — skipping email");
    return;
  }
  const name = fromName ?? process.env.SMTP_FROM_NAME ?? "Admin Panel";
  await transporter.sendMail({
    from: `"${name}" <${process.env.SMTP_USER}>`,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
  });
}
