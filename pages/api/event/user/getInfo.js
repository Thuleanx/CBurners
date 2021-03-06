var manager = require('../../../../util/data/leagueContentManager.js');

export default async function handler(req, res) {
	return new Promise(resolve => {
		if (req.query.username) {
			manager.getUserInfo(req.query.username).then(
				(userInfo) => {
					if (userInfo === null) {
						res.status(404).json({
							comment: `User ${req.query.username} does not exist.`
						});
						resolve();
					} else {
						res.status(200).json(userInfo);
						resolve();
					}
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
	});
}