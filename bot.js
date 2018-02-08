/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 ┌┐ ┬─┐┬┌─┐┌┐┌  ┬ ┬┬┬  ┬  ┬┌─┐┌┬┐┌─┐
 ├┴┐├┬┘│├─┤│││  │││││  │  │├─┤│││└─┐
 └─┘┴└─┴┴ ┴┘└┘  └┴┘┴┴─┘┴─┘┴┴ ┴┴ ┴└─┘
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

const env = require('node-env-file');
env(__dirname + '/.env');

const Botkit = require('botkit');
const debug = require('debug')('botkit:main');

const bot_options = {
  interactive_replies: true,
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  debug: false,
  scopes: ['bot']
};

bot_options.json_file_store = __dirname + '/.data/db/'; // store user data in a simple JSON format

// Create the Botkit controller, which controls all instances of the bot.
const controller = Botkit.slackbot(bot_options);

controller.startTicking();

// Set up an Express-powered webserver to expose oauth and webhook endpoints
const webserver = require(__dirname + '/components/express_webserver.js')(controller);

webserver.get('/', (req, res) => {
  res.render('index', {
    domain: req.get('host'),
    protocol: req.protocol,
    layout: 'layouts/default'
  });
});

// Set up a simple storage backend for keeping a record of customers
// who sign up for the app via the oauth
require(__dirname + '/components/user_registration.js')(controller);

// Send an onboarding message when a new team joins
require(__dirname + '/components/onboarding.js')(controller);

require("./skills/post_to_channel.js")(controller);
require("./skills/interactive_messages_and_dialogs.js")(controller);
