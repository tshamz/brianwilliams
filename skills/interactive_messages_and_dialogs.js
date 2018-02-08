const dialogHandlers = {
  generate_post_contents: (bot, message) => {
    const now = new Date();
    const theDate = now.toDateString();
    const { targetChannel, submission: { title, text } } = message;
    const callback_id = JSON.stringify({ theDate, targetChannel, callback_id: 'submit_post' });
    bot.dialogOk();
    bot.replyInteractive({ team, user, response_url } = message, {
      username: `Brian Williams: Dev Team News Anchor`,
      icon_url: `http://dev.tylershambora.com/images/father-williams.jpg`,
      text: `I'm about to post the following to *#${ targetChannel }* channel:\n\n<!channel>\n\n *Updates for ${ theDate }:*`,
      attachments: [{
        title,
        text,
        fallback: text,
        color: 'danger',
        mrkdwn_in: ['fallback', 'text', 'title']
      }, {
        callback_id,
        text: '*Ok to post?*',
        fallback: ':facepalm:',
        color: 'good',
        attachment_type: 'default',
        actions: [{
          name: 'decision',
          text: ':thumbsup::skin-tone-2:',
          type: 'button',
          value: 'yes'
        }, {
          name: 'decision',
          text: ':thumbsdown::skin-tone-2:',
          type: 'button',
          value: 'no'
        }]
      }]
    });
  }
};

const interactiveMessageHandlers = {
  submit_post: (bot, message) => {
    const { theDate, targetChannel } = message;
    const submitPost = message.actions[0].value;
    bot.replyInteractive(message, {
      text: (submitPost === 'yes') ? 'Great! Moving forward...' : 'Perhaps later.',
      replace_original: true
    });
    if (submitPost === 'yes') {
      bot.say({
        channel: `#${targetChannel}`,
        username: 'Brian Williams: Dev Team News Anchor',
        icon_url: 'http://dev.tylershambora.com/images/father-williams.jpg',
        text: `<!channel>\n\n*Updates for ${ theDate } :*`,
        attachments: [ message.original_message.attachments[0] ]
      });
    }
  },
  channel_selection: (bot, message) => {
    const { response_url } = message;
    const targetChannel = message.actions[0].selected_options[0].value;
    const callback_id = JSON.stringify({ response_url, targetChannel, callback_id: 'generate_post_contents' });
    const dialog = bot.createDialog()
      .title('Create Post')
      .callback_id(callback_id)
      .submit_label('Submit')
      .addText('Post Title', 'title', { placeholder: 'My Awesome Post Title!' })
      .addTextarea('Post Body', 'text', { placeholder: 'This is possibly one of the greatest posts of all time.' });
    bot.replyWithDialog(message, dialog.asObject());
  }
};

module.exports = controller => {
  controller.middleware.receive.use((bot, message, next) => {
    if (message.type == 'interactive_message_callback') {
      const dataStore = JSON.parse(message.callback_id);
      const { callback_id } = dataStore;
      interactiveMessageHandlers[callback_id](bot, { ...message, ...dataStore });
    }
    next();
  });

  controller.on('dialog_submission', (bot, message) => {
    const dataStore = JSON.parse(message.callback_id);
    const { callback_id } = dataStore;
    dialogHandlers[callback_id](bot, { ...message, ...dataStore });
  });
};
