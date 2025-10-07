import { describe, expect, it } from "vitest"

import {
  hideEditProfileModal,
  hideModal,
  setUserModal,
  showCreateUserModal,
  showEditProfileModal,
  showEditUserModal,
  userReducer,
} from "./user-slice"

const initialState = {
  userModal: null,
  modal: {
    isShow: false,
    isEditMode: false,
  },
  modalProfile: {
    isShow: false,
  },
}

describe("userSlice", () => {
  it("should return the initial state", () => {
    expect(userReducer(undefined, { type: "" })).toEqual(initialState)
  })

  it("should handle setUserModal", () => {
    const modalData = { name: "John" } as unknown as User
    const nextState = userReducer(initialState, setUserModal(modalData))
    expect(nextState.userModal).toEqual(modalData)
  })

  it("should handle showCreateUserModal", () => {
    const nextState = userReducer(initialState, showCreateUserModal())
    expect(nextState.modal.isShow).toBe(true)
    expect(nextState.modal.isEditMode).toBe(false)
  })

  it("should handle showEditUserModal", () => {
    const nextState = userReducer(initialState, showEditUserModal())
    expect(nextState.modal.isShow).toBe(true)
    expect(nextState.modal.isEditMode).toBe(true)
  })

  it("should handle hideModal", () => {
    const state = {
      ...initialState,
      modal: {
        isShow: true,
        isEditMode: true,
      },
    }
    const nextState = userReducer(state, hideModal())
    expect(nextState.modal.isShow).toBe(false)
    expect(nextState.modal.isEditMode).toBe(false)
  })

  it("should handle showEditProfileModal", () => {
    const nextState = userReducer(initialState, showEditProfileModal())
    expect(nextState.modalProfile.isShow).toBe(true)
  })

  it("should handle hideEditProfileModal", () => {
    const state = {
      ...initialState,
      modalProfile: {
        isShow: true,
      },
    }
    const nextState = userReducer(state, hideEditProfileModal())
    expect(nextState.modalProfile.isShow).toBe(false)
  })
})
