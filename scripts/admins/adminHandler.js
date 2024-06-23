const pool = require('../database')
const PDFDocument = require('pdfkit');  
const { createObjectCsvStringifier } = require('csv-writer');  

async function listOfClients(req, res){
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting connection from pool:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
            return;
        }

        connection.query('SELECT id, name, email FROM clients', (err, results) => {
            connection.release();

            if (err) {
                console.error('Error executing query:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results));
        });
    });
}

async function deleteClient(req, res){
    const id = req.url.split('/').pop();

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting connection from pool:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
            return;
        }

        connection.query('DELETE FROM clients WHERE id = ?', [id], (err, results) => {
            connection.release();

            if (err) {
                console.error('Error executing query:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }

            if (results.affectedRows > 0) {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('OK');
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Client Not Found');
            }
        });
    });
}

async function getReports(req, res){
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting connection from pool:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
            return;
        }

        const query = `
            SELECT 
                r.id, 
                r.client_id AS clientId, 
                r.reportedUserName, 
                r.reportedUserComment, 
                r.motif,
                c.name AS reportedBy,
                c.email AS email
            FROM reports r
            JOIN clients c ON r.client_id = c.id
        `;

        connection.query(query, (err, results) => {
            connection.release();
            if (err) {
                console.error('Database query error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(results));
            }
        });
    });
}

async function banUser(req, res){
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const parsedBody = JSON.parse(body);
        const { clientId, motif } = parsedBody;

        if (!clientId || !motif) {
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

            const selectQuery = `SELECT email FROM clients WHERE id = ?`;
            connection.query(selectQuery, [clientId], (err, results) => {
                if (err) {
                    console.error('Database query error:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    connection.release();
                    return;
                }

                if (results.length === 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Client not found' }));
                    connection.release();
                    return;
                }

                const email = results[0].email;

                const insertBanQuery = `INSERT INTO banned_users (email, motif) VALUES (?, ?)`;
                connection.query(insertBanQuery, [email, motif], (err, results) => {
                    if (err) {
                        console.error('Database query error:', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        connection.release();
                        return;
                    }

                    const deleteClientQuery = `DELETE FROM clients WHERE id = ?`;
                    connection.query(deleteClientQuery, [clientId], (err, results) => {
                        connection.release();
                        if (err) {
                            console.error('Database query error:', err);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: true }));
                        }
                    });
                });
            });
        });
    });
}

async function rejectReport(req, res){
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const parsedBody = JSON.parse(body);
        const { reportId } = parsedBody;

        if (!reportId) {
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

            const rejectQuery = `DELETE FROM reports WHERE id = ?`;
            connection.query(rejectQuery, [reportId], (err, results) => {
                connection.release();
                if (err) {
                    console.error('Database query error:', err);
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

async function generateClientsPdf(req, res){
    const query = `
      SELECT c.id, c.email, c.name, cd.occupation, cd.city, cd.street, cd.house_number,
             cd.facebook_link, cd.github_link, cd.instagram_link, cd.twitter_link, b.badge1, b.badge2, b.badge3, b.badge4, b.badge5,
             co.comment_text, co.posted_date
      FROM clients c
      LEFT JOIN clients_details cd ON c.id = cd.client_id
      LEFT JOIN badges b ON c.id = b.client_id
      LEFT JOIN comments co ON c.id = co.user_id
    `;
  
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection from pool:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
        return;
      }
  
      connection.query(query, (err, results) => {
        connection.release();
  
        if (err) {
          console.error('Error executing query:', err);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
          return;
        }
  
        const doc = new PDFDocument();
        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="clients_report.pdf"',
        });
        doc.pipe(res);
  
        doc.fontSize(18).text('Clients Report', { align: 'center' });
        doc.moveDown();
  
        results.forEach(client => {
          doc.fontSize(12).text(`ID: ${client.id}`);
          doc.text(`Name: ${client.name}`);
          doc.text(`Email: ${client.email}`);
          doc.text(`Occupation: ${client.occupation || 'N/A'}`);
          doc.text(`City: ${client.city || 'N/A'}`);
          doc.text(`Street: ${client.street || 'N/A'}`);
          doc.text(`House Number: ${client.house_number || 'N/A'}`);
          doc.text(`Facebook: ${client.facebook_link || 'N/A'}`);
          doc.text(`GitHub: ${client.github_link || 'N/A'}`);
          doc.text(`Instagram: ${client.instagram_link || 'N/A'}`);
          doc.text(`Twitter: ${client.twitter_link || 'N/A'}`);
          doc.text(`Badge 1: ${client.badge1 || 'N/A'}`);
          doc.text(`Badge 2: ${client.badge2 || 'N/A'}`);
          doc.text(`Badge 3: ${client.badge3 || 'N/A'}`);
          doc.text(`Badge 4: ${client.badge4 || 'N/A'}`);
          doc.text(`Badge 5: ${client.badge5 || 'N/A'}`);
          if (client.comment_text) {
            doc.text(`Comment: ${client.comment_text}`);
            doc.text(`Posted Date: ${client.posted_date}`);
          }
          doc.moveDown();
        });
  
        doc.end();
      });
    });
}

