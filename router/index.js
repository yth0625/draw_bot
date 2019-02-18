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
                    const channelUserList = data.map( user => { return user.user_id;} );
                    memberFile.channelList.push({
                        'channelId': channel_id,
                        'memberList': [
                            ...channelUserList
                        ],
                        'maxNumberToDraw': channelUserList.length >= 5 ? 5 : channelUserList.length 
                    });

                    //TODO file path 깔끔하게 고치기
                    saveFile(__dirname + '/' + memberFilePath, memberFile);
                    res.send({response_type: 'in_channel', text: '멤버 리스트가 비어있습니다. 멤버리스트를 초기화 합니다.'});
                });
        } else {
            const attachments = [{
                "title": "Draw Bot",
                "text": "draw bot 입니다. 아래 버튼을 이용하여 사람을 뽑아줍니다.",
                "actions": [
                    makeAction("뽑기", '/draw'), 
                    makeAction("멤버 확인", '/check'), 
                    makeAction("멤버 추가", '/add'),
                    makeAction("멤버 삭제", '/delete'),
                    makeAction("멤버 초기화", '/init')
                ]
            }];
        
            res.send({ response_type: 'in_channel', attachments });
        }
    });

    app.post('/draw', (req, res) => {
        const {channel_id} = req.body;

        try {
            const number = req.body.content.number === undefined ? 0 : req.body.content.number;
        } catch {
            memberFile.channelList.map( channel => {
                if ( channel.channelId === channel_id ) {
                    let action = new Array();

                    for(let a = 1; a <= channel.maxNumberToDraw; a++) { 
                        action.push(makeAction(a + '명', '/draw', {number: a}));
                    }

                    const attachments = [{
                        "title": "Draow Bot",
                        "text": "몇 명을 뽑겠습니까 ?",
                        "action": [
                            action
                        ]
                    }];
                    
                    res.send({ update: { props: { attachments } } });
                } 
            })
        }
    });
};