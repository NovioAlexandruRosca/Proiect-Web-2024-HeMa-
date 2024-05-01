const http = require('http');
const fs = require('fs');
const path = require('path');
const sendEmail = require('./sendMail');
const querystring = require('querystring');
const mysql = require('mysql2');
const { parse } = require('querystring');
require('dotenv').config();
const bcrypt = require('bcrypt');


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
const server = http.createServer((req, res) => {

    const cookies = parseCookies(req.headers.cookie)
    const sessionId = cookies.sessionId;
    const sessionData = getSession(sessionId);

    const cookieValue = `sessionId=${sessionId}; HttpOnly; Max-Age=${24 * 60 * 60}`;
    res.setHeader('Set-Cookie', cookieValue);


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
        
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection from pool:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                }
        
                const { name, occupation, city, street, number, facebookLink, githubLink, instagramLink, twitterLink } = formData;
  
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
                                        [name, occupation, city, street, number, facebookLink, githubLink, instagramLink, twitterLink, sessionData.userId], 
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
                                        [sessionData.userId, name, occupation, city, street, number, facebookLink, githubLink, instagramLink, twitterLink], 
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
    
                // Get a connection from the pool
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.error('Error getting connection from pool:', err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                        return;
                    }
    
                    // Query the database for blog post data and client name
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
    
                        // Query the database for blog post sections
                        connection.query('SELECT * FROM blog_post_sections WHERE post_id = ?', [postId], async (error1, sections) => {
                            if (error1) {
                                console.error('Error querying blog post sections:', error1);
                                res.writeHead(500, { 'Content-Type': 'text/plain' });
                                res.end('Internal Server Error');
                                connection.release();
                                return;
                            }
    
                            // Iterate over sections to fetch associated images
                            for (let i = 0; i < sections.length; i++) {
                                const section = sections[i];
                                // Query the database for images associated with this section
                                const images = await new Promise((resolve, reject) => {
                                    connection.query('SELECT image_url FROM section_images WHERE section_id = ?', [section.id], (error2, results) => {
                                        if (error2) {
                                            console.error('Error querying section images:', error2);
                                            reject(error2);
                                            return;
                                        }
                                        resolve(results.map(result => result.image_url));
                                    });
                                });
                                // Add images to the section object
                                section.images = images;
                            }
    
                            // Release the connection back to the pool
                            connection.release();
    
                            // Send the response back to the client
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

    // USED FOR LOGGING OUT
    if(req.method === 'POST' && req.url === '/error404Return'){
        headerNotModified = false;        
        res.writeHead(200, { 'Content-Type': 'text/plain', 'isAdmin': sessionData.isAdmin });
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
                                    setSessionData(sessionId, userData);
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

                                    const sessionId = createSession();
                                    
                                    //cookies
                                    const cookieValue = `sessionId=${sessionId}; HttpOnly; Max-Age=${24 * 60 * 60}`;
                                    res.setHeader('Set-Cookie', cookieValue);

                                    const userData = {sessionId: sessionId, userId: results[0].id, username: results[0].name, isAdmin: 'False'};
                                    setSessionData(sessionId, userData);
                                    console.log(userData);

                                    console.log(`User with ID ${userData.userId} authenticated successfully`);
                                    res.writeHead(200, { 'Content-Type': 'text/plain', 'isAdmin': 'No' });
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
                        
                            console.log('New user registered successfully');
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('OK');
                        
                            connection.release();
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

        if(req.url == '../Documentatie/Documentatie.html'){
            filePath = 'Documentatie/Documentatie.html';
        }else if(getContentType(req.url) == 'text/html'){
            filePath = './html' + req.url;
        }else if(req.url == '/'){
            filePath = './html/landingPage.html';
        }

        // If they aren't logged in they should be able to see anything but the 3 pages from the second part of the if
        if (!sessionData) {
            if(getContentType(req.url) == 'text/html' && (filePath != './html/landingPage.html' && filePath != './html/login.html' && filePath != './html/register.html'))
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
    headerNotModified = true;
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

// Function to create session
const createSession = () => {
    const sessionId = generateSessionId();
    sessions[sessionId] = {};
    return sessionId;
};

// Function to get session
const getSession = (sessionId) => {
    return sessions[sessionId];
};

// Function to set session data
const setSessionData = (sessionId, data) => {
    sessions[sessionId] = data;
};

// Function to destroy session
const destroySession = (sessionId) => {
    delete sessions[sessionId];
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

// Define a function to add a blog post
function addBlogPost(title, description, userId, username) {
    return new Promise((resolve, reject) => {
        const currentDate = new Date().toISOString().slice(0, 10);
        // Perform database insertion operation
        pool.query('INSERT INTO blog_posts (title, description, post_date, user_id, user_name) VALUES (?, ?, ?, ?, ?)', [title, description, currentDate, userId, username], (error, results) => {
            if (error) {
                console.error('Error adding blog post:', error);
                reject(error); // Reject the promise if there's an error
            } else {
                const postId = results.insertId; // Obtain the postId from the results
                console.log('Blog post added successfully. Post ID:', postId);
                resolve(postId); // Resolve the promise with the postId
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