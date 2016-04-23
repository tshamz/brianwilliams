module.exports = {
  preview: function(bot, channelName, parsedMessages) {
    var titles = parsedMessages.map(function(message) {
      return message.title;
    }).join(' + ');
    return {
      username: 'Brian Williams: Dev Team News Anchor',
      icon_url: bot.identity.profile_pic,
      text: '*I\'m about to post the following:*',
      attachments: parsedMessages.push({
        fallback: '*YES* to confirm',
        text: '*YES* to confirm',
        color: 'good',
        mrkdwn_in: ['fallback', 'text']
      }, {
        fallback: '*NO* to abort',
        text: '*NO* to abort',
        color: 'danger',
        mrkdwn_in: ['fallback', 'text']
      })
    };
  },
  yes: function(bot, channelName, parsedMessages, date) {
    return {
      pattern: bot.utterances.yes,
      callback: function(response, convo) {
        convo.say('Great! Moving forward...');
        bot.say({
          channel: '#' + channelName,
          username: 'Brian Williams: Dev Team News Anchor',
          icon_url: bot.identity.profile_pic,
          text: '<!channel>\n\n*Updates for ' + date + ':*',
          attachments: parsedMessages
        });
        convo.next();
      }
    };
  },
  no: function(bot) {
    return {
      pattern: bot.utterances.no,
      callback: function(response, convo) {
        convo.say('Perhaps later.');
        convo.next();
      }
    };
  },
  default: function() {
    return {
      default: true,
      callback: function(response, convo) {
        convo.repeat();
        convo.next();
      }
    };
  }
};
