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


module.exports = {
    getMostPopularPlantId
};
