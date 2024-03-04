
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
                    startGame();
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


function startGame() {
    //broadcast start game event to all players  

    // remove lobby and add canvas
    let lobby = getElementByClass(".lobby");
    lobby.remove();
    let canvas = document.createElement("canvas");
    canvas.id = "canvas";
    let submit = document.createElement("button");
    submit.innerText="Finish";
    getElementByClass(".lobby-container").append(canvas,submit);
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
    
}

//query selector shorthand
function getElementByClass(className) {
    return document.querySelector(className);
}

function broadcast(event, data) {
    console.log(`broadcasting ${event}`);
    let broadcastJSON = {event: event, ...data}
    websocket.send(JSON.stringify(broadcastJSON));
}
