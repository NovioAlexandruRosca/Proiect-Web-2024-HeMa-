const pool = require('../database')
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const sendResetPasswordLink = require('../sendResetPasswordLink');
const {generateToken, destroySession, generateSessionId, setSessionData} = require('../utils/utils');


async function updatePassword(req, res){
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        const {Password,Email} = JSON.parse(body);
        const hashedPassword = await bcrypt.hash(Password, 10);

        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error getting connection from pool:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }

            const updateQuery = 'UPDATE clients SET password = ? WHERE email = ?';

            connection.query(updateQuery, [hashedPassword, Email], (error, results) => {
                connection.release();

                if (error) {
                    console.error('Error updating password:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Password updated successfully' }));
            });
        });
    });
}

async function activateAccount(req, res){
    const queryParams = new URLSearchParams(req.url.split('?')[1] || '');
    let token = queryParams.get('token');
    const tokenParts = token.split('$email=');
    token = tokenParts[0];
    const email = tokenParts[1];

    if (token && email) {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error getting connection from pool:', err);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({ message: 'Internal Server Error' }));
                return;
            }

            const sqlSelect = `SELECT token FROM emailactivationTable WHERE email = ? AND token = ? AND created_at >= NOW() - INTERVAL 1 HOUR`;
            connection.query(sqlSelect, [email, token], (error, results) => {
                if (error) {
                    console.error('Error querying database:', error);
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({ message: 'Internal Server Error' }));
                    connection.release();
                    return;
                }

                if (results.length > 0) {
                    const sqlUpdate = `UPDATE clients SET validated = 1 WHERE email = ?`;
                    connection.query(sqlUpdate, [email], (updateError, updateResults) => {
                        if (updateError) {
                            console.error('Error updating database:', updateError);
                            res.writeHead(500, {'Content-Type': 'application/json'});
                            res.end(JSON.stringify({ message: 'Internal Server Error' }));
                            connection.release();
                            return;
                        }

                        const sqlDelete = `DELETE FROM emailactivationTable WHERE email = ?`;
                        connection.query(sqlDelete, [email], (deleteError, deleteResults) => {
                            if (deleteError) {
                                console.error('Error deleting rows from database:', deleteError);
                            }

                            connection.release();
                            res.writeHead(302, { 'Location': '/login.html' });
                            res.end();
                        });
                    });
                } else {
                    res.writeHead(400, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({ message: 'Invalid token or token expired' }));
                    connection.release();
                }
            });
        });
    } else {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ message: 'Invalid token or email' }));
    }
}

async function resetPassword(req, res){
    let body = '';

    req.on('data', chunk => {
        body += chunk;
    });

    req.on('end', () => {
        const requestData = JSON.parse(body);
        const { email } = requestData;

        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error getting connection from pool:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }
            
            connection.query('Select * from clients where email = ?', [email], (err, results, fields) => {
                if (err) {
                    console.error('Error executing query:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                    return;
                }

                if (results.length === 0) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Email not found');
                } else {
                    const token = generateToken(32);

                    const insertQuery = 'INSERT INTO PasswordResetTokens (email, token) VALUES (?, ?)';
                    connection.query(insertQuery, [email, token], (error, results) => {
                        connection.release();
                        if (error) {
                            console.error('Error executing query:', err);
                            res.writeHead(500);
                            res.end('Error sending email');
                        } else {
                            sendResetPasswordLink(email, token, 1, (error) => {
                                if (error) {
                                    res.writeHead(500);
                                    res.end('Error sending email');
                                } else {
                
                                    console.log("Email sent");
    
                                    res.writeHead(200);
                                    res.end('Email sent successfully');
                                }
                            });
                        }
                    });
                }
            });
        });
    });
}

async function logout(req, res, sessionData){
    if(sessionData.isAdmin == undefined)
        sessionData.isAdmin = 'False';

    if(sessionData.isAdmin == 'True'){
        console.log(`Admin with ID ${sessionData.userId} Logged Out`);
    }else{
        console.log(`User with ID ${sessionData.userId} Logged Out`);
    }
    destroySession(sessionData.userId);
    res.setHeader('Set-Cookie', 'sessionId=; HttpOnly; Max-Age=0');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Logout successful');
}

