const http = require('http');
const fs = require('fs');
const path = require('path');
const sendEmail = require('./sendMail');
const querystring = require('querystring');
require('dotenv').config();

const server = http.createServer((req, res) => {

    if (req.method === 'POST' && req.url === '/sendEmail') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const formData = querystring.parse(body);
            console.log(formData);
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
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
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