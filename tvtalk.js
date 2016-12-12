var fs = require('fs');

var Discord = require('discord.js');
var bot = new Discord.Client();

var config = require('./config.json');

var shows = {};

try {
    shows = require('./shows.json');
} catch (e) {

}

// Load custom permissions
var dangerousCommands = [""];
var Permissions = {};
try {
    Permissions = require("./permissions.json");
} catch (e) {
    Permissions.global = {};
    Permissions.users = {};
}

for (var i = 0; i < dangerousCommands.length; i++) {
    var cmd = dangerousCommands[i];
    if (!Permissions.global.hasOwnProperty(cmd)) {
        Permissions.global[cmd] = false;
    }
}
Permissions.checkPermission = function(user, permission) {
    try {
        var allowed = true;
        try {
            if (Permissions.global.hasOwnProperty(permission)) {
                allowed = Permissions.global[permission] === true;
            }
        } catch (e) {}
        try {
            if (Permissions.users[user.id].hasOwnProperty(permission)) {
                allowed = Permissions.users[user.id][permission] === true;
            }
        } catch (e) {}
        return allowed;
    } catch (e) {}
    return false;
}
fs.writeFile("./permissions.json", JSON.stringify(Permissions, null, 2));

var aliases;

var commands = {
    "aliases": {
        description: "lists all recorded aliases",
        process: function(bot, msg, suffix) {
            var text = "current aliases:\n";
            for (var a in aliases) {
                if (typeof a === 'string')
                    text += a + " ";
            }
            msg.channel.sendMessage(text);
        }
    },
    "alias": {
        usage: "<name> <actual command>",
        description: "Creates command aliases. Useful for making simple commands on the fly",
        process: function(bot, msg, suffix) {
            var args = suffix.split(" ");
            var name = args.shift();
            if (!name) {
                msg.channel.sendMessage(config.prefix + "alias " + this.usage + "\n" + this.description);
            } else if (commands[name] || name === "help") {
                msg.channel.sendMessage("overwriting commands with aliases is not allowed!");
            } else {
                var command = args.shift();
                aliases[name] = [command, args.join(" ")];
                //now save the new alias
                require("fs").writeFile("./alias.json", JSON.stringify(aliases, null, 2), null);
                msg.channel.sendMessage("created alias " + name);

            }
        }
    },
    "listshows": {
        usage: "",
        description: "",
        process: function(bot, msg, suffix) {
            var showlist = '';
            var count = 1;
            for (var key in shows) {
                if (shows.hasOwnProperty(key)) {
                    //console.log(key + " -> " + JSON.stringify(shows[key]));
                    showlist += `**${count}.** ${shows[key].name}\n`;
                    count++;
                }
            }
            msg.channel.sendMessage(showlist).then(message => message.delete(10000)).then(msg.delete(10000));
        }
    },
    "addshow": {
        usage: "showid;name;aliases (seperated by commas);description;channel;rank;color;rating;link (commas);where (commas)",
        description: "",
        process: function(bot, msg, suffix) {
            shows[suffix] = {};
            fs.writeFile("./shows.json", JSON.stringify(shows, null, 2));
        }
    },
    "editshow": {

    },
    "request": {

    },
    "viewall": {
      usage: "[true | false]",
      description: "Allows the user to view all the text channels for all shows.",
      process: function(bot, msg, suffix) {
        if (!msg.guild.members.find("id", msg.author.id).roles.exists("name", "all")) {
          msg.guild.members.find("id", msg.author.id).addRole(msg.guild.roles.find("name", "all"));
          msg.reply(`You can now view all channels! Type **${config.prefix}viewall** again to turn it off.`);
        } else {
          msg.guild.members.find("id", msg.author.id).removeRole(msg.guild.roles.find("name", "all"));
          msg.reply(`You can no longer view all channels! Type **${config.prefix}viewall** again to turn it on.`);
        }

      }
    }
};

try {
    aliases = require("./alias.json");
} catch (e) {
    //No aliases defined
    aliases = {};
}

bot.on('ready', () => {
    var boot = ["I am ready to be of service.", "Alert and online, captain.", "Feels good to be online again."];
    console.log(`${bot.user.username} (${bot.user.id}) - ` + boot[Math.floor(Math.random() * boot.length)]);
});

