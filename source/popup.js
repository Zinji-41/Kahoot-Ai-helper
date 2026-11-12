const $ = id => document.getElementById(id);
let tab;
async function send(type, extra = {}) {
  const r = await chrome.runtime.sendMessage({type, tabId: tab.id, ...extra});
  if (!r.ok) throw new Error(r.error);
  return r;
}
async function show() {
  const r = await send('settings');
  $('provider').value = r.provider || 'gemini';
  $('key').value = r.key || '';
  $('model').value = r.model || (r.provider === 'openai' ? 'gpt-4.1' : 'gemini-3.5-flash-lite');
  $('status').textContent = `${r.enabled ? 'Running' : 'Stopped'}\n${r.status || ''}\nQuestion source: ${r.sourceTabId ? 'tab ' + r.sourceTabId : 'player tab'}`;
}
function bind(id, fn) { $(id).onclick = async () => { try { await fn(); await show(); } catch(e) { $('status').textContent = e.message; } }; }
(async () => {
  [tab] = await chrome.tabs.query({active:true,currentWindow:true});
  $('provider').onchange = () => { $('key').value=''; $('model').value=$('provider').value==='gemini'?'gemini-3.5-flash-lite':'gpt-4.1'; };
  bind('save', () => send('save', {provider:$('provider').value,key:$('key').value.trim(), model:$('model').value.trim()}));
  bind('fast', async () => {
    if($('provider').value!=='gemini') throw new Error('Select Google Gemini and enter its key first.');
    await send('save',{provider:'gemini',key:$('key').value.trim(),model:'gemini-3.5-flash-lite'});
  });
  bind('source', () => send('source'));
  bind('clear', () => send('clearSource'));
  bind('start', async () => { await send('save', {provider:$('provider').value,key:$('key').value.trim(),model:$('model').value.trim()}); await send('start'); });
  bind('stop', () => send('stop'));
  await show();
})().catch(e => { $('status').textContent=e.message; });
