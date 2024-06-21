const pool = require('../database')
const url = require('url');

function validateToken(req) {
    return new Promise((resolve, reject) => {
        const bearerHeader = req.headers['authorization'];

        if (typeof bearerHeader !== 'undefined') {
            const bearer = bearerHeader.split(' ');
            const token = bearer[1];

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    reject('Internal Server Error');
                    return;
                }

                connection.query('SELECT clientId, token, timestamp, maxCalls FROM ApiToken WHERE token = ?', [token], (err, results) => {
                    if (err) {
                        console.error('Error getting token:', err);
                        reject('Internal Server Error');
                        return;
                    }

                    if (results.length > 0) {
                        const tokenTimestamp = results[0].timestamp;
                        const tokenAge = (Date.now() - new Date(tokenTimestamp).getTime()) / (1000 * 60 * 60 * 24);

                        if (tokenAge > 50) {
                            connection.query('DELETE FROM ApiToken WHERE token = ?', [token], (err, deleteResult) => {
                                connection.release();
                                if (err) {
                                    console.error('Error deleting expired token:', err);
                                    reject('Internal Server Error');
                                    return;
                                }
                                resolve(-1); 
                            });
                        } else {

                            if (results[0].maxCalls > 0) {
                                connection.query('UPDATE ApiToken SET maxCalls = maxCalls - 1 WHERE token = ?', [token], (err, updateResult) => {
                                    connection.release();
                                    if (err) {
                                        console.error('Error updating maxCalls:', err);
                                        reject('Internal Server Error');
                                        return;
                                    }
                                    const clientIDD = results[0].clientId;
                                    const tokenn = results[0].token;
                                    resolve({ clientIDD, tokenn }); 
                                });
                            } else {
                                resolve(-2); 
                            }
                        }
                    } else {
                        resolve(null); 
                    }
                });
            });
        } else {
            resolve(null); 
        }
    });
}

async function addPlant(req, res) {

    const token = await validateToken(req);
    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Bearer token missing' }));
        return;
    } else if (token === -1) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Token expired' }));
        return;
    } else if (token === -2) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Too Many Requests' }));
        return;
    }

    const owner_id = token.clientIDD;

    const parsedUrl = url.parse(req.url, true);
    const { query } = parsedUrl;
    const { collection_id, collection_date, hashtags, common_name, scientific_name, family, genus, species, place_of_collection } = query;

    if (!common_name || !scientific_name || !family || !genus || !species || !place_of_collection) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing required fields in request body' }));
        return;
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting connection from pool:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
            return;
        }

        connection.query(
            'SELECT * FROM plant_collections WHERE collection_id = ? AND client_id = ?',
            [collection_id, owner_id],
            (err, results) => {
                if (err) {
                    connection.release();
                    console.error('Error checking collection:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }

                if (results.length === 0) {
                    connection.release();
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Collection not found or unauthorized' }));
                    return;
                }

                connection.query(
                    'INSERT INTO plants (owner_id, collection_id, collection_date, hashtags, common_name, scientific_name, family, genus, species, place_of_collection) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [owner_id, collection_id, collection_date, hashtags, common_name, scientific_name, family, genus, species, place_of_collection],
                    (err, results) => {
                        connection.release();
                        if (err) {
                            console.error('Error adding plant:', err);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Internal Server Error' }));
                            return;
                        }

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Plant added successfully', plantId: results.insertId }));
                    }
                );
            }
        );
    });
}

