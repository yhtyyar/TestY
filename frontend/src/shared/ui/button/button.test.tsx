import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderWithProviders } from "test/helpers"
import { describe, expect, it, vi } from "vitest"

import { Button, ButtonProps } from "./button"

describe("shared/ui/Button", () => {
  const defaultProps: ButtonProps = {
    children: "Test Button",
  }

  const renderButton = (props: Partial<ButtonProps> = {}) =>
    renderWithProviders(
      <Button {...defaultProps} {...props}>
        Test Button
      </Button>
    )

  it("renders with correct text", () => {
    renderButton()
    expect(screen.getByRole("button", { name: /Test Button/i })).toBeInTheDocument()
  })

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    renderButton({ onClick })
    await user.click(screen.getByRole("button", { name: /Test Button/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("is disabled when disabled=true", () => {
    renderButton({ disabled: true })

    const button = screen.getByRole("button", { name: /Test Button/i })
    expect(button).toBeDisabled()
  })
})
