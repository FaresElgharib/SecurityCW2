const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3');
const { checkAdmin } = require('./middleware');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/store', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/store.html'));
});
// Connect to SQLite database
const db = new sqlite3.Database('./mydb.sqlite', (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT
        )`, (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }
});

const db1 = new sqlite3.Database('./mydb.sqlite', (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL
        )`);
    }
});

// Routes
app.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
        db.run(sql, [username, hashedPassword, role], function(err) {
            if (err) {
                res.status(400).send(err.message);
                return;
            }
            res.send(`User registered with ID: ${this.lastID}`);
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

const user2FACodes = {};

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const sql = 'SELECT * FROM users WHERE username = ?';

        db.get(sql, [username], async (err, user) => {
            if (err) {
                res.status(400).send(err.message);
                return;
            }
            if (user && await bcrypt.compare(password, user.password)) {
                const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
                // res.json({ message: 'Logged in successfully', token });
            }
            if (user) {
                const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
                // Storing the 2FA code
                const twoFactorCode = Math.floor(100000 + Math.random() * 900000); // 6-digit code
                user2FACodes[user.id] = twoFactorCode; // Store the code with the user's ID as the key
                //Sending the 2FA code
                console.log(`2FA Code for user ${user.id}: ${twoFactorCode}`); // Display code in console
                res.json({ message: 'Logged in successfully', token, userId: user.id});
            } else {
                res.status(400).send('Invalid credentials');
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.post('/validate-2fa', (req, res) => {
    const { userId, twoFactorCode } = req.body;

    // Check if the provided code matches the stored code
    if (user2FACodes[userId] && user2FACodes[userId] == twoFactorCode) {
        delete user2FACodes[userId]; // Remove the code after successful validation
        res.send('2FA validation successful');
    } else {
        res.status(400).send('Invalid 2FA code');
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

// Route to get all products
app.get('/products', (req, res) => {
    db1.all("SELECT * FROM products", [], (err, rows) => {
        if (err) {
            res.status(400).send(err.message);
            return;
        }
        res.json(rows);
    });
});

// Route to update product price
app.post('/update-price', checkAdmin, (req, res) => {
    const { id, price } = req.body;
    if (!Number.isInteger(productId) || !Number.isFinite(newPrice)) {
        return res.status(400).send('Invalid input');
    }
    
    db1.run(`UPDATE products SET price = ? WHERE id = ?`, [price, id], function(err) {
        if (err) {
            res.status(400).send(err.message);
            return;
        }
        res.send(`Product price updated successfully`);
    });
})