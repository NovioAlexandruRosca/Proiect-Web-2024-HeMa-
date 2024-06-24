const pool = require('../database')

function generateToken(length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex') 
        .slice(0, length);
}

const createSession = () => {
    const sessionId = generateSessionId();
    const clientId = -1;
  
    const sql = 'INSERT INTO sessions (session_id, client_id) VALUES (?, ?)';
    const values = [sessionId, clientId];
  
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection from pool:', err);
        return;
      }
  
      connection.query(sql, values, (error, results) => {
        connection.release(); 
  
        if (error) {
          console.error('Error inserting session into database:', error);
        } else {
          console.log('Session inserted into database with ID:', sessionId);
        }
      });
    });
    return sessionId;
  };

const getSession = async (sessionId) => {
    const [rows, fields] = await pool.promise().query(
      `SELECT s.session_id, 
              IF(s.isAdmin = 'True', a.id, c.id) AS userId,
              IF(s.isAdmin = 'True', a.name, c.name) AS username,
              s.isAdmin
       FROM sessions s
       LEFT JOIN clients c ON s.client_id = c.id
       LEFT JOIN admins a ON s.client_id = a.id AND s.isAdmin = 'True'
       WHERE s.session_id = ? LIMIT 1`,
      [sessionId]
    );
  
    return rows.length > 0 ? rows[0] : null;
  };

const setSessionData = (clientId, isAdmin) => {
    const sessionId = generateSessionId();
    console.log( clientId, isAdmin, sessionId);
    const sql = 'INSERT INTO sessions (session_id, client_id, isAdmin) VALUES (?, ?, ?)';
    const values = [sessionId, clientId, isAdmin];
  
    pool.getConnection(async (err, connection) => {
      if (err) {
        console.error('Error getting connection from pool:', err);
        return;
      }
    
    connection.query(sql, values, (error, results) => {
        connection.release(); 
  
        if (error) {
          console.error('Error updating session data:', error);
        } else {
          console.log('Session data updated for sessionId:', sessionId);
        }
      });
    });
    return sessionId;
  };

const destroySession = (clientId) => {
    const sql = 'DELETE FROM sessions WHERE client_id = ?';
    const values = [clientId];
  
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection from pool:', err);
        return;
      }
  
      connection.query(sql, values, (error, results) => {
        connection.release();
  
        if (error) {
          console.error('Error deleting session:', error);
        } else {
          console.log('Session deleted for clientId:', clientId);
        }
      });
    });
  };

const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 15);
};


  module.exports = {
    createSession,
    getSession,
    setSessionData,
    destroySession,
    generateSessionId,
    generateToken
};