// middleware.js

const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Connect to SQLite database
const db = new sqlite3.Database('./mydb.sqlite', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
});

function checkAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1]; // Assuming token is sent as a Bearer token

    if (!token) {
        return res.status(403).send('No token provided');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role === 'admin') {
            req.userId = decoded.id; // Add user ID to the request
            next();
        } else {
            res.status(403).send('Access Denied');
        }
    } catch (error) {
        res.status(401).send('Invalid Token');
    }
}

module.exports = { checkAdmin };
