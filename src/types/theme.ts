/**
 * Global org theme schema — drives CSS variables, logos, and vocabulary.
 */

export type OrgType = 'IFC' | 'Panhellenic' | 'MGC' | 'NPHC' | 'Professional'

export type MemberSingular = 'Brother' | 'Sister' | 'Sibling'
export type MemberPlural = 'Brothers' | 'Sisters' | 'Siblings'
export type RecruitmentTerm = 'Rush' | 'Recruitment' | 'Intake'
export type CandidateTerm = 'Pledge' | 'New Member' | 'Associate'

export interface LanguagePack {
  memberSingular: MemberSingular
  memberPlural: MemberPlural
  recruitmentTerm: RecruitmentTerm
  candidateTerm: CandidateTerm
}

/** National org brand tokens */
export interface OrgTheme {
  id: string
  orgName: string
  nickname: string
  letters: string
  orgType: OrgType
  primaryColor: string
  secondaryColor: string
  accentColor: string
  languagePack: LanguagePack
}

/** A selectable chapter instance in the org directory */
export interface OrganizationChapter extends OrgTheme {
  chapterDesignation: string
  university: string
  semester: string
}
