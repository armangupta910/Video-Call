const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const localIdInp = document.getElementById("localId");
const connectBtn = document.getElementById("connectBtn");
const remoteIdInp = document.getElementById("remoteId");
const callBtn = document.getElementById("callBtn");
const testConnection = document.getElementById("testConnection");
const hangUpBtn = document.getElementById("hangUpBtn");
let localStream;
let remoteStream;
let localPeer;
let remoteID;
let localID;
let stompClient;

let isOnCall = false;

// showRemoteLoading()

connectBtn.disabled = false;
connectBtn.style.backgroundColor = "#007bff";
callBtn.disabled = true;
callBtn.style.backgroundColor = "#878787";
hangUpBtn.disabled = true;
hangUpBtn.style.backgroundColor = "#878787";

console.log("Started");

// ICE Server Configurations
const iceServers = {
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "7e8af7645a03aa5c038c9f28",
      credential: "3QGhvh0q5E1pCdqS",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "7e8af7645a03aa5c038c9f28",
      credential: "3QGhvh0q5E1pCdqS",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "7e8af7645a03aa5c038c9f28",
      credential: "3QGhvh0q5E1pCdqS",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "7e8af7645a03aa5c038c9f28",
      credential: "3QGhvh0q5E1pCdqS",
    },
],
};

console.log("Next 1");

localPeer = new RTCPeerConnection(iceServers);

console.log("Next 2");

navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    localStream = stream;

    // console.log(stream.getTracks()[0])
    // console.log(stream.getTracks()[1])
    // console.log(localStream.getTracks()[0])
    // console.log(localStream.getTracks()[1])

    localVideo.srcObject = stream;
    // access granted, stream is the webcam stream
  })
  .catch((error) => {
    // access denied or error occurred
    console.log(error);
  });

localPeer.onconnectionstatechange = () => {
  console.log("Connection State Changed: " + localPeer.connectionState);

  if (localPeer.connectionState === "connected") {
    isOnCall = true; // Set the flag when the connection is established
    console.log("WebRTC connection established, isOnCall set to true");
    hideRemoteLoading()
  } else if (
    localPeer.connectionState === "disconnected" ||
    localPeer.connectionState === "closed" ||
    localPeer.connectionState === "failed"
  ) {
    isOnCall = false; // Reset the flag when the connection ends
    console.log("WebRTC connection ended, isOnCall set to false");
  }
};

localPeer.oniceconnectionstatechange = () => {
  console.log("ICE Connection State:", localPeer.iceConnectionState);
};

