const fetch = require('node-fetch');
const fs = require('fs');

const {Mattermost_Server_URL, Mattermost_Bot_ID, Mattermost_Bot_Password} = require('./config/config.json');

module.exports = (app) => {
    console.log(Mattermost_Server_URL);
    app.post('/draw', (req, res) => {
        const {channel_id} = req.body;

    
    })
};