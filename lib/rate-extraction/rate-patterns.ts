export const RATE_PATTERNS = {
  hourlyRate: /\$(\d+(?:\.\d{2})?)\s*(?:\/|per\s*)h(?:ou)?r/gi,
  dailyRate: /\$(\d+(?:\.\d{2})?)\s*(?:\/|per\s*)day/gi,
  squareMeter: /\$(\d+(?:\.\d{2})?)\s*(?:\/|per\s*)(?:m2|m²|sqm|sq\.?\s*m)/gi,
  linearMeter: /\$(\d+(?:\.\d{2})?)\s*(?:\/|per\s*)(?:lm|lin\.?\s*m|m(?!2))/gi,
  eachRate: /\$(\d+(?:\.\d{2})?)\s*(?:\/|per\s*)(?:ea|each|unit|no\.?)/gi,
} as const;

export const LABOR_CATEGORIES = {
  framing: {
    name: 'Framing',
    keywords: ['wall framing', 'roof framing', 'floor framing', 'frame', 'stud', 'joist', 'rafter', 'bearer', 'structural'],
    activities: [
      'Wall framing',
      'Roof framing', 
      'Floor framing',
      'Structural framing',
      'Stud installation',
      'Joist installation',
      'Bearer installation'
    ]
  },
  doors: {
    name: 'Doors & Hardware',
    keywords: ['door', 'hardware', 'handle', 'lock', 'hinge', 'threshold', 'jamb'],
    activities: [
      'Single door installation',
      'Double door installation',
      'Bifold door installation',
      'Sliding door installation',
      'Door hardware installation',
      'Door frame installation'
    ]
  },
  windows: {
    name: 'Windows',
    keywords: ['window', 'glazing', 'sill', 'trim', 'flashing'],
    activities: [
      'Window installation',
      'Window trim',
      'Window flashing',
      'Sill installation',
      'Window frame installation'
    ]
  },
  decking: {
    name: 'Decking',
    keywords: ['deck', 'decking', 'balustrade', 'handrail', 'post', 'pergola'],
    activities: [
      'Deck framing',
      'Deck boarding',
      'Balustrade installation',
      'Handrail installation',
      'Post installation'
    ]
  },
  cladding: {
    name: 'Cladding & Lining',
    keywords: ['cladding', 'lining', 'weatherboard', 'sheet', 'board', 'siding', 'gyprock', 'plasterboard'],
    activities: [
      'External cladding',
      'Internal lining',
      'Weatherboard installation',
      'Sheet installation',
      'Plasterboard installation'
    ]
  },
  general: {
    name: 'General Labor',
    keywords: ['carpenter', 'labor', 'labour', 'hourly', 'daily', 'team', 'crew', 'general'],
    activities: [
      'Carpenter hourly rate',
      'Leading hand hourly rate',
      'Apprentice hourly rate',
      'Team daily rate',
      'General carpentry'
    ]
  }
} as const;

export const UNIT_MAPPINGS: Record<string, string> = {
  'm2': 'SQM',
  'm²': 'SQM',
  'sqm': 'SQM',
  'sq.m': 'SQM',
  'square meter': 'SQM',
  'square metre': 'SQM',
  
  'lm': 'LM',
  'lin.m': 'LM',
  'linear meter': 'LM',
  'linear metre': 'LM',
  'm': 'LM',
  
  'ea': 'EA',
  'each': 'EA',
  'unit': 'EA',
  'no': 'EA',
  'no.': 'EA',
  'item': 'EA',
  
  'hr': 'HR',
  'hour': 'HR',
  'hrs': 'HR',
  'hours': 'HR',
  
  'day': 'DAY',
  'days': 'DAY'
};

export function normalizeUnit(unit: string): string {
  const normalized = unit.toLowerCase().trim();
  return UNIT_MAPPINGS[normalized] || 'EA';
}

export function categorizeActivity(activity: string): string {
  const activityLower = activity.toLowerCase();
  
  for (const [key, category] of Object.entries(LABOR_CATEGORIES)) {
    if (category.keywords.some(keyword => activityLower.includes(keyword))) {
      return key;
    }
  }
  
  return 'general';
}

export function isReasonableRate(rate: number, unit: string): boolean {
  const ranges: Record<string, [number, number]> = {
    'HR': [30, 150],     // $30-150/hr
    'DAY': [200, 1500],  // $200-1500/day
    'SQM': [10, 500],    // $10-500/m²
    'LM': [5, 300],      // $5-300/lm
    'EA': [5, 5000]      // $5-5000/ea
  };
  
  const range = ranges[unit] || [0, 10000];
  return rate >= range[0] && rate <= range[1];
}