async function deletePlant(req, res) {

    const token = await validateToken(req);
    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Bearer token missing' }));
        return;
    } else if (token === -1) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Token expired' }));
        return;
    } else if (token === -2) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Too Many Requests' }));
        return;
    }

    const ownerId = token.clientIDD;

    const parsedUrl = url.parse(req.url, true);
    const { query } = parsedUrl;
    const { plantId } = query;

    if (!plantId || !ownerId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing plantId or ownerId in request body' }));
        return;
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting connection from pool:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
            return;
        }

        connection.query('SELECT * FROM plants WHERE plant_id = ? AND owner_id = ?', [plantId, ownerId], (err, results) => {
            if (err) {
                connection.release();
                console.error('Error checking plant ownership:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                return;
            }

            if (results.length === 0) {
                connection.release();
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Plant not found or unauthorized' }));
                return;
            }

            connection.query('DELETE FROM plants WHERE plant_id = ? AND owner_id = ?', [plantId, ownerId], (err, results) => {
                connection.release();
                if (err) {
                    console.error('Error deleting plant:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }

                if (results.affectedRows === 0) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Plant not found or unauthorized' }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Plant deleted successfully' }));
            });
        });
    });
}

async function getPlant(req, res) {
    const token = await validateToken(req);
    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Bearer token missing' }));
        return;
    } else if (token === -1) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Token expired' }));
        return;
    } else if (token === -2) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Too Many Requests' }));
        return;
    }

    const ownerId = token.clientIDD;

    const parsedUrl = url.parse(req.url, true);
    const { query } = parsedUrl;
    const { plantId } = query;

    if (!plantId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing plantId in query parameters' }));
        return;
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting connection from pool:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
            return;
        }

        connection.query('SELECT * FROM plants WHERE plant_id = ? AND owner_id = ?', [plantId, ownerId], (err, results) => {
            connection.release();
            if (err) {
                console.error('Error fetching plant:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                return;
            }

            if (results.length === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Plant not found or unauthorized' }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results[0]));
        });
    });
}

async function getPlantCollection(req, res) {

    const token = await validateToken(req);
    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Bearer token missing' }));
        return;
    } else if (token === -1) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Token expired' }));
        return;
    } else if (token === -2) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Too Many Requests' }));
        return;
    }

    const ownerId = token.clientIDD;

    const parsedUrl = url.parse(req.url, true);
    const { query } = parsedUrl;
    const { collectionId } = query;

    if (!collectionId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing collectionId in query parameters' }));
        return;
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting connection from pool:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
            return;
        }

        connection.query('SELECT * FROM plant_collections WHERE collection_id = ? AND client_id = ?', [collectionId, ownerId], (err, results) => {
            connection.release();
            if (err) {
                console.error('Error fetching plant collection:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                return;
            }

            if (results.length === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Plant collection not found or unauthorized' }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results[0]));
        });
    });
}

async function getAllPlants(req, res) {

    const token = await validateToken(req);
    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Bearer token missing' }));
        return;
    }else if(token == -1){
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Token expired' }));
        return;
    }else if(token == -2){
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Too Many Requests' }));
        return;
    }

    const ownerId = token.clientIDD;

    if (!ownerId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing ownerId in query parameters' }));
        return;
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting connection from pool:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
            return;
        }

        connection.query('SELECT * FROM plants WHERE owner_id = ?', [ownerId], (err, results) => {
            connection.release();
            if (err) {
                console.error('Error fetching all plants:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results));
        });
    });
}

async function getComments(req, res) {

    const token = await validateToken(req);
    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Bearer token missing' }));
        return;
    }else if(token == -1){
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Token expired' }));
        return;
    }else if(token == -2){
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Too Many Requests' }));
        return;
    }


    const userId = token.clientIDD;

    if (!userId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing userId in query parameters' }));
        return;
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting connection from pool:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
            return;
        }

        connection.query('SELECT * FROM comments WHERE user_id = ?', [userId], (err, results) => {
            connection.release();
            if (err) {
                console.error('Error fetching comments:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results));
        });
    });
}

async function getCollections(req, res) {

    const token = await validateToken(req);
    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Bearer token missing' }));
        return;
    }else if(token == -1){
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Token expired' }));
        return;
    }else if(token == -2){
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Too Many Requests' }));
        return;
    }

    const clientId = token.clientIDD;

    if (!clientId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing clientId in query parameters' }));
        return;
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting connection from pool:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
            return;
        }

        connection.query('SELECT * FROM plant_collections WHERE client_id = ?', [clientId], (err, results) => {
            connection.release();
            if (err) {
                console.error('Error fetching collections:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results));
        });
    });
}

