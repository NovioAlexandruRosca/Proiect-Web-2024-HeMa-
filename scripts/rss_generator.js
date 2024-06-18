const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const port = process.env.PORT || 5500;

async function generateRSS() {

    const response = await fetch(`http://localhost:${port}/api/mostPopularPlants`);
    const plants = await response.json();

    const items = plants.map(plant => {
        let description = "<description>";
        if (plant.scientific_name) {
          description += `Scientific Name: ${plant.scientific_name}\n`;
        }
        if (plant.family) {
          description += `Part of the Family: ${plant.family}\n`;
        }
        if (plant.genus) {
          description += `And the Genus: ${plant.genus}\n`;
        }
        if (plant.species) {
          description += `Species of: ${plant.species}\n`;
        }
        if (plant.place_of_collection) {
          description += `Collected at: ${plant.place_of_collection}\n`;
        }
        if (plant.number_of_visits) {
          description += `Popularity: ${plant.number_of_visits} visits until now!\n`;
        }

        description += `</description>`;
    
        if(!plant.common_name)
            return ``;

        const guid = `plant-${plant.id}`; 
        const link = `http://localhost:5500/PlantProfilePage.html?id=${plant.plant_id}`;

        return `
          <item>
            <title>${plant.common_name}</title>
            <link>${link}</link>
            ${description}
          </item>
        `;
      });
    
      const rss = `<?xml version="1.0" encoding="UTF-8" ?>
      <rss version="2.0">
        <channel>
          <title>Most popular plants on our platform</title>
          <description>Down below you can find a list of our most renowned plants on our botanical platform!</description>
          <link>http://localhost:${port}</link>
          ${items.join('')}
        </channel>
      </rss>`;

    try {
        await fs.writeFile('./rss/rss.xml', rss);
        console.log('RSS-Generator: The RSS file was successfully created');
    } catch (err) {
        console.error('RSS-Generator: Error writing RSS file:', err);
    }
}

generateRSS();
