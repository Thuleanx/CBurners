var manager = require('../../../../util/data/leagueContentManager.js');

// start a leaguge, with the informations given
export default async function handler(req, res) {
	return new Promise (resolve => {
		const {league_name, usernames} = req.query;
		if (!league_name) {
			res.status(500).json({
				comment: `League name required. Not provided.`
			});
			resolve();
		} else if (!usernames) {
			res.status(500).json({
				comment: `At least one member's username required. None provided.`
			});
			resolve();
		} else {
			manager.getLeagueInfo(league_name).then((league) => {
				if (league == null) {
					res.status(404).json({
						comment: `League ${league_name} cannot be found.`
					});
					resolve();
				} else {
					var usernameList = usernames.split(";");

					var results = [];
					for (var i = 0; i < league.members.length; i++) {
						if (usernameList.includes(league.members[i].username)) {
							results.push(league.members[i]);
						}
					}

					res.status(200).json(results);
				}
			}, err => {
				res.status(500).json({
					comment: err
				});
				resolve();
			});
		}
	});
}