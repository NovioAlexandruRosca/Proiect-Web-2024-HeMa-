const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const server = http.createServer((req, res) => {

    let filePath = null;

    if(getContentType(req.url) == 'text/html'){
        filePath = './html' + req.url;
    }else if(req.url == '/'){
        filePath = './html/index.html';
    }
    
    filePath = path.join(__dirname, '..', filePath || req.url);

    console.log(filePath);

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