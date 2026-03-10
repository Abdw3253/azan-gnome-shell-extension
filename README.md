بسم الله الرحمن الرحيم
### Description
Azan is an Islamic prayer times extension for Gnome Shell.

![alt text](/.img/azan.png) 

### Features

- Display 5 prayer times
- Optionally display Sunrise and Midnight times
- Show remaining time until the next prayer
- Display the current date in Hijri calendar
- Send notifications when it's prayer time
- Automatic location detection
- Display times in 24-hour or 12-hour format
- Adjust the Hijri date
- Full Arabic Support
### Installation

1. clone this repository
2. run `make && make install` inside main folder
3. log out
4. open Extension Manger -> enable "Islamic Prayer Times"
5. Enjoy!

### Changelog

- 01 : initial upload
- 02 : Add automatic location detection & bugfixes
- 03 : 12 hour times and optional hiding of non-prayer times
- 04 : Add support for Hijri date adjustment
- 05 : Add support for Gnome 40+
- 06 : Bump version Gnome 42
- 07 : Added support for Gnome 3.36+
- 10 : Bugfixes
- 11 : MUI calculation method and addition of disclaimer
- 12 : Add Arabic Support, improved UI design and more
### My Contribution in Version 12
- Full support for Arabic interface
- Fixed: Hijri date setting was not working
- Fixed: Stretched UI elements in settings
- Replaced Scrollboxes in settings with text inputs to prevent accidental value changes
- Consolidated all settings into a single tab for easier accessibility
- Improved pop-up UI:
    - Removed the large settings button (only needed during initial setup)
    - Changed font color to white for better contrast
    - Highlighted the current prayer
    - Added icons for each prayer time

### Areas of Improvement
- Unequal margins (right and left) in the pop-up menu
- Empty scrollable area at the end of settings
- Settings width is larger than necessary
- Add moon phase icons next to the date

### License

Licensed under the GNU General Public License, version 3

### Third-Party Assets & Components

- [PrayTimes.js](http://praytimes.org/manual/)
- [HijriCalendar-Kuwaiti.js](http://www.al-habib.info/islamic-calendar/hijricalendar-kuwaiti.js)
