const nodemailer = require('nodemailer');
require('dotenv').config();


function sendResetPasswordLink(email, token, action, callback) {

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.MAILADDRESS,
            pass: process.env.MAILPASSWORD,
        }
    });

    let mailOptions = {};

    if(action == 1){
        const resetLink = `http://localhost:${process.env.PORT}/resetPassword.html?token=${token}$email=${email}`;
        const subiect = "Password Reset On HeMa Platform";

        mailOptions = {
            from: process.env.MAILADDRESS,
            to: email,
            subject: subiect,
            html: `<p>To reset your password, click <a href="${resetLink}">here</a>.</p>`
        };
    }else if(action == 2){
        const activationLink = `http://localhost:${process.env.PORT}/api/activateAccount?token=${token}$email=${email}`;
        const subiect = "Account Activation on HeMa Platform";

        mailOptions = {
            from: process.env.MAILADDRESS,
            to: email,
            subject: subiect,
            html: `<p>To activate your account, click <a href="${activationLink}">here</a>.</p>`
        };
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            callback(error);
        } else {
            console.log('Email sent:', info.response);
            callback(null);
        }
    });
}

module.exports = sendResetPasswordLink;