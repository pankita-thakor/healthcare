export async function sendSms(to: string, body: string) {
  const creds = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${creds}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        To: to,
        From: "+10000000000",
        Body: body
      })
    }
  );

  if (!response.ok) throw new Error("Twilio SMS failed");
  return response.json();
}
