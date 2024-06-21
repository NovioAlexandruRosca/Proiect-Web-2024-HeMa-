const { addPlant, deletePlant, getPlant, getPlantCollection, getAllPlants, getComments, getCollections, getBadges, getFriends, generateTokenHandler, getToken } = require('./devOperations');
const url  = require('url');

function devRouter(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;
    const method = req.method;

    let branchExecuted = false;

    if (method === 'POST') {
        if (pathname === '/dev/addPlant') {
            addPlant(req, res);
            branchExecuted = true;
        }else if (pathname === '/dev/generateToken') {
            generateTokenHandler(req, res);
            branchExecuted = true;
        }else if (pathname === '/dev/getToken') {
            getToken(req, res);
            branchExecuted = true;
        }
        
    }

    if (method === 'GET') {
        if (pathname === '/dev/getPlant') {
            getPlant(req, res);
            branchExecuted = true;
        } else if (pathname === '/dev/getPlantCollection') {
            getPlantCollection(req, res);
            branchExecuted = true;
        } else if (pathname === '/dev/getAllPlants') {
            getAllPlants(req, res);
            branchExecuted = true;
        } else if (pathname === '/dev/getComments') {
            getComments(req, res);
            branchExecuted = true;
        } else if (pathname === '/dev/getCollections') {
            getCollections(req, res);
            branchExecuted = true;
        } else if (pathname === '/dev/getBadges') {
            getBadges(req, res);
            branchExecuted = true;
        } else if (pathname === '/dev/getFriends') {
            getFriends(req, res);
            branchExecuted = true;
        }
    }

    if (method === 'DELETE') {
        if (pathname === '/dev/deletePlant') {
            deletePlant(req, res);
            branchExecuted = true;
        }
    }

    return !branchExecuted;
}

module.exports = devRouter;
