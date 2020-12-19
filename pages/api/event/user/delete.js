const {authenticate} = require('../../../../util/authenticate.js');
var manager = require('../../../../util/data/leagueContentManager.js');

export default function handler(req, res) {
	return new Promise(resolve => {
		if (authenticate(req, res)) {
			const {username} = req.query;

			if (username) {
				manager.deleteUser(username).then(
					(_) => {
						res.status(200).json({
							comment: `User ${username} successfully deleted.`
						});
						resolve();
					}, err => {
						res.status(500).json({
							comment: err
						});
						resolve();
					}
				);
			} else {
				res.status(500).json({
					comment: `Username required. Not provided.`
				});
				resolve();
			}
		} else resolve();
	});
}