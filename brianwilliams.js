const dotenv = require('dotenv').config();
const moment = require('moment');
const Botkit = require('botkit');

const config = require('./config');
const responses = require('./responses');

const whitelistedUsers = process.env.WHITELIST_USERS.split(',');
const readOnlyChannels = process.env.READ_ONLY_CHANNELS.split(',');

if (!process.env.BOT_TOKEN) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

// Controller  ===============================================

const controller = Botkit.slackbot({ debug: false });

controller.configureSlackApp(config);

controller.setupWebserver(process.env.PORT, (err, webserver) => {
  if (err) throw new Error(err);
  controller.createWebhookEndpoints(controller.webserver);
  controller.createHomepageEndpoint(controller.webserver);
  controller.createOauthEndpoints(controller.webserver, (err, req, res) => {
    if (err) {
      res.status(500).send(`ERROR: ${err}`);
    } else {
      res.send('Great Success!');
    }
  });
});

const bot = controller.spawn({ token: process.env.BOT_TOKEN });
bot.startRTM(err => {
  if (err) throw new Error(err);
});

const _bots = {};

const trackBot = bot => {
  _bots[bot.config.token] = bot;
};

controller.on('create_bot', (bot, config) => {
  if (!_bots[bot.config.token]) {
    bot.startRTM((err, bot, payload) => {
      if (err) throw new Error(err);
      trackBot(bot);
    });
  }
});

controller.storage.teams.all((err, teams) => {
  if (err) throw new Error(err);
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

const getRealNameFromId = (bot, userId) => {
  return new Promise((resolve, reject) => {
    if (error) reject(error);
    bot.api.users.info({user: userId}, (err, response) => resolve(response.user.real_name.toLowerCase()));
  });
};

const validateChannel = (bot, channelName) => {
  return new Promise((resolve, reject) => {
    if (error) reject(error);
    bot.api.channels.list({}, (err, response) => resolve(response.channels.some(channel => channel.name === channelName)));
  });
};

const isValidUser = realName => {
  return whitelistedUsers.some(userName => userName === realName)
};

const parseAttachments = posts => {
  return posts.map(post => {
    const parts = post.split('\n___\n');
    return {
      fallback: parts[1],
      title: parts[0],
      text: parts[1],
      color: 'danger',
      mrkdwn_in: ['fallback', 'text']
    };
  });
};

controller.hears([/post to (\S+)\n([\s\S]*)/], 'direct_message', async (bot, message) => {
  const theDate = moment().format('dddd, MMMM Do YYYY');
  const channel = message.match[1];
  const attachments = parseAttachments(message.match[2].split('\n\n\n'));
  const isValidateChannel = validateChannel(bot, channel);
  const isValidUser = getRealNameFromId(bot, message.user).then(isValidUser);
  await Promise.all([isValidateChannel, isValidUser]);

  if (!isValidateChannel || !isValidUser) {
    bot.reply(message, `Sorry, I can\'t post that because it's an invalid channel or you're an invalid user`);
  } else {
    var theDate = ;
    bot.startConversation(message, function(err, convo) {
      convo.say(`*I'm about to post the following:*`);
      convo.say({
        username: `Brian Williams: Dev Team News Anchor`,
        icon_url: `http://dev.tylershambora.com/images/father-williams.jpg`,
        text: `<!channel>\n\n*Updates for ${theDate}:*`,
        attachments
      });
      convo.ask(responses.confirm(bot, channelName, parsedMessages, theDate), [
        responses.yes(bot, 'post', {channel:channelName, message:parsedMessages, date:theDate}),
        responses.no(bot),
        responses.default()
      ]);
    });
  }
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

controller.hears([/delete (\S+) from (\S+)/], ['direct_message'], function(bot, message) {
  var channelOptions = {
    token: bot.config.token,
    channel: message.match[2],
  };

  var deleteOptions = {
    token: process.env.MEGA_TOKEN,
    ts: message.match[1],
    channel: message.match[2],
    as_user: true
  };

  bot.api.channels.info(channelOptions, function (err, response) {
    if (!response.ok) {
      console.log(response);
      bot.reply(message, 'incorrect channel id');
    } else if (message.match[1][9] !== '.') {
      bot.reply(message, 'incorrect time stamp');
    } else {
      bot.startConversation(message, function(err, convo) {
        convo.say('*I\'m about to delete:*');
        convo.say(`https://bva.slack.com/archives/${response.channel.name}/p${message.match[1].replace('.', '')}`);
        convo.ask(responses.confirm(bot, deleteOptions), [
          responses.yes(bot, 'delete', deleteOptions),
          responses.no(bot),
          responses.default()
        ]);
      });
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
      console.log('ding');
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

      console.log(options);

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

controller.on('rtm_open', bot => console.log('** The RTM api just connected: ' + bot.identity.name));
controller.on('rtm_close', () => console.log('** The RTM api just closed'));
