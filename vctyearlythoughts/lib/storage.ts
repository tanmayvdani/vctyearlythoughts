import { type Team } from "./teams"

export interface User {
  email: string
  name: string
  id: string
}

export interface Prediction {
  id: string
  teamId: string
  teamName: string
  teamTag: string
  thought: string
  userId: string
  userName: string
  timestamp: string // ISO string
  isPublic: boolean
}

const STORAGE_KEYS = {
  USER: "vct_capsule_user",
  PREDICTIONS: "vct_capsule_predictions",
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(STORAGE_KEYS.USER)
  return stored ? JSON.parse(stored) : null
}

export function loginUser(email: string): User {
  const user: User = {
    email,
    name: email.split("@")[0],
    id: Math.random().toString(36).substring(7),
  }
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
  return user
}

export function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.USER)
}

export function savePrediction(
  team: Team,
  thought: string,
  isPublic: boolean,
  identity: string,
  user: User | null
): Prediction {
  const predictions = getPredictions()
  
  const userName = identity === "anonymous" ? "Anonymous" : (user?.name || "Guest")
  
  const newPrediction: Prediction = {
    id: Math.random().toString(36).substring(7),
    teamId: team.id,
    teamName: team.name,
    teamTag: team.tag,
    thought,
    userId: user?.id || "guest",
    userName,
    timestamp: new Date().toISOString(),
    isPublic,
  }

  predictions.unshift(newPrediction)
  localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(predictions))
  return newPrediction
}

export function getPredictions(): Prediction[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEYS.PREDICTIONS)
  return stored ? JSON.parse(stored) : []
}

export function getPublicPredictions(): Prediction[] {
  return getPredictions().filter(p => p.isPublic)
}
