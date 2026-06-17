import {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from 'discord.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Logger } from '../helpers/logger';

dotenv.config();

const DISCORD_TOKEN     = process.env.DISCORD_BOT_TOKEN     || '';
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID     || '';
const MONGODB_URI       = process.env.MONGODB_URI           || '';

// ─── Slash command definitions ────────────────────────────────────────────────
const commands = [
    new SlashCommandBuilder()
        .setName('framedata')
        .setDescription('Look up frame data for a character move')
        .addStringOption(o =>
            o.setName('game').setDescription('Game ID (sf6, tekken8, ggst, mk1)').setRequired(true)
                .addChoices(
                    { name: 'Street Fighter 6', value: 'sf6' },
                    { name: 'Tekken 8',          value: 'tekken8' },
                    { name: 'Guilty Gear Strive', value: 'ggst' },
                    { name: 'Mortal Kombat 1',    value: 'mk1' },
                ),
        )
        .addStringOption(o =>
            o.setName('character').setDescription('Character name (e.g. Ryu, Kazuya)').setRequired(true),
        )
        .addStringOption(o =>
            o.setName('move').setDescription('Move name (e.g. Hadoken, df+2)').setRequired(false),
        )
        .toJSON(),

    new SlashCommandBuilder()
        .setName('meta')
        .setDescription('Get the current meta tier summary for a game')
        .addStringOption(o =>
            o.setName('game').setDescription('Game ID').setRequired(true)
                .addChoices(
                    { name: 'Street Fighter 6', value: 'sf6' },
                    { name: 'Tekken 8',          value: 'tekken8' },
                    { name: 'Guilty Gear Strive', value: 'ggst' },
                    { name: 'Mortal Kombat 1',    value: 'mk1' },
                ),
        )
        .toJSON(),

    new SlashCommandBuilder()
        .setName('theory')
        .setDescription('Get the AI theory doc for a character')
        .addStringOption(o =>
            o.setName('game').setDescription('Game ID').setRequired(true)
                .addChoices(
                    { name: 'Street Fighter 6', value: 'sf6' },
                    { name: 'Tekken 8',          value: 'tekken8' },
                    { name: 'Guilty Gear Strive', value: 'ggst' },
                    { name: 'Mortal Kombat 1',    value: 'mk1' },
                ),
        )
        .addStringOption(o =>
            o.setName('character').setDescription('Character name').setRequired(true),
        )
        .toJSON(),
];

// ─── Register commands ────────────────────────────────────────────────────────
async function registerCommands(): Promise<void> {
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    Logger.info('[Discord] Registering slash commands…');
    await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), { body: commands });
    Logger.info('[Discord] Slash commands registered');
}

// ─── Handlers ────────────────────────────────────────────────────────────────
async function handleFramedata(interaction: ChatInputCommandInteraction): Promise<void> {
    const game      = interaction.options.getString('game', true);
    const charName  = interaction.options.getString('character', true);
    const moveName  = interaction.options.getString('move') ?? null;

    await interaction.deferReply();

    try {
        const { CharacterEncyclopedia } = await import('../models/CharacterEncyclopedia');
        const enc = await CharacterEncyclopedia.findOne({
            game_id: game,
            character_id: { $regex: charName, $options: 'i' },
        }).lean() as any;

        if (!enc) {
            await interaction.editReply(`No data found for **${charName}** in **${game.toUpperCase()}**. Try the full name.`);
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0xF43F5E)
            .setTitle(`${enc.character_id} — ${game.toUpperCase()}`)
            .setURL('https://metapunish.com/dashboard/theory')
            .setFooter({ text: 'MetaPunish Intelligence · metapunish.com' });

        const allMoves = [
            ...(enc.moveset?.normals   ?? []),
            ...(enc.moveset?.specials  ?? []),
            ...(enc.moveset?.ex_moves  ?? []),
            ...(enc.moveset?.supers    ?? []),
        ];

        if (moveName && allMoves.length) {
            const move = allMoves.find((m: any) =>
                m.name?.toLowerCase().includes(moveName.toLowerCase()) ||
                m.input?.toLowerCase().includes(moveName.toLowerCase()),
            );
            if (move) {
                embed.setDescription(`**${move.name ?? moveName}** \`${move.input ?? ''}\``);
                const fd = move.frame_data ?? {};
                const fields: { name: string; value: string; inline: boolean }[] = [];
                if (fd.startup  != null) fields.push({ name: 'Startup',  value: `${fd.startup}f`,  inline: true });
                if (fd.active   != null) fields.push({ name: 'Active',   value: `${fd.active}f`,   inline: true });
                if (fd.recovery != null) fields.push({ name: 'Recovery', value: `${fd.recovery}f`, inline: true });
                if (fd.on_block != null) fields.push({ name: 'On Block', value: `${fd.on_block}`,  inline: true });
                if (fd.on_hit   != null) fields.push({ name: 'On Hit',   value: `${fd.on_hit}`,    inline: true });
                if (fd.damage   != null) fields.push({ name: 'Damage',   value: `${fd.damage}`,    inline: true });
                if (move.properties?.length) fields.push({ name: 'Properties', value: move.properties.join(', '), inline: false });
                if (fields.length) embed.addFields(fields);
                else embed.addFields([{ name: 'Note', value: 'No frame data stored yet for this move.', inline: false }]);
            } else {
                embed.setDescription(`Move **${moveName}** not found. Listing character overview instead.`);
                embed.addFields([{ name: 'Total Moves Indexed', value: `${allMoves.length}`, inline: true }]);
            }
        } else {
            embed.setDescription(`Patch: **${enc.patch_version}**`);
            embed.addFields([
                { name: 'Normals',  value: `${enc.moveset?.normals?.length  ?? 0}`,  inline: true },
                { name: 'Specials', value: `${enc.moveset?.specials?.length ?? 0}`, inline: true },
                { name: 'Supers',   value: `${enc.moveset?.supers?.length   ?? 0}`,  inline: true },
                { name: 'Full Framedata', value: '[View on MetaPunish](https://metapunish.com/dashboard/theory)', inline: false },
            ]);
        }

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        Logger.error('[Discord] /framedata error:', err);
        await interaction.editReply('Error fetching frame data. Try again shortly.');
    }
}

