import fetch from 'node-fetch';

const DEFAULT_PROMPTS = [
  'Ahoj! Jak vám mohu pomoci?',
  'Můžete mi říct více o tom, co potřebujete?',
  'Jsem pouze ukázkový bot – odpovídám zjednodušeně.'
];

export async function getBotResponse(message) {
  const trimmed = (message || '').trim();
  if (!trimmed) {
    return 'Prosím, napište mi, s čím vám mohu pomoci.';
  }

  const apiUrl = process.env.CHAT_API_URL;
  if (apiUrl) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (process.env.CHAT_API_TOKEN) {
        headers.Authorization = `Bearer ${process.env.CHAT_API_TOKEN}`;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: trimmed })
      });

      if (!response.ok) {
        throw new Error(`API odpovědělo kódem ${response.status}`);
      }

      const data = await response.json();
      if (data && data.reply) {
        return data.reply;
      }
    } catch (error) {
      console.error('Chyba při volání externího API:', error.message);
      return 'Omlouvám se, ale nepodařilo se mi získat odpověď od externí služby.';
    }
  }

  const randomPrompt = DEFAULT_PROMPTS[Math.floor(Math.random() * DEFAULT_PROMPTS.length)];
  return `${randomPrompt} (Řekli jste: "${trimmed}")`;
}
