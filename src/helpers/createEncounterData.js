//  Consider Stringfying the return
const createEncounterData = (uuidObs, personUuid, dates) => {
  return {
    resourceType: 'Encounter',
    id: uuidObs,
    meta: {
      tag: [
        {
          system: 'http://fhir.openmrs.org/ext/encounter-tag',
          code: 'encounter',
          display: 'Encounter',
        },
      ],
    },
    status: 'unknown',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
    },
    type: [
      {
        coding: [
          {
            system: 'http://fhir.openmrs.org/code-system/encounter-type',
            code: 'ca3aed11-1aa4-42a1-b85c-8332fc8001fc',
            display: 'Check In',
          },
        ],
      },
    ],
    subject: {
      reference: `Patient/${personUuid}`,
      type: 'Patient',
    },
    period: {
      start: dates.yesterday,
      end: dates.tomorrow,
    },
    location: [
      {
        location: {
          reference: 'Location/44c3efb0-2583-4c80-a79e-1f756a03c0a1',
        },
      },
    ],
  };
};

export default createEncounterData;
