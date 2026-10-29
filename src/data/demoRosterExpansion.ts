import type { Member } from '../types'

/** Additional demo members so dues / roster metrics scale beyond the core ten. */
export function expandDemoRoster(base: Member[]): Member[] {
  if (base.length >= 24) return base
  const extras: Member[] = []
  const names = [
    ['Logan', 'Price'],
    ['Aiden', 'Cole'],
    ['Blake', 'Sullivan'],
    ['Drew', 'Nguyen'],
    ['Grant', 'Ellis'],
    ['Hunter', 'Reed'],
    ['Ian', 'Morales'],
    ['Kyle', 'Bennett'],
    ['Liam', 'Foster'],
    ['Mason', 'Gray'],
    ['Nolan', 'Hart'],
    ['Owen', 'Ingram'],
    ['Parker', 'James'],
    ['Quinn', 'Keller'],
  ]
  let i = 11
  for (const [first, last] of names) {
    const id = `m${i}`
    if (base.some((m) => m.id === id)) {
      i += 1
      continue
    }
    const paidFull = i % 3 === 0
    const partial = i % 3 === 1
    extras.push({
      id,
      firstName: first,
      lastName: last,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@students.demo.edu`,
      phone: `(850) 555-${String(1000 + i).slice(-4)}`,
      major: 'General Studies',
      graduationYear: 2027,
      pledgeClass: 'Fall 2024',
      status: i === 24 ? 'New Member' : 'Active',
      isExec: false,
      role: 'ActiveMember',
      big: 'Marcus Chen',
      birthday: '2001-06-01',
      shirtSize: 'M',
      emergencyContact: `${last} Family`,
      emergencyPhone: '(850) 555-0000',
      duesStatus: paidFull ? 'Paid' : partial ? 'Partially Paid' : 'Outstanding',
      duesPaid: paidFull ? 850 : partial ? 400 : 0,
      duesExpected: 850,
      attendancePct: 72 + (i % 20),
      points: 40 + i,
      committee: 'General',
      avatar: `${first.charAt(0)}${last.charAt(0)}`,
    })
    i += 1
  }
  return [...base, ...extras]
}
