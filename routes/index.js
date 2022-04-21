const express = require("express");
const router = express.Router();
const { GoogleSpreadsheet } = require("google-spreadsheet");
const schedule = require("node-schedule");
const nodemailer = require("nodemailer");

//region Description
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

const createMailOptions = group => {
	const arr = [];
	for (let i = 0; i < group.length; i++) {
		const data = group[i];
		const serverMail = generateEmail(group[i].smtpServer);
		arr.push({
			from: `Sendylo <${serverMail}>`,
			to: `${data.name} <${data.to}>`,
			priority: "high",
			list: list,
			headers: headers,
			replyTo: "contact@sendylo.com",
			subject: data.subject,
			html: data.htmlEmail,
			text: data.emailText
		});
	}
	return arr;
};

const createTransporters = group => {
	const arr = [];
	for (let i = 0; i < group.length; i++) {
		const serverMail = generateEmail(group[i].smtpServer);
		const tr = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: serverMail,
				pass: process.env.GMAIL_PASSWORD
			}
		});
		arr.push(tr);
	}
	return arr;
};

function addMinutes(date, minutes) {
	return new Date(date.getTime() + minutes * 60000);
}

const sendEmailGmail = async group => {
	const transporters = createTransporters(group);
	const mailOptions = createMailOptions(group);

	if (transporters.length === mailOptions.length) {
		for (let i = 0; i < transporters.length; i++) {
			const transport = transporters[i];
			const options = mailOptions[i];
			await transport.sendMail(options, function (err, info) {
				if (err) {
					console.log(err);
				} else console.log("Sent:", options.from);
			});
		}
	}
	console.log("-------------------------------------------------");
};
//endregion

router.post("/send-bulk-emails", async function (req, res, next) {
	const doc = new GoogleSpreadsheet(req.body.spreadSheetId);
	const totalServersCount = req.body.totalServerCount;
	const subject = req.body.subject;
	const htmlEmail = req.body.htmlEmail;
	const emailText = req.body.emailText;
	const sendInterval = req.body.sendInterval;

	try {
		await doc.useServiceAccountAuth({
			client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
			private_key: process.env.GOOGLE_PRIVATE_KEY
		});

		await doc.loadInfo();
		const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]

		const rows = await sheet.getRows({
			offset: 0 // skip first line
		});

		const finalArr = [[]];
		let serverCurIndex = 0;
		let currPos = 0;
		rows.forEach((row, i) => {
			if (serverCurIndex < totalServersCount) {
				serverCurIndex += 1;
			} else {
				serverCurIndex = 1;
				currPos += 1;
				finalArr.push([]);
			}

			finalArr[currPos].push({
				to: row.email,
				name: row.name,
				subject: subject,
				smtpServer: serverCurIndex,
				htmlEmail: htmlEmail,
				emailText: emailText
			});
		});

		res.status(200).send();

		let inter = 0.1;
		console.log("----------- Starting bulk send at:", new Date());
		for (let i = 0; i < finalArr.length; i++) {
			const group = finalArr[i];
			const finalDate = addMinutes(new Date(), inter);
			schedule.scheduleJob(finalDate, function () {
				sendEmailGmail(group);
			});
			inter += sendInterval;
		}
	} catch (e) {
		res.status(500).send();
	}
});

module.exports = router;
