const { register, login, logout, resetPassword, activateAccount, updatePassword } = require('./authHandler');
const checkSessionAndExecute = require('../verifySessionData/verifySessionData');
const url  = require('url');

function authRouter(req, res, sessionData) {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;
    const method = req.method;

    let branchExecuted = false;

    if(method === 'POST'){
        if (pathname === '/api/reset-password') {      
            branchExecuted = true;
            resetPassword(req, res);
        }else if (pathname === '/logout') {      
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, logout);
        }else if (pathname === '/testCredentials') {      
            branchExecuted = true;
            login(req, res);
        }else if (pathname === '/registerCredentials') {      
            branchExecuted = true;
            register(req, res);
        }
    }

    if(method === 'GET'){
        if (pathname === '/api/activateAccount') {      
            branchExecuted = true;
            activateAccount(req, res);
        }
    }

    if(method === 'PUT'){
        if (pathname === '/api/updatePassword') {      
            branchExecuted = true;
            updatePassword(req, res);
        }
    }

    return !branchExecuted;
}

module.exports = authRouter;