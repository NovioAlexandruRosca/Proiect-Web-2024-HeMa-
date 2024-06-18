const http = require('http');
const fs = require('fs');
const path = require('path');
const sendEmail = require('./sendMail');
const sendResetPasswordLink = require('./sendResetPasswordLink');
const querystring = require('querystring');
const mysql = require('mysql2');
const { parse } = require('querystring');
require('dotenv').config();
const bcrypt = require('bcrypt');
const crypto = require('crypto');

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
const server = http.createServer(async (req, res) => {

    const cookies = parseCookies(req.headers.cookie)
    const sessionId = cookies.sessionId;

    getSession(sessionId)
    .then(sessionData => {

    // const sessionData = getSession(sessionId);

    const cookieValue = `sessionId=${sessionId}; HttpOnly; Max-Age=${24 * 60 * 60}`;
    res.setHeader('Set-Cookie', cookieValue);

    //USED TO update the password of a client
    if (req.method === 'PUT' && req.url === '/api/updatePassword') {
        headerNotModified = false; 
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

    // USED TO update the data of a specific plant
    if(req.method === 'PUT' && req.url === '/api/updatePlant'){
        headerNotModified = false;        
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); 
        });

        req.on('end', () => {
            const data = JSON.parse(body);

            const formData = data.formData;
            const plantID = data.plantID;
            const {hashtags, dateOfCollection, commonName, scientificName, family, genus, species, place, color} = formData;


            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                    return;
                }
            
                connection.query(`UPDATE plants
                SET hashtags = ?, 
                    collection_date = ?, 
                    common_name = ?, 
                    scientific_name = ?, 
                    family = ?, 
                    genus = ?, 
                    species = ?, 
                    place_of_collection = ?, 
                    color = ?
                WHERE plant_id = ?`, 
                            [hashtags, dateOfCollection == '' ? null: dateOfCollection , commonName, scientificName, family, genus, species, place, color, plantID],
                             (err, result) => {
                if (err) {
                    console.error('Error updating collection:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                    connection.release();
                    return;
                }
        
                console.log(`Plant with ID ${plantID} updated successfully`);
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Collection updated successfully');
                
                connection.release();
            });
            });
            
        });

    }

    // USED TO update the latest time a collection was modified
    if(req.method === 'PUT' && req.url === '/api/modifyCollection'){
        headerNotModified = false;        
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); 
        });

        req.on('end', () => {
            const {collectionId} = JSON.parse(body);

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                    return;
                }

                const modificationTime = new Date();
            
                connection.query('UPDATE plant_collections SET modification_time = ? WHERE collection_id = ?', 
                             [ modificationTime, collectionId], 
                             (err, result) => {
                if (err) {
                    console.error('Error updating collection:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                    connection.release();
                    return;
                }
        
                console.log(`Collection with ID ${collectionId} updated successfully`);
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Collection updated successfully');
                
                connection.release();
            });
            });
            
        });

    }

    // USED FOR deleting a blog
    if(req.method === 'PUT' && req.url === '/api/updateCollection'){
        headerNotModified = false;        
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); 
        });

        req.on('end', () => {
            const collectionData = JSON.parse(body);

            console.log(collectionData);

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                    return;
                }

                const modificationTime = new Date();
            
                connection.query('UPDATE plant_collections SET name = ?, description = ?, is_shared = ?, modification_time = ? WHERE collection_id = ?', 
                             [collectionData.title, collectionData.description, collectionData.isShared, modificationTime, collectionData.collectionId], 
                             (err, result) => {
                if (err) {
                    console.error('Error updating collection:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                    connection.release();
                    return;
                }
        
                console.log(`Collection with ID ${collectionData.collectionId} updated successfully`);
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Collection updated successfully');
                
                connection.release();
            });
            });
            
        });

    }

    // USED FOR incrementing the number of visits a plant has gotten
    if(req.method === 'PUT' && req.url === '/api/updatePlantVisits'){
        headerNotModified = false;        
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); 
        });

        req.on('end', async () => {
            try {
              const data = JSON.parse(body); 
              const plantId = data.plantId; 
      
              const sql = `UPDATE plants SET number_of_visits = number_of_visits + 1 WHERE plant_id = ?`;
      
              pool.getConnection((err, connection) => {
                if (err) {
                  console.error('Error getting connection from pool:', err);
                  res.writeHead(500, { 'Content-Type': 'text/plain' });
                  res.end('Internal Server Error');
                  return;
                }
      
                connection.query(sql, [plantId], (err, results) => {
                  if (err) {
                    console.error('Error executing query:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                  } else {
                    if (results.affectedRows === 1) {
                      res.writeHead(200, { 'Content-Type': 'text/plain' });
                      res.end('Number of visits updated successfully');
                    } else {
                      res.writeHead(404, { 'Content-Type': 'text/plain' });
                      res.end('Plant not found');
                    }
                  }
                  connection.release(); 
                });
              });
            } catch (err) {
              console.error(err);
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Internal Server Error');
            }
          });

    }

    // USED FOR deleting plants from a collection
    if (req.method === 'DELETE' && req.url === '/api/deletePlant') {
        headerNotModified = false;
        let body = '';
    
        req.on('data', chunk => {
            body += chunk;
        });
    
        req.on('end', () => {
            const requestData = JSON.parse(body);
            const { plantId } = requestData;
    
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }
    
                connection.query('DELETE FROM plants WHERE plant_id = ?', [plantId], (error, results) => {
                    connection.release();
                    if (error) {
                        console.error('Error deleting plant:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        return;
                    }
    
                    console.log(`Plant with ID ${plantId} deleted successfully`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                });
            });
        });
    }
    
    // USED FOR deleting a comment from a blog
    if(req.method === 'DELETE' && req.url === '/api/deleteCollection'){
        headerNotModified = false;        
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); 
        });

        req.on('end', () => {
            const {collectionId} = JSON.parse(body);

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                    return;
                }
            
                if (!collectionId) {
                    console.log('Post ID is required');
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('Post ID is required');
                    connection.release();
                    return;
                }
            
                connection.query('DELETE FROM plant_collections WHERE collection_id = ?', [collectionId], (err, result) => {
                    if (err) {
                        console.error('Error deleting comment:', err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                        connection.release();
                        return;
                    }
            
                    if (result.affectedRows > 0) {
                        console.log(`Collection with ID ${collectionId} deleted successfully`);
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('Post deleted successfully');
                    } else {
                        console.log(`Collection with ID ${collectionId} not found`);
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('Post not found');
                    }
            
                    connection.release();
                });
            });
            
        });

    }

    // USED FOR deleting a blog
    if(req.method === 'DELETE' && req.url === '/api/deletePost'){
        headerNotModified = false;        
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); 
        });

        req.on('end', () => {
            const { postId} = JSON.parse(body);

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                    return;
                }
            
                if (!postId) {
                    console.log('Post ID is required');
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('Post ID is required');
                    connection.release();
                    return;
                }
            
                connection.query('DELETE FROM blog_posts WHERE id = ?', [postId], (err, result) => {
                    if (err) {
                        console.error('Error deleting post:', err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                        connection.release();
                        return;
                    }
            
                    if (result.affectedRows > 0) {
                        console.log(`Post with ID ${postId} deleted successfully`);
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('Post deleted successfully');
                    } else {
                        console.log(`Post with ID ${postId} not found`);
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('Post not found');
                    }
            
                    connection.release();
                });
            });
            
        });

    }

    // USED FOR deleting a comment from a blog
    if(req.method === 'DELETE' && req.url === '/api/deleteComment'){
        headerNotModified = false;        
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); 
        });

        req.on('end', () => {
            const { commentId} = JSON.parse(body);

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                    return;
                }
            
                if (!commentId) {
                    console.log('Post ID is required');
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('Post ID is required');
                    connection.release();
                    return;
                }
            
                connection.query('DELETE FROM comments WHERE id = ?', [commentId], (err, result) => {
                    if (err) {
                        console.error('Error deleting comment:', err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                        connection.release();
                        return;
                    }
            
                    if (result.affectedRows > 0) {
                        console.log(`Comment with ID ${commentId} deleted successfully`);
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('Post deleted successfully');
                    } else {
                        console.log(`Comment with ID ${commentId} not found`);
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('Post not found');
                    }
            
                    connection.release();
                });
            });
            
        });

    }

    if(req.method === 'GET' && req.url === '/rss'){
        headerNotModified = false;     
        const rssPath = path.join(__dirname, '../rss/rss.xml');
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

    // USED FOR getting the users name
    if(req.method === 'GET' && req.url === '/api/user'){
        headerNotModified = false;        
        res.writeHead(200, { 'Content-Type': 'text/plain', 'Name' : sessionData.username });
        res.end('Error404 Back To Page');
    }

    // USED FOR getting the users id
    if(req.method === 'GET' && req.url === '/api/id'){
        headerNotModified = false;        
        res.writeHead(200, { 'Content-Type': 'text/plain', 'userId' : sessionData.userId });
        res.end('Error404 Back To Page');
    }

    // USED FOR getting the users name
    if (req.method === 'GET' && req.url === '/api/blogs') {
        headerNotModified = false; 
        pool.query('SELECT * FROM blog_posts', (error, results, fields) => {
            if (error) {
                console.error('Error fetching blogs from database:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
            } else {
                // Format the retrieved data into JSON format
                const jsonData = JSON.stringify(results);

                // Send the JSON response back to the client
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(jsonData);
            }
        });
    }

    // USED FOR activating an account
    if (req.method === 'GET' && req.url.includes('/api/activateAccount')) {
        headerNotModified = false; 
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
    
    // USED FOR getting the id of the most popular plant
    if (req.method === 'GET' && req.url === '/api/mostPopularPlantId') {
        headerNotModified = false;
      
        pool.getConnection((err, connection) => {
          if (err) {
            console.error('Error getting connection from pool:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
            return;
          }
      
          connection.query('SELECT plant_id FROM plants ORDER BY number_of_visits DESC LIMIT 1', (err, results, fields) => {
            if (err) {
              console.error('Error executing query:', err);
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Internal Server Error');
              return;
            }
      
            if (results.length > 0) {
              const firstPlantId = results[0].plant_id; 
              console.log(firstPlantId);
              res.writeHead(200, { 'Content-Type': 'text/plain' });
              res.end(JSON.stringify({ plantId: firstPlantId })); 
            } else {
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('No plants found'); 
            }
          });
      
          connection.release(); 
        });
    }

    // USED FOR getting the 10 most popular plants in the database
    if (req.method === 'GET' && req.url === '/api/mostPopularPlants') {
        headerNotModified = false;
      
        pool.getConnection((err, connection) => {
          if (err) {
            console.error('Error getting connection from pool:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
            return;
          }
      
          connection.query('SELECT * FROM plants ORDER BY number_of_visits DESC LIMIT 10', (err, results, fields) => {
            if (err) {
              console.error('Error executing query:', err);
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Internal Server Error');
              return;
            }
      
            if (results.length > 0) {
              res.writeHead(200, { 'Content-Type': 'text/plain' });
              res.end(JSON.stringify(results)); 
            } else {
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('No plants found'); 
            }
          });
      
          connection.release(); 
        });
    }

    // USED FOR getting all the plants from the database
    if (req.method === 'GET' && req.url === '/api/allPlants') {
        headerNotModified = false;
      
        pool.getConnection((err, connection) => {
          if (err) {
            console.error('Error getting connection from pool:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
            return;
          }
      
          connection.query('SELECT p.plant_id, p.owner_id, p.collection_id, p.hashtags, p.common_name, p.scientific_name, p.family, p.genus, p.species ' +
            'FROM plants p ' +
            'JOIN plant_collections pc ON p.collection_id = pc.collection_id ' +
            'WHERE pc.is_shared = 1;', (err, results, fields) => {
                if (err) {
                    console.error('Error executing query:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                    return;
                }

                if (results.length > 0) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results)); 
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('No shared plants found'); 
                }
                });

      
          connection.release(); 
        });
    }

    // USED FOR reseting password
    if (req.method === 'POST' && req.url === '/api/reset-password') {
        headerNotModified = false; 
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

    // USED FOR modifying badge value
    if (req.method === 'POST' && req.url === '/api/modifyBadge') {
        headerNotModified = false;
        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {
            const requestData = JSON.parse(body);
            const { clientId, badgeNumber } = requestData;

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }

                const updateBadgeQuery = `UPDATE badges SET badge${badgeNumber} = 1 WHERE client_id = ?`;

                connection.query(updateBadgeQuery, [clientId], (error, results) => {
                    connection.release();

                    if (error) {
                        console.error('Error updating badge value:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        return;
                    }

                    console.log(`Badge ${badgeNumber} value updated successfully for client ${clientId}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                });
            });
        });
    }

    // USED FOR fetching badge data
    if (req.method === 'POST' && req.url === '/api/badges') {
        headerNotModified = false;
        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {
            const requestData = JSON.parse(body);
            const { clientId } = requestData;

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }

                connection.query('SELECT badge1, badge2, badge3, badge4, badge5 FROM badges WHERE client_id = ?', [clientId], (error, results) => {
                    connection.release();

                    if (error) {
                        console.error('Error fetching badge data:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        return;
                    }

                    const badgeData = results[0];

                    console.log('Badge data fetched successfully:', badgeData);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(badgeData));
                });
            });

        });
    }

    // USED FOR creating a plant layout(when you click the + sign in a collection)
    if (req.method === 'POST' && req.url === '/api/createPlantLayout') {
        headerNotModified = false;
        let body = '';
    
        req.on('data', chunk => {
        body += chunk;
        });
    
        req.on('end', () => {
        const requestData = JSON.parse(body);
        const { clientId, collectionId } = requestData;


        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error getting connection from pool:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                return;
            }

            connection.query('INSERT INTO plants (owner_id, collection_id) VALUES (?, ?)', [clientId, collectionId], (error, results) => {
                connection.release();
                if (error) {
                    console.error('Error inserting plant layout:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }

                const id = results.insertId;

                console.log(`A plant with the collection_id: ${collectionId} and the clientId: ${clientId} has been added`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({id}));
            });
        });
        });
    }
  
    // USED FOR getting plants of a specific collection
    if (req.method === 'POST' && req.url === '/api/plantsOfCollection') {
        headerNotModified = false;
        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {
            const requestData = JSON.parse(body);
            const { collectionId } = requestData;

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }

                connection.query('SELECT plant_id, owner_id, collection_id, collection_date, hashtags, common_name, scientific_name, family, genus, species, place_of_collection, color FROM plants WHERE collection_id = ?', [collectionId], (error, results) => {
                    connection.release();
                    if (error) {
                        console.error('Error querying plants:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        return;
                    }

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                });
            });
        });
    }

     // USED FOR getting the details of a specific plant
    if (req.method === 'POST' && req.url === '/api/plantData') {
        headerNotModified = false;
        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {
            const requestData = JSON.parse(body);
            const { plantId } = requestData;

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }

                connection.query('SELECT plants.*, clients.name as user, plant_collections.name as title FROM plants JOIN clients on plants.owner_id = clients.id JOIN plant_collections ON plants.collection_id = plant_collections.collection_id WHERE plant_id = ?', [plantId], (error, results) => {
                    connection.release();
                    if (error) {
                        console.error('Error querying plants:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        return;
                    }

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results[0]));
                });
            });
        });
    }

    // USED TO create a relation between 2 clients(following)
    if(req.method === 'POST' && req.url === '/api/follow') {
        headerNotModified = false;
    
        let data = '';
        
        req.on('data', chunk => {
            data += chunk;
        });
    
        req.on('end', () => {
            const requestData = JSON.parse(data);
            const followerId = sessionData.userId;
            const followedId = requestData.clientId;

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }
    
                const selectQuery = 'SELECT * FROM followers WHERE follower_id = ? AND followed_id = ?';
                const selectValues = [followerId, followedId];
    
                connection.query(selectQuery, selectValues, (selectError, selectResults) => {
                    if (selectError) {
                        console.error('Error checking follow relationship:', selectError);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        connection.release();
                        return;
                    }
    
                    if (selectResults.length > 0) {
                        const deleteQuery = 'DELETE FROM followers WHERE follower_id = ? AND followed_id = ?';
                        const deleteValues = [followerId, followedId];
    
                        connection.query(deleteQuery, deleteValues, (deleteError, deleteResult) => {
                            connection.release();
                            if (deleteError) {
                                console.error('Error deleting follow relationship:', deleteError);
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                                return;
                            }
    
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ deleted: true }));
                        });
                    } else {
                        const insertQuery = 'INSERT INTO followers (follower_id, followed_id) VALUES (?, ?)';
                        const insertValues = [followerId, followedId];
    
                        connection.query(insertQuery, insertValues, (insertError, insertResult) => {
                            connection.release();
                            if (insertError) {
                                console.error('Error inserting follow relationship:', insertError);
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                                return;
                            }
    
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ deleted: false }));
                        });
                    }
                });
            });
            
        });
    }
    
    //USED TO check if two clients are following eachother
    if (req.method === 'POST' && req.url === '/api/userName') {
        headerNotModified = false; 
        let data = '';
        
        req.on('data', chunk => {
            data += chunk;
        });
    
        req.on('end', () => {
            const requestData = JSON.parse(data);
            const id = requestData.clientId;
    
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }
    
                connection.query('SELECT name FROM clients WHERE id = ?', [id], (error, results) => {
                    connection.release();
                    if (error) {
                        console.error('Error querying relationship:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        return;
                    }
    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                });
            });
        });
    }

    //USED TO check if two clients are following eachother
    if (req.method === 'POST' && req.url === '/api/checkRelationship') {
        headerNotModified = false; 
        let data = '';
        
        req.on('data', chunk => {
            data += chunk;
        });
    
        req.on('end', () => {
            const requestData = JSON.parse(data);
            const followerId = sessionData.userId;
            const followedId = requestData.clientId;
    
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }
    
                connection.query('SELECT * FROM followers WHERE follower_id = ? AND followed_id = ?', [followerId, followedId], (error, results) => {
                    connection.release();
                    if (error) {
                        console.error('Error querying relationship:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        return;
                    }
    
                    let exists = false;

                    if (results.length > 0) {
                        exists = true;
                    }
    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ exists }));
                });
            });
        });
    }

    //USED TO get all the clients a specific client follows
    if (req.method === 'POST' && req.url === '/api/getFollowing') {
        headerNotModified = false; 
        let data = '';
        
        req.on('data', chunk => {
            data += chunk;
        });
    
        req.on('end', () => {
            const requestData = JSON.parse(data);
            const followedId = requestData.clientId;
    
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }
    
                connection.query('SELECT * FROM followers WHERE follower_id = ?', [followedId], (error, results) => {
                    connection.release();
                    if (error) {
                        console.error('Error querying relationship:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        return;
                    }
    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                });
            });
        });
    }

    // USED FOR getting the details of a client when he goes in his profile
    if (req.method === 'POST' && req.url === '/api/clientData') {
        headerNotModified = false; 
        let data = '';
        
        req.on('data', chunk => {
            data += chunk;
        });

        req.on('end', () => {
            const client_id  = JSON.parse(data);

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }

                connection.query('SELECT * FROM clients_details WHERE client_id = ?', [client_id.clientId], (error, results) => {
                    connection.release();
                    if (error) {
                        console.error('Error querying comments:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        return;
                    }

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                });
            });
        });
    } 

    // USED TO create a new plant collection
    if (req.method === 'POST' && req.url === '/api/createCollection') {
        headerNotModified = false; 
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error getting connection from pool:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                return;
            }
    
            connection.query('INSERT INTO plant_collections (client_id, name, creation_time, modification_time) VALUES (?, ?, NOW(), NOW())', 
                            [sessionData.userId, 'New Collection'], 
                            (insertError, insertResults) => {
                connection.release();
                if (insertError) {
                    console.error('Error inserting collection data:', insertError);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }

                const insertedId = insertResults.insertId;
    
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, collectionId: insertedId }));
            });
        });
    }

    // USED TO get the data of a specific collection
    if (req.method === 'POST' && req.url === '/api/collectionData') {
        headerNotModified = false; 
        let data = '';
        
        req.on('data', chunk => {
            data += chunk;
        });

        req.on('end', () => {
            const collectionId  = JSON.parse(data);

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }

                connection.query('SELECT plant_collections.*, clients.name as clientName FROM plant_collections JOIN clients ON clients.id = client_id WHERE collection_id = ? ', [collectionId.collectionId], (error, results) => {
                    connection.release();
                    if (error) {
                        console.error('Error querying comments:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        return;
                    }

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                });
            });
        });
    }
    
    // USED TO get all the plant collections of a user
    if (req.method === 'POST' && req.url === '/api/clientCollections') {
        headerNotModified = false; 
        let data = '';
        
        req.on('data', chunk => {
            data += chunk;
        });

        req.on('end', () => {
            const clientId  = JSON.parse(data);

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }

                connection.query('SELECT * FROM plant_collections WHERE client_id = ?', [clientId.clientId], (error, results) => {
                    connection.release();
                    if (error) {
                        console.error('Error querying comments:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        return;
                    }

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                });
            });
        });
    }

    // USED FOR updating the user data
    if (req.method === 'POST' && req.url === '/api/updateUser') {
        headerNotModified = false; 
        let body = '';
    
            // Collect request body data
        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const formData = JSON.parse(body);
        
            console.log(formData);

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }
        
                const { name, occupation, city, street, number, facebook, github, Instagram, twitter } = formData;

                connection.query('SELECT * FROM clients_details WHERE client_id = ?', [sessionData.userId], (selectError, selectResults) => {
                    if (selectError) {
                        console.error('Error checking if user exists:', selectError);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        connection.release();
                        return;
                    }
        
                    if (selectResults.length > 0) {
                        connection.query('UPDATE clients_details SET name = ? ,occupation = ?, city = ?, street = ?, house_number = ?, facebook_link = ?, github_link = ?, instagram_link = ?, twitter_link = ? WHERE client_id = ?', 
                                        [name, occupation, city, street, number, facebook, github, Instagram, twitter, sessionData.userId], 
                                        (updateError, updateResults) => {
                            connection.release();
                            if (updateError) {
                                console.error('Error updating user data:', updateError);
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                                return;
                            }
                            connection.query('UPDATE clients SET name = ? WHERE id = ?', [name, sessionData.userId], (error, results) => {
                                connection.release();
                                if (error) {
                                    console.error('Error updating client name:', error);
                                    res.writeHead(500, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                                    return;
                                }
                    
                                const userData = {sessionId: sessionData.sessionId, userId: sessionData.userId, username: name, isAdmin: sessionData.isAdmin};
                                setSessionData(sessionId, userData);

                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ success: true }));
                            });
                        });
                    } else {
                        connection.query('INSERT INTO clients_details (client_id, name, occupation, city, street, house_number, facebook_link, github_link, instagram_link, twitter_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
                                        [sessionData.userId, name, occupation, city, street, number, facebook, github, Instagram, twitter], 
                                        (insertError, insertResults) => {
                            connection.release();
                            if (insertError) {
                                console.error('Error inserting user data:', insertError);
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                                return;
                            }
                            connection.query('UPDATE clients SET name = ? WHERE id = ?', [name, sessionData.userId], (error, results) => {
                                connection.release();
                                if (error) {
                                    console.error('Error updating client name:', error);
                                    res.writeHead(500, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                                    return;
                                }
                    
                                const userData = {sessionId: sessionData.sessionId, userId: sessionData.userId, username: name, isAdmin: sessionData.isAdmin};
                                setSessionData(sessionId, userData);

                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ success: true }));
                            });
                        });
                    }
                });
            });
        });
        
    }

    // USED FOR getting the blog comments for a post
    if (req.method === 'POST' && req.url === '/api/blogComments') {
        headerNotModified = false; 
        let data = '';
        
        req.on('data', chunk => {
            data += chunk;
        });

        req.on('end', () => {
            const postId  = JSON.parse(data);

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }

                connection.query('SELECT * FROM comments WHERE post_id = ?', [postId.postId], (error, results) => {
                    connection.release();
                    if (error) {
                        console.error('Error querying comments:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        return;
                    }

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                });
            });
        });
    } 

    // USED FOR ADDING COMMENTS TO POSTS
    if (req.method === 'POST' && req.url === '/api/blogComment') {
        headerNotModified = false; 
        let body = '';

        req.on('data', (chunk) => {
            body += chunk;
        });

        req.on('end', () => {
            const postData = JSON.parse(body);

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                    return;
                }
            
                connection.query('INSERT INTO comments (post_id, user_id, user_name, comment_text) VALUES (?, ?, ?, ?)',
                    [postData.postId, sessionData.userId, sessionData.username, postData.text],
                    (error, result) => {
                        if (error) {
                            console.error('Error inserting comment:', error);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal Server Error');
                        } else {
                            const insertedId = result.insertId;

                            connection.query('SELECT * FROM comments WHERE id = ?', [insertedId], (error2, results2) => {
                                if (error2) {
                                    console.error('Error retrieving inserted comment:', error2);
                                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                                    res.end('Internal Server Error');
                                } else {
                                    const insertedComment = results2[0];
                                    console.log('Comment inserted successfully:', insertedComment);

                                    res.writeHead(200, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify(insertedComment));
                                }
                            });
                        }
                    });
                connection.release();
            });
            
            
        });
    }

    // USED FOR GETTING A SPECIFIC BLOG DATA 
    if (req.method === 'POST' && req.url === '/api/blogData') {
        headerNotModified = false; 
        let body = '';
      
        req.on('data', (chunk) => {
            body += chunk;
        });
      
        req.on('end', () => {
            try {
                const postData = JSON.parse(body);
                const postId = postData.postId;

                pool.getConnection((err, connection) => {
                    if (err) {
                        console.error('Error getting connection from pool:', err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                        return;
                    }

                    connection.query('SELECT b.id, b.user_id, b.title, b.description, c.name AS client_name, b.post_date FROM blog_posts b INNER JOIN clients c ON b.user_id = c.id WHERE b.id = ?', [postId], async (error, results) => {
                        if (error) {
                            console.error('Error querying blog post data:', error);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal Server Error');
                            connection.release();
                            return;
                        }

                        if (results.length === 0) {
                            res.writeHead(404, { 'Content-Type': 'text/plain' });
                            res.end('Post Not Found');
                            connection.release();
                            return;
                        }
    
                        const postData = results[0];
    
                        connection.query('SELECT * FROM blog_post_sections WHERE post_id = ?', [postId], async (error1, sections) => {
                            if (error1) {
                                console.error('Error querying blog post sections:', error1);
                                res.writeHead(500, { 'Content-Type': 'text/plain' });
                                res.end('Internal Server Error');
                                connection.release();
                                return;
                            }
    
                            for (let i = 0; i < sections.length; i++) {
                                const section = sections[i];
                                const images = await new Promise((resolve, reject) => {
                                    connection.query('SELECT image_url FROM section_images WHERE section_id = ?', [section.id], (error2, results) => {
                                        if (error2) {
                                            console.error('Error querying section images:', error2);
                                            reject(error2);
                                            return;
                                        }
                                        const encodedImages = results.map(result => `${result.image_url}`);
                                        resolve(encodedImages);
                                    });
                                });
                                section.images = images;
                            }
    
                            connection.release();
    
                            const responseData = {
                                post: postData,
                                sections: sections
                            };
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify(responseData));
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
    
    // USED FOR SAVING BLOGS
    if (req.method === 'POST' && req.url === '/saveBlogPosts') {
        headerNotModified = false;   
        let body = '';

        req.on('data', (chunk) => {
            body += chunk;
        });

        req.on('end', async () => {
            try {
                const postData = JSON.parse(body);

                const { title, description, images} = postData[0];
                let postId = await addBlogPost(title, description, sessionData.userId, sessionData.username);
                let blogDetails = true;

                postData.forEach(async (post) => {
                    const { title, description, images } = post;

                    if(blogDetails){
                        blogDetails = false;
                    }else{
                        let sectionId = await addSection(postId, title, description);
                        for (const imageUrl of images) {
                            pool.query('INSERT INTO section_images (post_id, section_id, image_url) VALUES (?, ?, ?)', [postId, sectionId, imageUrl]);
                        }
                    }                 
                });

                console.log('Blog posts saved successfully');
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Blog added succesfully');
            } catch (error) {
                console.error('Error parsing JSON:', error);
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Bad Request');
            }
        });
    }

    // USED FOR storing a user's avatar
    if (req.method === 'POST' && req.url === '/api/uploadAvatar') {
        headerNotModified = false;   
        let body = '';

        req.on('data', (chunk) => {
            body += chunk;
        });

        req.on('end', async () => {
            try {
                const postData = JSON.parse(body);
                const { clientId, avatar } = postData;
    
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.error('Error getting connection from pool:', err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                        return;
                    }
    
                    const updateQuery = 'UPDATE clients_details SET avatar = ? WHERE client_id = ?';
                    connection.query(updateQuery, [avatar, clientId], (error, results) => {
                        connection.release(); 
    
                        if (error) {
                            console.error('Error updating avatar:', error);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal Server Error');
                        } else {
                            console.log('Avatar updated successfully');
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('Avatar added successfully');
                        }
                    });
                });
            } catch (error) {
                console.error('Error parsing JSON:', error);
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Bad Request');
            }
        });
    }

    // USED FOR getting the user's avatar
    if (req.method === 'POST' && req.url === '/api/avatar') {
        headerNotModified = false;
    
        let body = '';
    
        req.on('data', (chunk) => {
            body += chunk;
        });
    
        req.on('end', async () => {
            try {
                const postData = JSON.parse(body);
                const clientId = postData.clientId;
    
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.error('Error getting connection from pool:', err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                        return;
                    }
    
                    const selectQuery = 'SELECT avatar FROM clients_details WHERE client_id = ?';
                    connection.query(selectQuery, [clientId], (error, results) => {
                        connection.release();
    
                        if (error) {
                            console.error('Error retrieving avatar:', error);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal Server Error');
                        } else {
                            if (results.length > 0) {
                                const avatar = results[0].avatar;
                                res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                                res.end(JSON.stringify({ image: `${avatar}` }));
                            } else {
                                res.writeHead(404, { 'Content-Type': 'text/plain' });
                                res.end('Avatar not found');
                            }
                        }
                    });
                });
            } catch (error) {
                console.error('Error parsing JSON:', error);
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Bad Request');
            }
        });
    }

    // USED FOR storing a plants's avatar
    if (req.method === 'POST' && req.url === '/api/uploadPlantAvatar') {
        headerNotModified = false;   
        let body = '';

        req.on('data', (chunk) => {
            body += chunk;
        });

        req.on('end', async () => {
            try {
                const postData = JSON.parse(body);
                const { plantId, avatar } = postData;
    
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.error('Error getting connection from pool:', err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                        return;
                    }
    
                    const updateQuery = 'UPDATE plants SET picture = ? WHERE plant_id = ?';
                    connection.query(updateQuery, [avatar, plantId], (error, results) => {
                        connection.release(); 
    
                        if (error) {
                            console.error('Error updating plant avatar:', error);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal Server Error');
                        } else {
                            console.log('Plant Avatar updated successfully');
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('Plant Avatar added successfully');
                        }
                    });
                });
            } catch (error) {
                console.error('Error parsing JSON:', error);
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Bad Request');
            }
        });
    }

    // USED FOR getting a plants cover
    if (req.method === 'POST' && req.url === '/api/plantAvatar') {
        headerNotModified = false;
    
        let body = '';
    
        req.on('data', (chunk) => {
            body += chunk;
        });
    
        req.on('end', async () => {
            try {
                const postData = JSON.parse(body);
                const plantId = postData.plantId;
    
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.error('Error getting connection from pool:', err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                        return;
                    }
    
                    const selectQuery = 'SELECT picture FROM plants WHERE plant_id = ?';
                    connection.query(selectQuery, [plantId], (error, results) => {
                        connection.release();
    
                        if (error) {
                            console.error('Error retrieving avatar:', error);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal Server Error');
                        } else {
                            if (results.length > 0) {
                                const avatar = results[0].picture;
                                res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                                res.end(JSON.stringify({ image: `${avatar}` }));
                            } else {
                                res.writeHead(404, { 'Content-Type': 'text/plain' });
                                res.end('Avatar not found');
                            }
                        }
                    });
                });
            } catch (error) {
                console.error('Error parsing JSON:', error);
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Bad Request');
            }
        });
    }

    // USED FOR getting the id of a plant from a collection
    if (req.method === 'POST' && req.url === '/api/getPlantId') {
        headerNotModified = false;
        let body = '';
    
        req.on('data', (chunk) => {
            body += chunk;
        });
    
        req.on('end', async () => {
            try {
                const postData = JSON.parse(body);
                const { collectionId } = postData;
    
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.error('Error getting connection from pool:', err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                        return;
                    }
    
                    const selectQuery = 'SELECT plant_id FROM plants WHERE collection_id = ? AND picture IS NOT NULL ORDER BY plant_id LIMIT 1';
                    connection.query(selectQuery, [collectionId], (error, results) => {
                        connection.release();
    
                        if (error) {
                            console.error('Error querying database:', error);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal Server Error');
                        } else {
                            if (results.length === 0) {
                                res.writeHead(404, { 'Content-Type': 'text/plain' });
                                res.end('Plant ID not found for the provided collection ID');
                            } else {
                                const plantId = results[0].plant_id;
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ plantId }));
                            }
                        }
                    });
                });
            } catch (error) {
                console.error('Error parsing JSON or querying database:', error);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            }
        });
    }

    // USED FOR LOGGING OUT
    if(req.method === 'POST' && req.url === '/error404Return'){
        headerNotModified = false;      
        
        let isAdmin = sessionData && sessionData.isAdmin ? sessionData.isAdmin : false;

        res.writeHead(200, { 'Content-Type': 'text/plain', 'isAdmin': isAdmin });
        res.end('Error404 Back To Page');
    }

    // USED FOR LOGGING OUT
    if(req.method === 'POST' && req.url === '/logout'){
        headerNotModified = false;

        if(sessionData.isAdmin == undefined)
        sessionData.isAdmin = 'False';

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
                                    const sessionId = createSession();
                                    
                                    //cookies
                                    const cookieValue = `sessionId=${sessionId}; HttpOnly; Max-Age=${24 * 60 * 60}`;
                                    res.setHeader('Set-Cookie', cookieValue);

                                    const userData = {sessionId: sessionId, userId: results[0].id, username: results[0].name, isAdmin: 'True'};
                                    setSessionData(sessionId, userData.userId, userData.isAdmin);
                                    // setSessionData(sessionId, userData);
                                    console.log(userData);

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
                                        const sessionId = createSession();
                                        
                                        //cookies
                                        const cookieValue = `sessionId=${sessionId}; HttpOnly; Max-Age=${24 * 60 * 60}`;
                                        res.setHeader('Set-Cookie', cookieValue);

                                        const userData = {sessionId: sessionId, userId: results[0].id, username: results[0].name, isAdmin: 'False'};
                                        setSessionData(sessionId, userData.userId, userData.isAdmin);
                                        // setSessionData(sessionId, userData);
                                        console.log(userData);

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

    // USED FOR REGISTERING
    if (req.method === 'POST' && req.url === '/registerCredentials') {
        headerNotModified = false;
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
                    if(sessionData.isAdmin == 'True' && (filePath != './html/admin.html' && filePath != './html/generateReports.html' && filePath != './html/listOfClients.html' && filePath != './html/landingPage.html' && filePath != './html/login.html' && filePath != './html/register.html'))
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
        console.error('Error fetching session data:', error.message);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
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

// Function to create session
// const createSession = () => {
//     const sessionId = generateSessionId();
//     sessions[sessionId] = {};
//     return sessionId;
// };

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

// Function to get session
// const getSession = (sessionId) => {
//     return sessions[sessionId];
// };

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
  

// Function to set session data
// const setSessionData = (sessionId, data) => {
//     sessions[sessionId] = data;
// };

const setSessionData = (sessionId, clientId, isAdmin) => {
    console.log(sessionId, clientId, isAdmin);
    const sql = 'UPDATE sessions SET client_id = ?, isAdmin = ? WHERE session_id = ?';
    const values = [clientId, isAdmin, sessionId];
  
    pool.getConnection((err, connection) => {
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
  };

// Function to destroy session
// const destroySession = (sessionId) => {
//     delete sessions[sessionId];
// };

const destroySession = (sessionId) => {
    const sql = 'DELETE FROM sessions WHERE session_id = ?';
    const values = [sessionId];
  
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
          console.log('Session deleted for sessionId:', sessionId);
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

// Function to add a blog post
function addBlogPost(title, description, userId, username) {
    return new Promise((resolve, reject) => {
        const currentDate = new Date().toISOString().slice(0, 10);
        pool.query('INSERT INTO blog_posts (title, description, post_date, user_id, user_name) VALUES (?, ?, ?, ?, ?)', [title, description, currentDate, userId, username], (error, results) => {
            if (error) {
                console.error('Error adding blog post:', error);
                reject(error);
            } else {
                const postId = results.insertId;
                console.log('Blog post added successfully. Post ID:', postId);
                resolve(postId); 
            }
        });
    });
}

// Function to add a new section to a blog post
function addSection(postId, title, description) {
    return new Promise((resolve, reject) => {
        // Insert the new section into the database
        const query = 'INSERT INTO blog_post_sections (post_id, title, description) VALUES (?, ?, ?)';
        pool.query(query, [postId, title, description], (error, results) => {
            if (error) {
                console.error('Error adding section:', error);
                reject(error);
            }else {
                const sectionId = results.insertId; // Obtain the postId from the results
                console.log('Section added successfully. Post ID:', sectionId);
                resolve(sectionId); // Resolve the promise with the postId
            }
        });
    });
}

function generateToken(length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex') 
        .slice(0, length);
}