require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

pool.connect(async (err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Database connected.');
    try {
        await client.query(`CREATE TABLE IF NOT EXISTS blogs (
            id SERIAL PRIMARY KEY,
            title TEXT,
            subtitle TEXT,
            cover_image TEXT,
            content TEXT,
            date TEXT
        )`);
        console.log('Blogs table verified.');

        await client.query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT
        )`);
        console.log('Users table verified.');

        const userRes = await client.query("SELECT * FROM users WHERE username = $1", ['ramsadmin']);
        if (userRes.rows.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash('itsRaam123!', salt);
            await client.query("INSERT INTO users (username, password) VALUES ($1, $2)", ['ramsadmin', hashed]);
            console.log('Admin user created.');
        }
    } catch (dbErr) {
        console.error('Error during database initialization', dbErr.stack);
    } finally {
        release();
    }
});

// API Routes

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.user = user;
        next();
    });
};

// Login Route
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '6h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
app.post('/api/blogs', authenticateToken, async (req, res) => {
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
