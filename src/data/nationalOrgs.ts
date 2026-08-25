import type { LanguagePack, OrganizationChapter, OrgType } from '../types/theme'

export type OrgCategory = 'fraternity' | 'sorority' | 'nphc' | 'mgc'

export interface NationalOrg {
  id: string
  orgName: string
  nickname: string
  letters: string
  category: OrgCategory
  orgType: OrgType
  primaryColor: string
  secondaryColor: string
  accentColor: string
  languagePack: LanguagePack
}

const FRAT_LANG: LanguagePack = {
  memberSingular: 'Brother',
  memberPlural: 'Brothers',
  recruitmentTerm: 'Rush',
  candidateTerm: 'Pledge',
}

const SORORITY_LANG: LanguagePack = {
  memberSingular: 'Sister',
  memberPlural: 'Sisters',
  recruitmentTerm: 'Recruitment',
  candidateTerm: 'New Member',
}

const NPHC_SORORITY_LANG: LanguagePack = {
  memberSingular: 'Sister',
  memberPlural: 'Sisters',
  recruitmentTerm: 'Intake',
  candidateTerm: 'Associate',
}

const NPHC_FRATERNITY_LANG: LanguagePack = {
  memberSingular: 'Brother',
  memberPlural: 'Brothers',
  recruitmentTerm: 'Intake',
  candidateTerm: 'Associate',
}

const MGC_LANG: LanguagePack = {
  memberSingular: 'Sibling',
  memberPlural: 'Siblings',
  recruitmentTerm: 'Intake',
  candidateTerm: 'New Member',
}

type Colors = [primary: string, secondary: string, accent: string]

function mkFrat(
  id: string,
  orgName: string,
  nickname: string,
  letters: string,
  colors: Colors
): NationalOrg {
  return {
    id,
    orgName,
    nickname,
    letters,
    category: 'fraternity',
    orgType: 'IFC',
    primaryColor: colors[0],
    secondaryColor: colors[1],
    accentColor: colors[2],
    languagePack: FRAT_LANG,
  }
}

function mkSorority(
  id: string,
  orgName: string,
  nickname: string,
  letters: string,
  colors: Colors
): NationalOrg {
  return {
    id,
    orgName,
    nickname,
    letters,
    category: 'sorority',
    orgType: 'Panhellenic',
    primaryColor: colors[0],
    secondaryColor: colors[1],
    accentColor: colors[2],
    languagePack: SORORITY_LANG,
  }
}

function mkNphc(
  id: string,
  orgName: string,
  nickname: string,
  letters: string,
  colors: Colors,
  lang: LanguagePack
): NationalOrg {
  return {
    id,
    orgName,
    nickname,
    letters,
    category: 'nphc',
    orgType: 'NPHC',
    primaryColor: colors[0],
    secondaryColor: colors[1],
    accentColor: colors[2],
    languagePack: lang,
  }
}

function mkMgc(
  id: string,
  orgName: string,
  nickname: string,
  letters: string,
  colors: Colors
): NationalOrg {
  return {
    id,
    orgName,
    nickname,
    letters,
    category: 'mgc',
    orgType: 'MGC',
    primaryColor: colors[0],
    secondaryColor: colors[1],
    accentColor: colors[2],
    languagePack: MGC_LANG,
  }
}

