let resolutionRatio = 1;

//bgmusic
let gameMusic = new Audio("../assets/gamemusic.mp3");
let loseMusic = new Audio("../assets/lose.wav");
let winMusic = new Audio("../assets/victory.mp3");
let explosionMusic = new Audio("../assets/explosion.wav");

gameMusic.loop = true;
gameMusic.volume = 0.4;
gameMusic.play();
let selfId;
let gameStatus;

(async function () {
    let teleporting = false, teleportingTimer;
    let selfRadius = 28;
    let resolveSelfId;
    let selfIdReturner = new Promise((resolve, reject) => { resolveSelfId = resolve });
    let otherplayersId = {};
    let bomberId;
    let selfpos={x:0,y:0}
    let timers = {}

    const ws = await connectToServer();
    console.log("await complete");
    ws.send("initialConnect");

    selfIdReturner.then((resolvedData) => {
        const { selfId, roomId } = resolvedData;
        // console.log(resolvedData,selfId,roomId);
        initializedInputs(selfId, roomId);
    });

    function initializedInputs(resolvedselfPlayerId, selfRoomId) {
        let m = document.getElementById("box");
        selfId = resolvedselfPlayerId;
        let expectedheight = 560;
        let expectedwidth = 1050;
        m.attributes.height = expectedheight + "px";
        m.attributes.width = expectedwidth + "px";

        document.getElementById("roomId").innerText = "Room Code: " + selfRoomId;
        document.title = "Game: " + selfRoomId;

        //setting the initial sizes of screen
        setInterval(() => {
            let viewportHeight = window.innerHeight - 20;
            let viewportWidth = window.innerWidth - 20;
            if ((viewportHeight / expectedheight) * expectedwidth <= viewportWidth) {
                m.style.height = viewportHeight + "px";
                m.style.width = "auto";
                resolutionRatio = viewportHeight / expectedheight;
                Array.from(m.getElementsByClassName("players")).forEach((player) => {
                    player.setAttribute("height", `${viewportHeight / expectedheight * 70}px`);
                    player.setAttribute("width", `${viewportHeight / expectedheight * 70}px`);
                });
            }
            else {
                m.style.width = viewportWidth + "px";
                m.style.height = "auto";
                resolutionRatio = viewportWidth / expectedwidth;
                Array.from(m.getElementsByClassName("players")).forEach((player) => {
                    player.setAttribute("height", `${viewportWidth / expectedwidth * 70}px`);
                    player.setAttribute("width", `${viewportWidth / expectedwidth * 70}px`);
                });
            }
        })

        const contextmenufn = (event) => {
            event.preventDefault();
            teleporting = true;
            teleportingTimer = setTimeout(() => { teleporting = false }, 1000);
        }
        m.addEventListener("contextmenu", contextmenufn);

        const mousemovefn = (e) => { if (!teleporting && e.clientX < e.target.offsetWidth && e.clientY < e.target.offsetHeight) { ws.send(JSON.stringify({ type: "position", x: e.clientX / resolutionRatio, y: e.clientY / resolutionRatio, radius: selfRadius })) } }
        m.addEventListener("mousemove", mousemovefn);

        const onclickfn = (e) => {
            if (e.clientX < e.target.offsetWidth && e.clientY < e.target.offsetHeight) {
                ws.send(JSON.stringify({ type: "click", x: e.clientX / resolutionRatio, y: e.clientY / resolutionRatio, teleporting: teleporting, radius: selfRadius }));
                if (teleporting) {
                    teleporting = false;
                    clearTimeout(teleportingTimer);
                }
            }
        }
        m.addEventListener("click", onclickfn);


        ws.addEventListener("message", (message) => {
            let messagedata = JSON.parse(message.data);

            if (messagedata.type == "bomberKill" && messagedata.bomber == selfId) {
                m.removeEventListener("click", onclickfn);
                m.removeEventListener("mousemove", mousemovefn);
                m.removeEventListener("contextmenu", contextmenufn);
            }

        });

        document.getElementById("gameEnd").onclick = () => ws.send(JSON.stringify({ type: "gameEnd" }));
    }


    ws.onmessage = function (message) {
        let messagedata = JSON.parse(message.data);

        if (messagedata.type == "initialize") {
            resolveSelfId({ selfId: messagedata.selfCursorId, roomId: messagedata.roomId });
        }

        if (messagedata.type === "playerCount") {
            const div = document.getElementById("playerCount");
            const { current, max } = messagedata;
            div.innerText = `Players: ${current}/${max}`;
            if (current < max) {
                gameStatus = 'waiting';
                div.innerText += " – Waiting for others...";
            } else {
                div.innerText += "";
            }
        }

        // 🔹 Hide message once game starts
        if (messagedata.type === "gameStart") {
            const div = document.getElementById("playerCount");
            div.style.transition = "opacity 1s";
            div.style.opacity = 0;
            setTimeout(() => div.style.display = "none", 1000);
            gameStatus = 'running';
        }


        if (messagedata.type == "position") {
            const cursor = getOrCreatecursor(messagedata, bomberId);
            clearTimeout(timers[messagedata.sender]);
            setTimeout(() => {
                cursor.style.transition = `transform 0.01s linear`;
                otherplayersId[messagedata.sender] = messagedata.sender;
                cursor.style.transform = `translate(${messagedata.x * resolutionRatio}px, ${messagedata.y * resolutionRatio}px) translate(-50%,-50%)`;
            }, 20)
        }

        if (messagedata.type == "click") {
            const cursor = getOrCreatecursor(messagedata, bomberId);

            //if someone is preparing for teleporting, clicking will cause teleport
            if (messagedata.teleporting) { cursor.style.transition = ``; }


            //if someone else is sending the click event then check if we are colliding with them
            if ((selfId != messagedata.sender) && (messagedata.sender == bomberId)) {
                // console.log(messagedata.sender,selfId)
                let senderCursor = document.querySelector(`[data-sender='${messagedata.sender}']`);
                let selfCursor = document.querySelector(`[data-sender='${selfId}']`);

                if (selfCursor && senderCursor) {
                    let selfCursorPosition = selfCursor.getBoundingClientRect();
                    let senderCursorPosition = senderCursor.getBoundingClientRect();
                    if (distance(selfCursorPosition, senderCursorPosition) < (messagedata.radius + selfRadius) * resolutionRatio) {
                        console.log("Bomber = Self")
                        ws.send(JSON.stringify({ type: "bomberVerify", newBomber: selfId }));
                    }
                }
            }

            cursor.style.transform = `translate(${messagedata.x * resolutionRatio}px, ${messagedata.y * resolutionRatio}px) translate(-50%,-50%) `;
            cursor.style.filter = "invert(1)";
            setTimeout(() => {
                cursor.style.filter = "";
            }, 100);
        }

        if (messagedata.type == "delete") {
            deleteCursor(messagedata, otherplayersId);
        }

        if (messagedata.type == "bomberChange") {
            let oldBomber = document.querySelector(`[data-sender='${bomberId}']`);
            oldBomber.querySelector('.bomb').style.display = "none";
            oldBomber.querySelector('.notBomb').style.display = "block";

            let newBomber = document.querySelector(`[data-sender='${messagedata.sender}']`);
            const bomb = newBomber.querySelector('.bomb');
            bomb.style.display = "block";
            const notbomb = newBomber.querySelector('.notBomb');
            notbomb.style.display = "none";

            bomberId = messagedata.sender;


            const bombNotice = document.getElementById("bomberNotice");
            if (bomberId === selfId && gameStatus === 'running') {
                bombNotice.style.display = "block";
            } else {
                bombNotice.style.display = "none";
            }
        }

        if (messagedata.type == "bomberInit") {
            bomberId = messagedata.bomber;
            let bombercursor = document.querySelector(`[data-sender='${messagedata.bomber}']`);
            if (bomberId && bombercursor) {
                const bomb = bombercursor.querySelector('.bomb');
                bomb.style.display = "block";
                const notbomb = bombercursor.querySelector('.notBomb');
                notbomb.style.display = "none";
            }
            console.log("bomber initiated:", bomberId);

            const bombNotice = document.getElementById("bomberNotice");
            if (bomberId === selfId) {
                bombNotice.style.display = "block";
            } else {
                bombNotice.style.display = "none";
            }
        }


        if (messagedata.type == "bomberKill") {
            let bombercursor = document.querySelector(`[data-sender='${messagedata.bomber}']`);
            if (bomberId && bombercursor) {
                const explosion = document.querySelector('#explosion');
                explosion.style.display = "block";
                explosion.style.height = 200 * resolutionRatio + "px";
                explosion.style.width = 200 * resolutionRatio + "px";

                explosion.style.transform = `translate(${bombercursor.getBoundingClientRect().x}px,${bombercursor.getBoundingClientRect().y}px) translate(-50%,-50%)`;

                deleteCursor({ sender: messagedata.bomber }, otherplayersId);
                setTimeout(() => {
                    explosion.style.display = "none";
                    deleteCursor({ sender: messagedata.bomber }, otherplayersId);
                }, 1000);
            }
            console.log("bomberkilled:", messagedata.bomber);
            explosionMusic.play();
        }

        if (messagedata.type == "win") {
            gameStatus = 'completed';
            document.getElementById("WinMenuPopUp").style.display = "flex";
            winMusic.play();
        }

        if (messagedata.type == "dead") {
            document.getElementById("DeadMenuPopUp").style.display = "flex";
            document.getElementById("bomberNotice").style.display = "none";
            gameMusic.pause();
            setTimeout(() => { loseMusic.play(); }, 1000);

        }

        if (messagedata.type == "gameEnd") {
            window.location.href = "../pages/menu.html";
        }
    }
})();

