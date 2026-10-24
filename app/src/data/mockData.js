// ============================================================
// Cold Call Companion — Mock Data Module
// All stage definitions, sample calls, and initial state.
// Replace these with real API calls in Phase 2.
// ============================================================

export const STAGES = [
  {
    id: 1,
    name: 'Opening',
    shortName: '01 Opening',
    fullName: 'Opening & Identity Confirm',
    purpose: 'Confirm you have reached the right person and earn their ear for 5 seconds.',
    directive: 'State your name and company confidently. Keep it short. Ask a single confirming question so the prospect hears their own name and acknowledges you.',
    anticipatedPaths: [
      { label: '"Yes, who is this?"', type: 'Green Light', color: 'tertiary' },
      { label: '"How did you get this number?"', type: 'Friction', color: 'error' },
      { label: '"Yes, speaking."', type: 'Green Light', color: 'tertiary' },
    ],
    actionChips: [
      { id: 'right_person', label: 'Right person reached', icon: 'person_check' },
      { id: 'gatekeeper', label: 'Gatekeeper intercepted', icon: 'shield_person' },
      { id: 'voicemail', label: 'Left voicemail', icon: 'voicemail' },
      { id: 'wrong_number', label: 'Wrong number / not interested', icon: 'cancel' },
    ],
    battlecard: {
      title: 'Opening Micro-Script',
      content: '"Hi [Name], this is Sarah from DeepThought CultureTech—am I speaking with you directly?"',
    },
  },
  {
    id: 2,
    name: 'Purpose',
    shortName: '02 Purpose',
    fullName: 'Purpose & Reason for Call',
    purpose: 'Explain why you are calling in one crisp sentence before they can object.',
    directive: 'Deliver a single, value-loaded reason for calling tied to a known pain in their industry. Do not pitch a product yet — pitch a hypothesis about their problem.',
    anticipatedPaths: [
      { label: '"We are currently evaluating options."', type: 'Interest Signal', color: 'primary' },
      { label: '"I don\'t have time for this."', type: 'Time Objection', color: 'error' },
      { label: '"That\'s actually relevant to us."', type: 'Green Light', color: 'tertiary' },
    ],
    actionChips: [
      { id: 'engaged', label: 'Engaged — wants to hear more', icon: 'thumb_up' },
      { id: 'skeptical', label: 'Skeptical but listening', icon: 'help' },
      { id: 'time_objection', label: 'Time objection raised', icon: 'timer_off' },
      { id: 'sent_to_email', label: 'Directed to send email', icon: 'email' },
    ],
    battlecard: {
      title: 'Purpose Hook',
      content: '"I\'m reaching out because companies your size with Kafka-based pipelines often hit reconciliation latency at scale. I wanted to test whether that\'s on your radar."',
    },
  },
  {
    id: 3,
    name: 'Permission',
    shortName: '03 Permission',
    fullName: 'Permission & Micro-Commitment',
    purpose: 'Check whether the prospect can speak right now and earn unforced attention for the next 90 seconds.',
    directive: 'Understand whether this is a suitable time to continue. If the prospect is busy, do not force the pitch—capture an exact callback time or negotiate 180 seconds right now.',
    anticipatedPaths: [
      { label: '"I\'m in a meeting right now."', type: 'Deflection Pivot', color: 'error' },
      { label: '"Can you call me back this afternoon?"', type: 'Callback Setup', color: 'secondary' },
      { label: '"Yes, I have a couple of minutes."', type: 'Green Light', color: 'tertiary' },
    ],
    actionChips: [
      { id: 'available', label: 'Available to talk', icon: 'check_circle' },
      { id: 'callback_req', label: 'Busy — callback requested', icon: 'schedule' },
      { id: 'no_callback', label: 'Busy — no callback agreed', icon: 'block' },
      { id: 'not_suitable', label: 'Not a suitable time', icon: 'timer_off' },
      { id: 'continued_busy', label: 'Continued despite being busy', icon: 'fast_forward' },
    ],
    battlecard: {
      title: 'Micro Battlecard: Time Scarcity',
      content: '"Understood, [Name]. I know you\'re headed into a meeting. I only have one quick question on how [Company] synchronizes ERP pipelines with remote vendor warehouses—if it\'s irrelevant, you can hang up immediately."',
    },
  },
  {
    id: 4,
    name: 'Their Business',
    shortName: '04 Their Business',
    fullName: 'Their Business — Discovery',
    purpose: 'Understand their current operating environment, team scale, and tech infrastructure.',
    directive: 'Ask open-ended questions to discover their scale, stack, and current operational model. Let them talk — your only job is to listen and probe deeper.',
    anticipatedPaths: [
      { label: '"We run about 50 engineers across 3 teams."', type: 'Scale Signal', color: 'primary' },
      { label: '"We\'re on AWS, mostly microservices."', type: 'Tech Stack', color: 'tertiary' },
      { label: '"Why do you need to know that?"', type: 'Resistance', color: 'error' },
    ],
    actionChips: [
      { id: 'scale_discovered', label: 'Team scale discovered', icon: 'groups' },
      { id: 'stack_learned', label: 'Tech stack identified', icon: 'code' },
      { id: 'budget_signal', label: 'Budget signal heard', icon: 'attach_money' },
      { id: 'refused_info', label: 'Declined to share details', icon: 'lock' },
    ],
    battlecard: {
      title: 'Discovery Opener',
      content: '"Just to make sure I\'m not wasting your time — roughly how many services are you running, and are they event-driven or polling-based?"',
    },
  },
  {
    id: 5,
    name: 'Their Need',
    shortName: '05 Their Need',
    fullName: 'Their Need — In Their Words',
    purpose: 'Surface the prospect\'s pain in their own language before presenting any solution.',
    directive: 'Do not use your own words to describe their problem. Ask a pain-probing question and then stay silent. Record the exact words they use — this becomes your closing ammunition.',
    anticipatedPaths: [
      { label: '"Our biggest headache is reconciliation lags."', type: 'Pain Identified', color: 'error' },
      { label: '"We\'re struggling with deployment frequency."', type: 'Pain Identified', color: 'error' },
      { label: '"Everything is fine right now, actually."', type: 'No Pain Signal', color: 'secondary' },
    ],
    actionChips: [
      { id: 'pain_voiced', label: 'Clear pain articulated', icon: 'crisis_alert' },
      { id: 'latent_pain', label: 'Latent pain hinted at', icon: 'help_outline' },
      { id: 'no_pain', label: 'No pain expressed', icon: 'sentiment_satisfied' },
      { id: 'competing_prio', label: 'Competing priority mentioned', icon: 'low_priority' },
    ],
    battlecard: {
      title: 'Need Elicitation',
      content: '"If you had a magic wand and could fix one thing about how your data moves between systems today, what would it be?"',
    },
  },
  {
    id: 6,
    name: 'Objection',
    shortName: '06 Objection',
    fullName: 'Objection Handling',
    purpose: 'Address resistance without becoming defensive or over-selling.',
    directive: 'Acknowledge, validate, then redirect. Never argue. Use proof points, case studies, or direct questions to dissolve objections. Ask "What would have to be true for this to make sense for you?"',
    anticipatedPaths: [
      { label: '"We already use a competitor."', type: 'Competitor Objection', color: 'error' },
      { label: '"No budget this quarter."', type: 'Budget Objection', color: 'secondary' },
      { label: '"Send me an email."', type: 'Defer Objection', color: 'secondary' },
    ],
    actionChips: [
      { id: 'objection_cleared', label: 'Objection handled & cleared', icon: 'check_circle' },
      { id: 'objection_open', label: 'Objection left open', icon: 'pending' },
      { id: 'competitor_named', label: 'Competitor specifically named', icon: 'business_center' },
      { id: 'budget_raised', label: 'Budget concern raised', icon: 'money_off' },
      { id: 'send_email', label: 'Asked to send email first', icon: 'mail' },
    ],
    battlecard: {
      title: 'Objection Pivot',
      content: '"That\'s fair — I\'m not asking you to switch anything today. I\'m only asking: if there\'s a 20% latency improvement possible with zero migration risk, would that be worth a 20-minute conversation with your team?"',
    },
  },
  {
    id: 7,
    name: 'Next Step',
    shortName: '07 Next Step',
    fullName: 'Next Step — Concrete Commitment',
    purpose: 'Agree on a specific, time-bound next action before ending the call.',
    directive: 'Do not let the call end without a named next step. A meeting, a follow-up call, a document send with a review date — all are valid. Avoid vague "I\'ll think about it" endings.',
    anticipatedPaths: [
      { label: '"Sure, send me an invite for Thursday."', type: 'Confirmed', color: 'tertiary' },
      { label: '"Let me check my calendar and get back to you."', type: 'Soft Commit', color: 'secondary' },
      { label: '"I\'m not ready for a meeting yet."', type: 'Resistance', color: 'error' },
    ],
    actionChips: [
      { id: 'meeting_booked', label: 'Meeting / demo booked', icon: 'event' },
      { id: 'callback_set', label: 'Callback date set', icon: 'phone_callback' },
      { id: 'send_material', label: 'Agreed to review material', icon: 'description' },
      { id: 'soft_commit', label: 'Soft commitment only', icon: 'hourglass_empty' },
      { id: 'no_next_step', label: 'No next step agreed', icon: 'block' },
    ],
    battlecard: {
      title: 'Closing the Loop',
      content: '"Great. Can we lock in 20 minutes on Thursday or Friday? I\'ll send a calendar invite right now — what\'s the best email?"',
    },
  },
  {
    id: 8,
    name: 'Close',
    shortName: '08 Close',
    fullName: 'Close & Call Wrap',
    purpose: 'End the call professionally, confirm the next step aloud, and leave a positive impression.',
    directive: 'Summarise what was agreed. Repeat the next step. Thank them for their time genuinely. Keep this under 30 seconds — they\'re busy.',
    anticipatedPaths: [
      { label: '"Looking forward to it."', type: 'Positive Close', color: 'tertiary' },
      { label: '"We\'ll see, no promises."', type: 'Lukewarm', color: 'secondary' },
      { label: '"Thanks for calling."', type: 'Neutral', color: 'secondary' },
    ],
    actionChips: [
      { id: 'strong_close', label: 'Strong positive close', icon: 'thumb_up' },
      { id: 'neutral_close', label: 'Neutral close', icon: 'thumbs_up_down' },
      { id: 'call_dropped', label: 'Call dropped before close', icon: 'signal_disconnected' },
    ],
    battlecard: {
      title: 'Wrap Script',
      content: '"Perfect — I\'ll have the invite with the Google Meet link in your inbox in the next 5 minutes. Really appreciate your time today, [Name]. Talk Thursday."',
    },
  },
];

