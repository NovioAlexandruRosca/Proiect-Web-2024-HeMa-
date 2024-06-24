const pool = require('../database')
const path = require('path');
const fs = require('fs');
const sendEmail = require('../sendMail');

async function generateRss(req, res){
    const rssPath = path.join(__dirname, '../../rss/rss.xml');
    try {
        const data = fs.readFileSync(rssPath);
        res.writeHead(200, { 'Content-Type': 'application/rss+xml' });
        res.end(data);
    } catch (err) {
        console.error('Error reading RSS file:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error reading RSS file: ' + err.message);
    }
}

async function returnError404(req, res, sessionData){
    let isAdmin = sessionData && sessionData.isAdmin ? sessionData.isAdmin : false;

    res.writeHead(200, { 'Content-Type': 'text/plain', 'isAdmin': isAdmin });
    res.end('Error404 Back To Page');
}

async function sendContactMail(req, res){
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

async function getOpenApi(req, res){
    const filePath = path.join(__dirname, './openapi.yaml');
    console.log(filePath);
    fs.readFile(filePath, 'utf-8', (err, content) => {
        if (err) {
            res.writeHead(500);
            res.end('Server Error');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/yaml' });
            res.end(content);
        }
    });
}

module.exports = {
    generateRss,
    returnError404,
    sendContactMail,
    getOpenApi
};