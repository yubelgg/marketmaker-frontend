# Alpha Vantage API Setup with ECharts

## Getting Started with Earnings Data

### 1. Get Your Free API Key

1. Go to [Alpha Vantage Support](https://www.alphavantage.co/support/#api-key)
2. Sign up for a free account
3. Get your API key (free tier includes 500 API calls per day)

### 2. Configure Environment Variables

Create a `.env.local` file in the `marketmaker-frontend` directory:

```bash
# Alpha Vantage API Configuration
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your_actual_api_key_here
```

**Important:** Replace `your_actual_api_key_here` with your actual API key from Alpha Vantage.

### 3. Chart Technology

This project uses **Apache ECharts** for professional, interactive charts:
- **Library:** [echarts-for-react](https://github.com/hustcc/echarts-for-react)
- **Examples:** [Apache ECharts Bar Charts](https://echarts.apache.org/examples/en/index.html#chart-type-bar)
- **Features:** Interactive tooltips, animations, responsive design, dark theme support

### 4. Features Implemented

#### ECharts-Powered Earnings Chart
- **Location:** First chart in the dashboard
- **Data Source:** Alpha Vantage EARNINGS API
- **Visualization Features:**
  - **Interactive bar chart** with hover tooltips
  - **Color-coded bars:**
    - Gray (transparent): Estimated EPS
    - Green: Reported EPS that beat estimates
    - Blue: Reported EPS that met/missed estimates  
    - Red: Negative EPS
  - **Professional styling:** Dark theme, grid lines, proper axis labels
  - **Responsive design:** Adapts to different screen sizes
  - **Detailed tooltips:** Show EPS values, surprise percentages, and dates

#### Summary Statistics
- Latest EPS value
- Latest earnings surprise percentage
- Average EPS over displayed quarters
- Beat rate (how many quarters beat estimates)

### 5. API Endpoints Used

Based on [Alpha Vantage Documentation](https://www.alphavantage.co/documentation/):

- **SYMBOL_SEARCH**: `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=QUERY&apikey=YOUR_KEY`
  - Powers the smart ticker search with autocomplete
  - Searches by company name or symbol
  - Returns match scores for relevance ranking
  - Filters for US equity stocks only

- **EARNINGS**: `https://www.alphavantage.co/query?function=EARNINGS&symbol=TICKER&apikey=YOUR_KEY`
  - Returns quarterly and annual earnings data
  - Includes reported vs estimated EPS
  - Provides surprise percentages

### 6. Enhanced Search Experience

#### Smart Ticker Search
- **Type any company name** (e.g., "Apple", "Microsoft", "Tesla")
- **Type ticker symbols** (e.g., "AAPL", "MSFT", "TSLA") 
- **Autocomplete suggestions** appear as you type
- **Match scoring** shows relevance percentage
- **US equity filtering** for relevant results only
- **Debounced search** (300ms delay) for optimal performance

#### Usage Flow
1. Start typing a company name or ticker symbol
2. Select from autocomplete suggestions or press Enter
3. Click "Analyze" to run sentiment analysis and load charts
4. The ECharts earnings chart will automatically display:
   - Last 8 quarters of earnings data
   - Interactive hover tooltips
   - Color-coded performance indicators
   - Summary statistics below the chart

### 7. Dependencies Installed

```bash
npm install echarts echarts-for-react
```

- **echarts**: Core Apache ECharts library
- **echarts-for-react**: React wrapper for seamless integration

### 8. Rate Limits

- **Free Tier:** 500 API calls per day
- **Demo Key:** Limited functionality, some tickers may not work
- **Recommended:** Get your own free API key for full functionality

### 9. Error Handling

The component handles:
- Invalid ticker symbols
- API rate limit exceeded
- Network errors
- Missing data
- ECharts rendering errors

### 10. Chart Features

Based on [Apache ECharts bar chart examples](https://echarts.apache.org/examples/en/index.html#chart-type-bar):

- **Interactive tooltips** with detailed earnings information
- **Responsive design** that adapts to container size
- **Dark theme** integration matching the app's design
- **Professional animations** for data loading
- **Grid lines and axis labels** for easy reading
- **Legend** explaining color coding
- **Title and subtitle** with dynamic ticker information

### 11. Next Steps

Additional Alpha Vantage endpoints you can integrate with ECharts:
- **TIME_SERIES_DAILY**: Stock price line charts
- **INCOME_STATEMENT**: Financial statements bar charts  
- **COMPANY_OVERVIEW**: Key metrics gauges
- **NEWS_SENTIMENT**: Sentiment over time charts

Additional ECharts types to explore:
- **Line charts** for price trends
- **Candlestick charts** for OHLC data
- **Area charts** for volume analysis
- **Gauge charts** for performance metrics

## Troubleshooting

### Common Issues:

1. **"API call frequency limit reached"**
   - Wait and try again later, or upgrade your Alpha Vantage plan

2. **"Error Message" from API**
   - Check that the ticker symbol is valid
   - Ensure your API key is correct

3. **ECharts not rendering**
   - Check browser console for JavaScript errors
   - Ensure echarts-for-react is properly installed
   - Verify the component is receiving valid data

4. **Network errors**
   - Check your internet connection
   - Verify the API endpoint is accessible

### Demo Mode

The component includes a fallback to use 'demo' as the API key if none is provided, but this has very limited functionality. For best results, use your own free API key. 