import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import http from 'http';
import usersRouter from './routes/users.js';
import { fileURLToPath } from 'url';


import enableWs from 'express-ws';
var app = express();


app.server = http.createServer(app)
enableWs(app,app.server);



let socketCount = 1;
let allSockets = [];

app.ws('/chatSocket', (ws, res) => {
  let currSocketNum = socketCount;
  socketCount++;
  allSockets.push(ws);

  console.log("user " + currSocketNum + " connected.")

  ws.on('message', msg => {
    console.log(`msg from user ${currSocketNum}: ${msg}`)

    allSockets.forEach(s => {
      s.send(currSocketNum + ": " + msg)
    })
  })
})

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);

app.set('view engine', 'jade')
app.set('views', path.join(__dirname, 'views'))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
