import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  projectId: 'catatan-keuangan-pribadi-2ed46',
  appId: '1:42958925386:web:4f6bbf9977146c1cd180b3',
  storageBucket: 'catatan-keuangan-pribadi-2ed46.firebasestorage.app',
  apiKey: 'AIzaSyCT74lXferrLBPCTsgD61v6iqUaX8vq7fQ',
  authDomain: 'catatan-keuangan-pribadi-2ed46.firebaseapp.com',
  messagingSenderId: '42958925386',
  measurementId: 'G-670STQ2MVT',
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