connectBtn.onclick = () => {
  // Connect to Websocket Server
  console.log("Button Pressed");
  // var socket = new SockJS("https://13.61.10.86:3000/websocket", { debug: false });
    var socket = new SockJS("https://192.168.101.7:3000/websocket", { debug: false });

  stompClient = Stomp.over(socket);
  localID = localIdInp.value;
  console.log("My ID: " + localID);
  stompClient.connect({}, (frame) => {

    window.onbeforeunload = function() {
        if (stompClient) {
            // Send disconnect message to server
            stompClient.send("/app/disconnectUser", {}, JSON.stringify({
                username: localID,
                clientId: clientId
            }));
            
            // Properly close the WebSocket connection
            stompClient.disconnect();
        }
    };

    // Add this here, inside the connect callback
    hangUpBtn.onclick = () => {
      console.log("Hanging up...");

      // Make sure we have the required variables
      if (!stompClient) {
        console.error("No STOMP client connection");
        return;
      }

      if (!localID || !remoteID) {
        console.error("Missing localID or remoteID", { localID, remoteID });
        return;
      }

      // Notify the remote user via WebSocket
      try {
        stompClient.send(
          "/app/hangup",
          {},
          JSON.stringify({
            fromUser: localID,
            toUser: remoteID,
          })
        );
        console.log("Hangup message sent successfully");
      } catch (error) {
        console.error("Error sending hangup message:", error);
      }

      // Close the WebRTC connection
      if (localPeer) {
        try {
          localPeer.close();
          console.log("Peer connection closed successfully");
        } catch (error) {
          console.error("Error closing peer connection:", error);
        }
        localPeer = null;
      }

      // Reset call-related state
      isOnCall = false;
      remoteID = null;

      // Update UI to reflect call end
      alert("Call ended successfully.");

      connectBtn.disabled = true;
      connectBtn.style.backgroundColor = "#878787";
      callBtn.disabled = false;
      callBtn.style.backgroundColor = "#059669";
      hangUpBtn.disabled = true;
      hangUpBtn.style.backgroundColor = "#878787";

      hideRemoteLoading()
    };

    console.log("Frame is :- " + frame);

    // Subscribe to testing URL not very important
    

    // On client side, generate a unique client ID when connecting
    const clientId = "client-" + Math.random().toString(36).substr(2, 9);

    // Subscribe using both username and client ID
    stompClient.subscribe(
      "/topic/" + localIdInp.value + "/" + clientId + "/userResponse",
      function (message) {
        if (message.body == "success") {
          console.log("Message :- " + message.body);
          callBtn.disabled = false;
          callBtn.style.backgroundColor = "#059669";
          connectBtn.disabled = true;
          connectBtn.style.backgroundColor = "#878787";
          hangUpBtn.disabled = true;
          hangUpBtn.style.backgroundColor = "#878787";


          // Update the status to "Connected"

          const statusElement = document.querySelector(".status p");

          statusElement.textContent = "Connected";
          statusElement.style.color = "#28a745"; // Green color for connected status
          statusElement.previousElementSibling.style.backgroundColor = "#28a745"; 


          stompClient.subscribe("/topic/testServer", function (test) {
            console.log("Received: " + test.body);
          });
      
          stompClient.subscribe(
            "/user/" + localIdInp.value + "/topic/call",
            (call) => {
                showRemoteLoading()
              console.log("Call From: " + call.body);
              remoteID = call.body;
              console.log("Remote ID: " + call.body);
      
              // Show the custom dialog
              const callDialog = document.getElementById("callDialog");
              const callerInfo = document.getElementById("callerInfo");
              const acceptCall = document.getElementById("acceptCall");
              const rejectCall = document.getElementById("rejectCall");
      
              callerInfo.innerText = "Incoming call from " + remoteID;
              callDialog.style.display = "block";
      
              // Handle Accept Call
              acceptCall.onclick = () => {
                  hideRemoteLoading()
                callDialog.style.display = "none"; // Hide the dialog
      
                // Create a new RTCPeerConnection for the new call
                localPeer = new RTCPeerConnection(iceServers);
                console.log("New RTCPeerConnection created.");
      
                // Handle the incoming remote stream
                localPeer.ontrack = (event) => {
                  console.log("On Track");
                  remoteVideo.srcObject = event.streams[0];
                };
      
                // Handle ICE candidates when they come
                localPeer.onicecandidate = (event) => {
                  if (event.candidate) {
                    var candidate = {
                      type: "candidate",
                      label: event.candidate.sdpMLineIndex,
                      id: event.candidate.candidate,
                    };
                    console.log("Sending Candidate");
                    stompClient.send(
                      "/app/candidate",
                      {},
                      JSON.stringify({
                        toUser: remoteID,
                        fromUser: localID,
                        candidate: candidate,
                      })
                    );
                  }
                };
      
                // Add local tracks to the new connection
                localStream.getTracks().forEach((track) => {
                  console.log("Adding track to new peer connection");
                  localPeer.addTrack(track, localStream);
                });
      
                // Create an offer to send to the remote user
                localPeer.createOffer().then((description) => {
                  console.log("Creating Offer");
                  localPeer.setLocalDescription(description);
                  stompClient.send(
                    "/app/offer",
                    {},
                    JSON.stringify({
                      toUser: remoteID,
                      fromUser: localID,
                      offer: description,
                    })
                  );
                });

                connectBtn.disabled = true;
                connectBtn.style.backgroundColor = "#878787";
                callBtn.disabled = true;
                callBtn.style.backgroundColor = "#878787";
                hangUpBtn.disabled = false;
                hangUpBtn.style.backgroundColor = "#dc2626";
              };
      
              // Handle Reject Call
              rejectCall.onclick = () => {
                  hideRemoteLoading()
                callDialog.style.display = "none"; // Hide the dialog
                console.log("Call Rejected");


      
                // Notify User A about the rejection
                stompClient.send(
                  "/app/reject",

                  {},
                  JSON.stringify({
                    toUser: remoteID, // User A's ID
                    fromUser: localID, // User B's ID
                  })
                );
              };
            }
          );
      
          stompClient.subscribe(
            "/user/" + localIdInp.value + "/topic/reject",
            (rejectMessage) => {
              console.log("Rejection Message: " + rejectMessage.body);
      
              // Display rejection dialog
              const rejectionDialog = document.createElement("div");
              rejectionDialog.style.position = "fixed";
              rejectionDialog.style.top = "50%";
              rejectionDialog.style.left = "50%";
              rejectionDialog.style.transform = "translate(-50%, -50%)";
              rejectionDialog.style.padding = "20px";
              rejectionDialog.style.background = "white";
              rejectionDialog.style.border = "1px solid black";
              rejectionDialog.style.zIndex = "1000";

                rejectionDialog.innerHTML = `
    <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: black;
        font-family: Arial, sans-serif;
        padding: 20px;
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 10px;
        width: 300px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);">
        <p>${remoteID} has rejected your call</p>
        <button id="closeRejectionDialog" style="
            margin-top: 15px;
            padding: 10px 20px;
            background-color: #dc2626;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;">Close</button>
    </div>
`;
      
              document.body.appendChild(rejectionDialog);
      
              document.getElementById("closeRejectionDialog").onclick = () => {
                document.body.removeChild(rejectionDialog);
              };
      
              isOnCall = false; // Ensure the flag remains false
      
              connectBtn.disabled = true;
              connectBtn.style.backgroundColor = "#878787";
              callBtn.disabled = false;
              callBtn.style.backgroundColor = "#059669";
              hangUpBtn.disabled = true;
              hangUpBtn.style.backgroundColor = "#878787";

              hideRemoteLoading()
            }
          );
      
          stompClient.subscribe(
            "/user/" + localIdInp.value + "/topic/offer",
            (offer) => {
              console.log("Offer came");
              var o = JSON.parse(offer.body)["offer"];
              console.log(offer.body);
              console.log(new RTCSessionDescription(o));
              console.log(typeof new RTCSessionDescription(o));
      
              localPeer.ontrack = (event) => {
                remoteVideo.srcObject = event.streams[0];
              };
              
              localPeer.onicecandidate = (event) => {
                if (event.candidate) {
                  var candidate = {
                    type: "candidate",
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.candidate,
                  };
                  console.log("Sending Candidate");
                  console.log(candidate);
                  stompClient.send(
                    "/app/candidate",
                    {},
                    JSON.stringify({
                      toUser: remoteID,
                      fromUser: localID,
                      candidate: candidate,
                    })
                  );
                }
              };
      
              // Adding Audio and Video Local Peer
              localStream.getTracks().forEach((track) => {
                localPeer.addTrack(track, localStream);
              });
      
              localPeer.setRemoteDescription(new RTCSessionDescription(o));
              localPeer.createAnswer().then((description) => {
                localPeer.setLocalDescription(description);
                console.log("Setting Local Description");
                console.log(description);
                stompClient.send(
                  "/app/answer",
                  {},
                  JSON.stringify({
                    toUser: remoteID,
                    fromUser: localID,
                    answer: description,
                  })
                );
              });
            }
          );
      
          stompClient.subscribe(
            "/user/" + localIdInp.value + "/topic/answer",
            (answer) => {
              console.log("Answer Came");
              var o = JSON.parse(answer.body)["answer"];
              console.log(o);
              localPeer.setRemoteDescription(new RTCSessionDescription(o));
            }
          );
      
          stompClient.subscribe(
            "/user/" + localIdInp.value + "/topic/candidate",
            (answer) => {
              console.log("Candidate Came");
                hideRemoteLoading()
              var o = JSON.parse(answer.body)["candidate"];
              console.log(o);
              console.log(o["label"]);
              console.log(o["id"]);
              var iceCandidate = new RTCIceCandidate({
                sdpMLineIndex: o["label"],
                candidate: o["id"],
              });
              localPeer.addIceCandidate(iceCandidate);


            }
          );
      
          stompClient.subscribe("/user/" + localID + "/topic/hangup", (message) => {
            console.log("Call ended by remote user: " + message.body);
      
            // Close the WebRTC connection
            if (localPeer) {
              localPeer.close();
              localPeer = null;
              console.log("Peer connection closed by remote user");
            }
      
            // Reset call flags
            isOnCall = false;
      
            // Update the UI
            alert("Call has been ended by the other user.");
      
            connectBtn.disabled = true;
            connectBtn.style.backgroundColor = "#878787";
            callBtn.disabled = false;
            callBtn.style.backgroundColor = "#059669";
            hangUpBtn.disabled = true;
            hangUpBtn.style.backgroundColor = "#878787";

            hideRemoteLoading()
          });


        } else {
          alert("Another user is already using this username. Please try some other username");
        }
      }
    );

    // Send both username and client ID to server
    stompClient.send(
      "/app/addUser",
      {},
      JSON.stringify({
        username: localIdInp.value,
        clientId: clientId,
      })
    );
  });
};

