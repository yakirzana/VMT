var User = require('../classes/User.js');

module.exports = function (bl) {
    this.login = async function (username, password) {
        try {
            await bl.users.getUserByUserName(username);
        }
        catch (err) {
            throw new Error("the user don't exist in system");
        }
        if (!await bl.users.isPassMatch(username, password))
            throw new Error("illegal password");
        return true;
    };

    this.logout = async function (username) {
        return true;
    };

    this.register = async function (username, password, firstName, lastName, sex, email, isTeacher) {
        if (username == "" || password == "" || firstName == "" || lastName == "" || sex == "" || email == "")
            throw new Error("Error in register, please try again");
        if (username.indexOf('\n') > -1 || username.indexOf('\t') > -1 || username.indexOf('@') > -1)
            throw new Error("Error in register,invalid characters, please try again");
        if (password.length < 4)
            throw new Error("Error in register,password too short");
        try {
            await bl.users.getUserByUserName(username);
        }
        catch (err) {
            var user = bl.users.addUser(username, password, firstName, lastName, sex, email, isTeacher);
            return user;
        }
        throw new Error("Error in register, please try again");
    };

    this.deleteUser = async function (username) {
        var rooms = await bl.rooms.getRoomsOfUser(username);
        for (room of rooms) {
            await bl.rooms.deleteUserFromRoom(room + "", username);
        }
        await bl.users.deleteUser(username);
        return true;
    };

    this.getUserByUserName = async function (username) {
        return await bl.users.getUserByUserName(username);
    };

    this.createUserHash = async function (username) {
        return await bl.users.createUserHash(username);
    };

    this.isHashMatch = async function (username, hash) {
        return await bl.users.isHashMatch(username, hash);
    };

};
