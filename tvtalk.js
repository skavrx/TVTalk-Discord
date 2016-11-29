const Discord = require('discord.js');
const bot = new Discord.Client();

var config = require('./config.json');

bot.on('ready', () => {
  console.log('I am ready!');
});

bot.on('message', message => {
  if (message.content === 'ping') {
    message.reply('pong');
  }
});

bot.login(config.token);
