import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CongregationService} from "../../services/congregation.service";
import {Congregation, Preacher, RegistryEntry, Territory} from "../../domains/Congregation";
import {FormControl} from "@angular/forms";
import {ToastrService} from "ngx-toastr";
import {SharedService} from "../../services/shared.service";
import {Search, SearchResult} from "../../domains/Search";
import {line} from "ngx-bootstrap-icons";


declare var $:any;

@Component({
  selector: 'app-territories',
  templateUrl: './territories.component.html',
  styleUrls: ['./territories.component.scss'],
})
export class TerritoriesComponent implements OnInit {

  private territoryDetailsModal: ElementRef | undefined;

  @ViewChild('territoryDetailsModal') set content(content: ElementRef) {
    if(content) { // initially setter gets called with undefined
      this.territoryDetailsModal = content;
    }
  }

  loading:boolean=false;
  congregation: Congregation = new Congregation();
  territory: Territory | null = null;
  territoriesSorted: Territory[] = [];
  preacherList: Preacher[] = [];
  selectedPreacher: any = null;
  keyword: string = "name";
  visitedDuringLastYear:number = 0
  notVisitedForOneYear:number = 0

  noContacts = new FormControl(false);
  intoArchive = new FormControl(false);
  note = new FormControl('');
  preDateAssigned = new FormControl(null);
  preDateReturned = new FormControl(null);

  constructor(
    private congregationService: CongregationService,
    private toastr: ToastrService,
    private sharedService:SharedService
  ) {
  }

  ngOnInit(): void {
    this.reloadCongregation();
    this.sharedService.getSearchSubject().subscribe(value => this.search(value))
    this.sharedService.getSearchResultIdentifiedSubject().subscribe(value => this.searchResultIdentified(value))
  }

  searchResultIdentified(searchResult:SearchResult) {
    this.showTerritoryDetails(searchResult.data);
    $('#territoryDetailsModal').modal('show');
  }

  search(text:string) {
    console.log(`SEARCH FUNCTION IN TERRITORIES ... ${text}`)
    if (text.length < 4) return
    let territory = this.territoriesSorted.find(territory => territory.number == text)
    if (territory) {
      let search = new Search();
      let searchResult = new SearchResult();
      searchResult.searchType = "TERRITORY"
      searchResult.readableText = `${territory.number} ${territory.name}`
      searchResult.data = territory
      search.searchResults.push(searchResult)
      this.sharedService.searchPerformed.next(search)
    }
  }

  private reloadCongregation() {
    this.congregationService.getCongregation().subscribe((c: Congregation) => {
      this.congregation = c;
      this.preacherList = c.preacherList;

      this.territoriesSorted = [];
      this.territoriesSorted = this.territoriesSorted.concat(c.territoriesAssigned);
      this.territoriesSorted = this.territoriesSorted.concat(c.territoriesNoContacts);
      this.territoriesSorted = this.territoriesSorted.concat(c.territoriesToBeAssigned);
      this.territoriesSorted = this.territoriesSorted.concat(c.territoriesOlder8Months);
      this.territoriesSorted = this.territoriesSorted.concat(c.territoriesOlder4Months);

      this.territoriesSorted = this.territoriesSorted.sort((a, b) => (a.number > b.number ? 1 : -1));

      setTimeout(()=>{
        this.visitedDuringLastYear = 0
        this.notVisitedForOneYear = 0

        let oneYearDate:Date = new Date()
        oneYearDate.setFullYear(oneYearDate.getFullYear() - 1);

        this.territoriesSorted.forEach(t => {
          let registryExist:boolean = false
          t.registryEntryList.forEach( r => {
            if (r.returnDate) {
              if (this.parseDateString(r.returnDate) > oneYearDate) {
                registryExist = true
              }
            }
          })

          if (registryExist) this.visitedDuringLastYear = this.visitedDuringLastYear + 1
        })

        this.notVisitedForOneYear = this.congregation.territoriesAssigned.length
        + this.congregation.territoriesNoContacts.length
        + this.congregation.territoriesOlder4Months.length
        + this.congregation.territoriesOlder8Months.length
        + this.congregation.territoriesToBeAssigned.length
        - this.visitedDuringLastYear;

      },1)
    });
  }

  parseDateString(dateString: any): Date {
    if (dateString instanceof Date) {
      return dateString;
    }
    return new Date(dateString);
  }


  showTerritoryDetails(territory: Territory) {
    console.log(territory)
    this.territory = territory;
    this.intoArchive.setValue(territory.archive);
    this.noContacts.setValue(territory.noContacts);
  }

  addNote() {
    if (this.territory == null || this.note.value == null) return;

    this.territory.notes.push(this.note.value);
    this.note.setValue('');
  }

  removeNote(note: string) {
    if (this.territory == null) return;

    let newNotes: string[] = [];

    this.territory.notes.forEach(n => {
      if (n != note) newNotes.push(n);
    });

    this.territory.notes = newNotes;
  }

