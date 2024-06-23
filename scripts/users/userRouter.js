const { getUserPicture, uploadPicture, updateUserData, getUserData, getFollowingList, checkRelationship, getNameOfFollowedUser, followUser, getBadgesData, modifyBadge, getUserId, getUsername } = require('./userHandler');
const checkSessionAndExecute = require('../verifySessionData/verifySessionData');
const url  = require('url');

function userRouter(req, res, sessionData) {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;
    const method = req.method;

    let branchExecuted = false;

    if (method === 'POST') {
        if (pathname === '/api/modifyBadge') {             
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, modifyBadge);
        }else if (pathname === '/api/badges') {             
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getBadgesData);
        }else if (pathname === '/api/follow') {             
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, followUser);
        }else if (pathname === '/api/userName') {             
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getNameOfFollowedUser);
        }else if (pathname === '/api/checkRelationship') {             
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, checkRelationship);
        }else if (pathname === '/api/getFollowing') {             
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getFollowingList);
        }else if (pathname === '/api/clientData') {             
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getUserData);
        }else if (pathname === '/api/updateUser') {             
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, updateUserData);
        }else if (pathname === '/api/uploadAvatar') {             
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, uploadPicture);
        }else if (pathname === '/api/avatar') {             
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getUserPicture);
        }

    }

    if (method === 'GET') {
        if (pathname === '/api/user') {             
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getUsername);
        }else if (pathname === '/api/id') {             
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getUserId);
        }
    }

    return !branchExecuted;
}

module.exports = userRouter;