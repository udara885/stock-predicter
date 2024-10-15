import { dates } from "/utils/dates"

const tickersArr = []

const generateReportBtn = document.querySelector(".generate-report-btn")

generateReportBtn.addEventListener("click", fetchStockData)

document.getElementById("ticker-input-form").addEventListener("submit", (e) => {
	e.preventDefault()
	const tickerInput = document.getElementById("ticker-input")
	if (tickerInput.value.length > 2) {
		generateReportBtn.disabled = false
		const newTickerStr = tickerInput.value
		tickersArr.push(newTickerStr.toUpperCase())
		tickerInput.value = ""
		renderTickers()
	} else {
		const label = document.getElementsByTagName("label")[0]
		label.style.color = "red"
		label.textContent =
			"You must add at least one ticker. A ticker is a 3 letter or more code for a stock. E.g TSLA for Tesla."
	}
})

function renderTickers() {
	const tickersDiv = document.querySelector(".ticker-choice-display")
	tickersDiv.innerHTML = ""
	tickersArr.forEach((ticker) => {
		const newTickerSpan = document.createElement("span")
		newTickerSpan.textContent = ticker
		newTickerSpan.classList.add("ticker")
		tickersDiv.appendChild(newTickerSpan)
	})
}

const loadingArea = document.querySelector(".loading-panel")
const apiMessage = document.getElementById("api-message")

async function fetchStockData() {
	document.querySelector(".action-panel").style.display = "none"
	loadingArea.style.display = "flex"
	try {
		const stockData = await Promise.all(
			tickersArr.map(async (ticker) => {
				const url = `https://polygon-api-worker.lakshanu86.workers.dev/?ticker=${ticker}&startDate=${dates.startDate}&endDate=${dates.endDate}`
				const response = await fetch(url)
				if (!response.ok) {
					const errMsg = await response.text()
					throw new Error("Worker error: " + errMsg)
				}
				apiMessage.innerText = "Creating report..."
				return response.text()
			})
		)
		fetchReport(stockData.join(""))
	} catch (err) {
		loadingArea.innerText = "There was an error fetching stock data."
		console.error(err.message)
	}
}

async function fetchReport(data) {
	const messages = [
		{
			role: "system",
			content:
				"You are a trading lord. Given data on share prices over the past 3 days, write a report of no more than 150 words describing the stocks performance and recommending whether to buy, hold or sell.",
		},
		{
			role: "user",
			content: data,
		},
	]
	try {
		const url = "https://groq-api-worker.lakshanu86.workers.dev"

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(messages)
		})

		const data = await response.json()

		if(!response.ok){
			throw new Error(`Worker Error: ${data.error}`)
		}

		renderReport(data.content)

	} catch (error) {
		console.log("Error: ", error)
		loadingArea.innerText = "Unable to access AI. Please refresh and try again"
	}
}

function renderReport(output) {
	loadingArea.style.display = "none"
	const outputArea = document.querySelector(".output-panel")
	const report = document.createElement("p")
	outputArea.appendChild(report)
	report.textContent = output
	outputArea.style.display = "flex"
}
