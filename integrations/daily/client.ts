export async function createDailyRoom(name: string) {
  const response = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      properties: {
        enable_chat: true,
        enable_screenshare: true,
        start_video_off: false
      }
    })
  });

  if (!response.ok) {
    throw new Error("Failed to create Daily room");
  }

  return response.json();
}
