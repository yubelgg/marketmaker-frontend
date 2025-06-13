import TickerDashboard from './components/TickerDashboard';

export default function Home() {
    return (
        <main className="h-screen flex flex-col bg-neutral-900 p-4">
            <div className="max-w-[95%] mx-auto w-full flex flex-col h-full">
                <h1 className="text-3xl font-bold mb-4 text-center text-white flex-shrink-0">
                    Market Maker - Financial Dashboard
                </h1>
                <div className="flex-1 min-h-0">
                    <TickerDashboard />
                </div>
            </div>
        </main>
    );
}
