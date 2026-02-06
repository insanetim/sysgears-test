class DistanceConverter {
  constructor(units = {}) {
    this.units = units
  }

  async addAdditionalUnits(rulesPath = "js/additional-units.json") {
    try {
      const response = await fetch(rulesPath)
      const additionalUnits = await response.json()

      for (const [code, unit] of Object.entries(additionalUnits)) {
        this.units[code] ||= unit
      }
    } catch (error) {
      console.error("Error loading additional units:", error)
    }
  }

  convert(input) {
    const { distance, convert_to } = input
    const { value, unit } = distance

    if (!this.units[unit] || !this.units[convert_to]) {
      throw new Error("Unknown unit")
    }

    if (unit === convert_to) {
      return value
    }

    const inBase = value * this.units[unit].toBase
    const result = inBase / this.units[convert_to].toBase

    return Math.round(result * 100) / 100
  }

  formatResult(value, unit) {
    return {
      unit: unit,
      value: value,
    }
  }
}

class ConverterUI {
  constructor(converter, domElements) {
    this.converter = converter
    this.valueInput = domElements.valueInput
    this.fromSelect = domElements.fromSelect
    this.toSelect = domElements.toSelect
    this.convertBtn = domElements.convertBtn
    this.resultDiv = domElements.resultDiv
    this.resultText = domElements.resultText
    this.resultJson = domElements.resultJson
  }

  init() {
    this.updateSelects()
    this.bindEvents()
  }

  updateSelects() {
    let optionsHTML = ""

    for (const [code, unit] of Object.entries(this.converter.units)) {
      optionsHTML += `<option value="${code}">${unit.name} (${code})</option>`
    }

    this.fromSelect.innerHTML = optionsHTML
    this.toSelect.innerHTML = optionsHTML

    this.fromSelect.value = "m"
    this.toSelect.value = "ft"
  }

  bindEvents() {
    this.convertBtn.addEventListener("click", () => this.convert())

    this.valueInput.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        this.convert()
      }
    })
  }

  convert() {
    const value = parseFloat(this.valueInput.value)

    if (isNaN(value)) {
      alert("Please enter a valid number")
      return
    }

    const inputData = {
      distance: {
        unit: this.fromSelect.value,
        value: value,
      },
      convert_to: this.toSelect.value,
    }

    try {
      const result = this.converter.convert(inputData)
      const formatted = this.converter.formatResult(result, this.toSelect.value)

      this.showResult(value, result, formatted)
    } catch (error) {
      alert("Error: " + error.message)
    }
  }

  showResult(originalValue, result, formatted) {
    const fromName = this.converter.units[this.fromSelect.value].name
    const toName = this.converter.units[this.toSelect.value].name

    this.resultText.innerHTML = `${originalValue} ${fromName} = ${result} ${toName}`

    this.resultJson.textContent = JSON.stringify(formatted, null, 2)

    this.resultDiv.style.display = "block"
  }
}

class ConverterApp {
  constructor(converter, ui) {
    this.converter = converter
    this.ui = ui
  }

  async init() {
    this.ui.init()
    await this.converter.addAdditionalUnits()
    this.ui.updateSelects()
  }
}

class AppFactory {
  static createConverter() {
    const baseUnits = {
      m: { name: "Метри", toBase: 1 },
      cm: { name: "Сантиметри", toBase: 0.01 },
      in: { name: "Дюйми", toBase: 0.0254 },
      ft: { name: "Фути", toBase: 0.3048 },
    }
    return new DistanceConverter(baseUnits)
  }

  static createUI(converter) {
    const domElements = {
      valueInput: document.getElementById("distanceValue"),
      fromSelect: document.getElementById("fromUnit"),
      toSelect: document.getElementById("toUnit"),
      convertBtn: document.getElementById("convertBtn"),
      resultDiv: document.getElementById("result"),
      resultText: document.getElementById("resultText"),
      resultJson: document.getElementById("resultJson"),
    }
    return new ConverterUI(converter, domElements)
  }

  static createApp() {
    const converter = this.createConverter()
    const ui = this.createUI(converter)
    return new ConverterApp(converter, ui)
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const app = AppFactory.createApp()
  await app.init()
})
