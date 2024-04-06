require('dotenv').config();
const fs = require('fs');

const jsonData = {
    "liveServer.settings.port": process.env.PORT,
};

fs.writeFileSync('./.vscode/settings.json', JSON.stringify(jsonData, null, 2));

console.log(jsonData);