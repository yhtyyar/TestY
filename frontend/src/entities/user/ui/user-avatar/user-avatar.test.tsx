import { screen } from "@testing-library/react"
import { renderWithProviders } from "test/helpers"
import { describe, expect, it } from "vitest"

import { UserAvatar } from "./user-avatar"

beforeAll(() => {
  Object.defineProperty(global, "Image", {
    writable: true,
    value: class {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_url: string) {
        setTimeout(() => this.onload && this.onload(), 0)
      }
    },
  })
})

describe("UserAvatar", () => {
  it("renders default avatar when avatar_link is null", () => {
    renderWithProviders(<UserAvatar avatar_link={null} />)

    const icon = screen.getByTestId("username-icon")
    expect(icon).toBeInTheDocument()
  })

  it("renders img with correct src when avatar_link is provided", async () => {
    const link =
      "https://optim.tildacdn.com/tild6464-3532-4635-a661-303164326562/-/resize/60x/-/format/webp/yadro_logo_w_new.png.webp" // yadro icon
    const nonce = 42
    const size = 48

    renderWithProviders(<UserAvatar avatar_link={link} nonce={nonce} size={size} />)

    const image: HTMLImageElement = await screen.findByAltText("avatar")

    expect(image).toBeInTheDocument()
    expect(image.src).toContain(`${link}?nonce=${nonce}`)
    expect(image).toHaveStyle({
      width: `${size}px`,
      height: `${size}px`,
    })
  })

  it("applies default size when size is not provided", () => {
    renderWithProviders(<UserAvatar avatar_link={null} />)

    const wrapper = screen.getByRole("img").parentElement
    expect(wrapper).toHaveStyle({
      minWidth: "32px",
      minHeight: "32px",
    })
  })

  it("applies custom size when size is provided", () => {
    renderWithProviders(<UserAvatar avatar_link={null} size={64} />)

    const wrapper = screen.getByRole("img").parentElement
    expect(wrapper).toHaveStyle({
      minWidth: "64px",
      minHeight: "64px",
    })
  })
})
