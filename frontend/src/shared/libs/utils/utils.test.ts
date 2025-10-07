import { describe, expect, it } from "vitest"

import { parseArrayOfNumbers, parseArrayOfStrings } from "../zod.utils"
import {
  add2dItemByCoords,
  capitalizeFirstLetter,
  clearObject,
  clearObjectByKeys,
  createConcatIdsFn,
  exists2dArray,
  find2dItemByCoords,
  getNumberToFixed,
  objectToJSON,
  remove2dItemByCoords,
  toBool,
} from "./utils"

describe("getNumberToFixed", () => {
  it("rounds a number to the specified number of digits", () => {
    expect(getNumberToFixed(1.23456, 2)).toBe(1.23)
    expect(getNumberToFixed(1.235, 2)).toBe(1.24)
  })
})

describe("capitalizeFirstLetter", () => {
  it("makes the first letter uppercase", () => {
    expect(capitalizeFirstLetter("test")).toBe("Test")
    expect(capitalizeFirstLetter("тест")).toBe("Тест")
  })
})

describe("toBool", () => {
  it('converts the string "true" to true, otherwise false', () => {
    expect(toBool("true")).toBe(true)
    expect(toBool("false")).toBe(false)
    expect(toBool("")).toBe(false)
  })
})

describe("exists2dArray", () => {
  it("returns true if element exists in 2d array", () => {
    const arr: number[][] = [
      [1, 2],
      [3, 4],
    ]
    expect(exists2dArray(arr, 3)).toBe(true)
  })
  it("returns false if element does not exist in 2d array", () => {
    const arr: number[][] = [
      [1, 2],
      [3, 4],
    ]
    expect(exists2dArray(arr, 5)).toBe(false)
  })
})

describe("find2dItemByCoords", () => {
  it("returns the correct element by coordinates", () => {
    const arr: number[][] = [
      [1, 2],
      [3, 4],
    ]
    expect(find2dItemByCoords(arr, [1, 1])).toBe(4)
  })
  it("returns undefined for out-of-bounds coordinates", () => {
    const arr: number[][] = [
      [1, 2],
      [3, 4],
    ]
    expect(find2dItemByCoords(arr, [2, 2])).toBeUndefined()
  })
})

describe("remove2dItemByCoords", () => {
  it("removes the element at the given coordinates", () => {
    const arr: number[][] = [
      [1, 2],
      [3, 4],
    ]
    remove2dItemByCoords(arr, [0, 1])
    expect(arr).toEqual([[1, 2], [4]])
  })
})

describe("add2dItemByCoords", () => {
  it("adds the element at the given coordinates", () => {
    const arr: number[][] = [
      [1, 2],
      [3, 4],
    ]
    add2dItemByCoords(arr, [1, 0], 9)
    expect(arr).toEqual([
      [1, 9, 2],
      [3, 4],
    ])
  })
})

describe("objectToJSON", () => {
  it("returns correct JSON string for simple object", () => {
    expect(objectToJSON({ a: 1, b: 2 })).toBe(JSON.stringify({ a: 1, b: 2 }))
  })
  it("handles circular references", () => {
    interface Circular {
      a: number
      self?: Circular
    }
    const obj: Circular = { a: 1 }
    obj.self = obj
    expect(() => objectToJSON(obj)).not.toThrow()
  })
})

describe("clearObjectByKeys", () => {
  it("keeps only specified keys in the object", () => {
    const obj: Record<string, number> = { a: 1, b: 2, c: 3 }
    expect(clearObjectByKeys(obj, ["a", "c"])).toEqual({ a: 1, c: 3 })
  })
})

describe("clearObject", () => {
  it("removes keys with undefined, null, or empty string values", () => {
    const obj: Record<string, unknown> = { a: 1, b: undefined, c: null, d: "", e: 2 }
    expect(clearObject(obj)).toEqual({ a: 1, e: 2 })
  })
})

describe("parseArrayOfStrings", () => {
  it("splits a comma-separated string into an array of strings", () => {
    expect(parseArrayOfStrings("a,b,c")).toEqual(["a", "b", "c"])
  })
  it("removes empty elements", () => {
    expect(parseArrayOfStrings("a,,b,,c")).toEqual(["a", "b", "c"])
  })
})

describe("parseArrayOfNumbers", () => {
  it("splits a comma-separated string into an array of numbers", () => {
    expect(parseArrayOfNumbers("1,2,3")).toEqual([1, 2, 3])
  })
  it("removes empty elements", () => {
    expect(parseArrayOfNumbers("1,2,,3")).toEqual([1, 2, 3])
  })
})

describe("createConcatIdsFn", () => {
  it("returns a function that concatenates title and id with a dash", () => {
    const fn = createConcatIdsFn("test")
    expect(fn("123")).toBe("test-123")
  })
})
