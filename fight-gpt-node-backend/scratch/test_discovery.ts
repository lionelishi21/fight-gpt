import axios from 'axios';

async function testDiscovery() {
    try {
        const res = await axios.get('http://localhost:3001/api/analysis/discovery?gameId=sf6');
        console.log('Discovery Results:', res.data.data.length);
        if (res.data.data.length > 0) {
            console.log('Sample Analysis:', res.data.data[0].analysis_id);
        }
    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

testDiscovery();
