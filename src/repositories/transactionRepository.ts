import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { NewTransaction, Transaction } from '../types'
import { seedTransactions } from '../data/seedTransactions'

export type TransactionRepository = {
  getAll: () => Promise<Transaction[]>
  subscribe: (
    onUpdate: (transactions: Transaction[]) => void,
    onError?: (error: Error) => void,
  ) => () => void
  add: (input: NewTransaction) => Promise<Transaction>
  update: (id: string, input: Partial<NewTransaction>) => Promise<void>
  remove: (id: string) => Promise<void>
}

const COLLECTION_NAME = 'transactions'

// Inisialisasi data awal ke Firestore jika koleksi masih kosong
async function ensureSeedData(): Promise<void> {
  try {
    const colRef = collection(db, COLLECTION_NAME)
    const snapshot = await getDocs(colRef)
    if (snapshot.empty) {
      const batch = writeBatch(db)
      for (const item of seedTransactions) {
        const docRef = doc(colRef)
        batch.set(docRef, {
          name: item.name,
          category: item.category,
          source: item.source,
          type: item.type,
          status: item.status,
          amount: item.amount,
          date: item.date,
          note: item.note || '',
          createdAt: new Date().toISOString(),
        })
      }
      await batch.commit()
    }
  } catch (error) {
    console.error('Error saat inisialisasi data awal Firestore:', error)
  }
}

export const transactionRepository: TransactionRepository = {
  async getAll() {
    await ensureSeedData()
    const colRef = collection(db, COLLECTION_NAME)
    const q = query(colRef, orderBy('date', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        name: data.name,
        category: data.category,
        source: data.source,
        type: data.type,
        status: data.status,
        amount: Number(data.amount),
        date: data.date,
        note: data.note || undefined,
      } as Transaction
    })
  },

  subscribe(onUpdate, onError) {
    const colRef = collection(db, COLLECTION_NAME)
    const q = query(colRef, orderBy('date', 'desc'))

    // Pastikan database memiliki data awal
    ensureSeedData().catch((err) => {
      console.error('Seed error:', err)
    })

    return onSnapshot(
      q,
      (snapshot) => {
        const transactions = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            name: data.name,
            category: data.category,
            source: data.source,
            type: data.type,
            status: data.status,
            amount: Number(data.amount),
            date: data.date,
            note: data.note || undefined,
          } as Transaction
        })
        onUpdate(transactions)
      },
      (error) => {
        console.error('Firestore subscription error:', error)
        onError?.(error)
      },
    )
  },

  async add(input) {
    const colRef = collection(db, COLLECTION_NAME)
    const docData = {
      name: input.name,
      category: input.category,
      source: input.source,
      type: input.type,
      status: input.status,
      amount: Number(input.amount),
      date: input.date,
      note: input.note || '',
      createdAt: new Date().toISOString(),
    }
    const docRef = await addDoc(colRef, docData)
    return {
      id: docRef.id,
      ...input,
    }
  },

  async update(id, input) {
    const docRef = doc(db, COLLECTION_NAME, id)
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    }
    if (input.name !== undefined) updateData.name = input.name
    if (input.category !== undefined) updateData.category = input.category
    if (input.source !== undefined) updateData.source = input.source
    if (input.type !== undefined) updateData.type = input.type
    if (input.status !== undefined) updateData.status = input.status
    if (input.amount !== undefined) updateData.amount = Number(input.amount)
    if (input.date !== undefined) updateData.date = input.date
    if (input.note !== undefined) updateData.note = input.note || ''

    await updateDoc(docRef, updateData)
  },

  async remove(id) {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  },
}
