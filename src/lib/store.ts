// Persistent store using Vercel Blob Storage
// Each data type is stored as a JSON blob
// Falls back to seed data on first read

import { put, list } from '@vercel/blob'

// ─── Types ───────────────────────────────────────────────────

export interface Draft {
  id: string
  to: string
  subject: string
  body: string
  status: string
  createdAt: string
  category: string
  approvedAt?: string
  rejectedAt?: string
  rejectionNote?: string
}

export interface Task {
  id: string
  title: string
  owner: string
  status: string
  priority: string
  category: string
  completedAt?: string
}

export interface ActivityEntry {
  id: string
  time: string
  text: string
  icon: string
  createdAt: string
}

export interface InboxStatus {
  lastReviewed: string | null
  pendingCount: number
  urgentCount: number
}

export interface ActionItem {
  id: string
  title: string
  source: 'granola' | 'linear' | 'email' | 'slack' | 'imessage'
  sourceDetail: string
  project: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  dueDate: string
  status: 'pending' | 'done'
  assignee: string
  notes: string
  completedAt?: string
}

// ─── Seed Data ───────────────────────────────────────────────

const SEED_DRAFTS: Draft[] = [
  {"id":"draft-001","to":"careers@cockroachlabs.com","subject":"Re: PM Interview — Rescheduled to Friday 1/31","body":"Hi team,\n\nThank you for the flexibility in rescheduling. I'm confirmed for Friday, January 31st at 10:00 AM ET.\n\nLooking forward to the conversation.\n\nBest,\nGavin McNamara","status":"pending","createdAt":"2026-01-28T14:30:00Z","category":"job-search"},
  {"id":"draft-002","to":"simone.vigano@principledintelligence.com","subject":"Re: Connecting on AI Strategy","body":"Hi Simone,\n\nThanks for reaching out — I'd love to connect. Your work at Principled Intelligence aligns closely with what we're building at Why Not Us Labs.\n\nWould you be open to a 15-minute call this week? Happy to share what we're working on.\n\nBest,\nGavin","status":"pending","createdAt":"2026-01-28T15:00:00Z","category":"networking"},
  {"id":"draft-003","to":"guidepoint@surveys.com","subject":"Re: Expert Consultation Invitations","body":"Hi,\n\nI'd be happy to participate in both the AI Software and Communications Recording consultations. Please send over the scheduling details.\n\nBest,\nGavin McNamara","status":"pending","createdAt":"2026-01-28T13:45:00Z","category":"consulting"}
]

const SEED_TASKS: Task[] = [
  {"id":"f1","title":"Slack integration — Socket Mode live","owner":"finn","status":"done","priority":"high","category":"Integration"},
  {"id":"f2","title":"CockroachDB interview prep + voice notes","owner":"finn","status":"done","priority":"high","category":"Job Search"},
  {"id":"f3","title":"Finn avatar generated (Arcane-style)","owner":"finn","status":"done","priority":"medium","category":"Identity"},
  {"id":"f4","title":"#wnu-dev channel summary delivered","owner":"finn","status":"done","priority":"medium","category":"Comms"},
  {"id":"f5","title":"Email sweeps (7am + 1pm)","owner":"finn","status":"done","priority":"high","category":"Recurring"},
  {"id":"f6","title":"iMessage integration setup","owner":"finn","status":"in-progress","priority":"medium","category":"Integration"},
  {"id":"f7","title":"Deep CockroachDB prep for Fri interview","owner":"finn","status":"pending","priority":"high","category":"Job Search"},
  {"id":"f8","title":"Oyster Bay demo site build","owner":"finn","status":"pending","priority":"medium","category":"Project"},
  {"id":"f9","title":"BLD auto-email on new posts","owner":"finn","status":"pending","priority":"medium","category":"Project"},
  {"id":"g1","title":"Gemini API key fixed (removed restrictions)","owner":"gavin","status":"done","priority":"medium","category":"Dev"},
  {"id":"g2","title":"CockroachDB interview → Fri 1/31 @ 10am","owner":"gavin","status":"done","priority":"high","category":"Job Search"},
  {"id":"g3","title":"Check Real Worth App Store status","owner":"gavin","status":"pending","priority":"high","category":"Product"},
  {"id":"g4","title":"LinkedIn DMs — respond to all","owner":"gavin","status":"pending","priority":"medium","category":"Comms"},
  {"id":"g5","title":"Sprout age ranges from Nicolette","owner":"gavin","status":"pending","priority":"medium","category":"Product"}
]

