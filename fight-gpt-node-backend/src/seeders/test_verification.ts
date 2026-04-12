import axios from 'axios';

const BASE_URL = 'http://localhost:3010/api';

async function verify() {
    try {
        console.log('--- Phase 1: Registration ---');
        const email = `test_user_${Date.now()}@example.com`;
        const regRes = await axios.post(`${BASE_URL}/auth/register`, {
            name: 'Test User',
            email,
            password: 'Password123!',
        });

        const token = regRes.data.data.token;
        console.log('Registered. Token received.');

        console.log('\n--- Phase 2: GET /auth/me ---');
        const meRes = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { 'x-auth-token': token }
        });

        const user = meRes.data.data.user;
        console.log('Response Structure:');
        console.log('planType:', user.planType);
        console.log('mainCharacter (preferences):', user.preferences?.mainCharacter);

        if (user.planType === 'free') {
            console.log('PASS: planType is successfully mapped.');
        } else {
            console.log('FAIL: planType not found.');
        }

        console.log('\n--- Phase 3: GET /onboarding/status ---');
        const statusRes = await axios.get(`${BASE_URL}/onboarding/status`, {
            headers: { 'x-auth-token': token }
        });

        console.log('Onboarding Status:', statusRes.data.data);
        if (typeof statusRes.data.data.initialized === 'boolean') {
            console.log('PASS: Onboarding status returned correctly.');
        } else {
            console.log('FAIL: Onboarding status structure incorrect.');
        }

        console.log('\n--- Phase 4: Training Alias ---');
        const trainingRes = await axios.get(`${BASE_URL}/training/plan`, {
            headers: { 'x-auth-token': token }
        });
        console.log('Training Alias Status Code:', trainingRes.status);
        if (trainingRes.data.success) {
            console.log('PASS: Training alias /plan works.');
        }

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Verification failed:', error.response?.data || error.message);
        } else {
            console.error('Verification failed:', error);
        }
    }
}

verify();
