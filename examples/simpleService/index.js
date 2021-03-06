const anxeb = require('../../index');
const Server = anxeb.Server;

let server = new Server({
	name        : 'Simple Server',
	description : 'Simple Server Example',
	key         : 'server',
	settings    : {
		root : __dirname,
		log  : {
			identifier : '[server_name]'
		}
	},
	services    : {
		api : {
			domain   : 'examples.anxeb.com',
			name     : 'Basic Service',
			key      : 'api',
			active   : true,
			settings : {
				log     : {
					identifier : '[service_name]'
				},
				socket  : {
					host : '127.0.0.1',
					port : 8080
				},
				routing : {
					routes : {
						index : {
							url     : '/',
							access  : anxeb.Route.access.public,
							timeout : 1000,
							methods : {
								get : function (context) {
									context.send({
										hello : 'world'
									});
								}
							}
						}
					}
				}
			}
		}
	}
});

server.start();