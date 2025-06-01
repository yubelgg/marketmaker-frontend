import SentimentAnalyzer from './components/SentimentAnalyzer';

export default function Home() {
  return (
    <main className="min-h-screen p-8 md:p-16 bg-neutral-900">
      <h1 className="text-4xl font-bold mb-8 text-center text-white">
        WallStreetBets Sentiment Analyzer
      </h1>
      <SentimentAnalyzer />
    </main>
  );
}
