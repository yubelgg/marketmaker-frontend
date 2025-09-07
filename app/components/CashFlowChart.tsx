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

interface CashFlowData {
    year: string;
    operatingCashflow: number;
    capitalExpenditures: number;
    freeCashFlow: number;
    netIncome: number;
    dividendPayout: number;
}

interface CashFlowChartProps {
    ticker: string;
    shouldFetch: boolean;
}

export default function CashFlowChart({ ticker, shouldFetch }: CashFlowChartProps) {
    const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const fetchCashFlowData = async () => {
        if (!ticker) return;

        setLoading(true);
        setError('');

        try {
            const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

            if (!API_KEY) {
                throw new Error('Alpha Vantage API key not configured. Please add NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY to your .env.local file.');
            }

            const url = `https://www.alphavantage.co/query?function=CASH_FLOW&symbol=${ticker}&apikey=${API_KEY}`;

            const response = await axios.get(url);

            if (response.data['Error Message']) {
                throw new Error(response.data['Error Message']);
            }

            const annualReports = response.data.annualReports || [];

            if (annualReports.length === 0) {
                throw new Error('No cash flow data available for this ticker');
            }

            const processedData: CashFlowData[] = annualReports
                .slice(0, 10)
                .map((report: any) => {
                    const year = report.fiscalDateEnding.substring(0, 4);
                    const operatingCashflow = parseFloat(report.operatingCashflow) || 0;
                    const capitalExpenditures = Math.abs(parseFloat(report.capitalExpenditures) || 0);
                    const freeCashFlow = operatingCashflow - capitalExpenditures;
                    const netIncome = parseFloat(report.netIncome) || 0;
                    const dividendPayout = parseFloat(report.dividendPayout) || 0;

                    return {
                        year,
                        operatingCashflow: operatingCashflow / 1000000000,
                        capitalExpenditures: capitalExpenditures / 1000000000,
                        freeCashFlow: freeCashFlow / 1000000000,
                        netIncome: netIncome / 1000000000,
                        dividendPayout: dividendPayout / 1000000000
                    };
                })
                .sort((a: any, b: any) => parseInt(a.year) - parseInt(b.year));

            setCashFlowData(processedData);

        } catch (err: any) {
            console.error('Error fetching cash flow data:', err);
            setError(err.message || 'Failed to fetch cash flow data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (shouldFetch && ticker && ticker.length >= 3 && !ticker.includes(' ')) {
            fetchCashFlowData();
        }
    }, [ticker, shouldFetch]);

    const getChartOption = () => {
        if (cashFlowData.length === 0) return {};

        const years = cashFlowData.map(data => data.year);
        const operatingCashflow = cashFlowData.map(data => data.operatingCashflow);
        const freeCashFlow = cashFlowData.map(data => data.freeCashFlow);
        const netIncome = cashFlowData.map(data => data.netIncome);

        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

        return {
            title: {
                text: `${ticker.toUpperCase()} Cash Flow Analysis`,
                subtext: 'Operating, Free Cash Flow & Net Income ($ Billions)',
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
                data: ['Operating Cash Flow', 'Free Cash Flow', 'Net Income'],
                top: isMobile ? '22%' : '18%',
                left: 'center',
                orient: 'horizontal',
                itemGap: isMobile ? 8 : 15,
                textStyle: {
                    color: '#9ca3af',
                    fontSize: isMobile ? 9 : 12
                },
                itemWidth: isMobile ? 12 : 18,
                itemHeight: isMobile ? 8 : 12
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
                    const data = cashFlowData[dataIndex];

                    return `
                        <div style="padding: 8px;">
                            <div style="font-weight: bold; margin-bottom: 4px;">${data.year}</div>
                            <div>Operating CF: <span style="color: #3b82f6;">$${data.operatingCashflow.toFixed(1)}B</span></div>
                            <div>Free CF: <span style="color: #22c55e;">$${data.freeCashFlow.toFixed(1)}B</span></div>
                            <div>Net Income: <span style="color: #f59e0b;">$${data.netIncome.toFixed(1)}B</span></div>
                            <div>CapEx: <span style="color: #9ca3af;">$${data.capitalExpenditures.toFixed(1)}B</span></div>
                            <div>Dividends: <span style="color: #ef4444;">$${data.dividendPayout.toFixed(1)}B</span></div>
                        </div>
                    `;
                }
            },
            grid: {
                left: isMobile ? '8%' : '5%',
                right: isMobile ? '8%' : '5%',
                bottom: isMobile ? '8%' : '5%',
                top: isMobile ? '40%' : '35%',
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
                    name: 'Operating Cash Flow',
                    type: 'line',
                    data: operatingCashflow,
                    smooth: true,
                    lineStyle: {
                        color: '#3b82f6',
                        width: isMobile ? 2 : 3
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
                    name: 'Free Cash Flow',
                    type: 'line',
                    data: freeCashFlow,
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
                    name: 'Net Income',
                    type: 'line',
                    data: netIncome,
                    smooth: true,
                    lineStyle: {
                        color: '#f59e0b',
                        width: 2,
                        type: 'dashed'
                    },
                    itemStyle: {
                        color: '#f59e0b'
                    }
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
                        <CardTitle className="text-lg font-bold text-white">Cash Flow Analysis</CardTitle>
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
            <FloatingCard className="h-full min-h-[250px] lg:min-h-[400px]">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-blue-400" />
                        <CardTitle className="text-lg font-bold text-white">Cash Flow Analysis</CardTitle>
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

    if (cashFlowData.length === 0) {
        return (
            <FloatingCard className="h-full min-h-[250px] lg:min-h-[400px]">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-blue-400" />
                        <CardTitle className="text-lg font-bold text-white">Cash Flow Analysis</CardTitle>
                    </div>
                    <CardDescription className="text-gray-300">
                        Enter a ticker symbol to view operating and free cash flow data
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Ready to analyze cash flow</p>
                    </div>
                </CardContent>
            </FloatingCard>
        );
    }

    const latestData = cashFlowData[cashFlowData.length - 1];
    const avgFreeCF = cashFlowData.reduce((sum, data) => sum + data.freeCashFlow, 0) / cashFlowData.length;
    const fcfConversion = (latestData.freeCashFlow / latestData.netIncome) * 100;

    return (
        <FloatingCard className="flex flex-col h-full min-h-[350px] lg:min-h-[450px]">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-blue-400" />
                        <CardTitle className="text-lg font-bold text-white">Cash Flow Analysis</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        ${latestData.freeCashFlow.toFixed(1)}B FCF
                    </Badge>
                </div>
                <CardDescription className="text-gray-300">
                    Operating, Free Cash Flow & Net Income ($ Billions)
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
                {cashFlowData.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Card className="bg-neutral-700/50 border-neutral-600">
                            <CardContent className="p-3 text-center">
                                <div className="text-xs text-gray-300 mb-1 font-medium">Latest Operating CF</div>
                                <div className="text-sm font-bold text-white">${latestData.operatingCashflow.toFixed(1)}B</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral-700/50 border-neutral-600">
                            <CardContent className="p-3 text-center">
                                <div className="text-xs text-gray-300 mb-1 font-medium">Latest Free CF</div>
                                <div className="text-sm font-bold text-green-300">${latestData.freeCashFlow.toFixed(1)}B</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral-700/50 border-neutral-600">
                            <CardContent className="p-3 text-center">
                                <div className="text-xs text-gray-300 mb-1 font-medium">Avg Free CF</div>
                                <div className="text-sm font-bold text-white">${avgFreeCF.toFixed(1)}B</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral-700/50 border-neutral-600">
                            <CardContent className="p-3 text-center">
                                <div className="text-xs text-gray-300 mb-1 font-medium">FCF Conversion</div>
                                <div className="text-sm font-bold text-white">{fcfConversion.toFixed(0)}%</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* legend */}
                <div className="flex justify-center gap-4 text-xs flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="text-gray-300 font-medium">Operating CF</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="text-gray-300 font-medium">Free CF</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span className="text-gray-300 font-medium">Net Income</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-amber-500 rounded"></div>
                        <span className="text-gray-300 font-medium">Dividend Payout</span>
                    </div>
                </div>
            </CardContent>
        </FloatingCard>
    );
}