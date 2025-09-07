import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Brain, BarChart3, Zap, Activity, LineChart } from 'lucide-react';
import Navigation from './components/Navigation';
import { Badge } from '@/components/ui/badge';
import AnimatedGradientText from './components/ui/animated-gradient-text';
import FloatingCard from './components/ui/floating-card';
import AnimatedBackground from './components/ui/animated-background';

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
            <Navigation />

            {/* Hero Section */}
            <AnimatedBackground>
                <section className="px-6 py-20">
                    <div className="max-w-6xl mx-auto text-center">
                        <div className="mb-8">
                            <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 glass">
                                Next-Gen Financial Analysis
                            </Badge>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                            AI-Powered Stock
                            <br />
                            <AnimatedGradientText className="text-5xl md:text-7xl font-bold">
                                Sentiment Analysis
                            </AnimatedGradientText>
                </h1>
                    <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                        Harness the power of artificial intelligence to analyze market sentiment, 
                        financial reports, and real-time news data for informed investment decisions.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/dashboard">
                            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg">
                                <Brain className="mr-2 h-5 w-5" />
                                Start Analysis
                            </Button>
                        </Link>
                        <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-3 text-lg">
                            <Activity className="mr-2 h-5 w-5" />
                            Learn More
                        </Button>
                    </div>
                </div>
                </section>
            </AnimatedBackground>

            <Separator className="bg-neutral-700" />

            {/* Features Section */}
            <section className="px-6 py-20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Powerful Features for Modern Trading
                        </h2>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                            Everything you need to make data-driven investment decisions
                        </p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FloatingCard>
                            <CardHeader>
                                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                                    <Brain className="h-6 w-6 text-blue-400" />
                                </div>
                                <CardTitle className="text-white">AI Sentiment Analysis</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Advanced NLP models analyze news and financial reports to determine market sentiment
                                </CardDescription>
                            </CardHeader>
                        </FloatingCard>

                        <FloatingCard>
                            <CardHeader>
                                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                                    <BarChart3 className="h-6 w-6 text-green-400" />
                                </div>
                                <CardTitle className="text-white">Financial Charts</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Interactive charts for earnings, dividends, cash flow, and income statements
                                </CardDescription>
                            </CardHeader>
                        </FloatingCard>

                        <FloatingCard>
                            <CardHeader>
                                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                                    <Zap className="h-6 w-6 text-purple-400" />
                                </div>
                                <CardTitle className="text-white">Real-time Data</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Live market data and news feeds for up-to-the-minute analysis
                                </CardDescription>
                            </CardHeader>
                        </FloatingCard>

                        <FloatingCard>
                            <CardHeader>
                                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                                    <LineChart className="h-6 w-6 text-orange-400" />
                                </div>
                                <CardTitle className="text-white">Technical Analysis</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Comprehensive technical indicators and pattern recognition
                                </CardDescription>
                            </CardHeader>
                        </FloatingCard>

                        <FloatingCard>
                            <CardHeader>
                                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                                    <Activity className="h-6 w-6 text-red-400" />
                                </div>
                                <CardTitle className="text-white">Risk Assessment</CardTitle>
                                <CardDescription className="text-gray-400">
                                    AI-powered risk analysis and portfolio optimization recommendations
                                </CardDescription>
                            </CardHeader>
                        </FloatingCard>

                        <FloatingCard>
                            <CardHeader>
                                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                                    <TrendingUp className="h-6 w-6 text-cyan-400" />
                                </div>
                                <CardTitle className="text-white">Trend Prediction</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Machine learning models predict market trends and price movements
                                </CardDescription>
                            </CardHeader>
                        </FloatingCard>
                    </div>
                </div>
            </section>

            <Separator className="bg-neutral-700" />

            {/* CTA Section */}
            <section className="px-6 py-20">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to Transform Your Trading?
                    </h2>
                    <p className="text-xl text-gray-300 mb-8">
                        Join thousands of traders who trust AI-powered insights for better investment decisions.
                    </p>
                    <Link href="/dashboard">
                        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg">
                            <Brain className="mr-2 h-6 w-6" />
                            Get Started Now
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-neutral-700 bg-neutral-900/50">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-6 w-6 text-blue-500" />
                            <span className="text-white font-semibold">Market Maker</span>
                        </div>
                        <p className="text-gray-400 text-sm">
                            © 2024 Market Maker. AI-powered financial analysis.
                        </p>
                </div>
            </div>
            </footer>
        </main>
    );
}
