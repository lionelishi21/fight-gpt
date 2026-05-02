"use strict";
/**
 * Character Encyclopedia Data Validation Script
 * Validates CharacterEncyclopedia documents for data integrity
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAllDocuments = validateAllDocuments;
exports.validateDocument = validateDocument;
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("../config/database");
const CharacterEncyclopedia_1 = require("../models/CharacterEncyclopedia");
const logger_1 = require("../helpers/logger");
// Load environment variables
dotenv_1.default.config();
/**
 * Validate a single CharacterEncyclopedia document
 */
function validateDocument(doc) {
    const errors = [];
    const warnings = [];
    // Required fields
    if (!doc.game_id)
        errors.push('Missing game_id');
    if (!doc.character_id)
        errors.push('Missing character_id');
    if (!doc.patch_version)
        errors.push('Missing patch_version');
    if (!doc.moveset)
        errors.push('Missing moveset');
    if (!doc.game_rules)
        errors.push('Missing game_rules');
    // Validate moveset structure
    if (doc.moveset) {
        if (!Array.isArray(doc.moveset.normals))
            errors.push('moveset.normals must be an array');
        if (!Array.isArray(doc.moveset.specials))
            errors.push('moveset.specials must be an array');
        if (!Array.isArray(doc.moveset.ex_moves))
            errors.push('moveset.ex_moves must be an array');
        if (!Array.isArray(doc.moveset.supers))
            errors.push('moveset.supers must be an array');
        // Validate moves
        const allMoves = [
            ...(doc.moveset.normals || []),
            ...(doc.moveset.specials || []),
            ...(doc.moveset.ex_moves || []),
            ...(doc.moveset.supers || []),
        ];
        allMoves.forEach((move, index) => {
            if (!move.name)
                errors.push(`Move ${index} missing name`);
            if (!move.input)
                errors.push(`Move ${index} (${move.name || 'unknown'}) missing input`);
            if (!move.how_to_perform)
                errors.push(`Move ${index} (${move.name || 'unknown'}) missing how_to_perform`);
            if (!move.category)
                errors.push(`Move ${index} (${move.name || 'unknown'}) missing category`);
            if (!move.frame_data) {
                errors.push(`Move ${index} (${move.name || 'unknown'}) missing frame_data`);
            }
            else {
                if (move.frame_data.startup === undefined) {
                    errors.push(`Move ${index} (${move.name || 'unknown'}) frame_data missing startup`);
                }
                if (move.frame_data.active === undefined) {
                    errors.push(`Move ${index} (${move.name || 'unknown'}) frame_data missing active`);
                }
                if (move.frame_data.recovery === undefined) {
                    errors.push(`Move ${index} (${move.name || 'unknown'}) frame_data missing recovery`);
                }
                if (move.frame_data.on_block === undefined) {
                    errors.push(`Move ${index} (${move.name || 'unknown'}) frame_data missing on_block`);
                }
            }
        });
        // Warnings
        if (allMoves.length === 0)
            warnings.push('No moves found in moveset');
        if (doc.moveset.normals.length === 0)
            warnings.push('No normals found');
        if (doc.moveset.specials.length === 0)
            warnings.push('No specials found');
    }
    // Validate game_rules structure
    if (doc.game_rules) {
        if (!Array.isArray(doc.game_rules)) {
            errors.push('game_rules must be an array');
        }
        else {
            doc.game_rules.forEach((rule, index) => {
                if (!rule.key)
                    errors.push(`Game rule ${index} missing key`);
                if (rule.value === undefined || rule.value === null) {
                    errors.push(`Game rule ${index} (${rule.key || 'unknown'}) missing value`);
                }
                if (!rule.ui_type)
                    errors.push(`Game rule ${index} (${rule.key || 'unknown'}) missing ui_type`);
            });
            if (doc.game_rules.length === 0)
                warnings.push('No game rules found');
        }
    }
    // Check for legacy system_mechanics (should be migrated)
    const docAny = doc;
    if (docAny.system_mechanics && Array.isArray(docAny.system_mechanics) && docAny.system_mechanics.length > 0) {
        warnings.push('Document still has system_mechanics field (should be migrated to game_rules)');
    }
    // Validate character_id format (should be lowercase with underscores)
    if (doc.character_id && doc.character_id !== doc.character_id.toLowerCase()) {
        warnings.push(`character_id should be lowercase: "${doc.character_id}"`);
    }
    // Validate game_id format (should be lowercase)
    if (doc.game_id && doc.game_id !== doc.game_id.toLowerCase()) {
        warnings.push(`game_id should be lowercase: "${doc.game_id}"`);
    }
    return {
        documentId: doc._id.toString(),
        gameId: doc.game_id,
        characterId: doc.character_id,
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}
/**
 * Validate all CharacterEncyclopedia documents
 */
async function validateAllDocuments() {
    try {
        logger_1.Logger.info('Starting Character Encyclopedia validation...');
        // Connect to database
        await database_1.Database.connect();
        logger_1.Logger.info('Database connected');
        // Find all documents
        const documents = await CharacterEncyclopedia_1.CharacterEncyclopedia.find({});
        logger_1.Logger.info(`Found ${documents.length} documents to validate`);
        if (documents.length === 0) {
            logger_1.Logger.warn('No documents found to validate');
            await database_1.Database.disconnect();
            return;
        }
        const results = [];
        let validCount = 0;
        let invalidCount = 0;
        let totalErrors = 0;
        let totalWarnings = 0;
        for (const doc of documents) {
            const result = validateDocument(doc);
            results.push(result);
            if (result.isValid) {
                validCount++;
            }
            else {
                invalidCount++;
                totalErrors += result.errors.length;
            }
            totalWarnings += result.warnings.length;
        }
        // Print results
        console.log('\n' + '='.repeat(60));
        console.log('📊 Validation Results\n');
        console.log(`Total Documents: ${documents.length}`);
        console.log(`✅ Valid: ${validCount}`);
        console.log(`❌ Invalid: ${invalidCount}`);
        console.log(`⚠️  Total Warnings: ${totalWarnings}`);
        console.log(`❌ Total Errors: ${totalErrors}`);
        // Print invalid documents
        if (invalidCount > 0) {
            console.log('\n❌ Invalid Documents:\n');
            results
                .filter((r) => !r.isValid)
                .forEach((result) => {
                console.log(`  ${result.gameId}/${result.characterId} (${result.documentId}):`);
                result.errors.forEach((error) => {
                    console.log(`    - ${error}`);
                });
                if (result.warnings.length > 0) {
                    result.warnings.forEach((warning) => {
                        console.log(`    ⚠️  ${warning}`);
                    });
                }
            });
        }
        // Print documents with warnings
        const documentsWithWarnings = results.filter((r) => r.warnings.length > 0 && r.isValid);
        if (documentsWithWarnings.length > 0) {
            console.log('\n⚠️  Documents with Warnings:\n');
            documentsWithWarnings.forEach((result) => {
                console.log(`  ${result.gameId}/${result.characterId}:`);
                result.warnings.forEach((warning) => {
                    console.log(`    - ${warning}`);
                });
            });
        }
        console.log('\n' + '='.repeat(60));
        // Disconnect from database
        await database_1.Database.disconnect();
        logger_1.Logger.info('Database disconnected');
        // Exit with error code if validation failed
        if (invalidCount > 0) {
            process.exit(1);
        }
    }
    catch (error) {
        logger_1.Logger.error('Validation error:', error);
        await database_1.Database.disconnect();
        process.exit(1);
    }
}
// Run validation if this file is executed directly
if (require.main === module) {
    validateAllDocuments()
        .then(() => {
        logger_1.Logger.info('Validation finished');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.Logger.error('Validation error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=validateCharacterEncyclopedia.js.map