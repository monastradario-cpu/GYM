/* GYM — coach AI facoltativo (Gemini predefinito, oppure Claude / OpenAI) */
'use strict';

const AI_PROVIDERS = {
  gemini: { n: 'Gemini (Google) — piano gratuito', model: 'gemini-2.5-flash', keyUrl: 'https://aistudio.google.com/apikey' },
  anthropic: { n: 'Claude (Anthropic)', model: 'claude-haiku-4-5', keyUrl: 'https://console.anthropic.com/settings/keys' },
  openai: { n: 'OpenAI', model: 'gpt-4o-mini', keyUrl: 'https://platform.openai.com/api-keys' }
};

/* nell'app le richieste passano dal codice nativo (niente blocchi CORS) */
const _httpWait = {};
window.onNativeHttp = (json) => {
  const r = JSON.parse(json), cb = _httpWait[r.id]; if (!cb) return; delete _httpWait[r.id];
  if (r.error) cb.rej(new Error('Connessione non riuscita: ' + r.error));
  else cb.res({ ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => { try { return JSON.parse(r.body || '{}'); } catch (e) { return { error: { message: (r.body || '').slice(0, 200) } }; } } });
};
function aiFetch(url, opt) {
  if (!Native.has() || !window.Android.http) return window.fetch(url, opt);
  return new Promise((res, rej) => {
    const id = uid(); _httpWait[id] = { res, rej };
    window.Android.http(id, opt.method || 'GET', url, JSON.stringify(opt.headers || {}), opt.body || '');
    setTimeout(() => { if (_httpWait[id]) { delete _httpWait[id]; rej(new Error('Tempo scaduto: controlla la connessione')); } }, 95000);
  });
}

/* pulisce la chiave incollata (spazi, a capo, virgolette, testo in più) */
function cleanKey(k, provider) {
  k = String(k || '').replace(/[\s"'`]/g, '');
  if (provider === 'gemini') { const m = k.match(/AIza[0-9A-Za-z_\-]{30,}/); if (m) k = m[0]; }
  if (provider === 'anthropic') { const m = k.match(/sk-ant-[0-9A-Za-z_\-]+/); if (m) k = m[0]; }
  return k;
}
function keyLooksValid(k, provider) {
  if (!k) return false;
  if (provider === 'gemini') return /^AIza[0-9A-Za-z_\-]{30,}$/.test(k);
  if (provider === 'anthropic') return /^sk-ant-/.test(k);
  if (provider === 'openai') return /^sk-/.test(k);
  return true;
}
function aiReady() { return !!(S.settings.ai && S.settings.ai.key); }

/* messaggi d'errore comprensibili */
function aiErrorText(status, msg) {
  msg = String(msg || '');
  if (/API key not valid|API_KEY_INVALID|invalid x-api-key|Incorrect API key|invalid_api_key/i.test(msg) || status === 401) return 'Chiave non valida: ricopiala per intero da Google AI Studio (inizia con "AIza").';
  if (status === 403 || /PERMISSION_DENIED|has not been used|disabled/i.test(msg)) return 'La chiave non ha accesso a Gemini. Creane una nuova da Google AI Studio con "Create API key".';
  if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate/i.test(msg)) return 'Limite gratuito raggiunto per ora: riprova tra qualche minuto.';
  if (/location is not supported|User location/i.test(msg)) return 'Servizio non disponibile nella tua zona con questa chiave.';
  if (status === 404 || /not found|is not supported/i.test(msg)) return 'Modello non disponibile: lascia vuoto il campo Modello.';
  if (status >= 500) return 'Il servizio è momentaneamente non disponibile, riprova tra poco.';
  return msg || ('Errore ' + status);
}

async function geminiCall(model, key, sys, messages) {
  const res = await aiFetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] })), generationConfig: { maxOutputTokens: 2048 } })
  });
  const data = await res.json();
  return { res, data };
}