export const OUTCOMES = [
  { id: 'next_step_agreed', label: 'Next step agreed', color: 'tertiary' },
  { id: 'callback_scheduled', label: 'Callback Scheduled', color: 'secondary' },
  { id: 'short_pitch_qualified', label: 'Short Pitch Qualified', color: 'primary' },
  { id: 'follow_up_required', label: 'Follow-up required', color: 'secondary' },
  { id: 'gatekeeper_stalled', label: 'Gatekeeper Stalled', color: 'outline' },
  { id: 'not_interested', label: 'Not interested', color: 'outline' },
  { id: 'wrong_person', label: 'Wrong person', color: 'error' },
  { id: 'agreed_to_receive_report', label: 'Agreed to receive report', color: 'primary' },
  { id: 'call_again', label: 'Call again', color: 'secondary' },
  { id: 'interested', label: 'Interested', color: 'primary' },
];

// Helper to generate initial mock calls
function makeStages(count) {
  return STAGES.slice(0, count).map((s, i) => ({
    stageId: s.id,
    selectedChips: [],
    prospectWords: i === 0 ? `"Yes, this is Ananya speaking. Who is this?"` : '',
    timestamp: null,
  }));
}

export const INITIAL_MOCK_CALLS = [
  {
    id: 'call-1001',
    prospectName: 'Ananya Sharma',
    prospectTitle: 'Business Head',
    company: 'Meridian Growth Solutions',
    companyType: 'B2B SaaS · 450 FTE',
    email: 'a.sharma@meridiangrowth.io',
    phone: '+91 98201 44819',
    location: 'Bangalore, KA, India',
    timezone: 'IST (UTC+5:30)',
    date: 'Oct 21, 2024',
    time: '10:42 AM',
    duration: '04:32',
    furthestStage: 7,
    outcome: 'next_step_agreed',
    nextStep: 'Demo scheduled for Thu 3 PM',
    summary: 'Agreed on multi-tenant latency risks. Wants engineering team present on the technical architecture deep dive.',
    callSynthesis: 'Caller reached Ananya Sharma directly on mobile. Prospect initially indicated a tight 3-minute window (Stage 3: Permission). Caller pitched the real-time data orchestration layer for high-throughput ERP pipelines. Ananya acknowledged current latency bottlenecks with their existing middleware. Agreed to evaluate DeepThought platform with the engineering lead. Follow-up meeting confirmed for Thursday 3 PM IST.',
    stageData: [
      { stageId: 1, selectedChips: ['right_person'], prospectWords: '"Yes, this is Ananya speaking. Who is this?"', timestamp: '10:42:14 AM', badge: 'VERIFIED IDENTITY', badgeColor: 'tertiary-fixed' },
      { stageId: 2, selectedChips: ['engaged'], prospectWords: '"We are currently looking at options, but I don\'t have much time."', timestamp: '10:43:02 AM', badge: 'VALUE DELIVERED', badgeColor: 'surface-container-highest' },
      { stageId: 3, selectedChips: ['available'], prospectWords: '"I have about 3 minutes before my executive committee sync. Give me the high-level overview."', timestamp: '10:44:00 AM', badge: 'TIGHT WINDOW (3m)', badgeColor: 'secondary-fixed' },
      { stageId: 4, selectedChips: ['stack_learned', 'scale_discovered'], prospectWords: '"We process around 4.2 million events a day across 12 services."', timestamp: '10:44:38 AM', badge: 'METRICS UNLOCKED', badgeColor: 'surface-container-highest' },
      { stageId: 5, selectedChips: ['pain_voiced'], prospectWords: '"Our biggest headache is end-of-day reconciliation lags."', timestamp: '10:45:12 AM', badge: 'CRITICAL FRICTION', badgeColor: 'error-container' },
      { stageId: 6, selectedChips: ['objection_cleared'], prospectWords: '"Are you SOC2 Type II certified and hosted in AWS Mumbai?"', timestamp: '10:45:49 AM', badge: 'OBJECTION CLEARED', badgeColor: 'tertiary-fixed' },
      { stageId: 7, selectedChips: ['meeting_booked'], prospectWords: '"Send an invite to ananya@meridiangrowth.com for Thursday afternoon."', timestamp: '10:46:28 AM', badge: 'CONVERSION', badgeColor: 'primary-fixed' },
    ],
    techStack: ['Mid-Market ERP', 'Bangalore HQ', 'Series B Funded', 'Evaluating Zapier Replacement'],
    icpScore: 82,
    accountIntelligence: {
      industry: 'Fintech & B2B Commerce',
      headcount: '250 - 500 Employees',
      funding: 'Series B ($28.5M)',
      stack: ['PostgreSQL', 'Apache Kafka', 'AWS (ap-south-1)', 'React', 'Go / Microservices'],
    },
    primaryPain: 'End-of-day reconciliation lags',
    infraFootprint: '12 Services on Kafka',
    complianceGating: 'SOC2 Type II Mandatory',
  },
  {
    id: 'call-1002',
    prospectName: 'Rahul Verma',
    prospectTitle: 'CTO',
    company: 'Apex Infrastructure',
    companyType: 'DevOps Tooling',
    email: 'r.verma@apexinfra.tech',
    phone: '+91 98765 43210',
    location: 'Mumbai, MH, India',
    timezone: 'IST (UTC+5:30)',
    date: 'Today',
    time: '09:15 AM',
    duration: '06:18',
    furthestStage: 5,
    outcome: 'follow_up_required',
    nextStep: 'Call back Friday 2 PM',
    summary: 'Evaluating Q4 budget realignment. Interested in our SOC2 compliance sheet and deployment timeline.',
    callSynthesis: 'Rahul engaged well through the discovery phase. Identified strong interest in zero-downtime deployment capabilities. Budget decision deferred to Q4 planning cycle. Requested compliance documentation and deployment case study.',
    stageData: [
      { stageId: 1, selectedChips: ['right_person'], prospectWords: '"Rahul here. Go ahead."', timestamp: '09:15:22 AM', badge: 'IDENTITY CONFIRMED', badgeColor: 'tertiary-fixed' },
      { stageId: 2, selectedChips: ['skeptical'], prospectWords: '"We\'ve heard similar pitches. What\'s different here?"', timestamp: '09:16:10 AM', badge: 'QUALIFIED PUSH', badgeColor: 'secondary-fixed' },
      { stageId: 3, selectedChips: ['available'], prospectWords: '"I\'ve got maybe 5 minutes."', timestamp: '09:17:00 AM', badge: 'TIME WINDOW', badgeColor: 'secondary-fixed' },
      { stageId: 4, selectedChips: ['scale_discovered', 'stack_learned'], prospectWords: '"We run about 30 microservices on Kubernetes on GCP."', timestamp: '09:18:15 AM', badge: 'STACK MAPPED', badgeColor: 'surface-container-highest' },
      { stageId: 5, selectedChips: ['pain_voiced'], prospectWords: '"Deployment windows are a nightmare — takes us 4 hours every Friday."', timestamp: '09:19:45 AM', badge: 'PAIN VOICED', badgeColor: 'error-container' },
    ],
    techStack: ['Kubernetes', 'GCP', 'DevOps', 'Series A'],
    icpScore: 71,
    accountIntelligence: {
      industry: 'DevOps & Infrastructure',
      headcount: '80 - 150 Employees',
      funding: 'Series A ($12M)',
      stack: ['Kubernetes', 'GCP', 'Terraform', 'Python', 'Go'],
    },
    primaryPain: '4-hour deployment windows every Friday',
    infraFootprint: '30 Microservices on K8s',
    complianceGating: 'SOC2 Type I (in progress)',
  },
  {
    id: 'call-1003',
    prospectName: 'Priya Reddy',
    prospectTitle: 'VP Architecture',
    company: 'CloudScale Distributed',
    companyType: 'FinTech Core',
    email: 'p.reddy@cloudscale.net',
    phone: '+91 99988 77665',
    location: 'Hyderabad, TS, India',
    timezone: 'IST (UTC+5:30)',
    date: 'Yesterday',
    time: '4:10 PM',
    duration: '01:45',
    furthestStage: 2,
    outcome: 'not_interested',
    nextStep: 'N/A (Closed cold)',
    summary: 'Existing 3-year contract with legacy incumbent. No appetite for vendor migration this fiscal cycle.',
    callSynthesis: 'Priya engaged briefly but quickly indicated they are locked into an existing 3-year contract. No budget authority to evaluate alternatives this fiscal year. Closed cold — mark for re-outreach in Q3 next year.',
    stageData: [
      { stageId: 1, selectedChips: ['right_person'], prospectWords: '"Yes, this is Priya."', timestamp: '04:10:05 PM', badge: 'CONFIRMED', badgeColor: 'tertiary-fixed' },
      { stageId: 2, selectedChips: ['skeptical'], prospectWords: '"We\'ve already committed to a 3-year deal with our current vendor. I don\'t see how this is relevant."', timestamp: '04:11:00 PM', badge: 'INCUMBENT LOCKED', badgeColor: 'error-container' },
    ],
    techStack: ['FinTech', 'Hyderabad', 'Series C'],
    icpScore: 45,
    accountIntelligence: {
      industry: 'Financial Technology',
      headcount: '500 - 1000 Employees',
      funding: 'Series C ($55M)',
      stack: ['Java', 'Oracle DB', 'On-premise', 'MQ Series'],
    },
    primaryPain: 'Locked into incumbent contract',
    infraFootprint: 'Legacy on-premise MQ',
    complianceGating: 'RBI regulatory compliance',
  },
  {
    id: 'call-1004',
    prospectName: 'Karan Mehta',
    prospectTitle: 'Head of Platform Engineering',
    company: 'Vortex Data Labs',
    companyType: 'AI / ML Platforms',
    email: 'karan.m@vortexdata.org',
    phone: '+91 98100 55443',
    location: 'Pune, MH, India',
    timezone: 'IST (UTC+5:30)',
    date: 'Yesterday',
    time: '2:30 PM',
    duration: '05:02',
    furthestStage: 6,
    outcome: 'agreed_to_receive_report',
    nextStep: 'Send whitepaper & Q3 benchmark',
    summary: 'Responded strongly to zero-ETL integration narrative. Requested security whitepaper and architectural topology.',
    callSynthesis: 'Karan was highly technical and engaged in depth on the architecture. Raised compliance concerns which were addressed with SOC2 attestation evidence. Agreed to review the zero-ETL whitepaper and benchmark report before scheduling a technical deep-dive.',
    stageData: [
      { stageId: 1, selectedChips: ['right_person'], prospectWords: '"Karan here. What\'s up?"', timestamp: '02:30:10 PM', badge: 'CONFIRMED', badgeColor: 'tertiary-fixed' },
      { stageId: 2, selectedChips: ['engaged'], prospectWords: '"Interesting — we\'ve been thinking about this actually."', timestamp: '02:31:05 PM', badge: 'ENGAGED', badgeColor: 'tertiary-fixed' },
      { stageId: 3, selectedChips: ['available'], prospectWords: '"Go ahead, I have time."', timestamp: '02:32:00 PM', badge: 'OPEN WINDOW', badgeColor: 'tertiary-fixed' },
      { stageId: 4, selectedChips: ['stack_learned'], prospectWords: '"We\'re on Azure, about 60 services, mostly Python and Rust."', timestamp: '02:33:00 PM', badge: 'STACK MAPPED', badgeColor: 'surface-container-highest' },
      { stageId: 5, selectedChips: ['pain_voiced'], prospectWords: '"Feature store latency is killing our model refresh pipeline."', timestamp: '02:34:10 PM', badge: 'PAIN IDENTIFIED', badgeColor: 'error-container' },
      { stageId: 6, selectedChips: ['objection_cleared'], prospectWords: '"Are you GDPR compliant? We have EU data residency requirements."', timestamp: '02:35:02 PM', badge: 'OBJECTION CLEARED', badgeColor: 'tertiary-fixed' },
    ],
    techStack: ['Azure', 'AI/ML', 'Rust', 'Python'],
    icpScore: 78,
    accountIntelligence: {
      industry: 'AI / Machine Learning',
      headcount: '150 - 250 Employees',
      funding: 'Series B ($22M)',
      stack: ['Azure', 'Python', 'Rust', 'Kubernetes', 'MLflow'],
    },
    primaryPain: 'Feature store latency affecting model refresh',
    infraFootprint: '60 Services on Azure',
    complianceGating: 'GDPR + SOC2 Required',
  },
  {
    id: 'call-1005',
    prospectName: 'Neha Iyer',
    prospectTitle: 'Director of Security',
    company: 'HyperEdge Communications',
    companyType: 'Telecom',
    email: 'iyer.n@hyperedge.co',
    phone: '+91 97654 32109',
    location: 'Chennai, TN, India',
    timezone: 'IST (UTC+5:30)',
    date: 'Oct 24',
    time: '11:20 AM',
    duration: '01:12',
    furthestStage: 1,
    outcome: 'wrong_person',
    nextStep: 'Find Head of SecOps',
    summary: 'She is purely on hardware provisioning. Recommended reaching out directly to Vikram in Security Ops.',
    callSynthesis: 'Neha clarified she handles hardware provisioning only and has no authority over software security stack decisions. Referred us to Vikram in Security Operations. Update CRM with correct contact.',
    stageData: [
      { stageId: 1, selectedChips: ['wrong_number'], prospectWords: '"I\'m in hardware provisioning — you\'d want Vikram in SecOps for that."', timestamp: '11:20:08 AM', badge: 'WRONG CONTACT', badgeColor: 'error-container' },
    ],
    techStack: ['Telecom', 'Hardware', 'Chennai'],
    icpScore: 30,
    accountIntelligence: {
      industry: 'Telecommunications',
      headcount: '1000+ Employees',
      funding: 'Public',
      stack: ['Cisco', 'On-premise', 'Legacy Telecom Stack'],
    },
    primaryPain: 'Unknown — wrong contact reached',
    infraFootprint: 'Hardware Provisioning',
    complianceGating: 'TRAI regulatory compliance',
  },
  {
    id: 'call-1006',
    prospectName: 'Devendra Singh',
    prospectTitle: 'Engineering Manager',
    company: 'Synapse Flow Systems',
    companyType: 'Workflow Automation',
    email: 'devendra@synapseflow.io',
    phone: '+91 95553 21098',
    location: 'Delhi, DL, India',
    timezone: 'IST (UTC+5:30)',
    date: 'Oct 23',
    time: '3:45 PM',
    duration: '00:54',
    furthestStage: 3,
    outcome: 'call_again',
    nextStep: 'Call in car / caught between meetings',
    summary: 'Was boarding a flight. Asked for ring back on Monday morning after 9:30 AM EST.',
    callSynthesis: 'Devendra was at the airport and couldn\'t speak. Expressed interest in the value proposition but asked to be called back on Monday after 9:30 AM IST. Note in CRM for Monday morning follow-up.',
    stageData: [
      { stageId: 1, selectedChips: ['right_person'], prospectWords: '"Yes, Devendra here."', timestamp: '03:45:06 PM', badge: 'CONFIRMED', badgeColor: 'tertiary-fixed' },
      { stageId: 2, selectedChips: ['time_objection'], prospectWords: '"Sounds interesting but I\'m literally boarding right now."', timestamp: '03:45:45 PM', badge: 'TIME BLOCKED', badgeColor: 'secondary-fixed' },
      { stageId: 3, selectedChips: ['callback_req'], prospectWords: '"Call me Monday after 9:30, I\'ll have more time then."', timestamp: '03:46:20 PM', badge: 'CALLBACK AGREED', badgeColor: 'secondary-fixed' },
    ],
    techStack: ['Workflow', 'Python', 'Delhi'],
    icpScore: 60,
    accountIntelligence: {
      industry: 'Workflow Automation',
      headcount: '50 - 100 Employees',
      funding: 'Seed ($4M)',
      stack: ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
    },
    primaryPain: 'Unknown — call cut short',
    infraFootprint: 'Small-scale Docker deployment',
    complianceGating: 'None specified',
  },
  {
    id: 'call-1007',
    prospectName: 'Marcus Vance',
    prospectTitle: 'VP of Engineering',
    company: 'QuantaLogic Systems',
    companyType: 'Autonomous Agents',
    email: 'm.vance@quantalogic.ai',
    phone: '+1 415 555 0192',
    location: 'San Francisco, CA, USA',
    timezone: 'PST (UTC-8)',
    date: 'Oct 22',
    time: '1:15 PM',
    duration: '07:44',
    furthestStage: 6,
    outcome: 'interested',
    nextStep: 'Schedule follow-up via calendar link',
    summary: 'Interested in automated pipeline sync for forward deployed developers. Sent calendly directly.',
    callSynthesis: 'Marcus engaged enthusiastically on the FDE pipeline use case. The autonomous agent orchestration angle resonated strongly. Sent Calendly link during call — awaiting booking confirmation.',
    stageData: [
      { stageId: 1, selectedChips: ['right_person'], prospectWords: '"This is Marcus."', timestamp: '01:15:10 PM', badge: 'CONFIRMED', badgeColor: 'tertiary-fixed' },
      { stageId: 2, selectedChips: ['engaged'], prospectWords: '"Actually yes — we\'ve been thinking about agent orchestration pipelines."', timestamp: '01:16:00 PM', badge: 'HIGH INTEREST', badgeColor: 'tertiary-fixed' },
      { stageId: 3, selectedChips: ['available'], prospectWords: '"I\'ve got time. Keep going."', timestamp: '01:17:10 PM', badge: 'OPEN', badgeColor: 'tertiary-fixed' },
      { stageId: 4, selectedChips: ['stack_learned', 'scale_discovered'], prospectWords: '"We have 15 engineers, fully remote, using LangGraph and custom RAG pipelines."', timestamp: '01:18:20 PM', badge: 'STACK MAPPED', badgeColor: 'surface-container-highest' },
      { stageId: 5, selectedChips: ['pain_voiced'], prospectWords: '"Context propagation across agent chains is our biggest unsolved problem."', timestamp: '01:19:30 PM', badge: 'DEEP PAIN', badgeColor: 'error-container' },
      { stageId: 6, selectedChips: ['objection_cleared'], prospectWords: '"What\'s your pricing model — per seat or usage-based?"', timestamp: '01:20:45 PM', badge: 'PRICING EXPLORED', badgeColor: 'tertiary-fixed' },
    ],
    techStack: ['AI Agents', 'LangGraph', 'San Francisco'],
    icpScore: 88,
    accountIntelligence: {
      industry: 'AI / Autonomous Systems',
      headcount: '15 - 30 Employees',
      funding: 'Series A ($8M)',
      stack: ['Python', 'LangGraph', 'OpenAI', 'Pinecone', 'AWS'],
    },
    primaryPain: 'Context propagation across agent chains',
    infraFootprint: 'Serverless + LangGraph',
    complianceGating: 'SOC2 Type II (planned)',
  },
];

