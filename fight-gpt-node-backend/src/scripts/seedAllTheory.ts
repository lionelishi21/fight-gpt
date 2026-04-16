import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

import { Database } from "../config/database";
import { Logger } from "../helpers/logger";
import { TheoryDoc } from "../models/TheoryDocument";
import { MetaReport } from "../models/MetaReport";

// ──────────────────────────────────────────────────────────────────────────────
// SF6 — all 18 characters
// ──────────────────────────────────────────────────────────────────────────────
const SF6_THEORIES = [
    {
        theory_id: "sf6-ryu-theory",
        game_id: "sf6", character_id: "ryu", character_name: "Ryu",
        title: "SF6 Ryu: The Patient Strategist",
        summary: "Traditional fundamental gameplay remains Ryu strongest asset in SF6.",
        full_theory: "Ryu benefits from high single-hit damage and powerful fireball zoning. Use Denjin Charge to enhance Hadokens and Hashogekis for better frame data. Focus on spacing with st.HP and st.MK to force neutral mistakes. His Drive Impact punish off perfect parry is one of the highest-damage sequences in the game.",
        key_strengths: ["High damage punishes", "Excellent mid-range pokes", "Strong anti-air options"],
        key_weaknesses: ["Drive Impact vulnerability if overextending", "Linear gameplan readable at high level"],
        win_conditions: ["Corner carry via Drive Rush combos", "Perfect parry punish into CA"],
        counterplay: ["Neutral jump Hadokens", "Bait unsafe Tatsu on whiff"],
        confidence: "high" as const,
    },
    {
        theory_id: "sf6-ken-theory",
        game_id: "sf6", character_id: "ken", character_name: "Ken",
        title: "SF6 Ken: Relentless Corner Pressure",
        summary: "Ken dictates pace with best-in-class corner carry and layered Jinrai mixups.",
        full_theory: "Ken Jinrai kick series creates a genuine strike/throw dilemma at +2 to +4 advantage. Drive Rush st.HP is a top-tier neutral skip. His walk speed allows him to maintain the proper spacing for Dragonlash Kick hit-confirms. At high level, Ken wins by controlling drive gauge disparities — his offense drains the opponent gauge faster than almost anyone.",
        key_strengths: ["Best corner carry in the game", "Fast walk speed", "Jinrai mixup pressure"],
        key_weaknesses: ["Weaker fireballs than Ryu/Guile", "Drive gauge dependent for premium pressure"],
        win_conditions: ["Corner Jinrai 50/50", "Drive gauge advantage leading to punish"],
        counterplay: ["Interrupt slow Jinrai followups on reaction", "Parry Dragonlash on prediction"],
        confidence: "high" as const,
    },
    {
        theory_id: "sf6-chunli-theory",
        game_id: "sf6", character_id: "chunli", character_name: "Chun-Li",
        title: "SF6 Chun-Li: Stance Mastery and Frame Traps",
        summary: "Chun Serenity Stream stance unlocks offense inaccessible to most of the cast.",
        full_theory: "Chun-Li Serenity Stream adds an overhead and a low from stances that beat reversals clean. Her st.MK and cr.MK are among the best pokes in SF6. Kikoken-to-stance transitions pressure opponents to guess on wakeup. Advanced players use Stance Spin Kick as an anti-projectile, turning the zoning game entirely in her favor.",
        key_strengths: ["High-low stance overhead mixup", "Premier poke suite", "Strong anti-projectile tools"],
        key_weaknesses: ["Stance hits are reactable at long range by experienced players", "Low health pool"],
        win_conditions: ["Close-range stance pressure on wakeup", "Kikosho punish off perfect parry"],
        counterplay: ["Hold back to block overhead/low simultaneously when possible", "Drive Impact her recovery"],
        confidence: "high" as const,
    },
    {
        theory_id: "sf6-luke-theory",
        game_id: "sf6", character_id: "luke", character_name: "Luke",
        title: "SF6 Luke: Drive Rush Pressure King",
        summary: "Luke f.HP and Drive Rush extensions make him a relentless mid-range threat.",
        full_theory: "Luke f.HP is one of the best buttons in SF6 — huge range, massive damage on punish. Drive Rush f.HP creates a full-screen threat that forces opponents to respect every step forward. His Flash Knuckle as a reversal option and strong anti-air game make him well-rounded. The key to Luke is managing drive gauge — burn too much on Drive Rush and you lose your punish threat.",
        key_strengths: ["Long-range f.HP dominates neutral", "Solid anti-air with standing normals", "Flash Knuckle OD for reversals"],
        key_weaknesses: ["Drive gauge dependent for full offense", "Limited overhead options"],
        win_conditions: ["Drive Rush pressure sequences", "Corner combo damage with OD Flash Knuckle"],
        counterplay: ["Force Drive Rush whiffs and punish recovery", "Parry predictable f.HP approach"],
        confidence: "high" as const,
    },
    {
        theory_id: "sf6-jp-theory",
        game_id: "sf6", character_id: "jp", character_name: "JP",
        title: "SF6 JP: Portal Zoning and Ambiguous Okizeme",
        summary: "JP portal setups and Amnesia create the most confusing wakeup situations in SF6.",
        full_theory: "JP controls space with Departure and Arrival, placing portals at custom screen positions. His zoning is unparalleled at full screen but crumbles in close range. Advanced JP play revolves around teleport-to-meaty setups and Amnesia counter-hit confirms. His Torbalan super at -2 is designed to catch impatient close-range opponents.",
        key_strengths: ["Fullscreen portal zoning", "Ambiguous teleport wakeup", "Very high combo damage on counter hit"],
        key_weaknesses: ["Weak up-close tools", "Predictable at high level when portals are read"],
        win_conditions: ["Portal setups controlling opponent movement", "Amnesia bait into max damage punish"],
        counterplay: ["Walk in steadily, avoiding portal spacing", "Jump over projectiles and anti-air his recovery"],
        confidence: "high" as const,
    },
    {
        theory_id: "sf6-guile-theory",
        game_id: "sf6", character_id: "guile", character_name: "Guile",
        title: "SF6 Guile: Charge Zoning and Perfect Neutral Control",
        summary: "Guile Sonic Boom and Flash Kick define the tempo of every match.",
        full_theory: "Guile plays the slowest, most deliberate game in SF6. Sonic Boom windows force opponents to jump, leading into Flash Kick anti-airs. Drive Impact is less scary against Guile because he can react with a Boom from charge. His cr.MK is a defining poke at mid-range. The key Guile matchup concept: he loses when he runs out of charge.",
        key_strengths: ["Premier zoning game", "Excellent anti-air coverage", "High-damage corner combos off charge"],
        key_weaknesses: ["Weak when charge is depleted", "Slower movement than most cast"],
        win_conditions: ["Sonic Boom rhythm forcing predictable jumps", "Corner carry off charged Flash Kick punish"],
        counterplay: ["Stay grounded and walk forward to deny charge", "Drive Impact to close distance safely"],
        confidence: "high" as const,
    },
    {
        theory_id: "sf6-dhalsim-theory",
        game_id: "sf6", character_id: "dhalsim", character_name: "Dhalsim",
        title: "SF6 Dhalsim: Elastic Limb Control and Teleport Mixups",
        summary: "Dhalsim reach and teleport make him the most confusing character to approach.",
        full_theory: "Dhalsim Yoga Fire and extended normals control space at ranges where no other character can fight. The teleport-to-meaty setup is his most dangerous tool at high level. Players must respect his b.HP anti-air to prevent reckless jumping. His low health means single drive-gauge drop errors cost rounds.",
        key_strengths: ["Unmatched neutral range", "Teleport okizeme", "Yoga Catastrophe CA for corner lockdown"],
        key_weaknesses: ["Lowest health in game", "Weak when opponents get past limbs"],
        win_conditions: ["Limb spacing to dictate range", "Teleport to ambiguous wakeup"],
        counterplay: ["Identify teleport pattern and bait", "Drive Rush to close distance and negate limbs"],
        confidence: "high" as const,
    },
    {
        theory_id: "sf6-blanka-theory",
        game_id: "sf6", character_id: "blanka", character_name: "Blanka",
        title: "SF6 Blanka: Ball Charge Chaos and Wake-Up Ambiguity",
        summary: "Blanka-chan doll setups and unpredictable ball angles keep opponents guessing.",
        full_theory: "Blanka Blanka-chan Doll placed before a knockdown creates simultaneous pressure at multiple screen positions. His hop cancel game in drive rush allows him to bypass fireballs and close space quickly. Rolling Attack charged variants punish specific incorrect blocks. His overall game is about timing confusion — making the opponent guess on defense.",
        key_strengths: ["Doll setup pressure", "Rolling attack pressure variants", "Strong anti-fireball movement"],
        key_weaknesses: ["Predictable win conditions at top level", "Weak at neutral without doll setups"],
        win_conditions: ["Doll + knockdown leading to 50/50", "Electric Thunder on oki for reversal bait"],
        counterplay: ["Destroy dolls early", "Parry his rolling attack patterns"],
        confidence: "medium" as const,
    },
    {
        theory_id: "sf6-ehonda-theory",
        game_id: "sf6", character_id: "ehonda", character_name: "E. Honda",
        title: "SF6 E. Honda: Headbutt Pressure and Sumo Rush",
        summary: "Honda Headbutt is the best horizontal charge move in the game.",
        full_theory: "E. Honda Tsuranami Headbutt goes through projectiles and punishes fireballs from nearly full screen. His Sumo Smash creates tricky cross-up and deep ambiguity on wakeup. The Hundred Hand Slap on plus frames creates a block string that is hard to escape. Honda wins neutral with Headbutt threat and wins oki with Sumo Smash ambiguity.",
        key_strengths: ["Projectile immunity on Headbutt", "Oki ambiguity", "Strong meterless damage"],
        key_weaknesses: ["Short effective poke range", "Predictable gameplan after charge loss"],
        win_conditions: ["Headbutt to punish zoners", "Cross-up Sumo Smash on wakeup"],
        counterplay: ["Walk forward slowly denying charge", "Air-to-air Honda jump-ins"],
        confidence: "medium" as const,
    },
    {
        theory_id: "sf6-zangief-theory",
        game_id: "sf6", character_id: "zangief", character_name: "Zangief",
        title: "SF6 Zangief: Armor and SPD Dominance",
        summary: "Zangief armored options make him the most difficult character to zone out.",
        full_theory: "Zangief Lariat has armor and hits aerial opponents, making it an anti-air, reversal, and approach tool simultaneously. His SPD range is deceptively large. Drive Impact armor layered on top of natural Lariat armor makes him exceptionally hard to keep out in SF6. The key: once Gief is in and opponent is respecting SPD, he wins.",
        key_strengths: ["Armored Lariat threatening in multiple situations", "Largest SPD grab range", "Great against armor-reliant characters"],
        key_weaknesses: ["Slow movement", "Struggles at long range without approach tools"],
        win_conditions: ["Lariat to close space under zoning", "SPD after conditioning opponents to respect buttons"],
        counterplay: ["Keep out with max-range pokes", "Jump over Lariat on read"],
        confidence: "high" as const,
    },
    {
        theory_id: "sf6-cammy-theory",
        game_id: "sf6", character_id: "cammy", character_name: "Cammy",
        title: "SF6 Cammy: Fast Dive Kick Pressure",
        summary: "Cammy Spiral Arrow and Cannon Spike give her unmatched air-to-ground threat.",
        full_theory: "Cammy Spiral Arrow is a low-hitting fast approach tool that beats crouching opponents. Cannon Spike is the most reliable anti-air in SF6. Her jump arc is shallow and fast, making her Cannon Strike dive kick ambiguous on oki. The ideal Cammy gameplan is to drive rush into cr.HP and confirm into Spiral Arrow for corner position.",
        key_strengths: ["Fast dive kick ambiguity", "Best DP anti-air in Cannon Spike", "Low Spiral Arrow beats crouch tech"],
        key_weaknesses: ["Short range normals outside of Drive Rush", "Combo damage below average without Drive Gauge"],
        win_conditions: ["Cannon Strike dive kick 50/50", "Corner Spiral Arrow looped combos"],
        counterplay: ["Stay grounded vs dive kick threat", "Parry Spiral Arrow approach on read"],
        confidence: "high" as const,
    },
    {
        theory_id: "sf6-marisa-theory",
        game_id: "sf6", character_id: "marisa", character_name: "Marisa",
        title: "SF6 Marisa: Maximum Damage Punishes",
        summary: "Marisa has the highest single-hit punish damage in the entire game.",
        full_theory: "Marisa st.HP and f.HP are behemoth normals with huge range and massive damage. Her Quadriga charge super confirms from nearly any situation for maximum damage. Scutum shield stance absorbs one hit and turns defense into offense. At high level, players fear making mistakes against Marisa because punish windows deal 40%+ health routinely.",
        key_strengths: ["Highest punish damage in the game", "Large hitbox normals", "Scutum shield to reverse momentum"],
        key_weaknesses: ["Slowest walk speed in the game", "Easy to keep out with fast pokes"],
        win_conditions: ["Fish for counter hits with f.HP", "Scutum bait into full punish"],
        counterplay: ["Keep distance with fast pokes", "Avoid predictable patterns Scutum absorbs"],
        confidence: "high" as const,
    },
    {
        theory_id: "sf6-lily-theory",
        game_id: "sf6", character_id: "lily", character_name: "Lily",
        title: "SF6 Lily: Wind Gauge Whirlwind Pressure",
        summary: "Lily Wind Gauge pressures opponents with a charging overhead dive kick threat.",
        full_theory: "Lily Wind Gauge charges from blocked moves and landing Condor Wind. At full Wind, her Condor Dive dive kick is a dominant corner carry and overhead tool. Tomahawk Buster is a reversal and anti-air in one. Her strategy revolves around building wind while staying safe and spending it on 50/50 overhead/low mixups.",
        key_strengths: ["Wind Gauge creates free overhead pressure", "Condor Dive corner carry", "Safe Tomahawk Buster reversal"],
        key_weaknesses: ["Weakest drive gauge dependent character", "Low health"],
        win_conditions: ["Full wind + knockdown leading to Condor Dive 50/50", "Corner carry via repeated Tomahawk"],
        counterplay: ["Deny wind buildup by whiff punishing Condor Wind", "Anti-air Condor Dive on jump-in angle"],
        confidence: "medium" as const,
    },
    {
        theory_id: "sf6-juri-theory",
        game_id: "sf6", character_id: "juri", character_name: "Juri",
        title: "SF6 Juri: Fuhajin Stock Management",
        summary: "Juri stored Fuha stocks add mid-combo mixup layers impossible for other characters.",
        full_theory: "Juri stores Fuha stocks from her Fuhajin move and spends them for different attack angles during combos. A stocked Juri can change the ender of a juggle combo to a low, overhead, or mid depending on opponent defensive tendencies. Her cr.MK is one of the best low pokes in the game. At high level, Juri wins by conditioning opponents to guess wrong on stored Fuha.",
        key_strengths: ["In-combo mixup with stored stocks", "Excellent low cr.MK poke", "Good anti-air with j.HP"],
        key_weaknesses: ["No stocks means standard, predictable combos", "Short range without Drive Rush"],
        win_conditions: ["Build stocks and spend in combos for unexpected overhead", "Drive Rush cr.MK frame trap pressure"],
        counterplay: ["Destroy her stock building by whiff punishing Fuhajin", "Hold high and low simultaneously at range"],
        confidence: "high" as const,
    },
    {
        theory_id: "sf6-manon-theory",
        game_id: "sf6", character_id: "manon", character_name: "Manon",
        title: "SF6 Manon: Medal Stacking and Grounded Command Throw",
        summary: "Every successful grab builds Manon medal count, escalating her damage exponentially.",
        full_theory: "Manon Renverse command grab at +1 to +3 advantage frames means conditioning opponents to not throw-tech costs them the round. Degagee is a high-damage rekka chain. Each successful command throw adds a medal — at 5 medals her damage output rivals Marisa. The core Manon gameplan: put opponent in corners and cycle Degagee pressure into Renverse to build medals.",
        key_strengths: ["Medal stacking exponential damage", "Command throw at plus frames", "Fast Degagee rekka approach"],
        key_weaknesses: ["Weak neutral at long range", "Vulnerable to Drive Reversal interrupting plus-frame pressure"],
        win_conditions: ["Stack 5 medals via corner command grabs", "Degagee into triple rekka pressure on block"],
        counterplay: ["Drive Reversal on block to interrupt Degagee strings", "Jump away from command throw range"],
        confidence: "medium" as const,
    },
    {
        theory_id: "sf6-dee-jay-theory",
        game_id: "sf6", character_id: "deejay", character_name: "Dee Jay",
        title: "SF6 Dee Jay: Air Slasher Zoning to Oki",
        summary: "Dee Jay low-hitting Air Slasher and Dread Kicks pressure blend zoning and strike/throw.",
        full_theory: "Dee Jay Air Slasher hits low and beats crouching characters — a rare projectile property. Dread Kicks series creates plus frames on block for strike/throw. His Dance move creates crowd control with rhythm stagger. Top Dee Jay play uses Air Slasher to maintain correct spacing, then Drive Rush in on a favorable exchange.",
        key_strengths: ["Low-hitting Air Slasher beats crouch block", "Dread Kicks plus frames", "Good CA confirms from many situations"],
        key_weaknesses: ["Weaker anti-air than top cast", "Dance move committal"],
        win_conditions: ["Air Slasher into approach on whiff punish", "Dread Kicks plus frame conditioning"],
        counterplay: ["Jump Air Slasher from full screen", "Parry or Drive Impact his Dread Kicks timing"],
        confidence: "medium" as const,
    },
    {
        theory_id: "sf6-aki-theory",
        game_id: "sf6", character_id: "aki", character_name: "A.K.I.",
        title: "SF6 A.K.I.: Poison Stack and Unique Crawl Threat",
        summary: "AKI poison mechanic creates a ticking clock that forces reckless offensive decisions.",
        full_theory: "A.K.I. applies poison with several normals and specials. Once poisoned, the opponent takes passive chip damage and increased combo damage. Her crawl movement bypasses common defensive ranges. Shiyu Claw is a long-range command grab. At high level, AKI uses poison application as a win condition — opponents must become aggressive to stop bleeding health.",
        key_strengths: ["Poison chip damage changes match tempo", "Crawl bypasses normal spacing", "Command grab at distance"],
        key_weaknesses: ["Complex execution requirements", "Low health"],
        win_conditions: ["Apply poison early and maintain pressure", "Shiyu Claw punish on poison-scared opponent"],
        counterplay: ["Anti-air her crawl approach aggressively", "Never let poison stack — play more aggressively early"],
        confidence: "medium" as const,
    },
    {
        theory_id: "sf6-rashid-theory",
        game_id: "sf6", character_id: "rashid", character_name: "Rashid",
        title: "SF6 Rashid: Tornado Pressure and Cross-Up Loops",
        summary: "Rashid Eagle Spike dive and Rolling Assault create the most mobile offense in SF6.",
        full_theory: "Rashid Whirlwind Shot creates tornados that act as moving projectiles — changing spacing mid-screen. Eagle Spike dive kick from neutral jump is extremely fast and crosses up on specific spacings. Rolling Assault loops create corner pressure that resets to the same ambiguous spot. He is the hardest character to defend against at close range due to mobility.",
        key_strengths: ["Moving tornado projectiles", "Eagle Spike cross-up", "Best mobility in game"],
        key_weaknesses: ["Lowest overall damage", "Requires perfect execution for maximum loops"],
        win_conditions: ["Tornado control to get corner", "Eagle Spike ambiguous cross-up on knockdown"],
        counterplay: ["Destroy tornados immediately with normals", "Hold up-back vs Eagle Spike on reaction"],
        confidence: "medium" as const,
    },
];

