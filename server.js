var express = require("express")
  , app = express()
  , http = require("http").createServer(app)
  , io = require("socket.io").listen(http)
  , _ = require("underscore");

app.use(express.logger());  

var participants = []

app.set("views", __dirname + "/views");

app.set("view engine", "jade");

app.use(express.static("public", __dirname + "/public"));

app.use(express.bodyParser());

/* Server routing */

app.get("/", function(request, response) {

  //Render the view called "index"
  response.render("index");

});

//POST method to create a chat message
app.post("/message", function(request, response) {

  var message = request.body.message;

  if(_.isUndefined(message) || _.isEmpty(message.trim())) {
    return response.json(400, {error: "Message is invalid"});
  }
  var name = request.body.name;

  io.sockets.emit("incomingMessage", {message: message, name: name});
  response.json(200, {message: "Message received"});

});

/* Socket.IO events */
io.sockets.on("connection", function(socket){
  
  socket.on("newUser", function(data) {
    participants.push({id: data.id, name: data.name});
    io.sockets.emit("newConnection", {participants: participants});
  });

  socket.on("nameChange", function(data) {
    _.findWhere(participants, {id: socket.id}).name = data.name;
    io.sockets.emit("nameChanged", {id: data.id, name: data.name});
  });

  socket.on("disconnect", function() {
    participants = _.without(participants,_.findWhere(participants, {id: socket.id}));
    io.sockets.emit("userDisconnected", {id: socket.id, sender:"system"});
  });

});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening to " + port);
});