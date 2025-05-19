'use client';

import { useState } from 'react';
import axios from 'axios';

interface SentimentResult {
    text: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    probabilities: {
        positive: number;
        neutral: number;
        negative: number;
    };
}

export default function SentimentAnalyzer() {
    const [text, setText] = useState<string>('');
    const [result, setResult] = useState<SentimentResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const analyzeSentiment = async () => {
        if (!text.trim()) {
            setError('Please enter some text to analyze');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://marketmaker-api.herokuapp.com';
            const response = await axios.post(`${API_URL}/api/analyze`, {
                text
            });
            setResult(response.data);
        } catch (err) {
            console.error('Error analyzing sentiment:', err);
            setError('Failed to analyze sentiment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getSentimentColor = (sentiment: string) => {
        if (sentiment === 'positive') return '#4caf50';
        if (sentiment === 'negative') return '#f44336';
        return '#ff9800';
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div className="mb-8">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter a WallStreetBets post to analyze sentiment..."
                    className="w-full p-4 text-base border border-gray-300 rounded-md mb-4 font-sans"
                    rows={6}
                />
                <button
                    onClick={analyzeSentiment}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white border-none rounded-md cursor-pointer text-base
                    transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? 'Analyzing...' : 'Analyze Sentiment'}
                </button>

                {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>

            {result && (
                <div className="w-full border border-gray-200 rounded-lg p-6 shadow-md">
                    <h2 className="text-xl font-bold mb-4">Analysis Result:</h2>
                    <div
                        className="text-center p-4 rounded-lg mb-6 text-white"
                        style={{ backgroundColor: getSentimentColor(result.sentiment) }}
                    >
                        <p className="text-2xl font-bold mb-2">{result.sentiment.toUpperCase()}</p>
                        <p className="text-base">
                            Confidence: {(result.confidence * 100).toFixed(2)}%
                        </p>
                    </div>

                    <div className="mt-6">
                        {Object.entries(result.probabilities).map(([sentiment, value]) => (
                            <div key={sentiment} className="mb-4">
                                <p className="mb-1 capitalize">
                                    {sentiment}: {(value * 100).toFixed(2)}%
                                </p>
                                <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full transition-all duration-300"
                                        style={{
                                            width: `${value * 100}%`,
                                            backgroundColor: getSentimentColor(sentiment)
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}