  selectEvent(selectedPreacher: Preacher) {

    if (this.territory == null) {
      console.error('territory object is null');
      return;
    }

    if (this.territory.registryEntryList.length > 0) {
      let lastEntry = this.territory.registryEntryList[this.territory.registryEntryList.length - 1];
      lastEntry.returnDate = new Date();
    }

    let copyOfPreacher = new Preacher();
    copyOfPreacher.name = selectedPreacher.name;

    let registryEntry: RegistryEntry = new RegistryEntry();
    registryEntry.territoryName = this.territory.name;
    registryEntry.territoryNumber = this.territory.number;
    registryEntry.preacher = copyOfPreacher;
    registryEntry.returnDate = null;

    if (this.preDateAssigned.value) {

      registryEntry.assignDate = this.preDateAssigned.value

      if (this.preDateReturned.value) {
        registryEntry.returnDate = this.preDateReturned.value
      }
    }

    this.preDateAssigned.setValue(null)
    this.preDateReturned.setValue(null)

    this.territory.registryEntryList.push(registryEntry);
    this.territory.newPreacherAssigned = true;
    this.congregation.protocol.push(new Date().toLocaleString() + " - Territory " + this.territory.number + " - " + this.territory.name + " assigned to " + copyOfPreacher.name);
    if (this.congregation.protocol.length > 50) {
      this.congregation.protocol.shift();
    }
    console.log("New preacher assigned to territory " + this.territory.number + " " + copyOfPreacher.name)
  }

  onChangeSearch($event: any) {
  }

  onFocused($event: any) {
  }

  saveTerritory() {

    this.loading = true;

    if (this.territory != null && this.intoArchive.value != null) {
      this.territory.archive = this.intoArchive.value;
    }

    if (this.territory != null && this.noContacts.value != null) {
      this.territory.noContacts = this.noContacts.value;
    }

    this.congregationService.saveCongregation(this.congregation).subscribe((c: Congregation) => {
      this.congregation = c;
      this.preacherList = c.preacherList;
      this.loading = false;
      if (this.territory == null) return;

      if (this.territory.newPreacherAssigned) {
        this.toastr.success('Territory ' + this.territory.number + " " + this.territory.name
          + " exported successfully for "
          + this.territory.registryEntryList[this.territory.registryEntryList.length -1].preacher.name, "Export Service");
      }

      this.territory = null;
    })
  }

  deleteTerritory(number: string) {
    this.congregationService.deleteTerritory(number).subscribe((c: Congregation) => {
      this.congregation = c;
      this.preacherList = c.preacherList;
      this.territory = null;
    });
  }

  repairTerritory(territory: Territory) {
    this.congregationService.exportTerritoryData(territory.number,true).subscribe( () => {
      this.toastr.info('Territory repaired','Export Service')
    });
  }

  printPDF() {
    this.congregationService.printCongregation().subscribe( () => {
      this.toastr.success("S-16 was created inside root folder!","PDF PRINT SERVICE")
    });
  }

  registerTerritory(territory: Territory) {
    this.congregationService.registerTerritory(territory.number).subscribe( () => {
      this.toastr.info('Territory registered!','Territory Service')
    });
  }

  getTerritoryButtonColor(number: string) {
    //  #002347, #003366, #003f7d, #ff8e00, #fd7702 and #ff5003.
    if (number.startsWith("1")) return "background-color: #002347; color: white;";
    if (number.startsWith("2")) return "background-color: #003366; color: white;";
    if (number.startsWith("3")) return "background-color: #003f7d; color: white;";
    if (number.startsWith("4")) return "background-color: #ff8e00; color: white;";
    if (number.startsWith("5")) return "background-color: #fd7702; color: white;";
    if (number.startsWith("6")) return "background-color: #ff5003; color: white;";
    if (number.startsWith("7")) return "background-color: #ff0000; color: white;";
    if (number.startsWith("8")) return "background-color: #ff4800; color: white;";
    if (number.startsWith("9")) return "background-color: #ffae00; color: white;";
    return "";
  }

  repairFtpUploads() {
    this.congregationService.reexportTerritoryData().subscribe(value => {
      this.toastr.success("All failed territories exported!")
      this.reloadCongregation();
    })
  }

  removeRegistryEntry(registryEntry: RegistryEntry) {

    if (this.territory == null || this.territory?.registryEntryList == null) return;

    let newRegistries: RegistryEntry[] = [];

    this.territory.registryEntryList.forEach(n => {
      if (n != registryEntry) newRegistries.push(n);
    });

    this.territory.registryEntryList = newRegistries;
  }

  copyOlderThan12MonthsMessage() {

    let message = "--------------------\n";
    let maxEntries = 20
    let date12 = new Date()
    date12.setDate(date12.getDate() - 365);
    let maxLength = 0

    this.congregation.territoriesOlder8Months.forEach( (t,i) => {
      let line = `${t.number} ${t.name}`
      if (maxLength < line.length) maxLength = line.length
    })

    console.log(maxLength)

    this.congregation.territoriesOlder8Months.forEach( (t,i) => {
      if (i > maxEntries) return
      let dateCurrent = new Date(t.date) // fix api problem
      if (dateCurrent.getTime() < date12.getTime()) {
        let entry = `${t.number} ${t.name}`
        if (maxLength - entry.length > 0) {
          entry += ' '.repeat(maxLength - entry.length)
        }
        entry += `| ${t.registryEntryList[t.registryEntryList.length - 1].preacher.name}\n`
        message += entry
      }
    })

    message += "--------------------\n";

    this.copyMessage(message)
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

    let that = this;

    if (!navigator.clipboard) {
      document.execCommand('copy');
    } else {
      navigator.clipboard.writeText(val).then(
        function () {
          that.toastr.success(`Message copied to clipboard!`) // success
        })
        .catch(
          function () {
            that.toastr.error("Copy to clipboard failed!") // error
          });
    }

    document.body.removeChild(selBox);
  }
}
