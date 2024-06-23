const { countReaction, getAllCollections, getCollectionData, createCollection, deleteCollection, modifyCollectionData, reactToCollection, modifyTimeOfCollection } = require('./collectionHandler');
const checkSessionAndExecute = require('../verifySessionData/verifySessionData');
const url  = require('url');

function collectionRouter(req, res, sessionData) {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;
    const method = req.method;

    let branchExecuted = false;

    if (method === 'POST') {
        if (pathname === '/api/react') {
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, reactToCollection);
        }else if (pathname === '/api/createCollection') {           
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, createCollection);
        }else if (pathname === '/api/collectionData') {           
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getCollectionData);
        }else if (pathname === '/api/clientCollections') {           
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getAllCollections);
        }

    }

    if (method === 'GET') {
        if (pathname.startsWith('/api/reactionCount')) {
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, countReaction);
        }
    }

    if (method === 'DELETE') {
        if (pathname === '/api/deleteCollection') {            
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, deleteCollection);
        }
    }

    if (method === 'PUT') {
        if (pathname === '/api/modifyCollection') {            
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, modifyTimeOfCollection);
        }else if (pathname === '/api/updateCollection') {            
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, modifyCollectionData);
        }
    }

    return !branchExecuted;
}

module.exports = collectionRouter;