import express from 'express';

var router = express.Router();
import { fabric } from 'fabric';

// send canvas back to client
router.get("/:teamId", async (req,res) => {
    // const canvas = new fabric.Canvas('canvas');
    try {
    console.log(req.params.teamId)
    let team = await req.models.Team.findOne({_id: req.params.teamId})
    res.send(team.pictures[team.pictures.length - 1]);
    } catch(error) {
        console.log(error)
        res.json({status:"error", error:error})
    }
})

router.post('/', async (req, res) => {
    let player = await req.models.User.findOne({name: req.body.created_by});
    let team = await req.models.Team.findOne({name: req.body.team});
    let picture = new req.models.Picture({
        image: req.body.currentPicture,
        created_by: player._id,
        team: team._id
    })
    console.log(req.body.team);
    console.log("TEAM")
    console.log(team);
    console.log(team._id)
    await picture.save()

    await req.models.Team.updateOne({_id: team._id},
        {$push : {pictures : req.body.currentPicture}})
    
    let nextPlayers = await req.models.Team.findOne({_id: team._id})
    console.log("nextPlayers")
    console.log(nextPlayers);
    nextPlayers = nextPlayers.players.filter((name) => { return name != req.body.created_by })

    if (nextPlayers.length == 1) {
        let guesser = await req.models.User.findOne({name:{$in: nextPlayers}, role:"guesser"})
        res.json({"status":"guessTime", "player": guesser.name, "team":team._id})
    } else {
        res.json({"status":"nextRound", "player": ""})
    }
    
})

export default router;