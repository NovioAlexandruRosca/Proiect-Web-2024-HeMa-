const pool = require('../database')
const formidable = require('formidable');
const csv = require('csv-parser');
const fs = require('fs');

const defaultValues = {
  owner_id: 1, // Default owner ID for invalid entries
  collection_id: 0,
  collection_date: '1970-01-01',
  hashtags: '',
  common_name: 'Unknown',
  scientific_name: 'Unknown',
  family: 'Unknown',
  genus: 'Unknown',
  species: 'Unknown',
  place_of_collection: 'Unknown',
  color: 'Unknown',
  number_of_visits: 0,
  picture: 'http://example.com/default.jpg',
  isFavorite: 0
};

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

          console.log(hashtags, dateOfCollection, commonName, scientificName, family, genus, species, place, color);

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

async function updateNumberOfVisitsOnPlant(req, res){
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

async function deletePlant(req, res){
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

async function getAllPlants(req, res){
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

async function getTop10PopularPlants(req, res){
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

async function getFavoritePlants(req, res, sessionData){
  const ownerId = sessionData.userId;

  pool.getConnection((err, connection) => {
      if (err) {
          console.error('Error getting connection from pool:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal Server Error' }));
          return;
      }

      const query = 'SELECT * FROM plants WHERE owner_id = ? AND isFavorite = 1';
      connection.query(query, [ownerId], (error, results) => {
          connection.release();

          if (error) {
              console.error('Error fetching favorite plants:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Internal Server Error' }));
              return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(results));
      });
  });
}

async function createPlantLayour(req, res){
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

async function getAllPlantsFromCollection(req, res){
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

async function getPlantData(req, res){
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

async function getPlantPicture(req, res){
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

async function getPlantId(req, res){
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

async function uploadPlantAvatar(req, res){
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

async function importPlants(req, res, sessionData){
  const form = new formidable.IncomingForm();

  form.parse(req, (err, fields, files) => {
      console.log('Parsing form data...');
      if (err) {
          console.error('Error parsing form data:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error parsing form data' }));
          return;
      }

      console.log('Form fields:', fields.collection_id[0]);
      console.log('Form files:', files);

      const file = files.plantsFile[0]; // Access the first element of the array
      const filePath = file.filepath || file.path;
      console.log('Uploaded file path:', filePath);

      if (!filePath) {
          console.error('No file uploaded');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No file uploaded' }));
          return;
      }

      const plantValues = [];

      const session = {
          client_id: sessionData.userId,
          collection_id: fields.collection_id[0]
      };

      fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => {
              console.log('CSV Row:', row);

              const validatedRow = [
                  session.client_id,
                  session.collection_id,
                  row.collection_date || defaultValues.collection_date,
                  row.hashtags || defaultValues.hashtags,
                  row.common_name || defaultValues.common_name,
                  row.scientific_name || defaultValues.scientific_name,
                  row.family || defaultValues.family,
                  row.genus || defaultValues.genus,
                  row.species || defaultValues.species,
                  row.place_of_collection || defaultValues.place_of_collection,
                  row.color || defaultValues.color,
              ].map(value => (isNaN(value) ? value : Number(value) || 0)); // Ensure numeric fields default to 0

              plantValues.push(validatedRow);
          })
          .on('end', () => {
              console.log('CSV parsing completed. Plant values:', plantValues);

              pool.getConnection((err, connection) => {
                  if (err) {
                      console.error('Error getting connection from pool:', err);
                      res.writeHead(500, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({ error: 'Internal Server Error' }));
                      return;
                  }

                  const insertPlant = `INSERT INTO plants (owner_id, collection_id, collection_date, hashtags, common_name, scientific_name, family, genus, species, place_of_collection, color) VALUES ?`;

                  connection.query(insertPlant, [plantValues], (err, result) => {
                      connection.release();
                      if (err) {
                          console.error('Error inserting plant data:', err);
                          res.writeHead(500, { 'Content-Type': 'application/json' });
                          res.end(JSON.stringify({ error: 'Error inserting plant data' }));
                          return;
                      }

                      console.log('Plant data inserted successfully:', result);
                      res.writeHead(200, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({ message: 'Plants imported successfully', result }));
                  });
              });
          })
          .on('error', (error) => {
              console.error('Error reading CSV file:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Error reading CSV file' }));
          });
  });
}

async function updateFavoritePlants(req, res){
  let body = '';
  req.on('data', chunk => {
      body += chunk;
  });

  req.on('end', () => {
      const data = JSON.parse(body);
      const { plantId, isFavorite } = data;

      pool.getConnection((err, connection) => {
          if (err) {
              console.error('Error getting connection from pool:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Internal Server Error' }));
              return;
          }

          const updateQuery = 'UPDATE plants SET isFavorite = ? WHERE plant_id = ?';
          connection.query(updateQuery, [isFavorite, plantId], (error, results) => {
              connection.release();

              if (error) {
                  console.error('Error updating favorite status:', error);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Internal Server Error' }));
              } else {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ message: 'Favorite status updated successfully' }));
              }
          });
      });
  });
}

module.exports = {
    getMostPopularPlantId,
    getAllSharedCollections,
    updatePlantData,
    updateNumberOfVisitsOnPlant,
    deletePlant,
    getAllPlants,
    getTop10PopularPlants,
    getFavoritePlants,
    createPlantLayour,
    getAllPlantsFromCollection,
    getPlantData,
    getPlantPicture,
    getPlantId,
    uploadPlantAvatar,
    importPlants,
    updateFavoritePlants
};
