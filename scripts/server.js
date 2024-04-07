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

let static = true;

// WE CREATE THE BASE OF THE SERVER
const server = http.createServer((req, res) => {

    if (req.url === '/data') {
        static = false;
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

    if (req.method === 'POST' && req.url === '/testCredentials') {
        static = false;
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { Email, Password } = JSON.parse(body);
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.error('Error getting connection from pool:', err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                        return;
                    }
                    
                    connection.query('SELECT * FROM clients WHERE email = ? AND password = ?', [Email, Password], (err, results, fields) => {
                        if (err) {
                            console.error('Error executing query:', err);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal Server Error');
                            return;
                        }
                        
                        if (results.length > 0) {
                            console.log('User authenticated successfully:', results[0]);
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('OK');
                        } else {
                            console.log('User not found or incorrect credentials');
                            res.writeHead(401, { 'Content-Type': 'text/plain' });
                            res.end('Unauthorized');
                        }

                        connection.release();
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
        static = false;

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const formData = querystring.parse(body);
            sendEmail(formData, (error) => {
                if (error) {
                    res.writeHead(500);
                    res.end('Error sending email');
                } else {
                    res.writeHead(200);
                    res.end('Email sent successfully');
                }
            });
        });
    }

    // OTHERWISE IF IT REQUESTED AN HTML,CSS,JS OR ANYTHING ELSE
    if(static){
        let filePath = null;

        if(getContentType(req.url) == 'text/html'){
            filePath = './html' + req.url;
        }else if(req.url == '/'){
            filePath = './html/login.html';
        }
        
        filePath = path.join(__dirname, '..', filePath || req.url);

        const contentType = getContentType(filePath);
        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 Not Found</h1>');
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
    static = true;
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