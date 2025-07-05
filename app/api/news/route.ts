import { NextRequest, NextResponse } from 'next/server';

interface NewsArticle {
  title: string;
  description: string;
  publishedAt: string;
  source: {
    name: string;
  };
  url: string;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const companyName = searchParams.get('companyName');
  
  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY;
  
  if (!NEWS_API_KEY || NEWS_API_KEY === 'your_newsapi_key_here') {
    return NextResponse.json({ 
      error: 'NewsAPI key not configured. Please add NEXT_PUBLIC_NEWS_API_KEY to your .env.local file. Get your free key at https://newsapi.org/' 
    }, { status: 500 });
  }

  try {
    const searchQuery = companyName || symbol;
    const params = new URLSearchParams({
      q: `${searchQuery} AND (earnings OR revenue OR financial OR quarterly OR stock OR shares)`,
      domains: 'reuters.com,bloomberg.com,cnbc.com,marketwatch.com,finance.yahoo.com',
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: '5',
      apiKey: NEWS_API_KEY
    });

    console.log(`Fetching news for ${symbol}...`);
    
    const response = await fetch(`https://newsapi.org/v2/everything?${params}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'MarketMaker/1.0'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: `NewsAPI error: ${response.status} ${response.statusText}. Please check your API key and try again.` 
      }, { status: response.status });
    }

    const data: NewsApiResponse = await response.json();
    
    if (data.status !== 'ok') {
      return NextResponse.json({ 
        error: `NewsAPI returned error: ${data.status}` 
      }, { status: 500 });
    }

    // Extract meaningful text from articles
    const articleTexts: string[] = [];
    const validArticles: NewsArticle[] = [];

    for (const article of data.articles.slice(0, 3)) {
      const title = article.title?.trim();
      const description = article.description?.trim();
      
      if (title && description && 
          !title.toLowerCase().includes('removed') &&
          !description.toLowerCase().includes('removed')) {
        
        articleTexts.push(`${title}. ${description}`);
        validArticles.push(article);
      }
    }

    if (articleTexts.length === 0) {
      return NextResponse.json({ 
        error: `No recent financial news found for ${symbol}. Try a different stock symbol or check back later.` 
      }, { status: 404 });
    }

    // Combine all article texts
    const combinedText = articleTexts.join(' ');
    
    // Ensure text isn't too long
    const maxLength = 2000;
    const finalText = combinedText.length > maxLength 
      ? combinedText.substring(0, maxLength) + '...'
      : combinedText;

    console.log(`Found ${validArticles.length} articles for ${symbol}`);

    return NextResponse.json({
      success: true,
      text: finalText,
      articles: validArticles
    });

  } catch (error) {
    console.error('Error fetching stock news:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch news from NewsAPI. Please try again later.' 
    }, { status: 500 });
  }
} 