const {authenticate} = require('../../../../util/authenticate.js');
var manager = require('../../../../util/data/leagueContentManager.js');

// start a leaguge, with the informations given
export default async function handler(req, res) {
	return new Promise (resolve => {
		if (authenticate(req, res)) {
			const {league_name, username, team_name} = req.query;
			if (!league_name) {
				res.status(500).json({
					comment: `League name required. Not provided.`
				});
				resolve();
			} else if (!username) {
				res.status(500).json({
					comment: `Username required. None provided.`
				});
				resolve();
			} else if (!team_name) {
				res.status(500).json({
					comment: `Team name required. None provided.`
				});
				resolve();
			} else {
				manager.assignTeam(league_name,username,team_name).then((_) => {
					res.status(200).json({
						comment: `User ${username} successfully assigned to team ${team_name} in the league ${league_name}`
					});
					resolve();
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