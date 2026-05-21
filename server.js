require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve static files from the current directory

// Database setup
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Database connected.');
    client.query(`CREATE TABLE IF NOT EXISTS blogs (
        id SERIAL PRIMARY KEY,
        title TEXT,
        subtitle TEXT,
        cover_image TEXT,
        content TEXT,
        date TEXT
    )`, (err, result) => {
        release();
        if (err) {
            return console.error('Error executing query', err.stack);
        }
        console.log('Database table verified.');
    });
});

// API Routes

// Get all blogs
app.get('/api/blogs', async (req, res) => {
    try {
        const result = await pool.query("SELECT id, title, subtitle, cover_image, date FROM blogs ORDER BY id DESC");
        res.json({ blogs: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a specific blog
app.get('/api/blogs/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const result = await pool.query("SELECT * FROM blogs WHERE id = $1", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Blog not found" });
        }
        res.json({ blog: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new blog
app.post('/api/blogs', async (req, res) => {
    const { title, subtitle, cover_image, content } = req.body;
    
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    const dateOptions = { year: 'numeric', month: 'long', day: '2-digit' };
    const formattedDate = new Date().toLocaleDateString('en-US', dateOptions);

    const query = `INSERT INTO blogs (title, subtitle, cover_image, content, date) VALUES ($1, $2, $3, $4, $5) RETURNING id`;
    
    try {
        const result = await pool.query(query, [title, subtitle, cover_image, content, formattedDate]);
        res.json({ message: 'Blog created successfully', id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
