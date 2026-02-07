class RuleStrategy {
  execute(data, conditionValue) {
    throw new Error("Method execute() must be implemented")
  }
}

class IncludeRule extends RuleStrategy {
  execute(data, conditions) {
    if (!Array.isArray(conditions) || conditions.length === 0) {
      return data
    }

    const preparedConditions = conditions.map(Object.entries)

    return data.filter(item =>
      preparedConditions.every(entries =>
        entries.every(([key, value]) => item[key] === value)
      )
    )
  }
}

class ExcludeRule extends RuleStrategy {
  execute(data, conditions) {
    if (!Array.isArray(conditions) || conditions.length === 0) {
      return data
    }

    const preparedConditions = conditions.map(Object.entries)

    return data.filter(
      item =>
        !preparedConditions.some(entries =>
          entries.every(([key, value]) => item[key] === value)
        )
    )
  }
}

class SortByRule extends RuleStrategy {
  execute(data, keys) {
    if (!Array.isArray(keys) || keys.length === 0) return data

    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: "base",
    })

    return [...data].sort((a, b) => {
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]

        const valA = a[key]
        const valB = b[key]

        if (valA === valB) continue
        if (valA == null) return 1
        if (valB == null) return -1

        if (typeof valA === "string") {
          const res = collator.compare(valA, valB)
          if (res !== 0) return res
        } else {
          if (valA < valB) return -1
          return 1
        }
      }

      return 0
    })
  }
}

class DataProcessor {
  constructor() {
    this.rules = new Map()
    this.registerDefaultRules()
  }

  registerDefaultRules() {
    this.registerRule("include", new IncludeRule())
    this.registerRule("exclude", new ExcludeRule())
    this.registerRule("sort_by", new SortByRule())
  }

  registerRule(name, ruleStrategy) {
    if (!(ruleStrategy instanceof RuleStrategy)) {
      throw new Error("Rule must be an instance of RuleStrategy")
    }
    this.rules.set(name, ruleStrategy)
  }

  process({ data, condition }) {
    if (!Array.isArray(data)) return { result: [] }
    if (!condition) return { result: [...data] }

    let result = [...data]

    for (const ruleName in condition) {
      const strategy = this.rules.get(ruleName)
      if (!strategy) continue

      result = strategy.execute(result, condition[ruleName])
    }

    return { result }
  }
}

const processor = new DataProcessor()

const input1 = {
  data: [
    { name: "John", email: "john2@mail.com" },
    { name: "John", email: "john1@mail.com" },
    { name: "Jane", email: "jane@mail.com" },
  ],
  condition: { include: [{ name: "John" }], sort_by: ["email"] },
}

const input2 = {
  data: [
    { user: "mike@mail.com", rating: 20, disabled: false },
    { user: "greg@mail.com", rating: 14, disabled: false },
    { user: "john@mail.com", rating: 25, disabled: true },
  ],
  condition: { exclude: [{ disabled: true }], sort_by: ["rating"] },
}

const result1 = processor.process(input1)
const result2 = processor.process(input2)

console.log(result1)
console.log(result2)
