import express from 'express';

var router = express.Router()

router.post("/", async (req,res) => {
    try {
        Object.keys(req.body).forEach((team) => {
            let newTeam = new req.models.Team({
                name: req.body[team].name
            })
            newTeam.save();
        })
        
        let players = [...req.body.team1.players, ...req.body.team2.players]
        let guessers = [req.body.team1.players[Math.floor(Math.random() * req.body.team1.players.length)],
            req.body.team2.players[Math.floor(Math.random() * req.body.team2.players.length)]
        ]   
        console.log(guessers)
        players.forEach((player) => {
            let newPlayer = new req.models.User({
                name: player,
                role: guessers.includes(player) ? "guesser" : "drawer"
            })
            newPlayer.save()
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

        res.json({"status": "success"})
    } catch(error) {
        console.log(error);
        res.status(500).json({"status":"error", error:error})
    }
})

router.get('/', async (req, res) => {
    let game = req.models.Game.find()

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