'use client';

import { cn } from '@/lib/utils';

interface AnimatedGradientTextProps {
    children: React.ReactNode;
    className?: string;
}

export default function AnimatedGradientText({
    children,
    className
}: AnimatedGradientTextProps) {
    return (
        <div className={cn("relative", className)}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-600 to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                {children}
            </div>
            <div className="bg-gradient-to-r from-blue-400 via-purple-600 to-cyan-400 bg-clip-text text-transparent">
                {children}
            </div>
        </div>
    );
}
