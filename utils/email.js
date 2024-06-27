const nodemailer = require("nodemailer");

const sendEmail = async options => {
    const transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: "587",
        auth: {
            user: "c6cdf1e16b1163",
            pass: "08e8429e859cd1"
        }
    });

    const mailOptions = {
        from: "omerdizmen@gmail.com",
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: options.
    }
   
    await transporter.sendMail(mailOptions);

}

module.exports = sendEmail;