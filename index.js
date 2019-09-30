var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var messageQueue = [];
var userCounter = 1;
var users = [];

app.use(express.static('static'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    io.to(socket.id).emit('log', messageQueue);
    newUser(socket.id);
    io.emit('user update', users);

    socket.on('disconnect', function(){
        disconnectUser(socket.id);
        io.emit('user update', users);
    });

    socket.on('cookie', function(name){
        newNickname(socket.id, name);
        io.emit('user update', users);
    })

    socket.on('chat message', function(msg){
        if(msg.startsWith('/nickcolor')){
            var color = "#" + msg.substring(11,msg.length);
            newNickColor(color, socket.id);
            io.emit('user update', users);
        } else if(msg.startsWith('/nick')){
            var name = msg.substring(6,msg.length);
            newNickname(name, socket.id);
            io.emit('user update', users);
        }else{
            var nickname = users.find(user => user.id === socket.id).name;
            var rgb = users.find(user => user.id === socket.id); 
            var time = Date.now();
            var messageInfo = {"message": msg,
                               "time": time,
                               "nickname": nickname,
                               "color": rgb
                            };
            io.emit('chat message', messageInfo);
            appendMessageQueue(messageInfo);
        }
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});

function newUser(socketid){
    var name = "User" + userCounter;
    userCounter++;
    users.push({id: socketid, name: name, rgb: '#000000'});
}

function newNickColor(newCol, socketid){
    users.find(function(value){
        if(value.id === socketid){
            var indexOfVal = users.indexOf(value);
            users[indexOfVal].rgb = newCol;
        }
    });
}

function newNickname(newName, socketid){
    if(isNicknameUnique(newName)){ 
        users.find(function(value){
            if(value.id === socketid){
                var indexOfVal = users.indexOf(value);
                users[indexOfVal].name = newName;
            }
        });
    }
}

function isNicknameUnique(checkName){
    for(var i = 0; i < users.length; i++){
        if(users[i].name === checkName){
            return false;
        }
    }return true;
}

function appendMessageQueue(newMsg){
    messageQueue.push(newMsg);
    if(messageQueue.length > 200){
        messageQueue.shift();
    }

}

function disconnectUser(socketid){
    var indexToDelete;
    users.find(function(value){
        if(value.id === socketid){
            indexToDelete = users.indexOf(value);
        }
    });
    users.splice(indexToDelete,1);
    io.emit('user update', users);
}