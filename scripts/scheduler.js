const cron = require('node-cron');
const { exec } = require('child_process');

console.log('Scheduler.js: The Scheduler.js was launched');

 // Primul câmp (0) specifică minutele.
    // 0 înseamnă că functia lambda va fi rulată când campul minute este setat 0.
    // Următoarele patru câmpuri (*) sunt folosite:
    // ore, zile din lună, lună și zile săptămânii.
    // /* înseamnă că funcția va fi rulată pentru orice valori valide pentru aceste câmpuri.

cron.schedule('* * * * *', () => {

    console.log('Scheduler.js: rss_generator.js is called');
    exec('node ./scripts/rss_generator.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Error: ${stderr}`);
            return;
        }
        console.log('Scheduler.js: The rss generator script ran succesfully');
    });
}, {
    scheduled: true,
    timezone: 'Europe/Bucharest'
});
