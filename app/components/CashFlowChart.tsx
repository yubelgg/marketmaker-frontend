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
                    color: '#9ca3af',
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
                name: 'Amount ($ Billions)',
                nameTextStyle: {
                    color: '#9ca3af',
                    fontSize: isMobile ? 10 : 12
                },
                axisLabel: {
                    color: '#9ca3af',
                    formatter: '${value}B',
                    fontSize: isMobile ? 10 : 12
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
            <div className="border border-gray-700 rounded-lg p-4 lg:p-8 bg-neutral-800 min-h-[250px] lg:min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400 text-sm lg:text-base">Loading cash flow data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="border border-gray-700 rounded-lg p-4 lg:p-8 bg-neutral-800 min-h-[250px] lg:min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-2xl lg:text-4xl mb-4">⚠️</div>
                    <p className="text-red-400 mb-2 text-sm lg:text-base">Error loading cash flow data</p>
                    <p className="text-gray-500 text-xs lg:text-sm mb-4">{error}</p>
                    <button
                        onClick={fetchCashFlowData}
                        className="px-3 py-2 lg:px-4 lg:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (cashFlowData.length === 0) {
        return (
            <div className="border border-gray-700 rounded-lg p-4 lg:p-8 bg-neutral-800 min-h-[250px] lg:min-h-[400px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <div className="text-4xl lg:text-6xl mb-4">💸</div>
                    <p className="text-lg lg:text-xl font-medium text-white mb-2">Cash Flow Analysis</p>
                    <p className="text-sm lg:text-base">Enter a ticker symbol to view cash flow</p>
                </div>
            </div>
        );
    }

    return (
        <div className="border border-gray-700 rounded-lg p-3 lg:p-6 bg-neutral-800 h-full flex flex-col min-h-[250px] lg:min-h-[400px]">
            {/* echarts line chart */}
            <div className="flex-1 min-h-[180px] lg:min-h-[300px] mb-2">
                <ReactECharts
                    option={getChartOption()}
                    style={{ height: '100%', width: '100%' }}
                    theme="dark"
                />
            </div>

            {/* summary stats */}
            <div className="mb-2">
                {cashFlowData.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-center">
                        <div className="bg-neutral-900 rounded p-2 min-h-[50px] flex flex-col justify-center">
                            <div className="text-xs text-gray-400 mb-1">Latest Operating CF</div>
                            <div className="text-xs lg:text-sm font-semibold text-white">
                                ${cashFlowData[cashFlowData.length - 1].operatingCashflow.toFixed(1)}B
                            </div>
                        </div>
                        <div className="bg-neutral-900 rounded p-2 min-h-[50px] flex flex-col justify-center">
                            <div className="text-xs text-gray-400 mb-1">Latest Free CF</div>
                            <div className="text-xs lg:text-sm font-semibold text-white">
                                ${cashFlowData[cashFlowData.length - 1].freeCashFlow.toFixed(1)}B
                            </div>
                        </div>
                        <div className="bg-neutral-900 rounded p-2 min-h-[50px] flex flex-col justify-center">
                            <div className="text-xs text-gray-400 mb-1">Avg Free CF</div>
                            <div className="text-xs lg:text-sm font-semibold text-white">
                                ${(cashFlowData.reduce((sum, data) => sum + data.freeCashFlow, 0) / cashFlowData.length).toFixed(1)}B
                            </div>
                        </div>
                        <div className="bg-neutral-900 rounded p-2 min-h-[50px] flex flex-col justify-center">
                            <div className="text-xs text-gray-400 mb-1">FCF Conversion</div>
                            <div className="text-xs lg:text-sm font-semibold text-white">
                                {((cashFlowData[cashFlowData.length - 1].freeCashFlow / cashFlowData[cashFlowData.length - 1].netIncome) * 100).toFixed(0)}%
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* legend */}
            <div className="flex justify-center gap-2 lg:gap-4 text-xs flex-wrap">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 lg:w-3 lg:h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-400">Operating CF</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 lg:w-3 lg:h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-400">Free CF</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 lg:w-3 lg:h-3 bg-amber-500 rounded"></div>
                    <span className="text-gray-400">Net Income</span>
                </div>
            </div>
        </div>
    );
}