interface NewsArticle {
  title: string;
  description: string;
  publishedAt: string;
  source: {
    name: string;
  };
  url: string;
}

interface StockNewsResult {
  success: boolean;
  text: string;
  articles: NewsArticle[];
  error?: string;
}

/**
 * Development-only logging utility
 */
const devLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, ...args);
  }
};

/**
 * Fetch recent news about a stock for sentiment analysis
 * Uses server-side API route to bypass CORS restrictions
 */
export async function fetchStockNews(symbol: string, companyName?: string): Promise<StockNewsResult> {
  try {
    const params = new URLSearchParams({
      symbol: symbol,
      ...(companyName && { companyName })
    });

    devLog(`Fetching news for ${symbol}...`);
    
    const response = await fetch(`/api/news?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        text: '',
        articles: [],
        error: errorData.error || `API error: ${response.status}`
      };
    }

    const data = await response.json();
    
    devLog(`Found news for ${symbol}`);

    return {
      success: true,
      text: data.text,
      articles: data.articles
    };

  } catch (error) {
    console.error('Error fetching stock news:', error instanceof Error ? error.message : 'Unknown error');
    
    return {
      success: false,
      text: '',
      articles: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get company name from ticker symbol for better news search
 */
export function getCompanyName(symbol: string): string {
  const companyMap: Record<string, string> = {
    'AAPL': 'Apple',
    'MSFT': 'Microsoft',
    'GOOGL': 'Google',
    'GOOG': 'Google',
    'AMZN': 'Amazon',
    'TSLA': 'Tesla',
    'META': 'Meta',
    'NVDA': 'NVIDIA',
    'NFLX': 'Netflix',
    'AMD': 'AMD',
    'INTC': 'Intel',
    'CRM': 'Salesforce',
    'ORCL': 'Oracle',
    'PYPL': 'PayPal',
    'ADBE': 'Adobe',
    'SPOT': 'Spotify',
    'UBER': 'Uber',
    'LYFT': 'Lyft',
    'TWTR': 'Twitter',
    'SNAP': 'Snapchat',
    'SQ': 'Block',
    'ROKU': 'Roku'
  };
  
  return companyMap[symbol.toUpperCase()] || symbol;
} 