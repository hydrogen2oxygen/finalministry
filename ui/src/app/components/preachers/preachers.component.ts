import {Component, Inject, LOCALE_ID, OnInit} from '@angular/core';
import {Congregation, Preacher, Territory} from "../../domains/Congregation";
import {CongregationService} from "../../services/congregation.service";
import {ToastrService} from "ngx-toastr";
import {FormControl} from "@angular/forms";
import {DatePipe, formatDate} from "@angular/common";
import {Settings} from "../../domains/Settings";
import {SettingsService} from "../../services/settings.service";
import {DomSanitizer} from "@angular/platform-browser";
import * as moment from 'moment';

@Component({
  selector: 'app-preachers',
  templateUrl: './preachers.component.html',
  styleUrls: ['./preachers.component.scss']
})
export class PreachersComponent implements OnInit {

  loading:boolean=false;
  congregation: Congregation = new Congregation();
  preacher: Preacher | null = null;
  settings: Settings | null = null;
  newPreacherName = new FormControl('');
  notes = new FormControl('');
  datepipe: DatePipe = new DatePipe('en-US');
  monthsBefore4: Date = new Date();
  monthsBefore8: Date = new Date();
  territories: Territory[] = [];
  territoryUrl: any | null = null;
  selectedTerritoryNumber: string | null = null;

  constructor(
    private congregationService: CongregationService,
    private settingsService: SettingsService,
    private toastr: ToastrService,
    private sanitizer : DomSanitizer,
    @Inject(LOCALE_ID) private locale: string) {
  }

  ngOnInit(): void {
    this.reloadCongregation();
    this.settingsService.getSettings().subscribe((s: Settings | null) => this.settings = s);
    this.monthsBefore4.setMonth(this.monthsBefore4.getMonth() - 4);
    this.monthsBefore8.setMonth(this.monthsBefore8.getMonth() - 8);
  }

  private reloadCongregation() {
    this.congregationService.getCongregation().subscribe((c: Congregation) => {
      this.congregation = c;
      if (this.congregation.notes) {
        this.notes.setValue(this.congregation.notes);
      }
      this.loading = false;
    });
  }

  saveNewPreacher() {
    let preacherName = this.newPreacherName.value?.trim();
    this.newPreacherName.setValue('');

    if (preacherName == null || preacherName.length == 0) return;

    if (this.congregation.preacherList.find(p => p.name.toLowerCase() === preacherName?.toLowerCase())) {
      this.toastr.warning(preacherName + " already exists!", "Data Service");
      return;
    }

    this.loading = true
    let newPreacher: Preacher = new Preacher();
    newPreacher.name = preacherName;
    this.congregation.preacherList.push(newPreacher);

    this.congregationService.saveCongregation(this.congregation).subscribe((c: Congregation) => {
      this.toastr.success(preacherName + " saved as a new preacher", "Data Service")
      this.reloadCongregation();
    });
  }

  saveNotes() {
    this.congregation.notes = this.notes.value;
    this.congregationService.saveCongregation(this.congregation).subscribe((c: Congregation) => {
      this.toastr.success("Notes saved!", "Data Service")
    });
  }

  openTerritoryByNumber(territory:Territory) {
    if (this.settings != null) {
      this.selectedTerritoryNumber = territory.number;
      // @ts-ignore
      let host = this.settings.settings['ftp.httpHost'];
      this.territoryUrl = this.sanitizer.bypassSecurityTrustResourceUrl( host + "?id=" + territory.uuid);
    }
  }

  getWhatsAppMessage(preacher: Preacher) {

    // @ts-ignore
    let whatsAppMessage = this.settings?.settings['text.whatsApp'];
    // @ts-ignore
    let whatsAppMessageNote = this.settings?.settings['text.whatsApp.note'];
    // @ts-ignore
    let whatsAppMessageDashboard = this.settings?.settings['text.whatsApp.dashboard'];

    let message = '=============================\n'
      + preacher.name
      + ' ( ' + this.datepipe.transform(new Date(), 'dd.MM.yyyy')
      + ' ),\n' + whatsAppMessage + '\n';

    if (this.settings != null && preacher.uuid) {
      message += '\n>>> *' + whatsAppMessageDashboard + '* <<<\n';
      // @ts-ignore
      let host = this.settings.settings['ftp.httpHost'];
      if (!host.endsWith("/")) {
        host += "/";
      }
      message += host + '?id=dashboard-' + preacher.uuid + '\n';
    }

    preacher.territoryListNumbers.forEach(territoryNumber => {

      let territory: Territory | undefined = this.getTerritoryByNumber(territoryNumber);

      if (territory != undefined && territory.uuid != undefined) {
        let assignDate: Date | undefined = this.getAssignDateFromTerritory(territory);
        let formattedDate = this.datepipe.transform(assignDate, 'dd.MM.yyyy')

        message += '\n' + territory.number + ' - ' + territory.name + ' (' + formattedDate + ')\n';

        if (this.settings != null) {
          // @ts-ignore
          let host = this.settings.settings['ftp.httpHost'];
          message += host + '?id=' + territory.uuid + '\n';
        }

        if (territory.notes.length > 0) {
          message += whatsAppMessageNote + '\n'
        }

        territory.notes.forEach(note => {
          message += note + '\n';
        });

      }

    });

    message += '\n=============================';

    this.copyMessage(message);
  }

