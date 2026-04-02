export const mockAiServiceResponses = {
    success: {
        response: {
            text: () => JSON.stringify({
                players: {
                    player1: { character: 'Ryu', score: 95 },
                    player2: { character: 'Ken', score: 85 }
                },
                match_summary: 'An intense matchup where Ryu dominated the neutral game.',
                key_moments: [
                    {
                        timestamp: '00:45',
                        description: 'Ryu correctly anti-aired Ken with a Shoryuken.',
                        significance: 'Maintained corner pressure.',
                        tags: ['Anti-Air', 'Advantage']
                    }
                ],
                advice: {
                    improvements: [
                        'Ken needs to vary his approach timings more to avoid being anti-aired easily.'
                    ],
                    strengths: [
                        'Ryu showed excellent patience and spacing.'
                    ]
                }
            })
        }
    },
    error: {
        response: {
            text: () => JSON.stringify({
                error: 'Failed to find clear characters in the video.'
            })
        }
    }
};
