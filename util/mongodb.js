const { MongoClient } = require('mongodb');

let cached = global.mongo;
if (!cached) cached = global.mongo = {};

function configure() {
	if (!cached.client) {
		cached.connected = false;
		cached.client = new MongoClient(process.env.MONGODB_URI, { useUnifiedTopology: true, useNewUrlParser: true });
	}
}

function connect() {
	if (!cached.client)
		configure();
	if (!cached.connected) {
		cached.connected=true;
		return cached.client.connect();
	}
	else return Promise.resolve();
}

module.exports = {
	configure: configure,
	connect: connect,
	getDatabase: async (databaseName) => {
		await connect();
  		return cached.client.db(databaseName);
	},
	findEntry: async (collection, query, options={}) => {
		return await collection.findOne(query, options);
	},
	findEntries: async (collection, query, options={}) => {
		var cursor = await collection.find(query, options);
		return cursor.toArray();
	},
	insertEntry: (collection, entry) => {
		return collection.insertOne(entry);
	},
	insertEntries: (collection, entries, options={}) => {
		return collection.insertMany(entries, options);
	},
	updateEntry: (collection, query, updateInstruction, options={}) => {
		return collection.updateOne(query, updateInstruction);
	},
	updateEntries: (collection, query, updateInstruction, options={}) => {
		return collection.updateMany(query, updateInstruction);
	},
	replaceEntry: (collection, query, entry, options={}) => {
		return collection.replaceOne(query, entry, options);
	},
	deleteEntry: (collection, query) => {
		return collection.deleteOne(query);
	},
	deleteEntries: (collection, query) => {
		return collection.deleteMany(query);
	},
	createCollection: (database, collectionName) => {
		return database.createCollection(collectionName); 
	},
	getCollection: (database, collectionName) => {
		return database.collection(collectionName);
	},
	dropCollection: (database, collectionName) => {
		return database.collection(collectionName).drop(); 
	},
	entryExist: async (collection, query, options={}) => {
		var entry = await collection.find(query, options);
		return Boolean(entry);
	},
	disconnect: () => {
		var client = cached.client;
		cached.client = null;
		return client.close();
	}
}
