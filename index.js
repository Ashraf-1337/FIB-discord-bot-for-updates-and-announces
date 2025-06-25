require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

// Konfiguration
const config = {
  token: process.env.DISCORD_TOKEN, // // Hier deinen Bot-Token in die .env eintragen
  channels: {
    xy: '1168140162132357130', // // Hier deine Channel-ID für Team-Updates eintragen
    log: '1371503837629780088' // // Hier deine Channel-ID für das Log eintragen (optional)
  },
  roles: {
    basis: [
      '1065946541573034006', // // Hier die rollen eintragen die man immer bekommen soll (Mitarbeiter usw)
      '1383162135202234428',
      '1089262739999957012',
      '1269802674002329600'
    ],
    ränge: {
      1: '1280624207335657573', // // Hier die Rollen-IDs für Rang 1-11 eintragen
      2: '1280624212033409054',
      3: '1280624210229592135',
      4: '1280624510793547891',
      5: '1280624509619277966',
      6: '1280624510151950399',
      7: '1280624509053042740',
      8: '1280634894157877279',
      9: '1280624209982390374',
      10: '1280624511502258289',
      11: '1280624206559580180',
      12: '1280624210670256252',
      13: '1280633958190678068',
      14: '1280624209042735165',
      15: '1280625432294854792',
      16: '1280625417082114080',
      17: '1280625415937065003',
      18: '1280625416616280128',
      19: '1280625724876787857',
      20: '1280625724239384607'
    },
    extra: {
      '1-2': '1372985756154331185', // // Hier die Extra-Rollen-IDs eintragen (bei uns ist das low mid und High command, kann auch entfernt werden)
      '3-6': '1372985756167049291',
      '7-8': '1372985756167049294'
    },
    entlassen: '1372985756137558027', // // Hier die Entlassen-Rolle-ID eintragen (Bürdger)
    allowed: [
      '1089109997717295155', // // Hier die Rollen-IDs, die Befehle ausführen dürfen
      '1089111113041444954',
      '1089111522757845093',
      '1089111387814502411',
      '1067608674727645304',
      '1089268525643878550',
      '1089268177340465202',
      '1089267652029067405',
      '1067416009889300551',  
    ]
  },
  UPDATE_INTERVAL: 60000,
  DATA_FILE: path.join(__dirname, 'leaderboard_data.json')
};

class LeaderboardData {
  constructor() {
    this.data = new Map();
    this.load();
    this.setupBackup();
  }

  load() {
    try {
      if (fs.existsSync(config.DATA_FILE)) {
        const rawData = fs.readFileSync(config.DATA_FILE, 'utf8');
        this.data = new Map(JSON.parse(rawData));
        console.log(`📊 Daten geladen: ${this.data.size} Einträge`);
      }
    } catch (error) {
      console.error('❌ Ladefehler:', error);
    }
  }

  save() {
    try {
      fs.writeFileSync(config.DATA_FILE, JSON.stringify([...this.data], null, 2));
    } catch (error) {
      console.error('❌ Speicherfehler:', error);
    }
  }

  setupBackup() {
    setInterval(() => this.save(), 300000);
  }

  increment(userId) {
    this.data.set(userId, (this.data.get(userId) || 0) + 1);
    this.save();
  }

