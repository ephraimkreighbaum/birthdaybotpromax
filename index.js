const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, EmbedBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { token, clientId, guildId } = require('./config.json');
const fs = require('fs');
const { ReadableStream } = require('web-streams-polyfill');

global.ReadableStream = ReadableStream; // Polyfill ReadableStream

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let birthdays = {};
let birthdayChannel = null;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    loadBirthdays();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'set-birthday') {
        const date = interaction.options.getString('date');
        const showAge = interaction.options.getString('show_age');
        if (!isValidDate(date)) {
            await interaction.reply({ content: 'Invalid date format. Please use mm/dd/yyyy.', ephemeral: true });
            return;
        }
        birthdays[interaction.user.id] = { date, showAge: showAge.toLowerCase() === 'yes' };
        saveBirthdays();
        console.log(`Birthday set for ${interaction.user.tag}: ${date}, Show Age: ${showAge}`);
        await interaction.reply({ content: 'Birthday set!', ephemeral: true });
    } else if (commandName === 'birthdays') {
        const upcomingBirthdays = await getUpcomingBirthdays();
        console.log(`Upcoming birthdays: ${upcomingBirthdays}`);
        const embed = new EmbedBuilder()
            .setTitle('Upcoming Birthdays')
            .setDescription(upcomingBirthdays)
            .setColor(0x00AE86);
        await interaction.reply({ embeds: [embed], ephemeral: false });
    } else if (commandName === 'remove-birthday') {
        if (interaction.user.id in birthdays || interaction.member.permissions.has('ADMINISTRATOR')) {
            delete birthdays[interaction.user.id];
            saveBirthdays();
            console.log(`Birthday removed for ${interaction.user.tag}`);
            await interaction.reply({ content: 'Birthday removed!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'You can only remove your own birthday!', ephemeral: true });
        }
    } else if (commandName === 'set-channel') {
        if (interaction.member.permissions.has('ADMINISTRATOR')) {
            birthdayChannel = interaction.channel.id;
            await interaction.reply({ content: `Birthday channel set to <#${birthdayChannel}>!`, ephemeral: true });
        } else {
            await interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
        }
    } else if (commandName === 'test') {
        if (interaction.member.permissions.has('ADMINISTRATOR')) {
            const channel = client.channels.cache.get(birthdayChannel);
            if (channel) {
                const images = fs.readdirSync('./images');
                const image = images[Math.floor(Math.random() * images.length)];
                channel.send({
                    content: `Happy Birthday <@${interaction.user.id}>!`,
                    files: [`./images/${image}`],
                    embeds: [{ description: `Happy Birthday!`, image: { url: `attachment://${image}` } }]
                });
                await interaction.reply({ content: 'Test birthday message sent!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Birthday channel is not set.', ephemeral: true });
            }
        } else {
            await interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
        }
    }
});

function isValidDate(dateString) {
    const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    return regex.test(dateString);
}

async function getUpcomingBirthdays() {
    const today = new Date();
    const upcoming = await Promise.all(Object.entries(birthdays)
        .map(async ([id, { date, showAge }]) => {
            const [month, day, year] = date.split('/');
            const birthday = new Date(today.getFullYear(), month - 1, day);
            if (birthday < today) {
                birthday.setFullYear(today.getFullYear() + 1);
            }
            const age = today.getFullYear() - year;
            const user = await client.users.fetch(id);
            return { username: user.username, date: birthday, showAge, age };
        })
    );

    return upcoming
        .sort((a, b) => a.date - b.date)
        .slice(0, 10)
        .map(({ username, date, showAge, age }) => {
            const dateString = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            return showAge ? `${username}: ${dateString} (Age: ${age})` : `${username}: ${dateString}`;
        })
        .join('\n') || 'No upcoming birthdays!';
}

function saveBirthdays() {
    fs.writeFileSync('birthdays.json', JSON.stringify(birthdays));
}

function loadBirthdays() {
    if (fs.existsSync('birthdays.json')) {
        birthdays = JSON.parse(fs.readFileSync('birthdays.json'));
    }
}

client.login(token);

// Register slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('set-birthday')
        .setDescription('Set your birthday')
        .addStringOption(option => option.setName('date').setDescription('Your birthday (mm/dd/yyyy)').setRequired(true))
        .addStringOption(option => option.setName('show_age').setDescription('Show your age? (yes/no)').setRequired(true)),
    new SlashCommandBuilder()
        .setName('birthdays')
        .setDescription('Show the closest ten upcoming birthdays'),
    new SlashCommandBuilder()
        .setName('remove-birthday')
        .setDescription('Remove your birthday'),
    new SlashCommandBuilder()
        .setName('set-channel')
        .setDescription('Set the channel for birthday pings'),
    new SlashCommandBuilder()
        .setName('test')
        .setDescription('Test the birthday ping (admin only)')
].map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

// Birthday ping logic with debugging
setInterval(() => {
    const now = new Date();
    console.log(`Checking birthdays at ${now.toISOString()}`);
    if (now.getUTCHours() === 11 && now.getUTCMinutes() === 0) { // 6am USC time is 11am UTC
        const today = now.toISOString().slice(0, 10);
        console.log(`Today's date: ${today}`);
        for (const [id, { date }] of Object.entries(birthdays)) {
            console.log(`Checking birthday for user ${id}: ${date}`);
            if (date === today && birthdayChannel) {
                const channel = client.channels.cache.get(birthdayChannel);
                if (channel) {
                    const images = fs.readdirSync('./images');
                    const image = images[Math.floor(Math.random() * images.length)];
                    channel.send({
                        content: `Happy Birthday <@${id}>!`,
                        files: [`./images/${image}`],
                        embeds: [{ description: `Happy Birthday!`, image: { url: `attachment://${image}` } }]
                    });
                    console.log(`Sent birthday message to user ${id}`);
                } else {
                    console.log('Birthday channel not found');
                }
            }
        }
    }
}, 60000);
