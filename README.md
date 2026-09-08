# ForexFlow

> **A paper-trading platform for Forex and Bitcoin — built to practice real trading workflows without risking real capital.**

ForexFlow is a full-stack simulated trading platform that combines live market data, chart-based analysis, virtual portfolio management, and trade performance tracking in a single trading workspace.

It is designed for learning, strategy experimentation, and understanding the mechanics of leveraged trading without executing real orders on an exchange or broker.

---

## ✨ What ForexFlow Does

ForexFlow lets users work with a simulated trading account and:

- 📈 Monitor live market prices
- ₿ Practice Bitcoin trading
- 💱 Practice Forex trading
- 📊 Analyze price action with interactive charts
- 🟢 Open simulated BUY positions
- 🔴 Open simulated SELL positions
- 🛑 Set Stop Loss and Take Profit levels
- 💰 Manage virtual account balance and margin
- 📋 Track open and closed trades
- 📊 Review P&L and trading statistics
- 🧮 Simulate position sizing and contract-based P&L
- ⚠️ Apply margin and stop-out protection

**No real trades are executed.**

---

## 🖥️ Core Trading Experience

### Live Market Data

ForexFlow integrates with **Twelve Data** for market information. The application uses live price/OHLC data for charting and trading workflows, with the backend independently validating market prices before accepting trades.

The frontend also supports real-time tick updates through the Twelve Data WebSocket feed.

### Paper Trading Engine

Trades are simulated against the user's virtual account balance.

When a position is opened, the required margin is reserved from the simulated balance. When the position is closed, the margin is released and simulated P&L is applied to the account.

### Long & Short Trading

The platform supports both directions:

- **BUY / Long:** profits when the closing price is above the entry price.
- **SELL / Short:** profits when the closing price is below the entry price.

### Risk Controls

The backend includes server-side validation for trades and a margin stop-out guard. New positions can be rejected when available simulated funds are insufficient or the account's calculated margin level reaches the configured critical threshold.

Stop Loss and Take Profit values are supported as part of the trade model.

---

## 📊 Portfolio & Performance

ForexFlow calculates and exposes trading-account statistics including:

- Current balance
- Account health
- Net P&L
- Total trades
- Open trades
- Closed trades
- Winning trades
- Losing trades
- Win rate
- Locked margin
- Most frequently traded pair
- Best trade
- Worst trade

This makes the platform useful not only for placing paper trades, but also for reviewing how a trading approach performs over time.

---

## 🧠 How a Trade Works

```text
        Live Market Data
               │
               ▼
        Analyze the Market
               │
               ▼
       Select Trading Pair
               │
               ▼
     Configure Trade Parameters
      (Direction / Lots / Margin)
               │
               ▼
        Server Validation
               │
               ▼
       Margin Availability
               │
               ▼
        Open Paper Trade
               │
               ▼
       Monitor Position
               │
               ▼
         Close Position
               │
               ▼
       Calculate Simulated P&L
               │
               ▼
       Update Virtual Balance
               │
               ▼
        Store Trade History
```

---

## 🏗️ Architecture

ForexFlow is organized as a separate React/Vite frontend and Node/Express backend.

```text
┌──────────────────────────────────────┐
│              ForexFlow               │
├───────────────────┬──────────────────┤
│                   │                  │
│     Frontend      │     Backend      │
│     React + Vite  │ Node + Express   │
│                   │                  │
│  Trading UI       │ Authentication   │
│  Charts           │ Trade Engine     │
│  Portfolio        │ User Management  │
│  Analysis         │ Market Service   │
│                   │ Validation       │
└─────────┬─────────┴────────┬─────────┘
          │                  │
          │                  ▼
          │             SQLite DB
          │
          ▼
     Twelve Data
   REST + WebSocket
```

---

## 🛠️ Tech Stack

### Frontend

- **React 19**
- **Vite 7**
- **Tailwind CSS**
- **React Router**
- **Lightweight Charts**
- **Framer Motion**
- **Lucide React**

### Backend

- **Node.js 20**
- **Express 5**
- **SQLite3**
- **JWT** authentication
- **bcryptjs** password hashing
- **CORS**
- **dotenv** configuration

### Market Data

- **Twelve Data REST API**
- **Twelve Data WebSocket**

---

## 📁 Project Structure

```text
Forexflow/
│
├── forexflow-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── forexflow-backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── DEPLOYMENT.md
├── package.json
└── README.md
```

---

## ⚡ Getting Started

### Prerequisites

- Node.js 20+
- npm
- A Twelve Data API key

### 1. Clone the repository

```bash
git clone https://github.com/CodeCrafter-AT/Forexflow.git
cd Forexflow
```

### 2. Install all dependencies

```bash
npm run install-all
```

### 3. Configure the backend

Create the environment file:

```bash
cp forexflow-backend/.env.example forexflow-backend/.env
```

Set the required values in `forexflow-backend/.env`:

```env
PORT=3001
JWT_SECRET=your_super_secret_jwt_key
TWELVEDATA_API_KEY=your_twelvedata_api_key
NODE_ENV=development
```

Never commit real credentials or API keys to GitHub.

### 4. Configure the frontend

Create the frontend environment file from its example and configure the API URL required by the application.

### 5. Start the application

From the repository root:

```bash
npm run dev
```

The root development script starts both the frontend and backend concurrently.

---

## 🔐 Security & Validation

ForexFlow performs important checks on the server rather than relying only on the client.

Trade execution includes checks for:

- Valid trade parameters
- Positive margin
- Existing user account
- Sufficient available balance
- Existing/open positions
- Margin-level stop-out conditions

Trade balance updates and trade creation are handled inside database transactions so related account changes can be committed or rolled back together.

---

## 🚀 Deployment

The repository includes a dedicated production deployment guide covering the intended deployment architecture:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** SQLite, with persistence considerations documented in the deployment guide

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the deployment workflow and environment configuration.

---

## 🗺️ Roadmap

ForexFlow is an evolving project. Potential future improvements include:

- [ ] More trading instruments
- [ ] Advanced order types
- [ ] Improved historical backtesting
- [ ] Trading journal
- [ ] Risk/reward tools
- [ ] Advanced performance analytics
- [ ] More robust persistent production database
- [ ] Automated testing
- [ ] Expanded authentication and account features
- [ ] Improved real-time market infrastructure

---

## ⚠️ Disclaimer

ForexFlow is a **paper-trading and educational project**.

It does not execute real financial transactions and does not provide investment or financial advice. Simulated trading results do not represent guaranteed or expected results in live markets.

Always understand the risks involved before trading real financial instruments.

---

## 📄 License

This project currently uses the repository's existing **ISC** license configuration.

---

## 👨‍💻 Project

**ForexFlow**

A full-stack project focused on building a realistic paper-trading experience for Forex and Bitcoin markets.

---

<p align="center">

**Practice the market. Test your strategy. Trade without risking real capital.**

</p>
