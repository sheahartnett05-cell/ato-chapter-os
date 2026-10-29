import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEMO_BYLAWS,
  DEMO_EXEC_SLIDES,
  DEMO_HOUSE_TASKS,
} from '../data/chapterResourcesData'
import { allowDemoData } from '../lib/demoSeed'
import { readJson, writeJson } from '../lib/persist'
import type {
  BylawsDocument,
  ChapterMeetingNotes,
  ExecSlide,
  HouseTask,
  HouseTaskKind,
  HouseTaskStatus,
  MeetingAttachment,
} from '../types/chapterResources'

const SLIDES_KEY = 'chapter-os-exec-slides'
const MEETING_KEY = 'chapter-os-chapter-meeting'
const BYLAWS_KEY = 'chapter-os-bylaws'
const HOUSE_KEY = 'chapter-os-house-tasks'

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function readSlides(): ExecSlide[] {
  const stored = readJson<ExecSlide[] | null>(SLIDES_KEY, null)
  if (stored && stored.length > 0) return stored
  return allowDemoData() ? DEMO_EXEC_SLIDES : []
}

function readBylaws(): BylawsDocument[] {
  const stored = readJson<BylawsDocument[] | null>(BYLAWS_KEY, null)
  if (stored && stored.length > 0) return stored
  return allowDemoData() ? DEMO_BYLAWS : []
}

const EMPTY_MEETING: ChapterMeetingNotes = { agenda: '', minutes: '', attachments: [] }

function readMeetingNotes(): ChapterMeetingNotes {
  const stored = readJson<ChapterMeetingNotes | null>(MEETING_KEY, null)
  if (stored) {
    return {
      agenda: stored.agenda ?? '',
      minutes: stored.minutes ?? '',
      attachments: stored.attachments ?? [],
    }
  }
  return { ...EMPTY_MEETING }
}

function readHouseTasks(): HouseTask[] {
  const stored = readJson<HouseTask[] | null>(HOUSE_KEY, null)
  if (stored && stored.length > 0) return stored
  return allowDemoData() ? DEMO_HOUSE_TASKS : []
}

interface ChapterResourcesContextValue {
  execSlides: ExecSlide[]
  updateSlide: (id: string, patch: Partial<Omit<ExecSlide, 'id'>>) => void
  addSlide: (slide: Omit<ExecSlide, 'id'>) => ExecSlide
  deleteSlide: (id: string) => void

  meetingNotes: ChapterMeetingNotes
  updateMeetingNotes: (patch: Partial<Pick<ChapterMeetingNotes, 'agenda' | 'minutes'>>) => void
  addMeetingAttachment: (input: { label: string; fileName: string }) => MeetingAttachment
  removeMeetingAttachment: (id: string) => void

  bylaws: BylawsDocument[]
  importBylaws: (input: { fileName: string; content: string; importedBy: string }) => BylawsDocument
  deleteBylaws: (id: string) => void

  houseTasks: HouseTask[]
  addHouseTask: (task: Omit<HouseTask, 'id' | 'createdAt' | 'status'> & { status?: HouseTaskStatus }) => HouseTask
  updateHouseTask: (id: string, patch: Partial<HouseTask>) => void
  deleteHouseTask: (id: string) => void
  tasksByKind: (kind: HouseTaskKind) => HouseTask[]
}

const ChapterResourcesContext = createContext<ChapterResourcesContextValue | null>(null)

