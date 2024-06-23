const checkSessionAndExecute = require('../verifySessionData/verifySessionData');
const url  = require('url');
const { reportComment, saveBlogPosts, getBlogData, addComment, getAllComments, getAllBlogs, deletePost, deleteComment } = require('./blogHandler');

function blogRouter(req, res, sessionData) {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;
    const method = req.method;

    let branchExecuted = false;

    if (method === 'POST') {
        if (pathname === '/api/blogComments') {
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getAllComments);
        }else if (pathname === '/api/blogComment') {
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, addComment);
        }else if (pathname === '/api/blogData') {
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getBlogData);
        }else if (pathname === '/saveBlogPosts') {
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, saveBlogPosts);
        }else if (pathname === '/api/reportComment') {
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, reportComment);
        }

    }

    if (method === 'GET') {
        if (pathname === '/api/blogs') {
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, getAllBlogs);
        }
    }

    if (method === 'DELETE') {
        if (pathname === '/api/deletePost') {
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, deletePost);
        }else if (pathname === '/api/deleteComment') {
            branchExecuted = true;
            checkSessionAndExecute(sessionData, req, res, deleteComment);
        }
    }


    return !branchExecuted;
}

module.exports = blogRouter;