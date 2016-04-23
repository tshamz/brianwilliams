module.exports = {
  confirm: function() {
    return {
      text: 'Would you like to proceed?',
      attachments: [{
        fallback: '*YES* to confirm',
        text: '*YES* to confirm',
        color: 'good',
        mrkdwn_in: ['fallback', 'text']
      }, {
        fallback: '*NO* to abort',
        text: '*NO* to abort',
        color: 'danger',
        mrkdwn_in: ['fallback', 'text']
      }]
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
          icon_url: 'http://dev.tylershambora.com/images/father-williams.jpg',
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
