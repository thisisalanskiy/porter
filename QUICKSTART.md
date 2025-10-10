# Porter MVP - Quick Start Guide

Get up and running in 5 minutes! 🚀

## Prerequisites Checklist

- [ ] **Node.js** installed (v16+) - Download from [nodejs.org](https://nodejs.org/)
- [ ] **PostgreSQL** database running locally or cloud access
- [ ] **npm** package manager (comes with Node.js)

## Installation & Startup

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
./start.sh
```

### Option 2: Manual Setup

1. **Install Dependencies**
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   cd ..
   ```

2. **Configure Database**
   - Edit `server/.env` with your PostgreSQL credentials
   - Run the sample data setup (optional):
     ```bash
   psql -U postgres -f database/setup.sql
   ```

3. **Start Development Servers**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to: **http://localhost:3000**

## First Use

1. **Connect Database**: Enter your PostgreSQL credentials in the left sidebar
2. **Drag & Drop**: Drag a chart type from Components palette to canvas
3. **Configure**: Click the chart element and add SQL query
4. **Preview**: Click "Preview Report" to see your report
5. **Export**: Use top menu to email or download your report

## Sample Queries

Try these SQL queries in your report elements:

**Basic Data Table:**
```sql
SELECT * FROM sales LIMIT 100;
```

**Revenue Chart:**
```sql
SELECT region, SUM(revenue) as total_revenue 
FROM sales 
GROUP BY region 
ORDER BY total_revenue DESC;
```

**Time Series:**
```sql
SELECT DATE_TRUNC('month', date_sold) as month, 
       SUM(revenue) as monthly_revenue
FROM sales 
GROUP BY month 
ORDER BY month;
```

## Troubleshooting

**🚨 Database Connection Error?**
- Check PostgreSQL is running
- Verify credentials in `server/.env`
- Test connection manually with pgAdmin or psql

**🚨 Port Already in Use?**
- Kill processes on ports 3000 or 5000
- Or change ports in `server/index.js` and `client/vite.config.ts`

**🚨 Build Errors?**
- Delete `node_modules` and run `npm install` again
- Check Node.js version: `node --version` (should be v16+)

## Next Steps

Once you're comfortable with the basics:
- Explore different chart types (Bar, Line, Pie, Table)
- Try the report preview and export features
- Create more complex SQL queries
- Customize chart colors and titles

## Need Help?

1. Check the full README.md for detailed documentation
2. Review the sample data in `database/setup.sql`
3. Look at component examples in `client/src/components/`

---

**🎉 You're ready to build professional reports!**

