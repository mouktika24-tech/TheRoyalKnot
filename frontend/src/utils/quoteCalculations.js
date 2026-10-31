export function calculateQuote(quote) {
  const baseAmount = quote.pricePerPlate * quote.estimatedGuestCount
  const gstAmount = baseAmount * quote.gstRate
  const finalTotal = baseAmount + gstAmount + quote.additionalCharges

  return { baseAmount, gstAmount, finalTotal }
}

function getMenuBreadth(quote) {
  return Object.values(quote.menu).reduce(
    (total, items) => total + items.length,
    0,
  )
}

function getIncludedServiceCount(quote) {
  return Object.values(quote.services).filter(Boolean).length
}

export function getQuoteRecommendations(quotes) {
  if (quotes.length === 0) {
    return { lowestQuoteId: null, bestValueQuoteId: null, scores: {} }
  }

  const totals = quotes.map((quote) => ({
    quote,
    total: calculateQuote(quote).finalTotal,
  }))
  const lowestTotal = Math.min(...totals.map(({ total }) => total))
  const maxIncludedServices = Math.max(...quotes.map(getIncludedServiceCount), 1)
  const scores = {}

  for (const quote of quotes) {
    const priceRatio = lowestTotal / calculateQuote(quote).finalTotal
    const menuRatio = Math.min(getMenuBreadth(quote) / 24, 1)
    const serviceRatio = getIncludedServiceCount(quote) / maxIncludedServices

    scores[quote.id] = Math.round(
      (menuRatio * 0.3 + serviceRatio * 0.3 + priceRatio * 0.4) * 100,
    )
  }

  return {
    lowestQuoteId: totals.reduce(
      (lowest, current) => (current.total < lowest.total ? current : lowest),
    ).quote.id,
    bestValueQuoteId: quotes.reduce((best, current) =>
      scores[current.id] > scores[best.id] ? current : best,
    ).id,
    scores,
  }
}