// ──────────────────────────────────────────────────────────────────────────────
// TEKKEN 8 — top characters
// ──────────────────────────────────────────────────────────────────────────────
const TEKKEN8_THEORIES = [
    {
        theory_id: "t8-jin-theory",
        game_id: "tekken8", character_id: "jin", character_name: "Jin Kazama",
        title: "T8 Jin: Heat Dash and Balanced Fundamentals",
        summary: "Jin balanced toolkit makes him the benchmark character of Tekken 8.",
        full_theory: "Jin Kazama combines Mishima wavedash mixup potential with Classical Karate normals. His Heat Engage via Glorious Demon Fist enables a powerful oki game. Demon Paw (ws+2) is a key launcher at wall. At Heat, his f+4 becomes a tracking mid that leads to full combo. Jin wins by methodical wall carry and well-timed Heat Engage timing.",
        key_strengths: ["Balanced risk/reward toolkit", "Strong wall carry in Heat", "Demon Paw punish threat"],
        key_weaknesses: ["Requires EWGF for ceiling-tier play", "Below-average keepout pokes"],
        win_conditions: ["Wall carry combo via Heat Dash", "Punish slow recovery with Demon Paw"],
        counterplay: ["Sidestep right to avoid Demon Paw tracking", "Keep distance from Heat activation range"],
        confidence: "high" as const,
    },
    {
        theory_id: "t8-kazuya-theory",
        game_id: "tekken8", character_id: "kazuya", character_name: "Kazuya Mishima",
        title: "T8 Kazuya: Electric and Hellsweep 50/50",
        summary: "EWGF consistency separates average Kazuya from elite.",
        full_theory: "Kazuya EWGF (Electric Wind God Fist) is +12 on block and launches on hit — it defines his entire neutral game. Hellsweep creates a low/launcher 50/50 at close range. Devil Jin switch in some combos provides unique okizeme. At the highest level, a Kazuya who lands consistent EWGFs is one of the most dominant characters in T8.",
        key_strengths: ["EWGF +12 on block and launches on hit", "Hellsweep 50/50", "Devil Fist approach speed"],
        key_weaknesses: ["Below-average results without EWGF consistency", "Punishable on most failed 50/50 options"],
        win_conditions: ["Consistent EWGF neutral dominance", "Hellsweep 50/50 at close range"],
        counterplay: ["Step right to avoid Hellsweep tracking", "Long range pokes to deny EWGF range"],
        confidence: "high" as const,
    },
    {
        theory_id: "t8-dragunov-theory",
        game_id: "tekken8", character_id: "dragunov", character_name: "Sergei Dragunov",
        title: "T8 Dragunov: Extreme Damage and Versatile Punish",
        summary: "Dragunov has the highest consistent damage and best punish game in Tekken 8.",
        full_theory: "Dragunov Tornado (b+3) in Heat combos extends wall carry to maximum lengths. His f+2 is a tracking mid that combos on counter hit. Reverse-grip throws create unique animations that are hard to break on reaction. At range, his 1,2,3 poke series is safe on block and leads to mix on hit. He wins by converting any touch into maximum wall damage.",
        key_strengths: ["Highest combo damage in T8", "Strong punish variety", "Tracking mid for evasive opponents"],
        key_weaknesses: ["Somewhat predictable gameplan", "Weaker at long range"],
        win_conditions: ["Convert any launch into wall break for 80%+ damage", "f+2 counter hit into max combo"],
        counterplay: ["Sidestep left to avoid f+2 tracking", "Stay at range to deny his close combat"],
        confidence: "high" as const,
    },
    {
        theory_id: "t8-nina-theory",
        game_id: "tekken8", character_id: "nina", character_name: "Nina Williams",
        title: "T8 Nina: Tekken Premier Aggressive Rushdown",
        summary: "Nina multi-throw mixups and fast strings create the most overwhelming close-range offense.",
        full_theory: "Nina 1+3 and 2+4 throw branches into 11 different outcomes — her throw game is mechanically the deepest in Tekken 8. Her b+1 is a safe mid with good range. She can chain combos into ground throw situations for guaranteed damage. Advanced Nina uses 15-frame punisher d/f+2 and chains into FC gameplan for constant pressure.",
        key_strengths: ["Deepest throw mixup in T8", "Fast strings in close range", "Good floor movement pressure"],
        key_weaknesses: ["Throw game largely guessing at higher levels", "Below average defensive options"],
        win_conditions: ["Throw mixup conditioning into combo confirms", "b+1 mid pressure into frame traps"],
        counterplay: ["Mash throw break on wakeup", "Keep distance to deny her close-range specialty"],
        confidence: "high" as const,
    },
    {
        theory_id: "t8-hwoarang-theory",
        game_id: "tekken8", character_id: "hwoarang", character_name: "Hwoarang",
        title: "T8 Hwoarang: Stance-Heavy Kick Rushdown",
        summary: "Hwoarang stance-to-stance transitions create overwhelming kick-based pressure.",
        full_theory: "Hwoarang Right Foot Forward (RFF) and Left Foot Forward (LFF) stances transition mid-string. The key is alternating which stance outputs pressure so opponents cannot react to the specific launching kick. His b+3 in Flamingo stance is an unbreakable launch. Heat Engage from his strings extends pressure for free. He wins by stance transition timing confusion.",
        key_strengths: ["Stance transition kick pressure", "Unbreakable Flamingo launch", "Good Heat system synergy"],
        key_weaknesses: ["Stance entries can be low crushed", "Requires high execution"],
        win_conditions: ["RFF to LFF transition pressure into launcher", "Heat Dash oki in stance guessing range"],
        counterplay: ["Low crush during stance entry", "Sidestep left from RFF strings"],
        confidence: "medium" as const,
    },
    {
        theory_id: "t8-reina-theory",
        game_id: "tekken8", character_id: "reina", character_name: "Reina",
        title: "T8 Reina: Mishima Mixup and Safe High Crush",
        summary: "Reina combines Mishima wavedash with unique stances for novel 50/50 situations.",
        full_theory: "Reina Sentai stance transitions mid-string create ambiguous strike/throw mixups. Her wavedash approach mirrors Kazuya but branches into stance-specific launchers. Raijin stance f+1+2 is a safe armored mid — one of the best defensive options in the game. She is a newer character with high carry potential at the wall.",
        key_strengths: ["Sentai stance mixup variety", "Safe armored Raijin options", "Good wall combo damage"],
        key_weaknesses: ["Stance options reactable at highest levels", "Requires good Mishima fundamentals baseline"],
        win_conditions: ["Sentai stance 50/50 at wall carry", "Raijin armor to absorb and counter"],
        counterplay: ["React to Sentai stance entry and launch punish", "Delay pressure to bait Raijin armor"],
        confidence: "medium" as const,
    },
];

