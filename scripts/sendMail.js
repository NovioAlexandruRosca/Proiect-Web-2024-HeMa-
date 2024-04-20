const nodemailer = require('nodemailer');
require('dotenv').config();

function sendEmail(formData, callback) {

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.MAILADDRESS,
            pass: process.env.MAILPASSWORD,
        }
    });

    const nume = formData.nume;
    const telefon = formData.telephone;
    const email = formData.gmail;
    const mesaj = formData.message;
    const subiect = formData.subject;

    const mailOptions = {
        from: email,
        to: process.env.MAILADDRESS,
        subject: subiect,
        text: `Nume: ${nume}\nTelefon: ${telefon}\nEmail: ${email}\n\nMesaj: ${mesaj}`
    };

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

module.exports = sendEmail;