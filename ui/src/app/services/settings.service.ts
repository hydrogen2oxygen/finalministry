import {Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Settings} from "../domains/Settings";

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  public static url = `${environment.serverUrl}/settings/`;

  constructor(private http:HttpClient) { }

  isInternetAvailable():Observable<any> {
    return this.http.get<any>(`${SettingsService.url}/internet`);
  }

  getSettings():Observable<Settings> {
    return this.http.get<Settings>(`${SettingsService.url}`);
  }

  saveSettings(settings:Settings):Observable<Settings> {
    return this.http.put<Settings>(`${SettingsService.url}`, settings);
  }
}
