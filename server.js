const express = require('express');
require("dotenv").config();
const session = require('express-session');
const redisStore = require('connect-redis')(session);
const bodyParser = require('body-parser');
const { hashSync, genSaltSync, compareSync } = require("bcrypt");
const redis = require('redis');


const app = express();

const cors = require("cors");

app.use(cors());


const PORT = process.env.APP_PORT;
const IN_PROD = process.env.NODE_ENV === 'production'
const TWO_HOURS = 1000 * 60 * 60 * 2

const REDIS_PORT = process.env.REDIS_PORT;


//create the redis client
const redisClient = redis.createClient({
    host: 'localhost',
    port: REDIS_PORT
})
redisClient.on('error', function (err) {
    console.log('Could not establish a connection with redis. ' + err);
});
redisClient.on('connect', function (err) {
    console.log('Connected to redis successfully');
});

redisClient.connect().catch(console.error)


const sessionStore = new redisStore({ client: redisClient });


app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json())


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
    res.send(`
    <h1> Welcome!</h1>
     ${email ? `<a href = '/home'> Home </a>
    <form method='post' action='/logout'>
    <button>Logout</button>
    </form>` : `<a href = '/login'> Login </a>
   <a href = '/register'> Register </a>
`}
    `)
})


app.get('/home', redirectLogin, async (req, res) => {
    const { email } = req.session
    console.log(email);
    if (email) {
        try {
            redisClient.hgetall(email, function (err, obj) {

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
        let obj = await redisClient.hGetAll(email)


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
        let result = await redisClient.hSet(email,{
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