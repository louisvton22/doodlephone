import mongoose from 'mongoose'

console.log("connecting to mongoDB")

await mongoose.connect("mongodb+srv://louis-ton:louis-ton@info441.xt4drit.mongodb.net/doodlephone?retryWrites=true&w=majority")

console.log("successfully connected to mongoDB");

let models = {}

const gameSchema = new mongoose.Schema({
    players: [mongoose.Types.ObjectId],
    guessers: [mongoose.Types.ObjectId],
    currentRound: Number,
    currentPicture: [mongoose.Types.ObjectId],
    


})
models.Game = mongoose.model("Game", gameSchema);

const userSchema = new mongoose.Schema({
    name: String,
    team: mongoose.Types.ObjectId,
    role: String
})

models.User = mongoose.model("User", userSchema);

const teamSchema = new mongoose.Schema({
    pictures: [String],
    players: [String],
    name: String
})

models.Team = mongoose.model("Team", teamSchema);

const pictureSchema = new mongoose.Schema({
    image: String,
    created_by: mongoose.Types.ObjectId,
    round: Number,
    team: mongoose.Types.ObjectId

})

models.Picture = mongoose.model("Picture", pictureSchema);

const promptSchema = new mongoose.Schema({
    prompt: String
})

models.Prompt = mongoose.model("Prompt", promptSchema)


export default models;