  copyMessage(val: string) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();

    let text_to_copy = document.getElementById("textarea")?.innerHTML;
    let that = this;

    if (!navigator.clipboard) {
      document.execCommand('copy');
    } else {
      navigator.clipboard.writeText(val).then(
        function () {
          that.toastr.success(`Territory infos from ${that.preacher?.name} copied to clipboard!`) // success
        })
        .catch(
          function () {
            that.toastr.error("Copy to clipboard failed!") // error
          });
    }

    document.body.removeChild(selBox);
  }

  getAssignDateFromTerritory(territory: Territory): Date | undefined {

    if (territory.registryEntryList.length == 0) return undefined;

    return territory.registryEntryList[territory.registryEntryList.length - 1].assignDate;
  }

  deletePreacher(preacher: Preacher) {

    if (preacher.name === "Congregation") return;

    if (!preacher.harddelete) {
      preacher.softdelete = !preacher.softdelete;
    }

    preacher.showPreacherActions = false;

    let i = 0;

    this.congregation.preacherList.forEach(p => {
      if (p.name == preacher.name) {
        this.congregation.preacherList[i] = preacher;
        console.log('update done');
      }
      i++;
    });

    console.log(this.congregation.preacherList);
    this.congregationService.saveCongregation(this.congregation).subscribe((c: Congregation) => this.congregation = c)
  }

  harddeletePreacher(preacher: Preacher) {
    preacher.harddelete = true;
    this.deletePreacher(preacher);
    this.preacher = null;
  }

  openPreacher(preacher: Preacher) {
    this.territoryUrl = null;
    this.selectedTerritoryNumber = null;
    this.preacher = preacher;
    this.territories = [];
    preacher.territoryListNumbers.forEach(n => {
      let territory = this.getTerritoryByNumber(n);
      if (territory) {
        this.territories.push(territory);
      }
    })
  }

  getTerritoryNameAndDetails(territory: Territory): string {
    let formattedDate = (moment(territory.date)).format('DD.MM.YYYY')
    return `${territory.name} (${formattedDate})`;
  }

  getTerritoryByNumber(territoryNumber: string): Territory | undefined {
    let territoryList: Territory[] = [];
    territoryList = territoryList.concat(this.congregation.territoriesAssigned);
    territoryList = territoryList.concat(this.congregation.territoriesOlder4Months);
    territoryList = territoryList.concat(this.congregation.territoriesOlder8Months);
    territoryList = territoryList.concat(this.congregation.territoriesNoContacts);
    territoryList = territoryList.concat(this.congregation.territoriesToBeAssigned);
    return territoryList.find(t => t.number === territoryNumber);
  }

  cssAccordingToTerritory(territory: Territory): string {
    let css = "";

    if (territory) {
      let lastRegistry = territory.registryEntryList[territory.registryEntryList.length - 1];
      if (lastRegistry.assignDate > this.monthsBefore8) {
        css = "btn-danger";
        // TODO finish this
      }
    }

    return css;
  }

  urlFromTerritory(territoryNumber: string) {
    let territory = this.getTerritoryByNumber(territoryNumber);
    return territory?.url;
  }

  returnTerritoryByNumber(territory:Territory) {
    this.loading = true;
    this.congregationService.returnTerritory(territory).subscribe( (c: Congregation) => {
      if (c == null) {
        console.error("Returned congregation is null!");
        this.loading = false;
        return;
      }

      this.toastr.success('Territory ' + territory.number + " " + territory.name
        + " exported successfully for "
        + territory.registryEntryList[territory.registryEntryList.length -1].preacher.name, "Export Service");

      this.reloadCongregation();
      this.preacher = null;
      this.territories = [];
    })
  }

}
