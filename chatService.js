import fetch from 'node-fetch';

const DEFAULT_PROMPTS = [
  'Dobrý den, jsem virtuální asistent VŠE Studia. Jak vám mohu pomoci s projekty nebo správou účtu?',
  'Potřebujete poradit se správou uživatelů, úpravou profilu nebo možnostmi chatu?',
  'Jsem ukázkový bot – odpovědi mají informační charakter a vychází z aktuální konfigurace aplikace.'
];

function normalizeConfig(config) {
  return config && typeof config === 'object' ? config : {};
}

function extractFoundryReply(payload) {
  if (!payload) {
    return '';
  }

  const candidates = [
    payload.reply,
    payload.output,
    payload.output?.text,
    payload.output?.message,
    payload.output?.content,
    payload.output?.messages,
    payload.result,
    payload.result?.text,
    payload.result?.content,
    payload.data,
    payload.data?.text
  ];

  const toText = (value) => {
    if (!value) {
      return '';
    }
    if (typeof value === 'string') {
      return value.trim();
    }
    if (Array.isArray(value)) {
      const flattened = value
        .map((item) => {
          if (!item) return '';
          if (typeof item === 'string') return item;
          if (typeof item === 'object') {
            if (typeof item.text === 'string') return item.text;
            if (typeof item.content === 'string') return item.content;
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');
      return flattened.trim();
    }
    if (typeof value === 'object') {
      if (typeof value.text === 'string') {
        return value.text.trim();
      }
      if (typeof value.content === 'string') {
        return value.content.trim();
      }
    }
    return '';
  };

  for (const candidate of candidates) {
    const text = toText(candidate);
    if (text) {
      return text;
    }
  }

  return '';
}

export async function getBotResponse(message, options = {}) {
  const trimmed = (message || '').trim();
  if (!trimmed) {
    return 'Prosím, napište mi, s čím vám mohu pomoci.';
  }

  const {
    apiKey,
    apiUrl: overrideUrl,
    model: legacyModel,
    provider,
    config: rawConfig
  } = options;
  const config = normalizeConfig(rawConfig);
  const normalizedProvider = provider || (apiKey ? 'openai-chat' : undefined);

  if (normalizedProvider === 'ai-foundry' && apiKey) {
    const baseUrlValue = typeof config.baseUrl === 'string' ? config.baseUrl.trim() : '';
    const baseUrl = (baseUrlValue || 'https://api.aifoundry.com').replace(/\/+$/, '');
    const agentId = typeof config.agentId === 'string' ? config.agentId.trim() : '';

    if (!agentId) {
      return 'Konfigurace AI Foundry agenta není kompletní. Zkontrolujte ID agenta v nastavení konektoru.';
    }

    try {
      const response = await fetch(`${baseUrl}/agents/${encodeURIComponent(agentId)}/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          input: {
            messages: [
              {
                role: 'system',
                content:
                  'Jsi virtuální asistent VŠE Studia. Odpovídej česky a pomáhej s projekty, automacemi, správou uživatelů a obecnými dotazy.'
              },
              { role: 'user', content: trimmed }
            ]
          }
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        const error = new Error(
          errorPayload?.error?.message || `Požadavek na AI Foundry API selhal (HTTP ${response.status}).`
        );
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      const reply = extractFoundryReply(data);
      if (reply) {
        return reply;
      }

      return 'AI Foundry agent nevrátil žádnou odpověď.';
    } catch (error) {
      console.error('Chyba při volání AI Foundry API:', error.message);
      if (error.status === 401 || error.status === 403) {
        return 'API klíč pro AI Foundry je neplatný nebo vypršel. Zkontrolujte prosím nastavení.';
      }
      if (error.status === 429) {
        return 'Byl překročen limit pro AI Foundry API. Zkuste to prosím znovu za chvíli.';
      }
      return 'Omlouvám se, ale nepodařilo se mi získat odpověď od AI Foundry agenta.';
    }
  }

  if (normalizedProvider === 'openai-chat' && apiKey) {
    const configuredModel = typeof config.model === 'string' ? config.model.trim() : '';
    const model = configuredModel || (legacyModel || 'gpt-4o-mini');
    const configuredUrl = typeof config.apiUrl === 'string' ? config.apiUrl.trim() : '';
    const apiUrl = configuredUrl || overrideUrl || 'https://api.openai.com/v1/chat/completions';

    try {
      const response = await fetch(apiUrl, {
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
