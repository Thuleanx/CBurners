const client = require('../mongodb.js');
const codeforces = require('../codeforces.js');

const databaseName = 'event';
const leagueCollectionName = 'league';
const userCollectionName = 'users';

/*
	League
		-> league_name : str KEY
		-> start_time: int
		-> end_time: int
		-> teams[]
			-> team_name: str 
		-> points
			-> team_name (str) => points (int)
		-> members[]
			-> username : str
			-> team : str (in team[] or empty) 
			-> points_accumulated: float
			-> last_update_time : unix time 
			-* streak_cnt : int
			-* problems_solved (this league) : int
			-+ challenge_completed[]  
				-> challenge_id : str

	User
		-> username : str KEY
		-> cf_handle : str
		-> time_joined : unix time
		-> problem_solved (in all leagues, incremented after each league ends) : int
		-> pfp: str (pulled from cf)
		-> rating: elo (pulled from cf)
		-> gain_rate: float (points per day)
		-* leages_participated_in[]
			-> league_name
		-+ badges[]
*/

/*
*/
function computePoints(problem_rating, user_rating, live_contest, streak_cnt, num_sub) {
	return 1;
}

async function updateUserPerformance(league_name, username, cf_status = null) {
	var user = await getUserInfo(username);
	var league = await getLeagueInfo(league_name);

	const updateTime = Date.now().valueOf();

	if (!Boolean(user))
		throw `User with username ${username} not found`;
	if (!Boolean(league))
		throw `League with name ${league_name} not found`;
	if (!Boolean(user.cf_handle) || user.cf_handle.length == 0)
		throw `User ${username} does not have a codeforces account linked`;
	if (league.start_time == 0 || league.start_time > updateTime) 
		throw `Attempt to update user before the start of league ${league_name}`;
	if (league.end_time != 0 && league.end_time < updateTime)
		throw `Attempt to update user after the end of league ${league_name}`;

	if (!cf_status) cf_status = await codeforces.getUserStatus(user);

	var submission_cnt = {};
	let finished = new Set();
	var streak_cnt = 0;
	var points_accumulated = 0;

	// O(number of submissions)
	for (var i = cf_status.length - 1; i >= 0; i--) {
		// we ignore all compile errors and failing on the first test
		// we also ignore problems without difficulty rating for now
		if (cf_status[i].verdict == "COMPILATION_ERROR" || cf_status[i].passedTestCount == 0 || 
			!("rating" in cf_status[i].problem))
			continue;

		var problem_id = cf_status[i].problem.contestId + cf_status[i].problem.index;

		// if you are just trying to solve something you solved before, streaks won't be broken, and points won't be gained
		if (finished.has(problem_id)) continue;

		// submission count (important in first solved)
		if (!(problem_id in submission_cnt))
			submission_cnt[problem_id] = 0;

		var num_sub = ++submission_cnt[problem_id];

		if (cf_status[i].verdict == "OK") {
			streak_cnt++;

			points_accumulated += computePoints(cf_status[i].problem.rating, user.internal_cf_rating, 
				cf_status[i].author.participantType == "CONTESTANT", streak_cnt, num_sub);

			finished.add(problem_id);
		} else { streak_cnt = 0; }
	}

	const database = await client.getDatabase(databaseName);
	const collection = client.getCollection(database, leagueCollectionName);

	return await client.updateEntry(collection, {
		league_name: league_name,
		"members.username": username
	}, {
		$set: {
			"members.$.points_accumulated": points_accumulated, 
			"members.$.streak_cnt": streak_cnt,
			"members.$.last_update_time": updateTime
		}
	});
}

async function assignUsersToTeam(league_name, userteamMapping) {
	return await Promise.all(Object.entries(userteamMapping).map((keyValuePair, index) => {
		var username = keyValuePair[0];
		var team_name = keyValuePair[1];
		return assignTeam(league_name, username, team_name);
	}));
}

async function assignTeam(league_name, username, team_name) {
	var league = await getLeagueInfo(league_name);
	if (Boolean(league)) {
		if (league.teams.indexOf(team_name) === -1)
			throw `Team ${team_name} does not exist in the league ${league_name}`;

		const database = await client.getDatabase(databaseName);
		const collection = client.getCollection(database, leagueCollectionName);

		const updateInstruction = {
			$set: {
				"members.$.team": team_name
			}
		};

		return await client.updateEntry(collection, {league_name: league_name, "members.username": username}, 
			updateInstruction);

	} else throw `League with name ${league_name} cannot be found`;
}

async function autoFill(league_name) {
	// algorithm to auto fill everyone into teams
	var league = await getLeagueInfo(league_name);
	if (!Boolean(league)) throw `Cannot find league ${league_name}`;


	var teamPointMapping = {};
	for (var i = 0; i < league.teams.length; i++)
		teamPointMapping[league.teams[i]] = 0;

	for (var i = 0; i < league.members.length; i++) {
		league.members[i].gain_rate = (await getUserInfo(league.members[i].username)).gain_rate;
		if (Boolean(league.members[i].team) && league.members[i].team.length) {
			teamPointMapping[league.members[i].team] += league.members[i].gain_rate;
		}
	}

	league.members.sort(function (a,b) {
		return Math.sign(a.gain_rate - b.gain_rate);
	});

	let userteamMapping = {};

	for (var i = league.members.length - 1; i >= 0; i--) {
		if (Boolean(league.members[i].team) && league.members[i].team.length) continue;

		var lo = 0;
		for (var j = 1; j < league.teams.length; j++) {
			if (teamPointMapping[league.teams[j]] < teamPointMapping[league.teams[lo]]) {
				lo = j;
			}
		}
		userteamMapping[league.members[i].username] = league.teams[lo];
		teamPointMapping[league.teams[lo]] += league.members[i].gain_rate;
	}
	return await assignUsersToTeam(league_name, userteamMapping);
}

