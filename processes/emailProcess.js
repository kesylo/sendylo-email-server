const nodemailer = require("nodemailer");

const list = {
	"List-Help": "<mailto:contact@sendylo.com?subject=help>",
	help: `contact@sendylo.com?subject=help`,
	unsubscribe: {
		url: "https://sendylo.com/contact",
		comment: "unsubscribe"
	}
};
// nodemailer headers
const headers = {
	"x-priority": "1",
	"x-msmail-priority": "High",
	importance: "high"
};

const generateEmail = i => {
	return `sendylo.app${i}@gmail.com`;
};

const createTransport = serverEmail => {
	return nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: serverEmail,
			pass: process.env.GMAIL_PASSWORD
		}
	});
};

const sendEmailGmail = async data => {
	const serverEmail = generateEmail(data.smtpServer);
	let transporter = createTransport(serverEmail);

	const mailOptions = {
		from: `Sendylo <${serverEmail}>`,
		to: `${data.name} <${data.to}>`,
		priority: "high",
		list: list,
		headers: headers,
		replyTo: "contact@sendylo.com",
		subject: data.subject,
		html: data.htmlEmail,
		text: data.emailText
	};

	await transporter.sendMail(mailOptions, function (err, info) {
		if (err) {
			console.log(err);
		} else console.log(info);
	});
};

const emailProcess = async (job, done) => {
	sendEmailGmail(job.data)
		.then(() => {
			done();
		})
		.catch(e => {
			console.log(e);
			done(new Error(e));
		});
};

module.exports = emailProcess;
