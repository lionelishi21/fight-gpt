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

const GAME_CHOICES = [
    { name: 'Street Fighter 6',   value: 'sf6'     },
    { name: 'Tekken 8',           value: 'tekken8' },
    { name: 'Guilty Gear Strive', value: 'ggst'    },
    { name: 'Mortal Kombat 1',    value: 'mk1'     },
];

// ─── Slash command definitions ────────────────────────────────────────────────
const commands = [
    new SlashCommandBuilder()
        .setName('framedata')
        .setDescription('Look up frame data for a character move')
        .addStringOption(o =>
            o.setName('game').setDescription('Game').setRequired(true).addChoices(...GAME_CHOICES),
        )
        .addStringOption(o =>
            o.setName('character').setDescription('Character name (e.g. ryu, kazuya_mishima)').setRequired(true),
        )
        .addStringOption(o =>
            o.setName('move').setDescription('Move name or input (e.g. Hadoken, df+2)').setRequired(false),
        )
        .toJSON(),

    new SlashCommandBuilder()
        .setName('combo')
        .setDescription('Get combos for a character')
        .addStringOption(o =>
            o.setName('game').setDescription('Game').setRequired(true).addChoices(...GAME_CHOICES),
        )
        .addStringOption(o =>
            o.setName('character').setDescription('Character name').setRequired(true),
        )
        .addStringOption(o =>
            o.setName('difficulty').setDescription('Filter by difficulty').setRequired(false)
                .addChoices(
                    { name: 'Beginner',     value: 'Beginner'     },
                    { name: 'Intermediate', value: 'Intermediate' },
                    { name: 'Advanced',     value: 'Advanced'     },
                ),
        )
        .toJSON(),

    new SlashCommandBuilder()
        .setName('punish')
        .setDescription('See which moves are unsafe on block for a character')
        .addStringOption(o =>
            o.setName('game').setDescription('Game').setRequired(true).addChoices(...GAME_CHOICES),
        )
        .addStringOption(o =>
            o.setName('character').setDescription('Character name').setRequired(true),
        )
        .toJSON(),

    new SlashCommandBuilder()
        .setName('meta')
        .setDescription('Get the current meta tier summary for a game')
        .addStringOption(o =>
            o.setName('game').setDescription('Game').setRequired(true).addChoices(...GAME_CHOICES),
        )
        .toJSON(),

    new SlashCommandBuilder()
        .setName('theory')
        .setDescription('Get the AI theory doc for a character')
        .addStringOption(o =>
            o.setName('game').setDescription('Game').setRequired(true).addChoices(...GAME_CHOICES),
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

// ─── Shared helper ────────────────────────────────────────────────────────────
async function findCharacter(game: string, charName: string) {
    const { CharacterEncyclopedia } = await import('../models/CharacterEncyclopedia');
    return CharacterEncyclopedia.findOne({
        game_id: game,
        character_id: { $regex: charName, $options: 'i' },
    }).lean() as any;
}

// ─── Handlers ────────────────────────────────────────────────────────────────
async function handleFramedata(interaction: ChatInputCommandInteraction): Promise<void> {
    const game     = interaction.options.getString('game', true);
    const charName = interaction.options.getString('character', true);
    const moveName = interaction.options.getString('move') ?? null;

    await interaction.deferReply();

    try {
        const enc = await findCharacter(game, charName);

        if (!enc) {
            await interaction.editReply(`No data found for **${charName}** in **${game.toUpperCase()}**. Try the character's full ID (e.g. \`kazuya_mishima\`).`);
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0xF43F5E)
            .setTitle(`${enc.character_id} — ${game.toUpperCase()}`)
            .setURL('https://metapunish.com/dashboard/theory')
            .setFooter({ text: 'MetaPunish Intelligence · metapunish.com' });

        const allMoves = [
            ...(enc.moveset?.normals  ?? []),
            ...(enc.moveset?.specials ?? []),
            ...(enc.moveset?.ex_moves ?? []),
            ...(enc.moveset?.supers   ?? []),
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
                embed.setDescription(`Move **${moveName}** not found. Showing character overview.`);
                embed.addFields([{ name: 'Total Moves Indexed', value: `${allMoves.length}`, inline: true }]);
            }
        } else {
            embed.setDescription(`Patch: **${enc.patch_version}**`);
            embed.addFields([
                { name: 'Normals',  value: `${enc.moveset?.normals?.length  ?? 0}`, inline: true },
                { name: 'Specials', value: `${enc.moveset?.specials?.length ?? 0}`, inline: true },
                { name: 'Supers',   value: `${enc.moveset?.supers?.length   ?? 0}`, inline: true },
                { name: 'Full Framedata', value: '[View on MetaPunish](https://metapunish.com/dashboard/theory)', inline: false },
            ]);
        }

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        Logger.error('[Discord] /framedata error:', err);
        await interaction.editReply('Error fetching frame data. Try again shortly.');
    }
}

async function handleCombo(interaction: ChatInputCommandInteraction): Promise<void> {
    const game       = interaction.options.getString('game', true);
    const charName   = interaction.options.getString('character', true);
    const difficulty = interaction.options.getString('difficulty') ?? null;

    await interaction.deferReply();

    try {
        const enc = await findCharacter(game, charName);

        if (!enc) {
            await interaction.editReply(`No data found for **${charName}** in **${game.toUpperCase()}**.`);
            return;
        }

        let combos: any[] = enc.combos ?? [];
        if (difficulty) combos = combos.filter((c: any) => c.difficulty === difficulty);
        combos = combos.slice(0, 5);

        const embed = new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle(`${enc.character_id} Combos — ${game.toUpperCase()}${difficulty ? ` (${difficulty})` : ''}`)
            .setURL('https://metapunish.com/dashboard/theory')
            .setFooter({ text: 'MetaPunish Intelligence · metapunish.com' });

        if (!combos.length) {
            embed.setDescription('No combos stored yet for this character.');
        } else {
            combos.forEach((c: any, i: number) => {
                const label = `${i + 1}. ${c.difficulty} — ${c.damage} dmg`;
                const value = [
                    `\`${c.inputs?.join(' → ') ?? 'N/A'}\``,
                    c.description ?? '',
                    c.tags?.length ? `Tags: ${c.tags.join(', ')}` : '',
                ].filter(Boolean).join('\n');
                embed.addFields([{ name: label, value: value.slice(0, 1024), inline: false }]);
            });
            embed.addFields([{ name: 'More Combos', value: '[View on MetaPunish](https://metapunish.com/dashboard/theory)', inline: false }]);
        }

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        Logger.error('[Discord] /combo error:', err);
        await interaction.editReply('Error fetching combos. Try again shortly.');
    }
}

async function handlePunish(interaction: ChatInputCommandInteraction): Promise<void> {
    const game     = interaction.options.getString('game', true);
    const charName = interaction.options.getString('character', true);

    await interaction.deferReply();

    try {
        const enc = await findCharacter(game, charName);

        if (!enc) {
            await interaction.editReply(`No data found for **${charName}** in **${game.toUpperCase()}**.`);
            return;
        }

        const allMoves = [
            ...(enc.moveset?.normals  ?? []),
            ...(enc.moveset?.specials ?? []),
            ...(enc.moveset?.ex_moves ?? []),
            ...(enc.moveset?.supers   ?? []),
        ];

        const unsafe = allMoves
            .filter((m: any) => m.frame_data?.on_block != null && m.frame_data.on_block < 0)
            .sort((a: any, b: any) => a.frame_data.on_block - b.frame_data.on_block)
            .slice(0, 10);

        const embed = new EmbedBuilder()
            .setColor(0xef4444)
            .setTitle(`${enc.character_id} — Unsafe Moves (${game.toUpperCase()})`)
            .setURL('https://metapunish.com/dashboard/theory')
            .setFooter({ text: 'MetaPunish Intelligence · metapunish.com' });

        if (!unsafe.length) {
            embed.setDescription('No unsafe moves found in the database for this character.');
        } else {
            embed.setDescription('Moves that are negative on block — punish these!');
            const lines = unsafe.map((m: any) =>
                `**${m.name}** \`${m.input}\` — ${m.frame_data.on_block} on block`,
            );
            embed.addFields([{ name: 'Punishable Moves', value: lines.join('\n').slice(0, 1024), inline: false }]);
            embed.addFields([{ name: 'Full Framedata', value: '[View on MetaPunish](https://metapunish.com/dashboard/theory)', inline: false }]);
        }

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        Logger.error('[Discord] /punish error:', err);
        await interaction.editReply('Error fetching punish data. Try again shortly.');
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
            embed.setDescription('No meta report found yet. Check back after more VODs are ingested.');
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
        const { TheoryDoc } = await import('../models/TheoryDocument');
        const doc = await TheoryDoc.findOne({
            game_id: game,
            character_id: { $regex: charName, $options: 'i' },
            type: 'character',
        }).sort({ generated_at: -1 }).lean() as any;

        const embed = new EmbedBuilder()
            .setColor(0xfbbf24)
            .setTitle(`${charName} Theory — ${game.toUpperCase()}`)
            .setURL('https://metapunish.com/dashboard/theory')
            .setFooter({ text: 'MetaPunish Intelligence · metapunish.com' });

        if (!doc) {
            embed.setDescription('No theory document found. Unlock the full library on MetaPunish.');
        } else {
            const summary = doc.summary
                ? doc.summary.slice(0, 300) + (doc.summary.length > 300 ? '…' : '')
                : 'See full theory on dashboard.';
            embed.setDescription(summary);
            if (doc.key_strengths?.length)  embed.addFields([{ name: 'Strengths',     value: doc.key_strengths.slice(0, 3).join('\n'),  inline: true }]);
            if (doc.key_weaknesses?.length) embed.addFields([{ name: 'Weaknesses',    value: doc.key_weaknesses.slice(0, 3).join('\n'), inline: true }]);
            if (doc.win_conditions?.length) embed.addFields([{ name: 'Win Conditions', value: doc.win_conditions.slice(0, 2).join('\n'), inline: false }]);
            if (doc.confidence) embed.addFields([{ name: 'Confidence', value: doc.confidence, inline: true }]);
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

    if (MONGODB_URI) {
        await mongoose.connect(MONGODB_URI);
        Logger.info('[Discord] MongoDB connected');
    }

    await registerCommands();

    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.once('clientReady', () => {
        Logger.info(`[Discord] Bot online as ${client.user?.tag}`);
    });

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        const { commandName } = interaction;
        if      (commandName === 'framedata') await handleFramedata(interaction);
        else if (commandName === 'combo')     await handleCombo(interaction);
        else if (commandName === 'punish')    await handlePunish(interaction);
        else if (commandName === 'meta')      await handleMeta(interaction);
        else if (commandName === 'theory')    await handleTheory(interaction);
    });

    await client.login(DISCORD_TOKEN);
}

main().catch(err => {
    Logger.error('[Discord] Fatal bot error:', err);
    process.exit(1);
});