async function startLeague(league_name) {
	var league = await getLeagueInfo(league_name);
	if (!Boolean(league)) throw `League with name ${league_name} does not exist`;
	if (league.start_time != 0) throw `League with name ${league_name} has already started`;

	await autoFill(league_name);

	const database = await client.getDatabase(databaseName);
	const collection = client.getCollection(database, leagueCollectionName);
	return await client.updateEntry(collection, { league_name: league_name }, {
		$set: {
			start_time: Date.now().valueOf()
		}
	});
}

async function endLeague(league_name) {
	var league = await getLeagueInfo(league_name);
	if (!Boolean(league)) throw `League with name ${league_name} does not exist`;
	var timestamp = Date.now().valueOf();

	if (!Boolean(league.start_time) || league.start_time >= timestamp) throw `Cannot end league ${league_name} because it hasn't started`;
	if (Boolean(league.end_time)) throw `Cannot end league ${league_name} because it has already ended`;

	const database = await client.getDatabase(databaseName);
	const collection = client.getCollection(database, leagueCollectionName);

	for (var i = 0; i < league.members.length; i++) {
		await new Promise(r => setTimeout(r, 400)); // prevent too many requests per second
		updateUserPerformance(league_name, league.members[i].username);
	}

	return await client.updateEntry(collection, { league_name: league_name }, {
		$set: {
			end_time: timestamp
		}
	});
}

async function getUserInfo(username) {
	const database = await client.getDatabase(databaseName);
	const collection = client.getCollection(database, userCollectionName);
	return await client.findEntry(collection, {username: username});
}

async function userExist(username){
	return Boolean(await getUserInfo(username));
}

async function getLeagueInfo(league_name) { 
	const database = await client.getDatabase(databaseName);
	const collection = client.getCollection(database, leagueCollectionName);

	return await client.findEntry(collection, {league_name:league_name});
}

async function leagueExist(league_name) {
	return Boolean(await  getLeagueInfo(league_name));
}

module.exports = {
	createLeague: async (league_name, teams) => {
		var doc = {
			league_name: league_name,
			teams: teams,
			members: [],
			start_time: 0,
			end_time: 0
		};
		// doc.points = teams.reduce(function (map, element) {
		// 	map[element] = 0;
		// 	return map;	
		// }, {});

		const database = await client.getDatabase(databaseName);
		const collection = client.getCollection(database, leagueCollectionName);

		return await client.insertEntry(collection, doc);
	},
	deleteLeague: async (league_name) => {
		const database = await client.getDatabase(databaseName);
		const collection = client.getCollection(database, leagueCollectionName);

		return await client.deleteEntry(collection, {league_name: league_name});
	},
	getLeagueInfo: getLeagueInfo,
	leagueExist: leagueExist,
	registerUser: async (username) => {
		const database = await client.getDatabase(databaseName);
		const collection = client.getCollection(database, userCollectionName);

		// checking if same username exists
		if (await client.findEntry(collection, {username: username}))
			throw `User of name ${username} already exists`;

		var user = {
			username : username,
			time_joined: Date.now().valueOf(),
			solved: 0,
			points_accumulated: 0,
			gain_rate: 0,
			league_participation: []
		};

		return await client.insertEntry(collection, user);
	},
	getUserInfo: getUserInfo,
	userExist: userExist,
	deleteUser: async (username) => {
		const database = await client.getDatabase(databaseName);
		const collection = client.getCollection(database, userCollectionName);
		return await client.deleteEntry(collection, {username: username});
	},
	linkCodeforces: async (username, handle) => {
		const database = await client.getDatabase(databaseName);
		const collection = client.getCollection(database, userCollectionName);

		var cf = await codeforces.getUserInfo(handle);
		if (Boolean(cf) && typeof cf !== "string") {
			if (userExist(username)) {
				const updateInstruction = {
					$set: {
						cf_handle: handle,
						rating: cf.maxRating,
						pfp: cf.avatar,
						internal_cf_rating: 0,
						gain_rate: Math.max(1400, cf.maxRating)/1000.0
					}
				};
				return await client.updateEntry(collection, {username: username}, updateInstruction);
			} else throw `User ${username} does not exist`;
		} else throw `Handle ${handle} does not exist`;
	},
	registerUserForLeague: async (league_name, username) => {
		if (await leagueExist(league_name)) {
			const database = await client.getDatabase(databaseName);
			const collection = client.getCollection(database, leagueCollectionName);

			if (! (await userExist(username)))
				throw `User with username ${username} not found`;

			var league = await getLeagueInfo(league_name);
			for (var i = 0; i < league.members.length; i++) 
				if (league.members[i].username == username)
					throw `User ${username} already joined this league`;

			var member = {
				username: username,
				team: "",
				points: 0,
				last_update_time: Date.now().valueOf(),
				streak_cnt: 0,
				problems_solved: 0
			};

			const updateInstruction = {
				$push: {
					members: member
				}
			};
			const query = {
				league_name : league_name
			};

			return await client.updateEntry(collection, query, updateInstruction);

		} else throw `League with name ${league_name} cannot be found`;
	},
	assignTeam: assignTeam,
	assignUsersToTeam: assignUsersToTeam,
	updateUserPerformance: updateUserPerformance,
	startLeague: startLeague,
	endLeague: endLeague,
	disconnect: async () => {
		return await client.disconnect();
	}
}