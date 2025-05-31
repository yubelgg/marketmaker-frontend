# MarketMaker Frontend

A Next.js frontend for the WallStreetBets Sentiment Analyzer using FinBERT.

## Features

- 🎯 Real-time sentiment analysis of WSB posts
- 📊 Visual probability breakdown
- 🚀 Modern React/Next.js interface
- 📱 Responsive design with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15.3.2
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Deployment**: Vercel

## Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_API_URL=https://yubelgg-marketmaker-api-c2355b206177.herokuapp.com
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`: Your Heroku backend URL
4. Deploy automatically on push

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## API Integration

The frontend connects to a Flask backend that provides sentiment analysis using a fine-tuned FinBERT model. The API expects:

```typescript
// Request
{
  "text": "TSLA to the moon! 🚀🚀🚀"
}

// Response
{
  "text": "TSLA to the moon! 🚀🚀🚀",
  "predictions": [
    {"label": "positive", "score": 0.85},
    {"label": "neutral", "score": 0.10},
    {"label": "negative", "score": 0.05}
  ],
  "model": "yubelgg/marketmaker"
}
```

## Project Structure

```
marketmaker-frontend/
├── app/
│   ├── components/
│   │   └── SentimentAnalyzer.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── .env.local
├── package.json
└── vercel.json
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