async function generateClientsCsv(req, res){
    const query = `
    SELECT c.id, c.email, c.name, cd.occupation, cd.city, cd.street, cd.house_number,
           cd.facebook_link, cd.github_link, cd.instagram_link, cd.twitter_link, b.badge1, b.badge2, b.badge3, b.badge4, b.badge5,
           co.comment_text, co.posted_date
    FROM clients c
    LEFT JOIN clients_details cd ON c.id = cd.client_id
    LEFT JOIN badges b ON c.id = b.client_id
    LEFT JOIN comments co ON c.id = co.user_id
  `;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection from pool:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      return;
    }

    connection.query(query, (err, results) => {
      connection.release();

      if (err) {
        console.error('Error executing query:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
        return;
      }

      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'id', title: 'ID' },
          { id: 'email', title: 'Email' },
          { id: 'name', title: 'Name' },
          { id: 'occupation', title: 'Occupation' },
          { id: 'city', title: 'City' },
          { id: 'street', title: 'Street' },
          { id: 'house_number', title: 'House Number' },
          { id: 'facebook_link', title: 'Facebook' },
          { id: 'github_link', title: 'GitHub' },
          { id: 'instagram_link', title: 'Instagram' },
          { id: 'twitter_link', title: 'Twitter' },
          { id: 'badge1', title: 'Badge 1' },
          { id: 'badge2', title: 'Badge 2' },
          { id: 'badge3', title: 'Badge 3' },
          { id: 'badge4', title: 'Badge 4' },
          { id: 'badge5', title: 'Badge 5' },
          { id: 'comment_text', title: 'Comment' },
          { id: 'posted_date', title: 'Posted Date' }
        ]
      });

      const header = csvStringifier.getHeaderString();
      const records = csvStringifier.stringifyRecords(results);

      res.writeHead(200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="clients_report.csv"',
      });

      res.write(header);
      res.write(records);
      res.end();
    });
  });
}

async function generatePlantsPdf(req, res){
    const query = `
        SELECT plant_id, owner_id, collection_id, collection_date, hashtags, common_name,
               scientific_name, family, genus, species, place_of_collection, color, number_of_visits
        FROM plants
      `;
    
      pool.getConnection((err, connection) => {
        if (err) {
          console.error('Error getting connection from pool:', err);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
          return;
        }
    
        connection.query(query, (err, results) => {
          connection.release();
    
          if (err) {
            console.error('Error executing query:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
            return;
          }
    
          const doc = new PDFDocument();
          res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="plants_report.pdf"',
          });
          doc.pipe(res);
    
          doc.fontSize(18).text('Plants Report', { align: 'center' });
          doc.moveDown();
    
          results.forEach(plant => {
            doc.fontSize(12).text(`Plant ID: ${plant.plant_id}`);
            doc.text(`Owner ID: ${plant.owner_id}`);
            doc.text(`Collection ID: ${plant.collection_id}`);
            doc.text(`Collection Date: ${plant.collection_date}`);
            doc.text(`Hashtags: ${plant.hashtags || 'N/A'}`);
            doc.text(`Common Name: ${plant.common_name || 'N/A'}`);
            doc.text(`Scientific Name: ${plant.scientific_name || 'N/A'}`);
            doc.text(`Family: ${plant.family || 'N/A'}`);
            doc.text(`Genus: ${plant.genus || 'N/A'}`);
            doc.text(`Species: ${plant.species || 'N/A'}`);
            doc.text(`Place of Collection: ${plant.place_of_collection || 'N/A'}`);
            doc.text(`Color: ${plant.color || 'N/A'}`);
            doc.text(`Number of Visits: ${plant.number_of_visits || 'N/A'}`);
            doc.moveDown();
          });
    
          doc.end();
        });
      });
}
  
async function generatePlantsCsv(req, res){
    const query = `
    SELECT plant_id, owner_id, collection_id, collection_date, hashtags, common_name,
            scientific_name, family, genus, species, place_of_collection, color, number_of_visits
    FROM plants
    `;

    pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error getting connection from pool:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
        return;
    }

    connection.query(query, (err, results) => {
        connection.release();

        if (err) {
        console.error('Error executing query:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
        return;
        }

        const csvStringifier = createObjectCsvStringifier({
        header: [
            { id: 'plant_id', title: 'Plant ID' },
            { id: 'owner_id', title: 'Owner ID' },
            { id: 'collection_id', title: 'Collection ID' },
            { id: 'collection_date', title: 'Collection Date' },
            { id: 'hashtags', title: 'Hashtags' },
            { id: 'common_name', title: 'Common Name' },
            { id: 'scientific_name', title: 'Scientific Name' },
            { id: 'family', title: 'Family' },
            { id: 'genus', title: 'Genus' },
            { id: 'species', title: 'Species' },
            { id: 'place_of_collection', title: 'Place of Collection' },
            { id: 'color', title: 'Color' },
            { id: 'number_of_visits', title: 'Number of Visits' }
        ]
        });

        const header = csvStringifier.getHeaderString();
        const records = csvStringifier.stringifyRecords(results);

        res.writeHead(200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="plants_report.csv"',
        });

        res.write(header);
        res.write(records);
        res.end();
    });
    });
}

module.exports = {
    listOfClients,
    deleteClient,
    getReports,
    banUser,
    rejectReport,
    generateClientsPdf,
    generateClientsCsv,
    generatePlantsPdf,
    generatePlantsCsv
};