const pool = require('../database')

// async function reactToCollection(req, res, sessionData){
//     console.log("YES");
//     let body = '';
//     req.on('data', chunk => {
//         body += chunk.toString();
//     });

//     req.on('end', () => {
//         const parsedBody = JSON.parse(body);
//         console.log("Request body:", body); 
//         console.log("Parsed request body:", parsedBody); 
//         const { collectionId, reactionType } = parsedBody;
//         const userId = sessionData.userId; 
//         console.log("User ID from session:", userId); 

//         if (!userId || !collectionId || !reactionType || !['like', 'dislike'].includes(reactionType)) {
//             console.log("Invalid request data:", { userId, collectionId, reactionType }); 
//             res.writeHead(400, { 'Content-Type': 'application/json' });
//             res.end(JSON.stringify({ error: 'Invalid request data' }));
//             return;
//         }

//         pool.getConnection((err, connection) => {
//             if (err) {
//                 console.error('Error getting connection from pool:', err);
//                 res.writeHead(500, { 'Content-Type': 'application/json' });
//                 res.end(JSON.stringify({ error: 'Internal Server Error' }));
//                 return;
//             }

//             const checkReactionQuery = `SELECT id FROM collection_reactions WHERE user_id = ? AND collection_id = ?`;
//             connection.query(checkReactionQuery, [userId, collectionId], (err, results) => {
//                 if (err) {
//                     console.error('Database query error:', err);
//                     res.writeHead(500, { 'Content-Type': 'application/json' });
//                     res.end(JSON.stringify({ error: 'Internal Server Error' }));
//                     connection.release();
//                     return;
//                 }

//                 if (results.length > 0) {
//                     res.writeHead(400, { 'Content-Type': 'application/json' });
//                     res.end(JSON.stringify({ error: 'You have already reacted to this collection' }));
//                     connection.release();
//                 } else {
//                     const insertReactionQuery = `INSERT INTO collection_reactions (user_id, collection_id, reaction_type) VALUES (?, ?, ?)`;
//                     connection.query(insertReactionQuery, [userId, collectionId, reactionType], (err, results) => {
//                         connection.release();
//                         if (err) {
//                             console.error('Database query error:', err);
//                             res.writeHead(500, { 'Content-Type': 'application/json' });
//                             res.end(JSON.stringify({ error: 'Internal Server Error' }));
//                         } else {
//                             res.writeHead(201, { 'Content-Type': 'application/json' });
//                             res.end(JSON.stringify({ success: true }));
//                         }
//                     });
//                 }
//             });
//         });
//     });
// }