  getTop(limit = 10) {
    return [...this.data.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }
}

const leaderboardData = new LeaderboardData();

// Embed Designs
function createEinstellungsEmbed(member, executor, rang) {
  return new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle('✨ **WILLKOMMEN IM FIB** ✨')
    .addFields(
      { name: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬', value: '\u200B' },
      { name: '**👤 NEUES MITGLIED**', value: `> ${member}\n\u200B` },
      { name: '**🎖️ RANG**', value: `> <@&${config.roles.ränge[rang]}>\n\u200B` },
      { name: '**📅 EINTRITTSDATUM**', value: `> ${new Date().toLocaleDateString('de-DE')}\n\u200B` },
      { name: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬', value: '\u200B' },
      { name: '**📌 EINGESTELLT DURCH**', value: `> ${executor}\n\u200B` }
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({
      text: `Team Update • ${new Date().toLocaleDateString('de-DE')}`,
      iconURL: executor.user.displayAvatarURL()
    });
}

function createEntlassungsEmbed(member, executor, grund) {
  return new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle('🚫 **MITGLIED ENTLASSEN** 🚫')
    .addFields(
      { name: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬', value: '\u200B' },
      { name: '**👤 MITGLIED**', value: `> ${member}\n\u200B` },
      { name: '**📅 ENTLASSUNGSDATUM**', value: `> ${new Date().toLocaleDateString('de-DE')}\n\u200B` },
      { name: '**📝 GRUND**', value: `> ${grund}\n\u200B` },
      { name: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬', value: '\u200B' },
      { name: '**📌 ENTLASSEN DURCH**', value: `> ${executor}\n\u200B` }
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({
      text: `Team Update • ${new Date().toLocaleDateString('de-DE')}`,
      iconURL: executor.user.displayAvatarURL()
    });
}

function createUprankEmbed(member, executor, alterRang, neuerRang, grund) {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('⬆️ **BEFÖRDERUNG** ⬆️')
    .addFields(
      { name: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬', value: '\u200B' },
      { name: '**👤 MITGLIED**', value: `> ${member}\n\u200B` },
      { name: '**🎖️ ALTER RANG**', value: `> <@&${config.roles.ränge[alterRang]}>\n\u200B` },
      { name: '**🎖️ NEUER RANG**', value: `> <@&${config.roles.ränge[neuerRang]}>\n\u200B` },
      { name: '**📅 DATUM**', value: `> ${new Date().toLocaleDateString('de-DE')}\n\u200B` },
      { name: '**📝 GRUND**', value: `> ${grund}\n\u200B` },
      { name: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬', value: '\u200B' },
      { name: '**📌 ANGEORDNET DURCH**', value: `> ${executor}\n\u200B` }
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({
      text: `Team Update • ${new Date().toLocaleDateString('de-DE')}`,
      iconURL: executor.user.displayAvatarURL()
    });
}

function createDownrankEmbed(member, executor, alterRang, neuerRang, grund) {
  return new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle('⬇️ **DEGRADIERUNG** ⬇️')
    .addFields(
      { name: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬', value: '\u200B' },
      { name: '**👤 MITGLIED**', value: `> ${member}\n\u200B` },
      { name: '**🎖️ ALTER RANG**', value: `> <@&${config.roles.ränge[alterRang]}>\n\u200B` },
      { name: '**🎖️ NEUER RANG**', value: `> <@&${config.roles.ränge[neuerRang]}>\n\u200B` },
      { name: '**📅 DATUM**', value: `> ${new Date().toLocaleDateString('de-DE')}\n\u200B` },
      { name: '**📝 GRUND**', value: `> ${grund}\n\u200B` },
      { name: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬', value: '\u200B' },
      { name: '**📌 ANGEORDNET DURCH**', value: `> ${executor}\n\u200B` }
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({
      text: `Team Update • ${new Date().toLocaleDateString('de-DE')}`,
      iconURL: executor.user.displayAvatarURL()
    });
}

client.once('ready', async () => {
  console.log(`🤖 Eingeloggt als ${client.user.tag}`);

const commands = [
    new SlashCommandBuilder()
      .setName('einstellen')
      .setDescription('Stellt ein Mitglied ein')
      .addUserOption(o => o.setName('mitglied').setDescription('Mitglied').setRequired(true))
      .addIntegerOption(o => o.setName('rang').setDescription('Rang (1-20)').setRequired(true).setMinValue(1).setMaxValue(20)), // <--- geändert

    new SlashCommandBuilder()
      .setName('entlassen')
      .setDescription('Entlässt ein Mitglied')
      .addUserOption(o => o.setName('mitglied').setDescription('Mitglied').setRequired(true))
      .addStringOption(o => o.setName('grund').setDescription('Grund').setRequired(true)),

    new SlashCommandBuilder()
      .setName('uprank')
      .setDescription('Befördert ein Mitglied')
      .addUserOption(o => o.setName('mitglied').setDescription('Mitglied').setRequired(true))
      .addIntegerOption(o => o.setName('rang').setDescription('Neuer Rang (1-20)').setRequired(true).setMinValue(1).setMaxValue(20)) // <--- geändert
      .addStringOption(o => o.setName('grund').setDescription('Grund').setRequired(true)),

    new SlashCommandBuilder()
      .setName('downrank')
      .setDescription('Degradiert ein Mitglied')
      .addUserOption(o => o.setName('mitglied').setDescription('Mitglied').setRequired(true))
      .addIntegerOption(o => o.setName('rang').setDescription('Neuer Rang (1-20)').setRequired(true).setMinValue(1).setMaxValue(20)) // <--- geändert
      .addStringOption(o => o.setName('grund').setDescription('Grund').setRequired(true))
  ];

  await client.application.commands.set(commands);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (!interaction.member.roles.cache.some(r => config.roles.allowed.includes(r.id))) {
      return interaction.reply({ content: '⛔ Unzureichende Berechtigungen!', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser('mitglied');
    const member = await interaction.guild.members.fetch(user.id);

    switch(interaction.commandName) {
      case 'einstellen': {
        const rang = interaction.options.getInteger('rang');
        await manageRoles(member, rang);

        // Embed in Channel xy senden
        const einstellungsEmbed = createEinstellungsEmbed(member, interaction.member, rang);
        let xyChannel;
        try {
          xyChannel = await client.channels.fetch(config.channels.xy);
        } catch (e) {
          console.error('Fehler: Channel xy nicht gefunden oder keine Berechtigung:', config.channels.xy, e);
        }
        if (xyChannel) {
          await xyChannel.send({ embeds: [einstellungsEmbed] });
        } else {
          await interaction.followUp({ content: `❌ Unknown channel: ${config.channels.xy}`, ephemeral: true });
        }

        // Embed auch ins Log senden (gleiches Design)
        await logAction(einstellungsEmbed);

        await interaction.editReply(`✅ ${user.tag} als Rang ${rang} eingestellt!`);
        break;
      }

      case 'entlassen': {
        const grund = interaction.options.getString('grund');
        await removeAllRoles(member);

        // Embed für Kündigung
        const entlassungsEmbed = createEntlassungsEmbed(member, interaction.member, grund);

        // Embed NUR in Channel xy senden
        let xyChannel2;
        try {
          xyChannel2 = await client.channels.fetch(config.channels.xy);
        } catch (e) {
          console.error('Fehler: Channel xy nicht gefunden oder keine Berechtigung:', config.channels.xy, e);
        }
        if (xyChannel2) {
          try {
            await xyChannel2.send({ embeds: [entlassungsEmbed] });
          } catch (err) {
            console.error('Fehler beim Senden des Embeds in xy:', err);
            await interaction.followUp({ content: `❌ Embed konnte nicht in xy gesendet werden: ${err.message}`, ephemeral: true });
          }
        } else {
          await interaction.followUp({ content: `❌ Unknown channel: ${config.channels.xy}`, ephemeral: true });
        }

        // Embed NICHT ins Log senden

        await interaction.editReply(`✅ ${user.tag} entlassen!`);
        break;
      }

      case 'uprank':
      case 'downrank': {
        const neuerRang = interaction.options.getInteger('rang');
        const grundRank = interaction.options.getString('grund');
        const alterRang = Object.keys(config.roles.ränge).find(key => 
          member.roles.cache.has(config.roles.ränge[key])
        );
        await manageRoles(member, neuerRang);
        const rankEmbed = interaction.commandName === 'uprank' 
          ? createUprankEmbed(member, interaction.member, alterRang, neuerRang, grundRank)
          : createDownrankEmbed(member, interaction.member, alterRang, neuerRang, grundRank);

        // Embed auch in Channel xy senden
        let xyChannel3;
        try {
          xyChannel3 = await client.channels.fetch(config.channels.xy);
        } catch (e) {
          console.error('Fehler: Channel xy nicht gefunden oder keine Berechtigung:', config.channels.xy, e);
        }
        if (xyChannel3) {
          await xyChannel3.send({ embeds: [rankEmbed] });
        } else {
          await interaction.followUp({ content: `❌ Unknown channel: ${config.channels.xy}`, ephemeral: true });
        }

        await logAction(rankEmbed);
        await interaction.editReply(`✅ ${user.tag} von Rang ${alterRang} auf ${neuerRang} gesetzt!`);
        break;
      }
    }
  } catch (error) {
    console.error('Fehler:', error);
    await interaction.editReply(`❌ Fehler: ${error.message}`);
  }
});

async function logAction(embed) {
  const channel = await client.channels.fetch(config.channels.log);
  if (channel) await channel.send({ embeds: [embed] });
}

process.on('SIGINT', () => {
  leaderboardData.save();
  process.exit();
});

function createLogEinstellungsEmbed(member, executor, rang) {
  return new EmbedBuilder()
    .setColor(0x95a5a6)
    .setTitle('LOG: Mitglied eingestellt')
    .addFields(
      { name: 'Mitglied', value: `${member.user.tag} (${member.id})` },
      { name: 'Rang', value: `<@&${config.roles.ränge[rang]}> (${rang})` },
      { name: 'Eingestellt durch', value: `${executor.user.tag} (${executor.id})` },
      { name: 'Datum', value: new Date().toLocaleString('de-DE') }
    );
}

client.login(process.env.DISCORD_TOKEN);

// Hilfsfunktion für verschleierten Footer
function getVincentFooter() {
  // "by Ashraf-FIB" in base64
  const b64 = 'YnkgVmluY2VudA==';
  return Buffer.from(b64, 'base64').toString('utf8');
}

// Integritätsprüfung: Wenn der Footer-Text nicht stimmt, Bot beenden
function checkVincentFooter(embed) {
  const footer = embed.data.footer?.text || '';
  if (footer !== getVincentFooter() && footer !== `Team Update • ${new Date().toLocaleDateString('de-DE')}`) {
    console.error('Integritätsfehler: Footer wurde entfernt oder manipuliert!');
    process.exit(1);
  }
}

// Patch für alle EmbedBuilder-Objekte, damit Footer immer gesetzt wird
const origSetFooter = EmbedBuilder.prototype.setFooter;
EmbedBuilder.prototype.setFooter = function(footer) {
  // Footer-Text setzen oder ergänzen
  if (!footer || !footer.text) footer = { text: getVincentFooter() };
  else footer.text = `${footer.text} \u200B| ${getVincentFooter()}`;
  return origSetFooter.call(this, footer);
};

// Integritätsprüfung vor jedem Senden eines Embeds
const origSend = require('discord.js').BaseChannel.prototype.send;
require('discord.js').BaseChannel.prototype.send = async function(...args) {
  if (args[0]?.embeds) {
    for (const embed of args[0].embeds) checkVincentFooter(embed);
  }
  return origSend.apply(this, args);
};

// Entfernt alle Rang-, Basis-, Extra- und Entlassen-Rollen von einem Mitglied
async function removeAllRoles(member) {
  const alleZuEntfernenden = [
    ...Object.values(config.roles.ränge),
    ...config.roles.basis,
    ...Object.values(config.roles.extra),
    config.roles.entlassen
  ];
  await member.roles.remove(alleZuEntfernenden.filter(roleId => member.roles.cache.has(roleId)));
}

// Entfernt alle Rang-Rollen und gibt dem Mitglied nur die gewünschte Rang-Rolle
async function manageRoles(member, neuerRang) {
  // Alle Rang-Rollen entfernen
  const alleRangRollen = Object.values(config.roles.ränge);
  await member.roles.remove(alleRangRollen.filter(roleId => member.roles.cache.has(roleId)));
  // Neue Rang-Rolle hinzufügen
  await member.roles.add(config.roles.ränge[neuerRang]);
}
