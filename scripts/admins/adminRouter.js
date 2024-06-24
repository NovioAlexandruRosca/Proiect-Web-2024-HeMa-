const { generateClientsJson, generatePlantsJson, generatePlantsCsv, generatePlantsPdf, generateClientsPdf, generateClientsCsv, rejectReport, banUser, listOfClients, deleteClient, getReports } = require('./adminHandler');
const checkSessionAndExecute = require('../verifySessionData/verifySessionData');
const url  = require('url');

function adminRouter(req, res, sessionData) {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;
    const method = req.method;

    let branchExecuted = false;

    if(method === 'POST'){
        if (pathname === '/admin/api/banUser') {      
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, banUser);
        }else if (pathname === '/admin/api/rejectReport') {      
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, rejectReport);
        }
    }

    if(method === 'GET'){
        if (pathname === '/admin/api/clients') {      
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, listOfClients);
        }else if (pathname === '/admin/api/bans') {      
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getReports);
        }else if (pathname === '/admin/api/reports/clients/pdf') {      
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, generateClientsPdf);
        }else if (pathname === '/admin/api/reports/clients/csv') {      
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, generateClientsCsv);
        }else if(pathname === '/admin/api/reports/clients/json'){
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, generateClientsJson);
        }else if(pathname === '/admin/api/reports/plants/pdf'){
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, generatePlantsPdf);
        }else if(pathname === '/admin/api/reports/plants/csv'){
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, generatePlantsCsv);
        }else if(pathname === '/admin/api/reports/plants/json'){
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, generatePlantsJson);
        }
    }

    if(method === 'DELETE'){
        if (pathname.startsWith('/admin/api/clients/')) {      
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, deleteClient);
        }
    }

    if(method === 'PUT'){
    }

    return !branchExecuted;
}

module.exports = adminRouter;