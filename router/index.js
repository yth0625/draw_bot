const fetch = require('node-fetch');

const memberFilePath = '../config/memberList.json';
const memberFile = require(memberFilePath);
const { apiCall, saveFile, makeAction } = require('../helper');

const defaultActions = [
    makeAction("Draw", 'draw'), 
    makeAction("Check Member", 'check'), 
    makeAction("Add Member", 'add'),
    makeAction("Delete Member", 'delete'),
    makeAction("Initialize Member", 'init'),
    makeAction("Maximum number of people Setting", 'maximum')
];

function initialize(channel_id, text, res) {
    apiCall('GET', {}, `channels/${channel_id}/members`)
                .then( data => {
                    if ( data.id === "api.context.permissions.app_error" ) throw data.message;
                    const channelUserListById = data.map( user => { return user.user_id;} );
                    apiCall('POST', channelUserListById, 'users/ids')
                        .then( data => {
                            const channelUserList = new Array();
                            data.map( user => {
                                if ( !user.delete_at ) channelUserList.push({userName: user.username, type: "O"});
                            });
                            
                            const deleteIndex = memberFile.channelList.findIndex( channel => channel.channelId === channel_id);
                            if (deleteIndex > -1) memberFile.channelList.splice(deleteIndex, 1);

                            memberFile.channelList.push({
                                'channelId': channel_id,
                                'memberList': channelUserList,
                                'maxNumberToDraw': channelUserList.length > 5 ? 5 : channelUserList.length - 1
                            });

                            //TODO file path 깔끔하게 고치기
                            saveFile(__dirname + '/' + memberFilePath, memberFile);
                            text instanceof Array ?
                             res.send({ update: { props: { attachments: text } } }) :
                             res.send({response_type: 'in_channel', text: text});
                        });
                }).catch(error => {
                    res.send({response_type: 'in_channel', text: error})
                });
}

