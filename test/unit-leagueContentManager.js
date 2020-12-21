var assert = require('assert');
const manager = require('../util/data/leagueContentManager.js');
require('dotenv').config();

const league_name = "js9012js90120937sj";
const teams = ["whoosh", "temoc", "pagestans"];
const username = "#peterr";
const handle = "peterr";

const contestant_usernames = ["#thedarbear", "#m1sch3f", "#yfsn6", "#wflms20110333"];
const contestant_handles = ["theDarBear", "m1sch3f", "yfsn6", "wflms20110333"];

describe('League Content Manager', function () {
	before(function (done) {
		// delete leagues and users
		manager.deleteLeague(league_name).then((_) => {
			manager.deleteUser(username).then((_) => {
				Promise.all(contestant_usernames.map((username, index) => {
					return manager.deleteUser(username);
				})).then((_) => {
					done();
				}, done);
			}, done);
		}, done);
	});
	describe('League Init', function() {
		it ('Create league', function(done) {
			manager.createLeague(league_name, teams).then(
				(_) => {done();}, done);
		});
		
		it ('Test if league is created', function (done) {
			manager.getLeagueInfo(league_name).then((res) => {
				try {
					assert.equal(res.league_name, league_name);
					assert.deepEqual(res.teams, teams);
					done();
				} catch (err) {
					done(err);
				}
			}, done);
		});
	});

	describe('User Init', function() {
		it (`Check ${username}'s exist`, function (done) {
			manager.userExist(username).then((res) => {
				try {
					assert.ok(!res);
					done();
				} catch (err) { done(err); }
			}, done);
		});

		it (`Create user ${username}`, function(done) {
			manager.registerUser(username).then((res) => {
				done();
			}, done);
		});

		it (`Get ${username}'s info`, function (done) {
			manager.getUserInfo(username).then((res) => {
				try {
					assert.equal(res.username, username);
					done();
				} catch (err) { done(err); }
			}, done);
		});

		it (`Check ${username}'s exist`, function (done) {
			manager.userExist(username).then((res) => {
				try {
					assert.ok(res);
					done();
				} catch (err) { done(err); }
			}, done);
		});

		it (`Link codeforces with handle ${handle} to user ${username}`, function (done) {
			manager.linkCodeforces(username, handle).then((_) => {
				done();
			}, done);
		});

		it (`Check if user ${username} is linked to handle ${handle}`, function (done) {
			manager.getUserInfo(username).then((res) => {
				try {
					try {
						assert.ok(res.cf_handle, `No handle seems to be link to this account`);
						assert.equal(res.cf_handle, handle);
						done();
					} catch (err) { done(err); }
				} catch (err) { done(err); }
			}, done);
		});
	});

	describe('League user interactions', function() {
		it (`Register user ${username} for the league ${league_name}`, function (done) {
			manager.registerUserForLeague(league_name, username).then((res) => {
				done();
			}, done);
		});

		it (`Test if ${username} is a member of the league`, function (done) {
			manager.getLeagueInfo(league_name).then((res) => {
				try {
					var userInLeague = false;
					for (var i = 0; i < res.members.length; i++)
						userInLeague |= res.members[i].username == username;
					assert.ok(userInLeague);
					done();
				} catch (err) { done(err); }
			}, done);
		});

		it (`Test by assigning user ${username} to team ${teams[0]}`, function (done) {
			manager.assignTeam(league_name, username, teams[0]).then((res) => { done(); }, done);
		});

		it (`Test that the team is assigned correctly`, function (done) {
			manager.getLeagueInfo(league_name).then((res) => {
				try {
					for (var i = 0; i < res.members.length; i++) {
						if (res.members[i].username == username) {
							assert.equal(res.members[i].team, teams[0]);
						}
					}
					done();
				} catch (err) { done(err); }
			}, done);
		});

		it (`Register the rest of the users`, function (done) {
			Promise.all(contestant_handles.map((username, i) => {
				return manager.registerUser(contestant_usernames[i]);
			})).then(()=> {done();}, done);
		});

		it (`Link the rest of the user's codeforces`, function (done) {
			contestant_usernames.reduce((promise, username, i) => {
				return promise.then(() => new Promise(r => {setTimeout(r, 300);})).then(() => manager.linkCodeforces(contestant_usernames[i], contestant_handles[i]));
			}, Promise.resolve()).then(()=>{ done(); }, done);
		}).timeout(30000);

		it (`Register the rest of the users into the league ${league_name}`, function (done) {
			const linkUser = async i => {
				return manager.registerUserForLeague(league_name, contestant_usernames[i]);
			};

			Promise.all(contestant_usernames.map((username, i) => linkUser(i))).then(() =>{
				done();
			}, done);
		});
	});

	describe("League Operational", function() {
		it (`Start the league ${league_name}`, function(done) {
			manager.startLeague(league_name).then((_) => {
				done();
			}, done);
		});

		it (`Check every member has a team, and the league has started`, function (done) {
			manager.getLeagueInfo(league_name).then((league) => {
				try {
					assert.ok(league.start_time <= Date.now().valueOf(), `League ${league_name} has not started`);
					for (var i = 0; i < league.members.length; i++) {
						assert.ok(Boolean(league.members[i].team) && league.members[i].team.length > 0, 
							`User ${league.members[i].username} is not assigned to a team`);
					}
					done();
				} catch (err) { done(err); }
			}, done);
		});

		it (`End the league ${league_name}`, function (done) {
			manager.endLeague(league_name).then((res) => {
				done();
			}, done);
		}).timeout(30000);

		it (`Check if league has ended`, function (done) {
			manager.getLeagueInfo(league_name).then((league) => {
				try {
					assert.ok(league.end_time <= Date.now().valueOf(), `League ${league_name} has not ended`);
					done();
				} catch (err) { done(err); }
			}, done);
		});
	});

	describe('Wrapup', function() {
		it ('Delete League from collection', function (done) {
			manager.deleteLeague(league_name).then((_) => {
				manager.getLeagueInfo(league_name).then((league) => {
					if (league != null) throw `League ${league_name} was not deleted`;
					done();
				}, done);
			}, done);
		});

		it (`Delete user ${username} from collection`, function (done) {
			manager.deleteUser(username).then((_) => {
				manager.getUserInfo(username).then((userInfo) => {
					if (userInfo != null)
						throw `User ${username} not successfully deleted.`
					done();
				}, done);
			}, done);
		});

		it (`Delete rest of the users from collection`, function (done) {
			Promise.all(contestant_usernames.map( (username, i) => {
				return manager.deleteUser(username);
			})).then((_) => {
				Promise.all(contestant_usernames.map((username, i) => {
					return manager.getUserInfo(username);
				})).then((res) => {
					try {
						for (var i = 0; i < contestant_usernames.length; i++) {
							assert.equal(res[i], null, `User ${contestant_usernames[i]} not successfully deleted.`);
						}
						done();
					} catch (err) {
						done(err);
					}
				}, done);
			}, done);
		});
	});

	after(function(done) {
		manager.disconnect().then(() => { done(); }, done);
	});
});