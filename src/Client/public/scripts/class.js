var socketClass = io('/classes');


$(document).ready(function () {
    initSocket();
    fixNav();
});

function initSocket() {
    console.log("init");
    socketClass.on('alert', function (msg) {
        msg = JSON.parse(msg);
        var color = getAlertColor(msg.alertType);
        console.log("got " + msg + " and color is " + color);
        addAlertToRoom(msg.roomID, color);
        var audio = new Audio('/images/alert.mp3');
        audio.play();
    });
}

function addAlertToRoom(roomID, color) {
    cleanRoomBorder(roomID);
    $("#room" + roomID).fadeOut(0, function () {
        $(this).addClass(color + "Border");
    }).fadeIn(1000)
}

function removeAlertFromRoom(roomID, color) {
    $("#room" + roomID).removeClass(color + "Border");
}

function cleanRoomBorder(roomID) {
    removeAlertFromRoom(roomID, "red");
    removeAlertFromRoom(roomID, "green");
    removeAlertFromRoom(roomID, "orange");
    removeAlertFromRoom(roomID, "blue");

}

function getRoomsHtml() {
    var html = "<div class=\"row\">\n";
    for (var i = 0; i < rooms.length; i++) {
        html += getRoomHtml(rooms[i]);
        if (i != rooms.length - 1 && i % 2 == 1) {
            html += "</div>\n" +
                "        <div class=\"row\">";
        }
    }

    html += "</div>\n";
    return html;
}


function cleanRoomAlertClick(roomID) {
    var btn = window.event.which;
    if (btn === 1 || btn === 2) {
        cleanRoomBorder(roomID);
    }
}


function getRoomHtml(room) {
    var alert = "";
    if (isTeacher)
        alert = getAlertFromRoom(room.id);
    if (alert != "")
        alert += "Border";
    return "<div id=\"room" + room.id + "\" class=\"card " + alert + "\">\n" +
        "                <img class=\"card-img-top\"\n" +
        "                     src=\"https://previews.123rf.com/images/iimages/iimages1301/iimages130101248/17443634-Illustration-of-a-teacher-in-the-classroom-Stock-Vector-cartoon.jpg\"\n" +
        "                     alt=\"Card image cap\">\n" +
        "                <div class=\"card-block\">\n" +
        "                    <h4 class=\"card-title\">" + room.name + "</h4>\n" +
        "                    <p class=\"card-text\"> " + room.desc + "\n" +
        "                        </p>\n" +
        "                    <a href=\"/room/" + room.id + "\" class=\"btn btn-primary\" onmousedown='cleanRoomAlertClick(" + room.id + ")'>" + enterRoom + "</a>\n" +
        "                </div>\n" +
        "            </div>";
}

function getAlertFromRoom(roomID) {
    if (roomID in alert) {
        return getAlertColor(alert[roomID]);
    }
    return "";
}

function getAlertColor(alertType) {
    switch (alertType) {
        case "Technical Challenge":
        case "TEC":
            return "blue";
        case "Idleness":
        case "IDLENESS":
            return "red";
        case "Final Answer":
        case "DS":
            return "green";
        case "NMD":
            return "orange";
        default :
            return "";
    }
}


function fixNav() {
    var elementPosition = $('#key').offset();

    $(window).scroll(function () {
        if ($(window).scrollTop() > elementPosition.top) {
            $('#key').addClass("fixed-top");
        } else {
            $('#key').removeClass("fixed-top");
        }
    });
}