async function aiAsk(messages) {
  const cfg = S.settings.ai, prov = AI_PROVIDERS[cfg.provider] || AI_PROVIDERS.gemini;
  const key = cleanKey(cfg.key, cfg.provider), sys = aiContext();
  let model = (cfg.model || '').trim() || prov.model, res, data;
  if (!key) throw new Error('Inserisci prima la chiave.');
  if (cfg.provider === 'anthropic') {
    res = await aiFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model, max_tokens: 1024, system: sys, messages: messages.map(m => ({ role: m.role, content: m.text })) })
    });
    data = await res.json();
    if (!res.ok) throw new Error(aiErrorText(res.status, data.error && data.error.message));
    return data.content.map(c => c.text || '').join('');
  }
  if (cfg.provider === 'openai') {
    res = await aiFetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: sys }].concat(messages.map(m => ({ role: m.role, content: m.text }))) })
    });
    data = await res.json();
    if (!res.ok) throw new Error(aiErrorText(res.status, data.error && data.error.message));
    return data.choices[0].message.content;
  }
  // Gemini: se il modello non è disponibile prova i successivi
  if (!cfg.model && cfg.workingModel) model = cfg.workingModel;
  const models = [model].concat(['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'].filter(m => m !== model));
  let lastErr = null;
  for (const m of models) {
    ({ res, data } = await geminiCall(m, key, sys, messages));
    if (res.ok) {
      if (m !== model && !cfg.model) cfg.workingModel = m;
      const c = data.candidates && data.candidates[0];
      if (!c) throw new Error(data.promptFeedback && data.promptFeedback.blockReason ? 'Domanda bloccata dal filtro di sicurezza, prova a riformularla.' : 'Nessuna risposta.');
      return c.content && c.content.parts ? c.content.parts.map(p => p.text || '').join('') : 'Nessuna risposta.';
    }
    const msg = data.error && data.error.message;
    lastErr = aiErrorText(res.status, msg);
    if (!(res.status === 404 || /not found|is not supported/i.test(msg || ''))) break; // errore non legato al modello
  }
  throw new Error(lastErr || 'Errore sconosciuto');
}

function aiContext() {
  const p = S.profile;
  const lines = [];
  lines.push('Sei il coach personale dell\'app GYM. Rispondi in italiano, in modo chiaro, pratico e motivante, con frasi brevi. Non dare consigli medici: per dolori o problemi di salute suggerisci di consultare un medico.');
  lines.push('Profilo: obiettivi ' + goalLabel(p) + (p.sex ? ', sesso ' + (p.sex === 'm' ? 'uomo' : 'donna') : '') + (p.age ? ', ' + p.age + ' anni' : '') + (p.height ? ', ' + p.height + ' cm' : '') + ', livello ' + (LEVELS[p.level] || {}).n + ', si allena ' + p.days.length + ' giorni a settimana (' + p.days.map(d => WEEKDAYS[d]).join(', ') + ').');
  const w = S.weights[S.weights.length - 1]; if (w) lines.push('Peso corporeo: ' + fmtKg(w.kg) + ' kg (' + fmtDate(w.d) + ').');
  const recent = S.history.slice(-6).reverse();
  if (recent.length) {
    lines.push('Ultimi allenamenti:');
    recent.forEach(h => {
      const parts = (h.items || []).map(it => { const ws = workSets(it); if (!ws.length) return null; const e = EX[it.ex]; return (e ? e.n : it.ex) + ' ' + ws.map(s => fmtKg(num(s.kg)) + 'x' + num(s.reps)).join(','); }).filter(Boolean);
      const c = (h.cardio || []).map(c => c.type + ' ' + c.min + 'min').join(', ');
      lines.push('- ' + fmtDate(h.start) + ' ' + h.name + ': ' + parts.join('; ') + (c ? ' | cardio: ' + c : ''));
    });
  }
  const pr = allRecords().slice(0, 8);
  if (pr.length) lines.push('Record (massimale stimato): ' + pr.map(x => (EX[x.id] ? EX[x.id].n : x.id) + ' ' + Math.round(x.r.e1rm) + ' kg').join(', ') + '.');
  return lines.join('\n');
}

/* formattazione minima delle risposte (grassetto, elenchi, a capo) */
function aiFormat(t) {
  return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^#+\s*(.+)$/gm, '<b>$1</b>')
    .replace(/^\s*[-*]\s+(.+)$/gm, '• $1').replace(/\n/g, '<br>');
}
