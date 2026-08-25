import type { DuesCharge, DuesPayment } from '../types/chapterOps'
import type { DuesStatus, Member } from '../types'

export function computeMemberDuesFields(
  memberId: string,
  charges: DuesCharge[],
  payments: DuesPayment[],
  fallbackExpected = 850
): Pick<Member, 'duesPaid' | 'duesExpected' | 'duesStatus'> {
  let expected = 0
  let paid = 0

  for (const charge of charges) {
    const applies =
      charge.assignedMemberIds.length === 0 ||
      charge.assignedMemberIds.includes(memberId)
    if (!applies) continue
    expected += charge.amount
    paid += payments
      .filter((p) => p.chargeId === charge.id && p.memberId === memberId)
      .reduce((sum, p) => sum + (p.amountPaid ?? 0), 0)
  }

  if (expected === 0) {
    expected = fallbackExpected
    paid = Math.min(paid, expected)
  }

  const balance = Math.max(0, expected - paid)
  let duesStatus: DuesStatus = 'Outstanding'
  if (balance <= 0 && expected > 0) duesStatus = 'Paid'
  else if (paid > 0 && balance > 0) duesStatus = 'Partially Paid'

  return {
    duesExpected: expected,
    duesPaid: paid,
    duesStatus,
  }
}

export function syncAllMemberDues(
  members: Member[],
  charges: DuesCharge[],
  payments: DuesPayment[]
): Member[] {
  return members.map((m) => ({
    ...m,
    ...computeMemberDuesFields(m.id, charges, payments, m.duesExpected || 850),
  }))
}
