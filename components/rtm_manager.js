const debug = require('debug')('botkit:rtm_manager');

module.exports = controller => {
  const managed_bots = {};

  // Capture the rtm:start event and actually start the RTM...
  controller.on('rtm:start', config => {
    const bot = controller.spawn(config);
    manager.start(bot);
  });

  controller.on('rtm_close', bot => {
    manager.remove(bot);
  });

  // The manager object exposes some useful tools for managing the RTM
  const manager = {
    start: bot => {
      if (managed_bots[bot.config.token]) {
        debug('Start RTM: already online');
      } else {
        bot.startRTM((err, bot) => {
          if (err) {
            debug('Error starting RTM:', err);
          } else {
            managed_bots[bot.config.token] = bot.rtm;
            debug('Start RTM: Success');
          }
        });
      }
    },
    stop: bot => {
      if (managed_bots[bot.config.token]) {
        if (managed_bots[bot.config.token].rtm) {
          debug('Stop RTM: Stopping bot');
          managed_bots[bot.config.token].closeRTM()
        }
      }
    },
    remove: bot => {
      debug('Removing bot from manager');
      delete managed_bots[bot.config.token];
    },
    reconnect: () => {
      debug('Reconnecting all existing bots...');
      controller.storage.teams.all((err, list) => {

        if (err) {
          throw new Error('Error: Could not load existing bots:', err);
        } else {
          for (const l = 0; l < list.length; l++) {
            manager.start(controller.spawn(list[l].bot));
          }
        }
      });
    }
  }

  return manager;
};
