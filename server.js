import http from 'http';
import fs from 'fs';
import { WebSocketServer } from 'ws';
import path from "path";


const server = http.createServer((req, res) => {
    console.log(req.url)
  if (req.url === "/script.js") {
    res.writeHead(200, { 'Content-Type': `text/javascript` });

    let js_file = fs.readFileSync(path.join(process.cwd(), `public/script.js`), 'utf8');
    
    res.write(js_file);
    res.end();
  } else {

    // Set the response HTTP header with HTTP status and Content type
    res.writeHead(200, { 'Content-Type': `text/html` });

    const stream = fs.readFileSync(path.join(process.cwd(), `public/index.html`), 'utf8');
        
    res.write(stream);
    res.end();
  }
});

const PORT = 3001;

const wss = new WebSocketServer({server});


wss.on('connection', (socket, req)=> {
  const username_master = new URL(req.url, `http://${req.headers.host}`).searchParams.get(
  "username",
  );
  
  socket.on('error', console.error);

  socket.on("message", (data)=> {
    const {username, text} = JSON.parse(data);
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'chat', username, text }));
        }
      });
    }
  )

  socket.on("close", (data)=> {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'system', text: `${username_master} left` }));
      }
    });
  })

  wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ "type": "system", "text": `${username_master} joined` }));
      }
    });

  
});

server.listen(PORT, "localhost", ()=> {
    console.log(`Chat server running at http://localhost:${PORT}`)
});