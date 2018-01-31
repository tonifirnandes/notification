//enable type script
'user strict';

//import dependencies
const express = require('express');
const expressHandlebars = require('express-handlebars');
const pathLib = require('path');
const bodyParser = require('body-parser');
const socketIo = require('socket.io');
const redis = require('redis');
const methodOverride = require('method-override');

// Todo for secure server and better http protocol we should using http v2
// const httpV2 = require('http2');
const httpLib = require('http');

//add other configs
const localServer = {
    port: process.env.PORT || 3000,
    hostName: process.env.HOST_NAME || "localhost"
};

//init app
const app = express();
const router = express.Router();
//setup server
const server = httpLib.createServer(app);
const socketIoServer = socketIo(server);

const homePageDir = __dirname + '/base/view/home';
const notFoundViewContentDir = __dirname + '/error/view/not_found';
const logViewContentDir = __dirname + '/log/view/log';

//setup redis client and server
let redisClient = redis.createClient();
redisClient.on('connect', onConnectedToRedis);
redisClient.on('error', onRedisError);

var serverConnected, redisClientConnected;

function onConnectedToRedis() {
    redisClientConnected = true;
    console.log("Connected to redis server");
}

function onRedisError() {
    redisClientConnected = false;
    console.log("Redis error ...");
}

//set view engine
app.engine('handlebars', expressHandlebars({
    defaultLayout: homePageDir
}));
app.set('view engine', 'handlebars');

//body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

//method everrideable
app.use(methodOverride('method'));

//our server routing
//landing - home page and middleware
app.get('/', function(req, res, next) {
    res.render(logViewContentDir, {
        serverStatus: serverConnected,
        redisClientStatus: redisClientConnected
    });
});

//default routing to home page if no satisfied router found
app.get('*', function(req, res) {
    res.render(notFoundViewContentDir, {
        layout: false
    });
});

//socket server callback
socketIoServer.on('connection', function(socket) {
    console.log('a user connected');
    socket.broadcast.emit('hi new user');
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
    socket.on('chat message', function(msg) {
        console.log('message: ' + msg);
        socketIoServer.emit('chat message', msg);
    });
});

//running server/app
server.on("error", onServerError);
server.on("listening", onServerListening);
server.listen(localServer.port);

//server event callback
function onServerListening() {
    serverConnected = true;
    console.log("server connected on port : " + localServer.port);
}

function onServerError(error) {
    serverConnected = false;
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string' ?
        'Pipe ' + port :
        'Port ' + port;

    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}