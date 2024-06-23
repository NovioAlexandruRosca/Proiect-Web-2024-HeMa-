
const checkSessionAndExecute = (sessionData, req, res, callback) => {

    if (sessionData == null) {
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('Unauthorized');
    } else {
        callback(req, res, sessionData);
    }
};

module.exports = checkSessionAndExecute;
