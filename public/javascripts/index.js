
//import * as fabric from 'fabric';
let websocket;
let displayName;

var $ = function(id) {return document.getElementById(id)};

document.addEventListener('DOMContentLoaded', async () => {
    await updateLobby();
    // $("start-game").onclick = () => {
    //     broadcast("startGame");
    // };
})



//establish webscoket connection between client and server
async function establishConnection(e) {
    try {
        e.preventDefault()
        if ($("nameInput").value.trim() == '') {
            throw new Error("Please enter a name");
        }
        $('overlay').style.display = "none";
        $('popup-overlay').style.display = "none";
        displayName = $("nameInput").value;
        const socketURL = "ws://localhost:3000/chatSocket?name="+$("nameInput").value
        websocket = new WebSocket(socketURL)
        window.addEventListener('beforeunload', async () => {
            websocket.close();
        })
        await pushUpdatedLobby($("nameInput").value);
        websocket.onmessage = async (event) => {
            console.log("receiving chat message")
                // event structure {data: {event: "chat", data: {"hello"}}}
            let jsonData = JSON.parse(event.data)
            console.log(jsonData);
            switch(jsonData.event){
                case('chat'):
                    $("chats").innerText += jsonData.data + "\n";
                    break;
                case('updateLobby'):
                    await updateLobby();
                    break;
                case('startGame'):
                    console.log("starting game");
                    startGame(jsonData.drawers.map((player) => player.name));
                    break;
                case('guessTime'):
                    await guessPrompt(jsonData.team);
                    break;
                case('error'):
                    alert("Please have at least 2 players on both team")
            }
        } 
    } catch (error) {
        let errorElement = document.createElement("p");
        errorElement.style.color = "red";
        errorElement.innerText = error;
        $("overlay").appendChild(errorElement)
        setTimeout(() => {
            errorElement.remove();
        }, 3000)
    }
}


//send live chat messages to chat window
function sendChat(e) {
    e.preventDefault();
    let chatMsg = $("chat-message").value
    console.log("Sending chat message: " + chatMsg)
    let message = {event:"chat", "message": chatMsg}
    //websocket.send(JSON.stringify(message))
    broadcast("chat", {"message" : chatMsg})
}

// adds player to lobby list
async function pushUpdatedLobby(name) {
    console.log("getting user block...")
    //first time 
    if (!$(name)) {
        getElementByClass(".team.first").innerHTML += `<div id=${name}><h3>${name}</h3></div>`
    }
    let newLobby = getElementByClass(".lobby");
    let response = await fetch("http://localhost:3000/users", {
        method:'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            lobby: newLobby.innerHTML,
            date: new Date()
        })
    });
    //let messageEvent = {event:"updateLobby"}
    broadcast("updateLobby");
    
}

async function updateLobby() {
    console.log("")
    let response = await fetch("http://localhost:3000/users")

    let updatedLobby = await response.text();

    getElementByClass(".lobby").innerHTML = updatedLobby;
}

async function changeTeam() {
    let userBlock = $(displayName);
    let current = userBlock.parentElement.classList.contains('first') ? 'first' : 'second'
    if (current == 'first') {
        getElementByClass('.second').appendChild(userBlock);
    } else {
        getElementByClass('.first').appendChild(userBlock);
    }
    await pushUpdatedLobby(displayName);

    
}

// Handles the start round for the drawers
async function startGame(drawers) {

    let lobby = getElementByClass(".lobby");
    lobby.style.display = "none";
    let statusMessage= document.createElement("h3");

  
    // open canvas for current drawer
    console.log(drawers);
    if (drawers.slice(0,2).includes(displayName)) {
    // remove lobby and add canvas
    statusMessage.innerText = "You're up to draw!";
    let answer = await fetch("http://localhost:3000/prompt");
    answer = await answer.text();
    let el = document.createElement("h1");
    el.innerText = "The prompt is: " + answer;
    getElementByClass(".drawing-container").append(el)
    let canvas = document.createElement("canvas");
    canvas.id = "canvas";
    let submit = document.createElement("button");
    let timer = document.createElement("H3")
    submit.innerText="Finish";
    getElementByClass(".lobby-container").append(canvas,submit);

    let time = 20;
    const countdownEl = document.getElementById('countdown');
    
    getElementByClass(".lobby-container").append(timer,canvas,submit);
    const fabricCanvas = (window.canvas = new fabric.Canvas("canvas", {
        isDrawingMode: true
    }));
    fabricCanvas.setDimensions({
        width: 500,
        height: 500
    });
    fabricCanvas.freeDrawingBrush = new fabric["PencilBrush"](fabricCanvas);

    $("drawing-color").onchange = () => {
        fabricCanvas.freeDrawingBrush.color = $("drawing-color").value;
        console.log("color changed");
    };
    $("clear-canvas").onclick = () => fabricCanvas.clear();
    const intervalId = setInterval(async () => {
        time = time < 10 ? '0' + time : time;
        countdownEl.innerHTML = `00:${time}`;
        if (time == 0) {
            clearInterval(intervalId); 
            alert("Time's up!");
            await submitDrawing(fabricCanvas, $(displayName).parentElement.classList.contains("first") ? "Team A" : "Team B");
        }
        time--;
    }, 1000);

    } else { // player is not the current drawer
        statusMessage.innerText = "Hang tight, your teammate is drawing!";
    }

    getElementByClass(".drawing-container").prepend(statusMessage);

    
}


