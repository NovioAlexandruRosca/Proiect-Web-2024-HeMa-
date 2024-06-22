const { getMostPopularPlantId } = require('./plantHandler');
const url  = require('url');

function plantRouter(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;
    const method = req.method;

    let branchExecuted = false;

    // if (method === 'POST') {
    //     if (pathname === '/dev/addPlant') {
    //         addPlant(req, res);
    //         branchExecuted = true;
    //     }else if (pathname === '/dev/generateToken') {
    //         generateTokenHandler(req, res);
    //         branchExecuted = true;
    //     }
        
    // }

    if (method === 'GET') {
        if (pathname === '/api/mostPopularPlantId') {  // USED FOR getting the id of the most popular plant
            getMostPopularPlantId(req, res);
            branchExecuted = true;
        } 
    }

    // if (method === 'DELETE') {
    //     if (pathname === '/dev/deletePlant') {
    //         deletePlant(req, res);
    //         branchExecuted = true;
    //     }
    // }

    return !branchExecuted;
}

module.exports = plantRouter;
