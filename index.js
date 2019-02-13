const express = require('express');
const app = express();

const bodyparser = require('body-parser');
let configFile = require('./config/config.json');

async function Init() {
    if (configFile.Mattermost_Server_URL === '') {
        const configure = require('./configure.js');
        await configure.confiugre(Run);
    } else 
        Run().catch(error => {
            console.log(error);
        });
}

async function Run() {
    app.use(bodyparser.urlencoded({'extended':'true'}));
    app.use(bodyparser.json());

    require('./router')(app);
    app.listen(configFile.Use_Port, () => console.log('app listening on port ' + configFile.Use_Port));
}

Init().catch(error => {
    console.log(error);
});
