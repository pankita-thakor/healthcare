export async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "HealthFlow <no-reply@healthflow.app>",
      to,
      subject,
      html
    })
  });

  if (!response.ok) throw new Error("Resend email failed");
  return response.json();
}
