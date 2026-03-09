const Geoclue = imports.gi.Geoclue;
const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Mainloop = imports.mainloop;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const MessageTray = imports.ui.messageTray;
const Util = imports.misc.util;
const PermissionStore = imports.misc.permissionStore;
const ExtensionUtils = imports.misc.extensionUtils;

const Extension = imports.misc.extensionUtils.getCurrentExtension();

const PrayTimes = Extension.imports.PrayTimes;
const HijriCalendarKuwaiti = Extension.imports.HijriCalendarKuwaiti;
const Convenience = Extension.imports.convenience;
const PrefsKeys = Extension.imports.prefs_keys;

const Azan = GObject.registerClass(
class Azan extends PanelMenu.Button {

  _init() {
    super._init(0.5, _('Azan'));

    this.indicatorText = new St.Label({text: _("Loading..."), y_align: Clutter.ActorAlign.CENTER});
    this.add_child(this.indicatorText);

    this._gclueLocationChangedId = 0;
    this._weatherAuthorized = false;

    this._opt_calculationMethod = null;
    this._opt_madhab = null;
    this._opt_latitude = null;
    this._opt_longitude = null;
    this._opt_timezone = null;
    this._opt_timeformat12 = false;
    this._opt_concise_list = null;
    this._opt_hijriDateAdjustment = null;
    this._opt_language = 'english';

    this._settings = Convenience.getSettings();
    this._bindSettings();
    this._loadSettings();

    this._dateFormatFull = _("%A %B %e, %Y");

    this._prayTimes = new PrayTimes.PrayTimes('MWL');

    // Arabic day names
    this._dayNames = new Array("الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت");
    this._dayNamesEnglish = new Array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");
    
    // Arabic month names  
    this._monthNames = new Array("محرم", "صفر", "ربيع الأول", "ربيع الآخر",
                                 "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
                                 "رمضان", "شوال", "ذو القعدة", "ذو الحجة");
    this._monthNamesEnglish = new Array("Muharram", "Safar", "Rabi'ul Awwal", "Rabi'ul Akhir",
                                 "Jumadal Ula", "Jumadal Akhira", "Rajab", "Sha'ban",
                                 "Ramadhan", "Shawwal", "Dhul Qa'ada", "Dhul Hijja");

    this._timeNames = {
        fajr: 'Fajr',
        sunrise: 'Sunrise',
        dhuhr: 'Dhuhr',
        asr: 'Asr',
        sunset: 'Sunset',
        maghrib: 'Maghrib',
        isha: 'Isha',
        midnight: 'Midnight'
    };

    this._timeNamesArabic = {
        fajr: 'الفجر',
        sunrise: 'الشروق',
        dhuhr: 'الظهر',
        asr: 'العصر',
        sunset: 'الغروب',
        maghrib: 'المغرب',
        isha: 'العشاء',
        midnight: 'منتصف الليل'
    };

    this._timeConciseLevels = {
      fajr: 1,
      sunrise: 0,
      dhuhr: 1,
      asr: 1,
      sunset: -1,
      maghrib: 1,
      isha: 1,
      midnight: 0
    };

    this._prayItems = {};

    this._dateMenuItem = new PopupMenu.PopupMenuItem(_("TODO"), {
        style_class: 'azan-panel', reactive: false, hover: false, activate: false
    });

    this.menu.addMenuItem(this._dateMenuItem);

    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    for (let prayerId in this._timeNames) {

        let prayerName = this._timeNames[prayerId];

        let prayMenuItem = new PopupMenu.PopupMenuItem(_(prayerName), {
            reactive: false, hover: false, activate: false, style_class: 'azan-prayer-item'
        });

        prayMenuItem.label.add_style_class_name('azan-prayer-name');
        prayMenuItem.label.set_x_expand(true);

        // Add icon for each prayer time
        let icon = null;
        if (prayerId === 'fajr') {
            icon = new St.Icon({
                gicon: Gio.icon_new_for_string(Extension.path + '/media/sparkle-symbolic.svg'),
                style_class: 'popup-menu-icon',
                icon_size: 16
            });
        } else if (prayerId === 'sunrise') {
            icon = new St.Icon({
                gicon: Gio.icon_new_for_string(Extension.path + '/media/daytime-sunrise-symbolic.svg'),
                style_class: 'popup-menu-icon',
                icon_size: 16
            });
        } else if (prayerId === 'dhuhr') {
            icon = new St.Icon({
                gicon: Gio.icon_new_for_string(Extension.path + '/media/sun-symbolic.svg'),
                style_class: 'popup-menu-icon',
                icon_size: 16
            });
        } else if (prayerId === 'asr') {
            icon = new St.Icon({
                gicon: Gio.icon_new_for_string(Extension.path + '/media/afternoon-symbolic.svg'),
                style_class: 'popup-menu-icon',
                icon_size: 16
            });
        } else if (prayerId === 'sunset' || prayerId === 'maghrib') {
            icon = new St.Icon({
                gicon: Gio.icon_new_for_string(Extension.path + '/media/daytime-sunset-symbolic.svg'),
                style_class: 'popup-menu-icon',
                icon_size: 16
            });
        } else if (prayerId === 'isha') {
            icon = new St.Icon({
                gicon: Gio.icon_new_for_string(Extension.path + '/media/moon-symbolic.svg'),
                style_class: 'popup-menu-icon',
                icon_size: 16
            });
        } else if (prayerId === 'midnight') {
            icon = new St.Icon({
                gicon: Gio.icon_new_for_string(Extension.path + '/media/moon-stars-symbolic.svg'),
                style_class: 'popup-menu-icon',
                icon_size: 16
            });
        }

        let bin = new St.Bin({x_expand: true,x_align: Clutter.ActorAlign.END});
        bin.add_style_class_name('azan-prayer-time-bin');

        let prayLabel = new St.Label({
            style_class: 'azan-prayer-time'
        });
        bin.add_actor(prayLabel);

        prayMenuItem.actor.add_actor(bin);

        this.menu.addMenuItem(prayMenuItem);

        this._prayItems[prayerId] = { menuItem: prayMenuItem, label: prayLabel, labelWidget: prayMenuItem.label, timeBin: bin, icon: icon };
    };

    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    this._applyLanguageLayout();
    this._updateLabelPeriodic();
    this._updatePrayerVisibility();
    this._updatePrayerMenuLabels();

    this._permStore = new PermissionStore.PermissionStore((proxy, error) => {
        if (error) {
            log('Failed to connect to permissionStore: ' + error.message);
            return;
        }

        this._permStore.LookupRemote('gnome', 'geolocation', (res, error) => {
            if (error)
                log('Error looking up permission: ' + error.message);

            let [perms, data] = error ? [{}, null] : res;
            let  params = ['gnome', 'geolocation', false, data, perms];
            this._onPermStoreChanged(this._permStore, '', params);
        });
    });
  }
    
  _startGClueService() {
    if (this._gclueStarting)
        return;

    this._gclueStarting = true;

    Geoclue.Simple.new('org.gnome.Shell', Geoclue.AccuracyLevel.EXACT, null,
        (o, res) => {
            try {
                this._gclueService = Geoclue.Simple.new_finish(res);
            } catch(e) {
                log('Failed to connect to Geoclue2 service: ' + e.message);
                return;
            }
            this._gclueStarted = true;
            this._gclueService.get_client().distance_threshold = 100;
            this._updateLocationMonitoring();
        });
  }
  
  _onPermStoreChanged(proxy, sender, params) {
    let [table, id, deleted, data, perms] = params;

    if (table != 'gnome' || id != 'geolocation')
        return;

    let permission = perms['org.gnome.Weather.Application'] || ['NONE'];
    let [accuracy] = permission;
    this._weatherAuthorized = accuracy != 'NONE';

    this._updateAutoLocation();
  }
  
  _onGClueLocationChanged() {
      let geoLocation = this._gclueService.location;
      this._opt_latitude = geoLocation.latitude;
      this._opt_longitude = geoLocation.longitude;
      this._settings.set_double(PrefsKeys.LATITUDE, this._opt_latitude);
      this._settings.set_double(PrefsKeys.LONGITUDE, this._opt_longitude);
  }
  
  _updateLocationMonitoring() {
    if (this._opt_autoLocation) {
        if (this._gclueLocationChangedId != 0 || this._gclueService == null)
            return;

        this._gclueLocationChangedId =
            this._gclueService.connect('notify::location',
                                       this._onGClueLocationChanged.bind(this));
        this._onGClueLocationChanged();
    } else {
        if (this._gclueLocationChangedId)
            this._gclueService.disconnect(this._gclueLocationChangedId);
        this._gclueLocationChangedId = 0;
    }
  }
  
  _updateAutoLocation() {
        this._updateLocationMonitoring();

        if (this._opt_autoLocation) {
          this._startGClueService();
        }
  }
  
  _loadSettings() {
    this._opt_calculationMethod = this._settings.get_string(PrefsKeys.CALCULATION_METHOD);
    this._opt_madhab = this._settings.get_string(PrefsKeys.MADHAB);
    this._opt_autoLocation = this._settings.get_boolean(PrefsKeys.AUTO_LOCATION);
    this._updateAutoLocation();
    this._opt_latitude = this._settings.get_double(PrefsKeys.LATITUDE);
    this._opt_longitude = this._settings.get_double(PrefsKeys.LONGITUDE);
    this._opt_timeformat12 = this._settings.get_boolean(PrefsKeys.TIME_FORMAT_12);
    this._opt_timezone = this._settings.get_string(PrefsKeys.TIMEZONE);
    this._opt_concise_list = this._settings.get_string(PrefsKeys.CONCISE_LIST);
    this._opt_hijriDateAdjustment = this._settings.get_double(PrefsKeys.HIJRI_DATE_ADJUSTMENT);
    this._opt_language = this._settings.get_string(PrefsKeys.LANGUAGE);
  }  
  _bindSettings() {
    this._settings.connect('changed::' + PrefsKeys.AUTO_LOCATION, (settings, key) => {
        this._opt_autoLocation = settings.get_boolean(key);
        this._updateAutoLocation();
        this._updateLabel();
    });

    this._settings.connect('changed::' + PrefsKeys.CALCULATION_METHOD, (settings, key) => {
        this._opt_calculationMethod = settings.get_string(key);

        this._updateLabel();
    });

    this._settings.connect('changed::' + PrefsKeys.MADHAB, (settings, key) => {
        this._opt_madhab = settings.get_string(key);

        this._updateLabel();
    });
    
    this._settings.connect('changed::' + PrefsKeys.LATITUDE, (settings, key) => {
        this._opt_latitude = settings.get_double(key);

        this._updateLabel();
    });
    this._settings.connect('changed::' + PrefsKeys.LONGITUDE, (settings, key) => {
        this._opt_longitude = settings.get_double(key);

        this._updateLabel();
    });
    this._settings.connect('changed::' + PrefsKeys.TIME_FORMAT_12, (settings, key) => {
        this._opt_timeformat12 = settings.get_boolean(key);
        this._updateLabel();
    });
    this._settings.connect('changed::' + PrefsKeys.TIMEZONE, (settings, key) => {
        this._opt_timezone = settings.get_string(key);

        this._updateLabel();
    });

    this._settings.connect('changed::' + PrefsKeys.CONCISE_LIST, (settings, key) => {
      this._opt_concise_list = settings.get_string(key);
      this._updateLabel();
      this._updatePrayerVisibility();
    });

    this._settings.connect('changed::' + PrefsKeys.HIJRI_DATE_ADJUSTMENT, (settings, key) => {
        this._opt_hijriDateAdjustment = settings.get_double(key);

        this._updateLabel();
    });

    this._settings.connect('changed::' + PrefsKeys.LANGUAGE, (settings, key) => {
        this._opt_language = settings.get_string(key);
                this._applyLanguageLayout();
        this._updatePrayerMenuLabels();
        this._updateLabel();
    });
  }

    _isArabic() {
        return this._opt_language === 'arabic';
    }

    _applyLanguageLayout() {
        let rtl = this._isArabic();
        let directionStyle = rtl ? 'direction: rtl;' : 'direction: ltr;';

        if (rtl) {
            // Keep Hijri date centered in Arabic mode.
            this._dateMenuItem.actor.set_style(directionStyle + ' text-align: center;');
            this._dateMenuItem.label.set_x_expand(true);
            this._dateMenuItem.label.set_x_align(Clutter.ActorAlign.CENTER);
            this._dateMenuItem.label.set_style('text-align: center;');
        } else {
            this._dateMenuItem.actor.set_style(directionStyle);
            this._dateMenuItem.label.set_x_expand(false);
            this._dateMenuItem.label.set_x_align(Clutter.ActorAlign.START);
            this._dateMenuItem.label.set_style('');
        }

        for (let prayerId in this._prayItems) {
            let prayerItem = this._prayItems[prayerId];
            // Keep row layout logic consistent with LTR and swap actor order for RTL.
            prayerItem.menuItem.actor.set_style('direction: ltr;');

            // Swap columns: In Arabic, time comes first (left), then name (right)
            // In English, name comes first (left), then time (right)
            let container = prayerItem.menuItem.actor;
            
            // Remove all actors
            container.remove_actor(prayerItem.labelWidget);
            container.remove_actor(prayerItem.timeBin);
            if (prayerItem.icon) {
                container.remove_actor(prayerItem.icon);
            }
            
            if (rtl) {
                // Arabic: time then text, with icon to the right of text.
                container.add_actor(prayerItem.timeBin);
                container.add_actor(prayerItem.labelWidget);
                if (prayerItem.icon) {
                    container.add_actor(prayerItem.icon);
                    prayerItem.icon.set_style('margin-left: 6px; margin-right: 0px;');
                }
                prayerItem.timeBin.set_style('margin-right: 20px; margin-left: 0px; padding-left: 0px; min-width: 0px;');
                prayerItem.label.set_style('min-width: 0px; text-align: left;');
            } else {
                // English: icon then text then time.
                if (prayerItem.icon) {
                    container.add_actor(prayerItem.icon);
                    prayerItem.icon.set_style('margin-right: 8px;');
                }
                container.add_actor(prayerItem.labelWidget);
                container.add_actor(prayerItem.timeBin);
                prayerItem.timeBin.set_style('margin-left: 1px; margin-right: 0px; min-width: 84px;');
                prayerItem.label.set_style('min-width: 84px; text-align: right;');
            }

            prayerItem.labelWidget.set_style(rtl ? 'text-align: right;' : 'text-align: left;');
            prayerItem.labelWidget.x_align = rtl ? Clutter.ActorAlign.END : Clutter.ActorAlign.START;
            prayerItem.label.x_align = rtl ? Clutter.ActorAlign.START : Clutter.ActorAlign.END;
            prayerItem.timeBin.x_align = rtl ? Clutter.ActorAlign.START : Clutter.ActorAlign.END;
            prayerItem.timeBin.x_expand = !rtl;
        }
    }

  _updatePrayerVisibility() {
    for (let prayerId in this._timeNames) {
      this._prayItems[prayerId].menuItem.actor.visible = this._isVisiblePrayer(prayerId);
    }
  }

  _updatePrayerMenuLabels() {
    for (let prayerId in this._timeNames) {
      let prayerName = this._getPrayerName(prayerId);
      this._prayItems[prayerId].labelWidget.text = prayerName;
    }
  }

  _isVisiblePrayer(prayerId) {
    return this._timeConciseLevels[prayerId] >= this._opt_concise_list;
  }

  _updateLabelPeriodic() {
      let currentSeconds = new Date().getSeconds();
      if (currentSeconds === 0) {
         this._periodicTimeoutId = Mainloop.timeout_add_seconds(60,
         this._updateLabelPeriodic.bind(this));
      } else {
         this._periodicTimeoutId = Mainloop.timeout_add_seconds(60 - currentSeconds,
         this._updateLabelPeriodic.bind(this));
      }
      
      this._updateLabel();
  }

  _updateLabel() {
      let displayDate = GLib.DateTime.new_now_local();
      let dateFormattedFull = displayDate.format(this._dateFormatFull);

      let myLocation = [this._opt_latitude, this._opt_longitude];
      let myTimezone = this._opt_timezone;
      this._prayTimes.setMethod(this._opt_calculationMethod);
      this._prayTimes.adjust({asr: this._opt_madhab});

      let currentDate = new Date();

      let currentSeconds = this._calculateSecondsFromDate(currentDate);

      let timesStr;

      if (this._opt_timeformat12) {
        timesStr = this._prayTimes.getTimes(currentDate, myLocation, myTimezone, 'auto', '12h');
      } else {
        timesStr = this._prayTimes.getTimes(currentDate, myLocation, myTimezone, 'auto', '24h');
      }

      let timesFloat = this._prayTimes.getTimes(currentDate, myLocation, myTimezone, 'auto', 'Float');

      let nearestPrayerId;
      let minDiffMinutes = Number.MAX_VALUE;
      let isTimeForPraying = false;
      for (let prayerId in this._timeNames) {

          let prayerTime = timesStr[prayerId];

          this._prayItems[prayerId].label.text = this._formatDisplayedTime(prayerTime);

          if (this._isPrayerTime(prayerId)) {

              let prayerSeconds = this._calculateSecondsFromHour(timesFloat[prayerId]);

              let ishaSeconds = this._calculateSecondsFromHour(timesFloat['isha']);
              let fajrSeconds = this._calculateSecondsFromHour(timesFloat['fajr']);

              if (prayerId === 'fajr' && currentSeconds > ishaSeconds) {
                  prayerSeconds = fajrSeconds + (24 * 60 *60);
              }

              let diffSeconds = prayerSeconds - currentSeconds;

              if (diffSeconds <= 0 && diffSeconds > -60) {
                isTimeForPraying = true;
                nearestPrayerId = prayerId;
                break;
              }

              if (diffSeconds > 0) {
                  let diffMinutes = ~~(diffSeconds / 60);

                  if (diffMinutes <= minDiffMinutes) {
                      minDiffMinutes = diffMinutes;
                      nearestPrayerId = prayerId;
                  }
              }

          }
      };

      // Highlight the prayer one before the next prayer
      const prayerOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      let highlightedPrayerId = nearestPrayerId;
      let nextIndex = prayerOrder.indexOf(nearestPrayerId);
      if (nextIndex > 0) {
          highlightedPrayerId = prayerOrder[nextIndex - 1];
      } else if (nextIndex === 0) {
          // If next prayer is Fajr, highlight Isha (wrap around)
          highlightedPrayerId = prayerOrder[prayerOrder.length - 1];
      }

      for (let prayerId in this._prayItems) {
          if (prayerId === highlightedPrayerId) {
              this._prayItems[prayerId].menuItem.actor.style_class = 'azan-next-prayer';
          } else {
              this._prayItems[prayerId].menuItem.actor.style_class = 'azan-prayer-item';
          }
      }


      let hijriDate = HijriCalendarKuwaiti.KuwaitiCalendar(this._opt_hijriDateAdjustment);

      let outputIslamicDate = this._formatHijriDate(hijriDate);
      
      this._dateMenuItem.label.text = outputIslamicDate;
      
      if ( (minDiffMinutes === 15) || (minDiffMinutes === 10) || (minDiffMinutes === 5) ) {
         let reminderMsg = this._isArabic() 
             ? minDiffMinutes + " دقيقة متبقية حتى صلاة " + this._getPrayerName(nearestPrayerId)
             : minDiffMinutes + " minutes remaining until " + this._getPrayerName(nearestPrayerId) + " prayer.";
            Main.notify(reminderMsg, _("Prayer time : " + this._formatDisplayedTime(timesStr[nearestPrayerId])));
      }
          
      if (isTimeForPraying) {
          let notificationMsg = this._isArabic()
              ? "حان وقت صلاة " + this._getPrayerName(nearestPrayerId)
              : "It's time for the " + this._getPrayerName(nearestPrayerId) + " prayer.";
          let indicatorMsg = this._isArabic()
              ? "حان وقت صلاة " + this._getPrayerName(nearestPrayerId)
              : "It's time for " + this._getPrayerName(nearestPrayerId);
          Main.notify(notificationMsg, _("Prayer time : " + this._formatDisplayedTime(timesStr[nearestPrayerId])));
          this.indicatorText.set_text(indicatorMsg);
      } else {
          this.indicatorText.set_text(this._getPrayerName(nearestPrayerId) + ' - ' + this._formatRemainingTimeFromMinutes(minDiffMinutes));
      }
  }

  _calculateSecondsFromDate(date) {
      return this._calculateSecondsFromHour(date.getHours()) + (date.getMinutes() * 60);
  }

  _calculateSecondsFromHour(hour) {
      return (hour * 60 * 60);
  }

  _isPrayerTime(prayerId) {
      return prayerId === 'fajr' || prayerId === 'dhuhr' || prayerId === 'asr' || prayerId === 'maghrib' || prayerId === 'isha';
  }

  _formatRemainingTimeFromMinutes(diffMinutes) {
      let hours = ~~(diffMinutes / 60);
      let minutes = ~~(diffMinutes % 60);

      let hoursStr = (hours < 10 ? "0" : "") + hours;
      let minutesStr = (minutes < 10 ? "0" : "") + minutes;

      return hoursStr + ":" + minutesStr;
	}

    	_formatHijriDate(hijriDate) {
        if (this._isArabic()) {
          return this._dayNames[hijriDate[4]] + "، " + hijriDate[5] + " " + this._monthNames[hijriDate[6]] + " " + hijriDate[7];
        }

        return this._dayNamesEnglish[hijriDate[4]] + ", " + hijriDate[5] + " " + this._monthNamesEnglish[hijriDate[6]] + " " + hijriDate[7] + " AH";
  	}
  
    _getPrayerName(prayerId) {
        // Check if it's Friday and the prayer is Dhuhr
        let today = new Date();
        let isFriday = today.getDay() === 5;
        
        if (isFriday && prayerId === 'dhuhr') {
            if (this._opt_language === 'arabic') {
                return 'الجمعة';
            }
            return 'Jummah';
        }
        
        if (this._opt_language === 'arabic') {
            return this._timeNamesArabic[prayerId];
        }
        return this._timeNames[prayerId];
    }

    _formatDisplayedTime(timeText) {
        if (!this._isArabic())
            return timeText;

        return timeText
            .replace(/\bAM\b/gi, 'ص')
            .replace(/\bPM\b/gi, 'م');
    }
  
    stop() {

    	this.menu.removeAll();

			if (this._periodicTimeoutId) {
        Mainloop.source_remove(this._periodicTimeoutId);
  		}
		}
});

let azan;

function init() {
}

function enable() {
  azan = new Azan();
  Main.panel.addToStatusArea('azan', azan, 1, 'center');
}

function disable() {
	azan.stop();
  azan.destroy();
}
