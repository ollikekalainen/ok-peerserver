/*
 ok-peerserver.js
-----------------------------------------------------------------------------------------
 (c) Olli Kekäläinen, Rajahyöty Oy

 




 20230228
-----------------------------------------------------------------------------------------
*/

"use strict";

const okserver = require("ok-server");

createDefaultOptions(); // Set default content for the server.json file.

let SERVER;
module.exports.startServer = ( options = {}) => {
	const p = Object.assign({
	    logFolder: __dirname + "/log",
	    pulseFolder: __dirname,
	    optionsFile: __dirname + "/server.json",
	    logFileRequests: true
	}, options );
	SERVER = new okPeerServer(p).start();
	return SERVER;
}

class okPeerServer extends okserver.OKServer {
	constructor(options) {
		super(options);
		this.#extendApi();
	}

	onHttpReady() {
		this.#initPeerHub(this.httpServer); 
	}

	onHttpsReady() {
		this.#initPeerHub(this.httpsServer); 
	}

	start() {
		super.start({
			onError: (error) => { 
				console.log(error);
				this.stop(()=>{ setTimeout(()=>{ process.exit(0);}, 500 );}); 
			},
			onSuccess: () => { console.log("ok-peerserver started");}
		});
		return this;
	}

	#extendApi() {
		const self = this;
		okserver.defineApiRequest([{ name: "getpeersource", parameters: {}, worker: function () {
			self.peerHub.getPeerConnectionSource( this.onError, this.onSuccess );
		}}]);
	}

	#fileExists( filename ) {
		try {
			require("fs").statSync( filename );
		} 
		catch (e) {
			return false;
		}
		return true;
	}

	#initPeerHub( server ) {
		const PeerHub = require("ok-peerhub");
		this.peerHub = new PeerHub({
			httpServer: server,
			deboutEnabled: this.options.deboutEnabled,
			encryptionKey: this.#solveEncryptionKey()
		});
	}

	#solveEncryptionKey() {
		const fs = require("fs");
		if (this.options.encryptionKey) {
	    	return this.#fileExists( this.options.encryptionKey ) 
	    		? fs.readFileSync(this.options.encryptionKey)
	    		: this.options.encryptionKey;
	    }
	}
}

function createDefaultOptions() {
	const keyBuffer = Buffer.alloc(32);
	Object.assign( okserver.defaultOptions, {
		deboutEnabled: false,
		encryptionKey: require("crypto").randomFillSync(keyBuffer).toString("hex"),
		port: 3007,
		defaultDirectory: __dirname,
		apiExtensions: [],
		accessFiltering: [
		    {
		        "path": __dirname,
		        "status": "forbidden"
		    }
		],
		virtualDirectories: {
		    // site: {
		    //     path: "c:\\wwwroot\\site"
		    // },
		    // deboutconsole: {
		    //     path: "c:\\wwwroot\\deboutconsole"
		    // }
		}
	});
}