async function login(req, res, sessionData){
    let body = '';
    req.on('data', (chunk) => {
        body += chunk.toString();
    });
    req.on('end', async () => {
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
                    connection.query('SELECT * FROM admins WHERE email = ?', [Email], async (err, results, fields) => {
                        if (err) {
                            console.error('Error executing query:', err);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal Server Error');
                            return;
                        }

                        if (results.length > 0) {
                            
                            const hashedPassword = results[0].password;
                            const isPasswordValid = await bcrypt.compare(Password, hashedPassword);

                            if (isPasswordValid) {
                                // const sessionId = createSession();
                            
                                const sessionId = setSessionData( results[0].id, 'True');
                                const userData = {sessionId: sessionId, userId: results[0].id, username: results[0].name, isAdmin: 'True'};
                                console.log("TEST ADMIN " + sessionId + " " + userData.userId + " " + userData.isAdmin);
                                // setSessionData(sessionId, userData);
                                console.log(userData);

                                //cookies
                                const cookieValue = `sessionId=${sessionId}; HttpOnly; Max-Age=${24 * 60 * 60}`;
                                res.setHeader('Set-Cookie', cookieValue);

                                console.log(`Admin with ID ${userData.userId} authenticated successfully`);
                                res.writeHead(200, { 'Content-Type': 'text/plain', 'isAdmin': 'Yes' });
                                res.end('OK');
                            }else{
                                console.log('User not found or incorrect credentials');
                                res.writeHead(401, { 'Content-Type': 'text/plain' });
                                res.end('Unauthorized');
                            }
                        } else {
                            console.log('User not found or incorrect credentials');
                            res.writeHead(401, { 'Content-Type': 'text/plain' });
                            res.end('Unauthorized');
                        }

                        connection.release();
                    });
                }else{
                    connection.query('SELECT * FROM clients WHERE email = ?', [Email], async (err, results, fields) => {
                        if (err) {
                            console.error('Error executing query:', err);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal Server Error');
                            return;
                        }
                        
                        if (results.length > 0) {

                            const hashedPassword = results[0].password;
                            const isPasswordValid = await bcrypt.compare(Password, hashedPassword);

                            if (isPasswordValid) {

                                if(results[0].validated == "0"){

                                    console.log('You have to activate your account');
                                    res.writeHead(403, { 'Content-Type': 'text/plain' });
                                    res.end('Forbidden');
                                }else{
                                    // const sessionId = createSession();
                                    
                                    const sessionId = setSessionData(results[0].id, 'False');
                                    const userData = {sessionId: sessionId, userId: results[0].id, username: results[0].name, isAdmin: 'False'};
                                    console.log("TEST CLIENT " + sessionId + " " + userData.userId + " " + userData.isAdmin);
                                    // setSessionData(sessionId, userData);
                                    console.log(userData);

                                    //cookies
                                    const cookieValue = `sessionId=${sessionId}; HttpOnly; Max-Age=${24 * 60 * 60}`;
                                    res.setHeader('Set-Cookie', cookieValue);

                                    console.log(`User with ID ${userData.userId} authenticated successfully`);
                                    res.writeHead(200, { 'Content-Type': 'text/plain', 'isAdmin': 'No' });
                                    res.end('OK');
                                }
                            }else{
                                console.log('User not found or incorrect credentials');
                                res.writeHead(401, { 'Content-Type': 'text/plain' });
                                res.end('Unauthorized');
                            }
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

async function register(req, res){
    let body = '';
    req.on('data', (chunk) => {
        body += chunk.toString();
    });
    req.on('end', async () => {
        try {
            const { Email, Name, Password } = JSON.parse(body);

            const hashedPassword = await bcrypt.hash(Password, 10);

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

                    connection.query('SELECT * FROM banned_users WHERE email = ?', [Email], (err, results) => {
                        if (err) {
                            console.error('Error executing query:', err);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal Server Error');
                            connection.release();
                            return;
                        }

                        if (results.length > 0) {
                            console.log('The email is banned');
                            res.writeHead(409, { 'Content-Type': 'text/plain' });
                            res.end('Conflict: This email is banned');
                            connection.release();
                            return;
                        } 
                        
                        // Insert new user
                        connection.query('INSERT INTO clients (email, name, password) VALUES (?, ?, ?)', [Email, Name, hashedPassword], (err, results, fields) => {
                            if (err) {
                                console.error('Error executing query:', err);
                                res.writeHead(500, { 'Content-Type': 'text/plain' });
                                res.end('Internal Server Error');
                                connection.release();
                                return;
                            }

                            console.log('Inserted ID:', results.insertId); 

                            connection.query('INSERT INTO clients_details (client_id, name) VALUES (?, ?)', 
                            [results.insertId, Name], 
                            (insertError, insertResults) => {
                                connection.release();
                                if (insertError) {
                                    console.error('Error inserting user data:', insertError);
                                    res.writeHead(500, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                                    return;
                                }
                            });

                            connection.query('INSERT INTO badges (client_id) VALUES (?)', 
                            [results.insertId], 
                            (insertError, insertResults) => {
                                connection.release();
                                if (insertError) {
                                    console.error('Error inserting user data:', insertError);
                                    res.writeHead(500, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                                    return;
                                }
                            });
                        

                            const token = generateToken(32);

                            const insertQuery = 'INSERT INTO EmailActivationTable (email, token) VALUES (?, ?)';
                            connection.query(insertQuery, [Email, token], (error, results) => {
                                connection.release();
                                if (error) {
                                    console.error('Error executing query:', err);
                                    res.writeHead(500);
                                    res.end('Error sending email');
                                } else {
                                    sendResetPasswordLink(Email, token, 2, (error) => {
                                        if (error) {
                                            res.writeHead(500);
                                            res.end('Error sending email');
                                        } else {
                        
                                            console.log('New user registered successfully');
                                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                                            res.end('OK');
                                        }
                                    });
                                }
                            });
                    
                        });
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

module.exports = {
    updatePassword,
    activateAccount,
    resetPassword,
    logout,
    login,
    register
};