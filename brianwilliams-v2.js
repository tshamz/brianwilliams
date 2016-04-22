// Config ===============================================

var Q                    = require('q');
var moment               = require('moment');
var Botkit               = require('botkit');
var responses            = require('./responses.js');

var whitelistedUsers     = ['tyler shambora', 'daniel lerman'];
var readOnlyChannels     = ['C0XLCLA3X'];



// Init ===============================================

if (!process.env.BOT_TOKEN) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

var controller = Botkit.slackbot({
  debug: true,
  logLevel: 6
});

var bot = controller.spawn({
  token: process.env.BOT_TOKEN
}).startRTM(function(err, bot, payload) {
  if (err) {
    console.log('Error connecting bot to Slack: ', err);
    throw new Error(err);
  }
  console.log('Even if you fall on your face, you\'re still moving forward. Never forget it.');
});



// Event Listeners ===============================================

controller.on('rtm_open', function(bot) {
  console.log('** The RTM api just connected: ' + bot.identity.name);
});

controller.on('rtm_close', function() {
  console.log('** The RTM api just closed');
});



// Helper Functions ===============================================

var getRealNameFromId = function(bot, userId) {
  var deferred = Q.defer();
  var realName = '';
  bot.api.users.info({user: userId}, function(err, response) {
    realName = response.user.real_name.toLowerCase();
    deferred.resolve(realName);
  });
  return deferred.promise;
};

var isValidChannelName = function(bot, channelName) {
  var deferred = Q.defer();
  bot.api.channels.list({}, function(err, response) {
    deferred.resolve(response.channels.some(function(channel) {
      return channel.name === channelName;
    }));
  });
  return deferred.promise;
};

var isValidUser = function(realName) {
  var deferred = Q.defer();
  deferred.resolve(whitelistedUsers.some(function(userName) {
    return userName === realName;
  }));
  return deferred.promise;
};


// Listeners  ===============================================

controller.hears([/post to (\S+) ([\s\S]*)/], 'direct_message', function(bot, message) {

  var channelName = message.match[1];
  var update = message.match[2];

  var parsedMessages = update.split('\n\n').map(function(block) {
    var messageParts = block.split('\n');
    return {
      fallback: messageParts[1],
      title: messageParts[0],
      text: messageParts[1],
      color: 'danger',
      mrkdwn_in: ['fallback', 'text']
    };
  });

  var validateChannel = isValidChannelName(bot, channelName);
  var validateName = getRealNameFromId(bot, message.user).then(isValidUser);
  var isValidated = Q.all([validateChannel, validateName]);

  isValidated.spread(function(validChannel, validUser) {
    if (!validUser) {
      return bot.reply(message, 'Sorry, you\'re not authenticated to post.');
    } else if (!validChannel) {
      return bot.reply(message, 'Sorry, I can\'t post to the channel: ' + channelName + '.');
    } else if (validUser && validChannel) {
      bot.startConversation(message, function(err, convo) {
        convo.ask(responses.preview(bot, channelName, parsedMessages), [
          responses.yes(bot, channelName, parsedMessages, moment().format('dddd, MMMM Do YYYY')),
          responses.no(bot),
          responses.default()
        ]);
      });
    }
  });
});

controller.hears([/[\s\S]*/], ['ambient'], function(bot, message) {
  if (readOnlyChannels.indexOf(message.channel) !== -1) {

    var options = {};

    bot.api.chat.delete(options, function(err, response) {
      if (err) {
        console.log(err);
      } else {
        console.log(response);
        console.log('deleted message: ' + message);
      }
    });
  }
});

controller.hears(['hello', 'hi'], ['direct_message', 'mention', 'direct_mention'], function(bot, message) {
  var validateName = getRealNameFromId(bot, message.user);
  bot.reply(message, 'Hello!');
  if (validateName) {
    bot.reply(message, 'Hey! You\'re pretty valid!');
  }
});

controller.on('direct_message, mention, direct_mention', function(bot, message) {
  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'bobross'
  }, function(err) {
    if (err) {
      console.log(err);
    }
    bot.reply(message, 'I heard you loud and clear boss.');
  });
});

controller.on('slash_command', function(bot, message) {
  bot.replyPublic(message,'oh wow, <@' + message.user + '> used one of my slash commands. really. cool.');
});