const FRATERNITIES: NationalOrg[] = [
  mkFrat('alpha-delta-phi', 'Alpha Delta Phi', 'ADPhi', 'ΑΔΦ', ['#003087', '#FFD700', '#FFFFFF']),
  mkFrat('alpha-epsilon-pi', 'Alpha Epsilon Pi', 'AEPi', 'ΑΕΠ', ['#003087', '#FFD700', '#FFFFFF']),
  mkFrat('alpha-gamma-rho', 'Alpha Gamma Rho', 'AGR', 'ΑΓΡ', ['#003087', '#FFD700', '#FFFFFF']),
  mkFrat('alpha-kappa-lambda', 'Alpha Kappa Lambda', 'AKL', 'ΑΚΛ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkFrat('alpha-sigma-phi', 'Alpha Sigma Phi', 'Alpha Sig', 'ΑΣΦ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkFrat('ato', 'Alpha Tau Omega', 'ATO', 'ΑΤΩ', ['#002147', '#001a38', '#FFC72C']),
  mkFrat('beta-chi-theta', 'Beta Chi Theta', 'Beta Chi', 'ΒΧΘ', ['#003087', '#FFFFFF', '#FFD700']),
  mkFrat('beta-theta-pi', 'Beta Theta Pi', 'Beta', 'ΒΘΠ', ['#8B0000', '#5c0000', '#FFFFFF']),
  mkFrat('chi-phi', 'Chi Phi', 'Chi Phi', 'ΧΦ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkFrat('delta-chi', 'Delta Chi', 'ΔΧ', 'ΔΧ', ['#003366', '#002244', '#FFFFFF']),
  mkFrat('delta-kappa-epsilon', 'Delta Kappa Epsilon', 'DKE', 'ΔΚΕ', ['#003087', '#FFD700', '#FFFFFF']),
  mkFrat('delta-sigma-phi', 'Delta Sigma Phi', 'DSP', 'ΔΣΦ', ['#003087', '#FFFFFF', '#FFD700']),
  mkFrat('delta-tau-delta', 'Delta Tau Delta', 'DTD', 'ΔΤΔ', ['#800020', '#5a0016', '#FFD700']),
  mkFrat('delta-upsilon', 'Delta Upsilon', 'DU', 'ΔΥ', ['#003087', '#FFD700', '#FFFFFF']),
  mkFrat('farmhouse', 'FarmHouse', 'FarmHouse', 'FH', ['#006400', '#FFD700', '#FFFFFF']),
  mkFrat('kappa-alpha-order', 'Kappa Alpha Order', 'KA', 'ΚΑ', ['#C41E3A', '#FFD700', '#FFFFFF']),
  mkFrat('kappa-delta-rho', 'Kappa Delta Rho', 'KDR', 'ΚΔΡ', ['#003087', '#FFD700', '#FFFFFF']),
  mkFrat('kappa-sigma', 'Kappa Sigma', 'KΣ', 'ΚΣ', ['#C41E3A', '#00A86B', '#FFFFFF']),
  mkFrat('lambda-chi-alpha', 'Lambda Chi Alpha', 'Lambda Chi', 'ΛΧΑ', ['#4B0082', '#FFD700', '#FFFFFF']),
  mkFrat('phi-delta-theta', 'Phi Delta Theta', 'Phi Delt', 'ΦΔΘ', ['#003087', '#FFFFFF', '#C0C0C0']),
  mkFrat('phi-gamma-delta', 'Phi Gamma Delta', 'FIJI', 'ΦΓΔ', ['#5B2C6F', '#FFFFFF', '#C0C0C0']),
  mkFrat('phi-kappa-psi', 'Phi Kappa Psi', 'Phi Psi', 'ΦΚΨ', ['#003087', '#FFFFFF', '#FFD700']),
  mkFrat('phi-kappa-sigma', 'Phi Kappa Sigma', 'Phi Kap', 'ΦΚΣ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkFrat('phi-kappa-tau', 'Phi Kappa Tau', 'Phi Tau', 'ΦΚΤ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkFrat('phi-kappa-theta', 'Phi Kappa Theta', 'Phi Kap', 'ΦΚΘ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkFrat('phi-sigma-kappa', 'Phi Sigma Kappa', 'Phi Sig', 'ΦΣΚ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkFrat('pi-kappa-alpha', 'Pi Kappa Alpha', 'Pike', 'ΠΚΑ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkFrat('pi-kappa-phi', 'Pi Kappa Phi', 'Pi Kapp', 'ΠΚΦ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkFrat('pi-lambda-phi', 'Pi Lambda Phi', 'Pi Lam', 'ΠΛΦ', ['#003087', '#FFD700', '#FFFFFF']),
  mkFrat('psi-upsilon', 'Psi Upsilon', 'Psi U', 'ΨΥ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkFrat('sigma-alpha-epsilon', 'Sigma Alpha Epsilon', 'SAE', 'ΣΑΕ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkFrat('sigma-alpha-mu', 'Sigma Alpha Mu', 'SAM', 'ΣΑΜ', ['#003087', '#FFD700', '#FFFFFF']),
  mkFrat('sigma-chi', 'Sigma Chi', 'Sig Chi', 'ΣΧ', ['#002D62', '#001a3d', '#FFD700']),
  mkFrat('sigma-nu', 'Sigma Nu', 'Sig Nu', 'ΣΝ', ['#000000', '#FFD700', '#FFFFFF']),
  mkFrat('sigma-phi-epsilon', 'Sigma Phi Epsilon', 'Sig Ep', 'ΣΦΕ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkFrat('sigma-pi', 'Sigma Pi', 'Sig Pi', 'ΣΠ', ['#5B2C6F', '#FFD700', '#FFFFFF']),
  mkFrat('sigma-tau-gamma', 'Sigma Tau Gamma', 'Sig Tau', 'ΣΤΓ', ['#003087', '#FFD700', '#FFFFFF']),
  mkFrat('tau-epsilon-phi', 'Tau Epsilon Phi', 'TEP', 'ΤΕΦ', ['#003087', '#FFD700', '#FFFFFF']),
  mkFrat('tau-kappa-epsilon', 'Tau Kappa Epsilon', 'TKE', 'ΤΚΕ', ['#8B0000', '#C0C0C0', '#FFFFFF']),
  mkFrat('theta-chi', 'Theta Chi', 'Theta Chi', 'ΘΧ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkFrat('theta-delta-chi', 'Theta Delta Chi', 'TDX', 'ΘΔΧ', ['#003087', '#FFD700', '#FFFFFF']),
  mkFrat('theta-xi', 'Theta Xi', 'Theta Xi', 'ΘΞ', ['#003087', '#FFFFFF', '#FFD700']),
  mkFrat('triangle', 'Triangle', 'Triangle', 'TRI', ['#003087', '#FFD700', '#FFFFFF']),
  mkFrat('zeta-beta-tau', 'Zeta Beta Tau', 'ZBT', 'ΖΒΤ', ['#003087', '#FFD700', '#FFFFFF']),
]

const SORORITIES: NationalOrg[] = [
  mkSorority('alpha-chi-omega', 'Alpha Chi Omega', 'AXO', 'ΑΧΩ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkSorority('alpha-delta-pi', 'Alpha Delta Pi', 'ADPi', 'ΑΔΠ', ['#003087', '#FFFFFF', '#FFD700']),
  mkSorority('alpha-epsilon-phi', 'Alpha Epsilon Phi', 'AEPhi', 'ΑΕΦ', ['#003087', '#FFD700', '#FFFFFF']),
  mkSorority('alpha-gamma-delta', 'Alpha Gamma Delta', 'AGD', 'ΑΓΔ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkSorority('alpha-omicron-pi', 'Alpha Omicron Pi', 'AOPi', 'ΑΟΠ', ['#8B0000', '#FFFFFF', '#FFD700']),
  mkSorority('alpha-phi', 'Alpha Phi', 'Alpha Phi', 'ΑΦ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkSorority('alpha-sigma-alpha', 'Alpha Sigma Alpha', 'ASA', 'ΑΣΑ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkSorority('alpha-sigma-tau', 'Alpha Sigma Tau', 'AST', 'ΑΣΤ', ['#003087', '#FFD700', '#FFFFFF']),
  mkSorority('alpha-xi-delta', 'Alpha Xi Delta', 'AXiD', 'ΑΞΔ', ['#003087', '#FFD700', '#FFFFFF']),
  mkSorority('chi-omega', 'Chi Omega', 'Chi O', 'ΧΩ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkSorority('delta-delta-delta', 'Delta Delta Delta', 'Tri Delta', 'ΔΔΔ', ['#003087', '#FFD700', '#FFFFFF']),
  mkSorority('delta-gamma', 'Delta Gamma', 'DG', 'ΔΓ', ['#005A9C', '#8C6239', '#EE9A9E']),
  mkSorority('delta-phi-epsilon', 'Delta Phi Epsilon', 'DPhiE', 'ΔΦΕ', ['#003087', '#FFD700', '#FFFFFF']),
  mkSorority('delta-zeta', 'Delta Zeta', 'DZ', 'ΔΖ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkSorority('gamma-phi-beta', 'Gamma Phi Beta', 'GPhi', 'ΓΦΒ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkSorority('gamma-sigma-sigma', 'Gamma Sigma Sigma', 'GSS', 'ΓΣΣ', ['#003087', '#FFD700', '#FFFFFF']),
  mkSorority('kappa-alpha-theta', 'Kappa Alpha Theta', 'Theta', 'ΚΑΘ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkSorority('kappa-delta', 'Kappa Delta', 'KD', 'ΚΔ', ['#008080', '#FFFFFF', '#FFD700']),
  mkSorority('kappa-kappa-gamma', 'Kappa Kappa Gamma', 'KKG', 'ΚΚΓ', ['#003087', '#FFD700', '#FFFFFF']),
  mkSorority('phi-mu', 'Phi Mu', 'Phi Mu', 'ΦΜ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkSorority('phi-sigma-sigma', 'Phi Sigma Sigma', 'Phi Sig', 'ΦΣΣ', ['#003087', '#FFD700', '#FFFFFF']),
  mkSorority('pi-beta-phi', 'Pi Beta Phi', 'Pi Phi', 'ΠΒΦ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkSorority('sigma-delta-tau', 'Sigma Delta Tau', 'SDT', 'ΣΔΤ', ['#003087', '#FFD700', '#FFFFFF']),
  mkSorority('sigma-kappa', 'Sigma Kappa', 'Sig Kap', 'ΣΚ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkSorority('sigma-sigma-sigma', 'Sigma Sigma Sigma', 'Tri Sig', 'ΣΣΣ', ['#003087', '#FFD700', '#FFFFFF']),
  mkSorority('theta-phi-alpha', 'Theta Phi Alpha', 'TPA', 'ΘΦΑ', ['#003087', '#FFD700', '#FFFFFF']),
  mkSorority('zeta-tau-alpha', 'Zeta Tau Alpha', 'ZTA', 'ΖΤΑ', ['#77C4D3', '#888888', '#5BA8B8']),
]

const NPHC_ORGS: NationalOrg[] = [
  mkNphc('aka', 'Alpha Kappa Alpha', 'AKA', 'ΑΚΑ', ['#FF91A4', '#8DB600', '#E8799A'], NPHC_SORORITY_LANG),
  mkNphc('alpha-phi-alpha', 'Alpha Phi Alpha', 'ΑΦΑ', 'ΑΦΑ', ['#000000', '#FFD700', '#FFFFFF'], NPHC_FRATERNITY_LANG),
  mkNphc('delta-sigma-theta', 'Delta Sigma Theta', 'DST', 'ΔΣΘ', ['#8B0000', '#FFFFFF', '#FFD700'], NPHC_SORORITY_LANG),
  mkNphc('iota-phi-theta', 'Iota Phi Theta', 'Iota', 'ΙΦΘ', ['#8B0000', '#FFD700', '#FFFFFF'], NPHC_FRATERNITY_LANG),
  mkNphc('kappa-alpha-psi', 'Kappa Alpha Psi', 'Kappa', 'ΚΑΨ', ['#8B0000', '#FFD700', '#FFFFFF'], NPHC_FRATERNITY_LANG),
  mkNphc('omega-psi-phi', 'Omega Psi Phi', 'Que', 'ΩΨΦ', ['#4B0082', '#FFD700', '#FFFFFF'], NPHC_FRATERNITY_LANG),
  mkNphc('phi-beta-sigma', 'Phi Beta Sigma', 'Sigma', 'ΦΒΣ', ['#003087', '#FFFFFF', '#FFD700'], NPHC_FRATERNITY_LANG),
  mkNphc('sigma-gamma-rho', 'Sigma Gamma Rho', 'SGRho', 'ΣΓΡ', ['#003087', '#FFD700', '#FFFFFF'], NPHC_SORORITY_LANG),
  mkNphc('zeta-phi-beta', 'Zeta Phi Beta', 'Zeta', 'ΖΦΒ', ['#003087', '#FFFFFF', '#FFD700'], NPHC_SORORITY_LANG),
]

const MGC_ORGS: NationalOrg[] = [
  mkMgc('lambda-theta-alpha', 'Lambda Theta Alpha', 'LTA', 'ΛΘΑ', ['#003087', '#FFD700', '#FFFFFF']),
  mkMgc('lambda-upsilon-lambda', 'Lambda Upsilon Lambda', 'LUL', 'ΛΥΛ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkMgc('sigma-lambda-beta', 'Sigma Lambda Beta', 'SLB', 'ΣΛΒ', ['#003087', '#FFD700', '#FFFFFF']),
  mkMgc('sigma-lambda-gamma', 'Sigma Lambda Gamma', 'SLG', 'ΣΛΓ', ['#8B0000', '#FFD700', '#FFFFFF']),
  mkMgc('delta-phi-omega', 'Delta Phi Omega', 'DPO', 'ΔΦΩ', ['#003087', '#FFD700', '#FFFFFF']),
  mkMgc('kappa-delta-chi', 'Kappa Delta Chi', 'KDChi', 'ΚΔΧ', ['#003087', '#FFD700', '#FFFFFF']),
]

/** Neutral product brand — landing / preview before a chapter selects their org */
export const AGORA_PRODUCT: NationalOrg = {
  id: 'agora',
  orgName: 'Agora',
  nickname: 'Agora',
  letters: 'AG',
  category: 'fraternity',
  orgType: 'IFC',
  primaryColor: '#1a1a1a',
  secondaryColor: '#333333',
  accentColor: '#c4a35a',
  languagePack: FRAT_LANG,
}

/** Deduplicated by id — national fraternity & sorority directory */
export const NATIONAL_ORGS: NationalOrg[] = [
  AGORA_PRODUCT,
  ...FRATERNITIES.filter((o, i, arr) => arr.findIndex((x) => x.id === o.id) === i),
  ...SORORITIES,
  ...NPHC_ORGS,
  ...MGC_ORGS,
].sort((a, b) => {
  if (a.id === 'agora') return -1
  if (b.id === 'agora') return 1
  return a.orgName.localeCompare(b.orgName)
})

export const DEFAULT_ORG_ID = 'agora'

export const ORG_CATEGORIES: { id: OrgCategory; label: string }[] = [
  { id: 'fraternity', label: 'Fraternities' },
  { id: 'sorority', label: 'Sororities' },
  { id: 'nphc', label: 'NPHC' },
  { id: 'mgc', label: 'MGC' },
]

export function orgsInCategory(category: OrgCategory): NationalOrg[] {
  return NATIONAL_ORGS.filter((o) => o.category === category && o.id !== 'agora')
}

export function getNationalOrgById(id: string): NationalOrg | undefined {
  const resolved = LEGACY_ORG_IDS[id] ?? id
  return NATIONAL_ORGS.find((o) => o.id === resolved)
}

const LEGACY_ORG_IDS: Record<string, string> = {
  'chapter-os': 'agora',
  'ato-uwf': 'ato',
  'zta-uf': 'zeta-tau-alpha',
  'ks-uab': 'kappa-sigma',
  'dg-alabama': 'delta-gamma',
  'sigchi-ua': 'sigma-chi',
  'aka-howard': 'aka',
  'alpha-kappa-alpha': 'aka',
}

export function buildOrganizationChapter(
  org: NationalOrg,
  chapterDesignation: string,
  university: string,
  semester = 'Fall 2025'
): OrganizationChapter {
  return {
    id: org.id,
    orgName: org.orgName,
    nickname: org.nickname,
    letters: org.letters,
    orgType: org.orgType,
    primaryColor: org.primaryColor,
    secondaryColor: org.secondaryColor,
    accentColor: org.accentColor,
    languagePack: org.languagePack,
    chapterDesignation,
    university,
    semester,
  }
}

export const ORG_DIRECTORY = NATIONAL_ORGS.map((org) =>
  buildOrganizationChapter(org, 'Chapter', 'Your University')
)

export function getOrgById(id: string): OrganizationChapter | undefined {
  const org = getNationalOrgById(id)
  if (!org) return ORG_DIRECTORY.find((o) => o.id === id)
  return buildOrganizationChapter(org, 'Chapter', 'Your University')
}
