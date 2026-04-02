import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testAPI() {
    try {
        console.log('Testing API endpoint...');

        const response = await axios.get('http://localhost:5000/api/encyclopedia/sf6/ryu');

        console.log('Status:', response.status);
        console.log('Has moveset:', !!response.data?.moveset);
        console.log('Has combos:', !!response.data?.combos);

        if (response.data?.moveset) {
            console.log('\nNormals count:', response.data.moveset.normals?.length || 0);
            console.log('First normal input:', response.data.moveset.normals?.[0]?.input);
        }

        if (response.data?.combos) {
            console.log('\nCombos count:', response.data.combos?.length || 0);
            console.log('First combo:', JSON.stringify(response.data.combos[0], null, 2));
        }

    } catch (error: any) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testAPI();
