const express = require('express');
const redis = require("ioredis")
require("dotenv").config();
const session = require('express-session');
const redisStore = require('connect-redis')(session);
const bodyParser = require('body-parser');
const path = require('path')
const hbs = require('hbs')
const fs = require('fs');
const fsPromises = require('fs').promises;
const { hashSync, genSaltSync, compareSync } = require("bcrypt");
const ACCOUNT_NAMESPACE='account:'

hbs.registerPartials(path.join(__dirname, 'views/partials'));
const app = express();
const publicPath = path.join(__dirname, 'public');
const cors = require("cors");

app.use(cors());


const PORT = process.env.APP_PORT;
const IN_PROD = process.env.NODE_ENV === 'production'
const TWO_HOURS = 1000 * 60 * 60 * 2

const REDIS_PORT = process.env.REDIS_PORT;


//create the redis client
// const redisClient = redis.createClient({
//     host: 'localhost',
//     port: REDIS_PORT
// })
// redisClient.on('error', function (err) {
//     console.log('Could not establish a connection with redis. ' + err);
// });
// redisClient.on('connect', function (err) {
//     console.log('Connected to redis successfully');
// });

// redisClient.connect().catch(console.error)
 
//create the ioredis client
const redisClient = new redis();


const sessionStore = new redisStore({ client: redisClient });


app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json())
app.use('/', express.static(publicPath));
app.set('views', path.join(__dirname) + '/views')
app.set('view engine','hbs')

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



app.get('/', (req, res) => {
    const { email } = req.session
    console.log(email);
    res.render('index',{
        email:email
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
        <a href='/'>Main</a>
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
    console.log("Board")
    let data = await fs.promises.readFile('monopoly.json');
    let parsed_data = JSON.parse(data);
    res.render('board',{
        tiles:parsed_data['tiles']
    })
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

        console.log(email,password)
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

        console.log("HSET")
        console.log(redisClient)
        let result = await redisClient.hset('account:'+email,{
            'first_name': firstName,
            'last_name': lastName,
            'email': email,
            'password': password});
        // , function (err, reply) {
        //     if (err) {
        //         console.log(err);
        //     }
        //     console.log(reply);
        //     res.redirect('/register');

        // });
        console.log(result);
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
    return {name:'great', orientation:'180deg', group:'red'}
}
 
hbs.registerHelper("getProperty", function(id) {
    return "tile name='greatestever' group=green orientation=90deg"
  
  });