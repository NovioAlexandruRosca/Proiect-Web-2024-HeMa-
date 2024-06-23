const adminRouter = require('../admins/adminRouter');
const utilRouter = require('../utils/utilRouter');
const authRouter = require('../authentification/authRouter');
const userRouter = require('../users/userRouter');
const devRouter = require('../dev/dev');
const plantRouter = require('../plants/plantRouter');
const blogRouter = require('../blogs/blogRouter');
const collectionRouter = require('../collections/collectionRouter');

function router(req, res, sessionData) {

    let branchExecuted = false;

    if(!adminRouter(req, res, sessionData)){
        branchExecuted = true;
    }
    if(!utilRouter(req, res, sessionData)){
        branchExecuted = true;
    }
    if(!authRouter(req, res, sessionData)){
        branchExecuted = true;
    }
    if(!userRouter(req, res, sessionData)){
        branchExecuted = true;
    }
    if(!collectionRouter(req, res, sessionData)){
        branchExecuted = true;
    }
    if(!plantRouter(req, res, sessionData)){
        branchExecuted = true;
    }
    if(!blogRouter(req, res, sessionData)){
        branchExecuted = true;
    }
    if(!devRouter(req, res)){
        branchExecuted = true;
    }

    return !branchExecuted;

}

module.exports = router;