async function handleMeta(interaction: ChatInputCommandInteraction): Promise<void> {
    const game = interaction.options.getString('game', true);
    await interaction.deferReply();

    try {
        const { MetaReport } = await import('../models/MetaReport');
        const report = await MetaReport.findOne({ game_id: game }).sort({ createdAt: -1 }).lean() as any;

        const embed = new EmbedBuilder()
            .setColor(0x06b6d4)
            .setTitle(`${game.toUpperCase()} — Current Meta`)
            .setURL('https://metapunish.com/dashboard/meta')
            .setFooter({ text: 'MetaPunish Intelligence · metapunish.com' });

        if (!report) {
            embed.setDescription('No meta report found for this game yet. Check back after more VODs are ingested.');
        } else {
            embed.setDescription(report.summary ?? 'Meta report available — see full details on the dashboard.');
            if (report.tier_list?.s?.length) embed.addFields([{ name: 'S Tier', value: report.tier_list.s.join(', '), inline: false }]);
            if (report.tier_list?.a?.length) embed.addFields([{ name: 'A Tier', value: report.tier_list.a.join(', '), inline: false }]);
            if (report.generated_at) embed.addFields([{ name: 'Updated', value: new Date(report.generated_at).toLocaleDateString(), inline: true }]);
        }

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        Logger.error('[Discord] /meta error:', err);
        await interaction.editReply('Error fetching meta data.');
    }
}

async function handleTheory(interaction: ChatInputCommandInteraction): Promise<void> {
    const game     = interaction.options.getString('game', true);
    const charName = interaction.options.getString('character', true);
    await interaction.deferReply();

    try {
        const { TheoryDoc: TheoryDocument } = await import('../models/TheoryDocument');
        const doc = await TheoryDocument.findOne({
            game_id: game,
            character_name: { $regex: charName, $options: 'i' },
        }).sort({ version: -1 }).lean() as any;

        const embed = new EmbedBuilder()
            .setColor(0xfbbf24)
            .setTitle(`${charName} Theory — ${game.toUpperCase()}`)
            .setURL('https://metapunish.com/dashboard/theory')
            .setFooter({ text: 'MetaPunish Intelligence · metapunish.com' });

        if (!doc) {
            embed.setDescription('No theory document found. Unlock the full library on MetaPunish.');
        } else {
            const summary = doc.summary ? doc.summary.slice(0, 300) + (doc.summary.length > 300 ? '…' : '') : 'See full theory on dashboard.';
            embed.setDescription(summary);
            if (doc.key_strengths?.length)   embed.addFields([{ name: 'Strengths',    value: doc.key_strengths.slice(0,3).join('\n'),   inline: true }]);
            if (doc.key_weaknesses?.length)  embed.addFields([{ name: 'Weaknesses',   value: doc.key_weaknesses.slice(0,3).join('\n'),  inline: true }]);
            if (doc.win_conditions?.length)  embed.addFields([{ name: 'Win Conditions', value: doc.win_conditions.slice(0,2).join('\n'), inline: false }]);
        }

        embed.addFields([{ name: 'Full Theory', value: '[View on MetaPunish](https://metapunish.com/dashboard/theory)', inline: false }]);
        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        Logger.error('[Discord] /theory error:', err);
        await interaction.editReply('Error fetching theory document.');
    }
}

// ─── Main bot entrypoint ──────────────────────────────────────────────────────
async function main(): Promise<void> {
    if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
        Logger.error('[Discord] DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID not set. Bot will not start.');
        process.exit(1);
    }

    // Connect to MongoDB
    if (MONGODB_URI) {
        await mongoose.connect(MONGODB_URI);
        Logger.info('[Discord] MongoDB connected');
    }

    // Register slash commands
    await registerCommands();

    // Start bot client
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.once('clientReady', () => {
        Logger.info(`[Discord] Bot online as ${client.user?.tag}`);
    });

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        const { commandName } = interaction;
        if (commandName === 'framedata') await handleFramedata(interaction);
        else if (commandName === 'meta')  await handleMeta(interaction);
        else if (commandName === 'theory') await handleTheory(interaction);
    });

    await client.login(DISCORD_TOKEN);
}

main().catch(err => {
    Logger.error('[Discord] Fatal bot error:', err);
    process.exit(1);
});
