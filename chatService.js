import fetch from 'node-fetch';

const DEFAULT_PROMPTS = [
  'Dobrý den, jsem virtuální asistent VŠE Studia. Jak vám mohu pomoci s projekty nebo správou účtu?',
  'Potřebujete poradit se správou uživatelů, úpravou profilu nebo možnostmi chatu?',
  'Jsem ukázkový bot – odpovědi mají informační charakter a vychází z aktuální konfigurace aplikace.'
];

export async function getBotResponse(message, options = {}) {
  const trimmed = (message || '').trim();
  if (!trimmed) {
    return 'Prosím, napište mi, s čím vám mohu pomoci.';
  }

  const { apiKey, apiUrl: overrideUrl, model = 'gpt-3.5-turbo' } = options;

  if (apiKey) {
    try {
      const response = await fetch(overrideUrl || 'https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                'Jsi virtuální asistent VŠE Studia. Odpovídej česky a pomáhej s projekty, automacemi, správou uživatelů a obecnými dotazy.'
            },
            { role: 'user', content: trimmed }
          ]
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        const error = new Error(errorPayload?.error?.message || 'Požadavek na OpenAI API selhal.');
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content?.trim();
      if (reply) {
        return reply;
      }

      return 'Omlouvám se, ale OpenAI API nevrátilo žádnou odpověď.';
    } catch (error) {
      console.error('Chyba při volání OpenAI API:', error.message);
      if (error.status === 401) {
        return 'API klíč pro OpenAI je neplatný nebo již neplatí. Zkontrolujte prosím nastavení.';
      }
      if (error.status === 429) {
        return 'Byl překročen limit pro OpenAI API. Zkuste to prosím znovu za chvíli.';
      }
      return 'Omlouvám se, ale nepodařilo se mi získat odpověď od OpenAI API.';
    }
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
