import { ICharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { IAnalysisRepository } from '../repositories/AnalysisRepository';
import { IMission } from '../models/Mission';
import Mission from '../models/Mission';
import UserMission from '../models/UserMission';
import User from '../models/User';
import { Character } from '../models/Character';
import { Scenario } from '../models/Scenario';

export interface DrillStep {
    step: number;
    instruction: string;
    cue: string;          // what to look for / react to
    goal: string;         // what success looks like
}

export interface MissionDetails {
    missionId: string;
    title: string;
    description: string;
    type: string;
    gameId: string;
    targetCharacter?: string;
    xpReward?: number;
    frameData?: any[];
    recommendedMoves?: any[];
    combos?: any[];
    videoReferences?: any[];
    scenarioExamples?: any[];  // vector DB scenario excerpts
    trainingTips: string[];
    drillSteps: DrillStep[];   // structured step-by-step guide
    successCriteria: string;   // what completing this mission looks like
    whyItMatters: string;      // explanation of the mechanic's importance
}

// Maps mission title keywords to the event types in the vector/analysis DB
const MISSION_EVENT_MAP: Record<string, string[]> = {
    'anti_air':      ['anti_air', 'anti-air'],
    'parry':         ['parry', 'perfect_parry'],
    'combo':         ['pro_move', 'whiff_punish'],
    'defensive':     ['punish_missed', 'whiff_punish'],
    'whiff_punish':  ['whiff_punish'],
    'resource':      ['bad_habit', 'neutral_loss'],
    'chip':          ['pro_move'],
    'mastery':       ['pro_move', 'neutral_win'],
};

export class MissionDetailService {
    constructor(
        private readonly encyclopediaRepository: ICharacterEncyclopediaRepository,
        private readonly analysisRepository: IAnalysisRepository
    ) {}

    public async getMissionDetails(missionId: string, userId: string): Promise<MissionDetails> {
        let mission: IMission | null = null;

        const userMission = await UserMission.findById(missionId).populate('mission');
        if (userMission?.mission) {
            mission = userMission.mission as unknown as IMission;
        } else {
            mission = await Mission.findById(missionId);
        }

        if (!mission) throw new Error('Mission not found');

        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const indexedSlot = (user.slots?.length ?? 0) > 0
            ? user.slots[user.activeSlotIndex ?? 0] ?? user.slots[0]
            : null;
        const gameId = indexedSlot?.gameId || user.preferences?.favoriteGames?.[0] || 'sf6';
        const charSlug = indexedSlot?.characterId || user.preferences?.mainCharacter || 'ryu';

        const charDoc = await Character.findOne({
            game_id: gameId,
            $or: [{ name: new RegExp(`^${charSlug}$`, 'i') }, { aliases: charSlug }],
        }, { name: 1 }).lean();
        const characterDisplayName = (charDoc as any)?.name ?? charSlug;

        const details: MissionDetails = {
            missionId: mission._id?.toString(),
            title: (mission.title || '').replace(/_/g, ' '),
            description: mission.description,
            type: mission.type,
            gameId,
            targetCharacter: characterDisplayName,
            xpReward: mission.reward?.xp,
            trainingTips: [],
            drillSteps: [],
            successCriteria: '',
            whyItMatters: '',
        };

        const t = mission.title.toLowerCase();

        if (t.includes('anti_air') || t.includes('anti-air')) {
            await this.populateAntiAir(details, gameId, charSlug);
        } else if (t.includes('parry')) {
            await this.populateParry(details, gameId);
        } else if (t.includes('combo') || t.includes('drive_rush') || t.includes('specialist')) {
            await this.populateCombo(details, gameId, charSlug);
        } else if (t.includes('defensive') || t.includes('throw') || t.includes('tech')) {
            await this.populateDefensive(details, gameId, charSlug);
        } else if (t.includes('whiff_punish') || t.includes('whiff')) {
            await this.populateWhiffPunish(details, gameId, charSlug);
        } else if (t.includes('resource') || t.includes('burnout') || t.includes('drive_gauge')) {
            await this.populateResourceManagement(details, gameId);
        } else if (t.includes('chip') || t.includes('super')) {
            await this.populateChipDamage(details, gameId, charSlug);
        } else if (t.includes('mastery')) {
            // Extract character name from title like "KEN_MASTERY"
            const charFromTitle = mission.title.replace('_MASTERY', '').replace(/_/g, ' ').trim();
            await this.populateCharacterMastery(details, gameId, charFromTitle || charSlug);
        } else {
            await this.populateGeneric(details, gameId, charSlug);
        }

        // Always attempt to find video references from analyses and scenarios
        if (!details.videoReferences?.length) {
            const eventTypes = this.resolveEventTypes(t);
            details.videoReferences = await this.findVideoReferences(gameId, eventTypes);
        }

        // Pull scenario examples from vector DB for context
        details.scenarioExamples = await this.findScenarioExamples(gameId, this.resolveEventTypes(t));

        return details;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ANTI-AIR
    // ─────────────────────────────────────────────────────────────────────────
    private async populateAntiAir(d: MissionDetails, gameId: string, charSlug: string) {
        d.whyItMatters = 'Anti-airing consistently is one of the highest-value skills in any fighting game. A single clean anti-air denies damage, resets neutral, and conditions your opponent to stop jumping — which opens up the entire ground game.';
        d.successCriteria = 'Land 5 clean anti-airs in a single match using an upward-hitting move before the opponent lands.';

        d.drillSteps = [
            { step: 1, instruction: 'Go into training mode — set opponent to jump forward on a random delay', cue: 'Watch for the opponent lifting off the ground', goal: 'Build the reflex to react to the jump startup, not the airborne state' },
            { step: 2, instruction: 'Practice your character\'s dedicated anti-air move 50 times in isolation', cue: 'Time the attack to hit during the opponent\'s ascent, not descent', goal: 'Consistent anti-air timing on forward jump' },
            { step: 3, instruction: 'Add jump back and neutral jump to the training set', cue: 'Different jump arcs require slightly different timing — adjust per angle', goal: 'Coverage against all three jump directions' },
            { step: 4, instruction: 'Take it online — focus only on getting the anti-air, ignore other gameplan', cue: 'Anticipate, don\'t react — start your anti-air motion as they leave the ground', goal: '5 successful anti-airs in one session' },
        ];

        d.trainingTips = [
            'The window to anti-air is when the opponent is still ascending — if they\'re falling, you\'re too late.',
            'Crouching Heavy Punch beats most jump-ins in SF6 due to its inverted hitbox angle.',
            'DP motions (623P) give you the most reward — learn to buffer them during blockstun.',
            'If you\'re getting crossed up, your spacing is wrong — step back before anti-airing.',
        ];

        const enc = await this.encyclopediaRepository.findCurrentByGameIdAndCharacterId(gameId, charSlug);
        if (enc?.moveset) {
            const allMoves = [...(enc.moveset.normals || []), ...(enc.moveset.specials || [])];
            const antiAirMoves = allMoves.filter(m =>
                m.properties?.some((p: string) => p.toLowerCase().includes('anti-air') || p.toLowerCase() === 'aa') ||
                m.name.toLowerCase().includes('uppercut') ||
                m.name.toLowerCase().includes('rising') ||
                m.input?.includes('623')
            );
            if (antiAirMoves.length) {
                d.recommendedMoves = antiAirMoves.map(m => ({
                    name: m.name, input: m.input,
                    startup: m.frame_data?.startup, properties: m.properties
                }));
                d.trainingTips.unshift(`Your best anti-air is ${antiAirMoves[0].name} (${antiAirMoves[0].input}) — startup: ${antiAirMoves[0].frame_data?.startup ?? '?'} frames.`);
            }
        }

        d.frameData = [
            { label: 'Jump startup', value: '3–4 frames', note: 'Your reaction window begins the moment they leave the ground' },
            { label: 'Airborne duration', value: '~30 frames', note: 'You have roughly this long to anti-air before they land' },
            { label: 'DP startup (typical)', value: '3–5 frames', note: 'Most DPs beat jump-ins cleanly if timed correctly' },
            { label: 'cr.HP startup (SF6)', value: '6–8 frames', note: 'Reliable universal anti-air with good damage' },
        ];

        d.videoReferences = await this.findVideoReferences(gameId, ['anti_air', 'anti-air']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PERFECT PARRY
    // ─────────────────────────────────────────────────────────────────────────
    private async populateParry(d: MissionDetails, gameId: string) {
        d.whyItMatters = 'In SF6, Parry completely negates chip damage, gives you a temporary Drive Rush on Perfect Parry, and instantly turns pressure into offense. It\'s the highest-skill-ceiling defensive option in the game.';
        d.successCriteria = 'Perform 3 Perfect Parries in a real match — absorb the hit, then convert into a punish.';

        d.drillSteps = [
            { step: 1, instruction: 'Training mode: set opponent to repeat a single move (Guile Sonic Boom, Marisa Gladius)', cue: 'Hold back to charge Parry input, release on impact frame', goal: 'Consistent Perfect Parry on a single slow move' },
            { step: 2, instruction: 'Practice on faster multi-hit specials (Cammy Spiral Arrow)', cue: 'Parry the first hit of a multi-hit string — it\'s easier to time than single hits', goal: 'Parry a fast linear special move' },
            { step: 3, instruction: 'In real matches, identify one predictable move your opponent repeats and Parry it', cue: 'Look for their panic button or their go-to pressure string ender', goal: '1 successful Parry in a real match with a punish afterward' },
        ];

        d.trainingTips = [
            'Perfect Parry has a 2-frame window — timing needs to be very tight.',
            'Regular Parry (hold back) is safer and has longer duration — use it as the base.',
            'After a Perfect Parry you get a Drive Rush cancel window — use it to start a full combo.',
            'Target slow, heavy moves first: charged projectiles, anti-airs, slow normals.',
            'In SF6 Season 2, Perfect Parry on a Drive Impact gives a guaranteed punish.',
        ];

        d.frameData = [
            { label: 'Regular Parry duration', value: '~8 frames', note: 'Hold back during any attack' },
            { label: 'Perfect Parry window', value: '2 frames', note: 'Precise timing on the impact frame' },
            { label: 'Parry recovery', value: '3 frames', note: 'Your recovery if you don\'t get the perfect' },
            { label: 'Drive cost', value: '1 Drive Bar', note: 'Each Parry attempt costs meter' },
        ];

        d.videoReferences = await this.findVideoReferences(gameId, ['parry', 'perfect_parry']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMBO / DRIVE RUSH
    // ─────────────────────────────────────────────────────────────────────────
    private async populateCombo(d: MissionDetails, gameId: string, charSlug: string) {
        d.whyItMatters = 'Converting confirms into full combos is what separates intermediate from advanced play. Consistent combo execution means every successful hit becomes maximum damage — sloppy confirms leave damage on the table every round.';
        d.successCriteria = 'Execute a full Drive Rush-extended combo in a real match, not training mode.';

        d.drillSteps = [
            { step: 1, instruction: 'Choose your character\'s simplest hit-confirm (2 normals into a special)', cue: 'Feel the counter-hit or normal-hit feedback before committing to the cancel', goal: '90% consistency in training mode before taking to matches' },
            { step: 2, instruction: 'Add a Drive Rush cancel to extend the combo by one link', cue: 'Buffer the Drive Rush input during the first hit\'s active frames', goal: 'Consistent Drive Rush cancel in training' },
            { step: 3, instruction: 'Practice the ender separately — super arts, corner carry, or knockdown', cue: 'Muscle memory the ender input so you can focus on the confirm', goal: 'Clean ender execution 9/10 times in isolation' },
            { step: 4, instruction: 'String the full combo and take it live in 5 ranked matches', cue: 'Accept dropped combos — focus on going for the combo, not defaulting to safe single hits', goal: '1 successful full Drive Rush combo in a real match' },
        ];

        d.trainingTips = [
            'Hit-confirm before Drive Rush canceling — Drive Rush on block costs meter for nothing.',
            'Practice the motion during hitstun, not before the move lands.',
            'Simple 3-hit combos done consistently beat 8-hit combos dropped half the time.',
            'Corner changes your ender options — learn one corner-specific route.',
        ];

        const enc = await this.encyclopediaRepository.findCurrentByGameIdAndCharacterId(gameId, charSlug);
        if (enc?.combos?.length) {
            d.combos = enc.combos.slice(0, 5).map((c: any) => ({
                inputs: c.inputs, damage: c.damage,
                difficulty: c.difficulty, drive_gauge: c.drive_gauge,
                notes: c.notes,
            }));
        }

        if (enc?.moveset) {
            const specials = enc.moveset.specials || [];
            d.recommendedMoves = specials.slice(0, 4).map((m: any) => ({
                name: m.name, input: m.input,
                startup: m.frame_data?.startup, properties: m.properties
            }));
        }

        d.videoReferences = await this.findVideoReferences(gameId, ['pro_move', 'whiff_punish']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DEFENSIVE WALL — throw tech
    // ─────────────────────────────────────────────────────────────────────────
    private async populateDefensive(d: MissionDetails, gameId: string, charSlug: string) {
        d.whyItMatters = 'Throw teching removes your opponent\'s easiest damage source during pressure. Once they know you\'ll tech, they have to open you up with overheads or frame traps — both of which are easier to deal with than untouched throws.';
        d.successCriteria = 'Successfully tech (break) 3 throw attempts in a single match.';

        d.drillSteps = [
            { step: 1, instruction: 'Training mode: set opponent to throw randomly during pressure. Practice the tech input (LP+LK)', cue: 'The timing window is about 7 frames — input it early if unsure', goal: 'Tech 10 consecutive throws in training' },
            { step: 2, instruction: 'Add mixed pressure: some throws, some frame traps. Don\'t mash tech', cue: 'If you get frame-trapped, your opponent is doing the right thing — only tech when you expect a throw', goal: 'Selective teching without getting counter-hit by frame traps' },
            { step: 3, instruction: 'In real matches, identify your opponent\'s throw timing (usually after a blockstring ender)', cue: 'They\'ll throw when you stop pressing buttons — anticipate that moment', goal: '3 throw techs in one match' },
        ];

        d.trainingTips = [
            'Throw tech window is 7 frames in SF6 — you have time, don\'t panic-mash.',
            'Tech attempts that get counter-hit by frame traps mean you\'re teching too predictably.',
            'Option select tech: press LP+LK during a moment you expect a throw. If they frame-trap, you get hit; if they throw, you tech.',
            'After teching, you\'re at neutral — immediately return to your pressure game.',
        ];

        d.frameData = [
            { label: 'Throw tech window', value: '7 frames', note: 'Input LP+LK within this window after the throw attempt' },
            { label: 'Throw range', value: '~1 character width', note: 'Only tech throws within melee distance' },
            { label: 'Tech animation', value: '20 frames', note: 'Both players reset to standing after a tech' },
            { label: 'Mash tech risk', value: 'Counter-hit', note: 'Mashing LP+LK during frame traps gives free counter-hits' },
        ];

        d.videoReferences = await this.findVideoReferences(gameId, ['punish_missed', 'bad_habit']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WHIFF PUNISH
    // ─────────────────────────────────────────────────────────────────────────
    private async populateWhiffPunish(d: MissionDetails, gameId: string, charSlug: string) {
        d.whyItMatters = 'Whiff punishing is pure free damage — you take zero risk while the opponent is in recovery. It\'s the highest-efficiency damage source in neutral and it conditions opponents to play more cautiously.';
        d.successCriteria = 'Punish 3 heavy whiffed normals with a medium or heavy button in a single match.';

        d.drillSteps = [
            { step: 1, instruction: 'Training mode: set opponent to randomly throw out a slow heavy normal. Focus on reacting with your fastest punisher', cue: 'Watch for the recovery animation — your window opens the moment the hitbox disappears', goal: 'Consistent punish on a single slow normal' },
            { step: 2, instruction: 'Increase your spacing to max punish range — most punish routes have strict distance requirements', cue: 'Your punish should feel "late" — that means you\'re at max range', goal: 'Punish from tip range with your longest-reaching button' },
            { step: 3, instruction: 'In real matches, identify ONE move your opponent overuses that has recovery you can punish', cue: 'When neutral feels stale, they\'re about to whiff something — hold your position', goal: '3 whiff punishes in a match using a heavy button' },
        ];

        d.trainingTips = [
            'Heavy normals have the longest recovery — they\'re your safest whiff punish targets.',
            'Walk forward slightly before punishing — this maximizes damage and extends your reach.',
            'Know your punish button: the fastest move that still deals meaningful damage.',
            'Whiff punishing requires patience — play reactive, not proactive.',
        ];

        const enc = await this.encyclopediaRepository.findCurrentByGameIdAndCharacterId(gameId, charSlug);
        if (enc?.moveset) {
            const medHeavy = [...(enc.moveset.normals || [])].filter(m =>
                m.name.toLowerCase().includes('heavy') ||
                m.name.toLowerCase().includes('medium') ||
                m.input?.includes('5M') || m.input?.includes('5H')
            ).slice(0, 3);
            if (medHeavy.length) {
                d.recommendedMoves = medHeavy.map(m => ({
                    name: m.name, input: m.input,
                    startup: m.frame_data?.startup,
                    properties: m.properties
                }));
            }
        }

        d.frameData = [
            { label: 'Heavy normal recovery (avg)', value: '20–30 frames', note: 'Your punish window after they whiff' },
            { label: 'Walk speed factor', value: 'Critical', note: 'Slower walk speed = harder to close distance mid-whiff' },
            { label: 'Whiff punish startup', value: 'Under 10 frames', note: 'Your button must come out before they recover' },
        ];

        d.videoReferences = await this.findVideoReferences(gameId, ['whiff_punish']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESOURCE MANAGER — Drive gauge / Burnout
    // ─────────────────────────────────────────────────────────────────────────
    private async populateResourceManagement(d: MissionDetails, gameId: string) {
        d.whyItMatters = 'In SF6, Burnout removes access to Drive Rush, Parry, and Reversal — and leaves you taking chip damage. Burning out at the wrong moment can lose a round you had won. Gauge management is a meta-skill that multiplies every other technique.';
        d.successCriteria = 'Win a round without entering Burnout — manage your Drive gauge so it stays above 0 the entire round.';

        d.drillSteps = [
            { step: 1, instruction: 'Count Drive usage: each Drive Rush costs 3 bars, Parry costs 1, Super costs 3. Visualize the HUD at all times', cue: 'When your gauge drops below 2 bars, stop spending Drive', goal: 'Finish 3 rounds in training without touching Burnout' },
            { step: 2, instruction: 'Identify your Drive "bleed" — the moves or habits that drain it fastest without converting', cue: 'Drive Rush that doesn\'t convert, over-Parrying, Drive Impact on block', goal: 'Eliminate one Drive-wasting habit per session' },
            { step: 3, instruction: 'Play a real match with one rule: no Drive Rush until you have 4+ bars', cue: 'Save Drive for punishes and conversions, not neutral pressure', goal: 'Win one round without entering Burnout' },
        ];

        d.trainingTips = [
            'Drive Rush on block costs 3 bars and gives the opponent +2 frames — almost never worth it.',
            'Drive Parry is free on hit but costs 1 bar on block — use it selectively.',
            'Drive Impact on a reaction punish is efficient; Drive Impact randomly in neutral is wasteful.',
            'Let the gauge regen naturally during your offense — you gain Drive on hit.',
            'When below 2 bars, play purely defensive and let it regen before spending again.',
        ];

        d.frameData = [
            { label: 'Drive gauge total', value: '6 bars', note: 'Full gauge = maximum options' },
            { label: 'Drive Rush cost', value: '3 bars', note: 'Only spend when you\'re converting to full combo' },
            { label: 'Drive Impact cost', value: '1 bar', note: 'Cheaper but punishable if predicted' },
            { label: 'Burnout penalty', value: 'Chip damage active', note: 'Super Arts and blocked specials deal chip damage' },
            { label: 'Gauge regen rate', value: 'Slow when below 2', note: 'Once in Burnout, regen is disabled temporarily' },
        ];

        d.videoReferences = await this.findVideoReferences(gameId, ['bad_habit', 'neutral_loss']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHIP DAMAGE — Super Art
    // ─────────────────────────────────────────────────────────────────────────
    private async populateChipDamage(d: MissionDetails, gameId: string, charSlug: string) {
        d.whyItMatters = 'Winning a round with chip damage from a Super Art is a legitimate and often overlooked win condition. When the opponent is near death and cornered, a blocked super closes the round — conditioning opponents to fear this outcome changes how they play defense.';
        d.successCriteria = 'Win a round using chip damage from a Super Art — land it on block when the opponent has low enough health.';

        d.drillSteps = [
            { step: 1, instruction: 'Know your super\'s chip damage value — check how much health it removes on block', cue: 'At low health, the mental pressure alone forces mistakes', goal: 'Know exactly when your super can chip-kill from the HUD' },
            { step: 2, instruction: 'Build to super without spending meter early — control when you have super available', cue: 'Corner pressure is the ideal setup — they can\'t escape the chip', goal: 'Reach super 3 or super 4 while opponent is below 30% HP' },
            { step: 3, instruction: 'Force blockstun and then super — use a meaty or an unblockable setup to confirm the chip win', cue: 'Level 3 supers deal the most chip — save level 1 and 2 for combos', goal: 'Win one round with chip damage from Super Art' },
        ];

        d.trainingTips = [
            'Level 3 Super Arts deal the most chip — use level 1/2 in combos, save level 3 for chip kills.',
            'The opponent cannot tech-out of super chip damage in SF6 — it\'s guaranteed.',
            'Corner positioning multiplies chip kills — the opponent can\'t backdash away.',
            'Fake the super to make them jump, then super them out of the air for real damage.',
        ];

        const enc = await this.encyclopediaRepository.findCurrentByGameIdAndCharacterId(gameId, charSlug);
        if (enc?.moveset?.supers?.length) {
            d.recommendedMoves = enc.moveset.supers.map((m: any) => ({
                name: m.name, input: m.input,
                startup: m.frame_data?.startup, damage: m.frame_data?.damage,
                properties: m.properties
            }));
        }

        d.videoReferences = await this.findVideoReferences(gameId, ['pro_move']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHARACTER MASTERY
    // ─────────────────────────────────────────────────────────────────────────
    private async populateCharacterMastery(d: MissionDetails, gameId: string, charName: string) {
        d.whyItMatters = `Deep character knowledge is your long-term edge. The more you understand ${charName}'s optimal spacing, safest buttons, and best punish routes, the faster your decision-making becomes — until playing correctly feels automatic.`;
        d.successCriteria = `Land ${charName}'s most threatening move 5 times in real matches using correct spacing and confirm it into a punish when it hits.`;

        d.drillSteps = [
            { step: 1, instruction: `Identify ${charName}'s "threat move" — the one move opponents most fear and must respect`, cue: 'It\'s usually a fast normal with good range, or a strong special that controls space', goal: 'Know the move by name, input, and its frame data on hit and block' },
            { step: 2, instruction: 'Practice hitting this move from its optimal range in training mode, then converting on hit', cue: 'On hit: go into your best combo route. On block: return to neutral safely', goal: '10 consecutive optimal-range hits with combo conversion in training' },
            { step: 3, instruction: 'In real matches, make this move the center of your gameplan for 3 matches', cue: 'Use other buttons to condition for this move — don\'t use it randomly', goal: 'Land the move 5 times across the session with correct spacing' },
        ];

        d.trainingTips = [
            `Focus on ${charName}'s safest poke — the move you can throw out with minimal risk.`,
            'Know your character\'s walk speed and use it to control spacing before using threat moves.',
            'Character mastery means making the same correct decision faster each time you face a situation.',
            'Study one top-player VOD of your character and identify their most-used neutral tool.',
        ];

        const enc = await this.encyclopediaRepository.findCurrentByGameIdAndCharacterId(
            gameId, charName.toLowerCase().replace(/\s+/g, '_')
        );
        if (enc?.moveset) {
            const normals = enc.moveset.normals || [];
            const specials = enc.moveset.specials || [];
            d.recommendedMoves = [...normals.slice(0, 3), ...specials.slice(0, 2)].map((m: any) => ({
                name: m.name, input: m.input,
                startup: m.frame_data?.startup, properties: m.properties
            }));
        }

        d.videoReferences = await this.findVideoReferences(gameId, ['pro_move', 'neutral_win']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GENERIC FALLBACK
    // ─────────────────────────────────────────────────────────────────────────
    private async populateGeneric(d: MissionDetails, gameId: string, charSlug: string) {
        d.whyItMatters = 'Every mission targets a specific gap in your gameplay. Completing it under real match conditions reinforces the habit faster than training mode alone.';
        d.successCriteria = d.description || 'Complete the stated objective in a real match.';

        d.drillSteps = [
            { step: 1, instruction: 'Re-read the mission goal and break it into one concrete action', cue: 'What is the exact moment you need to make a different decision?', goal: 'Identify the situation that triggers this mission' },
            { step: 2, instruction: 'Practice that specific situation in training mode until it feels natural', cue: 'Match the training scenario to what actually happens in your games', goal: 'Execute the correct action 10 times in training' },
            { step: 3, instruction: 'Take it into 3 ranked or unranked matches with this as your only focus', cue: 'Don\'t worry about winning — only count completions of the mission objective', goal: 'Complete the mission objective at least once in a real match' },
        ];

        d.trainingTips = [
            'Focus on one habit at a time — trying to fix everything at once fixes nothing.',
            'Record yourself playing and watch for the specific situation this mission covers.',
            'If you\'re struggling, return to training mode and lower the stakes.',
        ];

        d.videoReferences = await this.findVideoReferences(gameId, ['pro_move', 'bad_habit']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    private resolveEventTypes(titleLower: string): string[] {
        for (const [key, events] of Object.entries(MISSION_EVENT_MAP)) {
            if (titleLower.includes(key)) return events;
        }
        return ['pro_move', 'bad_habit'];
    }

    private async findVideoReferences(gameId: string, eventTypes: string[]): Promise<any[]> {
        try {
            const recent = await this.analysisRepository.getRecentAnalyses(50, undefined, gameId);
            const refs: any[] = [];

            for (const analysis of recent) {
                if (!analysis.youtube_url) continue;
                const timeline = analysis.analysis?.timeline || [];
                const match = timeline.find((t: any) =>
                    eventTypes.some(et =>
                        t.event_type?.toLowerCase().includes(et) ||
                        t.description?.toLowerCase().includes(et)
                    )
                );
                if (match) {
                    const videoId = analysis.youtube_url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1];
                    if (videoId) {
                        refs.push({
                            title: `${(analysis as any).p1_character || analysis.analysis?.p1_character || 'P1'} vs ${(analysis as any).p2_character || analysis.analysis?.p2_character || 'P2'}`,
                            youtube_id: videoId,
                            timestamp: match.timestamp,
                            description: match.description,
                            coach_note: match.coach_advice,
                        });
                    }
                }
                if (refs.length >= 3) break;
            }
            return refs;
        } catch {
            return [];
        }
    }

    private async findScenarioExamples(gameId: string, eventTypes: string[]): Promise<any[]> {
        try {
            const scenarios = await (Scenario as any).find({
                game_id: gameId,
                tags: { $in: eventTypes },
            }).select('description context characters_involved spacing tags cross_patch_valid patch_version')
              .sort({ cross_patch_valid: -1, created_at: -1 })
              .limit(3)
              .lean();

            return scenarios.map((s: any) => ({
                matchup: s.characters_involved?.join(' vs ') || 'Unknown',
                situation: s.description,
                spacing: s.spacing,
                cross_patch_valid: s.cross_patch_valid,
                patch: s.patch_version,
            }));
        } catch {
            return [];
        }
    }
}
