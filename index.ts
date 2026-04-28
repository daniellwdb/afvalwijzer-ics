import { JSDOM } from "jsdom";
import { createEventsAsync, type DateTime, type EventAttributes } from "ics";
import http from "http";

const SERVER_PORT = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 3000;
const SERVER_HOST = process.env.SERVER_HOST ?? "localhost";

const WASTE_TYPES = ["gft", "pmd", "restafval"];

const DUTCH_MONTHS = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

async function getIcsEvents(postcalCode: string, houseNumber: string) {
  const url = `https://www.mijnafvalwijzer.nl/nl/${postcalCode}/${houseNumber}`;

  const response = await fetch(url);
  const html = await response.text();
  const document = new JSDOM(html).window.document;

  const events = [...document.querySelectorAll("a.wasteInfoIcon.textDecorationNone")].reduce(
    (previousEvents, element) => {
      const wasteTypeHref = element.getAttribute("href")?.replace("#waste-", "");
      const wasteInfo = element.querySelector("p");

      if (!wasteInfo) {
        return previousEvents;
      }

      const wasteTypeClassName = wasteInfo?.classList[0];
      const wasteType = wasteTypeHref ?? wasteTypeClassName;

      if (!wasteType || !WASTE_TYPES.includes(wasteType)) {
        return previousEvents;
      }

      const dateText = wasteInfo.textContent.trim().split("\n")[0]!;
      const wasteInfoDescription = wasteInfo.querySelector(".afvaldescr")!.textContent;

      const [_weekDayString, dayOfMonthString, monthString] = dateText.split(" ");

      const today = new Date();
      const year = today.getFullYear();
      const month = DUTCH_MONTHS.indexOf(monthString!) + 1;
      const day = Number(dayOfMonthString);

      const collectionDate = new Date(year, month - 1, day);

      // Night before (20:00)
      const startDate = new Date(collectionDate);
      startDate.setHours(-4);

      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth() + 1;
      const startDay = startDate.getDate();

      const uid = `${year}-${month}-${day}-${wasteType}`;

      const uidExists = previousEvents.some((event) => event.uid === uid);

      if (uidExists) {
        return previousEvents;
      }

      // Start the evening before collection day at 20:00
      const eventStart: DateTime = [startYear, startMonth, startDay, 20, 0];

      const event: EventAttributes = {
        start: eventStart,
        // End at 20:00 on the collection day
        duration: { hours: 24 },
        title: wasteInfoDescription,
        description: `Op ${collectionDate.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })} wordt de ${wasteType} afval opgehaald.`,
        uid: uid,
        alarms: [
          {
            action: "display",
            description: `Zet uw ${wasteInfoDescription} bak bij de aanbiedplek.`,
            trigger: eventStart,
          },
          {
            action: "display",
            description: `Staat uw ${wasteInfoDescription} bak bij de aanbiedplek? Het kan nog tot 07.00 uur.`,
            // The morning of collection day (06:00)
            trigger: { hours: 11, minutes: 0, before: false },
          },
          // {
          //   action: "display",
          //   description: `Staat uw ${wasteInfoDescription} bak weer binnen? Het kan nog tot 20:00 uur.`,
          //   // The evening of collection day (17:00)
          //   trigger: { hours: 19, minutes: 0, before: false },
          // },
        ],
      };

      return [...previousEvents, event];
    },
    [] as EventAttributes[],
  );

  return events;
}

const server = http.createServer();

server.on("request", async (req, res) => {
  const [postalCode, houseNumber] = (req.url ?? "").split("/").filter(Boolean);

  if (!postalCode || !houseNumber) {
    return res.writeHead(500).end("Postcode of huisnummer ontbreekt.");
  }

  const events = await getIcsEvents(postalCode, houseNumber);
  const { error, value } = await createEventsAsync(events);

  if (error) {
    console.error(error);

    return res.writeHead(500).end(error.message);
  }

  return res
    .writeHead(200, {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="calendar.ics"',
      "Cache-Control": "no-cache",
    })
    .end(value);
});

server.listen(SERVER_PORT, SERVER_HOST);

console.info(`Server is listening on http://${SERVER_HOST}:${SERVER_PORT}.`);
