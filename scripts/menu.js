let randomBtn = document.getElementById("random");
let joinId = document.getElementById("joinId");
let joinBtn = document.getElementById("joinBtn");
let joinHost = document.getElementById("joinHost");

let createBtn = document.getElementById("createBtn");
let createId = document.getElementById("createId");
let createHost = document.getElementById("createHost");

let createMembers = document.getElementById("createMembers");

let joinBtnOpen = false;
let createBtnOpen = false;


randomBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    let response = await fetch("http://localhost:5000/status", { method: "GET" });
    if (response.status == 200) {
        localStorage.setItem("socket-url", "ws://localhost:5000/ws");
    }
})

joinBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (joinId.classList.contains("open") && joinHost.classList.contains("open")) {
        try {
            let hostname, protocol, port, id, url;
            if(!joinHost.value)
            {
                url = new URL("https://passthebomb-server.onrender.com");
                let response = await fetch("https://passthebomb-server.onrender.com/status", {
                    method: "GET", headers: new Headers({
                        "Bypass-Tunnel-Reminder": true
                    })
                });
                id=joinId.value
                if(response.status==200)
                {
                    sessionStorage.setItem("socket-url", `wss://${url.hostname}/type=join${id && "&roomId=" + id}`);
                    window.location.href = "./game.html";
                }


            }
            else{
                try { url = new URL(joinHost.value); }
                catch (err) { url = new URL("localhost:5000"); }

                //if any other address given other than localhost:port
                if (url.protocol != "localhost:") {
                    //should have host name , for tcp it is pathname or defaults to localhost
                    hostname = (url.protocol == "http:" || url.protocol == "https:") ? url.hostname : (url.protocol == "tcp:") ? url.pathname.slice(2) : "localhost";

                    //protocol must be either http or https else it defaults to http
                    protocol = ((url.protocol != "https:" && url.protocol != "http:")) ? "http://" : `${url.protocol}//`;

                    port = (url.port && ":" + url.port) || "";
                    id = joinId.value || "";
                }
                //for localhost:port
                else {
                    //it says localhost is protocol but for my use case i willuse it in host name
                    hostname = `${url.protocol != "localhost:" ? (url.protocol + "//") : url.protocol.slice(0, -1)}`;

                    //localhost should use http:// 
                    protocol = "http://"

                    //use default 5000 or use the provided port
                    port = (url.port && ":" + url.port) || ":5000";
                    id = joinId.value || "";
                }
                // console.log(`${protocol}${hostname}${port}/status` + "\n" + `wss://${hostname}${port}${id && ("/roomId=" + id)}`);


                let response = await fetch(`${protocol}${hostname}${port}/status`, {
                    method: "GET", headers: new Headers({
                        "Bypass-Tunnel-Reminder": true
                    })
                });
                if (response.status == 200) {
                    console.log(`${protocol}${hostname}${port}/status` + "\n" + `wss://${hostname}${port}${id && ("/roomId=" + id)}`);
                    sessionStorage.setItem("socket-url", `${(hostname == "localhost" || hostname == "127.0.0.1") ? "ws" : "wss"}://${hostname}${port}/type=join${id && ("&roomId=" + id)}`);
                    console.log(`${(hostname == "localhost" || hostname == "127.0.0.1") ? "ws" : "wss"}://${hostname}${port}/type=join${id && ("&roomId=" + id)}`);
                    window.location.href = "./game.html";
                }
        }

    }
        catch (err) {
            console.log(err);
            document.getElementById("error").innerText = "Could not create game on the given server address";
            setTimeout(() => { document.getElementById("error").innerText = ""; }, 5000)
        }
    }

    joinId.classList.add("open");
    joinId.classList.remove("closed");
    joinHost.classList.add("open");
    joinHost.classList.remove("closed");

});


createBtn.addEventListener("click", async (e) => {
    e.stopPropagation();

    if (createId.classList.contains("open") && createHost.classList.contains("open") && createMembers.classList.contains("open")) {
        try {
            let hostname, protocol, port, id, url;

            //if hostname empty connect to own server
            if(!createHost.value)
            {
                url = new URL("https://passthebomb-server.onrender.com");
                let response = await fetch("https://passthebomb-server.onrender.com/status", {
                    method: "GET", headers: new Headers({
                        "Bypass-Tunnel-Reminder": true
                    })
                });
                id=createId.value;
                if(response.status==200)
                {
                    sessionStorage.setItem("socket-url", `wss://${url.hostname}/type=create${id && "&roomId=" + id}${createMembers.value && "&players=" + createMembers.value}`);
                    window.location.href = "./game.html";
                }
            }

            //if not empty handle it
            else{
                try { url = new URL(createHost.value); }
                catch (err) { url = new URL("localhost:5000"); }
                
                //if any other address given other than localhost:port
                if (url.protocol != "localhost:") {
                    //should have host name , for tcp it is pathname or defaults to localhost
                    hostname = (url.protocol == "http:" || url.protocol == "https:") ? url.hostname : (url.protocol == "tcp:") ? url.pathname.slice(2) : "localhost";

                    //protocol must be either http or https else it defaults to http
                    protocol = ((url.protocol != "https:" && url.protocol != "http:")) ? "http://" : `${url.protocol}//`;

                    port = (url.port && ":" + url.port) || "";
                    id = createId.value || "";
                }
                //for localhost:port
                else {
                    //it says localhost is protocol but for my use case i willuse it in host name
                    hostname = `${url.protocol != "localhost:" ? (url.protocol + "//") : url.protocol.slice(0, -1)}`;
                    //localhost should use http:// 
                    protocol = "http://"

                    //use default 5000 or use the provided port
                    port = (url.port && ":" + url.port) || ":5000";
                    id = createId.value || "";
                }

                let response = await fetch(`${protocol}${hostname}${port}/status`, {
                    method: "GET", headers: new Headers({
                        "Bypass-Tunnel-Reminder": true
                    })
                });
                if (response.status == 200) 
                {
                    sessionStorage.setItem("socket-url", `${(hostname == "localhost" || hostname == "127.0.0.1") ? "ws" : "wss"}://${hostname}${port}/type=create${id && "&roomId=" + id}${createMembers.value && "&players=" + createMembers.value}`);
                    window.location.href = "./game.html";
                }
        }

        }
        catch (err) {
            console.log(err);
            document.getElementById("error").innerText = "Could not create game on the given server address";
            setTimeout(() => { document.getElementById("error").innerText = ""; }, 5000)
        }
    }

    //update css
    {
        createId.classList.add("open");
        createId.classList.remove("closed");
        createMembers.classList.add("open");
        createMembers.classList.remove("closed");
        createHost.classList.add("open");
        createHost.classList.remove("closed");
    }

})

document.addEventListener("click", (e) => {
    e.stopPropagation();
    const clickedElement = e.target;

    if (!joinId.value && clickedElement != joinId && clickedElement != joinHost && !joinHost.value) {
        joinId.classList.add("closed");
        joinId.classList.remove("open");
        joinHost.classList.add("closed");
        joinHost.classList.remove("open");
    }
    if (!createId.value && clickedElement != createId && clickedElement != createMembers && !createMembers.value && !createHost.value && clickedElement != createHost) {
        createId.classList.add("closed")
        createId.classList.remove("open");
        createMembers.classList.add("closed");
        createMembers.classList.remove("open");
        createHost.classList.add("closed");
        createHost.classList.remove("open");
    }
})