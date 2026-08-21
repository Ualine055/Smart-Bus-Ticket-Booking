import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  runTransaction,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export type CompanyStatus = 'pending' | 'approved' | 'rejected'

export interface Company {
  id?: string
  name: string
  email: string
  phone: string
  licenseNumber: string
  address: string
  fleetSize: number
  /** uid of the user who submitted the application; promoted to `company` on approval. */
  ownerId: string
  ownerName: string
  status: CompanyStatus
  appliedAt: Date
  reviewedAt?: Date
  /** uid of the admin who approved or rejected. */
  reviewedBy?: string
  rejectionReason?: string
}

export type CompanyApplication = Pick<
  Company,
  'name' | 'email' | 'phone' | 'licenseNumber' | 'address' | 'fleetSize' | 'ownerId' | 'ownerName'
>

/** Firestore returns Timestamps; normalise so callers always get a Date. */
function toDate(value: unknown): Date | undefined {
  if (!value) return undefined
  if (value instanceof Date) return value
  if (typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate()
  }
  return undefined
}

function toCompany(id: string, data: Record<string, unknown>): Company {
  return {
    ...(data as unknown as Company),
    id,
    appliedAt: toDate(data.appliedAt) ?? new Date(0),
    reviewedAt: toDate(data.reviewedAt),
  }
}

/**
 * Submit a bus operator application. The applicant keeps their `passenger` role
 * until an admin approves, so registering cannot grant company access by itself.
 */
export const applyForCompany = async (application: CompanyApplication) => {
  try {
    const existing = await getCompanyByOwner(application.ownerId)

    if (existing.company && existing.company.status !== 'rejected') {
      return {
        success: false,
        error:
          existing.company.status === 'pending'
            ? 'You already have an application awaiting review.'
            : 'You are already registered as a bus operator.',
      }
    }

    const licenseTaken = await getDocs(
      query(collection(db, 'companies'), where('licenseNumber', '==', application.licenseNumber)),
    )

    if (!licenseTaken.empty) {
      return { success: false, error: 'That license number is already registered.' }
    }

    const docRef = await addDoc(collection(db, 'companies'), {
      ...application,
      status: 'pending' satisfies CompanyStatus,
      appliedAt: Timestamp.now(),
    })

    return { success: true, companyId: docRef.id }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/** All companies, newest application first. Sorted in memory so no composite index is required. */
export const getCompanies = async (status?: CompanyStatus) => {
  try {
    const snapshot = await getDocs(
      status
        ? query(collection(db, 'companies'), where('status', '==', status))
        : collection(db, 'companies'),
    )

    const companies = snapshot.docs
      .map((entry) => toCompany(entry.id, entry.data()))
      .sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime())

    return { success: true, companies }
  } catch (error) {
    return { success: false, error: (error as Error).message, companies: [] as Company[] }
  }
}

/** The application belonging to a given user, if any. */
export const getCompanyByOwner = async (ownerId: string) => {
  try {
    const snapshot = await getDocs(
      query(collection(db, 'companies'), where('ownerId', '==', ownerId)),
    )

    if (snapshot.empty) {
      return { success: true, company: null }
    }

    const newest = snapshot.docs
      .map((entry) => toCompany(entry.id, entry.data()))
      .sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime())[0]

    return { success: true, company: newest }
  } catch (error) {
    return { success: false, error: (error as Error).message, company: null }
  }
}

/**
 * Approve an application and promote its owner to the `company` role in the same
 * transaction, so a company can never end up approved without dashboard access
 * (or vice versa) if one write fails.
 */
export const approveCompany = async (companyId: string, adminUid: string) => {
  try {
    await runTransaction(db, async (transaction) => {
      const companyRef = doc(db, 'companies', companyId)
      const snapshot = await transaction.get(companyRef)

      if (!snapshot.exists()) {
        throw new Error('This application no longer exists.')
      }

      const company = snapshot.data() as Company

      if (company.status === 'approved') {
        throw new Error('This company is already approved.')
      }

      const userRef = doc(db, 'users', company.ownerId)
      const userSnapshot = await transaction.get(userRef)

      if (!userSnapshot.exists()) {
        throw new Error('The applicant no longer has an account.')
      }

      transaction.update(companyRef, {
        status: 'approved',
        reviewedAt: Timestamp.now(),
        reviewedBy: adminUid,
      })

      transaction.update(userRef, { role: 'company', companyId })
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Reject an application. If the company had already been approved this also
 * demotes the owner back to `passenger`, which doubles as a suspend action.
 */
export const rejectCompany = async (companyId: string, adminUid: string, reason: string) => {
  try {
    await runTransaction(db, async (transaction) => {
      const companyRef = doc(db, 'companies', companyId)
      const snapshot = await transaction.get(companyRef)

      if (!snapshot.exists()) {
        throw new Error('This application no longer exists.')
      }

      const company = snapshot.data() as Company
      const wasApproved = company.status === 'approved'
      const userRef = doc(db, 'users', company.ownerId)

      // Reads must all happen before writes inside a transaction.
      const userSnapshot = wasApproved ? await transaction.get(userRef) : null

      transaction.update(companyRef, {
        status: 'rejected',
        reviewedAt: Timestamp.now(),
        reviewedBy: adminUid,
        rejectionReason: reason,
      })

      if (userSnapshot?.exists()) {
        transaction.update(userRef, { role: 'passenger', companyId: null })
      }
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/** Company record attached to a user, used to scope a dashboard to its own operator. */
export const getCompanyById = async (companyId: string) => {
  try {
    const snapshot = await getDoc(doc(db, 'companies', companyId))

    if (!snapshot.exists()) {
      return { success: false, error: 'Company not found', company: null }
    }

    return { success: true, company: toCompany(snapshot.id, snapshot.data()) }
  } catch (error) {
    return { success: false, error: (error as Error).message, company: null }
  }
}
