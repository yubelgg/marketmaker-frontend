'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, BarChart3, AlertCircle, DollarSign } from 'lucide-react';
import FloatingCard from './ui/floating-card';

interface DividendData {
    date: string;
    dividend: string;
}

interface YearlyDividend {
    year: string;
    totalDividend: number;
    quarterlyDividends: DividendData[];
}

interface DividendsChartProps {
    ticker: string;
    shouldFetch: boolean;
}

export default function DividendsChart({ ticker, shouldFetch }: DividendsChartProps) {
    const [dividendsData, setDividendsData] = useState<YearlyDividend[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const fetchDividendsData = async () => {
        if (!ticker) return;

        setLoading(true);
        setError('');

        try {
            const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

            if (!API_KEY) {
                throw new Error('Alpha Vantage API key not configured. Please add NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY to your .env.local file.');
            }

            const url = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${ticker}&apikey=${API_KEY}`;

            const response = await axios.get(url);

            if (response.data['Error Message']) {
                throw new Error(response.data['Error Message']);
            }

            const monthlyData = response.data['Monthly Adjusted Time Series'] || {};

            const dividendPayments: DividendData[] = [];

            Object.entries(monthlyData).forEach(([date, data]: [string, any]) => {
                const dividend = parseFloat(data['7. dividend amount']);
                if (dividend && dividend > 0) {
                    dividendPayments.push({
                        date: date,
                        dividend: dividend.toString()
                    });
                }
            });

            const yearlyDividends: { [year: string]: YearlyDividend } = {};

            dividendPayments.forEach(payment => {
                const year = payment.date.substring(0, 4);

                if (!yearlyDividends[year]) {
                    yearlyDividends[year] = {
                        year: year,
                        totalDividend: 0,
                        quarterlyDividends: []
                    };
                }

                yearlyDividends[year].totalDividend += parseFloat(payment.dividend);
                yearlyDividends[year].quarterlyDividends.push(payment);
            });

            const sortedYearlyDividends = Object.values(yearlyDividends)
                .sort((a, b) => parseInt(b.year) - parseInt(a.year))
                .slice(0, 10)
                .reverse();

            if (sortedYearlyDividends.length === 0) {
                throw new Error('No dividends data available for this ticker');
            }

            setDividendsData(sortedYearlyDividends);

        } catch (err: any) {
            console.error('Error fetching dividends data:', err);
            setError(err.message || 'Failed to fetch dividends data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // fetch when user pressed Enter or clicked suggestion
        if (shouldFetch && ticker && ticker.length >= 3 && !ticker.includes(' ')) {
            fetchDividendsData();
        }
    }, [ticker, shouldFetch]);

    // echarts chart options
    const getChartOption = () => {
        if (dividendsData.length === 0) return {};

        const years = dividendsData.map(data => data.year);
        const dividendAmounts = dividendsData.map(data => data.totalDividend);

        const colors = dividendAmounts.map((amount, index) => {
            if (index === 0) return '#3b82f6';
            const previousAmount = dividendAmounts[index - 1];
            if (amount > previousAmount) return '#22c55e';
            if (amount < previousAmount) return '#f59e0b';
            return '#ef4444';
        });

        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

        return {
            title: {
                text: `${ticker.toUpperCase()} Annual Dividends`,
                subtext: 'Yearly dividend payments per share',
                left: 'center',
                textStyle: {
                    color: '#ffffff',
                    fontSize: isMobile ? 14 : 18,
                    fontWeight: 'bold'
                },
                subtextStyle: {
                    color: '#9ca3af',
                    fontSize: isMobile ? 10 : 12
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
                    const data = dividendsData[dataIndex];
                    const currentAmount = data.totalDividend;
                    const previousAmount = dataIndex > 0 ? dividendsData[dataIndex - 1].totalDividend : null;

                    let growthText = '';
                    if (previousAmount !== null) {
                        const growthRate = ((currentAmount - previousAmount) / previousAmount) * 100;
                        const growthColor = growthRate >= 0 ? '#22c55e' : '#ef4444';
                        growthText = `<div>Growth: <span style="color: ${growthColor};">${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}%</span></div>`;
                    }

                    return `
                        <div style="padding: 8px;">
                            <div style="font-weight: bold; margin-bottom: 4px;">${data.year}</div>
                            <div>Annual Dividend: <span style="color: #22c55e;">$${currentAmount.toFixed(2)}</span></div>
                            <div>Payments: <span style="color: #9ca3af;">${data.quarterlyDividends.length} times</span></div>
                            ${growthText}
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
                data: years,
                axisLabel: {
                    color: '#e5e7eb',
                    fontSize: isMobile ? 11 : 13,
                    fontWeight: 500
                },
                axisLine: {
                    lineStyle: {
                        color: '#374151'
                    }
                }
            },
            yAxis: {
                type: 'value',
                name: 'Dividend ($)',
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
                axisLine: {
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
                    name: 'Annual Dividend',
                    type: 'bar',
                    data: dividendAmounts.map((value, index) => ({
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
            <FloatingCard className="h-full min-h-[250px] lg:min-h-[400px]">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-blue-400" />
                        <CardTitle className="text-lg font-bold text-white">Annual Dividends</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                </CardContent>
            </FloatingCard>
        );
    }

    if (error) {
        return (
            <div className="border border-gray-700 rounded-lg p-4 lg:p-8 bg-neutral-800 min-h-[250px] lg:min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-2xl lg:text-4xl mb-4">⚠️</div>
                    <p className="text-red-400 mb-2 text-sm lg:text-base">Error loading dividends data</p>
                    <p className="text-gray-500 text-xs lg:text-sm mb-4">{error}</p>
                    <button
                        onClick={fetchDividendsData}
                        className="px-3 py-2 lg:px-4 lg:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (dividendsData.length === 0) {
        return (
            <FloatingCard className="flex flex-col h-full min-h-[350px] lg:min-h-[450px]">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-400" />
                        <CardTitle className="text-lg font-bold text-white">Annual Dividends</CardTitle>
                    </div>
                    <CardDescription className="text-gray-300">
                        Enter a ticker symbol to view dividend data
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Ready to analyze dividends</p>
                    </div>
                </CardContent>
            </FloatingCard>
        );
    }

    const latestDividend = dividendsData.length > 0 ? dividendsData[dividendsData.length - 1].totalDividend : 0;
    const avgDividend = dividendsData.length > 0 ? dividendsData.slice(-5).reduce((sum, data) => sum + data.totalDividend, 0) / Math.min(5, dividendsData.length) : 0;
    const growthYears = dividendsData.filter((data, index) => {
        if (index === 0) return false;
        return data.totalDividend > dividendsData[index - 1].totalDividend;
    }).length;

    return (
        <FloatingCard className="flex flex-col h-full min-h-[350px] lg:min-h-[450px]">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-blue-400" />
                        <CardTitle className="text-lg font-bold text-white">Annual Dividends</CardTitle>
                    </div>
                    {latestDividend > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            ${latestDividend.toFixed(2)}
                        </Badge>
                    )}
                </div>
                <CardDescription className="text-gray-300">
                    Yearly dividend payments per share
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
                {dividendsData.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Card className="bg-neutral-700/50 border-neutral-600">
                            <CardContent className="p-3 text-center">
                                <div className="text-xs text-gray-300 mb-1 font-medium">Latest Year</div>
                                <div className="text-sm font-bold text-white">${latestDividend.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral-700/50 border-neutral-600">
                            <CardContent className="p-3 text-center">
                                <div className="text-xs text-gray-300 mb-1 font-medium">5-Yr Avg</div>
                                <div className="text-sm font-bold text-white">${avgDividend.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral-700/50 border-neutral-600">
                            <CardContent className="p-3 text-center">
                                <div className="text-xs text-gray-300 mb-1 font-medium">Growth Years</div>
                                <div className="text-sm font-bold text-white">{growthYears}/{dividendsData.length - 1}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral-700/50 border-neutral-600">
                            <CardContent className="p-3 text-center">
                                <div className="text-xs text-gray-300 mb-1 font-medium">Total Years</div>
                                <div className="text-sm font-bold text-white">{dividendsData.length}</div>
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
                        <span className="text-gray-300 font-medium">No Change</span>
                    </div>
                </div>
            </CardContent>
        </FloatingCard>
    );
}
