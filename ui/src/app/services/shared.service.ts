import { Injectable } from '@angular/core';
import {Subject} from "rxjs";
import {Search, SearchResult} from "../domains/Search";

/**
 * <h3>Search functionality</h3>
 * <ul>
 * <li>app provides the search textfield and also the search result display</li>
 * <li>if user hits CTRL+F the input field is displayed</li>
 * <li>every key hit (except ENTER and ESC) is forwarded to the sub components by the search Subject (they subscribe to the search)</li>
 * <li>the component performs the search according to the context and returns the search result to this service as a closeSearch</li>
 * <li>app component displays the search result</li>
 * <li>if user selects a result, app triggers the corresponding event inside the sub component</li>
 * </ul>
 * <p>All in all, the service provides the 3 subjects for the interaction</p>
 */
@Injectable({
  providedIn: 'root'
})
export class SharedService {

  search = new Subject<string>();
  searchPerformed = new Subject<Search|undefined>();
  searchResultIdentified = new Subject<SearchResult>();

  constructor() { }

  getSearchSubject() {
    return this.search.asObservable();
  }

  getSearchResultIdentifiedSubject() {
    return this.searchResultIdentified.asObservable();
  }

  getSearchPerformed() {
    return this.searchPerformed.asObservable();
  }
}
