const {authenticate} = require('../../../../util/authenticate.js');
var manager = require('../../../../util/data/leagueContentManager.js');

// start a leaguge, with the informations given
export default async function handler(req, res) {
	return new Promise (resolve => {
		if (authenticate(req, res)) {
			const {league_name, members} = req.query;
			if (!league_name) {
				res.status(500).json({
					comment: `League name required. Not provided.`
				});
				resolve();
			} else if (!members) {
				res.status(500).json({
					comment: `Member list required. Not provided.`
				});
				resolve();
			} else {
				Promise.all(
					members.split(";").map((username, index) => {
						return manager.registerUserForLeague(league_name, username);
					})
				).then(() => {
					res.status(200).json({
						comment: `Members successfully added to league ${league_name}.`
					});
				}, err => {
					res.status(500).json({
						comment: err
					});
					resolve();
				});
			}
		} else resolve();
	});
}