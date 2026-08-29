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

// RFC 2606 reserved domains + common placeholder/test domains — never real recipients.
// Prevents bounce-backs from test data (e.g. "qa-test@example.com") reaching the sending inbox.
const PLACEHOLDER_DOMAINS = new Set([
  "example.com", "example.net", "example.org", "example.edu",
  "test.com", "sample.com", "domain.com", "yourdomain.com", "email.com",
]);
const PLACEHOLDER_TLD_SUFFIXES = [".test", ".invalid", ".example", ".localhost"];

function isPlaceholderEmail(email: string): boolean {
  const domain = email.split("@")[1]?.trim().toLowerCase();
  if (!domain) return true; // malformed address — treat as unsendable
  if (PLACEHOLDER_DOMAINS.has(domain)) return true;
  return PLACEHOLDER_TLD_SUFFIXES.some((suffix) => domain.endsWith(suffix));
}

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

  const recipients = (Array.isArray(to) ? to : [to]).filter((address) => {
    if (isPlaceholderEmail(address)) {
      console.warn(`[mailer] skipping placeholder/test email address: ${address}`);
      return false;
    }
    return true;
  });
  if (recipients.length === 0) {
    console.warn(`[mailer] no real recipients after filtering — email not sent ("${subject}")`);
    return;
  }

  const name = fromName ?? process.env.SMTP_FROM_NAME ?? "Admin Panel";
  await transporter.sendMail({
    from: `"${name}" <${process.env.SMTP_USER}>`,
    to: recipients.join(", "),
    subject,
    html,
  });
}
