const express = require('express');
const app = express();

const bodyparser = require('body-parser');
let configFile = require('./config/config.json');

if (configFile.Mattermost_Server_URL === '') {
    console.log('You sholud run configure.js before start bot.');
    process.exit(1);
}

app.use(bodyparser.urlencoded({'extended':'true'}));
app.use(bodyparser.json());

require('./router')(app);
app.listen(configFile.Use_Port, () => console.log('app listening on port ' + configFile.Use_Port));