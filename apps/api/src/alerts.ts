export async function notifyTransition(name: string, url: string, previous: string, current: string): Promise<void> {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(webhook, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: `**${name}**: ${previous} → **${current}**\n${url}`, allowed_mentions: { parse: [] } }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Webhook HTTP ${response.status}`);
  } finally { clearTimeout(timeout); }
}
