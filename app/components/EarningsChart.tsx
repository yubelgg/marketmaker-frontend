'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';

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

        return {
            title: {
                text: `${ticker.toUpperCase()} Earnings History`,
                subtext: 'Annual EPS Performance',
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
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: '#374151',
                textStyle: {
                    color: '#ffffff'
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
                left: '5%',
                right: '5%',
                bottom: '2%',
                top: '20%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: categories,
                axisLabel: {
                    color: '#9ca3af',
                    rotate: 0
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
                    color: '#9ca3af'
                },
                axisLabel: {
                    color: '#9ca3af',
                    formatter: '${value}'
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
                    name: 'Annual EPS',
                    type: 'bar',
                    data: reportedEPS.map((value, index) => ({
                        value: value,
                        itemStyle: {
                            color: colors[index]
                        }
                    })),
                    barWidth: '50%'
                }
            ]
        };
    };

    if (loading) {
        return (
            <div className="border border-gray-700 rounded-lg p-8 bg-neutral-800 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading earnings data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="border border-gray-700 rounded-lg p-8 bg-neutral-800 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <p className="text-red-400 mb-2">Error loading earnings data</p>
                    <p className="text-gray-500 text-sm">{error}</p>
                    <button
                        onClick={fetchEarningsData}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (earningsData.length === 0) {
        return (
            <div className="border border-gray-700 rounded-lg p-8 bg-neutral-800 min-h-[400px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-xl font-medium text-white mb-2">Earnings Data</p>
                    <p className="text-base">Enter a ticker symbol to view earnings</p>
                </div>
            </div>
        );
    }

    return (
        <div className="border border-gray-700 rounded-lg p-6 bg-neutral-800 h-full flex flex-col">
            {/* echarts bar chart */}
            <div className="flex-1 min-h-0 mb-1">
                <ReactECharts
                    option={getChartOption()}
                    style={{ height: '100%', width: '100%' }}
                    theme="dark"
                />
            </div>

            {/* summary stats */}
            <div className="h-14 mb-1">
                {earningsData.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center h-full">
                        <div className="bg-neutral-900 rounded p-2 flex flex-col justify-center">
                            <div className="text-xs text-gray-400">Latest EPS</div>
                            <div className="text-sm font-semibold text-white">
                                ${parseFloat(earningsData[earningsData.length - 1].reportedEPS).toFixed(2)}
                            </div>
                        </div>
                        <div className="bg-neutral-900 rounded p-2 flex flex-col justify-center">
                            <div className="text-xs text-gray-400">YoY Growth</div>
                            <div className="text-sm font-semibold text-white">
                                {earningsData.length >= 2 ?
                                    (((parseFloat(earningsData[earningsData.length - 1].reportedEPS) - parseFloat(earningsData[earningsData.length - 2].reportedEPS)) / Math.abs(parseFloat(earningsData[earningsData.length - 2].reportedEPS)) * 100).toFixed(1) + '%')
                                    : 'N/A'
                                }
                            </div>
                        </div>
                        <div className="bg-neutral-900 rounded p-2 flex flex-col justify-center">
                            <div className="text-xs text-gray-400">Avg EPS</div>
                            <div className="text-sm font-semibold text-white">
                                ${(earningsData.reduce((sum, data) => sum + parseFloat(data.reportedEPS || '0'), 0) / earningsData.length).toFixed(2)}
                            </div>
                        </div>
                        <div className="bg-neutral-900 rounded p-2 flex flex-col justify-center">
                            <div className="text-xs text-gray-400">Growth Years</div>
                            <div className="text-sm font-semibold text-white">
                                {earningsData.filter((data, index) => {
                                    if (index === 0) return false;
                                    return parseFloat(data.reportedEPS || '0') > parseFloat(earningsData[index - 1].reportedEPS || '0');
                                }).length}/{earningsData.length - 1}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* legend */}
            <div className="h-5 flex justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-400">First Year</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-400">Growth</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-amber-500 rounded"></div>
                    <span className="text-gray-400">Decline</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-gray-400">Negative</span>
                </div>
            </div>
        </div>
    );
} 
