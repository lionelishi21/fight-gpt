import { Request, Response } from 'express';

const MOCK_TOURNAMENTS = [
  {
    id: "1",
    title: "COMBO BREAKER 2026",
    game: "STREET FIGHTER 6",
    date: "2026-05-23",
    prize: "$10,000",
    entrants: 512,
    region: "NA",
    status: "OPEN",
    color: "text-primary",
    url: "https://combobreakerllc.com",
  },
  {
    id: "2",
    title: "CEO 2026",
    game: "TEKKEN 8",
    date: "2026-06-27",
    prize: "$5,000",
    entrants: 256,
    region: "NA",
    status: "OPEN",
    color: "text-secondary",
    url: "https://ceo-gaming.com",
  },
  {
    id: "3",
    title: "EVO 2026",
    game: "MULTI-TITLE",
    date: "2026-08-01",
    prize: "$50,000+",
    entrants: 10000,
    region: "GLOBAL",
    status: "OPEN",
    color: "text-accent",
    url: "https://evo.gg",
  },
  {
    id: "4",
    title: "FROSTY FAUSTINGS XIX",
    game: "GUILTY GEAR STRIVE",
    date: "2027-01-10",
    prize: "$3,000",
    entrants: 128,
    region: "NA",
    status: "UPCOMING",
    color: "text-neon-green",
    url: "https://frostyfaustings.com",
  },
];

export const getUpcomingTournaments = async (req: Request, res: Response) => {
  const token = process.env.START_GG_TOKEN;

  if (!token) {
    return res.json({ success: true, data: MOCK_TOURNAMENTS });
  }

  try {
    const query = `
      query UpcomingTournaments {
        tournaments(query: {
          perPage: 10,
          filter: {
            videogameIds: [43868, 43639, 33945],
            upcoming: true
          }
        }) {
          nodes {
            id
            name
            startAt
            url
            events(filter: { videogameId: [43868, 43639, 33945] }) {
              id
              videogame {
                id
                name
              }
              numEntrants
            }
          }
        }
      }
    `;

    const response = await fetch("https://api.start.gg/gql/alpha", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error("Start.gg API request failed");
    }

    const json = await response.json();
    
    const mappedData = json.data?.tournaments?.nodes?.map((t: any) => {
      const mainEvent = t.events?.[0];
      const gameName = mainEvent?.videogame?.name || "MULTI-TITLE";
      
      let color = "text-white";
      if (gameName.toLowerCase().includes("street fighter")) color = "text-primary";
      else if (gameName.toLowerCase().includes("tekken")) color = "text-secondary";
      else if (gameName.toLowerCase().includes("guilty gear")) color = "text-neon-green";

      return {
        id: t.id,
        title: t.name,
        game: gameName.toUpperCase(),
        date: new Date(t.startAt * 1000).toISOString(),
        prize: "TBD",
        entrants: mainEvent?.numEntrants || 0,
        region: "GLOBAL",
        status: "UPCOMING",
        color,
        url: t.url.startsWith("http") ? t.url : `https://start.gg${t.url}`
      };
    }) || [];

    return res.json({ success: true, data: mappedData });
  } catch (error) {
    console.error("Tournament fetch error:", error);
    return res.json({ success: true, data: MOCK_TOURNAMENTS });
  }
};
