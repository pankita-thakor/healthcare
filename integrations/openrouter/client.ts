export async function generateClinicalSummary(prompt: string) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a clinical documentation assistant." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("OpenRouter request failed");
  }

  return response.json();
}
