'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FloatingCardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export default function FloatingCard({
    children,
    className,
    hoverEffect = true
}: FloatingCardProps) {
    return (
        <Card 
            className={cn(
                "bg-neutral-800/50 border-neutral-700 backdrop-blur-sm",
                "shadow-lg hover:shadow-xl transition-all duration-300",
                hoverEffect && "hover:bg-neutral-800/70 hover:-translate-y-1 hover:scale-[1.02]",
                "relative overflow-hidden",
                "before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/5 before:via-purple-500/5 before:to-cyan-500/5",
                "before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
                className
            )}
        >
            {children}
        </Card>
    );
}