async function reactToCollection(req, res, sessionData){
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        let parsedBody;
        try {
            parsedBody = JSON.parse(body);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Bad Request' }));
            return;
        }

        console.log("Request body:", body); 
        console.log("Parsed request body:", parsedBody); 
        const { collectionId, reactionType } = parsedBody;
        const userId = sessionData.userId; 
        console.log("User ID from session:", userId); 

        if (!userId) {
            console.log("User ID is missing from session");
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User ID is missing from session' }));
            return;
        }

        if (!collectionId) {
            console.log("Collection ID is missing in the request body");
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Collection ID is missing' }));
            return;
        }

        if (!reactionType || !['like', 'dislike'].includes(reactionType)) {
            console.log("Invalid reaction type in the request body:", reactionType);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid reaction type' }));
            return;
        }

        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error getting connection from pool:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                return;
            }

            console.log("Connection established successfully");

            // Check if the user has already reacted to the collection
            const checkReactionQuery = `SELECT id, reaction_type FROM collection_reactions WHERE user_id = ? AND collection_id = ?`;
            connection.query(checkReactionQuery, [userId, collectionId], (err, results) => {
                if (err) {
                    console.error('Database query error:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    connection.release();
                    return;
                }

                if (results.length > 0) {
                    const existingReactionType = results[0].reaction_type;
                    if (existingReactionType === reactionType) {
                        const deleteReactionQuery = `DELETE FROM collection_reactions WHERE id = ?`;
                        connection.query(deleteReactionQuery, [results[0].id], (err, deleteResults) => {
                            if (err) {
                                console.error('Database query error:', err);
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                                connection.release();
        return;
    }

    const updateCountQuery = reactionType === 'like' ? 
        `UPDATE plant_collections SET likes = likes - 1 WHERE collection_id = ?` : 
        `UPDATE plant_collections SET dislikes = dislikes - 1 WHERE collection_id = ?`;

        connection.query(updateCountQuery, [collectionId], (err, updateResults) => {
            connection.release();
            if (err) {
                console.error('Error updating count in collections table:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            }
        });
    });
    } else {
        const updateReactionQuery = `UPDATE collection_reactions SET reaction_type = ? WHERE id = ?`;
        connection.query(updateReactionQuery, [reactionType, results[0].id], (err, updateResults) => {
            if (err) {
                console.error('Database query error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                connection.release();
                return;
            }

            const decreaseCountQuery = existingReactionType === 'like' ? 
                `UPDATE plant_collections SET likes = likes - 1 WHERE collection_id = ?` : 
                `UPDATE plant_collections SET dislikes = dislikes - 1 WHERE collection_id = ?`;
            const increaseCountQuery = reactionType === 'like' ? 
                `UPDATE plant_collections SET likes = likes + 1 WHERE collection_id = ?` : 
                `UPDATE plant_collections SET dislikes = dislikes + 1 WHERE collection_id = ?`;

                    connection.query(decreaseCountQuery, [collectionId], (err, decreaseResults) => {
                        if (err) {
                            console.error('Error updating count in collections table:', err);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Internal Server Error' }));
                            connection.release();
                            return;
                        }

                        connection.query(increaseCountQuery, [collectionId], (err, increaseResults) => {
                            connection.release();
                            if (err) {
                                console.error('Error updating count in collections table:', err);
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                            } else {
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ success: true }));
                            }
                        });
                    });
                });
            }
        } else {
            const insertReactionQuery = `INSERT INTO collection_reactions (user_id, collection_id, reaction_type) VALUES (?, ?, ?)`;
            connection.query(insertReactionQuery, [userId, collectionId, reactionType], (err, results) => {
                if (err) {
                    console.error('Database query error:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    connection.release();
                } else {
                    const updateCountQuery = reactionType === 'like' ? 
                        `UPDATE plant_collections SET likes = likes + 1 WHERE collection_id = ?` : 
                        `UPDATE plant_collections SET dislikes = dislikes + 1 WHERE collection_id = ?`;

                    connection.query(updateCountQuery, [collectionId], (err, updateResults) => {
                        connection.release();
                        if (err) {
                            console.error('Error updating count in collections table:', err);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        } else {
                            res.writeHead(201, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: true }));
                        }
                    });
                }
            });
        }
        });
        });
    });
}

async function modifyTimeOfCollection(req, res){
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

async function modifyCollectionData(req, res){
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

async function deleteCollection(req, res){
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

async function createCollection(req, res, sessionData){
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

async function getCollectionData(req, res){
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

async function getAllCollections(req, res){
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

async function countReaction(req, res){
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const collectionId = urlParams.get('collectionId');
        const reactionType = urlParams.get('reactionType');
    
        if (!collectionId || !reactionType || !['like', 'dislike'].includes(reactionType)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid request data' }));
            return;
        }
    
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error getting connection from pool:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                return;
            }
    
            const query = `SELECT COUNT(*) as count FROM collection_reactions WHERE collection_id = ? AND reaction_type = ?`;
            connection.query(query, [collectionId, reactionType], (err, results) => {
                connection.release();
                if (err) {
                    console.error('Database query error:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ count: results[0].count }));
                }
            });
        });
}

module.exports = {
    reactToCollection,
    modifyTimeOfCollection,
    modifyCollectionData,
    deleteCollection,
    createCollection,
    getCollectionData,
    getAllCollections,
    countReaction
};