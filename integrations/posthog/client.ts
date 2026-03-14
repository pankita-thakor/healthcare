export async function captureEvent(distinctId: string, event: string, properties: Record<string, unknown>) {
  const response = await fetch("https://us.i.posthog.com/capture/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      api_key: process.env.POSTHOG_KEY,
      distinct_id: distinctId,
      event,
      properties
    })
  });

  if (!response.ok) throw new Error("PostHog event failed");
}
