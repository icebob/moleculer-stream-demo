"use strict";

const { ServiceBroker } = require("moleculer");
const crypto = require("crypto");

const iv = Buffer.from(crypto.randomBytes(16));
const password = Buffer.from(crypto.randomBytes(32));

// Create broker #1
const broker = new ServiceBroker({
	nodeID: "aes",
	transporter: "TCP",
	logger: console,
	logLevel: "info"
});

broker.createService({
	name: "aes",
	actions: {
		encrypt(ctx) {
			const encrypt = crypto.createCipheriv("aes-256-ctr", password, iv);
			return ctx.params.pipe(encrypt);
		},

		decrypt(ctx) {
			const decrypt = crypto.createDecipheriv("aes-256-ctr", password, iv);
			return ctx.params.pipe(decrypt);
		}
	}
});

broker.start().then(() => broker.repl());