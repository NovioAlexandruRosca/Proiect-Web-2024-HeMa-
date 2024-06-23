const pool = require('../database');

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
        const query = 'INSERT INTO blog_post_sections (post_id, title, description) VALUES (?, ?, ?)';
        pool.query(query, [postId, title, description], (error, results) => {
            if (error) {
                console.error('Error adding section:', error);
                reject(error);
            }else {
                const sectionId = results.insertId; 
                console.log('Section added successfully. Post ID:', sectionId);
                resolve(sectionId); 
            }
        });
    });
}



async function deletePost(req, res){
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

async function deleteComment(req, res){
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

async function getAllBlogs(req, res){
    pool.query('SELECT * FROM blog_posts', (error, results, fields) => {
        if (error) {
            console.error('Error fetching blogs from database:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        } else {
            const jsonData = JSON.stringify(results);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(jsonData);
        }
    });
}

async function getAllComments(req, res){
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

async function addComment(req, res, sessionData){
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

async function getBlogData(req, res){
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

async function saveBlogPosts(req, res, sessionData){
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

async function reportComment(req, res){
    let body = '';

    req.on('data', (chunk) => {
        body += chunk;
    });

    req.on('end', async () => {
        try {
            const postData = JSON.parse(body);
            const { clientId, reportedUserName, reportedUserComment, motif } = postData;

            console.log(clientId, reportedUserComment, reportedUserName, motif);

            if (!clientId || !reportedUserName || !reportedUserComment || !motif) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'All fields are required' }));
                return;
            }

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }

                const insertQuery = 'INSERT INTO reports (client_id, reportedUserName, reportedUserComment, motif) VALUES (?, ?, ?, ?)';
                connection.query(insertQuery, [clientId, reportedUserName, reportedUserComment, motif], (error, results) => {
                    connection.release();

                    if (error) {
                        console.error('Error inserting report:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    } else {
                        console.log('Report inserted successfully');
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Report submitted successfully' }));
                    }
                });
            });
        } catch (error) {
            console.error('Error parsing JSON:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Bad Request' }));
        }
    });
}

module.exports = {
    deletePost,
    deleteComment,
    getAllBlogs,
    getAllComments,
    addComment,
    getBlogData,
    saveBlogPosts,
    reportComment
};