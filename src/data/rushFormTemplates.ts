/** Chapter-builder style intake forms for the rush pipeline */

export type RushFieldType =
  | 'text'
  | 'textarea'
  | 'dropdown'
  | 'checkbox'
  | 'date'
  | 'number'
  | 'photo'
  | 'tags'

export interface RushFormField {
  id: string
  name: string
  type: RushFieldType
  required?: boolean
  options?: string[]
  placeholder?: string
  /** Maps to a standard Prospect field when creating a PNM */
  mapsTo?:
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'phone'
    | 'major'
    | 'graduationYear'
    | 'instagram'
    | 'hometown'
    | 'source'
    | 'assignedBrother'
    | 'notes'
    | 'interests'
    | 'photoUrl'
}

export interface RushFormTemplate {
  id: string
  name: string
  description: string
  fields: RushFormField[]
}

export const RUSH_FORM_TEMPLATES: RushFormTemplate[] = [
  {
    id: 'standard-intake',
    name: 'Standard PNM intake',
    description: 'Photo, contact info, academics, and interests — the default rush form.',
    fields: [
      { id: 'photo', name: 'Photo', type: 'photo', mapsTo: 'photoUrl' },
      { id: 'firstName', name: 'First name', type: 'text', required: true, mapsTo: 'firstName' },
      { id: 'lastName', name: 'Last name', type: 'text', required: true, mapsTo: 'lastName' },
      { id: 'email', name: 'Email', type: 'text', required: true, mapsTo: 'email' },
      { id: 'phone', name: 'Phone', type: 'text', required: true, mapsTo: 'phone' },
      { id: 'major', name: 'Major', type: 'text', mapsTo: 'major' },
      {
        id: 'graduationYear',
        name: 'Grad year',
        type: 'number',
        mapsTo: 'graduationYear',
      },
      { id: 'hometown', name: 'Hometown', type: 'text', mapsTo: 'hometown' },
      { id: 'instagram', name: 'Instagram', type: 'text', mapsTo: 'instagram' },
      {
        id: 'source',
        name: 'Source',
        type: 'dropdown',
        options: ['Member Referral', 'Rush Event', 'IFC', 'Instagram', 'Tabling', 'Other'],
        mapsTo: 'source',
      },
      {
        id: 'interests',
        name: 'Interests',
        type: 'tags',
        placeholder: 'Comma-separated',
        mapsTo: 'interests',
      },
    ],
  },
  {
    id: 'member-referral',
    name: 'Member referral',
    description: 'Referral form with assigned brother and referral notes.',
    fields: [
      { id: 'photo', name: 'Photo', type: 'photo', mapsTo: 'photoUrl' },
      { id: 'firstName', name: 'First name', type: 'text', required: true, mapsTo: 'firstName' },
      { id: 'lastName', name: 'Last name', type: 'text', required: true, mapsTo: 'lastName' },
      { id: 'phone', name: 'Phone', type: 'text', required: true, mapsTo: 'phone' },
      { id: 'email', name: 'Email', type: 'text', mapsTo: 'email' },
      {
        id: 'assignedBrother',
        name: 'Referring member',
        type: 'text',
        required: true,
        mapsTo: 'assignedBrother',
      },
      {
        id: 'notes',
        name: 'Referral notes',
        type: 'textarea',
        mapsTo: 'notes',
        placeholder: 'Why is this person a good fit?',
      },
    ],
  },
  {
    id: 'event-signup',
    name: 'Event signup',
    description: 'Quick capture at rush events — photo and basics only.',
    fields: [
      { id: 'photo', name: 'Photo', type: 'photo', mapsTo: 'photoUrl' },
      { id: 'firstName', name: 'First name', type: 'text', required: true, mapsTo: 'firstName' },
      { id: 'lastName', name: 'Last name', type: 'text', required: true, mapsTo: 'lastName' },
      { id: 'phone', name: 'Phone', type: 'text', required: true, mapsTo: 'phone' },
      { id: 'email', name: 'Email', type: 'text', mapsTo: 'email' },
      {
        id: 'source',
        name: 'Event',
        type: 'dropdown',
        options: ['Open House', 'Cookout', 'Philanthropy', 'IFC Night', 'Other'],
        mapsTo: 'source',
      },
    ],
  },
  {
    id: 'blank',
    name: 'Blank form',
    description: 'Photo + name only — add custom fields like chapter setup.',
    fields: [
      { id: 'photo', name: 'Photo', type: 'photo', mapsTo: 'photoUrl' },
      { id: 'firstName', name: 'First name', type: 'text', required: true, mapsTo: 'firstName' },
      { id: 'lastName', name: 'Last name', type: 'text', required: true, mapsTo: 'lastName' },
    ],
  },
]

export function getRushTemplate(id: string): RushFormTemplate | undefined {
  return RUSH_FORM_TEMPLATES.find((t) => t.id === id)
}
