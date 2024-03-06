
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

window.addEventListener('beforeunload', async () => {
    await updateLobby();
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
                case('updatePic'):
                    console.log("updating pic")

                    break;
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


async function startGame(drawers) {

    let lobby = getElementByClass(".lobby");
    lobby.remove();
    let statusMessage= document.createElement("h3");
    // open canvas for current drawer
    console.log(drawers);
    if (drawers.slice(0,2).includes(displayName)) {
    // remove lobby and add canvas
    statusMessage.innerText = "You're up to draw!";
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
            await submitDrawing(fabricCanvas);
        }
        time--;
    }, 1000);

    } else { // player is not the current drawer
        statusMessage.innerText = "Hang tight, your teammate is drawing!";
    }

    getElementByClass(".drawing-container").prepend(statusMessage);

    
}


// function startCountDown() {
//     let time = 5
//     setInterval(function() {
//         timer.innerHTML = time
//         time--
//     }, 1000)
// }

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
    let drawers = await fetch("http://localhost:3000/game", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(game)
    })
    console.log("Posting Game :" + JSON.stringify(game));
    return drawers;

}

async function endGame() {
    await fetch("http://localhost:3000/game/endGame");
    let resultofGame = 1;
    if (resultofGame) {
        alert("Game over! Team 1 wins!");
    }
}

async function submitDrawing(fabricCanvas) {
    let response = await fetch("http://localhost:3000/game")
            console.log(JSON.stringify(response.json()))
            await fetch("http://localhost:3000/canvas", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({"currentPicture": JSON.stringify(fabricCanvas)})
            })
    
}