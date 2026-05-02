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
const ScraperService_1 = require("./services/ScraperService");
const CharacterEncyclopediaService_1 = require("./services/CharacterEncyclopediaService");
const CharacterEncyclopediaRepository_1 = require("./repositories/CharacterEncyclopediaRepository");
const database_1 = require("./config/database");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function test() {
    await database_1.Database.connect();
    const repo = new CharacterEncyclopediaRepository_1.CharacterEncyclopediaRepository();
    const service = new CharacterEncyclopediaService_1.CharacterEncyclopediaService(repo);
    const scraper = new ScraperService_1.ScraperService(service);
    const videos = await scraper.scrapeYouTube('Ryu SF6 guide');
    console.log('Scraped Videos:', JSON.stringify(videos, null, 2));
    await scraper.close();
    await database_1.Database.disconnect();
}
test();
//# sourceMappingURL=testYouTube.js.map