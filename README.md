<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Calling App</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f9;
        }
        h1, h2, h3 {
            color: #333;
        }
        pre {
            background: #eee;
            padding: 10px;
            border: 1px solid #ccc;
            overflow-x: auto;
        }
        ul {
            margin: 0;
            padding: 0 0 0 20px;
        }
        a {
            color: #007BFF;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <h1>Video Calling App</h1>
    <p>This project is a full-stack video calling application. The backend is built using <strong>Spring Boot</strong>, <strong>WebRTC</strong>, <strong>WebSockets</strong>, and the frontend uses <strong>HTML</strong>, <strong>CSS</strong>, <strong>JavaScript</strong>, along with <strong>STOMP Client</strong> and <strong>SockJS</strong> for WebSocket communication.</p>

    <h2>Features</h2>
    <ul>
        <li>Real-time video and audio communication.</li>
        <li>User signaling using WebSockets.</li>
        <li>Interactive and responsive UI.</li>
        <li>Easy integration with WebRTC for peer-to-peer communication.</li>
        <li>STOMP protocol for WebSocket communication.</li>
    </ul>

    <hr>

    <h2>Technologies Used</h2>

    <h3>Backend:</h3>
    <ul>
        <li><strong>Spring Boot</strong>: REST API and WebSocket server.</li>
        <li><strong>WebRTC</strong>: Peer-to-peer video calling.</li>
        <li><strong>WebSockets</strong>: Signaling mechanism.</li>
    </ul>

    <h3>Frontend:</h3>
    <ul>
        <li><strong>HTML, CSS, JavaScript</strong>: User interface.</li>
        <li><strong>STOMP Client</strong>: Communication protocol over WebSockets.</li>
        <li><strong>SockJS</strong>: Fallback support for WebSocket communication.</li>
    </ul>

    <hr>

    <h2>System Design</h2>
    <p>The application uses WebRTC for establishing peer-to-peer communication. A Spring Boot server acts as the signaling server to exchange metadata between peers (SDP and ICE candidates) using WebSockets.</p>

    <h3>Diagram</h3>
    <p>Below is the system design diagram illustrating the flow of the application:</p>
    <img src="diagram_placeholder" alt="System Design Diagram" style="max-width:100%; height:auto;">

    <hr>

    <h2>Project Setup</h2>

    <h3>Backend Setup</h3>
    <ol>
        <li>Clone the repository:
            <pre><code>git clone &lt;repository-url&gt;</code></pre>
        </li>
        <li>Navigate to the backend directory:
            <pre><code>cd backend</code></pre>
        </li>
        <li>Build and run the Spring Boot application:
            <pre><code>./mvnw spring-boot:run</code></pre>
        </li>
    </ol>

    <h3>Frontend Setup</h3>
    <ol>
        <li>Navigate to the frontend directory:
            <pre><code>cd frontend</code></pre>
        </li>
        <li>Open <code>index.html</code> in a browser to launch the application.</li>
    </ol>

    <hr>

    <h2>How It Works</h2>
    <ol>
        <li><strong>Signaling:</strong>
            <ul>
                <li>The client connects to the Spring Boot WebSocket server.</li>
                <li>Users exchange SDP (Session Description Protocol) and ICE (Interactive Connectivity Establishment) candidates through WebSockets.</li>
            </ul>
        </li>
        <li><strong>WebRTC Peer Connection:</strong>
            <ul>
                <li>WebRTC APIs establish a peer-to-peer connection between users for audio and video streaming.</li>
            </ul>
        </li>
        <li><strong>Media Stream:</strong>
            <ul>
                <li>Local media streams are captured using WebRTC and shared over the peer connection.</li>
            </ul>
        </li>
    </ol>

    <hr>

    <h2>Contributing</h2>
    <p>Contributions are welcome! Please fork the repository and create a pull request with your changes.</p>

    <hr>

    <h2>License</h2>
    <p>This project is licensed under the MIT License.</p>

    <hr>

    <h2>Contact</h2>
    <p>For any inquiries, please contact [Your Email Address].</p>
</body>
</html>
