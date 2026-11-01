const vendorNames = [
  'Royal Rajputana Caterers',
  'Mewari Royal Sound & DJ Console',
  'Jaipur Floral Mandap Decorators',
  'Lake Palace Heritage Hospitality',
  'ShutterCraft Cinema & Drone Ops',
  'Royal Bridal & Guest Glow Lounge',
  'Heritage Vintage Cars & Shuttles',
  'Palace Logistics & Generator Services',
  'Udaipur Folk Arts Collective',
  'Marigold & Mogra Design House',
  'Sheesh Mahal Lighting Atelier',
  'Pichwai Portrait Studio',
  'Saffron Route Wedding Cuisine',
  'Mehrangarh Brass & Dhol Ensemble',
  'Rajasthani Royale Couture',
  'Lotus Lake Floral Studio',
  'The Maharani Cake Atelier',
  'Pink City Guest Concierge',
  'Desert Bloom Mehendi Artists',
  'Jai Ho Baraat Band',
  'Palace Sound & Projection Co.',
  'Silsila Live Entertainment',
  'The Royal Table Linen House',
  'Lakeview Luxury Tent & Lounge',
  'Jaipur Heritage Fireworks',
  'Udaipur Boat & Water Taxi Co.',
  'Mewar Wedding Priest Services',
  'Anokhi Gift & Hamper Studio',
  'Peacock Courtyard Furniture',
  'Pink City Security & Guest Care',
  'Rajputana Valet Services',
  'The Wedding Wardrobe Concierge',
  'Gulab Jal Welcome Bar',
  'Suryagarh Soundproof Staging',
  'Mogra Garland & Floral Jewellery',
  'Royal Guest Transport Fleet',
  'Udaipur Sunrise Photography',
  'Jaipur Heritage Paper & Signage',
  'Palace Kitchen Equipment Hire',
  'Thar Desert Cold Pyro Effects',
  'Rang Mahal Dance Troupe',
  'Lake Palace Laundry & Stewarding',
  'Jodhpur Turban & Safa Artists',
  'The Royal Invitation Atelier',
  'Mewar Medical & First Response',
]

const vendorCategories = [
  'CATERER', 'DJ_SOUND', 'FLORIST', 'DECORATOR', 'PHOTOGRAPHER',
  'MAKEUP', 'TRANSPORT', 'DECORATOR', 'DRUMMERS', 'FLORIST',
  'DECORATOR', 'PHOTOGRAPHER', 'CATERER', 'DRUMMERS', 'MAKEUP',
  'FLORIST', 'CATERER', 'TRANSPORT', 'MAKEUP', 'DRUMMERS',
  'DJ_SOUND', 'DJ_SOUND', 'DECORATOR', 'DECORATOR', 'DECORATOR',
  'TRANSPORT', 'DECORATOR', 'DECORATOR', 'DECORATOR', 'TRANSPORT',
  'TRANSPORT', 'MAKEUP', 'CATERER', 'DJ_SOUND', 'FLORIST',
  'TRANSPORT', 'PHOTOGRAPHER', 'DECORATOR', 'CATERER', 'DECORATOR',
  'DRUMMERS', 'DECORATOR', 'MAKEUP', 'DECORATOR', 'TRANSPORT',
]

const contactNames = [
  'Mahesh Sharma', 'Bunty Rathore', 'Kavita Rathore', 'Nakul Singh', 'Rohit Verma',
  'Priya Mehra', 'Karan Singh', 'Vikram Joshi', 'Salamat Ali', 'Aarav Bhati',
  'Nisha Rathore', 'Rohan Sethi', 'Devika Sharma', 'Arjun Rathore', 'Meera Kapoor',
]

const arrivalStatuses = ['ARRIVED', 'PENDING', 'ARRIVED', 'DELAYED', 'PENDING']

