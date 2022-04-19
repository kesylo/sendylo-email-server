const express = require("express");
const { sendEmailToQueue } = require("../processes/emailQueue");
const router = express.Router();
const { GoogleSpreadsheet } = require("google-spreadsheet");

router.post("/send-bulk-emails", async function (req, res, next) {
	const doc = new GoogleSpreadsheet(req.body.spreadSheetId);
	const totalServersCount = req.body.totalServerCount;
	const subject = req.body.subject;
	const htmlEmail = req.body.htmlEmail;
	const emailText = req.body.emailText;

	await doc.useServiceAccountAuth({
		client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
		private_key: process.env.GOOGLE_PRIVATE_KEY
	});

	await doc.loadInfo();
	const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]

	const rows = await sheet.getRows({
		offset: 0 // skip first line
	});

	let serverCurIndex = 0;
	rows.forEach(row => {
		if (serverCurIndex < totalServersCount) {
			serverCurIndex += 1;
		} else serverCurIndex = 1;

		if (row.email?.length > 0) {
			sendEmailToQueue({
				to: row.email,
				name: row.name,
				subject: subject,
				smtpServer: serverCurIndex,
				htmlEmail: htmlEmail,
				emailText: emailText
			});
		}
	});

	res.status(200).send();
});

module.exports = router;
