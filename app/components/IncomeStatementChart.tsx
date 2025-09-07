'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, BarChart3, AlertCircle, LineChart } from 'lucide-react';
import FloatingCard from './ui/floating-card';

interface IncomeData {
    year: string;
    totalRevenue: number;
    netIncome: number;
    operatingIncome: number;
    grossProfit: number;
    operatingExpenses: number;
}

interface IncomeStatementChartProps {
    ticker: string;
    shouldFetch: boolean;
}

export default function IncomeStatementChart({ ticker, shouldFetch }: IncomeStatementChartProps) {
    const [incomeData, setIncomeData] = useState<IncomeData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const fetchIncomeStatementData = async () => {
        if (!ticker) return;

        setLoading(true);
        setError('');

        try {
            const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

            if (!API_KEY) {
                throw new Error('Alpha Vantage API key not configured. Please add NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY to your .env.local file.');
            }

            const url = `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${API_KEY}`;

            const response = await axios.get(url);

            if (response.data['Error Message']) {
                throw new Error(response.data['Error Message']);
            }

            const annualReports = response.data.annualReports || [];

            if (annualReports.length === 0) {
                throw new Error('No income statement data available for this ticker');
            }

            const processedData: IncomeData[] = annualReports
                .slice(0, 10)
                .map((report: any) => {
                    const year = report.fiscalDateEnding.substring(0, 4);
                    const totalRevenue = parseFloat(report.totalRevenue) || 0;
                    const netIncome = parseFloat(report.netIncome) || 0;
                    const operatingIncome = parseFloat(report.operatingIncome) || 0;
                    const grossProfit = parseFloat(report.grossProfit) || 0;
                    const operatingExpenses = parseFloat(report.operatingExpenses) || 0;

                    return {
                        year,
                        totalRevenue: totalRevenue / 1000000000,
                        netIncome: netIncome / 1000000000,
                        operatingIncome: operatingIncome / 1000000000,
                        grossProfit: grossProfit / 1000000000,
                        operatingExpenses: operatingExpenses / 1000000000
                    };
                })
                .sort((a: any, b: any) => parseInt(a.year) - parseInt(b.year));

            setIncomeData(processedData);

        } catch (err: any) {
            console.error('Error fetching income statement data:', err);
            setError(err.message || 'Failed to fetch income statement data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (shouldFetch && ticker && ticker.length >= 3 && !ticker.includes(' ')) {
            fetchIncomeStatementData();
        }
    }, [ticker, shouldFetch]);

    const getChartOption = () => {
        if (incomeData.length === 0) return {};

        const years = incomeData.map(data => data.year);
        const totalRevenue = incomeData.map(data => data.totalRevenue);
        const netIncome = incomeData.map(data => data.netIncome);
        const operatingIncome = incomeData.map(data => data.operatingIncome);
        const grossProfit = incomeData.map(data => data.grossProfit);

        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

        return {
            title: {
                text: `${ticker.toUpperCase()} Income Statement`,
                subtext: 'Revenue, Profit & Operating Performance ($ Billions)',
                left: 'center',
                top: '2%',
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
            legend: {
                data: ['Total Revenue', 'Gross Profit', 'Operating Income', 'Net Income'],
                top: isMobile ? '22%' : '18%',
                left: 'center',
                orient: 'horizontal',
                itemGap: isMobile ? 6 : 12,
                textStyle: {
                    color: '#9ca3af',
                    fontSize: isMobile ? 8 : 11
                },
                itemWidth: isMobile ? 10 : 16,
                itemHeight: isMobile ? 6 : 10
            },
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
                    const data = incomeData[dataIndex];

                    const grossMargin = data.totalRevenue > 0 ? (data.grossProfit / data.totalRevenue * 100) : 0;
                    const operatingMargin = data.totalRevenue > 0 ? (data.operatingIncome / data.totalRevenue * 100) : 0;
                    const netMargin = data.totalRevenue > 0 ? (data.netIncome / data.totalRevenue * 100) : 0;

                    return `
                        <div style="padding: 8px;">
                            <div style="font-weight: bold; margin-bottom: 4px;">${data.year}</div>
                            <div>Revenue: <span style="color: #3b82f6;">$${data.totalRevenue.toFixed(1)}B</span></div>
                            <div>Gross Profit: <span style="color: #22c55e;">$${data.grossProfit.toFixed(1)}B</span> (${grossMargin.toFixed(1)}%)</div>
                            <div>Operating Income: <span style="color: #f59e0b;">$${data.operatingIncome.toFixed(1)}B</span> (${operatingMargin.toFixed(1)}%)</div>
                            <div>Net Income: <span style="color: #ef4444;">$${data.netIncome.toFixed(1)}B</span> (${netMargin.toFixed(1)}%)</div>
                            <div>Operating Expenses: <span style="color: #9ca3af;">$${data.operatingExpenses.toFixed(1)}B</span></div>
                        </div>
                    `;
                }
            },
            grid: {
                left: isMobile ? '8%' : '5%',
                right: isMobile ? '8%' : '5%',
                bottom: isMobile ? '8%' : '5%',
                top: isMobile ? '42%' : '37%',
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
                name: 'Amount ($ Billions)',
                nameTextStyle: {
                    color: '#d1d5db',
                    fontSize: isMobile ? 11 : 13,
                    fontWeight: 500
                },
                axisLabel: {
                    color: '#e5e7eb',
                    formatter: '${value}B',
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
                    name: 'Total Revenue',
                    type: 'line',
                    data: totalRevenue,
                    smooth: true,
                    lineStyle: {
                        color: '#3b82f6',
                        width: isMobile ? 3 : 4
                    },
                    itemStyle: {
                        color: '#3b82f6'
                    },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
                            ]
                        }
                    }
                },
                {
                    name: 'Gross Profit',
                    type: 'line',
                    data: grossProfit,
                    smooth: true,
                    lineStyle: {
                        color: '#22c55e',
                        width: isMobile ? 2 : 3
                    },
                    itemStyle: {
                        color: '#22c55e'
                    }
                },
                {
                    name: 'Operating Income',
                    type: 'line',
                    data: operatingIncome,
                    smooth: true,
                    lineStyle: {
                        color: '#f59e0b',
                        width: isMobile ? 2 : 3
                    },
                    itemStyle: {
                        color: '#f59e0b'
                    }
                },
                {
                    name: 'Net Income',
                    type: 'line',
                    data: netIncome,
                    smooth: true,
                    lineStyle: {
                        color: '#ef4444',
                        width: 2,
                        type: 'dashed'
                    },
                    itemStyle: {
                        color: '#ef4444'
                    }
                }
            ]
        };
    };

    if (loading) {
        return (
            <FloatingCard className="h-full min-h-[350px] lg:min-h-[450px]">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <LineChart className="h-5 w-5 text-blue-400" />
                        <CardTitle className="text-lg font-bold text-white">Income Statement</CardTitle>
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
            <FloatingCard className="h-full min-h-[350px] lg:min-h-[450px]">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <LineChart className="h-5 w-5 text-blue-400" />
                        <CardTitle className="text-lg font-bold text-white">Income Statement</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </CardContent>
            </FloatingCard>
        );
    }

    if (incomeData.length === 0) {
        return (
            <FloatingCard className="h-full min-h-[350px] lg:min-h-[450px]">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <LineChart className="h-5 w-5 text-blue-400" />
                        <CardTitle className="text-lg font-bold text-white">Income Statement</CardTitle>
                    </div>
                    <CardDescription className="text-gray-300">
                        Enter a ticker symbol to view revenue and profit data
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Ready to analyze income statement</p>
                    </div>
                </CardContent>
            </FloatingCard>
        );
    }

    const latestData = incomeData[incomeData.length - 1];
    const avgRevenue = incomeData.reduce((sum, data) => sum + data.totalRevenue, 0) / incomeData.length;
    const profitMargin = (latestData.netIncome / latestData.totalRevenue) * 100;

    return (
        <FloatingCard className="flex flex-col h-full min-h-[350px] lg:min-h-[450px]">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <LineChart className="h-5 w-5 text-blue-400" />
                        <CardTitle className="text-lg font-bold text-white">Income Statement</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        ${latestData.totalRevenue.toFixed(1)}B Revenue
                    </Badge>
                </div>
                <CardDescription className="text-gray-300">
                    Revenue, Profit & Operating Performance ($ Billions)
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col h-full space-y-4">
                {/* echarts line chart */}
                <div className="flex-1 min-h-[200px] w-full">
                    <ReactECharts
                        option={getChartOption()}
                        style={{ height: '100%', width: '100%' }}
                        theme="dark"
                        opts={{ renderer: 'svg' }}
                    />
                </div>

                {/* summary stats */}
                {incomeData.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Card className="bg-neutral-700/50 border-neutral-600">
                            <CardContent className="p-3 text-center">
                                <div className="text-xs text-gray-300 mb-1 font-medium">Latest Revenue</div>
                                <div className="text-sm font-bold text-blue-300">${latestData.totalRevenue.toFixed(1)}B</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral-700/50 border-neutral-600">
                            <CardContent className="p-3 text-center">
                                <div className="text-xs text-gray-300 mb-1 font-medium">Latest Net Income</div>
                                <div className="text-sm font-bold text-green-300">${latestData.netIncome.toFixed(1)}B</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral-700/50 border-neutral-600">
                            <CardContent className="p-3 text-center">
                                <div className="text-xs text-gray-300 mb-1 font-medium">Net Margin</div>
                                <div className={`text-sm font-bold ${profitMargin > 0 ? 'text-green-300' : 'text-red-300'}`}>
                                    {profitMargin.toFixed(1)}%
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral-700/50 border-neutral-600">
                            <CardContent className="p-3 text-center">
                                <div className="text-xs text-gray-300 mb-1 font-medium">Revenue Growth</div>
                                <div className="text-sm font-bold text-white">
                                    {incomeData.length >= 2 ?
                                        (((latestData.totalRevenue - incomeData[incomeData.length - 2].totalRevenue) / incomeData[incomeData.length - 2].totalRevenue) * 100).toFixed(1) + '%'
                                        : 'N/A'
                                    }
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* legend */}
                <div className="flex justify-center gap-4 text-xs flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="text-gray-300 font-medium">Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="text-gray-300 font-medium">Gross Profit</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded"></div>
                        <span className="text-gray-300 font-medium">Operating Income</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span className="text-gray-300 font-medium">Net Income</span>
                    </div>
                </div>
            </CardContent>
        </FloatingCard>
    );
}