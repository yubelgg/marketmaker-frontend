'use client';

import { cn } from '@/lib/utils';

interface AnimatedBackgroundProps {
    children: React.ReactNode;
    className?: string;
}

export default function AnimatedBackground({
    children,
    className
}: AnimatedBackgroundProps) {
    return (
        <div className={cn("relative overflow-hidden", className)}>
            {/* Animated background gradients */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-24 left-24 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>
            
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23ffffff' fill-opacity='0.1'%3e%3ccircle cx='30' cy='30' r='1'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
                }} />
            </div>
            
            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