module.exports = (app) => {
    app.post('/start', (req, res) => {
        const {channel_id} = req.body;

        if ( memberFile.channelList.find((List) => List.channelId === channel_id) === undefined ) {
            initialize(channel_id, 'This channel member list is empty. Initialize the member list.', res);
        } else {
            const attachments = [{
                "title": "Draw Bot",
                "text": "Click the button to try the Draw bot.",
                "actions": defaultActions
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
                        const randomNumber = ~~(Math.random() * List.memberList.length);

                        if ( List.memberList[randomNumber].type === "O" &&
                            outputMemberList.find( member => member.userName === List.memberList[randomNumber].userName) === undefined) {
                            outputMemberList.push(List.memberList[randomNumber]);
                        }

                    } while (outputMemberList.length < number);

                    const attachments = [{
                        "title": "Draw Bot",
                        "text": "Congratulations!!!" + outputMemberList.map((member) => {return ' @'+member.userName})
                    }];
    
                    res.send({ update: { props: { attachments } } });
                }
            });
        } catch (error) {
            memberFile.channelList.map( channel => {
                if ( channel.channelId === channel_id ) {
                    const actions = new Array();

                    for (let index = 1; index <= channel.maxNumberToDraw; index++) { 
                        actions.push(makeAction(index + ' member', 'draw', {number: index}));
                    }

                    const attachments = actions.length === 0 ?
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
            "fields": [],
            "actions": defaultActions
        }];

        member.length >= 1 ? attachments[0].fields.push(
            {
                "short": false,
                "title": "Member",
                "value": member.map(member => ' ' + member.userName).join()
            }) : null;

        excludedMember.length >= 1 ? attachments[0].fields.push({
            "short": false,
            "title": "Excluded Member",
            "value": excludedMember.map(member => ' ' + member.userName).join()
        }) : null;

        res.send({ update: { props: { attachments } } });
    });

    app.post('/add', (req, res) => {
        const {channel_id} = req.body;

        try {   
            const {userName} = req.body.context;
            if ( userName === undefined) throw 'Body no have userName';

            memberFile.channelList = memberFile.channelList.map( channel => {
                if ( channel.channelId === channel_id ) {
                    channel.memberList.map( member => {
                        if ( member.userName === userName ) {
                            member.type = "O";
                        }
                        return member;
                    });
                }
                return channel;
            });

            const attachments = [{
                "title": "Draw Bot",
                "text": "**Members added successfully!**",
                "actions": defaultActions
            }];

            saveFile(__dirname + '/' + memberFilePath, memberFile);
            res.send({ update: { props: { attachments } } });

        } catch (error) {
            const memberList = (memberFile.channelList.find((List) => List.channelId === channel_id)).memberList;

            const excludedMember = memberList.filter(member => member.type === 'X');

            let actions = new Array();
            for (let index = 0; index < excludedMember.length; index++) { 
                actions.push(makeAction(excludedMember[index].userName, 'add', {userName: excludedMember[index].userName}));
            }

            const attachments = actions.length === 0 ?
            [{
                "title": "Draow Bot",
                "text": "**No more members to add.**",
                "actions": defaultActions
            }] :
            [{
                "title": "Draow Bot",
                "text": "Who do you want to add?",
                "actions": actions
            }];

            res.send({ update: { props: { attachments } } });
        }
    });


    app.post('/delete', (req, res) => {
        const {channel_id} = req.body;

        try {   
            const {userName} = req.body.context;
            if ( userName === undefined) throw 'Body no have userName';

            const attachments = [{
                "title": "Draw Bot",
                "text": "**Members deleted successfully!**",
                "actions": defaultActions
            }];

            memberFile.channelList = memberFile.channelList.map( channel => {
                if ( channel.channelId === channel_id ) {

                    const memberList = channel.memberList.filter(member => member.type === 'O');

                    if ( channel.maxNumberToDraw === 1 ) {
                        attachments[0].text = "**There are only 2 members and can't be deleted any more.**"
                        return channel;
                    } else if ( channel.maxNumberToDraw === memberList.length - 1 )
                        channel.maxNumberToDraw = memberList.length - 2;
                        
                    channel.memberList.map( member => {
                        if ( member.userName === userName ) {
                            member.type = "X";
                        }
                        return member;
                    });
                }
                return channel;
            });

            saveFile(__dirname + '/' + memberFilePath, memberFile);
            res.send({ update: { props: { attachments } } });

        } catch (error) {
            const memberList = (memberFile.channelList.find((List) => List.channelId === channel_id)).memberList;

            const member = memberList.filter(member => member.type === 'O');

            let actions = new Array();
            for (let index = 0; index < member.length; index++) { 
                actions.push(makeAction(member[index].userName, 'delete', {userName: member[index].userName}));
            }

            const attachments = actions.length === 0 ?
            [{
                "title": "Draow Bot",
                "text": "No more members to delete.",
                "actions": defaultActions
            }] :
            [{
                "title": "Draow Bot",
                "text": "Who do you want to delete?",
                "actions": actions
            }];

            res.send({ update: { props: { attachments } } });
        }
    });

    app.post('/init', (req, res) => {
        const {channel_id} = req.body;
        initialize(channel_id, [{
            "title": "Draw Bot",
            "text": "Initialze member list!"
        }], res);
    });

    app.post('/maximum', (req, res) => {
        const {channel_id} = req.body;

        try {   
            const {number} = req.body.context;
            if ( number === undefined) throw 'Body no have number';

            memberFile.channelList = memberFile.channelList.map( channel => {
                if ( channel.channelId === channel_id ) {
                    channel.maxNumberToDraw = number;
                }
                return channel;
            });

            const attachments = [{
                "title": "Draw Bot",
                "text": "**maximum setting successfully!**",
                "actions": defaultActions
            }];

            saveFile(__dirname + '/' + memberFilePath, memberFile);
            res.send({ update: { props: { attachments } } });

        } catch (error) {
            const maximumCount = memberFile.channelList.find( channel => channel.channelId === channel_id )
                .memberList.filter( member => member.type === "O").length;

            let actions = new Array();
            for (let index = 1; index < maximumCount; index++) {
                actions.push(makeAction(index + ' member', 'maximum', {number: index}));
            }

            const attachments = [{
                "title": "Draow Bot",
                "text": "How maximum people would you like to set?",
                "actions": actions
            }];

            res.send({ update: { props: { attachments } } });
        }
    });
};
