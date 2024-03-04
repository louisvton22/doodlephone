import express from 'express';
var router = express.Router();

/* GET users listing. */

let lastUpdate = new Date()
let lobby = `<div class='team first'>
              <h2>Team A</h2>
              </div>
              <div>
              <button onclick="changeTeam()">Switch Sides</button>
              <button id="start-game" onclick=broadcast("startGame")>Start Game</button>
              </div>
              <div class='team second '>
              <h2>Team B</h2>
              </div>`
// client will send their updated lobby, if the date on this new lobby is more recent than the last update, all websockets should update
router.get('/', function(req, res, next) {
  console.log(lobby);
  res.type('html')
  res.send(lobby)
});

router.post('/', (req,res,next) => {
  try {
    if (new Date(req.body.date) > lastUpdate) {
      console.log("new date found")
      lastUpdate = new Date(req.body.date);
      lobby = req.body.lobby
    }
    res.json({status:"success"})
  } catch(error) {
      console.log(error)
  }
})

export default router;
