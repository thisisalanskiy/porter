const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'reporter_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!', timestamp: new Date() });
});

// Database connection routes
app.post('/api/db/connect', async (req, res) => {
  try {
    const { host, port, username, password, database, ssl } = req.body;
    
    const testPool = new Pool({
      user: username,
      host: host,
      database: database,
      password: password,
      port: port || 5432,
      ssl: ssl || false,
    });

    // Test connection
    const client = await testPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    await testPool.end();

    res.json({ success: true, message: 'Database connection successful' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get database schema
app.get('/api/db/schema', async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Get tables
    const tablesResult = await client.query(`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY table_name;
    `);
    
    // Get columns for each table
    const schema = {};
    for (const table of tablesResult.rows) {
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = $2
        ORDER BY ordinal_position;
      `, [table.table_name, table.table_schema]);
      
      schema[table.table_name] = {
        columns: columnsResult.rows,
        schema: table.table_schema
      };
    }
    
    client.release();
    res.json(schema);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute SQL query
app.post('/api/db/query', async (req, res) => {
  try {
    const { query } = req.body;
    const client = await pool.connect();
    
    const result = await client.query(query);
    client.release();
    
    res.json({
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields.map(f => ({
        name: f.name,
        dataTypeID: f.dataTypeID,
        dataTypeSize: f.dataTypeSize,
        format: f.format
      }))
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reports CRUD
app.get('/api/reports', async (req, res) => {
  try {
    // In a real app, this would query a reports table
    res.json({ reports: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const { name, config, charts, tables } = req.body;
    return res.json({
      id: Date.now(), // Simple ID generation
      name,
      config,
      charts,
      tables,
      createdAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send email report
app.post('/api/reports/:id/email', async (req, res) => {
  try {
    const { emails, subject, content } = req.body;
    
    // Configure nodemailer (gmail example)
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emails.join(', '),
      subject: subject || 'Report from Reporter',
      html: content || '<p>Please find your report attached.</p>',
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

