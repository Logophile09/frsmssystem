/**
 * Decision-tree-based emergency dispatch recommendation engine.
 *
 * Like the false-alarm scoring model (see falseAlarmScoring.ts), this is
 * intentionally NOT a black-box ML model. It's an explicit, auditable
 * decision tree: a fixed sequence of yes/no and multiple-choice questions
 * about the incident, where each branch is documented in code and every
 * traversal is returned as a step-by-step trace so a dispatcher can see
 * exactly why the system recommended what it did — and override it.
 *
 * Tree shape (top-level branches by incident type, then refined by
 * severity / occupant / hazard flags):
 *
 *   Incident Type?
 *   ├─ Structure Fire        → Severity? → Occupants trapped? → units + priority
 *   ├─ Grass / Brush Fire    → Severity? → units + priority
 *   ├─ Vehicular Accident    → Severity? → Entrapment? → units + priority
 *   ├─ Medical Emergency     → Severity? → units + priority
 *   ├─ Hazmat / Chemical     → Severity? → units + priority
 *   └─ Other / Unclassified  → Severity? → default engine response
 *
 * After the tree resolves a base unit list, a final availability-check
 * node cross-references it against the live vehicle roster so the
 * recommendation reflects what's actually in the yard right now.
 */

export type Severity = 'low' | 'moderate' | 'high' | 'critical';

export const INCIDENT_TYPES = [
  'Structure Fire',
  'Grass Fire',
  'Vehicular Accident',
  'Medical Emergency',
  'Hazmat Incident',
  'Other',
] as const;

export interface DispatchInput {
  incidentType: string;
  severity: Severity;
  occupantsTrapped?: boolean;
  hazardousMaterials?: boolean;
  multipleCasualties?: boolean;
  reportedAt?: string | Date;
}

export interface VehicleAvailability {
  vehicle_type: string;
  status: string;
}

export interface PersonnelAvailability {
  status: string;
}

export interface RecommendedUnit {
  vehicleType: string;
  quantity: number;
  availableNow: number;
  shortfall: number;
}

export interface TreeStep {
  depth: number;
  question: string;
  answer: string;
  reasoning: string;
}

export type DispatchPriority = 'immediate' | 'high' | 'moderate' | 'low';

export interface DispatchRecommendation {
  priority: DispatchPriority;
  units: RecommendedUnit[];
  minPersonnel: number;
  trace: TreeStep[];
  summary: string;
  mutualAidAdvised: boolean;
}

const PRIORITY_LABEL: Record<DispatchPriority, string> = {
  immediate: 'Immediate — full response',
  high: 'High priority',
  moderate: 'Moderate priority',
  low: 'Low priority',
};

interface BaseUnit {
  vehicleType: string;
  quantity: number;
}

function step(trace: TreeStep[], depth: number, question: string, answer: string, reasoning: string) {
  trace.push({ depth, question, answer, reasoning });
}

