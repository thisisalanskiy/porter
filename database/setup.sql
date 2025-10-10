-- Reporter Database Setup
-- Create the main database (run this as postgres user)
-- CREATE DATABASE reporter_db;

-- Connect to the reporter_db database
\c reporter_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for future authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Data source connections table
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL DEFAULT 5432,
    database_name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    ssl_enabled BOOLEAN DEFAULT FALSE,
    connection_status VARCHAR(20) DEFAULT 'disconnected',
    last_tested TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    data_source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT FALSE,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    is_template BOOLEAN DEFAULT FALSE,
    template_category VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP
);

-- Report elements table (charts, tables, etc.)
CREATE TABLE report_elements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    element_type VARCHAR(50) NOT NULL,
    title VARCHAR(200),
    position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
    size JSONB DEFAULT '{"width": 400, "height": 300}',
    config JSONB NOT NULL DEFAULT '{}',
    data_cached JSONB,
    sql_query TEXT,
    refresh_frequency INTEGER DEFAULT 0, -- in minutes, 0 = manual only
    last_refreshed TIMESTAMP,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Report sharing table
CREATE TABLE report_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    shared_by UUID REFERENCES users(id) ON DELETE CASCADE,
    share_type VARCHAR(20) NOT NULL, -- 'public', 'private', 'temporary'
    access_token VARCHAR(255) UNIQUE,
    expiration_date TIMESTAMP,
    permissions JSONB DEFAULT '{"view": true}', -- view, edit, share
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Scheduled reports table
CREATE TABLE scheduled_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    schedule_name VARCHAR(100) NOT NULL,
    schedule_config JSONB NOT NULL, -- cron expression or interval
    recipients JSONB NOT NULL DEFAULT '[]', -- email list
    export_format VARCHAR(20) DEFAULT 'pdf',
    is_active BOOLEAN DEFAULT TRUE,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Report templates (pre-built report configurations)
CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    template_config JSONB NOT NULL,
    sample_data JSONB,
    is_public BOOLEAN DEFAULT TRUE,
    downloads_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics/Usage tracking
CREATE TABLE report_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- view, export, share, etc.
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_data_sources_user_id ON data_sources(user_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_data_source_id ON reports(data_source_id);
CREATE INDEX idx_report_elements_report_id ON report_elements(report_id);
CREATE INDEX idx_report_shares_report_id ON report_shares(report_id);
CREATE INDEX idx_report_shares_access_token ON report_shares(access_token);
CREATE INDEX idx_scheduled_reports_report_id ON scheduled_reports(report_id);
CREATE INDEX idx_report_templates_category ON report_templates(category);
CREATE INDEX idx_report_analytics_report_id ON report_analytics(report_id);
CREATE INDEX idx_report_analytics_created_at ON report_analytics(created_at DESC);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON data_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_elements_updated_at BEFORE UPDATE ON report_elements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_shares_updated_at BEFORE UPDATE ON report_shares FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_reports_updated_at BEFORE UPDATE ON scheduled_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing

-- Sample data source (using placeholder credentials - user will configure real ones)
INSERT INTO data_sources (name, host, port, database_name, username, password_hash, ssl_enabled) VALUES
('Sample PostgreSQL', 'localhost', 5432, 'reporter_db', 'postgres', 'placeholder_hash', false);

-- Sample report templates
INSERT INTO report_templates (name, description, category, icon, template_config, is_public) VALUES
('Sales Overview', 'Complete sales dashboard with revenue charts and regional analysis', 'Sales', 'dashboard', '{"elements": [{"type": "bar-chart", "config": {"title": "Monthly Sales", "xAxisField": "month", "yAxisField": "revenue"}}, {"type": "table", "config": {"title": "Top Products"}}]}', true),
('Employee Report', 'HR analytics with salary distribution and department overview', 'HR', 'users', '{"elements": [{"type": "pie-chart", "config": {"title": "Department Distribution"}}, {"type": "bar-chart", "config": {"title": "Salary by Department", "xAxisField": "department", "yAxisField": "average_salary"}}]}', true),
('Financial Summary', 'Revenue, profit, and cost analysis dashboard', 'Finance', 'dollar', '{"elements": [{"type": "line-chart", "config": {"title": "Revenue Trend"}}, {"type": "table", "config": {"title": "Expense Breakdown"}}]}', true);

-- Add some helpful views
CREATE VIEW active_reports AS
SELECT 
    r.*,
    ds.name as data_source_name,
    COUNT(re.id) as element_count
FROM reports r
LEFT JOIN data_sources ds ON r.data_source_id = ds.id
LEFT JOIN report_elements re ON r.id = re.report_id
GROUP BY r.id, ds.name;

CREATE VIEW report_template_stats AS
SELECT 
    rt.*,
    u.username as created_by_username
FROM report_templates rt
LEFT JOIN users u ON rt.created_by = u.id
WHERE rt.is_public = true;

COMMENT ON DATABASE reporter_db IS 'Database for Reporter - A drag-and-drop report builder application';

