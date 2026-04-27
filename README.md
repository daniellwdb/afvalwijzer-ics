# afvalwijzer-ics

Serves Afvalwijzer collection days in iCalendar format.

---

Data is collected from https://www.mijnafvalwijzer.nl/. For every collection day:

- One alert is set at the evening before at 20:00.
- One alert is set on the morning of the day at 06:00.

Events run from the evening before the day at 20:00 to 20:00 on the same day as these are generally the times that it is allowed to have trash outside.

At the moment, only 3 types of garbage are supported ("gft", "pmd", "restafval"). It is easy to add other types, but I only have a use case for these.

## Usage

A webserver runs which exposes 1 endpoint that accepts a postal code and house number in the following format: `http(s)://example.com/<postal code>/<house number>`. This endpoint serves an ics file which can be downloaded or you can set up a calendar client to subscribe to the endpoint.

## Scripts

**Run locally**

With [npm](https://npmjs.org/) and [pnpm](https://pnpm.io/) installed, run:

```
$ pnpm install
```

Then run:

```
$ node index.ts
```

## Acknowledgments

`afvalwijzer-ics` was inspired by [mijnafvalwijzer-to-ical](https://github.com/vwout/mijnafvalwijzer-to-ical). I just wanted my own set of defaults and a webserver that I can link to from calendar clients.

## License

This project is licensed under the MIT license - see the [LICENSE](LICENSE) file for details.