function timeForVendor(index) {
  const totalMinutes = 8 * 60 + ((index * 37) % (13 * 60))
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`
}

export const mockVendors = vendorNames.map((name, index) => {
  const status = arrivalStatuses[index % arrivalStatuses.length]
  const scheduled = timeForVendor(index)
  const actualMinutes = Number(scheduled.slice(0, 2)) * 60 + Number(scheduled.slice(3))
  const adjustedArrival = actualMinutes + (status === 'DELAYED' ? 25 : -10)

  return {
    id: index + 1,
    vendor_id: index + 1,
    checkin_id: index + 1,
    business_name: name,
    name,
    category: vendorCategories[index],
    contact_name: contactNames[index % contactNames.length],
    phone: `+91 90000 ${String(10000 + index).slice(-5)}`,
    email: `vendor${index + 1}@royalknot.example`,
    status,
    arrivalStatus: status.toLowerCase(),
    scheduled_arrival_time: scheduled,
    actual_arrival_time: status === 'PENDING'
      ? ''
      : `${String(Math.floor(adjustedArrival / 60)).padStart(2, '0')}:${String(adjustedArrival % 60).padStart(2, '0')}`,
    scheduled_arrival_date: `2026-12-${String(18 + (index % 3)).padStart(2, '0')}`,
    notes_remarks: status === 'DELAYED'
      ? 'Running behind schedule; venue coordinator has been notified.'
      : status === 'ARRIVED'
        ? 'Checked in with the venue operations desk.'
        : 'Arrival confirmed with the event coordinator.',
  }
})

const taskTemplates = [
  ['Confirm Rambagh Courtyard mehendi layout and guest flow', 'VENUE', ['mehendi', 'courtyard']],
  ['Approve marigold, mogra and tuberose mandap palette', 'DESIGN_DECOR', ['florals', 'mandap']],
  ['Finalize Sangeet stage sightlines and family seating', 'SANGEET', ['stage', 'seating']],
  ['Reconfirm lake-facing Haldi breakfast service timing', 'MEHENDI', ['haldi', 'catering']],
  ['Coordinate Royal Pheras agni permissions with palace team', 'WEDDING_CEREMONY', ['pheras', 'permissions']],
  ['Review Grand Reception menu tasting and Jain options', 'RECEPTION', ['menu', 'guest-care']],
  ['Arrange vintage car route and Baraat arrival marshal', 'VENDORS', ['baraat', 'transport']],
  ['Approve hand-painted welcome signage in Devanagari', 'DESIGN_DECOR', ['signage', 'welcome']],
  ['Collect final guest arrival manifest for Lake Palace', 'VENUE', ['guest-care', 'travel']],
  ['Check Sangeet dhol and folk ensemble sound balance', 'SANGEET', ['sound', 'performance']],
  ['Prepare floral jewellery trays for family mehendi', 'MEHENDI', ['mehendi', 'florals']],
  ['Confirm priest, samagri and auspicious pheras schedule', 'WEDDING_CEREMONY', ['priest', 'ceremony']],
  ['Reconcile palace suite allocations and VIP upgrades', 'VENUE', ['rooms', 'guest-care']],
  ['Inspect cold pyrotechnics and reception safety perimeter', 'RECEPTION', ['safety', 'production']],
  ['Lock chef stations for live Rajasthani thali service', 'VENDORS', ['catering', 'menu']],
  ['Review monogram projection mapping on Sheesh Mahal', 'DESIGN_DECOR', ['projection', 'lighting']],
  ['Coordinate bridal dressing suite and artist call times', 'MEHENDI', ['bridal', 'hospitality']],
  ['Confirm Udaipur boat transfers and weather contingency', 'VENUE', ['transport', 'lake']],
  ['Approve guest hamper notes and room-drop sequence', 'RECEPTION', ['gifting', 'guest-care']],
  ['Sync wedding film cues with Baraat and varmala moments', 'WEDDING_CEREMONY', ['photography', 'timeline']],
  ['Count premium linen, chargers and antique brass tableware', 'RECEPTION', ['tablescape', 'inventory']],
  ['Brief concierge team on dietary and accessibility notes', 'VENUE', ['guest-care', 'accessibility']],
  ['Rehearse family Sangeet entries with lighting operator', 'SANGEET', ['rehearsal', 'lighting']],
  ['Verify floral cold storage and early-morning delivery', 'DESIGN_DECOR', ['florals', 'logistics']],
  ['Issue vendor access badges and service-lift schedule', 'VENDORS', ['security', 'logistics']],
  ['Prepare Haldi cleansing station and heirloom seating', 'MEHENDI', ['haldi', 'hospitality']],
  ['Check reception bar licensing and premium spirit stock', 'RECEPTION', ['bar', 'compliance']],
  ['Confirm family transport manifests for each event day', 'VENUE', ['transport', 'guest-care']],
  ['Review final ceremony run sheet with wedding families', 'WEDDING_CEREMONY', ['run-sheet', 'ceremony']],
  ['Complete post-event vendor load-out and palace handover', 'VENDORS', ['closeout', 'logistics']],
]

const taskStatuses = ['todo', 'in_progress', 'review', 'completed']
const taskStages = {
  todo: 'TO_PLAN',
  in_progress: 'IN_PROGRESS',
  review: 'REVIEW',
  completed: 'DONE',
}
const taskPriorities = ['high', 'medium', 'low']
const owners = ['Ananya · Vendor Ops', 'Vikram · Logistics', 'Aarav · Decor Lead', 'Pooja · Hospitality']
const dueDates = ['2026-12-04', '2026-12-08', '2026-12-12', '2026-12-15', '2026-12-17', '2026-12-18', '2026-12-19', '2026-12-20']

export const mockTasks = Array.from({ length: 180 }, (_, index) => {
  const template = taskTemplates[index % taskTemplates.length]
  const vendor = mockVendors[(index * 7) % mockVendors.length]
  const status = taskStatuses[index % taskStatuses.length]

  return {
    task_id: index + 1,
    title: `${template[0]}${index >= taskTemplates.length ? ` · ${Math.floor(index / taskTemplates.length) + 1}` : ''}`,
    description: `Coordinate ${template[0].toLowerCase()} with the ${index % 3 === 0 ? 'family' : 'palace'} liaison and record the final approval.`,
    category: template[1],
    tags: [...template[2], `day-${(index % 3) + 1}`],
    assigned_vendor: vendor.business_name,
    assignedVendor: vendor.business_name,
    vendor_id: vendor.vendor_id,
    owner_name: owners[index % owners.length],
    priority: taskPriorities[index % taskPriorities.length],
    status,
    stage: taskStages[status],
    due_date: dueDates[index % dueDates.length],
  }
})

const scheduleDays = [
  { date: '2026-12-18', day: 'Day 1 · Mehendi & Sangeet', venue: 'Rambagh Courtyard' },
  { date: '2026-12-19', day: 'Day 2 · Haldi & Royal Pheras', venue: 'Lake Palace' },
  { date: '2026-12-20', day: 'Day 3 · Grand Reception', venue: 'Grand Reception Ballroom' },
]

const eventTemplates = [
  'Guest welcome and rose sherbet reception',
  'Heirloom jewellery and attire check',
  'Floral installation inspection',
  'Family portrait session',
  'Live folk musicians sound check',
  'Ceremonial welcome with dhol ensemble',
  'Mehendi artist stations open',
  'Royal lunch service begins',
  'Bride family mehendi ceremony',
  'Groom family courtyard welcome',
  'Sangeet stage and projection rehearsal',
  'Golden-hour couple portrait session',
  'Guest seating and refreshments',
  'Opening performance by folk ensemble',
  'Family Sangeet performances',
  'Bride and groom grand entrance',
  'Dinner service and live counters',
  'Celebration dance floor opens',
  'Late-night chai and mithai service',
  'Guest departure and venue reset',
]

export const mockScheduleEvents = scheduleDays.flatMap((scheduleDay, dayIndex) => (
  eventTemplates.map((title, eventIndex) => {
    const totalMinutes = 8 * 60 + eventIndex * 40
    const status = dayIndex === 0 && eventIndex === 10
      ? 'ACTIVE'
      : eventIndex < 3
        ? 'COMPLETED'
        : eventIndex === 16 && dayIndex === 1
          ? 'DELAYED'
          : 'PENDING'

    return {
      event_id: dayIndex * eventTemplates.length + eventIndex + 1,
      title: `${scheduleDay.title_of_day} · ${title}`,
      event_time: `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`,
      event_date: scheduleDay.date,
      day: scheduleDay.day,
      day_number: dayIndex + 1,
      title_of_day: dayIndex === 0 ? 'Mehendi & Sangeet' : dayIndex === 1 ? 'Haldi & Royal Pheras' : 'Grand Reception',
      location: scheduleDay.venue,
      responsible_person: owners[(dayIndex + eventIndex) % owners.length],
      status,
      notes: `${scheduleDay.day} at ${scheduleDay.venue}; ${title.toLowerCase()} coordinated with the palace event team.`,
    }
  })
))

const expenseCategories = ['CATERER', 'DJ_SOUND', 'FLORIST', 'LOGISTICS']
const expenseDescriptions = [
  'Additional guest welcome thalis and service',
  'Extended Sangeet sound and lighting call',
  'Fresh mogra and rose floral top-up',
  'Emergency generator fuel and technician',
  'Lake Palace boat transfer for family guests',
  'Late-night chai, kesar milk and mithai service',
  'Additional heritage linen and table settings',
  'Bridal suite floral refresh and delivery',
  'Extra security and valet staffing hours',
  'Reception stage rigging and projection support',
]
const expenseVendors = {
  CATERER: mockVendors[0],
  DJ_SOUND: mockVendors[1],
  FLORIST: mockVendors[2],
  LOGISTICS: mockVendors[7],
}

export const mockExpenses = Array.from({ length: 90 }, (_, index) => {
  const category = expenseCategories[index % expenseCategories.length]
  const vendor = expenseVendors[category]
  const estimatedCost = 18000 + ((index * 13791) % 185000)
  const variance = index % 5 === 0
    ? Math.round(estimatedCost * 0.14)
    : index % 5 === 1
      ? -Math.round(estimatedCost * 0.035)
      : Math.round(estimatedCost * 0.025)
  const actualCost = Math.max(1000, estimatedCost + variance)
  const discrepancy = actualCost - estimatedCost
  const status = discrepancy > 10000 ? 'over_budget' : discrepancy < 0 ? 'under_budget' : 'within_budget'

  return {
    id: index + 1,
    expense_id: index + 1,
    vendor_id: vendor.vendor_id,
    vendor_name: vendor.business_name,
    category,
    description: `${expenseDescriptions[index % expenseDescriptions.length]} · ${scheduleDays[index % 3].day}`,
    estimatedCost,
    actualCost,
    discrepancy,
    status,
    estimated_cost: estimatedCost,
    actual_cost: actualCost,
    extra_units: 1,
    unit_rate: actualCost.toFixed(2),
    total_amount: actualCost.toFixed(2),
    billed_to_client: index % 4 !== 0,
    logged_at: timeForVendor(index),
  }
})
