# Mattermost Draw bot
Randomly draws of the channel members.

# Requirements
Server which installed node

# How To Use
1. Setting Integration your [Mattermost Server](https://docs.mattermost.com/developer/slash-commands.html)
2. Make bot [personal access token](https://docs.mattermost.com/developer/personal-access-tokens.html)(This bot account should have `read_channel` permission for the channel. ).
3. Run index.js file. (It is recommended to use the [forever](https://www.npmjs.com/package/forever) module.)

If you change configure run configure.js or change config.json file.