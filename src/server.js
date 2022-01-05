const express = require("express");
const axios = require("axios");
const cors = require("cors");
const token = require("./AAIToken");

const app = express();
app.use(express.json());
app.use(cors());

const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get("/", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.assemblyai.com/v2/realtime/token", // use account token to get a temp user token
      { expires_in: 3600 }, // can set a TTL timer in seconds.
      { headers: { authorization: token } }
    ); // AssemblyAI API Key goes here
    const { data } = response;
    console.log("DATA CALLED");
    res.json(data);
  } catch (error) {
    const {
      response: { status, data },
    } = error;
    console.log("ERROR::", data.error);
    res.status(status).json(data);
  }
});

/*app.set("port", 5000);
const server = app.listen(app.get("port"), () => {
  console.log(`Server is running on port ${server.address().port}`);
  //console.log(token);
});*/

io.on("connection", (socket) => {
  console.log("a user connected");
});

server.listen(5000, () => {
  console.log("listening on *:5000");
});
