# Porter - Drag & Drop Report Builder MVP

> **🚧 Work in progress.** Porter is an MVP under active development. Expect breaking changes, incomplete features, and rough edges — see [Known Issues](#known-issues) before using it with real data.

A modern web-based tool that allows non-technical users to build reports from database data using an intuitive drag-and-drop interface.

## Features

✨ **Key Capabilities**
- 📂 **Workspace Management**: Organize reports in folders, create/edit/delete reports
- 🎨 **Drag & Drop Builder**: Intuitive interface for building reports without writing code
- 📐 **Multi-Column Layouts**: Choose 1, 2, or 3 column layouts for dashboard-style reports
- 📝 **Text Components**: Add headers and paragraphs with inline editing
- 🔗 **Database Connection**: Connect to PostgreSQL databases (easily extensible to other databases)
- 📊 **Multiple Chart Types**: Tables, Bar Charts, Line Charts, Pie Charts, Headers, and Text
- 💾 **Save & Load Reports**: Save reports with custom names and reload them anytime
- 📅 **Scheduled Reports**: Automate report delivery (daily/weekly/monthly)
- 📧 **Email Export**: Send reports directly via email
- 📄 **PDF & CSV Export**: Export reports in multiple formats
- 🎯 **SQL Query Builder**: Write custom SQL queries for data
- 👀 **Live Preview**: Preview reports before sharing
- 📱 **Responsive Design**: Works on desktop and tablet

## Prerequisites

Before getting started, make sure you have:

- **Node.js** (v16 or higher)
- **PostgreSQL** database running locally or accessible remotely
- **npm** or **yarn** package manager

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Database Setup

Create a PostgreSQL database for your reports:

```sql
CREATE DATABASE reporter_db;
```

For testing, you can also create a sample table with data:

```sql
-- Connect to your reporter_db database
\c reporter_db;

-- Create sample tables
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(100),
    revenue DECIMAL(10,2),
    date_sold DATE,
    region VARCHAR(50)
);

-- Insert sample data
INSERT INTO sales (product_name, revenue, date_sold, region) VALUES
('Widget A', 1500.00, '2024-01-01', 'North'),
('Widget B', 2200.00, '2024-01-02', 'South'),
('Widget C', 1800.00, '2024-01-03', 'East'),
('Widget A', 1600.00, '2024-01-04', 'West'),
('Widget B', 2300.00, '2024-01-05', 'North');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    department VARCHAR(50),
    salary DECIMAL(10,2)
);

INSERT INTO users (name, email, department, salary) VALUES
('John Doe', 'john@example.com', 'Sales', 75000.00),
('Jane Smith', 'jane@example.com', 'Marketing', 82000.00),
('Mike Johnson', 'mike@example.com', 'Engineering', 95000.00),
('Sarah Wilson', 'sarah@example.com', 'Sales', 78000.00);
```

### 3. Environment Configuration

Copy the environment example file in the server directory:

```bash
cd server
cp env.example .env
```

Edit `.env` with your database credentials:

```env
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=reporter_db
DB_PASSWORD=your_password
DB_PORT=5432

EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 4. Start the Application

From the project root, run:

```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend development server (port 3000).

Open your browser and navigate to: **http://localhost:3000**

## How to Use Reporter

### 1. Connect to Database

1. Fill in your database connection details in the left sidebar
2. Click "Test Connection" to verify connectivity
3. Once connected, you'll see database schema information

### 2. Build Your Report

1. **Drag Components**: Drag chart types from the Components palette to the canvas
2. **Configure Elements**: Click on any chart element to:
   - Set up SQL queries to fetch data
   - Configure chart options (titles, colors, axes)
   - Set display preferences

### 3. Preview and Export

1. **Preview**: Click "Preview Report" to see how your report will look
2. **Export**: Use the export options in the top menu:
   - **Email**: Send reports directly to recipients
   - **PDF**: Download as PDF file
   - **CSV**: Export table data as CSV

## Sample SQL Queries

Here are some example queries you can use to get started:

**Sales Summary**:
```sql
SELECT 
    region,
    COUNT(*) as sales_count,
    SUM(revenue) as total_revenue,
    AVG(revenue) as avg_revenue
FROM sales 
GROUP BY region 
ORDER BY total_revenue DESC;
```

**Revenue Trend**:
```sql
SELECT 
    DATE_TRUNC('month', date_sold) as month,
    SUM(revenue) as monthly_revenue
FROM sales 
WHERE date_sold >= '2024-01-01'
GROUP BY DATE_TRUNC('month', date_sold)
ORDER BY month;
```

**Employee Performance**:
```sql
SELECT 
    name,
    department,
    salary,
    CASE 
        WHEN salary >= 90000 THEN 'Senior'
        WHEN salary >= 75000 THEN 'Mid'
        ELSE 'Junior'
    END as level
FROM users
ORDER BY salary DESC;
```

## Architecture

### Technology Stack

**Frontend**:
- React 18 with TypeScript
- Ant Design for UI components
- React DnD for drag-and-drop
- Recharts for data visualization
- Vite for build tooling

**Backend**:
- Node.js with Express
- PostgreSQL with pg driver
- Nodemailer for email functionality
- Joi for validation

### Project Structure

```
reporter/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── chart/      # Chart components
│   │   ├── types.ts        # TypeScript types
│   │   └── App.tsx         # Main app component
├── server/                 # Node.js backend
│   ├── index.js           # Express server
│   └── package.json       # Backend dependencies
└── package.json           # Root package.json
```

## Known Issues

- ⚠️ **SQL injection**: `POST /api/db/query` passes the request body's `query` string straight to `pg`'s `client.query()` with no sanitization, parameterization, or allowlisting. Do not expose this server to untrusted input or the public internet as-is.
- No authentication on any API route.
- Report/connection persistence is localStorage only — not production storage.
- PDF export (`ReportPreview`) has known multi-page layout bugs.
- Pie/bar/line charts need two fields (label + value); drag-and-drop currently only assigns one, so use the config panel for those chart types.

## Future Enhancements

This MVP includes the core functionality. Future versions could include:

- 🎨 **More Chart Types**: Scatter plots, heatmaps, gauges
- 🔐 **User Authentication**: User accounts and permissions
- 💾 **Template Library**: Pre-built report templates
- 🤖 **AI Assistant**: Natural language report generation
- 📅 **Scheduled Reports**: Automated report delivery
- 🔄 **Real-time Data**: Live data connections
- 📈 **Dashboard Mode**: Interactive dashboards
- 🌐 **More Databases**: MySQL, SQLite, MongoDB support
- 📊 **Advanced Analytics**: Statistical functions and advanced charting

## Contributing

This is an MVP project. Feel free to extend and improve it!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for teams who need easy, powerful reporting tools.**

