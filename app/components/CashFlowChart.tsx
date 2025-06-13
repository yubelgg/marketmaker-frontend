'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';

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

        return {
            title: {
                text: `${ticker.toUpperCase()} Cash Flow Analysis`,
                subtext: 'Operating, Free Cash Flow & Net Income ($ Billions)',
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
                data: ['Operating Cash Flow', 'Free Cash Flow', 'Net Income'],
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
                    name: 'Operating Cash Flow',
                    type: 'line',
                    data: operatingCashflow,
                    smooth: true,
                    lineStyle: {
                        color: '#3b82f6',
                        width: 3
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
                        width: 3
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
            <div className="border border-gray-700 rounded-lg p-8 bg-neutral-800 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading cash flow data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="border border-gray-700 rounded-lg p-8 bg-neutral-800 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <p className="text-red-400 mb-2">Error loading cash flow data</p>
                    <p className="text-gray-500 text-sm">{error}</p>
                    <button
                        onClick={fetchCashFlowData}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (cashFlowData.length === 0) {
        return (
            <div className="border border-gray-700 rounded-lg p-8 bg-neutral-800 min-h-[400px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">💸</div>
                    <p className="text-xl font-medium text-white mb-2">Cash Flow Analysis</p>
                    <p className="text-base">Enter a ticker symbol to view cash flow</p>
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
                {cashFlowData.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center h-full">
                        <div className="bg-neutral-900 rounded p-2 flex flex-col justify-center">
                            <div className="text-xs text-gray-400">Latest Operating CF</div>
                            <div className="text-sm font-semibold text-white">
                                ${cashFlowData[cashFlowData.length - 1].operatingCashflow.toFixed(1)}B
                            </div>
                        </div>
                        <div className="bg-neutral-900 rounded p-2 flex flex-col justify-center">
                            <div className="text-xs text-gray-400">Latest Free CF</div>
                            <div className="text-sm font-semibold text-white">
                                ${cashFlowData[cashFlowData.length - 1].freeCashFlow.toFixed(1)}B
                            </div>
                        </div>
                        <div className="bg-neutral-900 rounded p-2 flex flex-col justify-center">
                            <div className="text-xs text-gray-400">Avg Free CF</div>
                            <div className="text-sm font-semibold text-white">
                                ${(cashFlowData.reduce((sum, data) => sum + data.freeCashFlow, 0) / cashFlowData.length).toFixed(1)}B
                            </div>
                        </div>
                        <div className="bg-neutral-900 rounded p-2 flex flex-col justify-center">
                            <div className="text-xs text-gray-400">FCF Conversion</div>
                            <div className="text-sm font-semibold text-white">
                                {((cashFlowData[cashFlowData.length - 1].freeCashFlow / cashFlowData[cashFlowData.length - 1].netIncome) * 100).toFixed(0)}%
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* legend */}
            <div className="h-5 flex justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-400">Operating CF</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-400">Free CF</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-amber-500 rounded"></div>
                    <span className="text-gray-400">Net Income</span>
                </div>
            </div>
        </div>
    );
}