'use client';

import { useState } from 'react';
import axios from 'axios';

interface SentimentResult {
    text: string;
    predictions: Array<{
        label: string;
        score: number;
    }>;
    model: string;
    source?: string;
    note?: string;
}

interface DisplayResult {
    text: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    probabilities: {
        positive: number;
        neutral: number;
        negative: number;
    };
    source?: string;
    note?: string;
}

export default function SentimentAnalyzer() {
    const [text, setText] = useState<string>('');
    const [result, setResult] = useState<DisplayResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const processApiResponse = (apiResult: SentimentResult): DisplayResult => {
        // Convert API response to display format
        const probabilities = {
            positive: 0,
            neutral: 0,
            negative: 0
        };

        // Map predictions to probabilities
        apiResult.predictions.forEach(pred => {
            const label = pred.label.toLowerCase();
            if (label.includes('positive') || label.includes('pos')) {
                probabilities.positive = pred.score;
            } else if (label.includes('negative') || label.includes('neg')) {
                probabilities.negative = pred.score;
            } else if (label.includes('neutral') || label.includes('neu')) {
                probabilities.neutral = pred.score;
            }
        });

        // Determine primary sentiment
        const maxProb = Math.max(probabilities.positive, probabilities.neutral, probabilities.negative);
        let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';

        if (probabilities.positive === maxProb) {
            sentiment = 'positive';
        } else if (probabilities.negative === maxProb) {
            sentiment = 'negative';
        }

        return {
            text: apiResult.text,
            sentiment,
            confidence: maxProb,
            probabilities,
            source: apiResult.source,
            note: apiResult.note
        };
    };

    const analyzeSentiment = async () => {
        if (!text.trim()) {
            setError('Please enter some text to analyze');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const API_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : process.env.NEXT_PUBLIC_API_URL;

            console.log('Environment:', process.env.NODE_ENV);
            console.log('Using API URL:', API_URL);

            const response = await axios.post(`${API_URL}/api/analyze`, {
                text: text.trim()
            }, {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('API Response:', response.data);

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            // Process the response and show results
            if (response.data.predictions) {
                const processedResult = processApiResponse(response.data);
                setResult(processedResult);
            } else {
                throw new Error('No predictions received from API');
            }

        } catch (err: unknown) {
            console.error('Error analyzing sentiment:', err);

            let errorMessage = 'Failed to analyze sentiment. Please try again.';

            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { error?: string } }; message?: string };
                if (axiosError.response?.data?.error) {
                    errorMessage = axiosError.response.data.error;
                } else if (axiosError.message?.includes('timeout')) {
                    errorMessage = 'Request timed out. Please try again.';
                } else if (axiosError.message?.includes('Network Error')) {
                    errorMessage = 'Network error. Please check your connection and try again.';
                }
            }

            setError(errorMessage);
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
                    placeholder="Enter a WallStreetBets post to analyze sentiment... (e.g., 'TSLA to the moon! 🚀🚀🚀')"
                    className="w-full p-4 text-base border border-gray-700 rounded-md mb-4 font-sans resize-vertical 
                             bg-neutral-900 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    rows={6}
                />
                <button
                    onClick={analyzeSentiment}
                    disabled={loading || !text.trim()}
                    className="px-6 py-3 bg-blue-600 text-white border-none rounded-md cursor-pointer text-base
                    transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? 'Analyzing...' : 'Analyze Sentiment'}
                </button>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}
            </div>

            {result && (
                <div className="w-full border border-gray-200 rounded-lg p-6 shadow-md bg-neutral-800">
                    <h2 className="text-xl font-bold mb-4">Analysis Result:</h2>

                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 font-medium">Analyzed Text:</p>
                        <p className="text-gray-800 italic">&ldquo;{result.text}&rdquo;</p>
                    </div>

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
                        <h3 className="text-lg font-semibold mb-3">Probability Breakdown:</h3>
                        {Object.entries(result.probabilities).map(([sentiment, value]) => (
                            <div key={sentiment} className="mb-4">
                                <div className="flex justify-between mb-1">
                                    <span className="capitalize font-medium">{sentiment}:</span>
                                    <span className="font-bold">{(value * 100).toFixed(2)}%</span>
                                </div>
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

                    {result.note && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-blue-700 text-sm">{result.note}</p>
                        </div>
                    )}

                    {result.source && (
                        <div className="mt-2 text-xs text-gray-500">
                            Source: {result.source}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
