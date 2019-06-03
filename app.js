const Koa = require('koa');
const app = new Koa();
const bodyParser = require('koa-bodyparser');
const static = require('koa-static');
const controller = require('./controller');

app.use(static(__dirname + '/static'));

app.use(bodyParser());
app.use(controller());

console.log('app start at port 4000');
var io = require('socket.io').listen(app.listen(4000));
/**
 * Socket.io event handling
 */
require('./app/socketHandler.js')(io);
