import { useSyncExternalStore } from 'react'

const KEY = 'employeeMode'
const listeners = new Set<() => void>()

export function getEmployeeMode(): boolean {
  return localStorage.getItem(KEY) !== 'false'
}

export function setEmployeeMode(value: boolean): void {
  localStorage.setItem(KEY, value ? 'true' : 'false')
  listeners.forEach(l => l())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  // storage events keep other tabs in sync
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

export function useEmployeeMode(): boolean {
  return useSyncExternalStore(subscribe, getEmployeeMode, () => true)
}
