# 💬 ChatEmbed

> A lightweight (~5kb) embeddable AI chat widget. Drop one `<script>` tag into any website and get a fully functional Claude-powered chatbot — customisable via `data-*` attributes, no code changes needed.

[![Live Demo](https://img.shields.io/badge/Live-Demo-14b8a6?style=flat-square)](https://chatembed.vercel.app)
[![Built with Claude](https://img.shields.io/badge/Powered%20by-Claude%20API-8b5cf6?style=flat-square)](https://anthropic.com)

---

## Embed in any website

```html
<script
  src="https://chatembed.vercel.app/widget.js"
  data-accent="#6366f1"
  data-title="Support Assistant"
  data-greeting="Hi! How can I help you today? 👋"
  data-system-prompt="You are a helpful support assistant. Be friendly and concise."
  data-placeholder="Ask me anything..."
></script>
```

That's it. One tag. The widget handles everything else.

---

## Configuration

| Attribute | Description | Default |
|-----------|-------------|---------|
| `data-accent` | Brand colour (any CSS colour) | `#6366f1` |
| `data-title` | Widget header title | `AI Assistant` |
| `data-greeting` | First message shown to user | `Hi! How can I help you today? 👋` |
| `data-system-prompt` | Claude system prompt | `You are a helpful AI assistant.` |
| `data-placeholder` | Input placeholder text | `Type a message...` |

---

## Features

- **One script tag** — no build step, no dependencies, no config files
- **Self-contained** — injects its own scoped CSS, doesn't affect host page styles
- **Streaming responses** — text appears word by word via SSE
- **Multi-turn context** — full conversation history maintained per session
- **Customisable** — accent colour, title, greeting, system prompt via data attributes
- **Animated** — spring-open panel, typing indicator, streaming cursor
- **Mobile responsive** — adapts to small screens automatically
- **Unread badge** — appears after 2s if the user hasn't opened the widget

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Widget | Vanilla JavaScript (IIFE, ~5kb) |
| Styles | Injected scoped CSS |
| Backend | Vercel Serverless Function (Node) |
| AI | Anthropic Claude Haiku (fast responses) |
| Deploy | Vercel |

---

## Project Structure

```
chatembed/
├── public/
│   ├── index.html    # Nexus demo page (shows widget in context)
│   ├── style.css     # Demo page styles
│   └── widget.js     # The embeddable widget (self-contained)
├── api/
│   └── chat.js       # Claude API proxy
├── vercel.json
├── package.json
├── .gitignore
└── README.md
```

---

## Getting Started

```bash
git clone https://github.com/sobimohammet/chatembed.git
cd chatembed && npm install
echo "ANTHROPIC_API_KEY=sk-ant-your-key" > .env.local
npx vercel dev
```

---

## Deploy

Connect to Vercel, add `ANTHROPIC_API_KEY` environment variable, deploy.

---

## License

MIT — *Part of [DEVFOLIO OS](https://devfolio-os.vercel.app) · Built by Sobi Mohamed*