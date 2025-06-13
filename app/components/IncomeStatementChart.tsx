'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';

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

        return {
            title: {
                text: `${ticker.toUpperCase()} Income Statement`,
                subtext: 'Revenue, Profit & Operating Performance ($ Billions)',
                left: 'center',
                textStyle: {
                    color: '#ffffff',
                    fontSize: 18,
                    fontWeight: 'bold'
                },
                subtextStyle: {
                    color: '#9ca3af',
                    fontSize: 12
                }
            },
            backgroundColor: 'transparent',
            legend: {
                data: ['Total Revenue', 'Gross Profit', 'Operating Income', 'Net Income'],
                top: '12%',
                textStyle: {
                    color: '#9ca3af'
                }
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: '#374151',
                textStyle: {
                    color: '#ffffff'
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
                left: '5%',
                right: '5%',
                bottom: '2%',
                top: '20%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: years,
                axisLabel: {
                    color: '#9ca3af'
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
                    color: '#9ca3af'
                },
                axisLabel: {
                    color: '#9ca3af',
                    formatter: '${value}B'
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
                        width: 4
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
                        width: 3
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
                        width: 3
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
            <div className="border border-gray-700 rounded-lg p-8 bg-neutral-800 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading income statement data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="border border-gray-700 rounded-lg p-8 bg-neutral-800 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <p className="text-red-400 mb-2">Error loading income statement data</p>
                    <p className="text-gray-500 text-sm">{error}</p>
                    <button
                        onClick={fetchIncomeStatementData}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (incomeData.length === 0) {
        return (
            <div className="border border-gray-700 rounded-lg p-8 bg-neutral-800 min-h-[400px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">💰</div>
                    <p className="text-xl font-medium text-white mb-2">Income Statement</p>
                    <p className="text-base">Enter a ticker symbol to view revenue & profit</p>
                </div>
            </div>
        );
    }

    return (
        <div className="border border-gray-700 rounded-lg p-6 bg-neutral-800 h-full flex flex-col">
            {/* echarts line chart */}
            <div className="flex-1 min-h-0 mb-1">
                <ReactECharts
                    option={getChartOption()}
                    style={{ height: '100%', width: '100%' }}
                    theme="dark"
                />
            </div>

            {/* summary stats */}
            <div className="h-14 mb-1">
                {incomeData.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center h-full">
                        <div className="bg-neutral-900 rounded p-2 flex flex-col justify-center">
                            <div className="text-xs text-gray-400">Latest Revenue</div>
                            <div className="text-sm font-semibold text-white">
                                ${incomeData[incomeData.length - 1].totalRevenue.toFixed(1)}B
                            </div>
                        </div>
                        <div className="bg-neutral-900 rounded p-2 flex flex-col justify-center">
                            <div className="text-xs text-gray-400">Latest Net Income</div>
                            <div className="text-sm font-semibold text-white">
                                ${incomeData[incomeData.length - 1].netIncome.toFixed(1)}B
                            </div>
                        </div>
                        <div className="bg-neutral-900 rounded p-2 flex flex-col justify-center">
                            <div className="text-xs text-gray-400">Net Margin</div>
                            <div className="text-sm font-semibold text-white">
                                {((incomeData[incomeData.length - 1].netIncome / incomeData[incomeData.length - 1].totalRevenue) * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div className="bg-neutral-900 rounded p-2 flex flex-col justify-center">
                            <div className="text-xs text-gray-400">Revenue Growth</div>
                            <div className="text-sm font-semibold text-white">
                                {incomeData.length >= 2 ?
                                    (((incomeData[incomeData.length - 1].totalRevenue - incomeData[incomeData.length - 2].totalRevenue) / incomeData[incomeData.length - 2].totalRevenue) * 100).toFixed(1) + '%'
                                    : 'N/A'
                                }
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* legend */}
            <div className="h-5 flex justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-400">Revenue</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-400">Gross Profit</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-amber-500 rounded"></div>
                    <span className="text-gray-400">Operating Income</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-gray-400">Net Income</span>
                </div>
            </div>
        </div>
    );
}