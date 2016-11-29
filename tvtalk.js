var Discord = require('discord.js');
var bot = new Discord.Client();

var config = require('./config.json');

var shows = require('./shows.json');

for (var key in shows) {
    if (shows.hasOwnProperty(key)) {
        console.log(key + " -> " + JSON.stringify(shows[key]));
    }
}

bot.on('ready', () => {
    var boot = ["I am ready to be of service.", "Alert and online, captain.", "Feels good to be online again."];
    console.log(boot[Math.floor(Math.random() * boot.length)]);
});

bot.on('serverNewMember', (server, user) => {
    if (user.bot) return;
});

bot.on('message', message => {
    if (message.content === 'ping') {
        message.reply('pong');
        var roles = bot.guilds.get("id", config.serverID).roles;
        console.log(roles);
        for (var i = 0; i < roles.length; i++) {
            console.log(roles[i].name + " -> " + roles[i].id + " -> " + roles[i].position + " -> " + roles[i].colorAsHex());
        }
    }
});

bot.login(config.token);
