const config = require('../config/config.json');
const fetch = require('node-fetch');
const fs = require('fs');

exports.apiCall = function (method, body, url) {
    let options = {
        method: method,
        headers: {
            'Authorization' : `Bearer ${config.Mattermost_Bot_Personal_Token}`, 
            'Content-Type': 'application/json'
        }
    }

    method === 'GET' ? null : options.body = JSON.stringify(body);
    
    return fetch(`${config.Mattermost_Server_URL}/api/v4/${url}`, options)
        .then(res => res.json())
        .then(json => {return json;});
}

exports.saveFile = function (storagePath, targetPath) {
    fs.writeFile(storagePath, JSON.stringify(targetPath, null, '\t'), (err) => {
        if (err) {
            console.log(err);
            process.exit(1);
        }
    });
}

exports.makeAction = function (name, path) {
    return {
        name: name,
        integration: {
            url: `127.0.0.1:${config.Use_Port}/${path}`
        }
    };
}