function getOrCreatecursor(messagebody, bomberId) {
    let cursor = document.querySelector(`[data-sender='${messagebody.sender}']`);
    const isSelf = selfId && messagebody.sender == selfId;
    if (cursor) {
        if(isSelf){
            const youText = cursor.querySelector('.you');
            youText.style.display = "block";
        }

        if (bomberId && messagebody.sender == bomberId) {
            const bomb = cursor.querySelector('.bomb');
            bomb.style.display = "block";
            const notbomb = cursor.querySelector('.notBomb');
            notbomb.style.display = "none";
        }
        else {
            const bomb = cursor.querySelector('.bomb');
            const notbomb = cursor.querySelector('.notBomb');
            notbomb.style.display = "block";

            bomb.style.display = "none";
        }
        return cursor;
    }
    else {
        const template = document.getElementById('cursor');
        const cursor = template.content.firstElementChild.cloneNode(true);

        const svgPath = cursor.getElementsByTagName('circle')[0];

        cursor.setAttribute("data-sender", messagebody.sender);
        svgPath.setAttribute('fill', String(messagebody.color));

        const bomb = cursor.querySelector('.bomb');
        const notbomb = cursor.querySelector('.notBomb');
        const youText = cursor.querySelector('.you-text');

        bomb.style.display = "none";
        notbomb.style.display = "block";

        cursor.style.transform = `translate(${messagebody.x * resolutionRatio}px, ${messagebody.y * resolutionRatio}px) translate(-50%,-50%) `;




        if (bomberId && messagebody.sender == bomberId) {
            bomb.style.display = "block";
            notbomb.style.display = "none";
        }

        document.getElementById("box").appendChild(cursor);
        return cursor;
    }
}


function deleteCursor(messagebody, otherplayersId) {
    let cursor = document.querySelector(`[data-sender='${messagebody.sender}']`);
    cursor && cursor.remove();
    delete otherplayersId[messagebody.sender];
}


async function connectToServer() {
    let socketUrl = sessionStorage.getItem("socket-url");
    sessionStorage.clear();
    console.log(socketUrl);

    if (!socketUrl) {
        window.location.href = "../pages/menu.html"
    }
    let ws;

    ws = new WebSocket(socketUrl);
    ws.onerror = () => { ws = new WebSocket("ws" + socketUrl.slice(3)); };
    return new Promise((resolve, reject) => {
        let t = setInterval(() => {
            if (ws.readyState === 1) {
                let messageobj = { username: "ram" };
                ws.send(JSON.stringify(messageobj));
                clearInterval(t);
                resolve(ws);
            }
        }, 50);
    })
}

function distance(selfCursorPosition, senderCursorPosition) {
    return Math.sqrt((selfCursorPosition.x - senderCursorPosition.x) ** 2 + (selfCursorPosition.y - senderCursorPosition.y) ** 2)
}

function closeMenuPopUp() {
    document.getElementById("DeadMenuPopUp").style.display = "none";
}