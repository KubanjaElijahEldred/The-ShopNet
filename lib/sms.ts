export async function sendMobileAlert(phoneNumber: string, message: string) {
  if (!phoneNumber) {
    return { ok: false, reason: "missing_phone" };
  }

  if (process.env.SMS_PROVIDER === "twilio") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return { ok: false, reason: "twilio_not_configured" };
    }

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const body = new URLSearchParams({
      To: phoneNumber,
      From: fromNumber,
      Body: message
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body
      }
    );

    if (!response.ok) {
      return { ok: false, reason: "twilio_failed" };
    }

    return { ok: true, reason: "twilio_sent" };
  }

  console.log(`[shopnet:sms] ${phoneNumber}: ${message}`);
  return { ok: true, reason: "console_fallback" };
}
