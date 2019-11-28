const { StreamChat } = require('../../../dist/index.js');
const apiKey = 'upm4tebtgppk';
const apiSecret = 'pd5kbydzz6h7hqsfh37ksprdhnjg3zmmxmyvv2zuax2qhm6f3yvwg33zezv8vwtb';
module.exports = {
	getTestClient: function getTestClient(serverSide) {
		return new StreamChat(apiKey, serverSide ? apiSecret : null);
	},
	getServerTestClient: function getServerTestClient() {
		return this.getTestClient(true);
	},
	getTestClientForUser2: function getTestClientForUser2(userID, options) {
		const client = this.getTestClient(false);
		client.setUser({ id: userID, ...options }, this.createUserToken(userID));
		return client;
	},
	getTestClientForUser: async function getTestClientForUser(userID, options) {
		const client = this.getTestClient(false);
		const health = await client.setUser(
			{ id: userID, ...options },
			this.createUserToken(userID),
		);
		client.health = health;
		return client;
	},
	createUserToken: function createUserToken(userID) {
		const c = new StreamChat(apiKey, apiSecret);
		return c.createToken(userID);
	},
	sleep: function sleep(ms) {
		return new Promise(resolve => {
			setTimeout(resolve, ms);
		});
	},
	runAndLogPromise: function runAndLogPromise(promiseCallable) {
		promiseCallable()
			.then(() => {})
			.catch(err => {
				console.warn('runAndLogPromise failed with error', err);
			});
	},
	createUsers: async function createUsers(userIDs) {
		const serverClient = this.getServerTestClient();
		const users = [];
		for (const userID of userIDs) {
			users.push({ id: userID });
		}
		const response = await serverClient.updateUsers(users);
		return response;
	},
};
