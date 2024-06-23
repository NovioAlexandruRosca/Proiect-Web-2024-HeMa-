const pool = require('../database')

const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 15);
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
  


async function getUsername(req, res, sessionData){
    res.writeHead(200, { 'Content-Type': 'text/plain', 'Name' : sessionData.username });
    res.end('Error404 Back To Page');
}

async function getUserId(req, res, sessionData){
    res.writeHead(200, { 'Content-Type': 'text/plain', 'userId' : sessionData.userId });
    res.end('Error404 Back To Page');
}

async function modifyBadge(req, res){
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

async function getBadgesData(req, res){
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

async function followUser(req, res, sessionData){
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

async function getNameOfFollowedUser(req, res){
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

async function checkRelationship(req, res, sessionData){
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

async function getFollowingList(req, res){
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

async function getUserData(req, res){
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

async function updateUserData(req, res, sessionData){
    let body = '';
    
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
                            setSessionData( userData.userId, userData.isAdmin);

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
                            setSessionData(sessionId, userData.userId, userData.isAdmin);

                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: true }));
                        });
                    });
                }
            });
        });
    });
}

async function uploadPicture(req, res){
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

async function getUserPicture(req, res){
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

module.exports = {
    getUsername,
    getUserId,
    modifyBadge,
    getBadgesData,
    followUser,
    getNameOfFollowedUser,
    checkRelationship,
    getFollowingList,
    getUserData,
    updateUserData,
    uploadPicture,
    getUserPicture
};