export function ChapterResourcesProvider({ children }: { children: ReactNode }) {
  const [execSlides, setExecSlides] = useState<ExecSlide[]>(readSlides)
  const [meetingNotes, setMeetingNotes] = useState<ChapterMeetingNotes>(readMeetingNotes)
  const [bylaws, setBylaws] = useState<BylawsDocument[]>(readBylaws)
  const [houseTasks, setHouseTasks] = useState<HouseTask[]>(readHouseTasks)

  const persistMeeting = useCallback((next: ChapterMeetingNotes) => {
    setMeetingNotes(next)
    writeJson(MEETING_KEY, next)
  }, [])

  const persistSlides = useCallback((next: ExecSlide[]) => {
    setExecSlides(next)
    writeJson(SLIDES_KEY, next)
  }, [])

  const persistBylaws = useCallback((next: BylawsDocument[]) => {
    setBylaws(next)
    writeJson(BYLAWS_KEY, next)
  }, [])

  const persistHouse = useCallback((next: HouseTask[]) => {
    setHouseTasks(next)
    writeJson(HOUSE_KEY, next)
  }, [])

  const updateSlide = useCallback(
    (id: string, patch: Partial<Omit<ExecSlide, 'id'>>) => {
      persistSlides(execSlides.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    },
    [execSlides, persistSlides]
  )

  const addSlide = useCallback(
    (slide: Omit<ExecSlide, 'id'>) => {
      const next: ExecSlide = { ...slide, id: uid('slide') }
      persistSlides([...execSlides, next])
      return next
    },
    [execSlides, persistSlides]
  )

  const deleteSlide = useCallback(
    (id: string) => {
      persistSlides(execSlides.filter((s) => s.id !== id))
    },
    [execSlides, persistSlides]
  )

  const updateMeetingNotes = useCallback(
    (patch: Partial<Pick<ChapterMeetingNotes, 'agenda' | 'minutes'>>) => {
      persistMeeting({ ...meetingNotes, ...patch })
    },
    [meetingNotes, persistMeeting]
  )

  const addMeetingAttachment = useCallback(
    (input: { label: string; fileName: string }) => {
      const attachment: MeetingAttachment = {
        id: uid('meet'),
        label: input.label.trim() || input.fileName,
        fileName: input.fileName,
        uploadedAt: new Date().toISOString(),
      }
      persistMeeting({
        ...meetingNotes,
        attachments: [attachment, ...meetingNotes.attachments],
      })
      return attachment
    },
    [meetingNotes, persistMeeting]
  )

  const removeMeetingAttachment = useCallback(
    (id: string) => {
      persistMeeting({
        ...meetingNotes,
        attachments: meetingNotes.attachments.filter((a) => a.id !== id),
      })
    },
    [meetingNotes, persistMeeting]
  )

  const importBylaws = useCallback(
    (input: { fileName: string; content: string; importedBy: string }) => {
      const doc: BylawsDocument = {
        id: uid('bylaws'),
        fileName: input.fileName.trim() || 'bylaws.txt',
        content: input.content.trim(),
        importedAt: new Date().toISOString(),
        importedBy: input.importedBy,
      }
      persistBylaws([doc, ...bylaws])
      return doc
    },
    [bylaws, persistBylaws]
  )

  const deleteBylaws = useCallback(
    (id: string) => {
      persistBylaws(bylaws.filter((b) => b.id !== id))
    },
    [bylaws, persistBylaws]
  )

  const addHouseTask = useCallback(
    (
      task: Omit<HouseTask, 'id' | 'createdAt' | 'status'> & { status?: HouseTaskStatus }
    ) => {
      const next: HouseTask = {
        ...task,
        id: uid('house'),
        status: task.status ?? 'open',
        createdAt: new Date().toISOString(),
      }
      persistHouse([next, ...houseTasks])
      return next
    },
    [houseTasks, persistHouse]
  )

  const updateHouseTask = useCallback(
    (id: string, patch: Partial<HouseTask>) => {
      persistHouse(
        houseTasks.map((t) => {
          if (t.id !== id) return t
          const updated = { ...t, ...patch }
          if (patch.status === 'done' && !updated.completedAt) {
            updated.completedAt = new Date().toISOString()
          }
          if (patch.status && patch.status !== 'done') {
            updated.completedAt = undefined
          }
          return updated
        })
      )
    },
    [houseTasks, persistHouse]
  )

  const deleteHouseTask = useCallback(
    (id: string) => {
      persistHouse(houseTasks.filter((t) => t.id !== id))
    },
    [houseTasks, persistHouse]
  )

  const tasksByKind = useCallback(
    (kind: HouseTaskKind) => houseTasks.filter((t) => t.kind === kind),
    [houseTasks]
  )

  const value = useMemo<ChapterResourcesContextValue>(
    () => ({
      execSlides,
      updateSlide,
      addSlide,
      deleteSlide,
      meetingNotes,
      updateMeetingNotes,
      addMeetingAttachment,
      removeMeetingAttachment,
      bylaws,
      importBylaws,
      deleteBylaws,
      houseTasks,
      addHouseTask,
      updateHouseTask,
      deleteHouseTask,
      tasksByKind,
    }),
    [
      execSlides,
      updateSlide,
      addSlide,
      deleteSlide,
      meetingNotes,
      updateMeetingNotes,
      addMeetingAttachment,
      removeMeetingAttachment,
      bylaws,
      importBylaws,
      deleteBylaws,
      houseTasks,
      addHouseTask,
      updateHouseTask,
      deleteHouseTask,
      tasksByKind,
    ]
  )

  return (
    <ChapterResourcesContext.Provider value={value}>{children}</ChapterResourcesContext.Provider>
  )
}

export function useChapterResources(): ChapterResourcesContextValue {
  const ctx = useContext(ChapterResourcesContext)
  if (!ctx) throw new Error('useChapterResources must be used within ChapterResourcesProvider')
  return ctx
}
