// Config ===============================================

var Q                    = require('q');
var moment               = require('moment');
var Botkit               = require('botkit');
var responses            = require('./responses.js');

var whitelistedUsers     = ['tyler shambora', 'daniel lerman', 'ryan little', 'cory cummings'];
var readOnlyChannels     = ['C1317518C'];



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
  scopes: ['bot', 'chat:write:user', 'chat:write:bot']
});

controller.setupWebserver(process.env.PORT, function(err, webserver) {
  if (err) {
    throw new Error(err);
  }
  controller.createWebhookEndpoints(controller.webserver);
  controller.createHomepageEndpoint(controller.webserver);
  controller.createOauthEndpoints(controller.webserver, function(err, req, res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Great Success!');
    }
  });
});

var _bots = {};
var trackBot = function(bot) {
  _bots[bot.config.token] = bot;
};

controller.on('create_bot', function(bot, config) {
  console.log(config);
  if (_bots[bot.config.token]) {
    // already online! do nothing.
  } else {
    bot.startRTM(function(err) {
      if (!err) {
        trackBot(bot);
      }
      bot.startPrivateConversation({user: config.createdBy},function(err, convo) {
        if (err) {
          console.log(err);
        }
      });
    });
  }
});

controller.storage.teams.all(function(err, teams) {
  if (err) {
    throw new Error(err);
  }
  for (var t in teams) {
    if (teams[t].bot) {
      controller.spawn(teams[t]).startRTM(function(err, bot) {
        if (err) {
          console.log('Error connecting bot to Slack:',err);
        } else {
          trackBot(bot);
        }
      });
    }
  }
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

controller.hears([/post to (\S+)\n([\s\S]*)/], 'direct_message', function(bot, message) {
  var channelName = message.match[1];
  var update = message.match[2];

  var parsedMessages = update.split('\n\n\n').map(function(block) {
    var messageParts = block.split('\n___\n');
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
      var theDate = moment().format('dddd, MMMM Do YYYY');
      bot.startConversation(message, function(err, convo) {
        convo.say('*I\'m about to post the following:*');
        convo.say({
          username: 'Brian Williams: Dev Team News Anchor',
          icon_url: 'http://dev.tylershambora.com/images/father-williams.jpg',
          text: '<!channel>\n\n*Updates for ' + theDate + ':*',
          attachments: parsedMessages
        });
        convo.ask(responses.confirm(bot, channelName, parsedMessages, theDate), [
          responses.yes(bot, channelName, parsedMessages, theDate),
          responses.no(bot),
          responses.default()
        ]);
      });
    }
  });
});

controller.hears(['hey mister'], ['direct_message', 'mention', 'direct_mention'], function(bot, message) {
  getRealNameFromId(bot, message.user)
    .then(isValidUser)
    .then(function(result) {
      bot.reply(message, 'Hello!');
      if (result) {
        bot.reply(message, 'Hey! You\'re pretty valid!');
      }
    });
});

controller.on('direct_message, mention, direct_mention', function(bot, message) {
  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'jesus',
  }, function(err) {
    if (err) {
      console.log(err);
    } else {
      bot.reply(message, 'go with christ brah.');
    }
  });
});


controller.hears([/[\s\S]*/], ['direct_message', 'direct_mention', 'mention', 'ambient'], function(bot, message) {
  if (readOnlyChannels.indexOf(message.channel) !== -1) {
    getRealNameFromId(bot, message.user).then(function(realName) {
      var options = {
        token: process.env.MEGA_TOKEN,
        ts: message.ts,
        channel: message.channel,
        as_user: true
      };

      console.log('%s said: "%s"', realName, message.text);
      console.log('Attempting to delete the message.' );

      // this whole block looks pretty ripe for some abstraction and recursion (tsham)
      bot.api.chat.delete(options, function(err, response) {
        if (!response.ok) {
          console.log('Unable to delete due to error: ' + err);
          console.log('Trying one more time in 2 seconds');
          setTimeout(function() {
            bot.api.chat.delete(options, function(err, response) {
              if (!response.ok) {
                console.log('Unable to delete after a second attempt due to error: ' + err);
              }
            });
          }, 2000);
        } else {
          console.log('Message successfully deleted!');
        }
      });
    });
  }
});

controller.on('rtm_open', function(bot) {
  console.log('** The RTM api just connected: ' + bot.identity.name);
});

controller.on('rtm_close', function() {
  console.log('** The RTM api just closed');
});