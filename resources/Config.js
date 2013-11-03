var LOG = require("winston"),
	Autowire = require("wantsit").Autowire;

Config = function() {

};

Config.prototype.retrieveOne = function(request) {
	var config = {
		type: "registry"
	};

	request.reply(config);
};

Config.prototype.toString = function() {
	return "Config resource"
}

module.exports = Config;