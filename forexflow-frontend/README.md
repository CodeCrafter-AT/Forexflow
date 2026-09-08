# ForexFlow Frontend

The frontend for **ForexFlow**, a full-stack paper-trading platform for Forex and Bitcoin.

Built with React and Vite, it provides the interactive trading workspace for market monitoring, chart analysis, simulated order execution, portfolio tracking, and performance review.

## ✨ Highlights

- 📈 Interactive market charts with Lightweight Charts
- 💱 Forex and Bitcoin paper-trading workflows
- 🟢 BUY / Long and 🔴 SELL / Short positions
- 🛑 Stop Loss and Take Profit controls
- 💰 Virtual balance and margin tracking
- 📊 Portfolio and trading performance analytics
- ⚡ Real-time market updates through Twelve Data WebSocket
- 🔄 Live OHLC data for market analysis
- 🎞️ Framer Motion animations and transitions
- 🎨 Responsive Tailwind CSS interface

## 🧱 Tech Stack

- **React 19** — UI
- **Vite 7** — development and build tooling
- **Tailwind CSS** — styling
- **React Router** — application routing
- **Lightweight Charts** — trading charts
- **Framer Motion** — animations
- **Lucide React** — interface icons

## 📁 Structure

```text
src/
├── assets/         # Static assets
├── components/     # Reusable UI components
├── hooks/          # Market data and application hooks
├── pages/          # Application screens
├── App.jsx         # Application shell and routing
└── main.jsx        # Frontend entry point
```

## ⚡ Local Development

From the repository root:

```bash
npm run install-all
npm run dev
```

Or run the frontend independently:

```bash
cd forexflow-frontend
npm install
npm run dev
```

Vite will print the local development URL in the terminal.

## 🔐 Environment

Create a local `.env` file from `.env.example` and configure the backend API URL required by the application.

Example:

```env
VITE_API_URL=http://localhost:3001/api
```

Do not commit secrets or private API credentials to the repository.

## 🔌 Backend Integration

The frontend communicates with the ForexFlow Node/Express backend for authentication, trading, portfolio data, and account statistics.

Market information is supplied through Twelve Data integrations used by the application.

For the complete full-stack setup, see the repository's root [`README.md`](../README.md).

## 🚀 Production

The intended production architecture separates the frontend and backend:

```text
User
  │
  ▼
ForexFlow Frontend
React + Vite
  │
  ▼
ForexFlow API
Node + Express
  │
  ├── SQLite
  │
  └── Twelve Data
```

The repository's [`DEPLOYMENT.md`](../DEPLOYMENT.md) contains the deployment configuration and environment requirements.

## 🛡️ Important

ForexFlow is a **paper-trading application**. The frontend is part of an educational simulation and does not execute real financial transactions.

---

<p align="center">
  <strong>Analyze. Practice. Trade smarter.</strong><br />
  <sub>ForexFlow — a simulated trading workspace for learning and experimentation.</sub>
</p>
