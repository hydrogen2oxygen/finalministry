import {Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {Link} from "../../domains/Link";
import {ActivatedRoute, Router} from "@angular/router";
import {CongregationService} from "../../services/congregation.service";
import {Version} from "../../domains/Congregation";
import {NavigationService} from "../../services/navigation.service";
import {SettingsService} from "../../services/settings.service";
import {FormControl} from "@angular/forms";
import {Subject} from "rxjs";
import {SharedService} from "../../services/shared.service";
import {Search, SearchResult} from "../../domains/Search";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'TERRITORIES';
  links: Link[] = this.getLinks();
  version: Version|null = null;
  internetOffline:boolean = false;
  showSearch:boolean = false;
  searchField = new FormControl('');
  searchResult:Search|undefined;

  @ViewChild('centeredSearch') centeredSearchElement: ElementRef | undefined;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private congregationService:CongregationService,
    private navigationService:NavigationService,
    private settingsService:SettingsService,
    private sharedService:SharedService
  ) {
    let currentUrl = window.location.href;
    currentUrl = currentUrl.substring(currentUrl.lastIndexOf("/") + 1);
    this.activateCurrentLink(currentUrl);
    this.checkVersion();

    this.navigationService.navigate.subscribe( (url:string) => {
      this.navigate(url);
    });

    this.settingsService.isInternetAvailable().subscribe( result => {
      let strResult:string = result.toString();
      if (strResult == "true") {
        this.internetOffline = false;
      } else {
        this.internetOffline = true;
      }

    })

    this.sharedService.getSearchPerformed().subscribe(value => this.searchResult = value);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
      // Prevent the default behavior (search) of Ctrl+F
      event.preventDefault();
      this.showSearch = true;
      this.searchResult = undefined;

      setTimeout(() => {
        if (this.centeredSearchElement) {
          this.centeredSearchElement.nativeElement.focus();
        }
      }, 200);

      // Do something else or run your custom search logic here
    } else if (this.showSearch && event.key === 'Enter') {
      // TODO select the first occurrence
      //this.searchResult
      // Do something else or run your custom search logic here
    } else if (this.showSearch && event.key === 'Escape') {
      this.showSearch = false;
      // Do something else or run your custom search logic here
    }
  }

  search() {
    if (this.searchField.value == null || this.searchField.value == "") {
      this.showSearch = false;
      return
    }
    this.sharedService.search.next(this.searchField.value)
  }

  checkVersion() {
    this.congregationService.version().subscribe(
        (v: Version | null) => this.version = v,
      () => this.version = null);
    setTimeout(() => {
      this.checkVersion();
    }, 5000);
  }

  navigate(navigationPath: string) {
    this.activateCurrentLink(navigationPath);
    this.router.navigate([navigationPath], {relativeTo: this.route});
  }

  private getLinks():Link[] {
    return [
      new Link("TERRITORIES", true),
      new Link("PREACHERS"),
      new Link("DESIGNER"),
      new Link("UTILS"),
      new Link("SETTINGS"),
      new Link("BACKUPS"),
      new Link("VIDEOS")
    ]
  }

  private activateCurrentLink(navigationPath?: string) {

    if (navigationPath?.length === 0) {
      navigationPath = 'TERRITORIES';
    }

    this.links.forEach(link => {
      link.active = false;

      if (link.title === navigationPath) {
        link.active = true;
      }
    });
  }

  selectSearchResult(searchResult: SearchResult) {
    this.sharedService.searchResultIdentified.next(searchResult);
    this.searchField.setValue(null)
    this.showSearch = false;
  }
}