callBtn.onclick = () => {
  if (isOnCall) {
    const alreadyOnCallDialog = document.createElement("div");
    alreadyOnCallDialog.style.position = "fixed";
    alreadyOnCallDialog.style.top = "50%";
    alreadyOnCallDialog.style.left = "50%";
    alreadyOnCallDialog.style.transform = "translate(-50%, -50%)";
    alreadyOnCallDialog.style.padding = "20px";
    alreadyOnCallDialog.style.background = "white";
    alreadyOnCallDialog.style.border = "1px solid black";
    alreadyOnCallDialog.style.zIndex = "1000";

    alreadyOnCallDialog.innerHTML =
      "<p>You are already on a call. Please end your current call before initiating a new one.</p><button id='closeAlreadyOnCallDialog'>Close</button>";

    document.body.appendChild(alreadyOnCallDialog);

    document.getElementById("closeAlreadyOnCallDialog").onclick = () => {
      document.body.removeChild(alreadyOnCallDialog);
    };

    return; // Do not initiate a new call
  }

  // If not on a call, proceed with initiating the call
  localPeer = new RTCPeerConnection(iceServers);
  remoteID = remoteIdInp.value;
  stompClient.send(
    "/app/call",
    {},
    JSON.stringify({ callTo: remoteID, callFrom: localID })
  );

  connectBtn.disabled = true;
  connectBtn.style.backgroundColor = "#878787";
  callBtn.disabled = true;
  callBtn.style.backgroundColor = "#878787";
  hangUpBtn.disabled = false;
  hangUpBtn.style.backgroundColor = "#dc2626";

  showRemoteLoading()
  
};

testConnection.onclick = () => {
  stompClient.send("/app/testServer", {}, "Test Server");
};

function showRemoteLoading() {
    const loadingOverlay = document.getElementById('remoteVideoLoading');
    loadingOverlay.style.opacity = '1';
}

function hideRemoteLoading() {
    const loadingOverlay = document.getElementById('remoteVideoLoading');
    loadingOverlay.style.opacity = '0';
}
