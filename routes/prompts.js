import express from 'express';

var router = express.Router()


router.get("/", (req, res) => {
    try {
    res.send(req.prompt);
    } catch(error) {
        console.log(error);
    }
})

export default router;