// Storage helpers
const STORAGE_KEY = 'ccc_calls_v2';
const DEMO_STORAGE_KEY = 'ccc_demo_active';

// Returns genuinely empty array by default to avoid auto-seeding fake calls
export function loadCalls() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Guarantee that legacy auto-seeded mock calls are never loaded as real calls
        return parsed.filter(c => !c._isDemo && !c.id?.startsWith('demo-') && !c.id?.startsWith('call-100'));
      }
    }
  } catch { /* ignore */ }
  return [];
}

export function saveCalls(calls) {
  try {
    // Only cache genuine, non-demo calls in persistent local cache
    const realCalls = (calls || []).filter(c => !c._isDemo && !c.id?.startsWith('demo-') && !c.id?.startsWith('call-100'));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(realCalls));
  } catch { /* ignore */ }
}

export function isDemoDataActive() {
  try {
    return localStorage.getItem(DEMO_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setDemoDataActive(active) {
  try {
    if (active) {
      localStorage.setItem(DEMO_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    }
  } catch { /* ignore */ }
}

export const SAMPLE_DEMO_CALLS = INITIAL_MOCK_CALLS.map(c => ({
  ...c,
  id: c.id.startsWith('demo-') ? c.id : `demo-${c.id}`,
  _isDemo: true,
  _localOnly: true,
}));

export function getStageById(id) {
  return STAGES.find(s => s.id === id);
}

export function getOutcomeById(id) {
  return OUTCOMES.find(o => o.id === id);
}
