const pool = require('../database')

async function getMostPopularPlantId(req, res) {
  
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

async function getAllSharedCollections(req, res){
  console.log('Fetching all shared collections...');
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error getting connection from pool:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                return;
            }

            const query = `
                SELECT 
                    plant_collections.collection_id AS id, 
                    plant_collections.name, 
                    clients.name AS sharedBy,
                    plant_collections.creation_time AS postingDate, 
                    plant_collections.description
                FROM plant_collections
                JOIN clients ON plant_collections.client_id = clients.id
                WHERE plant_collections.is_shared = 1
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

async function updatePlantData(req, res){
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

module.exports = {
    getMostPopularPlantId,
    getAllSharedCollections,
    updatePlantData
};
