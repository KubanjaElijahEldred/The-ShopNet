import { getSafeAppBaseUrl } from "@/lib/url";

type OutboundEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type WelcomeEmailInput = {
  to: string;
  userName: string;
};

type OrderPlacedEmailInput = {
  to: string;
  userName: string;
  orderId: string;
  orderStatus: string;
  orderTotal: number;
};

type OrderStatusEmailInput = {
  to: string;
  userName: string;
  orderId: string;
  orderStatus: string;
};

const resendApiKey = process.env.RESEND_API_KEY?.trim() || "";
const emailFrom = process.env.EMAIL_FROM?.trim() || "";
const appUrl = getSafeAppBaseUrl().replace(/\/$/, "");
const moneyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailFrame(options: {
  title: string;
  intro: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  footer?: string;
}) {
  const bulletItems = options.bullets
    .map((line) => `<li style="margin: 8px 0;">${escapeHtml(line)}</li>`)
    .join("");

  const safeTitle = escapeHtml(options.title);
  const safeIntro = escapeHtml(options.intro);
  const safeFooter = options.footer ? escapeHtml(options.footer) : "";
  const safeCtaLabel = escapeHtml(options.ctaLabel);
  const safeCtaHref = escapeHtml(options.ctaHref);

  const html = `
    <div style="background:#f8fafc;padding:24px;font-family:Arial,sans-serif;color:#10213d;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dde4f0;border-radius:16px;padding:24px;">
        <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f2f66;">${safeTitle}</h1>
        <p style="margin:0 0 14px;line-height:1.6;color:#233756;">${safeIntro}</p>
        <ul style="padding-left:20px;margin:0 0 20px;line-height:1.6;color:#233756;">
          ${bulletItems}
        </ul>
        <a href="${safeCtaHref}" style="display:inline-block;background:#e58e26;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:10px;font-weight:700;">
          ${safeCtaLabel}
        </a>
        ${
          safeFooter
            ? `<p style="margin:20px 0 0;font-size:13px;color:#5a6a84;line-height:1.5;">${safeFooter}</p>`
            : ""
        }
      </div>
    </div>
  `.trim();

  return html;
}

async function sendEmail(message: OutboundEmail) {
  if (!resendApiKey || !emailFrom) {
    console.warn(
      "Email skipped because RESEND_API_KEY or EMAIL_FROM is missing.",
      { to: message.to, subject: message.subject }
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email provider error (${response.status}): ${body}`);
  }
}

export function isEmailDeliveryConfigured() {
  return Boolean(resendApiKey && emailFrom);
}

export async function sendWelcomeEmail(input: WelcomeEmailInput) {
  const firstName = input.userName.trim().split(" ")[0] || "there";
  const ordersUrl = `${appUrl}/orders`;
  const html = buildEmailFrame({
    title: `Welcome to ShopNet, ${firstName}!`,
    intro:
      "Your account is ready. You can now shop, chat with sellers, and track your orders in one place.",
    bullets: [
      "Track your current and past orders from your order history page.",
      "Chat with sellers directly from products and the chat page.",
      "Update profile details and shipping address anytime."
    ],
    ctaLabel: "Track My Orders",
    ctaHref: ordersUrl,
    footer: "Powered by K.E.E Tech Solutions."
  });

  const text = [
    `Welcome to ShopNet, ${firstName}!`,
    "Your account is ready.",
    `Track your orders here: ${ordersUrl}`,
    "Powered by K.E.E Tech Solutions."
  ].join("\n");

  await sendEmail({
    to: input.to,
    subject: `Welcome to ShopNet, ${firstName}!`,
    html,
    text
  });
}

export async function sendOrderPlacedEmail(input: OrderPlacedEmailInput) {
  const firstName = input.userName.trim().split(" ")[0] || "there";
  const ordersUrl = `${appUrl}/orders`;
  const html = buildEmailFrame({
    title: `Order ${input.orderId} received`,
    intro: `Hi ${firstName}, we have received your order and started processing it.`,
    bullets: [
      `Current status: ${input.orderStatus}`,
      `Total amount: ${moneyFormatter.format(input.orderTotal)}`,
      "Open your order history to view live status updates."
    ],
    ctaLabel: "Open Order Tracking",
    ctaHref: ordersUrl,
    footer: "Need help? Open chat in ShopNet and message support or sellers."
  });

  const text = [
    `Hi ${firstName},`,
    `We received your order ${input.orderId}.`,
    `Status: ${input.orderStatus}`,
    `Total: ${moneyFormatter.format(input.orderTotal)}`,
    `Track here: ${ordersUrl}`
  ].join("\n");

  await sendEmail({
    to: input.to,
    subject: `ShopNet order received: ${input.orderId}`,
    html,
    text
  });
}

export async function sendOrderStatusEmail(input: OrderStatusEmailInput) {
  const firstName = input.userName.trim().split(" ")[0] || "there";
  const ordersUrl = `${appUrl}/orders`;
  const html = buildEmailFrame({
    title: `Order ${input.orderId} status update`,
    intro: `Hi ${firstName}, your order has a new update.`,
    bullets: [
      `New status: ${input.orderStatus}`,
      "You can open order tracking for the latest details.",
      "If needed, contact the seller from the chat page."
    ],
    ctaLabel: "View Order Status",
    ctaHref: ordersUrl
  });

  const text = [
    `Hi ${firstName},`,
    `Order ${input.orderId} is now: ${input.orderStatus}.`,
    `Track it here: ${ordersUrl}`
  ].join("\n");

  await sendEmail({
    to: input.to,
    subject: `Order update: ${input.orderId} is ${input.orderStatus}`,
    html,
    text
  });
}
