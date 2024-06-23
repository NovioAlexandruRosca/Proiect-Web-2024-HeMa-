const { sendContactMail, returnError404, generateRss } = require('./utilHandler');
const checkSessionAndExecute = require('../verifySessionData/verifySessionData');
const url  = require('url');

function utilRouter(req, res, sessionData) {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;
    const method = req.method;

    let branchExecuted = false;

    if(method === 'POST'){
        if (pathname === '/error404Return') {      
            branchExecuted = true;
            returnError404(req, res, sessionData);
        }else if (pathname === '/sendEmail') {      
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, sendContactMail);
        }
    }

    if(method === 'GET'){
        if (pathname === '/rss') {      
            branchExecuted = true;
            generateRss(req, res);
        }
    }

    return !branchExecuted;
}

module.exports = utilRouter;