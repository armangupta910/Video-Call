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

connectBtn.disabled = false;
connectBtn.style.backgroundColor = "#007bff";
callBtn.disabled = true;
callBtn.style.backgroundColor = "#d9d9d9";
hangUpBtn.disabled = true;
hangUpBtn.style.backgroundColor = "#d9d9d9";

// ICE Server Configurations
const iceServers = {
  iceServer: {
    urls: "stun:stun.l.google.com:19302",
  },
};

localPeer = new RTCPeerConnection(iceServers);

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
  } else if (
    localPeer.connectionState === "disconnected" ||
    localPeer.connectionState === "closed" ||
    localPeer.connectionState === "failed"
  ) {
    isOnCall = false; // Reset the flag when the connection ends
    console.log("WebRTC connection ended, isOnCall set to false");
  }
};

connectBtn.onclick = () => {
  // Connect to Websocket Server
  var socket = new SockJS("/websocket", { debug: false });
  stompClient = Stomp.over(socket);
  localID = localIdInp.value;
  console.log("My ID: " + localID);
  stompClient.connect({}, (frame) => {
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
      connectBtn.style.backgroundColor = "#d9d9d9";
      callBtn.disabled = false;
      callBtn.style.backgroundColor = "#007bff";
      hangUpBtn.disabled = true;
      hangUpBtn.style.backgroundColor = "#d9d9d9";
      
    };

    console.log("Frame is :- " + frame);

    // Subscribe to testing URL not very important
    stompClient.subscribe("/topic/testServer", function (test) {
      console.log("Received: " + test.body);
    });

    stompClient.subscribe(
      "/user/" + localIdInp.value + "/topic/call",
      (call) => {
        console.log("Call From: " + call.body);
        remoteID = call.body;
        console.log("Remote ID: " + call.body);

        // Show the custom dialog
        const callDialog = document.getElementById("callDialog");
        const callerInfo = document.getElementById("callerInfo");
        const acceptCall = document.getElementById("acceptCall");
        const rejectCall = document.getElementById("rejectCall");

        callerInfo.innerText = "Incoming call from ${remoteID}";
        callDialog.style.display = "block";

        // Handle Accept Call
        acceptCall.onclick = () => {
          callDialog.style.display = "none"; // Hide the dialog

          // Create a new RTCPeerConnection for the new call
          localPeer = new RTCPeerConnection(iceServers);
          console.log("New RTCPeerConnection created.");

          // Handle the incoming remote stream
          localPeer.ontrack = (event) => {
            console.log("On Track");
            remoteVideo.srcObject = event.streams[0];
          };

          // Handle ICE candidates
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
        };

        // Handle Reject Call
        rejectCall.onclick = () => {
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

        rejectionDialog.innerHTML =
          "<p>${rejectMessage.body}</p><button id='closeRejectionDialog'>Close</button>";

        document.body.appendChild(rejectionDialog);

        document.getElementById("closeRejectionDialog").onclick = () => {
          document.body.removeChild(rejectionDialog);
        };

        isOnCall = false; // Ensure the flag remains false

        connectBtn.disabled = true;
        connectBtn.style.backgroundColor = "#d9d9d9";
        callBtn.disabled = false;
        callBtn.style.backgroundColor = "#007bff";
        hangUpBtn.disabled = true;
        hangUpBtn.style.backgroundColor = "#d9d9d9";
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
      connectBtn.style.backgroundColor = "#d9d9d9";
      callBtn.disabled = false;
      callBtn.style.backgroundColor = "#007bff";
      hangUpBtn.disabled = true;
      hangUpBtn.style.backgroundColor = "#d9d9d9";
    });

    stompClient.send("/app/addUser", {}, localIdInp.value);

    connectBtn.disabled = true;
    connectBtn.style.backgroundColor = "#d9d9d9";
    callBtn.disabled = false;
    callBtn.style.backgroundColor = "#007bff";
    hangUpBtn.disabled = true;
    hangUpBtn.style.backgroundColor = "#d9d9d9";
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
  connectBtn.style.backgroundColor = "#d9d9d9";
  callBtn.disabled = true;
  callBtn.style.backgroundColor = "#d9d9d9";
  hangUpBtn.disabled = false;
  hangUpBtn.style.backgroundColor = "#007bff";
  
};

testConnection.onclick = () => {
  stompClient.send("/app/testServer", {}, "Test Server");
};

// callBtn.disabled = false;
//             callBtn.style.backgroundColor = "#007bff";
//             connectBtn.disabled = true;
//             connectBtn.style.backgroundColor = "#d9d9d9";
//             hangUpBtn.disabled = true;
//             hangUpBtn.style.backgroundColor = "#d9d9d9";
