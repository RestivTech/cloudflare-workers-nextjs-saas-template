/**
 * Input validation schemas for API requests
 * Prevents invalid data from reaching business logic
 */

import { ValidationError } from '@/lib/api-error-handler'

/**
 * Base validator interface
 */
interface Validator<T> {
  validate(data: unknown): { error?: { message: string; details?: Record<string, string> }; value?: T }
}

/**
 * String validator with optional constraints
 */
export class StringValidator implements Validator<string> {
  constructor(
    private minLength?: number,
    private maxLength?: number,
    private pattern?: RegExp,
    private allowEmpty: boolean = false
  ) {}

  validate(data: unknown): { error?: { message: string; details?: Record<string, string> }; value?: string } {
    if (typeof data !== 'string') {
      return { error: { message: 'Expected string' } }
    }

    if (!this.allowEmpty && data.trim().length === 0) {
      return { error: { message: 'String cannot be empty' } }
    }

    if (this.minLength && data.length < this.minLength) {
      return { error: { message: `String must be at least ${this.minLength} characters` } }
    }

    if (this.maxLength && data.length > this.maxLength) {
      return { error: { message: `String must be at most ${this.maxLength} characters` } }
    }

    if (this.pattern && !this.pattern.test(data)) {
      return { error: { message: 'String format is invalid' } }
    }

    return { value: data }
  }
}

/**
 * Number validator
 */
export class NumberValidator implements Validator<number> {
  constructor(
    private min?: number,
    private max?: number,
    private isInteger: boolean = false
  ) {}

  validate(data: unknown): { error?: { message: string; details?: Record<string, string> }; value?: number } {
    if (typeof data !== 'number' || isNaN(data)) {
      return { error: { message: 'Expected number' } }
    }

    if (this.isInteger && !Number.isInteger(data)) {
      return { error: { message: 'Expected integer' } }
    }

    if (this.min !== undefined && data < this.min) {
      return { error: { message: `Number must be at least ${this.min}` } }
    }

    if (this.max !== undefined && data > this.max) {
      return { error: { message: `Number must be at most ${this.max}` } }
    }

    return { value: data }
  }
}

/**
 * Boolean validator
 */
export class BooleanValidator implements Validator<boolean> {
  validate(data: unknown): { error?: { message: string; details?: Record<string, string> }; value?: boolean } {
    if (typeof data !== 'boolean') {
      return { error: { message: 'Expected boolean' } }
    }
    return { value: data }
  }
}

/**
 * Array validator
 */
export class ArrayValidator<T> implements Validator<T[]> {
  constructor(
    private itemValidator: Validator<T>,
    private minItems?: number,
    private maxItems?: number
  ) {}

  validate(data: unknown): { error?: { message: string; details?: Record<string, string> }; value?: T[] } {
    if (!Array.isArray(data)) {
      return { error: { message: 'Expected array' } }
    }

    if (this.minItems !== undefined && data.length < this.minItems) {
      return { error: { message: `Array must have at least ${this.minItems} items` } }
    }

    if (this.maxItems !== undefined && data.length > this.maxItems) {
      return { error: { message: `Array must have at most ${this.maxItems} items` } }
    }

    const items: T[] = []
    for (let i = 0; i < data.length; i++) {
      const result = this.itemValidator.validate(data[i])
      if (result.error) {
        return {
          error: {
            message: `Invalid item at index ${i}`,
            details: result.error.details,
          },
        }
      }
      items.push(result.value!)
    }

    return { value: items }
  }
}

/**
 * Object validator
 */
export class ObjectValidator<T extends Record<string, unknown>> implements Validator<T> {
  constructor(private schema: Record<keyof T, { validator: Validator<any>; required?: boolean }>) {}

  validate(data: unknown): { error?: { message: string; details?: Record<string, string> }; value?: T } {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return { error: { message: 'Expected object' } }
    }

    const obj = data as Record<string, unknown>
    const result: Record<string, unknown> = {}
    const details: Record<string, string> = {}

    for (const [key, schema] of Object.entries(this.schema)) {
      const value = obj[key]

      if (value === undefined || value === null) {
        if (schema.required) {
          details[key] = `${key} is required`
        }
        continue
      }

      const validation = schema.validator.validate(value)
      if (validation.error) {
        details[key] = validation.error.message
      } else {
        result[key] = validation.value
      }
    }

    if (Object.keys(details).length > 0) {
      return { error: { message: 'Validation failed', details } }
    }

    return { value: result as T }
  }
}

/**
 * Common validation instances
 */
export const emailValidator = new StringValidator(
  5,
  255,
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/
)

export const urlValidator = new StringValidator(
  5,
  2048,
  /^https?:\/\/.+/
)

export const uuidValidator = new StringValidator(
  36,
  36,
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
)

export const slugValidator = new StringValidator(
  1,
  100,
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/
)

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

/**
 * Sanitize object by removing potentially dangerous keys
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  allowedKeys: Set<string>
): Partial<T> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (allowedKeys.has(key)) {
      if (typeof value === 'string') {
        result[key] = sanitizeString(value)
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = sanitizeObject(value as Record<string, unknown>, allowedKeys)
      } else {
        result[key] = value
      }
    }
  }

  return result as Partial<T>
}
