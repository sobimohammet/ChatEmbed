/* ═══════════════════════════════════════════════════════════
   ChatEmbed — widget.js
   Self-contained embeddable AI chat widget.
   Drop one <script> tag into any website to get a fully
   functional Claude-powered chatbot.

   Config via data attributes:
     data-accent         Brand colour  (default: #6366f1)
     data-title          Widget title  (default: AI Assistant)
     data-greeting       First message (default: Hi! How can I help?)
     data-system-prompt  Claude system prompt
     data-placeholder    Input placeholder text
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  if (window.__chatEmbedLoaded) return;
  window.__chatEmbedLoaded = true;

  /* ── Config ───────────────────────────────────────────── */
  const script = document.currentScript;
  const origin = script?.src ? new URL(script.src).origin : '';

  const cfg = {
    accent:      script?.getAttribute('data-accent')       || '#6366f1',
    title:       script?.getAttribute('data-title')        || 'AI Assistant',
    greeting:    script?.getAttribute('data-greeting')     || 'Hi! How can I help you today? 👋',
    system:      script?.getAttribute('data-system-prompt')|| 'You are a helpful AI assistant. Be concise and friendly.',
    placeholder: script?.getAttribute('data-placeholder')  || 'Type a message...',
    endpoint:    origin + '/api/chat',
  };

  /* ── Derive colours from accent ───────────────────────── */
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  }
  const rgb = hexToRgb(cfg.accent);

  /* ── Inject styles ────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    .ce-root *, .ce-root *::before, .ce-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .ce-root { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; font-size: 14px; line-height: 1.5; }

    /* Toggle button */
    .ce-toggle {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 52px; height: 52px; border-radius: 50%;
      background: ${cfg.accent};
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(${rgb},0.45);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      color: white;
    }
    .ce-toggle:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(${rgb},0.55); }
    .ce-toggle svg { transition: transform 0.3s ease, opacity 0.2s ease; }
    .ce-toggle .ce-icon-open  { position: absolute; }
    .ce-toggle .ce-icon-close { position: absolute; opacity: 0; transform: rotate(-90deg); }
    .ce-toggle.open .ce-icon-open  { opacity: 0; transform: rotate(90deg); }
    .ce-toggle.open .ce-icon-close { opacity: 1; transform: rotate(0); }

    /* Unread badge */
    .ce-badge {
      position: absolute; top: -3px; right: -3px;
      width: 16px; height: 16px; border-radius: 50%;
      background: #ef4444; color: white;
      font-size: 9px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid white; display: none;
    }
    .ce-badge.show { display: flex; }

    /* Panel */
    .ce-panel {
      position: fixed; bottom: 90px; right: 24px; z-index: 9998;
      width: 360px; height: 520px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);
      display: flex; flex-direction: column; overflow: hidden;
      transform: scale(0.92) translateY(16px);
      opacity: 0; pointer-events: none;
      transform-origin: bottom right;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease;
    }
    .ce-panel.open {
      transform: scale(1) translateY(0);
      opacity: 1; pointer-events: all;
    }

    /* Panel header */
    .ce-header {
      flex-shrink: 0;
      padding: 14px 16px;
      background: ${cfg.accent};
      display: flex; align-items: center; gap: 10px;
      color: white;
    }
    .ce-header-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; flex-shrink: 0;
    }
    .ce-header-info { flex: 1; }
    .ce-header-title { font-size: 13px; font-weight: 600; line-height: 1.2; }
    .ce-header-status { font-size: 11px; opacity: 0.8; display: flex; align-items: center; gap: 4px; }
    .ce-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 5px #4ade80; }
    .ce-header-close {
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(255,255,255,0.15);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; border: none; color: white; flex-shrink: 0;
      transition: background 0.2s;
    }
    .ce-header-close:hover { background: rgba(255,255,255,0.25); }

    /* Messages */
    .ce-messages {
      flex: 1; overflow-y: auto; overflow-x: hidden;
      padding: 14px; display: flex; flex-direction: column; gap: 10px;
      scroll-behavior: smooth; background: #f8fafc;
    }
    .ce-messages::-webkit-scrollbar { width: 3px; }
    .ce-messages::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

    /* Message bubbles */
    .ce-msg { display: flex; flex-direction: column; gap: 3px; animation: ce-in 0.2s ease both; }
    @keyframes ce-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

    .ce-msg.user  { align-items: flex-end; }
    .ce-msg.ai    { align-items: flex-start; }

    .ce-bubble {
      max-width: 82%; padding: 9px 12px;
      border-radius: 14px; font-size: 13px; line-height: 1.55; word-break: break-word;
    }
    .ce-msg.user .ce-bubble {
      background: ${cfg.accent}; color: white;
      border-bottom-right-radius: 4px;
    }
    .ce-msg.ai .ce-bubble {
      background: white; color: #1e293b;
      border: 1px solid #e2e8f0; border-bottom-left-radius: 4px;
    }
    .ce-msg.ai.error .ce-bubble { background: #fff1f2; border-color: #fecaca; color: #b91c1c; }

    .ce-time { font-size: 10px; color: #94a3b8; padding: 0 4px; }

    /* Typing indicator */
    .ce-typing { display: flex; gap: 4px; align-items: center; padding: 10px 12px; }
    .ce-typing-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #94a3b8;
      animation: ce-bounce 1.2s ease-in-out infinite;
    }
    .ce-typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .ce-typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes ce-bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }

    /* Stream cursor */
    .ce-cursor {
      display: inline-block; width: 2px; height: 0.85em;
      background: ${cfg.accent}; margin-left: 2px;
      vertical-align: text-bottom; border-radius: 1px;
      animation: ce-blink 0.65s step-end infinite;
    }
    @keyframes ce-blink { 0%,100%{opacity:1} 50%{opacity:0} }

    /* Input bar */
    .ce-input-bar {
      flex-shrink: 0;
      padding: 10px 12px;
      border-top: 1px solid #e2e8f0;
      background: white;
      display: flex; align-items: flex-end; gap: 8px;
    }
    .ce-input {
      flex: 1; background: #f1f5f9; border: 1px solid #e2e8f0;
      border-radius: 20px; padding: 8px 14px;
      font: inherit; font-size: 13px; color: #1e293b;
      outline: none; resize: none; max-height: 100px; overflow-y: auto;
      line-height: 1.5; transition: border-color 0.2s;
    }
    .ce-input::placeholder { color: #94a3b8; }
    .ce-input:focus { border-color: rgba(${rgb},0.4); background: white; box-shadow: 0 0 0 3px rgba(${rgb},0.08); }

    .ce-send {
      flex-shrink: 0; width: 34px; height: 34px; border-radius: 50%;
      background: ${cfg.accent}; color: white;
      display: flex; align-items: center; justify-content: center;
      border: none; cursor: pointer;
      transition: opacity 0.2s, box-shadow 0.2s, background 0.2s;
      box-shadow: 0 2px 8px rgba(${rgb},0.35);
    }
    .ce-send:hover:not(:disabled) { opacity: 0.88; box-shadow: 0 4px 14px rgba(${rgb},0.45); }
    .ce-send:disabled { opacity: 0.3; cursor: not-allowed; }
    .ce-send.streaming { background: #ef4444; box-shadow: 0 2px 8px rgba(239,68,68,0.35); }
    .ce-send.streaming .ce-send-icon  { display: none; }
    .ce-send.streaming .ce-stop-icon  { display: block; }
    .ce-send .ce-stop-icon { display: none; }

    /* Powered by footer */
    .ce-footer {
      text-align: center; padding: 5px;
      font-size: 10px; color: #cbd5e1;
      background: white; border-top: 1px solid #f1f5f9;
    }
    .ce-footer a { color: #94a3b8; text-decoration: none; }
    .ce-footer a:hover { color: ${cfg.accent}; }

    /* Mobile */
    @media (max-width: 420px) {
      .ce-panel { width: calc(100vw - 20px); right: 10px; bottom: 80px; height: 70vh; }
      .ce-toggle { bottom: 16px; right: 16px; }
    }
  `;
  document.head.appendChild(style);

  /* ── Build HTML ───────────────────────────────────────── */
  const root = document.createElement('div');
  root.className = 'ce-root';
  root.innerHTML = `
    <!-- Toggle button -->
    <button class="ce-toggle" id="ceToggle" aria-label="Open chat">
      <span class="ce-badge" id="ceBadge">1</span>
      <svg class="ce-icon-open" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <svg class="ce-icon-close" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>

    <!-- Chat panel -->
    <div class="ce-panel" id="cePanel" role="dialog" aria-label="Chat" aria-hidden="true">

      <div class="ce-header">
        <div class="ce-header-avatar">💬</div>
        <div class="ce-header-info">
          <div class="ce-header-title">${cfg.title}</div>
          <div class="ce-header-status">
            <span class="ce-status-dot"></span> Online
          </div>
        </div>
        <button class="ce-header-close" id="ceClose" aria-label="Close chat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="ce-messages" id="ceMessages" role="log" aria-live="polite"></div>

      <div class="ce-input-bar">
        <textarea
          id="ceInput" class="ce-input" rows="1"
          placeholder="${cfg.placeholder}"
          aria-label="Message"
        ></textarea>
        <button class="ce-send" id="ceSend" aria-label="Send" disabled>
          <svg class="ce-send-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
          <svg class="ce-stop-icon" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
          </svg>
        </button>
      </div>

      <div class="ce-footer">
        Powered by <a href="https://devfolio-os.vercel.app" target="_blank">ChatEmbed</a>
      </div>

    </div>
  `;
  document.body.appendChild(root);

  /* ── DOM refs ─────────────────────────────────────────── */
  const toggle   = root.querySelector('#ceToggle');
  const panel    = root.querySelector('#cePanel');
  const closeBtn = root.querySelector('#ceClose');
  const messages = root.querySelector('#ceMessages');
  const input    = root.querySelector('#ceInput');
  const sendBtn  = root.querySelector('#ceSend');
  const badge    = root.querySelector('#ceBadge');

  /* ── State ────────────────────────────────────────────── */
  let isOpen      = false;
  let isStreaming = false;
  let history     = [];
  let abortCtrl   = null;
  let greeted     = false;

  /* ── Toggle panel ─────────────────────────────────────── */
  function openPanel() {
    isOpen = true;
    toggle.classList.add('open');
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    badge.classList.remove('show');
    if (!greeted) { showGreeting(); greeted = true; }
    setTimeout(() => input.focus(), 300);
  }

  function closePanel() {
    isOpen = false;
    toggle.classList.remove('open');
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }

  toggle.addEventListener('click', () => isOpen ? closePanel() : openPanel());
  closeBtn.addEventListener('click', closePanel);

  /* Show badge after 2s if not opened */
  setTimeout(() => { if (!greeted) badge.classList.add('show'); }, 2000);

  /* ── Greeting ─────────────────────────────────────────── */
  function showGreeting() {
    appendMsg('ai', cfg.greeting);
  }

  /* ── Input handling ───────────────────────────────────── */
  input.addEventListener('input', () => {
    autoResize();
    syncSendBtn();
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) handleSend();
    }
  });

  sendBtn.addEventListener('click', () => {
    if (isStreaming) stopStream();
    else handleSend();
  });

  function autoResize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  }

  function syncSendBtn() {
    sendBtn.disabled = !input.value.trim() && !isStreaming;
  }

  function stopStream() {
    if (abortCtrl) { abortCtrl.abort(); abortCtrl = null; }
    setStreaming(false);
  }

  /* ── Send message ─────────────────────────────────────── */
  async function handleSend() {
    const text = input.value.trim();
    if (!text || isStreaming) return;

    history.push({ role: 'user', content: text });
    appendMsg('user', text);

    input.value = '';
    input.style.height = 'auto';
    syncSendBtn();
    scrollBottom();

    await streamReply();
  }

  /* ── Stream from API ──────────────────────────────────── */
  async function streamReply() {
    setStreaming(true);
    abortCtrl = new AbortController();

    const { contentEl, cursorEl } = appendStreamingMsg();
    let full = '';
    let first = true;

    try {
      const res = await fetch(cfg.endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  abortCtrl.signal,
        body:    JSON.stringify({ messages: history, systemPrompt: cfg.system }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const p = JSON.parse(data);
            if (p.error) throw new Error(p.error);
            if (p.text) {
              if (first) { contentEl.textContent = ''; first = false; }
              full += p.text;
              contentEl.textContent = full;
              contentEl.appendChild(cursorEl);
              scrollBottom();
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        full = 'Sorry, something went wrong. Please try again.';
        contentEl.closest('.ce-msg')?.classList.add('error');
        console.error('[ChatEmbed]', err);
      }
    }

    cursorEl.remove();
    contentEl.textContent = full || '...';

    if (full && full !== '...') {
      history.push({ role: 'assistant', content: full });
    }

    setStreaming(false);
    scrollBottom();
  }

  /* ── UI helpers ───────────────────────────────────────── */
  function setStreaming(on) {
    isStreaming = on;
    sendBtn.classList.toggle('streaming', on);
    sendBtn.disabled = false;
    input.disabled   = on;
    if (!on) { input.focus(); syncSendBtn(); }
  }

  function scrollBottom() {
    requestAnimationFrame(() => { messages.scrollTop = messages.scrollHeight; });
  }

  function timeNow() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /* ── Append finalised message ─────────────────────────── */
  function appendMsg(role, text) {
    const wrap = document.createElement('div');
    wrap.className = `ce-msg ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'ce-bubble';
    bubble.textContent = text;
    const time = document.createElement('div');
    time.className = 'ce-time';
    time.textContent = timeNow();
    wrap.appendChild(bubble);
    wrap.appendChild(time);
    messages.appendChild(wrap);
    scrollBottom();
    return wrap;
  }

  /* ── Append streaming AI message (typing dots → text) ─── */
  function appendStreamingMsg() {
    const wrap = document.createElement('div');
    wrap.className = 'ce-msg ai';

    const bubble = document.createElement('div');
    bubble.className = 'ce-bubble';

    const contentEl = document.createElement('span');
    contentEl.innerHTML = `<span class="ce-typing">
      <span class="ce-typing-dot"></span>
      <span class="ce-typing-dot"></span>
      <span class="ce-typing-dot"></span>
    </span>`;

    const cursorEl = document.createElement('span');
    cursorEl.className = 'ce-cursor';

    bubble.appendChild(contentEl);
    wrap.appendChild(bubble);
    messages.appendChild(wrap);
    scrollBottom();
    return { contentEl, cursorEl };
  }

})();