// ──────────────────────────────────────────────────────────────────────────────
// GUILTY GEAR STRIVE — top characters
// ──────────────────────────────────────────────────────────────────────────────
const GGST_THEORIES = [
    {
        theory_id: "ggst-sol-theory",
        game_id: "ggst", character_id: "sol", character_name: "Sol Badguy",
        title: "GGST Sol: Wild Assault and Corner Dominance",
        summary: "Sol Wild Assault makes his pressure nearly inescapable once he reaches the corner.",
        full_theory: "Sol Night Raid Vortex and Gun Flame control horizontal space while he advances. Bandit Bringer overhead + low options create 50/50 at advantage. Wild Assault is his key neutral tool — absorbs one hit and keeps him mobile. In the corner, Volcanic Viper reversal and pressure with f.S and 2S creates very high incoming damage windows.",
        key_strengths: ["Wild Assault armored approach", "Corner pressure dominance", "Good anti-air with 6P"],
        key_weaknesses: ["Weak at max screen zoning", "Slower than mix-focused characters"],
        win_conditions: ["Corner position via Wild Assault pressure", "Bandit Bringer 50/50 on wakeup"],
        counterplay: ["Deflect Shield to absorb Wild Assault", "Instant air dash over his screen-level projectiles"],
        confidence: "high" as const,
    },
    {
        theory_id: "ggst-nagoriyuki-theory",
        game_id: "ggst", character_id: "nagoriyuki", character_name: "Nagoriyuki",
        title: "GGST Nagoriyuki: Blood Gauge Management and Explosive Damage",
        summary: "Nagoriyuki Blood Gauge mechanic rewards aggressive play with massive damage.",
        full_theory: "Nagoriyuki special moves build Blood Gauge. At full blood, Blood Rage activates — temporary super mode with enhanced damage. The core gameplay loop is building to Blood Rage safely and maximizing the damage window. His Fukyo forward movement is one of the best approach tools in Strive. 5H is a dominant poke that leads to high damage.",
        key_strengths: ["Blood Rage explosive damage window", "Fukyo movement control", "Large hitbox normals"],
        key_weaknesses: ["Blood gauge management is execution-intensive", "Punishable when Blood Rage ends at bad timing"],
        win_conditions: ["Blood Rage activation into high damage combo", "Fukyo pressure in corner"],
        counterplay: ["Let Blood Rage expire safely — avoid getting hit during it", "Bait Fukyo and punish recovery"],
        confidence: "high" as const,
    },
    {
        theory_id: "ggst-happychaos-theory",
        game_id: "ggst", character_id: "happychaos", character_name: "Happy Chaos",
        title: "GGST Happy Chaos: Bullet Management Zoning",
        summary: "Happy Chaos controls match tempo through precise bullet and Focus management.",
        full_theory: "Happy Chaos gun manages a bullet count — reload is punishable. The key skill is knowing when bullets can be spent for guaranteed damage vs when to conserve for critical moments. Scapegoat creates an invulnerable clone that takes one hit. At high level, Happy Chaos never reloads when opponent has an opportunity to punish.",
        key_strengths: ["Long-range gun confirms", "Scapegoat defensive tool", "High combo damage with full Focus"],
        key_weaknesses: ["Reload window is fully punishable", "Below average without gun management"],
        win_conditions: ["Bullet management — never reload unsafe", "Focus gauge maximization for confirms"],
        counterplay: ["Force reload by dodging bullets", "Rush in during reload animation"],
        confidence: "high" as const,
    },
    {
        theory_id: "ggst-ramlethal-theory",
        game_id: "ggst", character_id: "ramlethal", character_name: "Ramlethal Valentine",
        title: "GGST Ramlethal: Sword Deployment Range Control",
        summary: "Ramlethal deployed swords extend her threat range far beyond any other character.",
        full_theory: "Ramlethal can deploy two giant swords that orbit her and extend her hitbox reach dramatically. Mortobato is an enormous sweep. With both swords deployed, her pressure coverage is unmatched in Strive. The key skill is deploying and managing sword positions while fighting. Without swords, she has standard range — deploying them changes her gameplan entirely.",
        key_strengths: ["Sword deployment range extension", "Mortobato sweep controlling ground space", "Strong corner combo damage"],
        key_weaknesses: ["Swords can be countered if depleted", "Complex sword management"],
        win_conditions: ["Deploy swords early and maintain them", "Corner carry into extended reach combos"],
        counterplay: ["Instant air dash to go over sword level", "Bait sword attacks and punish during recovery"],
        confidence: "medium" as const,
    },
];

