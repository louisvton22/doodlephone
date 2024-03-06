import express from 'express';
import fetch from 'node-fetch';
var router = express.Router()

router.post("/", async (req,res) => {
    try {
        await req.models.Game.deleteMany({});
        await req.models.User.deleteMany({});
        await req.models.Team.deleteMany({});
        await req.models.Picture.deleteMany({});
        Object.keys(req.body).forEach((team) => {
            let newTeam = new req.models.Team({
                name: req.body[team].name,
                players: req.body[team].players
            })
            newTeam.save();
        })
        console.log("PLAYERS")
        console.log(req.body)
        let players = [...req.body.team1.players, ...req.body.team2.players]
        let guessers = [req.body.team1.players[Math.floor(Math.random() * req.body.team1.players.length)],
            req.body.team2.players[Math.floor(Math.random() * req.body.team2.players.length)]
        ]   
        console.log(guessers)
        players.forEach(async (player) => {
            let newPlayer = new req.models.User({
                name: player,
                role: guessers.includes(player) ? "guesser" : "drawer"
            })
            newPlayer.save();
        })
        let playersObjectsIds = await req.models.User.find({ name: { $in : players }})
        let guesserIds = await req.models.User.find({ name: { $in: guessers }})
        let game = new req.models.Game({
            players : playersObjectsIds.map((player) => player._id),
            guessers: guesserIds.map((guesser) => guesser._id),
            currentRound: 1,
            currentPicture: []

        })
        game.save()
        let [team1, team2] = await req.models.Team.find()
        console.log("Team 1" + team1);
        console.log("Team 2" + team2);
        setTimeout(async () => {
        let drawers = await req.models.User.find({role:"drawer"});
        console.log("drawers " + drawers);
        let team1Drawers = drawers.filter((drawer) => req.body.team1.players.includes(drawer.name));
        let team2Drawers = drawers.filter((drawer) => req.body.team2.players.includes(drawer.name));

        res.json({"status": "success", team1:team1Drawers, team2:team2Drawers});
        }, 2000)
        
    } catch(error) {
        console.log(error);
        res.status(500).json({"status":"error", error:error})

        
    }
})

router.get('/', async (req, res) => {
    let game = await req.models.Game.find()

    res.json({
        "players": game.players,
        "guessers": game.guessers,
        "currentRound": game.currentRound,
        "currentPicture": game.currentPicture
    })
})

router.get("/endGame", async (req, res) => {
    await req.models.Game.deleteMany({});
    await req.models.User.deleteMany({});
    await req.models.Team.deleteMany({});
    await req.models.Picture.deleteMany({});
});



export default router;