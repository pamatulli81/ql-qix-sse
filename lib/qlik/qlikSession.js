const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/12.170.2.json');
const settings = require('../../settings');

var getSession = function (commonHeader) {
	const traceSocket = false
 	let isDesktop = commonHeader.userId == settings.DESKTOP_USER;
	const certPath = settings.SERVER_CERT_PATH;
	const readCert = filename => fs.readFileSync(path.resolve(__dirname, certPath, filename));

	const config = {
		schema,
			url: `ws://localhost:${isDesktop?settings.SERVER_WS_PORT:settings.DESKTOP_WS_PORT}/app/engineData`,
			suspendOnClose: true
	}

	if (isDesktop) {
		config.createSocket = url => new WebSocket(url);	
	} else {
		let valueObj = {}
    	commonHeader.userId.split('; ').forEach(element => {
      		let arr = element.split('=')
      		valueObj[arr[0]] = arr[1]
    	})
		config.createSocket = url => new WebSocket(url, {
			ca: [readCert('root.pem')],
			key: readCert('client_key.pem'),
			cert: readCert('client.pem'),
			headers: {
				'X-Qlik-User': `UserDirectory=${encodeURIComponent(valueObj.UserDirectory)}; UserId=${encodeURIComponent(valueObj.UserId)}`,
			},	
		})
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';  // Required for nodejs 10		
	}
	
	let _session = enigma.create(config);
	
	if(traceSocket) {
		// bind traffic events to log what is sent and received on the socket:
		_session.on('traffic:sent', data => console.log('sent:', data));
		_session.on('traffic:received', data => console.log('received:', data));
    }
    _session.on('closed', x => _session = null);
    
	return _session;
};

const closeSession = async function (session) {
	if (session && session.close) {
		await session.close()
		return null
	} else {
		return session
	}
	
}

module.exports = {
	getSession,
	closeSession,
  };