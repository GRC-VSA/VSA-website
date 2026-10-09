// Shared test data for the availability UI tests.

export const SLOTS = [
    ["2030-01-07T17:00:00Z", "2030-01-07T17:30:00Z", "2030-01-07T18:00:00Z"],
    ["2030-01-08T17:00:00Z", "2030-01-08T17:30:00Z", "2030-01-08T18:00:00Z"],
];

export const grid = () => ({
    dates: ["2030-01-07", "2030-01-08"],
    times: ["09:00:00", "09:30:00", "10:00:00"],
    slotStarts: SLOTS.map((d) => [...d]),
});

export const hiddenHeatmap = { visible: false, responderCount: 1, minResponders: 3, maxCount: 0, counts: null };

export const visibleHeatmap = {
    visible: true,
    responderCount: 4,
    minResponders: 3,
    maxCount: 3,
    counts: [
        [3, 1, 0],
        [0, 0, 2],
    ],
};

export const sheetInfo = (over = {}) => ({
    sheetId: 5,
    title: "Board meeting",
    description: "Pick a time",
    location: "SH 152",
    sheetType: "MEETING",
    eventId: null,
    dateStart: "2030-01-07",
    dateEnd: "2030-01-08",
    dayStartTime: "09:00:00",
    dayEndTime: "10:30:00",
    slotMinutes: 30,
    timezone: "Etc/GMT+12",
    status: "OPEN",
    closesAt: null,
    open: true,
    createdByName: "Carol Chan",
    ...over,
});

export const responders = (over = {}) => ({
    expectedOfficers: 2,
    respondedOfficers: 1,
    guests: 1,
    people: [
        { participantId: 1, name: "Amy Lee", roleLabel: "Officer", guest: false, responded: true, note: "late" },
        { participantId: null, name: "Ben Ho", roleLabel: "President", guest: false, responded: false, note: null },
        { participantId: 3, name: "Gus", roleLabel: "ISA", guest: true, responded: true, note: null },
    ],
    ...over,
});

export const detail = (over = {}) => ({
    sheet: sheetInfo(),
    grid: grid(),
    heatmap: hiddenHeatmap,
    responders: responders(),
    myEntry: null,
    canManage: false,
    ...over,
});

export const guestView = (over = {}) => ({
    sheet: sheetInfo(),
    grid: grid(),
    heatmap: hiddenHeatmap,
    inviteLabel: "ISA",
    myEntry: null,
    ...over,
});
