var Seaport = require("seaport"),
	LOG = require("winston"),
	nconf = require("nconf"),
	common = require("../brewbot-common"),
	wantsit = require("wantsit"),
	bonvoyage = require("bonvoyage"),
	WebSocketServer = require("ws").Server,
	Columbo = require("../../columbo");

// set up arguments
nconf.argv().env().file("./config.json");

var container = new wantsit.Container();
container.register("config", nconf);

// create a REST api
container.createAndRegister("resourceDiscoverer", Columbo, {resourceDirectory: nconf.get("rest:resources")});
container.createAndRegister("restServer", common.rest.RESTServer);

// start seaport
var seaport = container.register("seaport", Seaport.createServer());
seaport.on("listening", function() {
	LOG.info("Registry", "Listening on port", seaport.address().port, "with mdns service name", nconf.get("registry:name"));
});
seaport.on("register", function(service) {
	LOG.info("Registry", "Service was registered", service.role + "@" + service.version, "running on", service.host + ":" + service.port, "node", service._node);

	container.find("webSocketServer").broadcast({registered: service});
});
seaport.on("free", function(service) {
	LOG.info("Registry", "Service was removed", service.role + "@" + service.version, "running on", service.host + ":" + service.port, "node", service._node);

	container.find("webSocketServer").broadcast({removed: service});
});
seaport.listen();

var bonvoyageServer = new bonvoyage.Server({
	serviceType: nconf.get("registry:name")
});
bonvoyageServer.publish(seaport);

var bonvoyageClient = new bonvoyage.Client({
	serviceType: nconf.get("registry:name")
});
bonvoyageClient.register({
	role: nconf.get("rest:name"),
	version: nconf.get("rest:version"),
	createService: function(port) {
		var restServer = container.find("restServer");
		restServer.start(port);
	}
});
bonvoyageClient.register({
	role: nconf.get("ws:name"),
	version: nconf.get("ws:version"),
	createService: function(port) {
		var webSocketServer = container.createAndRegister("webSocketServer", WebSocketServer, {port: port});
		webSocketServer.broadcast = function(data) {
			this.clients.forEach(function(client) {
				client.send(JSON.stringify(data));
			});
		};
		webSocketServer.on("connection", function(client) {
			client.on("message", function(message) {
				var result = seaport.query(message);

				client.send(JSON.stringify({query: result}));
			});
		});
	}
});
