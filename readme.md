# Birthday Bot Pro Max

A no BS birthday bot with basic features.

## Installation

Download the latest [release](https://github.com/ephraimkreighbaum/birthdaybotpromax/releases).
Unzip it and install [node.js](https://nodejs.org/en).

If you're on Windows, just download and run the installer. If you're on Linux using a server like me, I recommend using [nvm (node version manager)](https://github.com/nvm-sh/nvm). Make sure you install version 18 or newer. If using nvm, use the `nvm install 18` command to install and the `nvm use 18` command to use the correct version. I'm not going to run you through node.js, there are lots of tutorials out there just do a quick google.

I'm using Linux. More specifically Oracle Linux.

Unless you're keeping the window open 24/7, you'll need a process manager like [pm2](https://www.npmjs.com/package/pm2). 

Install using npm.
```
npm install pm2 -g
```

Clone the repo.
```
git clone https://github.com/ephraimkreighbaum/birthdaybotpromax.git
```

Use the package manager [npm](https://www.npmjs.com/) to install the dependencies (included with node.js).

```bash
npm install
```
Access the config file.
```
nano config.json
```

You should have made a bot on Discord and given it the basic gateway permissions (again quick google if you don't know how to do this). Invite it to the server you want it in and give it admin. You can tediously decide which permissions you want but realistically you are running the bot admin is fine. Copy the client id from the Oauth2 tab on the dev portal of your app and paste it in the field between the double quotes. Do the same with Bot token (Bot tab on dev portal) and Guild ID (enable discord developer mode and copy the server id from the server you want the bot to be in)

To save, hit `Ctrl + X` than `y` than hit enter. 

```
npm run start
```


## Usage
Command list:
- `/set-channel` run this command everytime you start up the bot. Follow it with the birthday channel ID. Only admins can run this command.
- `/set-birthday` mm/dd/yyyy format. To display your age put Yes or No in the prompt. Programmed to ping a person at 11am UTC on their birthday.
- `/remove-birthday` pretty self explanatory.
- `/birthdays` displays the next 10 upcoming birthdays.
- `/test` lil command I made when testing to see if it was working :P left it in. Only admins can use this command.

## Extra Information
- Birthdays are stored in the `birthdays.json` file. 
- Displays one of the random birthday images in the images folder. Just random photos I found on Google.
- Pings a person on their birthday at 11am UTC in the specified channel.

To contact me join [my Discord server](discord.com/invite/5UYmmFXpfW) and ping me. You can request features there.

## License

[MIT](https://choosealicense.com/licenses/mit/)