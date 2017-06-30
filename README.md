# brianwilliams.js

<p align="center">
  <img width="100%" src="http://media3.s-nbcnews.com/i/newscms/2014_16/323536/140414-nn-bwnashville-1_2179035f104bd51be370fbe3c403ce6f.jpg" />
</p>

>brianwilliams is a slackbot who turns Slack channels of your designation into read only channels. This bot is great for things posting team updates to a channel, while ensuring that the posts don't get drowned out by ambient channel noise.

## Getting Started

### Installing

1. Create a new Heroku app
2. Create Slack app
3. Get Slack bot token, as well as Slack admin/god token
4. Clone this repo
5. Push the code up to your Heroku app
6. Add the following config vars to your heroku app

```
BOT_TOKEN
CLIENT_ID
CLIENT_SECRET
MEGA_TOKEN
READ_ONLY_CHANNELS
WHITELIST_USERS
```

where:
- `BOT_TOKEN` is the bot's token from your Slack app
- `CLIENT_ID` is the client id from your Slack app
- `CLIENT_SECRET` is the client secret from your Slack app
- `MEGA_TOKEN` is the admin/god token of an admin user in Slack
- `READ_ONLY_CHANNELS` are the channel ids of channels you want the bot to keep as read-only (separated by commas)
- `WHITELIST_USERS` is the downcased first and last name ("first last", no quotes) of users that can post through the bot to the read only channels (separated by commas)

Once you've finished all the prior steps and deployed your bot to your Heroku server, visit http://[YOUR HEROKU APP URL].com/login to authenticate your bot. Once you've completed the authentication process, the bot should be a part of your team. Add people to your whitelist who are allowed to talk to the bot and channels that you'd like to make read only.

## Example Message

While the channels are read-only and all messages are immediately deleted, the bot is allowed to post to the channel and he won't delete his own posts. This is useful if you want to make a designated announcements channel that the bot can post to but everyone else's messages are deleted as to not distract from the announcements the bot posts. In order to post to a read-only channel via. the bot, send him a message with this format:

```
post to [channel name]
[post title]
___
[post message]
```

for example:

```
post to dev-updates
test/ directories comin’ atcha1
___
yo, be on the lookout for a `test/` directory starting to make it’s way into your project roots. Don’t be alarmed, it’s supposed to be there, just don’t touch or delete it or else I’ll be rly rly mad. Also, it should be ignored by git, so if you see it making its way into your commits, *DON’T COMMIT IT*. In the very near future you’ll be getting more info on wha this directory is and what it does. Stay turned for more details.
```

You can use message formatting in the post message, and if you want create a post with two separate title/message combos, separate them with three line breaks like so:

```
post to dev-updates
Message Title One
___
Message body one


Message Title Two
___
Message body two
```

## Built With

* [Botkit](https://github.com/howdyai/botkit)
* [slack api](https://api.slack.com/)

## Authors

* **Tyler Shambora** - [tshamz](https://github.com/tshamz)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
