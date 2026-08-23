import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Filter, ChevronDown } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Card } from '../components/ui/Card'
import {
  StatusPill,
  duesVariant,
  memberStatusVariant,
} from '../components/ui/StatusPill'
import { Modal } from '../components/ui/Modal'
import { members } from '../data/mockData'
import type { DuesStatus, MemberStatus } from '../types'

const statusFilters: (MemberStatus | 'All')[] = [
  'All',
  'Active',
  'New Member',
  'Alumni',
]
const duesFilters: (DuesStatus | 'All')[] = [
  'All',
  'Paid',
  'Partially Paid',
  'Outstanding',
  'Overdue',
]

export default function MemberManagement() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'All'>('All')
  const [duesFilter, setDuesFilter] = useState<DuesStatus | 'All'>('All')
  const [execOnly, setExecOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'attendance' | 'dues'>('name')

  useEffect(() => {
    const filter = searchParams.get('filter')
    if (filter === 'dues') setDuesFilter('Outstanding')
    if (filter === 'attendance') setSortBy('attendance')
  }, [searchParams])

  const filtered = useMemo(() => {
    let result = [...members]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (m) =>
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
          m.major.toLowerCase().includes(q) ||
          m.pledgeClass.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'All') result = result.filter((m) => m.status === statusFilter)
    if (duesFilter !== 'All') result = result.filter((m) => m.duesStatus === duesFilter)
    if (execOnly) result = result.filter((m) => m.isExec)

    result.sort((a, b) => {
      if (sortBy === 'name')
        return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
      if (sortBy === 'attendance') return b.attendancePct - a.attendancePct
      return b.duesPaid - a.duesPaid
    })
    return result
  }, [search, statusFilter, duesFilter, execOnly, sortBy])

  return (
    <>
      <TopBar
        title="Member Management"
        subtitle={`${filtered.length} members`}
        actions={
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white transition hover:bg-gold-dark"
          >
            <Plus size={16} />
            Add Member
          </button>
        }
      />

      <div className="p-8">
        <Card padding={false}>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
            <input
              type="search"
              placeholder="Search members…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-slate-600 hover:bg-surface"
            >
              <Filter size={15} />
              Filters
              <ChevronDown size={14} className={showFilters ? 'rotate-180' : ''} />
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-border px-3 py-2 text-sm text-slate-600"
            >
              <option value="name">Sort: Name</option>
              <option value="attendance">Sort: Attendance</option>
              <option value="dues">Sort: Dues Paid</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={execOnly}
                onChange={(e) => setExecOnly(e.target.checked)}
                className="rounded border-border text-gold focus:ring-gold"
              />
              Exec only
            </label>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-4 border-b border-border bg-surface/50 px-5 py-3">
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">Status</p>
                <div className="flex flex-wrap gap-1">
                  {statusFilters.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        statusFilter === s
                          ? 'bg-navy text-white'
                          : 'bg-white text-slate-600 ring-1 ring-border hover:bg-surface'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">Dues Status</p>
                <div className="flex flex-wrap gap-1">
                  {duesFilters.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuesFilter(d)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        duesFilter === d
                          ? 'bg-navy text-white'
                          : 'bg-white text-slate-600 ring-1 ring-border hover:bg-surface'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Class</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Dues</th>
                  <th className="px-5 py-3">Attendance</th>
                  <th className="px-5 py-3">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((member) => (
                  <tr
                    key={member.id}
                    onClick={() => navigate(`/members/${member.id}`)}
                    className="cursor-pointer transition hover:bg-gold/5"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                          {member.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-navy">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {member.role ?? member.major}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{member.pledgeClass}</td>
                    <td className="px-5 py-3">
                      <StatusPill
                        label={member.status}
                        variant={memberStatusVariant(member.status)}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        <StatusPill
                          label={member.duesStatus}
                          variant={duesVariant(member.duesStatus)}
                        />
                        <span className="text-xs text-slate-400">
                          ${member.duesPaid} / ${member.duesExpected}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              member.attendancePct >= 80
                                ? 'bg-emerald-500'
                                : member.attendancePct >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${member.attendancePct}%` }}
                          />
                        </div>
                        <span className="text-slate-600">{member.attendancePct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium text-navy">{member.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Member">
        <p className="mb-4 text-sm text-slate-500">
          Demo mode — form submission is not persisted.
        </p>
        <div className="space-y-3">
          <input
            placeholder="First name"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
          <input
            placeholder="Last name"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
          <input
            placeholder="Email"
            type="email"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => setShowAddModal(false)}
            className="w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-white hover:bg-navy-light"
          >
            Add Member
          </button>
        </div>
      </Modal>
    </>
  )
}
