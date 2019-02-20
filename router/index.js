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
                                'memberList': 
                                    channelUserList.map( user => {return {"userName": user, "type": "O"}})
                                ,
                                'maxNumberToDraw': channelUserList.length > 5 ? 5 : channelUserList.length - 1
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
                    makeAction("Draw", 'draw'), 
                    makeAction("Check Member", 'check'), 
                    makeAction("Add Member", 'add'),
                    makeAction("Delete Member", 'delete'),
                    makeAction("Initialize Member", 'init')
                ]
            }];
            res.send({ response_type: 'in_channel', attachments });
        }
    });

    app.post('/draw', (req, res) => {
        const {channel_id} = req.body;

        try {   
            const {number} = req.body.context;
            if ( number === undefined) throw 'Body no have number';
            memberFile.channelList.map(List => {
                if (List.channelId === channel_id) {
                    let outputMemberList = new Array();
                    do {
                        const randomNumber = ~~(Math.random() * List.memberList.length -1);

                        if ( List.memberList[randomNumber].type === "O" &&
                            outputMemberList.find( member => member.userName === List.memberList[randomNumber].userName) === undefined) {
                            outputMemberList.push(List.memberList[randomNumber]);
                        }

                    } while (outputMemberList.length < number);

                    const attachments = [{
                        "title": "Draow Bot",
                        "text": "Congratulations!!!" + outputMemberList.map((member) => {return ' @'+member.userName})
                    }];
    
                    res.send({ update: { props: { attachments } } });
                }
            });
        } catch (error) {
            memberFile.channelList.map( channel => {
                if ( channel.channelId === channel_id ) {
                    let actions = new Array();

                    for (let a = 1; a <= channel.maxNumberToDraw; a++) { 
                        actions.push(makeAction(a + ' member', 'draw', {number: a}));
                    }

                    const attachments = actions.length === 1 ?
                    [{
                        "title": "Draow Bot",
                        "text": "You add member this channel! If the number of member on the channel is the same as the number of member to draw, it will not run.",
                    }] :
                    [{
                        "title": "Draow Bot",
                        "text": "How many will you Draw?",
                        "actions": actions
                    }];
                    
                    res.send({ update: { props: { attachments } } });
                } 
            });
        }
    });

    app.post('/check', (req, res) => {
        const {channel_id} = req.body;

        const memberList = (memberFile.channelList.find((List) => List.channelId === channel_id)).memberList;

        const member = memberList.filter(member => member.type === 'O');
        const excludedMember = memberList.filter(member => member.type === 'X');
        const attachments = [{
            "title": "Draow Bot",
            "text": "Checking current channel member list",
            "fields": []
        }];

        member.length > 1 ? attachments[0].fields.push(
            {
                "short": false,
                "title": "Member",
                "value": member.map(member => ' ' + member.userName).join()
            }) : null;

        excludedMember.length > 1 ? attachments[0].fields.push({
            "short": false,
            "title": "Excluded Member",
            "value": excludedMember.map(member => ' ' + member.userName).join()
        }) : null;

        res.send({ update: { props: { attachments } } });
    });
};