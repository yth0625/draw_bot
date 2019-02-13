const readline = require('readline');
const fs = require('fs');
const filePath = './config/config.json';
let configFile = require(filePath);

module.exports = {
    async confiugre(Run) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('What your Mattermost Server Url? ', (answer) => {
            configFile.Mattermost_Server_URL = answer;
            fs.writeFile(filePath, JSON.stringify(configFile, null, '\t'), (err) => {
                if (err) {
                    console.log(err);
                    process.exit(1);
                }
            });

            rl.question('Please enter the port to which you want to run this bot (default 8325, Port should be >= 0 and < 65536) ', (answer) => {
                answer === '' ? configFile.Use_Port = "8325" : configFile.Use_Port = answer;
                fs.writeFile(filePath, JSON.stringify(configFile, null, '\t'), (err) => {
                    if (err) {
                        console.log(err);
                        process.exit(1);
                    }
                    rl.close();
                    Run();
                });
            });
        });
    }
}

