import {Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {Congregation, Territory, Version} from "../domains/Congregation";
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Message} from "../domains/Message";
import {BackupFile} from "../domains/BackupFile";

@Injectable({
  providedIn: 'root'
})
export class CongregationService {

  public static url = `${environment.serverUrl}/congregation/`;

  constructor(private http:HttpClient) { }

  getCongregation():Observable<Congregation> {
    return this.http.get<Congregation>(`${CongregationService.url}`);
  }

  version():Observable<Version> {
    return this.http.get<Version>(`${CongregationService.url}version`);
  }

  search(text:string):Observable<string[]> {
    return this.http.get<string[]>(`${CongregationService.url}search/${text}`);
  }

  printCongregation():Observable<void> {
    return this.http.get<void>(`${CongregationService.url}printPDF`);
  }

  registerTerritory(territoryNumber?:string):Observable<Message> {

      return this.http.post<Message>(`${CongregationService.url}registerTerritory/${territoryNumber}`,null);
  }

  exportDatabase():Observable<void> {
    return this.http.post<void>(`${CongregationService.url}exportDatabase`,null);
  }

  exportTerritoryData(territoryNumber?:string|undefined, onlyRepair:boolean=false):Observable<Message> {

    let exportUrl = 'exportTerritoryData';

    if (onlyRepair) exportUrl = 'reexportTerritoryData';

    if (territoryNumber != undefined) {
      return this.http.post<Message>(`${CongregationService.url}${exportUrl}/${territoryNumber}`,null);
    }
    return this.http.post<Message>(`${CongregationService.url}exportTerritoryData`,null);
  }

  reexportTerritoryData():Observable<Message> {
    return this.http.post<Message>(`${CongregationService.url}reexportTerritoryData`,null);
  }

  exportAllTerritoryData():Observable<void> {
    return this.http.post<void>(`${CongregationService.url}exportAllTerritoryData`,null);
  }

  repairExports():Observable<void> {
    return this.http.post<void>(`${CongregationService.url}repairExports`,null);
  }

  saveCongregation(congregation:Congregation):Observable<Congregation> {

    const getCircularReplacer = () => {
      const seen = new WeakSet();
      return (key:any, value:any) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return;
          }
          seen.add(value);
        }
        return value;
      };
    };

    let stringCongregation = JSON.stringify(congregation, getCircularReplacer());
    let uncycledCongregation = JSON.parse(stringCongregation);

    return this.http.put<Congregation>(`${CongregationService.url}`,uncycledCongregation);
  }

  deleteTerritory(territoryNumber:string):Observable<Congregation> {
      return this.http.delete<Congregation>(`${CongregationService.url}territory/${territoryNumber}`);
  }

  getBackupFiles():Observable<BackupFile[]> {
    return this.http.get<BackupFile[]>(`${CongregationService.url}backup`);
  }

  restoreBackup(backupFile:BackupFile):Observable<void> {
    return this.http.put<void>(`${CongregationService.url}backup`,backupFile);
  }

  deleteBackup(backupFile:BackupFile):Observable<void> {
    return this.http.put<void>(`${CongregationService.url}backup/delete`,backupFile);
  }

  returnTerritory(territory: Territory):Observable<Congregation> {
    return this.http.put<Congregation>(`${CongregationService.url}returnTerritory/${territory.number}`,null);
  }
}