const SEED_ACTIVITY: ActivityEntry[] = [
  {"id":"a0","time":"4:10 PM","text":"Email sweep — no urgent replies needed. 2 job alerts flagged (Fusemachines AI PM, BNY VP POM)","icon":"📧","createdAt":"2026-01-28T21:10:00Z"},
  {"id":"a1","time":"3:45 PM","text":"Command Center Phase 1 live — interactive drafts, live tasks, NBA widget","icon":"🚀","createdAt":"2026-01-28T20:45:00Z"},
  {"id":"a2","time":"2:45 PM","text":"Command Center redesigned — Jony Ive edition deployed","icon":"🎨","createdAt":"2026-01-28T19:45:00Z"},
  {"id":"a3","time":"1:15 PM","text":"Inbox reviewed — 3 drafts ready for review","icon":"📧","createdAt":"2026-01-28T18:15:00Z"},
  {"id":"a4","time":"1:00 PM","text":"Email sweep complete — 12 processed, 0 urgent","icon":"✉️","createdAt":"2026-01-28T18:00:00Z"},
  {"id":"a5","time":"12:30 PM","text":"#wnu-dev summary delivered to Slack","icon":"💬","createdAt":"2026-01-28T17:30:00Z"},
  {"id":"a6","time":"11:00 AM","text":"CockroachDB research doc finalized — 4,200 words","icon":"📋","createdAt":"2026-01-28T16:00:00Z"},
  {"id":"a7","time":"10:15 AM","text":"Calendar checked — no conflicts today","icon":"📅","createdAt":"2026-01-28T15:15:00Z"},
  {"id":"a8","time":"9:30 AM","text":"LinkedIn DMs scanned — 2 need your response","icon":"🔗","createdAt":"2026-01-28T14:30:00Z"},
  {"id":"a9","time":"7:00 AM","text":"Morning email sweep — inbox clear","icon":"🌅","createdAt":"2026-01-28T12:00:00Z"}
]

const SEED_INBOX_STATUS: InboxStatus = {"lastReviewed":"2026-01-28T18:15:00Z","pendingCount":3,"urgentCount":0}

