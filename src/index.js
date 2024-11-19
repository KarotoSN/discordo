import { Client, GatewayIntentBits } from 'discord.js';
import { createCanvas, loadImage } from 'canvas';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Charger les variables d'environnement
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// Function to create welcome image
async function createWelcomeImage(member) {
  // Create canvas
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');

  // Load and draw background
  const background = await loadImage('https://images3.alphacoders.com/132/1326111.jpeg');
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  // Add semi-transparent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
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
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('BIENVENUE', canvas.width / 2, 280);

  // Add username
  ctx.font = '40px Sans-serif';
  ctx.fillText(member.user.username, canvas.width / 2, 340);

  return canvas.toBuffer();
}

// Listen for new members
client.on('guildMemberAdd', async member => {
  try {
    // Create welcome image
    const welcomeImage = await createWelcomeImage(member);

    // Find the welcome channel (using the channel ID from .env file)
    const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
    if (!channel) {
      console.error('Welcome channel not found');
      return;
    }

    // Send welcome message with image
    await channel.send({
      content: `Bienvenue sur le serveur ${member.user.toString()} !`,
      files: [{
        attachment: welcomeImage,
        name: 'welcome.png'
      }]
    });
  } catch (error) {
    console.error('Error creating welcome message:', error);
  }
});

// Login to Discord
client.login(process.env.DISCORD_BOT_TOKEN);

// Log when ready
client.once('ready', () => {
  console.log('BOT PRET BG!');
});