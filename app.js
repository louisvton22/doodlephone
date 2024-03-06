import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import http from 'http';
import usersRouter from './routes/users.js';
import gameRouter from './routes/game.js';
import canvasRouter from './routes/canvas.js'
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'

import enableWs from 'express-ws';
import models  from './models.js';
var app = express();


app.server = http.createServer(app)
enableWs(app,app.server);



let socketCount = 1;
let allSockets = {};

app.ws('/chatSocket', (ws, req) => {
  let currSocketNum = socketCount;
  socketCount++;
  allSockets[currSocketNum] = {websocket: ws, name:req.query.name};

  console.log("user " + allSockets[currSocketNum].name + " connected.")

  // need to establish several events that we need to listen for throughout the game
  ws.on('message', async (msg) => {
    let message = JSON.parse(msg);
    console.log(`action type: ${message.event} from user ${allSockets[currSocketNum].name}`)

    switch(message.event){
      case ('chat'):
       let data = {event:"chat", data: `${allSockets[currSocketNum].name} : ${message.message}`}
       Object.keys(allSockets).forEach(sCount => {
          // message structure: {event:"chat", data:"message"}
          
          allSockets[sCount].websocket.send(JSON.stringify(data));
        })
        break;
      case ('updateLobby'):
        let response = await fetch("http://localhost:3000/users")
        let lobby = await response.text()
        Object.keys(allSockets).forEach(sCount => {
          // message structure: {event:"updateLobby", data: HTMLElement}
          allSockets[sCount].websocket.send(JSON.stringify(
            {
              event: "updateLobby"
            }));
        })
        break;
      case('startGame'):
        console.log(message);
        Object.keys(allSockets).forEach(sCount => {
          // message structure: {event:"updateLobby", data: HTMLElement}
            allSockets[sCount].websocket.send(JSON.stringify(
              {
                event: "startGame",
                drawers: [...message.drawers.team1, ...message.drawers.team2]
              }));
        })
        break;
      case('guessTime'):
        Object.keys(allSockets).forEach(sCount => {
          if (message.player == allSockets[sCount].name) {
            allSockets[sCount].websocket.send(JSON.stringify(
              {
                event: "guessTime",
                team: message.team
              }
            ))
          }
        })
    }
    
  })

  ws.on('close', (ws, req) => {
    delete allSockets.currSocketNum
    console.log(`closed socket : ${currSocketNum}`)
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

app.use((req, res, next) => {
  req.models = models;
  next()
})


app.use("/game", gameRouter);
app.use("/canvas", canvasRouter)

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
