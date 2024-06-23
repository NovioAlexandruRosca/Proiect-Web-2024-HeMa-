const { updateFavoritePlants, importPlants, uploadPlantAvatar, getPlantId, getPlantPicture, getPlantData, getAllPlantsFromCollection, createPlantLayour, getMostPopularPlantId, getAllSharedCollections, updatePlantData, updateNumberOfVisitsOnPlant, deletePlant, getAllPlants, getTop10PopularPlants, getFavoritePlants } = require('./plantHandler');
const checkSessionAndExecute = require('../verifySessionData/verifySessionData');
const url  = require('url');

function plantRouter(req, res, sessionData) {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;
    const method = req.method;

    let branchExecuted = false;

    if (method === 'POST') {
        if (pathname === '/api/createPlantLayout') {
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, createPlantLayour);
        }else if(pathname === '/api/plantsOfCollection'){
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getAllPlantsFromCollection);
        }else if(pathname === '/api/plantData'){
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getPlantData);
        }else if(pathname === '/api/plantAvatar'){
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getPlantPicture);
        }else if(pathname === '/api/getPlantId'){
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getPlantId);
        }else if(pathname === '/api/uploadPlantAvatar'){
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, uploadPlantAvatar);
        }else if(pathname === '/api/importPlants'){
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, importPlants);
        }else if(pathname === '/api/updateFavorite'){
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, updateFavoritePlants);
        }
        
    }

    if (method === 'GET') {
        if (pathname === '/api/mostPopularPlantId') {  // USED FOR getting the id of the most popular plant
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getMostPopularPlantId);
        }else if(pathname === '/api/allSharedCollections'){
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getAllSharedCollections);
        }else if(pathname === '/api/allPlants'){
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getAllPlants);
        }else if(pathname === '/api/mostPopularPlants'){
            branchExecuted = true;
            getTop10PopularPlants(req, res);
        }else if(pathname === '/api/favoritePlants'){
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getFavoritePlants);
        }
    }

    if (method === 'DELETE') {
        if (pathname === '/api/deletePlant') {
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, deletePlant);
        }
    }

    if (method === 'PUT') {
        if (pathname === '/api/updatePlant') {
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, updatePlantData);
        }else if(pathname === '/api/updatePlantVisits'){
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, updateNumberOfVisitsOnPlant);
        }
    }

    return !branchExecuted;
}

module.exports = plantRouter;
