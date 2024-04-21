const bcrypt = require('bcrypt');
const mysql = require('mysql2');
require('dotenv').config();

// DATA NEEDED TO CONNECT TO THE DATABASE
const pool = mysql.createPool({
    host: process.env.DATABASEHOST,
    user: process.env.DATABASEUSER,
    password: process.env.DATABASEPASSWORD,
    database: process.env.DATABASENAME,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0
});

const adminEmail = 'admin@gmail.com';
const adminPassword = 'admin';
const adminHashedPassword = bcrypt.hashSync(adminPassword, 10);

pool.query('INSERT INTO admins (email, password, name) VALUES (?, ?, ?)', [adminEmail, adminHashedPassword, "Admin"], (error, results) => {
    if (error) {
        console.error('Error adding admin:', error);
    } else {
        console.log('Admin added successfully');
    }
});