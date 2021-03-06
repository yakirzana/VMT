var config = require('../config');
var usersInRooms = [];
var userCount = [];

module.exports = function (io, sl, classSocket, log) {
    var ioPic = io.of('/pic');
    io = io.of('/rooms');

    io.on('connection', async function(socket) {
        var roomId = socket.handshake.headers.referer.split("/").pop();
        var room = await sl.rooms.getRoomById(roomId);
        if(room == undefined)
            socket.disconnect();
        socket.join(roomId);

        socket.on('init', function (username) {
            socket.emit('init', room.userInControl);
            socket.user = username;

            addUser(socket, roomId, log, classSocket);
            log.info("User " + username + " is join to room " + roomId);
        });

        socket.on('disconnect', function () {
            if (socket.user == undefined) return;
            releaseControl(socket.user);
            removeUser(socket, roomId, log, classSocket);
            log.info("User " + socket.user + " is disconnect from room " + roomId);
        });

        socket.on('update', function (update) {
            socket.broadcast.to(roomId).emit('update', update);
            room.base64 = update;
            sl.rooms.saveRoom(room);
            sendPost(config.urlRestDrag, roomId, socket.user, log, classSocket);
        });

        socket.on('lockFromClient', function (user) {
            socket.user = user;
            room.isLocked = true;
            room.userInControl = user;
            sl.rooms.saveRoom(room);
            socket.broadcast.to(roomId).emit('lockFromServer', user);
        });

        socket.on('releaseFromClient', function (user) {
            releaseControl(user);
        });

        socket.on('finish', function (user) {
            sendPost(config.urlRestDS, roomId, user, log, classSocket);
            log.info("got finish task from room " + roomId);
        });

        function releaseControl(user) {
            if(room == undefined || user != room.userInControl) return;
            room.isLocked = false;
            room.userInControl = undefined;
            sl.rooms.saveRoom(room);
            socket.broadcast.to(roomId).emit('releaseFromServer', user);
        }
    });

    ioPic.on('connection', async function (socket) {
        socket.on('pic', function (pic) {
            classSocket.updatePic(pic);
        });
    });
};


function addUser(socket, roomId, log, classSocket) {
    if (usersInRooms[roomId] === undefined)
        usersInRooms[roomId] = [];
    if (userCount[roomId] === undefined)
        userCount[roomId] = new Map();

    if (!userCount[roomId].has(socket.user))
        userCount[roomId].set(socket.user, 0);
    if (userCount[roomId].get(socket.user) === 0) {
        usersInRooms[roomId].push(socket.user);

        // Send only if this the first connection
        sendPost(config.urlRestConnect, roomId, socket.user, log, classSocket);
    }

    userCount[roomId].set(socket.user, userCount[roomId].get(socket.user) + 1);
    socket.emit('listOfUsers', usersInRooms[roomId]);
    socket.broadcast.to(roomId).emit('listOfUsers', usersInRooms[roomId]);

}

function removeUser(socket, roomId, log, classSocket) {
    if (usersInRooms[roomId] === undefined) return;
    if (userCount[roomId].has(socket.user) && userCount[roomId].get(socket.user) === 1) {
        usersInRooms[roomId] = usersInRooms[roomId].filter(e => e !== socket.user);

        // Send only if this the last connection
        sendPost(config.urlRestDisconnect, roomId, socket.user, log, classSocket);
    }
    userCount[roomId].set(socket.user, userCount[roomId].get(socket.user) - 1);
    socket.emit('listOfUsers', usersInRooms[roomId]);
    socket.broadcast.to(roomId).emit('listOfUsers', usersInRooms[roomId]);
}

function sendPost(url, roomID, username, log, classSocket) {
    var request = require('request');
    var moment = require('moment');
    var date = moment().format('DD/MM/YYYY H:mm:ss');
    var options = {
        uri: url,
        method: 'POST',
        json: {
            "room_id": roomID,
            "user_id": username,
            "timestamp": date
        }
    };
    console.log("RoomSocket: send post to " + url + " with param: " + roomID + " " + username + " " + date);
    log.info("RoomSocket: send post to " + url + " with param: " + roomID + " " + username + " " + date);

    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("RoomSocket: got answer from post : " + JSON.stringify(body));
            log.info("RoomSocket: got answer from post : " + JSON.stringify(body));
            classSocket.addAlert(1, roomID, body);
        }
        if (error) {
            console.log("RoomSocket: " + error);
            log.error("RoomSocket: " + error);
        }
    });

}
