import { describe, it, expect, afterEach, vi } from "vitest";
import {
    addDays, browserTimeZone, dateBadge, dayOfMonth, describeDeadline, describeSheetTimes,
    formatShortDate, formatTime, minutesToTime, monthLong, monthShort, parseLocalDate,
    sortSheets, timeToMinutes, timeZoneName, toIsoDate, weekdayLong, weekdayShort,
} from "../availabilityFormat.js";

describe("availabilityFormat", () => {
    afterEach(() => vi.restoreAllMocks());

    it("parses ISO dates as local dates (no UTC shift)", () => {
        const d = parseLocalDate("2026-10-12");
        expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 12]);
        expect(toIsoDate(d)).toBe("2026-10-12");
        expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    });

    it("addDays crosses month boundaries without mutating", () => {
        const d = parseLocalDate("2026-10-30");
        expect(toIsoDate(addDays(d, 3))).toBe("2026-11-02");
        expect(toIsoDate(addDays(d, -30))).toBe("2026-09-30");
        expect(toIsoDate(d)).toBe("2026-10-30");
    });

    it("converts times both ways", () => {
        expect(timeToMinutes("11:30")).toBe(690);
        expect(timeToMinutes("11:30:00")).toBe(690);
        expect(minutesToTime(690)).toBe("11:30");
        expect(minutesToTime(5)).toBe("00:05");
    });

    it("formatTime handles noon, midnight, minutes and numeric input", () => {
        expect(formatTime("13:00")).toBe("1 PM");
        expect(formatTime("13:30")).toBe("1:30 PM");
        expect(formatTime("00:00")).toBe("12 AM");
        expect(formatTime("12:00")).toBe("12 PM");
        expect(formatTime("09:05:00")).toBe("9:05 AM");
        expect(formatTime(870)).toBe("2:30 PM");
    });

    it("name helpers", () => {
        // 2026-10-12 is a Monday
        expect(weekdayShort("2026-10-12")).toBe("Mon");
        expect(weekdayLong("2026-10-12")).toBe("Monday");
        expect(monthShort("2026-10-12")).toBe("Oct");
        expect(dayOfMonth("2026-10-12")).toBe(12);
        expect(monthLong(0)).toBe("January");
        expect(formatShortDate("2026-10-12")).toBe("Oct 12");
    });

    describe("describeSheetTimes", () => {
        const base = { dayStartTime: "11:00:00", dayEndTime: "17:30:00" };
        it("single day", () => {
            expect(describeSheetTimes({ ...base, sheetType: "MEETING", dateStart: "2026-10-12", dateEnd: "2026-10-12" }))
                .toBe("Monday, October 12 from 11 AM - 5:30 PM");
        });
        it("date range", () => {
            expect(describeSheetTimes({ ...base, sheetType: "MEETING", dateStart: "2026-10-12", dateEnd: "2026-10-14" }))
                .toBe("Oct 12 - Oct 14, 11 AM - 5:30 PM");
        });
        it("general week", () => {
            expect(describeSheetTimes({ ...base, sheetType: "GENERAL", dateStart: "2026-10-11", dateEnd: "2026-10-17" }))
                .toBe("A typical week, 11 AM - 5:30 PM");
        });
    });

    describe("dateBadge", () => {
        it("general sheets", () => {
            expect(dateBadge({ sheetType: "GENERAL", dateStart: "2026-10-11", dateEnd: "2026-10-17" }))
                .toEqual({ month: "Weekly", days: "Sun-Sat" });
        });
        it("up to three days in one month lists them", () => {
            expect(dateBadge({ sheetType: "MEETING", dateStart: "2026-09-16", dateEnd: "2026-09-18" }))
                .toEqual({ month: "Sep", days: "16, 17, 18" });
            expect(dateBadge({ sheetType: "MEETING", dateStart: "2026-09-16", dateEnd: "2026-09-16" }))
                .toEqual({ month: "Sep", days: "16" });
        });
        it("longer runs in one month use a range", () => {
            expect(dateBadge({ sheetType: "MEETING", dateStart: "2026-09-16", dateEnd: "2026-09-22" }))
                .toEqual({ month: "Sep", days: "16-22" });
        });
        it("spanning two months", () => {
            expect(dateBadge({ sheetType: "MEETING", dateStart: "2026-09-30", dateEnd: "2026-10-02" }))
                .toEqual({ month: "Sep-Oct", days: "30-2" });
        });
    });

    describe("describeDeadline", () => {
        it("returns null without a deadline", () => {
            expect(describeDeadline(null)).toBeNull();
            expect(describeDeadline(undefined)).toBeNull();
        });
        it("formats in the viewer's local time", () => {
            expect(describeDeadline(new Date(2030, 0, 10, 17, 0).toISOString())).toBe("Jan 10, 5 PM");
            expect(describeDeadline(new Date(2030, 0, 10, 9, 45).toISOString())).toBe("Jan 10, 9:45 AM");
        });
    });

    it("browserTimeZone returns a zone string, or null if Intl throws", () => {
        expect(typeof browserTimeZone()).toBe("string");
        vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => {
            throw new Error("no intl");
        });
        expect(browserTimeZone()).toBeNull();
    });

    describe("timeZoneName", () => {
        it("gives a friendly name for a real zone", () => {
            expect(timeZoneName("America/Los_Angeles")).toMatch(/Pacific/);
        });
        it("falls back to the raw value for an invalid zone", () => {
            expect(timeZoneName("Not/AZone")).toBe("Not/AZone");
        });
        it("falls back when no timeZoneName part is produced", () => {
            vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => ({ formatToParts: () => [] }));
            expect(timeZoneName("America/Los_Angeles")).toBe("America/Los_Angeles");
        });
    });

    describe("sortSheets", () => {
        const sheet = (id, over) => ({ sheetId: id, open: true, dateStart: "2030-01-01", closesAt: null, ...over });
        it("puts open sheets first by nearest deadline, then closed most-recent first", () => {
            const sorted = sortSheets([
                sheet(1, { open: false, closesAt: "2029-01-01T00:00:00Z" }),
                sheet(2, { closesAt: "2030-05-01T00:00:00Z" }),
                sheet(3, { open: false, closesAt: "2029-06-01T00:00:00Z" }),
                sheet(4, { closesAt: "2030-02-01T00:00:00Z" }),
                sheet(5, { dateStart: "2030-01-15" }),
            ]);
            expect(sorted.map((s) => s.sheetId)).toEqual([5, 4, 2, 3, 1]);
        });
        it("does not mutate its input", () => {
            const input = [sheet(1, { open: false }), sheet(2)];
            sortSheets(input);
            expect(input[0].sheetId).toBe(1);
        });
    });
});
