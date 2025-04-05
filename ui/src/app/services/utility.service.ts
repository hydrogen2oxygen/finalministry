import {Injectable} from '@angular/core';
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {ImportPath} from "../domains/ImportPath";

@Injectable({
  providedIn: 'root'
})
export class UtilityService {

  public static url = `${environment.serverUrl}/utility/`;

  constructor(private http:HttpClient) { }

  importTerritoriesFromText(filePath:string):Observable<void> {
    let importPath = new ImportPath();
    importPath.importPath = filePath;
    return this.http.post<void>(`${UtilityService.url}importTerritoriesFromText`, importPath);
  }

  uploadTerritoryMapApplication():Observable<string> {
    return this.http.put<string>(`${UtilityService.url}uploadTerritoryMapApplication`, null);
  }
}
