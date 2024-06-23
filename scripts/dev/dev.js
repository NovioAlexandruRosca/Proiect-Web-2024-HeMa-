const { addPlant, deletePlant, getPlant, getPlantCollection, getAllPlants, getComments, getCollections, getBadges, getFriends, generateTokenHandler, getToken } = require('./devOperations');
const url  = require('url');

function devRouter(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;
    const method = req.method;

    let branchExecuted = false;

    if (method === 'POST') {
        if (pathname === '/dev/v1/addPlant') {
            addPlant(req, res);
            branchExecuted = true;
        }else if (pathname === '/dev/v1/generateToken') {
            generateTokenHandler(req, res);
            branchExecuted = true;
        }else if (pathname === '/dev/v1/getToken') {
            getToken(req, res);
            branchExecuted = true;
        }
        
    }

    if (method === 'GET') {
        if (pathname === '/dev/v1/getPlant') {
            getPlant(req, res);
            branchExecuted = true;
        } else if (pathname === '/dev/v1/getPlantCollection') {
            getPlantCollection(req, res);
            branchExecuted = true;
        } else if (pathname === '/dev/v1/getAllPlants') {
            getAllPlants(req, res);
            branchExecuted = true;
        } else if (pathname === '/dev/v1/getComments') {
            getComments(req, res);
            branchExecuted = true;
        } else if (pathname === '/dev/v1/getCollections') {
            getCollections(req, res);
            branchExecuted = true;
        } else if (pathname === '/dev/v1/getBadges') {
            getBadges(req, res);
            branchExecuted = true;
        } else if (pathname === '/dev/v1/getFriends') {
            getFriends(req, res);
            branchExecuted = true;
        }
    }

    if (method === 'DELETE') {
        if (pathname === '/dev/v1/deletePlant') {
            deletePlant(req, res);
            branchExecuted = true;
        }
    }

    return !branchExecuted;
}

module.exports = devRouter;