// ──────────────────────────────────────────────────────────────────────────────
// MK1 — top characters
// ──────────────────────────────────────────────────────────────────────────────
const MK1_THEORIES = [
    {
        theory_id: "mk1-johnny-theory",
        game_id: "mk1", character_id: "johnny", character_name: "Johnny Cage",
        title: "MK1 Johnny Cage: Plus Frames and Kameo Lockdown",
        summary: "Johnny Shadow Kick and Stunt Double make him MK1 best pressure character.",
        full_theory: "Johnny Cage Shadow Kick is plus on block at close range — the foundation of his pressure game. Stunt Double clone triggers on specific conditions for ambiguous cross-up setups. With Kano or Stryker as Kameo, he extends blockstrings into full screen chip damage. His uppercut arc is fast and beats most air approaches.",
        key_strengths: ["Plus-frame Shadow Kick", "Stunt Double clone ambiguity", "Strong anti-air uppercut"],
        key_weaknesses: ["Kameo dependent for full lockdown", "Predictable without Kameo"],
        win_conditions: ["Shadow Kick into Kameo chip extension", "Stunt Double cross-up on wakeup"],
        counterplay: ["Upblock Kameo attacks during lockdown", "Punish blocked Shadow Kick at max range"],
        confidence: "high" as const,
    },
    {
        theory_id: "mk1-liu-kang-theory",
        game_id: "mk1", character_id: "liukang", character_name: "Liu Kang",
        title: "MK1 Liu Kang: Dragon Fire Zoning and Bike Kick Punish",
        summary: "Liu Kang fundamental strong toolkit makes him the most consistent character in MK1.",
        full_theory: "Liu Kang Low Dragon Fire (low projectile) and regular Dragon Fire cover both air and ground zoning simultaneously. Bicycle Kick is his punish tool — safe on block and leads to combo. Kameo synergy with Cyrax allows Liu Kang net setups for guaranteed oki. He is the best character to learn MK1 fundamentals with and remains top tier at high level.",
        key_strengths: ["Dual-level Dragon Fire coverage", "Safe Bike Kick punisher", "Strong Kameo synergy"],
        key_weaknesses: ["Lacks advanced ambiguity of newer characters", "Kameo dependent for full damage"],
        win_conditions: ["Dragon Fire to dictate screen position", "Bike Kick punish into Kameo combo extension"],
        counterplay: ["Jump over Low Dragon Fire on reaction", "Wake-up against predictable oki"],
        confidence: "high" as const,
    },
    {
        theory_id: "mk1-sindel-theory",
        game_id: "mk1", character_id: "sindel", character_name: "Sindel",
        title: "MK1 Sindel: Scream Pressure and Air Mobility",
        summary: "Sindel scream series and flying combos make her the most aggressive character in MK1.",
        full_theory: "Sindel Scream projectile has several charge levels with different recovery and properties. Her run allows follow-up pressure. Air Scream harasses opponents trying to escape with jumps. Her Hair Whip command grab punishes opponents trying to duck her high scream. She plays fast and overwhelming — finding the right scream timing is the key skill.",
        key_strengths: ["Multi-level Scream pressure", "Air mobility", "Command grab to punish ducking"],
        key_weaknesses: ["Linear offense at ground level", "Below average corner damage"],
        win_conditions: ["Scream timing conditioning into command grab", "Air Scream to win air space"],
        counterplay: ["Reflect Scream projectile to punish", "Stay close and upblock vs air approaches"],
        confidence: "medium" as const,
    },
];