const SEED_ACTION_ITEMS: ActionItem[] = [
  {"id":"ai-001","title":"CockroachDB intro call with Miguel Arenas","source":"granola","sourceDetail":"Gavin McNamara and Miguel Arenas","project":"Job Search","priority":"urgent","dueDate":"2026-01-30","status":"pending","assignee":"gavin","notes":"Friday Jan 30 @ 10:00 AM ET. Review company guide before call."},
  {"id":"ai-002","title":"Take over PR reviews from Graham","source":"granola","sourceDetail":"WNU Daily Standup (1/28)","project":"Why Not Us Labs","priority":"high","dueDate":"2026-01-29","status":"pending","assignee":"gavin","notes":"Graham stepping back from day-to-day. Gavin taking over PR reviews."},
  {"id":"ai-003","title":"Post-meeting sync with Sammy for QA test planning","source":"granola","sourceDetail":"WNU Daily Standup (1/28)","project":"Real Worth","priority":"high","dueDate":"2026-01-28","status":"pending","assignee":"gavin","notes":"Plan manual QA testing of auth migration with Sammy."},
  {"id":"ai-004","title":"Sprout Gifts scope control — document $30K additional work","source":"granola","sourceDetail":"WNU Daily Standup (1/28)","project":"Sprout Gifts","priority":"medium","dueDate":"2026-01-31","status":"pending","assignee":"gavin","notes":"Need to document and control scope creep."},
  {"id":"ai-005","title":"Local business outreach strategy — document plan","source":"granola","sourceDetail":"WNU Daily Standup (1/28)","project":"Oyster Bay","priority":"medium","dueDate":"2026-01-31","status":"pending","assignee":"gavin","notes":"Create outreach strategy for local businesses."},
  {"id":"ai-006","title":"February roadmap documentation","source":"granola","sourceDetail":"WNU Daily Standup (1/28)","project":"Why Not Us Labs","priority":"high","dueDate":"2026-01-31","status":"pending","assignee":"gavin","notes":"Document Feb roadmap for team."},
  {"id":"ai-007","title":"Resolve Justin's Slack access","source":"granola","sourceDetail":"Justin & Gav Weekly Sync (1/27)","project":"Why Not Us Labs","priority":"medium","dueDate":"2026-01-29","status":"pending","assignee":"gavin","notes":"Add Justin back to team Slack ($10/month). May take 24h to propagate."},
  {"id":"ai-008","title":"Address Steve's performance issues","source":"granola","sourceDetail":"Justin & Gav Weekly Sync (1/27)","project":"Why Not Us Labs","priority":"high","dueDate":"2026-01-31","status":"pending","assignee":"gavin","notes":"Missed presentation, poor communication, minimal progress on Linear dashboard over 2 months. Potential termination discussion."},
  {"id":"ai-009","title":"Cellebrite — group interview with Guardian team PMs","source":"granola","sourceDetail":"Cellebrite Video Interview (1/26)","project":"Job Search","priority":"high","dueDate":"2026-02-06","status":"pending","assignee":"gavin","notes":"Next step: group interview with 1-3 Guardian PMs. Currently scheduling around release mode. Final interview with Head of Product late Feb."},
  {"id":"ai-010","title":"Follow up with Simone Viganò — ask for demo links","source":"granola","sourceDetail":"Simone Viganò Meeting (1/26)","project":"Networking","priority":"low","dueDate":"2026-01-31","status":"pending","assignee":"gavin","notes":"Simone offered to run sample tests on our bots. Get demo links and documentation for ScopeGuard and Ghost Agent."},
  {"id":"ai-011","title":"Spirited Hive — start Shopify website updates","source":"granola","sourceDetail":"Spirited Hive Launch Planning (1/23)","project":"Spirited Hive","priority":"high","dueDate":"2026-01-30","status":"pending","assignee":"gavin","notes":"Add Honey Hill Club product to Shopify, update hero tagline to 'It\\'s Tea Time', new hero imagery, update popup. Feb 20 presentation to Jack, March 1 launch."},
  {"id":"ai-012","title":"Spirited Hive — weekly check-in with Chris (Jan 30)","source":"granola","sourceDetail":"Spirited Hive Launch Planning (1/23)","project":"Spirited Hive","priority":"medium","dueDate":"2026-01-30","status":"pending","assignee":"gavin","notes":"Friday check-in. Then Feb 6, Feb 13. Feb 20 present to Jack."},
  {"id":"ai-013","title":"Send CV and portfolio to Samuel (AI People recruiter)","source":"granola","sourceDetail":"AI People Intro (1/23)","project":"Job Search","priority":"medium","dueDate":"2026-01-29","status":"pending","assignee":"gavin","notes":"Samuel in London, focusing on healthcare AI, fintech, robotics roles. $200-300K range."},
  {"id":"ai-014","title":"Sprout Gifts — create Amazon Creator's API application","source":"granola","sourceDetail":"Sprouting All The Way Up (1/25)","project":"Sprout Gifts","priority":"medium","dueDate":"2026-01-31","status":"pending","assignee":"gavin","notes":"Set up in developer console. Also need to complete tax info for affiliate program."},
  {"id":"ai-015","title":"Sprout Gifts — refresh expired toy curation PDFs from Bobby","source":"granola","sourceDetail":"Sprouting All The Way Up (1/25)","project":"Sprout Gifts","priority":"low","dueDate":"2026-02-07","status":"pending","assignee":"gavin","notes":"Bobby created 50 curated toys per age group but PDFs have expired."},
  {"id":"ai-016","title":"Real Worth — submit pricing before new App Store build","source":"granola","sourceDetail":"Gav & T Sync: RealWorth (1/21)","project":"Real Worth","priority":"urgent","dueDate":"2026-01-29","status":"pending","assignee":"gavin","notes":"iOS app rejected again for admin issues. Must submit pricing before new builds. Switched to native Apple payment."},
  {"id":"ai-017","title":"Check Real Worth App Store review status","source":"linear","sourceDetail":"Ongoing","project":"Real Worth","priority":"urgent","dueDate":"2026-01-28","status":"pending","assignee":"gavin","notes":"App was resubmitted. Check if approved or needs fixes."},
  {"id":"ai-018","title":"Respond to LinkedIn DMs","source":"slack","sourceDetail":"Flagged earlier today","project":"Networking","priority":"medium","dueDate":"2026-01-28","status":"pending","assignee":"gavin","notes":"Simone Viganò (Principled Intelligence) and TCS Global Head CPG lead."},
  {"id":"ai-019","title":"Respond to Guidepoint expert consultation invitations","source":"email","sourceDetail":"2 pending invitations","project":"Consulting","priority":"medium","dueDate":"2026-01-29","status":"pending","assignee":"gavin","notes":"AI Software + Communications Recording consultations."},
  {"id":"ai-020","title":"Get Nicolette's additional age ranges for Sprout Gifts","source":"granola","sourceDetail":"Sprouting All The Way Up (1/25)","project":"Sprout Gifts","priority":"medium","dueDate":"2026-02-01","status":"pending","assignee":"gavin","notes":"Need 1-2yr, 2-3yr ranges added to Google Doc."}
]

