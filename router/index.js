const fetch = require('node-fetch');

//const {Mattermost_Server_URL, Mattermost_Bot_ID, Mattermost_Bot_Password, Use_Port} = require('../config/config.json');

const memberFilePath = '../config/memberList.json';
const memberFile = require(memberFilePath);
const { apiCall, saveFile, makeAction } = require('../helper');

module.exports = (app) => {
    app.post('/start', (req, res) => {
        const {channel_id} = req.body;

        if ( memberFile.channelList.find((List) => List.channelId === channel_id) === undefined ) {
            apiCall('GET', {}, `channels/${channel_id}/members`)
                .then( data => {
                    const channelUserListById = data.map( user => { return user.user_id;} );
                    apiCall('POST', channelUserListById, 'users/ids')
                        .then( data => {
                            const channelUserList = data.map( user => { return user.username;} );
                            
                            memberFile.channelList.push({
                                'channelId': channel_id,
                                'memberList': [
                                    channelUserList.map( user => {return {"userName": user, "type": "O"}})
                                ],
                                'maxNumberToDraw': channelUserList.length >= 5 ? 5 : channelUserList.length 
                            });
        
                            //TODO file path 깔끔하게 고치기
                            saveFile(__dirname + '/' + memberFilePath, memberFile);
                            res.send({response_type: 'in_channel', text: 'This channel member list is empty. Initialize the member list.'});
                        });
                });
        } else {
            const attachments = [{
                "title": "Draw Bot",
                "text": "Click the button to try the Draw bot.",
                "actions": [
                    makeAction("Draw", '/draw'), 
                    makeAction("Check Member", '/check'), 
                    makeAction("Add Member", '/add'),
                    makeAction("Delete Member", '/delete'),
                    makeAction("Initialize Member", '/init')
                ]
            }];
        
            res.send({ response_type: 'in_channel', attachments });
        }
    });
};