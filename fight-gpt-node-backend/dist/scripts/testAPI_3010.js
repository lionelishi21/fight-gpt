"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
async function testAPI() {
    try {
        const port = process.env.PORT || 3010;
        const baseUrl = `http://localhost:${port}/api`;
        console.log(`Testing API endpoint at ${baseUrl}...`);
        const response = await axios_1.default.get(`${baseUrl}/encyclopedia/sf6/ryu`);
        console.log('Status:', response.status);
        console.log('Has moveset:', !!response.data?.data?.moveset);
        console.log('Has combos:', !!response.data?.data?.combos);
        if (response.data?.data?.moveset) {
            console.log('\nNormals count:', response.data.data.moveset.normals?.length || 0);
            console.log('First normal input:', response.data.data.moveset.normals?.[0]?.input);
        }
        if (response.data?.data?.combos) {
            console.log('\nCombos count:', response.data.data.combos?.length || 0);
            console.log('First combo:', JSON.stringify(response.data.data.combos[0], null, 2));
        }
    }
    catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}
testAPI();
//# sourceMappingURL=testAPI_3010.js.map