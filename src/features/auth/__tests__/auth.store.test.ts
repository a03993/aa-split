import { beforeEach, describe, expect, it } from "vitest"

import { useAuthStore } from "../auth.store"

const mockUser = {
  id: "user-1",
  displayName: "Test User",
  avatarUrl: "",
  lineUserId: null,
}

describe("auth.store", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isLoading: true, isInitialized: false })
  })

  it("初始狀態：isLoading 為 true、user 為 null、isInitialized 為 false", () => {
    const state = useAuthStore.getState()
    expect(state.isLoading).toBe(true)
    expect(state.user).toBeNull()
    expect(state.isInitialized).toBe(false)
  })

  it("setUser(user) 後 user 有值、isLoading 為 false、isInitialized 為 true", () => {
    useAuthStore.getState().setUser(mockUser)
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.isLoading).toBe(false)
    expect(state.isInitialized).toBe(true)
  })

  it("setUser(null) 後 user 為 null、isLoading 為 false、isInitialized 為 true", () => {
    useAuthStore.getState().setUser(mockUser)
    useAuthStore.getState().setUser(null)
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.isInitialized).toBe(true)
  })

  it("setLoading(false) 後 isLoading 為 false", () => {
    useAuthStore.getState().setLoading(false)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })
})
