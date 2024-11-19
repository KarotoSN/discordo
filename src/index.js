import { Client, GatewayIntentBits } from 'discord.js';
import { createCanvas, loadImage } from 'canvas';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// Charger les images de fond une seule fois
let welcomeBackgroundImage;
let farewellBackgroundImage;

// Function to create image (welcome or farewell)
async function createImage(member, isWelcome) {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');

  // Utiliser l'image de fond appropriée
  const backgroundImage = isWelcome ? welcomeBackgroundImage : farewellBackgroundImage;
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

  // Add semi-transparent overlay
  ctx.fillStyle = isWelcome ? (process.env.WELCOME_OVERLAY_COLOR || 'rgba(0, 0, 0, 0.4)') : (process.env.FAREWELL_OVERLAY_COLOR || 'rgba(0, 0, 0, 0.4)');
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw circular avatar
  const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 256 }));
  ctx.save();
  ctx.beginPath();
  ctx.arc(400, 150, 64, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 336, 86, 128, 128);
  ctx.restore();

  // Add text
  ctx.font = 'bold 60px Sans-serif';
  ctx.fillStyle = isWelcome ? (process.env.WELCOME_TEXT_COLOR || '#ffffff') : (process.env.FAREWELL_TEXT_COLOR || '#ffffff');
  ctx.textAlign = 'center';
  ctx.fillText(isWelcome ? (process.env.WELCOME_TEXT || 'BIENVENUE') : (process.env.FAREWELL_TEXT || 'AU REVOIR'), canvas.width / 2, 280);

  // Add username
  ctx.font = '40px Sans-serif';
  ctx.fillText(member.user.username, canvas.width / 2, 340);

  return canvas.toBuffer();
}

// Listen for new members
client.on('guildMemberAdd', async member => {
  try {
    const welcomeImage = await createImage(member, true);
    const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
    if (!channel) {
      throw new Error(`Canal de bienvenue non trouvé. ID: ${process.env.WELCOME_CHANNEL_ID}`);
    }

    await channel.send({
      content: `${process.env.WELCOME_MESSAGE || 'Bienvenue sur le serveur'} ${member.user.toString()} !`,
      files: [{
        attachment: welcomeImage,
        name: 'welcome.png'
      }]
    });
  } catch (error) {
    console.error('Erreur lors de la création du message de bienvenue:', error);
  }
});

// Listen for members leaving
client.on('guildMemberRemove', async member => {
  try {
    const farewellImage = await createImage(member, false);
    const channel = member.guild.channels.cache.get(process.env.FAREWELL_CHANNEL_ID);
    if (!channel) {
      throw new Error(`Canal d'adieu non trouvé. ID: ${process.env.FAREWELL_CHANNEL_ID}`);
    }

    await channel.send({
      content: `${process.env.FAREWELL_MESSAGE || 'Au revoir'} ${member.user.toString()} !`,
      files: [{
        attachment: farewellImage,
        name: 'farewell.png'
      }]
    });
  } catch (error) {
    console.error('Erreur lors de la création du message d\'adieu:', error);
  }
});

// Initialisation et connexion
async function init() {
  try {
    // Charger les images de fond
    welcomeBackgroundImage = await loadImage(process.env.WELCOME_BACKGROUND_IMAGE || 'https://images3.alphacoders.com/132/1326111.jpeg');
    farewellBackgroundImage = await loadImage(process.env.FAREWELL_BACKGROUND_IMAGE || 'https://images3.alphacoders.com/132/1326111.jpeg');
    
    // Connexion à Discord
    await client.login(process.env.DISCORD_BOT_TOKEN);
    console.log('BOT PRET BG!');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du bot:', error);
  }
}

init();

// Log when ready
client.once('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
});