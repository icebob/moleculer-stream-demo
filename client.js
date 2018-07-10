"use strict";

const { ServiceBroker } = require("moleculer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const chalk = require("chalk");

// Create broker #1
const broker = new ServiceBroker({
	nodeID: "client",
	transporter: "TCP",
	logger: console,
	logLevel: "info"
});

const fileName = path.join(__dirname, "files", "image.jpg");
const fileName2 = path.join(__dirname, "files", "image-received.jpg");

broker.start()
	.then(() => broker.waitForServices("aes"))
	.then(() => getSHA(fileName))
	.then(origHash => {
		const startTime = Date.now();
		broker.logger.info("Original SHA:", origHash);

		return broker.call("aes.encrypt", fs.createReadStream(fileName))
			.then(stream => broker.call("aes.decrypt", stream))
			.then(stream => {
				const s = fs.createWriteStream(fileName2);
				stream.pipe(s);
				s.on("close", () => {
					broker.logger.info("Time:", chalk.yellow.bold(Date.now() - startTime + "ms"));
					getSHA(fileName2).then(hash => {
						broker.logger.info("Received SHA:", hash);
						if (hash != origHash)
							broker.logger.error(chalk.red.bold("HASH mismatch!"));
						else 
							broker.logger.info(chalk.green.bold("File encoded & decoded successfully!"));

						broker.stop();
					});
				});
			});
	})
	.catch(err => {
		broker.logger.error(err);
		broker.stop();
	});

function getSHA(fileName) {
	return new Promise((resolve, reject) => {
		let hash = crypto.createHash("sha1");
		let stream = fs.createReadStream(fileName);
		stream.on("error", err => reject(err));
		stream.on("data", chunk => hash.update(chunk));
		stream.on("end", () => resolve(hash.digest("hex")));
	});
}
