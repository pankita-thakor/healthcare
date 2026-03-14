export async function sendPush(token: string, title: string, body: string) {
  const response = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: `key=${process.env.FIREBASE_SERVER_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      to: token,
      notification: { title, body }
    })
  });

  if (!response.ok) throw new Error("FCM push failed");
  return response.json();
}
