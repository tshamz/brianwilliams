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

controller.configureSlackApp({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  scopes: ['bot']
});

controller.setupWebserver(process.env.PORT, function(err, webserver) {
  if (err) {
    throw new Error(err);
  }
  controller.createHomepageEndpoint(controller.webserver);
});

var bot = controller.spawn({
  token: process.env.BOT_TOKEN
});

bot.startRTM(function(err) {
  if (err) {
    console.log('Even if you fall on your face, you\'re still moving forward.');
    throw new Error(err);
  }
  console.log(Botkit);
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


// Message Listeners  ===============================================

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

controller.hears(['hello', 'hi'], ['direct_message', 'mention', 'direct_mention'], function(bot, message) {
  var validateName = getRealNameFromId(bot, message.user);
  bot.reply(message, 'Hello!');
  if (validateName) {
    bot.reply(message, 'Hey! You\'re pretty valid!');
  }
});

// controller.hears([/[\s\S]*/], ['ambient'], function(bot, message) {
//   if (readOnlyChannels.indexOf(message.channel) !== -1) {
//     var messageText = message.text;
//     var options = {
//       token: 'xoxp-2334831841-2335988250-36830721557-bd1498f3a8',
//       ts: message.ts,
//       channel: message.channel,
//       as_user: true
//     };

//     bot.api.chat.delete(options, function(err, response) {
//       console.log(response);
//       if (err) {
//         console.log(err);
//       } else {
//         console.log('Attempting to delete the message: ' + messageText);
//       }
//     });
//   }
// });



// Event Listeners ===============================================

controller.on('direct_message, mention, direct_mention', function(bot, message) {
  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'shakabra'
  }, function(err) {
    if (err) {
      console.log(err);
    }
    bot.reply(message, 'shaka brah');
  });
});

controller.on('ambient', function(bot, message) {
  console.log(message);
  if (readOnlyChannels.indexOf(message.channel) !== -1) {
    var messageText = message.text;
    var options = {
      token: 'xoxp-2334831841-2335988250-36830721557-bd1498f3a8',
      ts: message.ts,
      channel: message.channel,
      as_user: true
    };

    console.log('Attempting to delete the message: ' + messageText);

    bot.api.chat.delete(options, function(err, response) {
      if (err) {
        console.log('Unable to delete due error: ' + err);
      } else {
        console.log('Message successfully deleted');
      }
    });
  }
});

controller.on('rtm_open', function(bot) {
  console.log('** The RTM api just connected: ' + bot.identity.name);
});

controller.on('rtm_close', function() {
  console.log('** The RTM api just closed');
});
