const debug = require('debug')('botkit:user_registration');

module.exports = controller => {
  /* Handle event caused by a user logging in with oauth */
  controller.on('oauth:success', payload => {
    debug('Got a successful login!', payload);
    if (!payload.identity.team_id) {
      debug('Error: received an oauth response without a team id', payload);
    }

    controller.storage.teams.get(payload.identity.team_id, (err, team) => {
      if (err) {
        debug('Error: could not load team from storage system:', payload.identity.team_id, err);
      }

      let new_team = false;
      if (!team) {
        team = {
          id: payload.identity.team_id,
          createdBy: payload.identity.user_id,
          url: payload.identity.url,
          name: payload.identity.team,
        };
        new_team = true;
      }

      team.bot = {
        token: payload.bot.bot_access_token,
        user_id: payload.bot.bot_user_id,
        createdBy: payload.identity.user_id,
        app_token: payload.access_token,
      };

      const testbot = controller.spawn(team.bot);

      testbot.api.auth.test({}, (err, bot_auth) => {
        if (err) {
          debug('Error: could not authenticate bot user', err);
        } else {
          team.bot.name = bot_auth.user;

          // add in info that is expected by Botkit
          testbot.identity = bot_auth;
          testbot.identity.id = bot_auth.user_id;
          testbot.identity.name = bot_auth.user;
          testbot.team_info = team;

          // Replace this with your own database!
          controller.storage.teams.save(team, (err, id) => {
            if (err) {
              debug('Error: could not save team record:', err);
            } else {
              if (new_team) {
                controller.trigger('create_team', [testbot, team]);
              } else {
                controller.trigger('update_team', [testbot, team]);
              }
            }
          });
        }
      });
    });
  });

  controller.on('create_team', (bot, team) => {
    debug('Team created:', team);
    // Trigger an event that will establish an RTM connection for this bot
    controller.trigger('rtm:start', [bot.config]);

    // Trigger an event that will cause this team to receive onboarding messages
    controller.trigger('onboard', [bot, team]);
  });


  controller.on('update_team', (bot, team) => {
    debug('Team updated:', team);

    // Trigger an event that will establish an RTM connection for this bot
    controller.trigger('rtm:start', [bot]);
  });
};