// ──────────────────────────────────────────────────────────────────────────────
// Meta report tier list expansions
// ──────────────────────────────────────────────────────────────────────────────
const META_UPDATES = [
    {
        report_id: "sf6-meta-initial",
        tier_list: [
            { character_id: "ken", character_name: "Ken", usage_count: 620, win_count: 341, win_rate: 55, trend: "stable" as const, top_strategies: ["Jinrai pressure", "Drive Rush extensions"] },
            { character_id: "luke", character_name: "Luke", usage_count: 510, win_count: 276, win_rate: 54, trend: "rising" as const, top_strategies: ["f.HP neutral dominance", "Drive Rush corner carry"] },
            { character_id: "chunli", character_name: "Chun-Li", usage_count: 430, win_count: 236, win_rate: 55, trend: "rising" as const, top_strategies: ["Stance overhead mixup", "Perfect parry punish"] },
            { character_id: "cammy", character_name: "Cammy", usage_count: 390, win_count: 210, win_rate: 54, trend: "stable" as const, top_strategies: ["Cannon Strike dive kick 50/50", "Spiral Arrow corner loop"] },
            { character_id: "jp", character_name: "JP", usage_count: 360, win_count: 183, win_rate: 51, trend: "falling" as const, top_strategies: ["Portal setups", "Amnesia counter hits"] },
            { character_id: "guile", character_name: "Guile", usage_count: 310, win_count: 164, win_rate: 53, trend: "stable" as const, top_strategies: ["Sonic Boom rhythm", "Flash Kick corner punish"] },
            { character_id: "ryu", character_name: "Ryu", usage_count: 490, win_count: 255, win_rate: 52, trend: "stable" as const, top_strategies: ["Perfect parry into CA", "Denjin Hadoken zoning"] },
            { character_id: "marisa", character_name: "Marisa", usage_count: 280, win_count: 148, win_rate: 53, trend: "rising" as const, top_strategies: ["f.HP punish damage", "Scutum bait punish"] },
            { character_id: "juri", character_name: "Juri", usage_count: 320, win_count: 166, win_rate: 52, trend: "stable" as const, top_strategies: ["In-combo Fuha stock mixup", "cr.MK pressure"] },
        ],
        trending_characters: { rising: ["Chun-Li", "Luke", "Marisa"], falling: ["JP", "Blanka"] },
    },
    {
        report_id: "tekken8-meta-initial",
        tier_list: [
            { character_id: "jin", character_name: "Jin Kazama", usage_count: 700, win_count: 364, win_rate: 52, trend: "stable" as const, top_strategies: ["Heat Dash wall carry", "Demon Paw punish"] },
            { character_id: "dragunov", character_name: "Dragunov", usage_count: 580, win_count: 313, win_rate: 54, trend: "rising" as const, top_strategies: ["Tornado heat extension", "f+2 counter hit"] },
            { character_id: "kazuya", character_name: "Kazuya", usage_count: 420, win_count: 214, win_rate: 51, trend: "rising" as const, top_strategies: ["EWGF consistency", "Hellsweep 50/50"] },
            { character_id: "nina", character_name: "Nina Williams", usage_count: 380, win_count: 196, win_rate: 52, trend: "stable" as const, top_strategies: ["Throw mixup conditioning", "b+1 pressure"] },
            { character_id: "hwoarang", character_name: "Hwoarang", usage_count: 340, win_count: 173, win_rate: 51, trend: "falling" as const, top_strategies: ["Flamingo stance launch", "RFF to LFF transition"] },
            { character_id: "reina", character_name: "Reina", usage_count: 310, win_count: 158, win_rate: 51, trend: "rising" as const, top_strategies: ["Sentai stance 50/50", "Raijin armor"] },
        ],
        trending_characters: { rising: ["Dragunov", "Kazuya", "Reina"], falling: ["Hwoarang"] },
    },
];

