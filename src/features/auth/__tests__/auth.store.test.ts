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
    useAuthStore.setState({ user: null, status: "loading" })
  })

  it("初始狀態：status 為 loading、user 為 null", () => {
    const state = useAuthStore.getState()
    expect(state.status).toBe("loading")
    expect(state.user).toBeNull()
  })

  it("setAuthenticated(user) 後 user 有值、status 為 authenticated", () => {
    useAuthStore.getState().setAuthenticated(mockUser)
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.status).toBe("authenticated")
  })

  it("setRedirecting() 後 user 為 null、status 為 redirecting", () => {
    useAuthStore.getState().setAuthenticated(mockUser)
    useAuthStore.getState().setRedirecting()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.status).toBe("redirecting")
  })

  it("setOutOfClient() 後 user 為 null、status 為 out-of-client", () => {
    useAuthStore.getState().setAuthenticated(mockUser)
    useAuthStore.getState().setOutOfClient()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.status).toBe("out-of-client")
  })
})