//query selector shorthand
function getElementByClass(className) {
    return document.querySelector(className);
}

async function broadcast(event, data) {
    console.log(`broadcasting ${event}`);
    let broadcastJSON = {event: event, ...data}
    if (event == "startGame") {
        let drawerData = await postStartGameData();
        drawerData = await drawerData.json();
        console.log("drawer data: " + drawerData);
        broadcastJSON = {...broadcastJSON, drawers: drawerData};
    }
    websocket.send(JSON.stringify(broadcastJSON));

    // call function to save user, team, and game data to database
    
}
                            
// Generates a post call to the game and creates the database for game
async function postStartGameData() {
    let team1 = getElementByClass(".team.first h2").innerText
    let team2 = getElementByClass(".team.second h2").innerText
    let team1Players = Array.from(document.querySelectorAll(".team.first > div")).map((el) => el.innerText)
    let team2Players = Array.from(document.querySelectorAll(".team.second > div")).map((el) => el.innerText)
    let game = {
        team1: {
            name: team1,
            players: team1Players
        },
        team2: {
            name: team2,
            players: team2Players
        }
    }
    let loading = document.createElement("img");
    loading.src = "../images/loading-gif.gif";
    loading.alt = "Loading...";
    loading.style.height = "50px";
    loading.style.width = "50px";
    $("actions").appendChild(loading)
    let drawers = await fetch("http://localhost:3000/game", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(game)
    })
    loading.remove();
    console.log("Posting Game :" + JSON.stringify(game));
    return drawers;

}

async function endGame() {
    await fetch("http://localhost:3000/game/endGame");
}


// Post method for uploading the picture to the database
async function submitDrawing(fabricCanvas, team) {
    let response = await fetch("http://localhost:3000/game")
            console.log(JSON.stringify(response.json()))
    let nextPlayer = await fetch("http://localhost:3000/canvas", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({"currentPicture": JSON.stringify(fabricCanvas), created_by: displayName, team: team})
            })

    nextPlayer = await nextPlayer.json()
    if (nextPlayer.status == "guessTime") {
        await broadcast("guessTime", nextPlayer)
    }
    
}

// Creates the prompt for the game
async function guessPrompt(teamId) {
    let picture = await fetch("http://localhost:3000/canvas/"+teamId)
    picture = await picture.text();

    let canvas = document.createElement("canvas");
    canvas.id = "canvas";
    let submit = document.createElement("button");
    let timer = document.createElement("H3")
    submit.innerText="Finish";
    getElementByClass(".lobby-container").append(canvas,submit);

    let time = 20;
    const countdownEl = document.getElementById('countdown');
    
    getElementByClass(".lobby-container").append(timer,canvas,submit);
    const fabricCanvas = (window.canvas = new fabric.Canvas("canvas", {
        isDrawingMode: false
    }));
    fabricCanvas.setDimensions({
        width: 500,
        height: 500
    });

    fabricCanvas.loadFromJSON(JSON.parse(picture), ()=> {
        fabricCanvas.renderAll();
    })
    let guessInput = document.createElement('input')
    getElementByClass(".drawing-container h3").innerText = "Time to guess!"
    guessInput.placeholder = "Guess the prompt!"
    getElementByClass(".drawing-container").append(fabricCanvas, guessInput)

    const intervalId = setInterval(async () => {
        time = time < 10 ? '0' + time : time;
        countdownEl.innerHTML = `00:${time}`;
        if (time == 0) {
            clearInterval(intervalId); 
            alert("Time's up!");
            await revealPrompt();
        }
        time--;
    }, 1000);

}

// Reveals the prompt for the game
async function revealPrompt() {
    let answer = await fetch("http://localhost:3000/prompt");
    answer = await answer.text();

    let el = document.createElement("h1");

    el.innerText = "The prompt was : " + answer;
    
    getElementByClass(".lobby-container").append(el);
}