async function seedAll() {
    try {
        await Database.connect();
        Logger.info("Connected to DB. Seeding theory documents...");

        const allTheories = [...SF6_THEORIES, ...TEKKEN8_THEORIES, ...GGST_THEORIES, ...MK1_THEORIES];

        let upserted = 0;
        for (const t of allTheories) {
            await TheoryDoc.findOneAndUpdate(
                { theory_id: t.theory_id },
                { ...t, type: "character", source_scenario_count: 30, generated_at: new Date() },
                { upsert: true, new: true }
            );
            upserted++;
            Logger.info(`  Upserted: ${t.character_name} (${t.game_id})`);
        }

        Logger.info(`Upserted ${upserted} theory documents.`);

        for (const update of META_UPDATES) {
            const result = await MetaReport.findOneAndUpdate(
                { report_id: update.report_id },
                { $set: { tier_list: update.tier_list, trending_characters: update.trending_characters, updated_at: new Date() } }
            );
            if (result) {
                Logger.info(`Updated meta report: ${update.report_id}`);
            }
        }

        Logger.info("=== Seed complete ===");
        Logger.info(`  SF6: ${SF6_THEORIES.length} character theories`);
        Logger.info(`  Tekken 8: ${TEKKEN8_THEORIES.length} character theories`);
        Logger.info(`  GGST: ${GGST_THEORIES.length} character theories`);
        Logger.info(`  MK1: ${MK1_THEORIES.length} character theories`);
        Logger.info(`  Total: ${allTheories.length} theory documents`);

        await Database.disconnect();
        process.exit(0);
    } catch (error) {
        Logger.error("Seed failed", error);
        process.exit(1);
    }
}

seedAll();
