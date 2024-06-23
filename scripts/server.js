const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const router = require('./router/router');
const devRouter = require('./dev/dev');



// DATA NEEDED TO CONNECT TO THE DATABASE
const pool = require('./database');

// This variable checks to see if the client request is for an html/css... file or is used for registering login, data fetching....
let headerNotModified = true;

// Map to store session data
const sessions = {};

// Function to generate session ID
const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 15);
};


// WE CREATE THE BASE OF THE SERVER
const server = http.createServer(async (req, res) => {

    const cookies = parseCookies(req.headers.cookie)
    const sessionId = cookies.sessionId;

    getSession(sessionId).then(sessionData => {

    const cookieValue = `sessionId=${sessionId}; HttpOnly; Max-Age=${24 * 60 * 60}`;
    res.setHeader('Set-Cookie', cookieValue);


    if(!router(req, res, sessionData)){
        headerNotModified = false;
    }

    if(headerNotModified){
        let filePath = null;

        //CHECKS FOR THE SPECIAL CASE WHEN YOU GET AN URL AND NEED TO RETURN THE TOKEN AS WELL(MINIMZE IT)
        if(req.url.includes(`resetPassword.html`)){
            let filePath = path.join(__dirname, '../html/resetPassword.html');

            const tokenStartIndex = req.url.indexOf('token=') + 'token='.length;
            const tokenEndIndex = req.url.indexOf('$email=');
            const token = req.url.substring(tokenStartIndex, tokenEndIndex) || 'default';
            const email = req.url.split('email=')[1] || 'default';
            console.log('Token:', token);
            console.log('Email:', email);

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500);
                    res.end('Internal Server Error');
                    return;
                }

                const selectQuery = 'SELECT * FROM PasswordResetTokens WHERE token = ? AND email = ?';
                connection.query(selectQuery, [token, email], (error, results) => {
                    if (error) {
                        console.error('Error executing query:', error);
                        res.writeHead(500);
                        res.end('Internal Server Error');
                        connection.release();
                    } else {
                        let errorDeleting = false;
                        if (results.length === 0) {
                            filePath = path.join(__dirname, '../html/error404.html');
                        }else{
                            const expirationTime = new Date(results[0].created_at);
                            expirationTime.setHours(expirationTime.getHours() + 1);
                            const currentTime = new Date();

                            if(currentTime > expirationTime){
                                filePath = path.join(__dirname, '../html/error404.html');
                            }else{
                                const deleteQuery = 'DELETE FROM PasswordResetTokens WHERE email = ?';
                                connection.query(deleteQuery, [email], (deleteError, deleteResults) => {
                                    connection.release();
                                    if (deleteError) {
                                        console.error('Error executing delete query:', deleteError);
                                        res.writeHead(500);
                                        res.end('Internal Server Error');
                                        errorDeleting = true;
                                    }
                                });
                            }
                        }
                        if(!errorDeleting){
                            fs.readFile(filePath, (err, content) => {
                                if (err) {
                                    if (err.code === 'ENOENT') {
                                        res.writeHead(404, { 'Content-Type': 'text/html' });
                                        res.end('404 Not Found');
                                    } else {
                                        res.writeHead(500);
                                        res.end(`Server Error: ${err.code}`);
                                    }
                                } else {
                                    res.writeHead(200, { 'Content-Type': 'text/html', 'email': email });
                                    res.end(content, 'utf-8');
                                }
                            });
                        }
                    }
                });
            });
        }else{  // HERE WAS THE BEGINING OF THE NORMAL PART
            if(req.url == '../Documentatie/Documentatie.html'){
                filePath = 'Documentatie/Documentatie.html';
            }else if(getContentType(req.url) == 'text/html'){
                filePath = './html' + req.url;
            }else if(req.url == '/'){
                filePath = './html/landingPage.html';
            }

            // If they aren't logged in they should be able to see anything but the 4 pages from the second part of the if
            if (!sessionData) {
                if(getContentType(req.url) == 'text/html' && (filePath != './html/landingPage.html' && filePath != './html/login.html' && filePath != './html/register.html' && filePath != './html/resetPassword.html'))
                    filePath = './html/landingPage.html';
            }

            if(sessionData){
            if(getContentType(req.url) == 'text/html')
                    if(sessionData.isAdmin == 'True' && (filePath != './html/admin.html' && filePath != './html/generateReports.html' && filePath != './html/listOfClients.html' && filePath != './html/landingPage.html' && filePath != './html/login.html' && filePath != './html/register.html' && filePath != './html/reportManager.html'))
                        filePath = './html/error404.html';
                    else if(sessionData.isAdmin == 'False' && (filePath == './html/admin.html' || filePath == './html/generateReports.html' || filePath == './html/listOfClients.html'))
                        filePath = './html/error404.html';
            }

            filePath = path.join(__dirname, '..', filePath || req.url);

            const contentType = getContentType(filePath);

            filePath = filePath.split('?')[0];

            fs.readFile(filePath, (err, content) => {
                if (err) {
                    if (err.code === 'ENOENT') {
                        fs.readFile('./html/error404.html', (err, content) =>{
                            res.writeHead(404, { 'Content-Type': 'text/html' });
                            res.end(content, 'utf-8');
                        });
                    } else {
                        res.writeHead(500);
                        res.end(`Server Error: ${err.code}`);
                    }
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf-8');
                }
            });
        }
    }
    headerNotModified = true;

    }).catch(error => {
        // USED FOR ALL THE EXTERNAL API CALLS
        if (devRouter(req, res)) {
            console.error('Error fetching session data:', error.message);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');   
        }
    });
});

// WE MAKE THE SERVER LISTEN FOR REQUESTS
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

// WE CLOSE THE DATABASE WHEN WE CLOSE THE SERVER (Ctrl+C)
process.on('SIGINT', () => {
    console.log('Received SIGINT signal, closing database pool...');
    pool.end((err) => {
        if (err) {
            console.error('Error closing database pool:', err);
            process.exit(1);
        }
        console.log('Database pool closed.');
        process.exit(0);
    });
});

function getContentType(filePath) {
    let extname = path.extname(filePath).toLowerCase();
    
    if(extname.startsWith('.html?id=')){
        extname = '.html'
    }

    switch (extname) {
        case '.html':
            return 'text/html';
        case '.css':
            return 'text/css';
        case '.js':
            return 'text/javascript';
        case '.json':
            return 'application/json';
        case '.png':
            return 'image/png';
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        default:
            return 'application/octet-stream';
    }
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

// Function to parse cookies from the request headers
function parseCookies(cookieHeader) {
    const cookies = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            cookies[parts[0].trim()] = parts[1].trim();
        });
    }
    return cookies;
}

