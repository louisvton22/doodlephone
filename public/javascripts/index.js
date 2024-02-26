let websocket;

//establish webscoket connection between client and server
function establishConnection(e) {
    e.preventDefault()
    document.querySelector('.userForm').display = "none";
    const socketURL = "ws://localhost:3000/chatSocket?name="+document.getElementById("nameInput").value
    websocket = new WebSocket(socketURL)

    getUpdatedLobby(document.getElementById("nameInput").value);
    websocket.onmessage = event => {
    console.log("receiving chat message")
        // event structure {data: {event: "chat", data: {"hello"}}}
    let jsonData = JSON.parse(event.data)
    console.log(jsonData);
    switch(jsonData.event){
        case('chat'):
            document.getElementById("chats").innerText += jsonData.data + "\n";
            break;
    }
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
async function getUpdatedLobby(name) {
    console.log("getting user block...")
    let response = await fetch("http://localhost:3000/users?name=" + name );
    let userBlock = await response.text();
    getElementByClass(".team.first").innerHTML += userBlock;
}


//query selector shorthand
function getElementByClass(className) {
    return document.querySelector(className);
}