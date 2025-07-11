'use client';

import { useState } from 'react';
import axios from 'axios';
import EarningsChart from './EarningsChart';
import TickerSearchInput from './TickerSearchInput';
import DividendsChart from './DividendsChart';
import CashFlowChart from './CashFlowChart';
import IncomeStatementChart from './IncomeStatementChart';
import { fetchStockNews, getCompanyName } from '../utils/newsApi';

/**
 * Development-only logging utility
 */
const devLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, ...args);
  }
};

interface SentimentData {
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    summary: string;
    probabilities?: {
        positive: number;
        neutral: number;
        negative: number;
    };
    newsArticles?: Array<{
        title: string;
        source: { name: string };
        publishedAt: string;
        url: string;
    }>;
    newsText?: string;
}

interface ApiResponse {
    text: string;
    predictions: Array<{
        label: string;
        score: number;
    }>;
    model: string;
    source?: string;
    note?: string;
}

export default function TickerDashboard() {
    const [ticker, setTicker] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
    const [error, setError] = useState<string>('');
    const [shouldFetchResults, setShouldFetchResults] = useState<boolean>(false);

    const processApiResponse = (apiResult: ApiResponse): SentimentData => {
        const probabilities = {
            positive: 0,
            neutral: 0,
            negative: 0
        };

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

        // determine sentiment
        const maxProb = Math.max(probabilities.positive, probabilities.neutral, probabilities.negative);
        let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';

        if (probabilities.positive === maxProb) {
            sentiment = 'positive';
        } else if (probabilities.negative === maxProb) {
            sentiment = 'negative';
        }

        const tickerUpper = ticker.toUpperCase();
        let summary = '';

        if (sentiment === 'positive') {
            summary = `Recent news analysis for ${tickerUpper} indicates positive market sentiment. The AI model detected optimistic language in financial reports and news coverage, suggesting favorable investor outlook, potential growth opportunities, or positive market reception. This analysis is based on actual news content from reliable financial sources.`;
        } else if (sentiment === 'negative') {
            summary = `Recent news analysis for ${tickerUpper} shows negative market sentiment. The AI model identified concerning language in financial reports and news coverage that might indicate investor concerns, market uncertainties, or potential challenges. This suggests caution may be warranted based on current news sentiment.`;
        } else {
            summary = `Recent news analysis for ${tickerUpper} reveals neutral market sentiment. The AI model found balanced language in financial reports and news coverage without strong directional bias, suggesting mixed investor opinions or a period of consolidation based on current news coverage.`;
        }

        return {
            sentiment,
            confidence: maxProb,
            summary,
            probabilities
        };
    };

    const handleSearch = async () => {
        devLog('handleSearch called with ticker:', ticker);

        if (!ticker.trim()) {
            setError('Please enter a ticker symbol');
            return;
        }

        setLoading(true);
        setError('');
        setSentimentData(null);
        setShouldFetchResults(true);

        devLog('Starting news-based analysis for ticker:', ticker);

        try {
            // Step 1: Fetch recent news about the stock
            devLog('Fetching recent news...');
            const companyName = getCompanyName(ticker);
            const newsResult = await fetchStockNews(ticker, companyName);

            if (!newsResult.success) {
                throw new Error(newsResult.error || 'Failed to fetch news');
            }

            devLog('Found news articles, proceeding to sentiment analysis...');

            // Step 2: Analyze sentiment of the news content
            const API_URL = process.env.NODE_ENV === 'development'
                ? 'http://localhost:5000'
                : process.env.NEXT_PUBLIC_API_URL;

            devLog('Analyzing sentiment of news content...');
            devLog('News text preview:', newsResult.text.substring(0, 200) + '...');

            const response = await axios.post(`${API_URL}/api/analyze`, {
                text: newsResult.text
            }, {
                timeout: 15000,
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            if (response.data.predictions) {
                const processedResult = processApiResponse(response.data);
                
                // Add news metadata to the result
                processedResult.newsArticles = newsResult.articles;
                processedResult.newsText = newsResult.text;
                
                setSentimentData(processedResult);
                devLog('Analysis complete!');
            } else {
                throw new Error('No predictions received from API');
            }

        } catch (err: unknown) {
            console.error('Error in news-based sentiment analysis:', err);
            
            let errorMessage = 'Failed to analyze stock sentiment. Please try again.';

            if (err && typeof err === 'object') {
                if ('response' in err) {
                    const axiosError = err as { response?: { data?: { error?: string } }; message?: string };
                    if (axiosError.response?.data?.error) {
                        errorMessage = axiosError.response.data.error;
                    } else if (axiosError.message?.includes('timeout')) {
                        errorMessage = 'Request timed out. Please try again.';
                    } else if (axiosError.message?.includes('Network Error')) {
                        errorMessage = 'Network error. Please check your connection and try again.';
                    }
                } else if ('message' in err) {
                    const genericError = err as { message: string };
                    errorMessage = genericError.message;
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getSentimentColor = (sentiment: string) => {
        if (sentiment === 'positive') return '#22c55e';
        if (sentiment === 'negative') return '#ef4444';
        return '#f59e0b';
    };

    return (
        <div className="w-full">
            {/* main dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* left side - sentiment section with search */}
                <div className="lg:col-span-1 order-1">
                    <div className="min-h-[300px] lg:min-h-[600px] border border-gray-700 rounded-lg p-4 lg:p-6 bg-neutral-800 flex flex-col">
                        <div className="mb-4 lg:mb-6">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <TickerSearchInput
                                        value={ticker}
                                        onChange={(value) => {
                                            setTicker(value);
                                            setShouldFetchResults(false);
                                        }}
                                        onSearch={handleSearch}
                                        loading={loading}
                                        placeholder="ticker symbol or name"
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    disabled={loading || !ticker.trim()}
                                    className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors whitespace-nowrap text-sm w-full sm:w-auto"
                                >
                                    {loading ? 'Analyzing...' : 'Analyze'}
                                </button>
                            </div>

                            {error && (
                                <div className="mt-3 p-3 bg-red-900/50 border border-red-600 rounded-lg">
                                    <p className="text-red-200 text-sm">{error}</p>
                                </div>
                            )}

                            {/* search tips */}
                            <div className="mt-2 text-xs text-gray-400">
                                Try searching by company name or symbol
                            </div>
                        </div>

                        <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6 flex-shrink-0">sentiment</h2>

                        <div className="flex-1">
                            {sentimentData ? (
                                <div className="space-y-4 lg:space-y-6">
                                    {/* sentiment */}
                                    <div
                                        className="text-center p-4 lg:p-6 rounded-lg text-white font-bold text-lg lg:text-2xl"
                                        style={{ backgroundColor: getSentimentColor(sentimentData.sentiment) }}
                                    >
                                        {sentimentData.sentiment.toUpperCase()}
                                        <div className="text-sm lg:text-base font-normal mt-2">
                                            {(sentimentData.confidence * 100).toFixed(1)}% confidence
                                        </div>
                                    </div>

                                    {/* probability */}
                                    {sentimentData.probabilities && (
                                        <div className="space-y-2 lg:space-y-3">
                                            <h4 className="text-white text-sm lg:text-base font-medium">Breakdown:</h4>
                                            {Object.entries(sentimentData.probabilities).map(([sentiment, value]) => (
                                                <div key={sentiment} className="flex justify-between text-xs lg:text-sm">
                                                    <span className="capitalize text-gray-300">{sentiment}:</span>
                                                    <span className="text-white font-medium">{(value * 100).toFixed(1)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* ai generated text summary */}
                                    <div>
                                        <h3 className="text-white font-medium mb-2 lg:mb-3 text-base lg:text-lg">text summary</h3>
                                        <div className="text-xs lg:text-sm text-gray-300 leading-relaxed">
                                            <span className="text-blue-400 font-medium">AI gen:</span>
                                            <p className="mt-2">{sentimentData.summary}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center flex-1 text-gray-500">
                                    <div className="text-center">
                                        <p className="mb-3 text-sm lg:text-base">Enter a ticker symbol to analyze sentiment</p>
                                        <div className="text-xs lg:text-sm space-y-1">
                                            <p>• AI-powered analysis</p>
                                            <p>• Real-time processing</p>
                                            <p>• Market sentiment insights</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* right side - charts grid */}
                <div className="lg:col-span-3 order-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* chart components */}
                        <EarningsChart ticker={ticker} shouldFetch={shouldFetchResults} />
                        <DividendsChart ticker={ticker} shouldFetch={shouldFetchResults} />
                        <CashFlowChart ticker={ticker} shouldFetch={shouldFetchResults} />
                        <IncomeStatementChart ticker={ticker} shouldFetch={shouldFetchResults} />
                    </div>
                </div>
            </div>
        </div>
    );
}
 