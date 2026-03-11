بسم الله الرحمن الرحيم

## Islamic Prayer Times (Azan)

Azan is an Islamic prayer times extension for GNOME Shell.

![Azan extension screenshot](/.img/azan.png)

## Features

- Display the 5 daily prayer times
- Optionally display Sunrise and Midnight times
- Show remaining time until the next prayer
- Click to reveal remaining time
- Display the current date in Hijri calendar
- Send notifications when it is prayer time
- Automatic location detection
- Display times in 24-hour or 12-hour format
- Adjust Hijri date
- Full Arabic support

## Installation

1. Clone this repository.
2. Run `make && make install` in the project root.
3. Log out and log back in.
4. Open Extension Manager and enable `Islamic Prayer Times`.

## Settings Access

Settings can be reached only from the Extension Manager app.

## Changelog


- `12.1`: Added click-to-reveal remaining time and added colored indicators to show remaining time.
- `12`: Added Arabic support, improved UI design, and more.
- `11`: Added MUI calculation method and disclaimer.
- `10`: Bug fixes.
- `07`: Added support for GNOME 3.36+.
- `06`: Bumped version for GNOME 42.
- `05`: Added support for GNOME 40+.
- `04`: Added support for Hijri date adjustment.
- `03`: Added 12-hour time format and optional hiding of non-prayer times.
- `02`: Added automatic location detection and bug fixes.
- `01`: Initial upload.

## My Contribution Highlights (Version 12)

- Full Arabic interface support.
- Fixed Hijri date setting issue.
- Fixed stretched UI elements in settings.
- Replaced scroll boxes in settings with text inputs to prevent accidental value changes.
- Consolidated all settings into a single tab for easier accessibility.
- Improved pop-up UI by removing the large settings button (only needed during initial setup).
- Improved pop-up UI with white font color for better contrast.
- Improved pop-up UI by highlighting the current prayer, its color change depending on remaining time.
- Improved pop-up UI by adding icons for each prayer time.
- Added click-to-reveal remaining time.

## Areas for Improvement

- Unequal left and right margins in the pop-up menu.
- Empty scrollable area at the end of settings.
- Settings width is larger than necessary.
- Add moon phase icons next to the date.

## License

Licensed under the GNU General Public License, version 3.

## Third-Party Assets and Components

- [PrayTimes.js](http://praytimes.org/manual/)
- [HijriCalendar-Kuwaiti.js](http://www.al-habib.info/islamic-calendar/hijricalendar-kuwaiti.js)
