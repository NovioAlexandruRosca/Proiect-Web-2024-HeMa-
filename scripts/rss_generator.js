const RSS = require('rss-generator');
const fs = require('fs');

const planteClasament = [
    { nume: 'Lavanda', popularitate: 100 },
    { nume: 'Rozmarin', popularitate: 80 },
    { nume: 'Musetel', popularitate: 70 },
    { nume: 'Busuioc', popularitate: 50 },
    { nume: 'Floare de colt', popularitate: 40 },
    { nume: 'Lavanda', popularitate: 10 },
];

const feed = new RSS({
    title: 'Cele mai populare plante',
    description: 'Lista celor mai populare plante din aplicația noastră',
    feed_url: 'http:/plantemistoraudetot/rss',
    site_url: 'http://localhost:5501'
});

planteClasament.forEach(planta => {
    feed.item({
        title: planta.nume,
        description: `Popularitate: ${planta.popularitate}`,
        url: `http://example.com/plante/${planta.nume}`
    });
});

const xml = feed.xml();

fs.writeFile('./rss/rss.xml', xml, (err) => {
    if (err) 
        throw err;
    console.log('The RSS file was succesfully created');
});