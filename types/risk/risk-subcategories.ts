// types/risk/risk-subcategories.ts

import type { RiskCategory } from './risk';

/** One standard risk sub-category: its name, what it means, and what it mostly hits. */
export interface RiskSubcategory {
  name: string;
  description: string;
  /** Time, Cost, Safety, Quality, Cash Flow, Compliance or Reputation. */
  primaryImpact: string;
}

/**
 * The standard sub-categories under each construction risk category, as the
 * product team supplied them (ClickUp 86d4609hd, 133 in all), in the order of
 * that list. A risk stores its sub-category as text, so these are the
 * dropdown's suggestions and a risk may also carry one typed in by hand.
 */
export const RISK_SUBCATEGORIES: Record<RiskCategory, RiskSubcategory[]> = {
  'design-engineering': [
    {
      name: 'Incomplete or delayed design',
      description:
        'Design deliverables not released in line with the construction programme, holding up procurement and execution.',
      primaryImpact: 'Time',
    },
    {
      name: 'Design errors and omissions',
      description:
        'Errors, missing information, or incorrect assumptions in drawings and calculations discovered during execution.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Design change after execution start',
      description:
        'Client or consultant revisions issued after work has commenced, requiring demolition, rework, or re-ordering.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Inadequate geotechnical data',
      description:
        'Insufficient or unreliable soil investigation leading to redesign of foundations during construction.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Non-compliance with codes and standards',
      description:
        'Design not meeting applicable codes, statutory norms, or client specifications, requiring revision and re-approval.',
      primaryImpact: 'Quality',
    },
    {
      name: 'Inter-discipline clashes',
      description:
        'Conflicts between structural, architectural, and MEP designs identified only at site, causing rework and delay.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Delay in drawing approvals',
      description:
        'Consultant or client review of submitted drawings taking longer than the contractual review period.',
      primaryImpact: 'Time',
    },
    {
      name: 'Constructability issues',
      description:
        'Detailing that is difficult or impractical to build with available methods, skills, or access.',
      primaryImpact: 'Time',
    },
  ],
  'contractual-legal': [
    {
      name: 'Ambiguous scope or contract clauses',
      description:
        'Unclear wording on scope, responsibility, or risk allocation leading to differing interpretations and disputes.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Onerous liquidated damages',
      description:
        'Delay damages set at a level that creates disproportionate exposure against achievable programme.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Unfavourable payment terms',
      description:
        'Long payment cycles, high retention, or restrictive certification conditions straining project cash flow.',
      primaryImpact: 'Cash Flow',
    },
    {
      name: 'Rejection of variations and claims',
      description:
        'Client or consultant refusing to certify additional work, extensions, or cost claims submitted by the contractor.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Disputes, arbitration and litigation',
      description:
        'Escalation of unresolved commercial issues into formal proceedings with associated cost and management time.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Delay in granting extension of time',
      description:
        'Failure to award justified time extensions, exposing the contractor to delay damages for excusable delays.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Encashment of bonds and guarantees',
      description:
        'Client calling performance guarantees or advance payment bonds, causing immediate financial loss.',
      primaryImpact: 'Cash Flow',
    },
    {
      name: 'Inadequate insurance coverage',
      description:
        'Gaps, exclusions, or lapsed policies leaving losses uninsured at the time of an incident.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Terms not passed back-to-back',
      description:
        'Main contract obligations not mirrored in subcontracts, leaving the contractor carrying unmitigated risk.',
      primaryImpact: 'Cost',
    },
  ],
  'financial-commercial': [
    {
      name: 'Project cash flow shortfall',
      description:
        'Outflows exceeding inflows at project level, restricting payments to suppliers, subcontractors, and wages.',
      primaryImpact: 'Cash Flow',
    },
    {
      name: 'Delayed client payments',
      description:
        'Certified amounts not received on time, increasing working capital requirement and financing cost.',
      primaryImpact: 'Cash Flow',
    },
    {
      name: 'Cost overrun against budget',
      description:
        'Actual expenditure exceeding the approved budget due to quantity growth, rates, or inefficiency.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Material price escalation',
      description:
        'Increase in prices of cement, steel, fuel, and other key inputs beyond the rates assumed at tender.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Underestimation at tender stage',
      description:
        'Quantities, rates, or preliminaries priced below actual requirement, eroding margin from the outset.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Currency exchange fluctuation',
      description:
        'Adverse movement in exchange rates affecting imported materials, equipment, or overseas contracts.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Increase in financing cost',
      description:
        'Rise in interest rates or borrowing cost affecting working capital and project profitability.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Delay in retention release',
      description:
        'Retention money withheld beyond the contractual period due to open snags or documentation.',
      primaryImpact: 'Cash Flow',
    },
    {
      name: 'Client insolvency or default',
      description:
        'Client becoming unable to pay, leaving certified and uncertified work unrecovered.',
      primaryImpact: 'Cash Flow',
    },
  ],
  'procurement-supply-chain': [
    {
      name: 'Material shortage in market',
      description:
        'Key materials unavailable in the required quantity or grade within the region during the demand period.',
      primaryImpact: 'Time',
    },
    {
      name: 'Supplier delivery delay',
      description:
        'Ordered materials or equipment not delivered on the promised date, holding up dependent activities.',
      primaryImpact: 'Time',
    },
    {
      name: 'Price increase after order',
      description:
        'Supplier revising rates after order placement due to escalation clauses or market movement.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Supplier quality failure',
      description:
        'Delivered materials failing inspection or testing and requiring rejection, replacement, and resupply.',
      primaryImpact: 'Quality',
    },
    {
      name: 'Long lead item delay',
      description:
        'Extended manufacturing or delivery periods for lifts, switchgear, PEB, and similar items affecting completion.',
      primaryImpact: 'Time',
    },
    {
      name: 'Import and customs clearance delay',
      description:
        'Shipment held at port or delayed by documentation, duty, or regulatory clearance requirements.',
      primaryImpact: 'Time',
    },
    {
      name: 'Single source dependency',
      description:
        'Reliance on one supplier or manufacturer with no approved alternative in case of failure.',
      primaryImpact: 'Time',
    },
    {
      name: 'Specification mismatch on delivery',
      description:
        'Material supplied differing from the approved specification, sample, or drawing requirement.',
      primaryImpact: 'Cost',
    },
  ],
  'construction-execution': [
    {
      name: 'Low productivity',
      description:
        'Actual output falling below planned norms due to method, supervision, weather, or working conditions.',
      primaryImpact: 'Time',
    },
    {
      name: 'Rework due to execution error',
      description:
        'Work executed incorrectly against drawings or levels, requiring demolition and re-execution.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Poor coordination between trades',
      description:
        'Overlapping or out-of-sequence activities causing damage, waiting time, and repeated access to the same area.',
      primaryImpact: 'Time',
    },
    {
      name: 'Inadequate method statement',
      description:
        'Work commenced without a suitable approved method, risking failure, non-conformance, or unsafe execution.',
      primaryImpact: 'Safety',
    },
    {
      name: 'Temporary works failure',
      description:
        'Collapse or deflection of formwork, shoring, staging, or scaffolding during or after concreting.',
      primaryImpact: 'Safety',
    },
    {
      name: 'Restricted site access and congestion',
      description:
        'Limited working space, storage, or access routes reducing the ability to deploy resources effectively.',
      primaryImpact: 'Time',
    },
    {
      name: 'Interface with operating facility',
      description:
        'Working within a live plant or occupied building requiring shutdowns, permits, and restricted work windows.',
      primaryImpact: 'Time',
    },
    {
      name: 'Damage to completed works',
      description:
        'Finished elements damaged by subsequent trades, material movement, or inadequate protection.',
      primaryImpact: 'Cost',
    },
  ],
  'site-ground-conditions': [
    {
      name: 'Unforeseen ground conditions',
      description:
        'Rock, soft strata, or fill encountered differing from the investigation report, changing excavation and foundation scope.',
      primaryImpact: 'Cost',
    },
    {
      name: 'High water table and dewatering',
      description:
        'Groundwater ingress requiring continuous dewatering, additional support, and revised construction methods.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Contaminated soil',
      description:
        'Presence of hazardous or contaminated material requiring specialist handling, testing, and disposal.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Existing underground utilities',
      description:
        'Undocumented cables, pipes, or drains encountered during excavation causing damage, stoppage, and diversion works.',
      primaryImpact: 'Time',
    },
    {
      name: 'Excavation or slope instability',
      description:
        'Collapse of excavation faces, embankments, or retained soil endangering personnel and adjacent works.',
      primaryImpact: 'Safety',
    },
    {
      name: 'Damage to adjacent structures',
      description:
        'Settlement, cracking, or distress in neighbouring buildings caused by excavation, dewatering, or vibration.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Delayed site handover',
      description:
        'Site or work fronts not made available free of encumbrance on the dates assumed in the programme.',
      primaryImpact: 'Time',
    },
    {
      name: 'Right of way and access constraints',
      description:
        'Approach roads, easements, or third-party land not available for movement of materials and equipment.',
      primaryImpact: 'Time',
    },
  ],
  'health-safety-security': [
    {
      name: 'Fall from height',
      description:
        'Injury or fatality from working at height without adequate edge protection, scaffolding, or fall arrest.',
      primaryImpact: 'Safety',
    },
    {
      name: 'Lifting and crane incident',
      description:
        'Load drop, crane overturn, or rigging failure during lifting operations causing injury and asset damage.',
      primaryImpact: 'Safety',
    },
    {
      name: 'Excavation collapse',
      description:
        'Burial or entrapment of workers due to unsupported or improperly sloped excavation faces.',
      primaryImpact: 'Safety',
    },
    {
      name: 'Electrical shock and hot work fire',
      description:
        'Contact with live circuits or ignition during welding and cutting causing injury, fire, or property loss.',
      primaryImpact: 'Safety',
    },
    {
      name: 'Plant and vehicle movement incident',
      description:
        'Collision or crushing involving moving equipment, vehicles, and personnel within the site.',
      primaryImpact: 'Safety',
    },
    {
      name: 'Occupational illness and heat stress',
      description:
        'Health effects from prolonged exposure to heat, dust, noise, chemicals, or poor welfare conditions.',
      primaryImpact: 'Safety',
    },
    {
      name: 'Theft and pilferage',
      description:
        'Loss of materials, tools, cables, and fuel from site stores and work areas.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Trespass, vandalism and unrest',
      description:
        'Unauthorized entry, damage to property, or disturbance affecting site security and continuity of work.',
      primaryImpact: 'Safety',
    },
    {
      name: 'Stop-work following a serious incident',
      description:
        'Suspension of works by the client or authority after a major accident pending investigation and clearance.',
      primaryImpact: 'Time',
    },
  ],
  environmental: [
    {
      name: 'Dust and air emission exceedance',
      description:
        'Airborne dust or emissions from site activities exceeding permitted limits and attracting complaints or penalties.',
      primaryImpact: 'Compliance',
    },
    {
      name: 'Noise and vibration nuisance',
      description:
        'Construction noise or vibration disturbing neighbours and breaching permitted levels or working hours.',
      primaryImpact: 'Compliance',
    },
    {
      name: 'Spillage and soil or water contamination',
      description:
        'Escape of fuel, oil, chemicals, or slurry contaminating soil, drains, or water bodies.',
      primaryImpact: 'Compliance',
    },
    {
      name: 'Improper waste disposal',
      description:
        'Construction and hazardous waste disposed outside approved channels or without required documentation.',
      primaryImpact: 'Compliance',
    },
    {
      name: 'Damage to trees and protected habitat',
      description:
        'Removal of or damage to protected vegetation, water bodies, or habitat without required clearance.',
      primaryImpact: 'Compliance',
    },
    {
      name: 'Breach of environmental clearance conditions',
      description:
        'Failure to implement conditions attached to environmental approvals, risking notices and penalties.',
      primaryImpact: 'Compliance',
    },
    {
      name: 'Site flooding and drainage failure',
      description:
        'Inundation of excavations, basements, and work areas due to inadequate site drainage or heavy rainfall.',
      primaryImpact: 'Time',
    },
  ],
  quality: [
    {
      name: 'Non-conformance in executed work',
      description:
        'Completed work deviating from drawings, tolerances, or specification and raised as a non-conformance report.',
      primaryImpact: 'Quality',
    },
    {
      name: 'Use of substandard materials',
      description:
        'Materials not meeting specification or lacking test certificates being incorporated into the works.',
      primaryImpact: 'Quality',
    },
    {
      name: 'Inadequate testing and records',
      description:
        'Required tests not performed, delayed, or not documented, preventing certification of completed work.',
      primaryImpact: 'Quality',
    },
    {
      name: 'Concrete strength failure',
      description:
        'Cube results falling below the specified grade, requiring investigation, coring, and possible remedial action.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Poor workmanship in finishes',
      description:
        'Substandard finishing quality in plaster, tiling, painting, and joinery leading to client rejection.',
      primaryImpact: 'Cost',
    },
    {
      name: 'High snag volume at handover',
      description:
        'Large number of open defects identified at completion, delaying certification and retention release.',
      primaryImpact: 'Time',
    },
    {
      name: 'Defect liability period claims',
      description:
        "Defects appearing after handover requiring rectification at the contractor's cost during the liability period.",
      primaryImpact: 'Cost',
    },
  ],
  'resource-manpower': [
    {
      name: 'Shortage of skilled manpower',
      description:
        'Insufficient availability of skilled trades and technicians in the region during the required period.',
      primaryImpact: 'Time',
    },
    {
      name: 'Attrition of key staff',
      description:
        'Loss of project managers, engineers, or specialists causing continuity gaps and knowledge loss.',
      primaryImpact: 'Time',
    },
    {
      name: 'Labour unrest or strike',
      description:
        'Stoppage of work due to wage disputes, working conditions, or external union and political action.',
      primaryImpact: 'Time',
    },
    {
      name: 'Inadequate supervision ratio',
      description:
        'Insufficient engineers and supervisors relative to work fronts, leading to quality and safety lapses.',
      primaryImpact: 'Quality',
    },
    {
      name: 'Seasonal manpower unavailability',
      description:
        'Reduced workforce during harvest, festival, or migration periods affecting planned output.',
      primaryImpact: 'Time',
    },
    {
      name: 'Insufficient competency and training',
      description:
        'Personnel deployed without the required skill, licence, or induction for the task assigned.',
      primaryImpact: 'Safety',
    },
  ],
  'plant-equipment': [
    {
      name: 'Equipment breakdown',
      description:
        'Failure of cranes, batching plants, or major equipment interrupting dependent construction activities.',
      primaryImpact: 'Time',
    },
    {
      name: 'Equipment unavailability or hire delay',
      description:
        'Required plant not available on the planned date from the fleet or the hire market.',
      primaryImpact: 'Time',
    },
    {
      name: 'Lapse in equipment certification',
      description:
        'Third-party certificates or operator licences expiring, preventing legal use of lifting and pressure equipment.',
      primaryImpact: 'Compliance',
    },
    {
      name: 'Inadequate maintenance',
      description:
        'Deferred servicing leading to premature failure, higher repair cost, and reduced equipment life.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Fuel supply disruption',
      description:
        'Interruption in diesel or fuel supply halting plant, generators, and site transport.',
      primaryImpact: 'Time',
    },
    {
      name: 'Equipment underutilization',
      description:
        'Idle plant retained on site or on hire beyond the period of productive use, inflating project cost.',
      primaryImpact: 'Cost',
    },
  ],
  'schedule-planning': [
    {
      name: 'Unrealistic baseline programme',
      description:
        'Durations, logic, or resource assumptions in the approved programme not achievable in practice.',
      primaryImpact: 'Time',
    },
    {
      name: 'Critical path delay',
      description:
        'Slippage in activities on the critical path directly extending the completion date.',
      primaryImpact: 'Time',
    },
    {
      name: 'Concurrent delay dispute',
      description:
        'Disagreement over responsibility where contractor and client delays overlap during the same period.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Late mobilization',
      description:
        'Delayed setting up of site, resources, and enabling works pushing the entire programme to the right.',
      primaryImpact: 'Time',
    },
    {
      name: 'Missed milestones or sectional completion',
      description:
        'Failure to achieve contractual interim dates attracting damages or withheld payment.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Inadequate progress monitoring',
      description:
        'Weak measurement and reporting of actual progress hiding slippage until recovery becomes difficult.',
      primaryImpact: 'Time',
    },
    {
      name: 'Acceleration cost',
      description:
        'Additional expenditure on overtime, extra shifts, and resources incurred to recover lost time.',
      primaryImpact: 'Cost',
    },
  ],
  'client-stakeholder': [
    {
      name: 'Delay in client decisions',
      description:
        'Slow approval of samples, mock-ups, selections, and technical queries holding up dependent work.',
      primaryImpact: 'Time',
    },
    {
      name: 'Frequent scope changes by client',
      description:
        'Repeated additions or alterations to scope disrupting planning, procurement, and executed work.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Delay in free-issue materials',
      description:
        'Client-supplied materials or equipment not delivered to site on the agreed dates.',
      primaryImpact: 'Time',
    },
    {
      name: 'Delay in consultant inspection',
      description:
        'Slow response to inspection requests holding up covering-up, concreting, and subsequent activities.',
      primaryImpact: 'Time',
    },
    {
      name: 'Third-party and neighbour objection',
      description:
        'Complaints or legal action by adjoining owners restricting working methods, hours, or access.',
      primaryImpact: 'Time',
    },
    {
      name: 'Interface with other contractors',
      description:
        'Dependence on separately appointed contractors whose delays or damage affect the works.',
      primaryImpact: 'Time',
    },
    {
      name: 'Community opposition',
      description:
        'Local resistance to the project affecting access, manpower deployment, or continuity of work.',
      primaryImpact: 'Time',
    },
  ],
  'statutory-regulatory': [
    {
      name: 'Delay in permits and NOCs',
      description:
        'Building permits, fire NOC, and other statutory approvals not obtained within the assumed period.',
      primaryImpact: 'Time',
    },
    {
      name: 'Change in law or code',
      description:
        'Revision of building codes, standards, or regulations after award requiring design or method changes.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Change in taxes and duties',
      description:
        'Revision of GST, customs duty, or levies affecting input costs and contract price.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Labour law non-compliance',
      description:
        'Failure to meet requirements on registration, wages, welfare, insurance, or working hours of workers.',
      primaryImpact: 'Compliance',
    },
    {
      name: 'Stop-work notice from authority',
      description:
        'Suspension of works ordered by a regulatory body for violation of permit or statutory conditions.',
      primaryImpact: 'Time',
    },
    {
      name: 'Delay in completion or occupancy certificate',
      description:
        'Final statutory certification withheld pending compliance, delaying handover and payment release.',
      primaryImpact: 'Time',
    },
    {
      name: 'Restrictions on working hours or transport',
      description:
        'Local restrictions on night work, heavy vehicle movement, or blasting reducing available working time.',
      primaryImpact: 'Time',
    },
  ],
  'external-force-majeure': [
    {
      name: 'Adverse weather and monsoon',
      description:
        'Rainfall, wind, or extreme temperature preventing work and damaging temporary and permanent works.',
      primaryImpact: 'Time',
    },
    {
      name: 'Natural disaster',
      description:
        'Flood, cyclone, earthquake, or landslide causing loss of life, damage to works, and prolonged stoppage.',
      primaryImpact: 'Time',
    },
    {
      name: 'Epidemic or pandemic restriction',
      description:
        'Public health measures restricting manpower movement, site occupancy, and supply chains.',
      primaryImpact: 'Time',
    },
    {
      name: 'War, riot and civil commotion',
      description:
        'Civil disturbance or conflict preventing safe operation and access to the site.',
      primaryImpact: 'Time',
    },
    {
      name: 'Political and policy change',
      description:
        'Change in government policy, subsidy, or approval regime affecting project viability or scope.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Transport strike or blockade',
      description:
        'Disruption of road, rail, or port movement interrupting delivery of materials and equipment.',
      primaryImpact: 'Time',
    },
  ],
  subcontractor: [
    {
      name: 'Subcontractor default or abandonment',
      description:
        'Specialist agency withdrawing from site leaving incomplete work to be retendered and completed.',
      primaryImpact: 'Time',
    },
    {
      name: 'Subcontractor financial failure',
      description:
        'Insolvency of a subcontractor causing stoppage, unpaid vendors, and additional completion cost.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Poor subcontractor output and quality',
      description:
        'Slow progress or substandard work by the subcontractor requiring supervision, rework, or supplementation.',
      primaryImpact: 'Quality',
    },
    {
      name: 'Subcontractor safety non-compliance',
      description:
        'Failure of subcontractor personnel to follow safety rules, exposing the site to incidents and penalties.',
      primaryImpact: 'Safety',
    },
    {
      name: 'Scope gaps between packages',
      description:
        'Work items falling between subcontract packages and remaining unpriced or unassigned until execution.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Subcontractor claims and disputes',
      description:
        'Claims for extra work, idling, or delay raised by subcontractors against the main contractor.',
      primaryImpact: 'Cost',
    },
  ],
  'technology-data-information': [
    {
      name: 'Drawing version control error',
      description:
        'Work executed from superseded drawings due to weak revision control and distribution.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Loss of project data',
      description:
        'Loss of drawings, records, or measurements through system failure, device loss, or absence of backup.',
      primaryImpact: 'Time',
    },
    {
      name: 'Cyber security breach',
      description:
        'Unauthorized access, ransomware, or fraud affecting company systems, project data, or payments.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Inadequate document control',
      description:
        'Untracked correspondence, approvals, and records weakening the position in claims and audits.',
      primaryImpact: 'Cost',
    },
    {
      name: 'BIM model coordination error',
      description:
        'Errors or outdated information in the federated model leading to incorrect fabrication or installation.',
      primaryImpact: 'Cost',
    },
  ],
  'commissioning-handover': [
    {
      name: 'Testing and commissioning delay',
      description:
        'Systems not tested or commissioned on time due to incomplete works, power, or vendor unavailability.',
      primaryImpact: 'Time',
    },
    {
      name: 'Incomplete as-built documentation',
      description:
        'As-built drawings, test records, and manuals not compiled, delaying certification and final payment.',
      primaryImpact: 'Time',
    },
    {
      name: 'Delay in permanent utility connection',
      description:
        'Power, water, or sewerage connection from the authority not available in time for commissioning.',
      primaryImpact: 'Time',
    },
    {
      name: 'Shortfall in training and O&M handover',
      description:
        'Client personnel not adequately trained or documentation not transferred at the time of handover.',
      primaryImpact: 'Quality',
    },
    {
      name: 'Post-handover rectification cost',
      description:
        'Cost of attending defects, warranties, and callbacks after the works are taken over by the client.',
      primaryImpact: 'Cost',
    },
  ],
  'reputational-business': [
    {
      name: 'Client dissatisfaction',
      description:
        'Poor delivery experience reducing the likelihood of repeat work and positive references.',
      primaryImpact: 'Reputation',
    },
    {
      name: 'Negative publicity from an incident',
      description:
        "Media or public attention following an accident, failure, or dispute damaging the company's standing.",
      primaryImpact: 'Reputation',
    },
    {
      name: 'Blacklisting or loss of prequalification',
      description:
        'Removal from approved contractor lists due to performance failure, litigation, or compliance breach.',
      primaryImpact: 'Reputation',
    },
    {
      name: 'Award of a loss-making project',
      description:
        'Winning work at rates that cannot cover cost, committing resources to a negative-margin contract.',
      primaryImpact: 'Cost',
    },
    {
      name: 'Overcommitment beyond capacity',
      description:
        'Taking on more concurrent work than available management, manpower, and finance can support.',
      primaryImpact: 'Time',
    },
  ],
};
