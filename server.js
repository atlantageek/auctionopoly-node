const express = require('express');
const redis = require("ioredis")
require("dotenv").config();
var Game = require('./game.js');
const session = require('express-session');
const redisStore = require('connect-redis')(session);
const bodyParser = require('body-parser');
const path = require('path')
const hbs = require('hbs')
const fs = require('fs'); 
const fsPromises = require('fs').promises;

const { hashSync, genSaltSync, compareSync } = require("bcrypt");
const ACCOUNT_NAMESPACE = 'account:'
 
hbs.registerPartials(path.join(__dirname, 'views/partials'));
const app = express();
const expressWs = require('express-ws')(app)
const publicPath = path.join(__dirname, 'public');
const cors = require("cors");
const { weightSrvRecords } = require('ioredis/built/cluster/util.js');
 
app.use(cors()); 
player_sockets=[];
   
//setup Game Object
let game = new Game();
game.initialize().then((gobj) => {
    // gobj.set_players(1, 2, 3, 4) 
    // gobj.assign_ownership(2, 'boardwalk');
    // gobj.assign_ownership(2, 'parkplace');
    // gobj.assign_ownership(3, 'mediterraneanave');

    // let property = game.get_property('boardwalk');
    // let property2 = game.get_property('parkplace');
    // let mort_property=game.get_property('mediterraneanave')
    // property.add_house(); 
    // property2.add_house(); 
    // property.add_house(); 
    // property2.add_house(); 
    // property.add_house(); 
    // property2.add_house(); 
    // property.add_house();  
    // property2.add_house(); 
    // property.add_house(); 
    // mort_property.mortgaged(true)
})   
const PORT = process.env.APP_PORT;
const IN_PROD = process.env.NODE_ENV === 'production'
const TWO_HOURS = 1000 * 60 * 60 * 2

const REDIS_PORT = process.env.REDIS_PORT;

//create the ioredis client
const redisClient = new redis();


const sessionStore = new redisStore({ client: redisClient });
 

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json())
app.use('/', express.static(publicPath));
app.set('views', path.join(__dirname) + '/views')
app.set('view engine', 'hbs')

app.use(session({
    name: process.env.SESS_NAME,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    secret: process.env.SESS_SECRET,
    cookie: {
        maxAge: TWO_HOURS,
        sameSite: true,
        secure: IN_PROD
    }
}))

const redirectLogin = (req, res, next) => {
    if (!req.session.email) {
        res.redirect('/login')
    } else {
        next()
    }
} 
   
const redirectHome = (req, res, next) => {
    if (req.session.email) {
        res.redirect('/home')
    } else {
        next()
    }
}
  
app.ws('/ws', function(ws, req) {
    ws.on('message', function(msg) {
      let msgObj=JSON.parse(msg);
      //register msg should have a user account, name associated with it.
      if (msgObj.msgType=='register'){
        if (!game.open) {
            ws.send(JSON.stringify({msgType:'ERROR',errMsg:'Game is closed',kickout:true}));
            return;
        }
        if (!msgObj.hasOwnProperty('name') || !msgObj.hasOwnProperty('user')) {
            ws.send(JSON.stringify({msgType:'Error',errMsg:'Name and account are required'}));
            return;
        }
        console.log('Adding Player' + req.session.email)
        game.add_player(req.session.email,req.session.email);
        player_sockets.push(ws);
      }
      if (msgObj.msgType=='start_game') {
        console.log("try start game.")
        if (game.start_game()) start_game();
      } 
      if (msgObj.msgType=='done') {
        console.log("try start game.")
        game.next_turn();
        let player = game.get_current_player();
        processPlayer(player);
      } 
      console.log('MSG' + msg);
      setInterval(() => {
        ws.send(JSON.stringify({gamestate:game, player:req.session.email, msgType:'update'}))
      },1000)
    });   
  });
  
app.get('/', (req, res) => {
    const { email } = req.session
    console.log(email);
    res.render('index', {
        email: email
    })  
}) 
  
app.get('/home', redirectLogin, async (req, res) => {
    const { email } = req.session
    console.log(email);
    if (email) {
        try {
            redisClient.hgetall(ACCOUNT_NAMESPACE + email, function (err, obj) {

                console.log(obj)
                //req.user = obj;
                res.send(`
        <h1>Home</h1>
        <a href='/board'>Play</a>
        <ul>
        <li> Name: ${obj.first_name} </li>
        <li> Email:${obj.email} </li>
        </ul> 
      
        `)
            })
        } catch (e) {
            console.log(e);
            res.sendStatus(404);
        }
    }

})

app.get('/login', redirectHome, (req, res) => {
    res.send(`
    <h1>Login</h1>
    <form method='post' action='/login'>
    <input type='email' name='email' placeholder='Email' required />
    <input type='password' name='password' placeholder='password' required/>
    <input type='submit' />
    </form>
    <a href='/register'>Register</a>
    `)
}) 

app.get('/board', async (req, res) => {
    if (!req.session.email) {
        res.redirect('/login')
    }
   
    let data = await fs.promises.readFile('monopoly.json');
    let parsed_data = JSON.parse(data);
    res.render('board', {
        tiles: parsed_data['tiles'],email:req.session.email
    })
    console.log("Boardx")
})

