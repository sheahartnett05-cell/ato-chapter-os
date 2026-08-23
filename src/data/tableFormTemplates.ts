import type { TableColumn } from '../types'

export interface TableFormTemplate {
  id: string
  name: string
  description: string
  /** Suggested event types from calendar color coding */
  eventTypes?: string[]
  columns: TableColumn[]
  /** Standard columns populated from event RSVP / guest list */
  guestListMapping: {
    memberColumn: string
    rsvpColumn: string
    guestColumn?: string
  }
}

/** Chapter builder form templates — each becomes a table schema per event */
export const TABLE_FORM_TEMPLATES: TableFormTemplate[] = [
  {
    id: 'guest-list',
    name: 'Event guest list',
    description: 'Member RSVP + plus-one names pulled from the event guest list.',
    eventTypes: ['Social', 'Recruitment', 'Philanthropy'],
    guestListMapping: {
      memberColumn: 'member',
      rsvpColumn: 'rsvp',
      guestColumn: 'guest',
    },
    columns: [
      { id: 'member', name: 'Member', type: 'member' },
      {
        id: 'rsvp',
        name: 'RSVP',
        type: 'dropdown',
        options: ['Yes', 'No', 'Maybe'],
      },
      { id: 'guest', name: 'Guest name', type: 'text' },
      { id: 'notes', name: 'Notes', type: 'text' },
    ],
  },
  {
    id: 'formal-logistics',
    name: 'Formal / ticket logistics',
    description: 'Guest list plus payment, transportation, and table assignments.',
    eventTypes: ['Social'],
    guestListMapping: {
      memberColumn: 'member',
      rsvpColumn: 'rsvp',
      guestColumn: 'guest',
    },
    columns: [
      { id: 'member', name: 'Member', type: 'member' },
      {
        id: 'rsvp',
        name: 'RSVP',
        type: 'dropdown',
        options: ['Yes', 'No'],
      },
      { id: 'guest', name: 'Guest', type: 'text' },
      { id: 'paid', name: 'Paid', type: 'checkbox' },
      {
        id: 'transportation',
        name: 'Transportation',
        type: 'dropdown',
        options: ['', 'Own ride', 'Chapter van', 'Need ride'],
      },
      { id: 'table', name: 'Table #', type: 'number' },
    ],
  },
  {
    id: 'work-day',
    name: 'Work day / shift signup',
    description: 'RSVP with shift slot and hours for service or house projects.',
    eventTypes: ['Philanthropy', 'Chapter'],
    guestListMapping: {
      memberColumn: 'member',
      rsvpColumn: 'rsvp',
    },
    columns: [
      { id: 'member', name: 'Member', type: 'member' },
      {
        id: 'rsvp',
        name: 'RSVP',
        type: 'dropdown',
        options: ['Yes', 'No'],
      },
      {
        id: 'shift',
        name: 'Shift',
        type: 'dropdown',
        options: ['Morning', 'Afternoon', 'Full day'],
      },
      { id: 'hours', name: 'Hours', type: 'number' },
      { id: 'verified', name: 'Verified', type: 'checkbox' },
    ],
  },
  {
    id: 'blank',
    name: 'Blank form',
    description: 'Start with member column only — add fields like chapter setup.',
    guestListMapping: {
      memberColumn: 'member',
      rsvpColumn: 'rsvp',
    },
    columns: [
      { id: 'member', name: 'Member', type: 'member' },
      {
        id: 'rsvp',
        name: 'RSVP',
        type: 'dropdown',
        options: ['Yes', 'No'],
      },
    ],
  },
]

export function getTableTemplate(id: string): TableFormTemplate | undefined {
  return TABLE_FORM_TEMPLATES.find((t) => t.id === id)
}
