const RSS = require('rss-generator');
const fs = require('fs').promises;
require('dotenv').config();

const port = process.env.PORT || 5500;

const planteClasament = [
    { nume: 'Lavanda', popularitate: 100 },
    { nume: 'Rozmarin', popularitate: 80 },
    { nume: 'Musetel', popularitate: 70 },
    { nume: 'Busuioc', popularitate: 50 },
    { nume: 'Floare de colt', popularitate: 40 },
    { nume: 'Lavanda', popularitate: 10 },
];
async function generateRSS() {
    const feed = new RSS({
        title: 'Cele mai populare plante',
        description: 'Lista celor mai populare plante din aplicația noastră',
        feed_url: 'http:/plantemistoraudetot/rss',
        site_url: `http://localhost:${port}`
    });

    planteClasament.forEach(planta => {
        feed.item({
            title: planta.nume,
            description: `Popularitate: ${planta.popularitate}`,
            url: `http://example.com/plante/${planta.nume}`
        });
    });

    const xml = feed.xml();

    try {
        await fs.writeFile('./rss/rss.xml', xml);
        console.log('RSS-Generator: The RSS file was successfully created');
    } catch (err) {
        console.error('RSS-Generator: Error writing RSS file:', err);
    }
}

generateRSS();