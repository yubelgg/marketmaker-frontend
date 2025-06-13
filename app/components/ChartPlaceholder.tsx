interface ChartPlaceholderProps {
    title: string;
    description: string;
    chartNumber: number;
}

export default function ChartPlaceholder({ title, description, chartNumber }: ChartPlaceholderProps) {
    return (
        <div className="border border-gray-700 rounded-lg p-8 bg-neutral-800 flex items-center justify-center min-h-[300px]">
            <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-2xl font-medium text-white mb-2">{title}</p>
                <p className="text-base mt-2 text-gray-400">{description}</p>
                <p className="text-sm mt-4 text-gray-600">
                    Chart {chartNumber} - Ready for data integration
                </p>
            </div>
        </div>
    );
} 
