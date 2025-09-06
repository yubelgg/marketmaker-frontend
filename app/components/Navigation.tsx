'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Home, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navigation() {
    const pathname = usePathname();

    return (
        <nav className="border-b border-neutral-700 bg-neutral-900/50 backdrop-blur sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <TrendingUp className="h-8 w-8 text-blue-500" />
                        <h1 className="text-2xl font-bold text-white">Market Maker</h1>
                    </Link>
                    
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-4">
                            <Link href="/">
                                <Button 
                                    variant={pathname === '/' ? 'default' : 'ghost'} 
                                    size="sm"
                                    className={cn(
                                        "text-gray-300 hover:text-white",
                                        pathname === '/' && "bg-blue-600 text-white hover:bg-blue-700"
                                    )}
                                >
                                    <Home className="mr-2 h-4 w-4" />
                                    Home
                                </Button>
                            </Link>
                            <Link href="/dashboard">
                                <Button 
                                    variant={pathname === '/dashboard' ? 'default' : 'ghost'} 
                                    size="sm"
                                    className={cn(
                                        "text-gray-300 hover:text-white",
                                        pathname === '/dashboard' && "bg-blue-600 text-white hover:bg-blue-700"
                                    )}
                                >
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    Dashboard
                                </Button>
                            </Link>
                        </div>
                        
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            AI-Powered
                        </Badge>
                        
                        {pathname !== '/dashboard' && (
                            <Link href="/dashboard">
                                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                                    Launch Dashboard
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
