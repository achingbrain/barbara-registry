var Autowire = require("wantsit").Autowire;

Services = function() {
	this._seaport = Autowire;
};

Services.prototype.retrieveAll = function(request) {
	var output = [];

	this._seaport.query().forEach(function(service) {
		output.push({
			id: service.id,
			name: service.role,
			version: service.version,
			host: service.host,
			port: service.port,
			type: service.type
		});
	});

	request.reply(output);
};

Services.prototype.toString = function() {
	return "Services resource"
}

module.exports = Services;