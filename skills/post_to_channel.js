const whitelist = require('./whitelist');

const getAllChannels = bot => {
  return new Promise((resolve, reject) => {
    bot.api.channels.list({}, (err, channels) => {
      resolve(channels.channels);
    });
  });
};

const generateChannelList = (allChannels, authedChannelIds) => {
  return authedChannelIds.reduce((channelList, authedChannelId) => {
    const { name } = allChannels.find(channel => channel.id === authedChannelId) || {};
    return (name) ? [ ...channelList, { text: `#${name}`, value: name } ] : [ ...channelList ];
  }, []);
};

const authorizeRequestToPost = (allChannels, userAuths) => {
  if (!userAuths) {
    return { authorized: false, message: `Sorry, you are not authorized to post to any channels.` };
  }
  const callback_id = JSON.stringify({ callback_id: 'channel_selection' });
  return {
    authorized: true,
    message: {
      text: 'What channel would you like to post to?',
      response_type: 'in_channel',
      attachments: [{
        callback_id,
        text: 'Choose a channel',
        fallback: ':facepalm:',
        color: 'good',
        attachment_type: 'default',
        actions: [{
          name: 'selected_channel',
          text: 'Pick a channel...',
          type: 'select',
          options: generateChannelList(allChannels, userAuths.channels)
        }]
      }]
    }
  };
};

module.exports = controller => {
  controller.hears([/create post/], 'direct_message', async (bot, message) => {
    const allChannels = await getAllChannels(bot);
    const userAuths = whitelist.find(user => user.id === message.user);
    const { authorized, message: post } = authorizeRequestToPost(allChannels, userAuths);
    bot.reply(message, post);
  });
};
