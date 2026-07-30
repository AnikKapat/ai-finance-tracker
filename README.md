# 💰 PennyPal

<p align="center">
  <img src="./public/Screenshot 2026-07-29 220347.png" alt="PennyPal Logo" width="120"/>
</p>

<p align="center">
  <b>Your AI-Powered Personal Finance Assistant</b><br/>
  Track expenses, manage accounts, scan receipts, and gain intelligent financial insights—all in one place.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react"/>
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma"/>
  <img src="https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql"/>
  <img src="https://img.shields.io/badge/Clerk-Authentication-6C47FF"/>
  <img src="https://img.shields.io/badge/Gemini-AI-4285F4"/>
  <img src="https://img.shields.io/badge/Inngest-Background_Jobs-000000"/>
  <img src="https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel"/>
</p>

---

## 🌐 Live Demo

🔗 **https://penny-pal-sooty.vercel.app**

---

# 📖 About

Managing personal finances shouldn't be complicated.

**PennyPal** is an AI-powered finance management platform that helps users track expenses, manage multiple accounts, monitor spending habits, and receive intelligent financial insights.

Designed with a clean UI and modern technologies, PennyPal combines automation, AI, and data visualization to make personal finance simple.

---

# ✨ Features

## 💳 Multi-Account Management

- Create unlimited accounts
- Multiple account types
- Default account support
- Real-time balance updates

---

## 💸 Expense & Income Tracking

- Add transactions effortlessly
- Categorize expenses
- Track income sources
- Automatic balance calculations

---

## 📄 AI Receipt Scanner

Upload a receipt and let AI extract:

- Merchant
- Amount
- Date
- Category

No manual data entry required.

---

## 🤖 AI Financial Insights

Powered by **Google Gemini**

Get intelligent insights about:

- Spending patterns
- Budget analysis
- Financial trends
- Smart recommendations

---

## 📊 Dashboard Analytics

Visualize your finances with

- Transaction summaries
- Account balances
- Spending trends
- Category breakdowns

---

## 🔐 Secure Authentication

Authentication powered by **Clerk**

- Secure Sign Up
- Login
- Session Management
- Protected Routes

---

## ⚡ Background Jobs

Using **Inngest**

- Automated workflows
- Scheduled processing
- Email automation
- Async task execution

---

## 📧 Email Notifications

Powered by **Resend**

Receive:

- Monthly reports
- Automated notifications
- Financial summaries

---

## 🛡️ Rate Limiting

Implemented using **Arcjet**

Protects APIs against abuse with token bucket rate limiting.

---

# 🏗 Tech Stack

## Frontend

- Next.js 15
- React 19
- Tailwind CSS
- Shadcn UI
- Framer Motion

## Backend

- Next.js Server Actions
- Prisma ORM
- PostgreSQL

## Authentication

- Clerk

## AI

- Google Gemini

## Background Jobs

- Inngest

## Emails

- Resend

## Security

- Arcjet

## Deployment

- Vercel

---

# 📂 Project Structure

```
app/
components/
actions/
lib/
prisma/
public/
hooks/
data/
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/AnikKapat/ai-finance-tracker.git

cd ai-finance-tracker
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Environment Variables

Create

```
.env
```

Add:

```env
DATABASE_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

ARCJET_KEY=

GEMINI_API_KEY=

RESEND_API_KEY=

```

---

## Prisma

Generate Client

```bash
npx prisma generate
```

Run Migrations

```bash
npx prisma migrate deploy
```

---

## Start Development Server

```bash
npm run dev
```

---

## Production Build

```bash
npm run build
```


# 🔒 Security

PennyPal includes:

- Clerk Authentication
- Protected Server Actions
- Rate Limiting with Arcjet
- Secure Database Access
- Environment Variable Protection

---

# 📈 Future Roadmap

- Investment Portfolio Tracking
- Savings Goals
- Budget Planner
- Recurring Transactions
- Mobile App
- Multi-currency Support
- Bank API Integration
- AI Chat Assistant
- Dark/Light Theme Toggle

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository

2. Create a feature branch

```bash
git checkout -b feature/my-feature
```

3. Commit changes

```bash
git commit -m "Add new feature"
```

4. Push

```bash
git push origin feature/my-feature
```

5. Open a Pull Request

---

# 📜 License

This project is licensed under the MIT License.

---

# 👨‍💻 Developer

### Anik Kapat

Electronics & Communication Engineering

Haldia Institute of Technology

GitHub:
https://github.com/AnikKapat


---

<p align="center">

⭐ If you found this project helpful, consider giving it a star!

Made with ❤️ using Next.js, AI and a lot of ☕.

</p>

### Make sure to create a `.env` file with following variables -

```
DATABASE_URL=
DIRECT_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

GEMINI_API_KEY=

RESEND_API_KEY=

ARCJET_KEY=
```