async function getBadges(req, res) {

    const token = await validateToken(req);

    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Bearer token missing' }));
        return;
    }else if(token == -1){
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Token expired' }));
        return;
    }else if(token == -2){
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Too Many Requests' }));
        return;
    }

    const clientId  = token.clientIDD;

    if (!clientId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing clientId in query parameters' }));
        return;
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting connection from pool:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
            return;
        }

        connection.query('SELECT * FROM badges WHERE client_id = ?', [clientId], (err, results) => {
            connection.release();
            if (err) {
                console.error('Error fetching badges:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results));
        });
    });
}

async function getFriends(req, res) {

    const token = await validateToken(req);
    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Bearer token missing' }));
        return;
    }else if(token == -1){
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Token expired' }));
        return;
    }else if(token == -2){
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Too Many Requests' }));
        return;
    }

    const followedId = token.clientIDD;

    if (!followedId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing followedId in query parameters' }));
        return;
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting connection from pool:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
            return;
        }

        connection.query('SELECT * FROM followers WHERE follower_id = ?', [followedId], (err, results) => {
            connection.release();
            if (err) {
                console.error('Error fetching friends:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results));
        });
    });
}

function generateTokenHandler(req, res) {

    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const { clientId } = JSON.parse(body);

        if (!clientId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing clientId in request body' }));
            return;
        }

        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error getting connection from pool:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                return;
            }
    
            connection.query(
                'DELETE FROM ApiToken WHERE clientId = ?',
                [clientId],
                (err, deleteResult) => {
                    if (err) {
                        console.error('Error deleting existing token:', err);
                        connection.release();
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        return;
                    }
    
                    connection.query(
                        'INSERT INTO ApiToken (clientId, token, timestamp) VALUES (?, UUID(), NOW())',
                        [clientId],
                        (err, insertResult) => {
                            if (err) {
                                console.error('Error inserting new token:', err);
                                connection.release();
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                                return;
                            }
    
                            const newTokenId = insertResult.insertId;
    
                            connection.query(
                                'SELECT token FROM ApiToken WHERE id = ?',
                                [newTokenId],
                                (err, tokenResults) => {
                                    connection.release();
                                    if (err) {
                                        console.error('Error fetching token:', err);
                                        res.writeHead(500, { 'Content-Type': 'application/json' });
                                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                                        return;
                                    }
    
                                    if (tokenResults.length === 0) {
                                        res.writeHead(404, { 'Content-Type': 'application/json' });
                                        res.end(JSON.stringify({ error: 'Token not found' }));
                                        return;
                                    }
    
                                    const newToken = tokenResults[0].token;
                                    res.writeHead(200, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ token: 'Bearer ' + newToken }));
                                }
                            );
                        }
                    );
                }
            );
        });

    });
}

function getToken(req, res){

    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const { clientId } = JSON.parse(body);

        if (!clientId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing clientId in request body' }));
            return;
        }

        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error getting connection from pool:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                return;
            }
    
            connection.query(
                'SELECT token FROM ApiToken WHERE clientId = ?',
                [clientId],
                (err, results) => {
                    connection.release();
                    if (err) {
                        console.error('Error deleting existing token:', err);
                        connection.release();
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        return;
                    }

                    if (results.length > 0) {
                        const token = results[0].token;
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ token: token }));
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ token: 'You need to generate a token first' }));
                    }
    
                    
                }
            );
        });

    });

}

module.exports = {
    addPlant,
    deletePlant,
    getPlant,
    getPlantCollection,
    getAllPlants,
    getComments,
    getCollections,
    getBadges,
    getFriends,
    generateTokenHandler,
    getToken
};
