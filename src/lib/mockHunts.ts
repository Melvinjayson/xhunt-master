import type { Hunt } from './types';

export const MOCK_HUNTS: Hunt[] = [
  {
    id: 'hunt-urban-archaeologist',
    title: 'The Urban Archaeologist',
    story_context:
      'Your city holds ancient secrets waiting to be uncovered. Every street corner is a page in a living history book, and most people walk past them without a second glance. Today, you are the archaeologist — your city is your dig site.',
    difficulty: 'medium',
    estimated_time: '45 min',
    steps: [
      {
        id: 1,
        type: 'action',
        instruction:
          'Find the oldest building within a 10-minute walk of where you are right now. Photograph its architecture and try to find out when it was built.',
        success_criteria:
          'You have a photo and an approximate age for the building.',
      },
      {
        id: 2,
        type: 'discovery',
        instruction:
          "Look for a hidden alley, courtyard, or passage you've never noticed before. Step inside and spend at least 2 minutes there.",
        success_criteria: "You found and entered a space you've overlooked before.",
      },
      {
        id: 3,
        type: 'action',
        instruction:
          'Find someone who has lived or worked in this area for 10+ years. Ask them: "What\'s something about this place that most people walk right past?"',
        success_criteria: 'You had a genuine conversation and learned something new.',
      },
      {
        id: 4,
        type: 'reflection',
        instruction:
          'Sit somewhere quiet and write down the single most surprising thing you discovered about your city today.',
        success_criteria: 'You wrote at least 3 sentences about your discovery.',
      },
    ],
    reward: 'Urban Pioneer Explorer Badge + 150 XP',
    tags: ['adventure', 'city', 'history', 'discovery'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hunt-morning-ritual',
    title: 'The Morning Ritual',
    story_context:
      'Dawn holds a quiet power most people sleep through. The first hour of your day is a blank page — what you write on it shapes everything that follows. This hunt invites you to reclaim those first moments with intention.',
    difficulty: 'easy',
    estimated_time: '30 min',
    steps: [
      {
        id: 1,
        type: 'action',
        instruction:
          "Before checking your phone this morning, step outside — even for just 60 seconds. Feel the air, hear the sounds.",
        success_criteria: 'You went outside before looking at any screen.',
      },
      {
        id: 2,
        type: 'reflection',
        instruction:
          'Spend 3 minutes doing nothing but observing. Notice: one sound, one smell, one physical sensation. No phone.',
        success_criteria: 'You stayed present and aware for 3 full minutes.',
      },
      {
        id: 3,
        type: 'action',
        instruction:
          'Make a warm drink slowly and deliberately. No rushing, no multitasking. Give this one act your full attention.',
        success_criteria: 'You made and drank your drink without doing anything else.',
      },
      {
        id: 4,
        type: 'reflection',
        instruction:
          "Write down three things you're genuinely grateful for this morning. Be specific — not \"my family\" but a particular moment with them.",
        success_criteria: 'You wrote three specific, meaningful things.',
      },
    ],
    reward: 'Dawn Wanderer Mindfulness Badge + 80 XP',
    tags: ['mindfulness', 'morning', 'habits', 'calm'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hunt-flavor-detective',
    title: 'The Flavor Detective',
    story_context:
      "Every neighborhood holds culinary secrets hidden in plain sight — the small shop with no sign, the ingredient with a story, the vendor who's been here for forty years. Today you follow your senses wherever they lead.",
    difficulty: 'easy',
    estimated_time: '60 min',
    steps: [
      {
        id: 1,
        type: 'discovery',
        instruction:
          "Walk to the nearest local food market, deli, or specialty shop you've never entered. Go inside and explore slowly.",
        success_criteria: 'You entered a new food space.',
      },
      {
        id: 2,
        type: 'action',
        instruction:
          "Find one ingredient or food item you've genuinely never tried. Buy it, even if it's small.",
        success_criteria: 'You bought something unfamiliar.',
      },
      {
        id: 3,
        type: 'action',
        instruction:
          'Ask the vendor or someone nearby about this ingredient: what is it, where does it come from, how do people use it?',
        success_criteria: 'You learned the story behind the ingredient.',
      },
      {
        id: 4,
        type: 'reflection',
        instruction:
          'Taste your discovery. Describe the flavor in exactly five words. Was it what you expected?',
        success_criteria: 'You tasted it and found your five words.',
      },
    ],
    reward: 'Flavor Pioneer Culinary Badge + 100 XP',
    tags: ['food', 'discovery', 'local', 'sensory'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hunt-deep-connection',
    title: 'The Deep Connection',
    story_context:
      "Every person you haven't spoken to yet is a universe of stories. We move through crowds of lives and rarely pause. This hunt is about changing that — one genuine conversation at a time.",
    difficulty: 'medium',
    estimated_time: '40 min',
    steps: [
      {
        id: 1,
        type: 'action',
        instruction:
          'Go to a public space where people naturally gather: a café, park, library, or community center.',
        success_criteria: 'You are in a shared space with other people.',
      },
      {
        id: 2,
        type: 'reflection',
        instruction:
          'Observe for 5 minutes without your phone. Notice the energy. Who is here? What draws them to this space?',
        success_criteria: 'You spent 5 genuine minutes in observation.',
      },
      {
        id: 3,
        type: 'action',
        instruction:
          'Introduce yourself to one person. Ask them a genuine question: "What brought you here today?"',
        success_criteria: 'You started a real conversation.',
      },
      {
        id: 4,
        type: 'reflection',
        instruction:
          "After the conversation: write one thing about this person that surprised you, and one thing you'll carry with you.",
        success_criteria: 'You wrote two specific things from your conversation.',
      },
    ],
    reward: 'Connection Catalyst Social Badge + 120 XP',
    tags: ['social', 'connection', 'human', 'community'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hunt-creative-spark',
    title: 'The Creative Spark',
    story_context:
      "Creativity is not a talent — it's a muscle most people stop exercising after childhood. Today, you pick it back up. No judgment. No audience. Just you and the act of making something from nothing.",
    difficulty: 'medium',
    estimated_time: '60 min',
    steps: [
      {
        id: 1,
        type: 'action',
        instruction:
          "Find any creative medium you haven't used in months or years: colored pencils, clay, a camera, handwriting, voice.",
        success_criteria: 'You have a medium in your hands.',
      },
      {
        id: 2,
        type: 'action',
        instruction:
          'Create something for 15 minutes without stopping, without judging, without starting over. Just keep making.',
        success_criteria: 'You created for a full 15 uninterrupted minutes.',
      },
      {
        id: 3,
        type: 'reflection',
        instruction:
          'Give your creation a title. Then write one honest sentence about what you were trying to express.',
        success_criteria: 'Your creation has a title and a stated intention.',
      },
      {
        id: 4,
        type: 'action',
        instruction:
          "Share your creation with one person — in person or by message. Tell them its name and what it means.",
        success_criteria: 'One other person has seen or heard your creation.',
      },
    ],
    reward: 'Creative Awakening Expression Badge + 130 XP',
    tags: ['creativity', 'art', 'expression', 'making'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hunt-digital-monk',
    title: 'The Digital Monk',
    story_context:
      "In a world engineered to capture your attention, the ability to be fully present is a radical act. This is the most challenging Hunt — not because it's physically hard, but because it confronts what silence reveals about you.",
    difficulty: 'hard',
    estimated_time: '3 hours',
    steps: [
      {
        id: 1,
        type: 'action',
        instruction:
          "Put your phone on airplane mode and place it somewhere you can't easily reach. This lasts 2 hours. No exceptions.",
        success_criteria: 'Your phone is on airplane mode and out of reach.',
      },
      {
        id: 2,
        type: 'action',
        instruction:
          'Do one thing with your hands that requires sustained attention: cook from scratch, draw, write by hand, or build something.',
        success_criteria: 'You worked on one focused physical task for 30+ minutes.',
      },
      {
        id: 3,
        type: 'reflection',
        instruction:
          'Sit in a quiet room with no input — no music, no noise — for 10 full minutes. Just observe your mind.',
        success_criteria: 'You sat in silence for 10 uninterrupted minutes.',
      },
      {
        id: 4,
        type: 'action',
        instruction:
          "Read 20 pages of a physical book. If you don't have one nearby, find one — borrow, buy, or visit a library.",
        success_criteria: 'You read 20 pages in a physical book.',
      },
      {
        id: 5,
        type: 'reflection',
        instruction:
          'Write your honest answers: What did you miss about your phone? What did you discover in its absence?',
        success_criteria: 'You answered both questions fully and honestly.',
      },
    ],
    reward: 'Digital Monk Discipline Badge + 300 XP',
    tags: ['mindfulness', 'focus', 'challenge', 'offline'],
    createdAt: new Date().toISOString(),
  },
];

export function getTagGradient(tags: string[]): string {
  if (tags.includes('adventure') || tags.includes('city')) {
    return 'from-indigo-500 to-violet-600';
  }
  if (tags.includes('mindfulness') || tags.includes('calm')) {
    return 'from-teal-400 to-cyan-600';
  }
  if (tags.includes('food') || tags.includes('sensory')) {
    return 'from-orange-400 to-rose-500';
  }
  if (tags.includes('social') || tags.includes('connection')) {
    return 'from-pink-400 to-purple-600';
  }
  if (tags.includes('creativity') || tags.includes('art')) {
    return 'from-amber-400 to-orange-500';
  }
  if (tags.includes('challenge') || tags.includes('offline')) {
    return 'from-slate-600 to-gray-900';
  }
  return 'from-accent to-orange-700';
}

export function getTagEmoji(tags: string[]): string {
  if (tags.includes('adventure') || tags.includes('city')) return '🗺️';
  if (tags.includes('mindfulness') || tags.includes('calm')) return '🧘';
  if (tags.includes('food')) return '🍴';
  if (tags.includes('social') || tags.includes('connection')) return '🤝';
  if (tags.includes('creativity') || tags.includes('art')) return '🎨';
  if (tags.includes('challenge') || tags.includes('offline')) return '⚡';
  return '🔍';
}
