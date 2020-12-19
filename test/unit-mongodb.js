var assert = require('assert');
const client = require('../util/mongodb.js');
require('dotenv').config();

const databaseName = 'cburner';
const collectionName = 'leagueTemp';
const entry = {
	handle: 'peterr',
	title: 'grandmaster',
	link: 'https://codeforces.com/profile/peterr'
};
const entry2 = {
	handle: 'TheDarBear',
	title: 'grandmaster',
	link: 'https://codeforces.com/profile/TheDarBear'
};
const updateInstruction = {
	$set: {
		title: 'poggermember'
	}
};
const replaceEntry = {
	handle: 'peterr',
	title: 'poggermember',
	link: 'https://codeforces.com/profile/peterr'
};
const query = {
	handle: 'peterr'
};
const queryMultiple = {
	title: 'grandmaster'
};
const queryMultipleAfterUpdate = {
	title: 'poggermember'
};

function match(entry1, entry2) {
	return entry1.handle == entry2.handle && entry1.title == entry2.title && entry1.link == entry2.link;
}

describe('Mongo DB', function() {
	before(function(done) {
		try {
			console.log(process.env.MONGODB_URI);
			console.log(process.env.SECRET);
			client.configure();

			done();
		} catch (err) {
			done(err);
		}
	});
	var database, collection; 
	describe('Initialize Database', function() {
		it('Connect to mongodb', function(done) {
			client.connect().then((res) => {
				done();
			}, done);
		});
		it(`Connect the database ${databaseName}`, function(done) {
			client.getDatabase(databaseName).then((db) => { database = db; done(); }, done);
		});
		it (`Creating the collection ${collectionName}`, function (done) {
			try {
				database.createCollection(collectionName).then((res) => {
					collection = res;
					done();
				}, done);
			} catch (err) {
				done(err);
			}
		});
	});
	describe('Basic Database Functions', function() {
		it ('Insert entry', function (done) {
			client.insertEntry(collection, entry).then(() => {
				client.findEntry(collection, query).then((res) => {
					try {
						assert.ok(match(entry, res), "Entry inserted does not match the one in database");
						done();
					} catch (err) {
						done(err);
					}
				}, done);
			}, done);
		});
		it ('Test if entry exist', function (done) {
			client.entryExist(collection, query).then((res) => {
				try {
					assert.ok(res, "Entry does not seem to exist");
					done();
				} catch (err) { done(err); }
			}, done);
		});
		it ('Update entry', function (done) {
			client.updateEntry(collection, query, updateInstruction).then(() => {
				client.findEntry(collection, query).then(res => {
					try {
						assert.ok(!match(entry, res), "Entry does not seem to have been updated in database");
						done();
					} catch (err) { done(err); }
				}, done);
			}, done);
		});
		it ('Replace entry', function (done) {
			client.replaceEntry(collection, query, replaceEntry).then(()=> {
				client.findEntry(collection, query).then(res => {
					try {
						assert.ok(match(replaceEntry, res), "Replaced entry does not match one in database");
						done();
					} catch (err) { done(err); }
				}, done);
			}, done);
		});
		it ('Delete entry', function (done) {
			client.deleteEntry(collection, query).then(() => {
				client.findEntry(collection, query).then( res => {
					try {
						assert.ifError(res);
						done();
					} catch (err) { done ("Deletion did not delete the entry"); }
				}, done);
			}, done);
		});
	});
	describe('More Complex Functions', function () {
		it ('Inserting multiple entries', function (done) {
			client.insertEntries(collection, [entry, entry2], () => {
				client.findEntries(collection, queryMultiple, {sort: {handle:1}}).then((res) => {
					try {
						assert.ok(match(entry, res[1]), 'Entry inserted does not match reference entry');
						assert.ok(match(entry2, res[0]), 'Entry inserted does not match reference entry');
						done();
					} catch (err) {
						done(err);
					}
				}, done);
			}, done);
		});
		it ('Updating multiple entries', function (done) {
			client.updateEntries(collection, queryMultiple, updateInstruction).then((_) => {
				client.findEntries(collection, queryMultipleAfterUpdate, {sort: {handle:1}}).then((res) => {
					try {
						assert.ok(!match(entry, res[1]), 'Entry does not seem to have been updated');
						assert.ok(!match(entry2, res[0]), 'Entry does not seem to have been updated');
						done();
					} catch (err) {
						done(err);
					}
				}, done);
			}, done);
		});
		it ('Deleting all entries', function (done) {
			client.deleteEntries(collection, queryMultipleAfterUpdate).then((res) => {
				client.findEntry(collection, queryMultipleAfterUpdate).then((res) => {
					if (res === null) {
						done();
					} else done("Seems like not all entries got deleted");
				}, done);
			}, done);
		});
	});
	describe('Freeing memory / Closing connection', function() {
		it (`Deleting the collection ${collectionName}`, function (done) {
			try {
				collection.drop(done);
			} catch (err) {
				done(err);
			}
		});
	});
	after(function(done) {
		client.disconnect().then( ()=> {
			done();
		}, done);
	});
});