import express from 'express';
var router = express.Router();

/* GET users listing. */

let mostUpdatedLobby = ''
router.get('/', function(req, res, next) {
  res.type('html')
  mostUpdatedLobby +=  `<div id=${req.query.name}><h3>${req.query.name}</h3><div>`
  res.send(mostUpdatedLobby)
});

export default router;
