const http = require('http');
const fs = require('fs');
const path = require('path');
const sendEmail = require('./sendMail');
const querystring = require('querystring');
const mysql = require('mysql2');
const { parse } = require('querystring');
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

// This variable checks to see if the client request is for an html/css... file or is used for registering login, data fetching....
let headerNotModified = true;

// Map to store session data
const sessions = {};

// Function to generate session ID
const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 15);
};

// WE CREATE THE BASE OF THE SERVER
const server = http.createServer((req, res) => {

    const cookies = parseCookies(req.headers.cookie)
    const sessionId = cookies.sessionId;
    const sessionData = getSession(sessionId);

    const cookieValue = `sessionId=${sessionId}; HttpOnly; Max-Age=${24 * 60 * 60}`;
    res.setHeader('Set-Cookie', cookieValue);

    if (req.url === '/data') {
        headerNotModified = false;
        // WE TRY TO USE THE DATABASE
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error getting connection from pool:', err);
                return;
            }
            
            // Example query
            connection.query('SELECT * FROM clients', (err, results, fields) => {
                if (err) {
                    console.error('Error executing query:', err);
                    return;
                }
                console.log('Query results:', results);
                
                // Release connection back to pool
                connection.release();
                
            });
        });
    }

    // USED FOR LOGGING OUT
    if(req.method === 'POST' && req.url === '/error404Return'){
        headerNotModified = false;        
        res.writeHead(200, { 'Content-Type': 'text/plain', 'isAdmin': sessionData.isAdmin });
        res.end('Error404 Back To Page');
    }

    // USED FOR LOGGING OUT
    if(req.method === 'POST' && req.url === '/logout'){
        headerNotModified = false;
        if(sessionData.isAdmin == 'True'){
            console.log(`Admin with ID ${sessionData.userId} Logged Out`);
        }else{
            console.log(`User with ID ${sessionData.userId} Logged Out`);
        }
        destroySession(sessionId);
        res.setHeader('Set-Cookie', 'sessionId=; HttpOnly; Max-Age=0');
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Logout successful');
    }

    // USED FOR LOGGING IN(TESTING THE CREDENTIALS)
    if (req.method === 'POST' && req.url === '/testCredentials') {
        headerNotModified = false;
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { Email, Password, IsAdmin } = JSON.parse(body);

                pool.getConnection((err, connection) => {
                    if (err) {
                        console.error('Error getting connection from pool:', err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                        return;
                    }
                    
                    if(IsAdmin === 'true'){
                        connection.query('SELECT * FROM admins WHERE email = ? AND password = ?', [Email, Password], (err, results, fields) => {
                            if (err) {
                                console.error('Error executing query:', err);
                                res.writeHead(500, { 'Content-Type': 'text/plain' });
                                res.end('Internal Server Error');
                                return;
                            }
                            
                            if (results.length > 0) {
                                
                                const sessionId = createSession();
                                
                                //cookies
                                const cookieValue = `sessionId=${sessionId}; HttpOnly; Max-Age=${24 * 60 * 60}`;
                                res.setHeader('Set-Cookie', cookieValue);

                                const userData = {sessionId: sessionId, userId: results[0].id, username: results[0].name, isAdmin: 'True'};
                                setSessionData(sessionId, userData);
                                console.log(userData);

                                console.log(`Admin with ID ${userData.userId} authenticated successfully`);
                                res.writeHead(200, { 'Content-Type': 'text/plain', 'isAdmin': 'Yes' });
                                res.end('OK');
                            } else {
                                console.log('User not found or incorrect credentials');
                                res.writeHead(401, { 'Content-Type': 'text/plain' });
                                res.end('Unauthorized');
                            }

                            connection.release();
                        });
                    }else{
                        connection.query('SELECT * FROM clients WHERE email = ? AND password = ?', [Email, Password], (err, results, fields) => {
                            if (err) {
                                console.error('Error executing query:', err);
                                res.writeHead(500, { 'Content-Type': 'text/plain' });
                                res.end('Internal Server Error');
                                return;
                            }
                            
                            if (results.length > 0) {

                                const sessionId = createSession();
                                
                                //cookies
                                const cookieValue = `sessionId=${sessionId}; HttpOnly; Max-Age=${24 * 60 * 60}`;
                                res.setHeader('Set-Cookie', cookieValue);

                                const userData = {sessionId: sessionId, userId: results[0].id, username: results[0].name, isAdmin: 'False'};
                                setSessionData(sessionId, userData);
                                console.log(userData);

                                console.log(`User with ID ${userData.userId} authenticated successfully`);
                                res.writeHead(200, { 'Content-Type': 'text/plain', 'isAdmin': 'No' });
                                res.end('OK');
                            } else {
                                console.log('User not found or incorrect credentials');
                                res.writeHead(401, { 'Content-Type': 'text/plain' });
                                res.end('Unauthorized');
                            }

                            connection.release();
                        });
                    }
                });
            } catch (error) {
                console.error('Error parsing JSON:', error);
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Bad Request');
            }
        });
    }

    // USED FOR REGISTERING
    if (req.method === 'POST' && req.url === '/registerCredentials') {
        headerNotModified = false;
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { Email, Name, Password } = JSON.parse(body);
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.error('Error getting connection from pool:', err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                        return;
                    }
    
                    // Check if the email already exists
                    connection.query('SELECT * FROM clients WHERE email = ?', [Email], (err, results, fields) => {
                        if (err) {
                            console.error('Error executing query:', err);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal Server Error');
                            connection.release();
                            return;
                        }
                        
                        if (results.length > 0) {
                            console.log('The email already exists');
                            res.writeHead(401, { 'Content-Type': 'text/plain' });
                            res.end('Unauthorized');
                            connection.release();
                            return;
                        } 
                        
                        // Insert new user
                        connection.query('INSERT INTO clients (email, name, password) VALUES (?, ?, ?)', [Email, Name, Password], (err, results, fields) => {
                            if (err) {
                                console.error('Error executing query:', err);
                                res.writeHead(500, { 'Content-Type': 'text/plain' });
                                res.end('Internal Server Error');
                                connection.release();
                                return;
                            }
                        
                            console.log('New user registered successfully');
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('OK');
                        
                            connection.release();
                        });
                    });
                });
            } catch (error) {
                console.error('Error parsing JSON:', error);
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Bad Request');
            }
        });
    }

    // IF THE CLIENTS SENT A CONTACT FORM
    if (req.method === 'POST' && req.url === '/sendEmail') {
        headerNotModified = false;

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const formData = JSON.parse(body);
            sendEmail(formData, (error) => {
                if (error) {
                    res.writeHead(500);
                    res.end('Error sending email');
                } else {

                    pool.getConnection((err, connection) => {
                        if (err) {
                            console.error('Error getting connection from pool:', err);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal Server Error');
                            return;
                        }
                        
                        connection.query('INSERT INTO sentemails (account_email, sender_name, sender_email, recipient_email, subject, message) VALUES ("alexandrurosca434", ?, ?, ?, ?, ?)', [formData.nume, formData.gmail, process.env.MAILADDRESS, formData.subject, formData.message], (err, results, fields) => {
                            if (err) {
                                console.error('Error executing query:', err);
                                res.writeHead(500, { 'Content-Type': 'text/plain' });
                                res.end('Internal Server Error');
                                return;
                            }
                        
                            connection.release();
                            res.writeHead(200);
                            res.end('Email sent successfully');
                        });
                    });
                }
            });
        });
    }

    // OTHERWISE IF IT REQUESTED AN HTML,CSS,JS OR ANYTHING ELSE
    if(headerNotModified){
        let filePath = null;

        if(req.url == '../Documentatie/Documentatie.html'){
            filePath = 'Documentatie/Documentatie.html';
        }else if(getContentType(req.url) == 'text/html'){
            filePath = './html' + req.url;
        }else if(req.url == '/'){
            filePath = './html/landingPage.html';
        }

        // If they aren't logged in they should be able to see anything but the 3 pages from the second part of the if
        if (!sessionData) {
            if(getContentType(req.url) == 'text/html' && (filePath != './html/landingPage.html' && filePath != './html/login.html' && filePath != './html/register.html'))
                filePath = './html/landingPage.html';
        }

        if(sessionData){
           if(getContentType(req.url) == 'text/html')
                if(sessionData.isAdmin == 'True' && (filePath != './html/admin.html' && filePath != './html/generateReports.html' && filePath != './html/listOfClients.html'))
                    filePath = './html/error404.html';
                else if(sessionData.isAdmin == 'False' && (filePath == './html/admin.html' || filePath == './html/generateReports.html' || filePath == './html/listOfClients.html'))
                    filePath = './html/error404.html';
        }

        filePath = path.join(__dirname, '..', filePath || req.url);

        const contentType = getContentType(filePath);
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
    headerNotModified = true;
});

// WE MAKE THE SERVER LISTEN FOR REQUESTS
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
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
    const extname = path.extname(filePath).toLowerCase();
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

// Function to create session
const createSession = () => {
    const sessionId = generateSessionId();
    sessions[sessionId] = {};
    return sessionId;
};

// Function to get session
const getSession = (sessionId) => {
    return sessions[sessionId];
};

// Function to set session data
const setSessionData = (sessionId, data) => {
    sessions[sessionId] = data;
};

// Function to destroy session
const destroySession = (sessionId) => {
    delete sessions[sessionId];
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