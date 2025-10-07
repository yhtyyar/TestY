import { ErrorObj, useAlertError } from "./use-alert-error"

describe("useAlertError", () => {
  describe("empty error handling", () => {
    it("should return null for empty error object", () => {
      const error: ErrorObj = {}
      const result = useAlertError(error)

      expect(result).toBeNull()
    })

    it("should return null when all fields are null", () => {
      const error: ErrorObj = {
        field1: null,
        field2: null,
        field3: null,
      }
      const result = useAlertError(error)

      expect(result).toBeNull()
    })

    it("should return null when all fields are skipped", () => {
      const error: ErrorObj = {
        field1: "error1",
        field2: "error2",
      }
      const result = useAlertError(error, ["field1", "field2"])

      expect(result).toBeNull()
    })
  })

  describe("basic error filtering", () => {
    it("should return all errors when no skip fields provided", () => {
      const error: ErrorObj = {
        email: "Invalid email",
        password: "Password too short",
        username: "Username taken",
      }
      const result = useAlertError(error)

      expect(result).toEqual({
        email: "Invalid email",
        password: "Password too short",
        username: "Username taken",
      })
    })

    it("should filter out null values", () => {
      const error: ErrorObj = {
        email: "Invalid email",
        password: null,
        username: "Username taken",
      }
      const result = useAlertError(error)

      expect(result).toEqual({
        email: "Invalid email",
        username: "Username taken",
      })
    })

    it("should skip specified fields", () => {
      const error: ErrorObj = {
        email: "Invalid email",
        password: "Password too short",
        username: "Username taken",
      }
      const result = useAlertError(error, ["password"])

      expect(result).toEqual({
        email: "Invalid email",
        username: "Username taken",
      })
    })
  })

  describe("skip fields functionality", () => {
    it("should skip multiple fields", () => {
      const error: ErrorObj = {
        email: "Invalid email",
        password: "Password too short",
        username: "Username taken",
        phone: "Invalid phone",
      }
      const result = useAlertError(error, ["password", "phone"])

      expect(result).toEqual({
        email: "Invalid email",
        username: "Username taken",
      })
    })

    it("should handle non-existent skip fields gracefully", () => {
      const error: ErrorObj = {
        email: "Invalid email",
        password: "Password too short",
      }
      const result = useAlertError(error, ["nonexistent", "alsonothere"])

      expect(result).toEqual({
        email: "Invalid email",
        password: "Password too short",
      })
    })

    it("should handle empty skip fields array", () => {
      const error: ErrorObj = {
        email: "Invalid email",
        password: "Password too short",
      }
      const result = useAlertError(error, [])

      expect(result).toEqual({
        email: "Invalid email",
        password: "Password too short",
      })
    })
  })

  describe("mixed scenarios", () => {
    it("should handle mix of null values and skip fields", () => {
      const error: ErrorObj = {
        email: "Invalid email",
        password: null,
        username: "Username taken",
        phone: "Invalid phone",
      }
      const result = useAlertError(error, ["phone"])

      expect(result).toEqual({
        email: "Invalid email",
        username: "Username taken",
      })
    })

    it("should return null when only null values remain after filtering", () => {
      const error: ErrorObj = {
        email: "Invalid email",
        password: null,
        username: null,
      }
      const result = useAlertError(error, ["email"])

      expect(result).toBeNull()
    })

    it("should handle single field error", () => {
      const error: ErrorObj = {
        email: "Invalid email",
      }
      const result = useAlertError(error)

      expect(result).toEqual({
        email: "Invalid email",
      })
    })
  })

  describe("edge cases", () => {
    it("should handle empty string errors", () => {
      const error: ErrorObj = {
        email: "",
        password: "Password too short",
      }
      const result = useAlertError(error)

      expect(result).toEqual({
        email: "",
        password: "Password too short",
      })
    })

    it("should preserve object structure", () => {
      const error: ErrorObj = {
        "field.nested": "Nested field error",
        "field-with-dash": "Dash field error",
      }
      const result = useAlertError(error)

      expect(result).toEqual({
        "field.nested": "Nested field error",
        "field-with-dash": "Dash field error",
      })
    })

    it("should handle very long field names", () => {
      const longFieldName = "a".repeat(100)
      const error: ErrorObj = {
        [longFieldName]: "Long field error",
      }
      const result = useAlertError(error)

      expect(result).toEqual({
        [longFieldName]: "Long field error",
      })
    })
  })

  describe("immutability", () => {
    it("should not mutate original error object", () => {
      const error: ErrorObj = {
        email: "Invalid email",
        password: "Password too short",
      }
      const originalError = { ...error }

      useAlertError(error, ["password"])

      expect(error).toEqual(originalError)
    })

    it("should not mutate skip fields array", () => {
      const error: ErrorObj = {
        email: "Invalid email",
        password: "Password too short",
      }
      const skipFields = ["password"]
      const originalSkipFields = [...skipFields]

      useAlertError(error, skipFields)

      expect(skipFields).toEqual(originalSkipFields)
    })
  })
})