export function recommendDispatch(
  input: DispatchInput,
  vehicles: VehicleAvailability[] = [],
  personnel: PersonnelAvailability[] = []
): DispatchRecommendation {
  const trace: TreeStep[] = [];
  const reportedAt = input.reportedAt ? new Date(input.reportedAt) : new Date();
  const hour = reportedAt.getHours();
  const isNight = hour >= 22 || hour < 5;

  let baseUnits: BaseUnit[] = [];
  let priority: DispatchPriority = 'moderate';

  step(trace, 0, 'What is the incident type?', input.incidentType, `Routes into the ${input.incidentType} branch of the tree.`);

  switch (input.incidentType) {
    case 'Structure Fire': {
      const critical = input.severity === 'critical' || input.severity === 'high';
      step(
        trace,
        1,
        'Is severity high or critical?',
        critical ? 'Yes' : 'No',
        critical
          ? 'High-heat / rapid-spread scenario — escalate to a multi-engine assignment.'
          : 'Contained or early-stage fire — a single-engine response is likely sufficient.'
      );

      if (critical) {
        step(
          trace,
          2,
          'Are occupants reported trapped?',
          input.occupantsTrapped ? 'Yes' : 'No',
          input.occupantsTrapped
            ? 'Trapped occupants require ladder access and a dedicated rescue unit alongside suppression.'
            : 'No trapped occupants reported — full suppression assignment without rescue extraction.'
        );
        if (input.occupantsTrapped) {
          baseUnits = [
            { vehicleType: 'Fire Engine', quantity: 2 },
            { vehicleType: 'Ladder Truck', quantity: 1 },
            { vehicleType: 'Rescue Vehicle', quantity: 1 },
            { vehicleType: 'Ambulance', quantity: 2 },
          ];
          priority = 'immediate';
        } else {
          baseUnits = [
            { vehicleType: 'Fire Engine', quantity: 2 },
            { vehicleType: 'Ambulance', quantity: 1 },
          ];
          priority = 'immediate';
        }
      } else {
        baseUnits = [
          { vehicleType: 'Fire Engine', quantity: 1 },
          { vehicleType: 'Ambulance', quantity: 1 },
        ];
        priority = input.severity === 'moderate' ? 'high' : 'moderate';
        step(trace, 2, 'Standby medical unit required?', 'Yes', 'One ambulance staged on-site as standard precaution for any structure fire.');
      }
      break;
    }

    case 'Grass Fire': {
      const critical = input.severity === 'high' || input.severity === 'critical';
      step(
        trace,
        1,
        'Is severity high or critical (fast spread risk)?',
        critical ? 'Yes' : 'No',
        critical
          ? 'Fast-spreading brush fire — dispatch a second engine to establish a wider containment line.'
          : 'Small or slow-moving grass fire — one engine crew is typically enough.'
      );
      baseUnits = critical
        ? [{ vehicleType: 'Fire Engine', quantity: 2 }]
        : [{ vehicleType: 'Fire Engine', quantity: 1 }];
      priority = critical ? 'high' : 'low';
      break;
    }

    case 'Vehicular Accident': {
      const critical = input.severity === 'high' || input.severity === 'critical';
      step(
        trace,
        1,
        'Is severity high or critical?',
        critical ? 'Yes' : 'No',
        critical ? 'Likely serious injuries — send rescue extraction alongside EMS.' : 'Minor collision — EMS response is typically sufficient.'
      );
      if (critical) {
        step(
          trace,
          2,
          'Is a passenger trapped / extraction needed?',
          input.occupantsTrapped ? 'Yes' : 'No',
          input.occupantsTrapped
            ? 'Extraction tools (Jaws of Life) required — dispatch a Rescue Vehicle.'
            : 'No extraction needed — ambulance-led response is enough.'
        );
        baseUnits = input.occupantsTrapped
          ? [{ vehicleType: 'Rescue Vehicle', quantity: 1 }, { vehicleType: 'Ambulance', quantity: 1 }]
          : [{ vehicleType: 'Ambulance', quantity: 1 }];
        priority = 'high';
      } else {
        baseUnits = [{ vehicleType: 'Ambulance', quantity: 1 }];
        priority = 'moderate';
      }
      break;
    }

    case 'Medical Emergency': {
      const critical = input.severity === 'high' || input.severity === 'critical';
      step(
        trace,
        1,
        'Is severity high or critical?',
        critical ? 'Yes' : 'No',
        critical
          ? 'Life-threatening presentation — send a first-responder engine alongside the ambulance.'
          : 'Stable presentation — a single ambulance crew can handle this.'
      );
      baseUnits = critical
        ? [{ vehicleType: 'Ambulance', quantity: 1 }, { vehicleType: 'Fire Engine', quantity: 1 }]
        : [{ vehicleType: 'Ambulance', quantity: 1 }];
      priority = critical ? 'immediate' : 'moderate';

      if (input.multipleCasualties) {
        step(trace, 2, 'Multiple casualties reported?', 'Yes', 'Second ambulance added to handle multiple patients.');
        baseUnits.push({ vehicleType: 'Ambulance', quantity: 1 });
        priority = 'immediate';
      }
      break;
    }

    case 'Hazmat Incident': {
      step(
        trace,
        1,
        'Are hazardous materials confirmed on scene?',
        input.hazardousMaterials ? 'Yes' : 'Unconfirmed',
        input.hazardousMaterials
          ? 'Confirmed hazmat — dispatch the Hazmat Unit plus containment support.'
          : 'Unconfirmed — still treat as hazmat-capable response until cleared on arrival.'
      );
      baseUnits = [{ vehicleType: 'Hazmat Unit', quantity: 1 }, { vehicleType: 'Fire Engine', quantity: 1 }];
      priority = input.severity === 'critical' || input.severity === 'high' ? 'immediate' : 'high';
      break;
    }

    default: {
      step(trace, 1, 'Incident type not in a specialized branch.', 'Default response', 'Falling back to a standard single-engine assessment response.');
      baseUnits = [{ vehicleType: 'Fire Engine', quantity: 1 }];
      priority = input.severity === 'critical' || input.severity === 'high' ? 'high' : 'low';
    }
  }

  if (isNight && priority !== 'immediate') {
    step(trace, 3, 'Is it night time (10pm–5am)?', 'Yes', 'Night-time response — visibility and access are harder, priority raised one level.');
    priority = priority === 'low' ? 'moderate' : priority === 'moderate' ? 'high' : priority;
  }

  // Final node: cross-check against what's actually available right now.
  const units: RecommendedUnit[] = baseUnits.map((u) => {
    const availableNow = vehicles.filter(
      (v) => v.vehicle_type.toLowerCase() === u.vehicleType.toLowerCase() && v.status === 'available'
    ).length;
    return {
      vehicleType: u.vehicleType,
      quantity: u.quantity,
      availableNow,
      shortfall: Math.max(0, u.quantity - availableNow),
    };
  });

  const mutualAidAdvised = units.some((u) => u.shortfall > 0);
  step(
    trace,
    9,
    'Are enough of each recommended unit available right now?',
    mutualAidAdvised ? 'No — shortfall detected' : 'Yes',
    mutualAidAdvised
      ? 'One or more recommended unit types are short-staffed in the yard — consider requesting mutual aid or reassigning a returning unit.'
      : 'Current fleet status covers the full recommendation.'
  );

  const onDutyPersonnel = personnel.filter((p) => p.status === 'on_duty').length;
  const minPersonnel = baseUnits.reduce((sum, u) => sum + u.quantity * (u.vehicleType === 'Ambulance' ? 2 : 4), 0);
  if (onDutyPersonnel < minPersonnel) {
    step(
      trace,
      10,
      'Is enough personnel on duty to crew these units?',
      'No',
      `Recommendation needs ~${minPersonnel} personnel; only ${onDutyPersonnel} are currently on duty. Consider calling in off-duty staff.`
    );
  }

  const summary = `${PRIORITY_LABEL[priority]} — ${units.map((u) => `${u.quantity}× ${u.vehicleType}`).join(', ')}, ~${minPersonnel} personnel.`;

  return { priority, units, minPersonnel, trace, summary, mutualAidAdvised };
}
