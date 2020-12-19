var authManager = require('../../../util/data/authManager.js');

export default async function handler(req, res) {
	return new Promise (resolve => {
		const username = req.query.username || req.body.username;
		const password = req.query.password || req.body.password;

		if (!username) {
			res.status(500).json({
				comment: "Username required. Not provided."
			});
			resolve();
		} else if (!password) {
			res.status(500).json({
				comment: "Password required. Not provided."
			});
			resolve();
		} else {
			authManager.verifyUser(username, password).then(result => {
				if (result) {
					res.status(200).send(authManager.generateToken({
						username: username,
						passwordHash: authManager.generatePasswordHash(password)
					}));
				} else {
					res.status(500).json({
						comment: `Authentication failed. Incorrect username or password.`
					});
				}
				resolve();
			}, err => {
				res.status(500).json({
					comment: err
				});
				resolve();
			});
		}
	});
}