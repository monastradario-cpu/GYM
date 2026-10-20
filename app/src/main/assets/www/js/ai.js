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
  if (r.error) cb.rej(new Error(r.error));
  else cb.res({ ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => JSON.parse(r.body || '{}') });
};
function aiFetch(url, opt) {
  if (!Native.has() || !window.Android.http) return window.fetch(url, opt);
  return new Promise((res, rej) => {
    const id = uid(); _httpWait[id] = { res, rej };
    window.Android.http(id, opt.method || 'GET', url, JSON.stringify(opt.headers || {}), opt.body || '');
  });
}

function aiReady() { return !!(S.settings.ai && S.settings.ai.key); }

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

async function aiAsk(messages) {
  const cfg = S.settings.ai, prov = AI_PROVIDERS[cfg.provider] || AI_PROVIDERS.gemini;
  const model = (cfg.model || '').trim() || prov.model, key = cfg.key.trim(), sys = aiContext();
  let res, data;
  if (cfg.provider === 'anthropic') {
    res = await aiFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model, max_tokens: 1024, system: sys, messages: messages.map(m => ({ role: m.role, content: m.text })) })
    });
    data = await res.json();
    if (!res.ok) throw new Error((data.error && data.error.message) || res.status);
    return data.content.map(c => c.text || '').join('');
  }
  if (cfg.provider === 'openai') {
    res = await aiFetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: sys }].concat(messages.map(m => ({ role: m.role, content: m.text }))) })
    });
    data = await res.json();
    if (!res.ok) throw new Error((data.error && data.error.message) || res.status);
    return data.choices[0].message.content;
  }
  res = await aiFetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(key), {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] })) })
  });
  data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || res.status);
  const c = data.candidates && data.candidates[0];
  return c && c.content ? c.content.parts.map(p => p.text || '').join('') : 'Nessuna risposta.';
}

/* formattazione minima delle risposte (grassetto, elenchi, a capo) */
function aiFormat(t) {
  return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^#+\s*(.+)$/gm, '<b>$1</b>')
    .replace(/^\s*[-*]\s+(.+)$/gm, '• $1').replace(/\n/g, '<br>');
}
