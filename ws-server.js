// Importing the required modules
const WebSocketServer = require('ws');

//MESSAGE TYPES
const JOIN = 'join'
const REQUEST_GAMES = 'request_games'

// Load Property and Event data (json)

// Connect to redis
// Maybe reset live games


class OnlinePlayer {
    constructor(ws, player_id) {
        this.player_id = player_id;
        this.game_id = null;
        this.ws = ws;
    }
    process() {

    }
}


// Creating a new websocket server
const wss = new WebSocketServer.Server({ port: 8080 })


// Creating connection using websocket
wss.on("connection", ws => {
    let player = null;
    console.log("new client connected");
    // sending message

    ws.on("message", data => {
        try {
            let msg = JSON.parse(data);
            if (!msg.hasOwnProperty('cmd')) throw new Error('Sending bad commands, ignoring.')
            if (msg['cmd'] == 'JOIN') {
                if (player != null) throw new Error('Player trying to rejoin')
            }
        }
        catch (error) {
            console.log(error);
            disconnectWS(ws);
        }


    });
    // handling what to do when clients disconnects from server
    ws.on("close", () => {
        console.log("the client has connected");
        disconnectWS(ws);
    });
    // handling client connection error
    ws.onerror = function () {
        console.log("Some Error occurred")
    }
});
console.log("The WebSocket server is running on port 8080");

function disconnectWS(ws) {

    ws.close();


    setTimeout(() => {
        // Second sweep, hard close
        // for everyone who's left

        if ([ws.OPEN, ws.CLOSING].includes(ws.readyState)) {
            ws.terminate();
        }

    }, 10000);
}