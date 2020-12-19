var authManager = require('../../../util/data/authManager.js');

export default function handler(req, res) {
	if (!req.query.password && !req.body.password) {
		res.status(500).json({
			comment: `Password required. Not provided.`
		});
		resolve();
	}
	else {
		var password = req.query.password || req.body.password;
		res.status(200).send(authManager.generatePasswordHash(password));
	}
}