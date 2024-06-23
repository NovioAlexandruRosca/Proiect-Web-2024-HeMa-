const { getMostPopularPlantId, getAllSharedCollections, updatePlantData } = require('./plantHandler');
const checkSessionAndExecute = require('../verifySessionData/verifySessionData');
const url  = require('url');

function plantRouter(req, res, sessionData) {
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
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getMostPopularPlantId);
        }else if(pathname === '/api/allSharedCollections'){
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getAllSharedCollections);
        }
    }

    // if (method === 'DELETE') {
    //     if (pathname === '/dev/deletePlant') {
    //         deletePlant(req, res);
    //         branchExecuted = true;
    //     }
    // }

    // if (method === 'PUT') {
    //     if (pathname === '/api/updatePlant') {
    //         branchExecuted = true;
    //     }
    // }

    return !branchExecuted;
}

module.exports = plantRouter;
