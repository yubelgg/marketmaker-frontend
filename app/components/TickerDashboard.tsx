'use client';

import { useState } from 'react';
import axios from 'axios';
import EarningsChart from './EarningsChart';
import TickerSearchInput from './TickerSearchInput';
import DividendsChart from './DividendsChart';
import CashFlowChart from './CashFlowChart';
import IncomeStatementChart from './IncomeStatementChart';
import { fetchStockNews, getCompanyName } from '../utils/newsApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import FloatingCard from './ui/floating-card';

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
        if (sentiment === 'positive') return 'bg-green-500';
        if (sentiment === 'negative') return 'bg-red-500';
        return 'bg-yellow-500';
    };

    const getSentimentIcon = (sentiment: string) => {
        if (sentiment === 'positive') return <TrendingUp className="h-5 w-5" />;
        if (sentiment === 'negative') return <TrendingDown className="h-5 w-5" />;
        return <Minus className="h-5 w-5" />;
    };

    const getSentimentVariant = (sentiment: string) => {
        if (sentiment === 'positive') return 'default';
        if (sentiment === 'negative') return 'destructive';
        return 'secondary';
    };

    return (
        <div className="w-full space-y-6">
            {/* main dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* left side - sentiment section with search */}
                <div className="lg:col-span-1 order-1">
                    <FloatingCard className="min-h-[300px] lg:min-h-[600px]">
                        <CardHeader className="space-y-6">
                            {/* Search Section */}
                            <div className="space-y-4">
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
                                    <Button
                                        onClick={handleSearch}
                                        disabled={loading || !ticker.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Brain className="mr-2 h-4 w-4" />
                                                Analyze
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <p className="text-xs text-muted-foreground">
                                    Try searching by company name or symbol
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Brain className="h-5 w-5 text-blue-400" />
                                <CardTitle className="text-xl lg:text-2xl">AI Sentiment Analysis</CardTitle>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 space-y-6">
                            {sentimentData ? (
                                <div className="space-y-6">
                                    {/* Main Sentiment Display */}
                                    <div className="text-center space-y-4">
                                        <Badge 
                                            variant={getSentimentVariant(sentimentData.sentiment)}
                                            className={`${getSentimentColor(sentimentData.sentiment)} text-white px-6 py-3 text-lg font-bold rounded-xl`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {getSentimentIcon(sentimentData.sentiment)}
                                                {sentimentData.sentiment.toUpperCase()}
                                            </div>
                                        </Badge>
                                        
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground">Confidence Score</p>
                                            <Progress 
                                                value={sentimentData.confidence * 100} 
                                                className="w-full h-2"
                                            />
                                            <p className="text-sm font-medium">
                                                {(sentimentData.confidence * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>

                                    {/* Probability Breakdown */}
                                    {sentimentData.probabilities && (
                                        <Card className="bg-neutral-800/50 border-neutral-700">
                                            <CardHeader>
                                                <CardTitle className="text-sm">Probability Breakdown</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                {Object.entries(sentimentData.probabilities).map(([sentiment, value]) => (
                                                    <div key={sentiment} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {getSentimentIcon(sentiment)}
                                                            <span className="capitalize text-sm">{sentiment}</span>
                                                        </div>
                                                        <Badge variant="outline" className="text-xs">
                                                            {(value * 100).toFixed(1)}%
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* AI Summary */}
                                    <Card className="bg-neutral-800/50 border-neutral-700">
                                        <CardHeader>
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <Brain className="h-4 w-4 text-blue-400" />
                                                AI Summary
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {sentimentData.summary}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : (
                                <Card className="bg-neutral-800/30 border-neutral-700 border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                        <Brain className="h-12 w-12 text-gray-400 mb-4 opacity-50" />
                                        <CardTitle className="text-base font-bold text-white mb-2">Ready to Analyze</CardTitle>
                                        <CardDescription className="space-y-1 text-gray-300">
                                            <p>• AI-powered sentiment analysis</p>
                                            <p>• Real-time news processing</p>
                                            <p>• Market sentiment insights</p>
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            )}
                        </CardContent>
                    </FloatingCard>
                </div>

                {/* right side - charts grid */}
                <div className="lg:col-span-3 order-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
 