// ─── Blob Storage Helpers ────────────────────────────────────

const BLOB_PREFIX = 'finn-cc/'

type StoreKey = 'drafts' | 'tasks' | 'activity' | 'inbox-status' | 'action-items'

const SEEDS: Record<StoreKey, unknown> = {
  'drafts': SEED_DRAFTS,
  'tasks': SEED_TASKS,
  'activity': SEED_ACTIVITY,
  'inbox-status': SEED_INBOX_STATUS,
  'action-items': SEED_ACTION_ITEMS,
}

async function readBlob<T>(key: StoreKey): Promise<T> {
  try {
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}${key}.json` })
    if (blobs.length > 0) {
      const res = await fetch(blobs[0].url)
      return await res.json() as T
    }
  } catch (e) {
    console.error(`Failed to read blob ${key}:`, e)
  }
  // Return seed data as fallback
  return SEEDS[key] as T
}

async function writeBlob<T>(key: StoreKey, data: T): Promise<void> {
  try {
    await put(`${BLOB_PREFIX}${key}.json`, JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false,
    })
  } catch (e) {
    console.error(`Failed to write blob ${key}:`, e)
  }
}

// ─── Public API ──────────────────────────────────────────────

export async function getDrafts(): Promise<Draft[]> {
  return readBlob<Draft[]>('drafts')
}
export async function setDrafts(d: Draft[]): Promise<void> {
  await writeBlob('drafts', d)
}

export async function getTasks(): Promise<Task[]> {
  return readBlob<Task[]>('tasks')
}
export async function setTasks(t: Task[]): Promise<void> {
  await writeBlob('tasks', t)
}

export async function getActivity(): Promise<ActivityEntry[]> {
  return readBlob<ActivityEntry[]>('activity')
}
export async function setActivity(a: ActivityEntry[]): Promise<void> {
  await writeBlob('activity', a)
}

export async function getInboxStatus(): Promise<InboxStatus> {
  return readBlob<InboxStatus>('inbox-status')
}
export async function setInboxStatus(s: InboxStatus): Promise<void> {
  await writeBlob('inbox-status', s)
}

export async function getActionItems(): Promise<ActionItem[]> {
  return readBlob<ActionItem[]>('action-items')
}
export async function setActionItems(a: ActionItem[]): Promise<void> {
  await writeBlob('action-items', a)
}

export async function syncAll(data: { drafts?: Draft[]; tasks?: Task[]; activity?: ActivityEntry[]; inboxStatus?: InboxStatus; actionItems?: ActionItem[] }) {
  const promises: Promise<void>[] = []
  if (data.drafts) promises.push(setDrafts(data.drafts))
  if (data.tasks) promises.push(setTasks(data.tasks))
  if (data.activity) promises.push(setActivity(data.activity))
  if (data.inboxStatus) promises.push(setInboxStatus(data.inboxStatus))
  if (data.actionItems) promises.push(setActionItems(data.actionItems))
  await Promise.all(promises)
}