bot.on('guildMemberAdd', member => {
    if (member.user.bot) return;
    member.guild.defaultChannel.sendMessage(`**New User: <@${member.user.id}>**`)
        .then(message => console.log(`Sent message: ${message.content}`))
        .catch(console.error);
    console.log(member.guild.roles);
    member.addRole(member.guild.roles.find("name", "temp"));
});

function checkMessageForCommand(msg, isEdit) {
    //check if message is a command
    if (msg.author.id == bot.user.id) return;
    if (msg.isMentioned(bot.user.id) || (msg.content[0] === config.prefix)) {
        console.log("treating " + msg.content + " from " + msg.author + " as command");
        var cmdTxt = msg.content.split(" ")[0].substring(1);
        var suffix = msg.content.substring(cmdTxt.length + 2); //add one for the ! and one for the space
        var mention = `<@${bot.user.id}>`;
        if (msg.isMentioned(bot.user.id)) {
            try {
                cmdTxt = msg.content.split(" ")[1];
                suffix = msg.content.substring(bot.user.id.length+3+cmdTxt.length+2);
            } catch (e) { //no command
                var msgs = ["Hm?", "What?", "Excuse me?", "What do you want?"];
                msg.channel.sendMessage(msgs[Math.floor(Math.random() * msgs.length)]);
                return;
            }
        }
        alias = aliases[cmdTxt];
        if (alias) {
            console.log(cmdTxt + " is an alias, constructed command is " + alias.join(" ") + " " + suffix);
            cmdTxt = alias[0];
            suffix = alias[1] + " " + suffix;
        }
        var cmd = commands[cmdTxt];
        if (cmdTxt === "help") {
            //help is special since it iterates over the other commands
            if (suffix) {
                var cmds = suffix.split(" ").filter(function(cmd) {
                    return commands[cmd]
                });
                var info = "";
                for (var i = 0; i < cmds.length; i++) {
                    var cmd = cmds[i];
                    info += "**" + config.prefix + cmd + "**";
                    var usage = commands[cmd].usage;
                    if (usage) {
                        info += " " + usage;
                    }
                    var description = commands[cmd].description;
                    if (description instanceof Function) {
                        description = description();
                    }
                    if (description) {
                        info += "\n\t" + description;
                    }
                    info += "\n"
                }
                msg.channel.sendMessage(info);
            } else {
                msg.author.sendMessage("**Available Commands:**").then(function() {
                    var batch = "";
                    var sortedCommands = Object.keys(commands).sort();
                    for (var i in sortedCommands) {
                        var cmd = sortedCommands[i];
                        var info = "**" + config.prefix + cmd + "**";
                        var usage = commands[cmd].usage;
                        if (usage) {
                            info += " " + usage;
                        }
                        var description = commands[cmd].description;
                        if (description instanceof Function) {
                            description = description();
                        }
                        if (description) {
                            info += "\n\t" + description;
                        }
                        var newBatch = batch + "\n" + info;
                        if (newBatch.length > (1024 - 8)) { //limit message length
                            msg.author.sendMessage(batch);
                            batch = info;
                        } else {
                            batch = newBatch
                        }
                    }
                    if (batch.length > 0) {
                        msg.author.sendMessage(batch);
                    }
                });
            }
        } else if (cmd) {
            if (Permissions.checkPermission(msg.author, cmdTxt)) {
                try {
                    cmd.process(bot, msg, suffix, isEdit);
                } catch (e) {
                    var msgTxt = "command " + cmdTxt + " failed :(";
                    if (config.debug) {
                        msgTxt += "\n" + e.stack;
                    }
                    msg.channel.sendMessage(msgTxt);
                }
            } else {
                msg.channel.sendMessage("You are not allowed to run " + cmdTxt + "!");
            }
        } else {
            msg.channel.sendMessage(cmdTxt + " not recognized as a command!").then((message => message.delete(5000)))
        }
    } else {
        //message isn't a command or is from us
        //drop our own messages to prevent feedback loops
        if (msg.author == bot.user) {
            return;
        }

        if (msg.author != bot.user && msg.isMentioned(bot.user)) {
            msg.channel.sendMessage(msg.author + ", you called?");
        } else {

        }
    }
}

bot.on('message', msg => {
    checkMessageForCommand(msg, false);
});

bot.login(config.token);
