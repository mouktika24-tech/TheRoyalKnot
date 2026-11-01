export const milestoneDefinitions = [
  { id: 'booking', name: 'Booking Advance', percentage: 20, sequence: 1 },
  { id: 'planning', name: 'Planning Milestone', percentage: 50, sequence: 2 },
  { id: 'final', name: 'Final Payment', percentage: 30, sequence: 3 },
]

export function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function calculateMilestones(wedding, payments, today = getTodayDate()) {
  const bookingAmount = Math.floor((wedding.contractValue * 20) / 100)
  const planningAmount = Math.floor((wedding.contractValue * 50) / 100)
  const milestoneAmounts = {
    booking: bookingAmount,
    planning: planningAmount,
    final: wedding.contractValue - bookingAmount - planningAmount,
  }

  return milestoneDefinitions.map((definition) => {
    const amount = milestoneAmounts[definition.id]
    const amountPaid = payments
      .filter(
        (payment) =>
          payment.weddingId === wedding.id &&
          payment.milestoneId === definition.id,
      )
      .reduce((total, payment) => total + payment.amount, 0)
    const remaining = Math.max(0, amount - amountPaid)
    const dueDate = wedding.dueDates[definition.id]
    const status =
      remaining === 0
        ? 'PAID'
        : dueDate < today
          ? 'OVERDUE'
          : amountPaid > 0
            ? 'PARTIAL'
            : 'PENDING'

    return {
      ...definition,
      weddingId: wedding.id,
      weddingName: wedding.weddingName,
      clientName: wedding.clientName,
      amount,
      amountPaid,
      remaining,
      dueDate,
      status,
      progress: amount > 0 ? Math.min((amountPaid / amount) * 100, 100) : 0,
    }
  })
}

export function calculatePaymentSummary(weddings, payments, today = getTodayDate()) {
  const weddingIds = new Set(weddings.map((wedding) => wedding.id))
  const scopedPayments = payments.filter((payment) =>
    weddingIds.has(payment.weddingId),
  )
  const totalContractValue = weddings.reduce(
    (total, wedding) => total + wedding.contractValue,
    0,
  )
  const totalReceived = scopedPayments.reduce(
    (total, payment) => total + payment.amount,
    0,
  )
  const milestones = weddings.flatMap((wedding) =>
    calculateMilestones(wedding, scopedPayments, today),
  )
  const upcomingPayment = milestones
    .filter(
      (milestone) =>
        milestone.remaining > 0 &&
        milestone.dueDate >= today &&
        milestone.status !== 'PAID',
    )
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))[0] ?? null

  return {
    totalContractValue,
    totalReceived,
    outstandingBalance: Math.max(0, totalContractValue - totalReceived),
    overdueAmount: milestones
      .filter((milestone) => milestone.status === 'OVERDUE')
      .reduce((total, milestone) => total + milestone.remaining, 0),
    paymentProgress:
      totalContractValue > 0
        ? Math.min((totalReceived / totalContractValue) * 100, 100)
        : 0,
    upcomingPayment,
    milestones,
  }
}
