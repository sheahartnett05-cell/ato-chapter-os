import type { AnnouncementTemplate } from '../types/features'

export const ANNOUNCEMENT_TEMPLATES: AnnouncementTemplate[] = [
  {
    id: 'tpl-meeting',
    name: 'Chapter meeting',
    category: 'meeting',
    title: 'Chapter meeting — {{day}} at {{time}}',
    body: 'Location: {{location}}.\nDress: {{dress}}.\nAgenda will be posted in Chapter Room 24h prior.',
  },
  {
    id: 'tpl-dues',
    name: 'Dues reminder',
    category: 'dues',
    title: 'Dues due {{date}}',
    body: 'Semester balance is live in BillHighway. Pay before {{date}} to avoid holds on formal tickets and study hour credit.',
  },
  {
    id: 'tpl-event',
    name: 'Event reminder',
    category: 'event',
    title: '{{event}} this {{day}}',
    body: 'Time: {{time}} · Location: {{location}}.\nRSVP in Chapter Room — required events need an approved excuse if you decline.',
  },
  {
    id: 'tpl-recruitment',
    name: 'Rush info session',
    category: 'recruitment',
    title: 'Interest meeting — {{date}}',
    body: 'Open to potential new members. Business casual. Sign in at the door; assigned {{memberTerm}} will escort groups.',
  },
  {
    id: 'tpl-general',
    name: 'Quick update',
    category: 'general',
    title: 'Chapter update',
    body: 'Short update for the chapter. Edit this body with your message.',
  },
  {
    id: 'tpl-poll-venue',
    name: 'Venue poll',
    category: 'poll',
    title: 'Vote: {{topic}}',
    body: 'Cast your vote below — closes {{date}}. One vote per member unless noted.',
    pollQuestion: 'Which option do you prefer?',
    pollOptions: ['Option A', 'Option B', 'Option C'],
  },
  {
    id: 'tpl-poll-time',
    name: 'Meeting time poll',
    category: 'poll',
    title: 'Best time for {{event}}?',
    body: 'Help exec pick a time that works for the most members.',
    pollQuestion: 'Which time works best for you?',
    pollOptions: ['Tuesday 7 PM', 'Wednesday 8 PM', 'Thursday 6 PM'],
  },
  {
    id: 'tpl-signup-volunteer',
    name: 'Volunteer shifts',
    category: 'signup',
    title: 'Sign up: {{event}}',
    body: 'Claim a shift below. First come, first served.',
    signupSlots: ['Setup (2 hr)', 'Check-in desk', 'Cleanup crew'],
  },
  {
    id: 'tpl-signup-food',
    name: 'Bring-a-dish',
    category: 'signup',
    title: 'Potluck sign-up',
    body: 'Pick a category so we don\'t end up with six trays of cookies.',
    signupSlots: ['Main dish', 'Side dish', 'Dessert', 'Drinks / ice'],
  },
]

/** Replace {{tokens}} in template strings */
export function applyTemplateTokens(
  text: string,
  tokens: Record<string, string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => tokens[key] ?? `{{${key}}}`)
}

export const DEFAULT_TEMPLATE_TOKENS: Record<string, string> = {
  day: 'Thursday',
  time: '7:00 PM',
  location: 'Chapter house — main room',
  dress: 'Chapter polo + khakis',
  date: 'Friday, Aug 30',
  event: 'Brotherhood cookout',
  topic: 'Fall Formal venue',
  memberTerm: 'brother',
}