app.get('/register', redirectHome, (req, res) => {
    console.log("hi")
    res.send(`
    <h1>Register</h1>
    <form method='post' action='/Register'>
    <input type='text' name='firstName' placeholder='First Name' required />
    <input type='text' name='lastName' placeholder='Last Name' required />
    <input type='email' name='email' placeholder='Email' required />
    <input type='password' name='password' placeholder='password' required/>
    <input type='submit' />
    </form> 
    <a href='/login'>Login</a>
    `)
})
   
  
app.post('/login', redirectHome, async (req, res, next) => {
    try {
        console.log("LOGIN")
        const email = req.body.email;
        let password = req.body.password;
        let obj = await redisClient.hgetall(ACCOUNT_NAMESPACE + email)
        console.log(email, password)
        if (!obj) {
            return res.send({
                message: "Invalid email or password"
            })
        } 
        console.log(obj);
        const isValidPassword = compareSync(password, obj.password);
        if (isValidPassword) {
            console.log(req.session);
            obj.password = undefined;
            console.log(obj);
            req.session.email = obj.email;
            console.log(req.session.email);
            return res.redirect('/home');
        } else {
            res.send( 
                "Invalid email or password"
            );
            return res.redirect('/login')
        }


    } catch (e) {
        console.log(e);
    }


});





app.post('/register', redirectHome, async (req, res, next) => {
    try {
        console.log("Register")
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const email = req.body.email;
        let password = req.body.password;

        if (!firstName || !lastName || !email || !password) {
            return res.sendStatus(400);
        }

        const salt = genSaltSync(10);
        password = hashSync(password, salt);


        let result = await redisClient.hset('account:' + email, {
            'first_name': firstName,
            'last_name': lastName,
            'email': email,
            'password': password
        });
        // , function (err, reply) {
        //     if (err) {
        //         console.log(err);
        //     }
        //     console.log(reply);
        //     res.redirect('/register');

        // });
      
        res.redirect('/home')



    } catch (e) {
        console.log(e);
        res.sendStatus(400);
    }
});




app.post('/logout', redirectLogin, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/home')
        }

        res.clearCookie(process.env.SESS_NAME)
        res.redirect('/login')
    })

})


app.listen(PORT, () => { console.log(`server is listening on ${PORT}`) });


function getContext(id) {
    return { name: 'great', orientation: '180deg', group: 'red' }
}
  
hbs.registerHelper("get_property", function (id) {
    return "tile name='greatestever' group=green orientation=90deg"
});
hbs.registerHelper("getHouseCount", function (id) {
    return '333333'
});
hbs.registerHelper("firstHouse", function (id) {
    let property = game.get_property(id);
    if (id) return property.house_count >=1 && property.house_count <5
    return false
});
hbs.registerHelper("secondHouse", function (id) {
    let property = game.get_property(id);
    if (id) return property.house_count >=2 && property.house_count <5
    return false
});
hbs.registerHelper("thirdHouse", function (id) {
    let property = game.get_property(id);
    if (id) return property.house_count >=3 && property.house_count <5
    return false
}); 
hbs.registerHelper("fourthHouse", function (id) {
    let property = game.get_property(id);
    if (id) return property.house_count >=4 && property.house_count <5
    return false 
});
hbs.registerHelper("hotel", function (id) {
    let property = game.get_property(id); 
    if (id) return property.house_count == 5 
    return false
});
hbs.registerHelper("mortgageColor", function (id) {
    let property = game.get_property(id); 
    if (id) return property.is_mortgaged() ? "red" : "blue";
    return "white"
}); 

function rollDice() {
    let die1 = Math.floor(Math.random()*6)+1;
    let die2 = Math.floor(Math.random()*6)+1; 
    return die1+die2;
}
function processPlayer(player) {
    let player_idx=game.get_player_idx(player);
    if (game.in_jail(player)){

    }
    //If player is in jail then ask if they want to pay or roll
    //If not pay then roll for double {
        //If double then move
    //}
    //else If pay then allow move {
    let move=rollDice();
    //}


    game.move_by(player,move);
    // Get property player is on
    //If property is available start bidding subfunction
    //If property is owned... trigger rent pay
    //If property is a function then do the function.
    var jsonMsg = JSON.stringify({msgType:'dosomething', gamestate:game,player:player.name})
    player_sockets[player_idx].send(jsonMsg);
 
}
function start_game() {
    console.log("Starting Game")
    let player = game.get_current_player();
    processPlayer(player);
}
//Game State Machine
//Users Join Game
//Are there 4 players?
//If yet enable start button
//Time start for all 4 players.
//Start game.  Lock new players from joining
//while (>1 player have positive network)
//*pick next player
//*Player In jail?{
//* No Pay 50? {
//*    try double roll if roll double then do move
//* }
//* Pay 50 {
//*   charge 50
//*   Play Normal turn
//*}
//* NORMAL TURN:
//** Do Roll
//*  Move
//* If project not owned then a {
//*  Auction mode Start auction at mortgage price
//*  (Wait for bid or 6 seconds) {
//*     if six seconds and no bid leave property unowned
//*     If bid then offer new amount
//*     If six seconds then give property to winner and deduct funds
//* }

//*}


//Start with first player and roll their dice
