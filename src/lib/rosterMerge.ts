/** Union chapter roster rows by id so cloud LWW sync cannot drop joiners. */

export type RosterMergeRow = {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  major?: string
  graduationYear?: number
  avatar?: string
  photoUrl?: string
  birthday?: string
  shirtSize?: string
  emergencyContact?: string
  emergencyPhone?: string
  [key: string]: unknown
}

function prefer(a: string | undefined, b: string | undefined): string | undefined {
  const at = a?.trim()
  if (at) return a
  return b
}

export function mergeRosterLists<T extends RosterMergeRow>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>()
  for (const row of a) {
    if (row?.id) map.set(row.id, row)
  }
  for (const row of b) {
    if (!row?.id) continue
    const prev = map.get(row.id)
    if (!prev) {
      map.set(row.id, row)
      continue
    }
    map.set(row.id, {
      ...prev,
      ...row,
      firstName: prefer(row.firstName, prev.firstName) ?? prev.firstName,
      lastName: prefer(row.lastName, prev.lastName) ?? prev.lastName,
      email: prefer(row.email, prev.email) ?? prev.email,
      phone: prefer(row.phone, prev.phone) ?? prev.phone,
      major: prefer(row.major, prev.major) ?? prev.major,
      avatar: prefer(row.avatar, prev.avatar) ?? prev.avatar,
      photoUrl: prefer(row.photoUrl, prev.photoUrl) ?? prev.photoUrl,
      birthday: prefer(row.birthday, prev.birthday) ?? prev.birthday,
      shirtSize: prefer(row.shirtSize, prev.shirtSize) ?? prev.shirtSize,
      emergencyContact:
        prefer(row.emergencyContact, prev.emergencyContact) ?? prev.emergencyContact,
      emergencyPhone: prefer(row.emergencyPhone, prev.emergencyPhone) ?? prev.emergencyPhone,
      graduationYear: row.graduationYear ?? prev.graduationYear,
    })
  }
  return [...map.values()]
}
