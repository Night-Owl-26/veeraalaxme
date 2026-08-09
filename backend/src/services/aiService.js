const env = require("../config/env");

// The Anthropic API key lives only here, on the server, read from process.env.
// It is never sent to or reachable from the browser — the frontend calls our
// own /api/ai/* endpoints, which call this function, which calls Anthropic.
async function callClaude(prompt, maxTokens = 400) {
  if (!env.ai.apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured on the server");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ai.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.ai.model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI request failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return (data.content || []).map((b) => b.text || "").join("\n").trim();
}

async function generatePropertyDescription({ title, type, city, locality, areaLabel, facing }) {
  const prompt = `Write a warm, factual 2-sentence real-estate listing description (under 55 words, no markdown, no emojis) for this property. Title: ${title || "Untitled property"}. Type: ${type}. Location: ${locality || "locality not given"}, ${city || "city not given"}. Area: ${areaLabel || "area not given"}. Facing: ${facing}. Do not invent a price or exact address. Sound like a helpful neighbour, not an ad.`;
  return callClaude(prompt, 200);
}

async function generateVastuInsight({ facing, kitchenDir, poojaRoom }) {
  const prompt = `You are a friendly Vastu Shastra advisor for an Indian real-estate app called VasthuConnect. Give a short, illustrative (not authoritative) 3-sentence note about a property, in plain conversational English, covering: what the facing direction (${facing}) generally means in Vastu tradition, one comment on the kitchen direction (${kitchenDir}), and one comment on whether having a pooja room (${poojaRoom ? "yes" : "no"}) helps. End with a one-line practical tip. Do not use markdown headers or bullet points, just flowing sentences. Keep it under 90 words.`;
  return callClaude(prompt, 300);
}

module.exports = { callClaude, generatePropertyDescription, generateVastuInsight };
