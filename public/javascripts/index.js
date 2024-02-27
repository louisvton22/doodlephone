let websocket;

//establish webscoket connection between client and server
let displayName;
document.addEventListener('DOMContentLoaded', async () => {
    await updateLobby();
})

window.addEventListener('beforeunload', async () => {
    await updateLobby();
})
async function establishConnection(e) {
    try {
        e.preventDefault()
        if (document.getElementById("nameInput").value.trim() == '') {
            throw new Error("Please enter a name");
        }
        document.getElementById('overlay').style.display = "none";
        document.getElementById('popup-overlay').style.display = "none";
        displayName = document.getElementById("nameInput").value;
        const socketURL = "ws://localhost:3000/chatSocket?name="+document.getElementById("nameInput").value
        websocket = new WebSocket(socketURL)

        await pushUpdatedLobby(document.getElementById("nameInput").value);
        websocket.onmessage = async (event) => {
            console.log("receiving chat message")
                // event structure {data: {event: "chat", data: {"hello"}}}
            let jsonData = JSON.parse(event.data)
            console.log(jsonData);
            switch(jsonData.event){
                case('chat'):
                    document.getElementById("chats").innerText += jsonData.data + "\n";
                    break;
                case('updateLobby'):
                    await updateLobby();
            }
        } 
    } catch (error) {
        let errorElement = document.createElement("p");
        errorElement.style.color = "red";
        errorElement.innerText = error;
        document.getElementById("overlay").appendChild(errorElement)
        setTimeout(() => {
            errorElement.remove();
        }, 3000)
    }
}


//send live chat messages to chat window
function sendChat(e) {
    e.preventDefault();
    let chatMsg = document.getElementById("chat-message").value
    console.log("Sending chat message: " + chatMsg)
    let message = {event:"chat", "message": chatMsg}
    websocket.send(JSON.stringify(message))
}

// adds player to lobby list
async function pushUpdatedLobby(name) {
    console.log("getting user block...")
    //first time 
    if (!document.getElementById(name)) {
        getElementByClass(".team.first").innerHTML += `<div id=${name}><h3>${name}</h3></div>`
    }
    let newLobby = getElementByClass(".lobby");
    let response = await fetch("http://localhost:3000/users", {
        method:'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            lobby: newLobby.outerHTML,
            date: new Date()
        })
    });
    let messageEvent = {event:"updateLobby"}
    websocket.send(JSON.stringify(messageEvent))
    
}

async function updateLobby() {
    console.log("")
    let response = await fetch("http://localhost:3000/users")

    let updatedLobby = await response.text();

    getElementByClass(".lobby").innerHTML = updatedLobby;
}

async function changeTeam() {
    let userBlock = document.getElementById(displayName);
    let current = userBlock.parentElement.classList.contains('first') ? 'first' : 'second'
    if (current == 'first') {
        getElementByClass('.second').appendChild(userBlock);
    } else {
        getElementByClass('.first').appendChild(userBlock);
    }
    await pushUpdatedLobby(displayName);

    
}


//query selector shorthand
function getElementByClass(className) {
    return document.querySelector(className);
}

