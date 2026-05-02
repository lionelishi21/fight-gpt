"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scenario = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ScenarioSchema = new mongoose_1.Schema({
    scenario_id: { type: String, required: true, unique: true, index: true },
    game_id: { type: String, required: true, index: true },
    pro_player_id: { type: String, index: true },
    description: { type: String, required: true },
    context: { type: String, required: true },
    characters_involved: [{ type: String }],
    embedding: {
        type: [Number],
        required: true,
    },
    match_references: [{ type: String }],
    tags: [{ type: String }],
    turn_owner: { type: String },
    neutral_state: { type: String },
    spacing: { type: String },
    frame_advantage: { type: String },
    p1_state: { type: String },
    p2_state: { type: String },
    timestamp: { type: Number },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
ScenarioSchema.index({ game_id: 1, tags: 1 });
ScenarioSchema.index({ pro_player_id: 1 });
exports.Scenario = mongoose_1.default.model('Scenario', ScenarioSchema);
//# sourceMappingURL=Scenario.js.map