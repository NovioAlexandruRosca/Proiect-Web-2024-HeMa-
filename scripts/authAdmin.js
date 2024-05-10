// auth.js
const bcrypt = require('bcrypt');
const pool = require('./databaseConfig');  

async function authenticateAdmin(email, password) {
    const connection = await pool.getConnection();
    try {
        const query = 'SELECT * FROM admins WHERE email = ?';
        const [results] = await connection.query(query, [email]);
        if (results.length > 0) {
            const admin = results[0];
            const isPasswordValid = await bcrypt.compare(password, admin.password);
            if (isPasswordValid) {
                return { success: true, userId: admin.id, username: admin.name, isAdmin: true };
            } else {
                return { success: false, message: "Incorrect password" };
            }
        } else {
            return { success: false, message: "Admin not found" };
        }
    } catch (err) {
        console.error('Authentication error:', err);
        return { success: false, message: "Authentication error" };
    } finally {
        connection.release();
    }
}

module.exports = { authenticateAdmin };
