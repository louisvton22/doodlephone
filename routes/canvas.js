import express from 'express';

var router = express.Router();
import { fabric } from 'fabric';

// send canvas back to client
router.get("/", (req,res) => {
    const canvas = new fabric.Canvas('canvas');

    res.send(canvas)
})

router.post('/', async (req, res) => {
    let picture = new req.models.Picture({
        image: req.body.currentPicture
    })
    await picture.save()
})

export default router;