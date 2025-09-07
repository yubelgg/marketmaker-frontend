'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import FloatingCard from './ui/floating-card';

interface EarningsData {
    fiscalDateEnding: string;
    reportedDate: string;
    reportedEPS: string;
    estimatedEPS: string;
    surprise: string;
    surprisePercentage: string;
}

interface EarningsChartProps {
    ticker: string;
    shouldFetch: boolean;
}

export default function EarningsChart({ ticker, shouldFetch }: EarningsChartProps) {
    const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const fetchEarningsData = async () => {
        if (!ticker) return;

        setLoading(true);
        setError('');

        try {
            const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

            if (!API_KEY) {
                throw new Error('Alpha Vantage API key not configured. Please add NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY to your .env.local file.');
            }

            const url = `https://www.alphavantage.co/query?function=EARNINGS&symbol=${ticker}&apikey=${API_KEY}`;

            const response = await axios.get(url);

            if (response.data['Error Message']) {
                throw new Error(response.data['Error Message']);
            }

            const annualEarnings = response.data.annualEarnings || [];

            if (annualEarnings.length === 0) {
                throw new Error('No earnings data available for this ticker');
            }

            const recentEarnings = annualEarnings.slice(0, 10).reverse();

            setEarningsData(recentEarnings);

        } catch (err: any) {
            console.error('Error fetching earnings data:', err);
            setError(err.message || 'Failed to fetch earnings data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // fetch when user pressed enter or clicked suggestion
        if (shouldFetch && ticker && ticker.length >= 3 && !ticker.includes(' ')) {
            fetchEarningsData();
        }
    }, [ticker, shouldFetch]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.getFullYear().toString();
    };

    // prepare data for echarts
    const getChartOption = () => {
        if (earningsData.length === 0) return {};

        const categories = earningsData.map(data => formatDate(data.fiscalDateEnding));
        const reportedEPS = earningsData.map(data => parseFloat(data.reportedEPS) || 0);

        // create color array based on performance using consistent colors
        const colors = earningsData.map((data, index) => {
            const reported = parseFloat(data.reportedEPS) || 0;

            if (reported < 0) return '#ef4444';

            // compare with previous year for growth
            if (index > 0) {
                const previousEPS = parseFloat(earningsData[index - 1].reportedEPS) || 0;
                if (reported > previousEPS) return '#22c55e';
                else return '#f59e0b';
            }

            return '#3b82f6';
        });

        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

        return {
            title: {
                text: `${ticker.toUpperCase()} Earnings History`,
                subtext: 'Annual EPS Performance',
                left: 'center',
                textStyle: {
                    color: '#ffffff',
                    fontSize: isMobile ? 16 : 20,
                    fontWeight: 'bold'
                },
                subtextStyle: {
                    color: '#f3f4f6',
                    fontSize: isMobile ? 12 : 14,
                    fontWeight: 500
                }
            },
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: '#374151',
                textStyle: {
                    color: '#ffffff',
                    fontSize: isMobile ? 11 : 12
                },
                formatter: function (params: any) {
                    const dataIndex = params[0].dataIndex;
                    const data = earningsData[dataIndex];
                    const currentEPS = parseFloat(data.reportedEPS) || 0;
                    let growthInfo = '';

                    if (dataIndex > 0) {
                        const previousEPS = parseFloat(earningsData[dataIndex - 1].reportedEPS) || 0;
                        const growth = previousEPS !== 0 ? ((currentEPS - previousEPS) / Math.abs(previousEPS) * 100) : 0;
                        const growthColor = growth >= 0 ? '#22c55e' : '#ef4444';
                        growthInfo = `<div>YoY Growth: <span style="color: ${growthColor};">${growth > 0 ? '+' : ''}${growth.toFixed(1)}%</span></div>`;
                    }

                    return `
                        <div style="padding: 8px;">
                            <div style="font-weight: bold; margin-bottom: 4px;">${formatDate(data.fiscalDateEnding)}</div>
                            <div>Annual EPS: <span style="color: #22c55e;">$${data.reportedEPS}</span></div>
                            ${growthInfo}
                        </div>
                    `;
                }
            },
            grid: {
                left: isMobile ? '8%' : '5%',
                right: isMobile ? '8%' : '5%',
                bottom: isMobile ? '5%' : '2%',
                top: isMobile ? '25%' : '20%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: categories,
                axisLabel: {
                    color: '#9ca3af',
                    rotate: 0,
                    fontSize: isMobile ? 10 : 12
                },
                axisLine: {
                    lineStyle: {
                        color: '#374151'
                    }
                }
            },
            yAxis: {
                type: 'value',
                name: 'EPS ($)',
                nameTextStyle: {
                    color: '#d1d5db',
                    fontSize: isMobile ? 11 : 13,
                    fontWeight: 500
                },
                axisLabel: {
                    color: '#e5e7eb',
                    formatter: '${value}',
                    fontSize: isMobile ? 11 : 13,
                    fontWeight: 500
                },
                axiosLine: {
                    lineStyle: {
                        color: '#374151'
                    }
                },
                splitLine: {
                    lineStyle: {
                        color: '#374151',
                        type: 'dashed'
                    }
                }
            },
            series: [
                {
                    name: 'Annual EPS',
                    type: 'bar',
                    data: reportedEPS.map((value, index) => ({
                        value: value,
                        itemStyle: {
                            color: colors[index]
                        }
                    })),
                    barWidth: isMobile ? '60%' : '50%'
                }
            ]
        };
    };

    if (loading) {
        return (
            <div className="border border-gray-700 rounded-lg p-4 lg:p-8 bg-neutral-800 min-h-[250px] lg:min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400 text-sm lg:text-base">Loading earnings data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="border border-gray-700 rounded-lg p-4 lg:p-8 bg-neutral-800 min-h-[250px] lg:min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-2xl lg:text-4xl mb-4">⚠️</div>
                    <p className="text-red-400 mb-2 text-sm lg:text-base">Error loading earnings data</p>
                    <p className="text-gray-500 text-xs lg:text-sm mb-4">{error}</p>
                    <button
                        onClick={fetchEarningsData}
                        className="px-3 py-2 lg:px-4 lg:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (earningsData.length === 0) {
        return (
            <FloatingCard className="flex flex-col h-full min-h-[350px] lg:min-h-[450px]">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-400" />
                        <CardTitle className="text-lg font-bold text-white">Earnings Per Share</CardTitle>
                    </div>
                    <CardDescription className="text-gray-300">
                        Enter a ticker symbol to view earnings data
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Ready to analyze earnings</p>
                    </div>
                </CardContent>
            </FloatingCard>
        );
    }

    const latestEPS = earningsData.length > 0 ? parseFloat(earningsData[earningsData.length - 1].reportedEPS) : 0;
    const yoyGrowth = earningsData.length >= 2 ? 
        (((parseFloat(earningsData[earningsData.length - 1].reportedEPS) - parseFloat(earningsData[earningsData.length - 2].reportedEPS)) / Math.abs(parseFloat(earningsData[earningsData.length - 2].reportedEPS)) * 100)) : 0;
    const avgEPS = earningsData.length > 0 ? earningsData.reduce((sum, data) => sum + parseFloat(data.reportedEPS || '0'), 0) / earningsData.length : 0;
    const growthYears = earningsData.filter((data, index) => {
        if (index === 0) return false;
        return parseFloat(data.reportedEPS || '0') > parseFloat(earningsData[index - 1].reportedEPS || '0');
    }).length;

    return (
        <FloatingCard className="flex flex-col h-full min-h-[350px] lg:min-h-[450px]">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-400" />
                        <CardTitle className="text-lg font-bold text-white">Earnings Per Share</CardTitle>
                    </div>
                    {latestEPS > 0 && (
                        <Badge variant={yoyGrowth > 0 ? "default" : yoyGrowth < 0 ? "destructive" : "secondary"} className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            ${latestEPS.toFixed(2)}
                        </Badge>
                    )}
                </div>
                <CardDescription className="text-gray-300">
                    Historical earnings per share with growth analysis
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col h-full space-y-4">
                {/* echarts bar chart */}
                <div className="flex-1 min-h-[200px] w-full">
                    <ReactECharts
                        option={getChartOption()}
                        style={{ height: '100%', width: '100%' }}
                        theme="dark"
                        opts={{ renderer: 'svg' }}
                    />
                </div>

                {/* summary stats */}
                {earningsData.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Card className="bg-neutral-700/50 border-neutral-600">
                            <CardContent className="p-3 text-center">
                                <div className="text-xs text-gray-300 mb-1 font-medium">Latest EPS</div>
                                <div className="text-sm font-bold text-white">${latestEPS.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral-700/50 border-neutral-600">
                            <CardContent className="p-3 text-center">
                                <div className="text-xs text-gray-300 mb-1 font-medium">YoY Growth</div>
                                <div className={`text-sm font-bold ${yoyGrowth > 0 ? 'text-green-300' : yoyGrowth < 0 ? 'text-red-300' : 'text-white'}`}>
                                    {earningsData.length >= 2 ? `${yoyGrowth.toFixed(1)}%` : 'N/A'}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral-700/50 border-neutral-600">
                            <CardContent className="p-3 text-center">
                                <div className="text-xs text-gray-300 mb-1 font-medium">Avg EPS</div>
                                <div className="text-sm font-bold text-white">${avgEPS.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral-700/50 border-neutral-600">
                            <CardContent className="p-3 text-center">
                                <div className="text-xs text-gray-300 mb-1 font-medium">Growth Years</div>
                                <div className="text-sm font-bold text-white">{growthYears}/{earningsData.length - 1}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* legend */}
                <div className="flex justify-center gap-4 text-xs flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="text-gray-300 font-medium">First Year</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="text-gray-300 font-medium">Growth</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-amber-500 rounded"></div>
                        <span className="text-gray-300 font-medium">Decline</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span className="text-gray-300 font-medium">Negative</span>
                    </div>
                </div>
            </CardContent>
        </FloatingCard>
    );
}
