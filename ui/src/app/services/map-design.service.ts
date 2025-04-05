import {Injectable} from '@angular/core';
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {MapDesign, TerritoryMap} from "../domains/MapDesign";
import {ResidentialUnit} from "../domains/ResidentialUnit";

@Injectable({
  providedIn: 'root'
})
export class MapDesignService {

  public static url = `${environment.serverUrl}/map/`;

  constructor(private http:HttpClient) { }

  getMapDesign():Observable<MapDesign> {
    return this.http.get<MapDesign>(`${MapDesignService.url}`);
  }

  downloadMapDesign():Observable<void> {
    return this.http.get<void>(`${MapDesignService.url}downloadMapDesign`)
  }

  saveMapDesign(mapDesign:MapDesign):Observable<MapDesign> {

    let stringMapDesign = JSON.stringify(mapDesign, this.getCircularReplacer());
    let uncycledMapDesign = JSON.parse(stringMapDesign);

    return this.http.put<MapDesign>(`${MapDesignService.url}`,uncycledMapDesign);
  }

  saveTerritoryMap(territoryMap:TerritoryMap):Observable<TerritoryMap> {

    let stringMapDesign = JSON.stringify(territoryMap, this.getCircularReplacer());
    let uncycledTerritoryMap = JSON.parse(stringMapDesign);

    return this.http.put<TerritoryMap>(`${MapDesignService.url}territoryMap`,uncycledTerritoryMap);
  }

  deleteTerritoryMap(territoryNumber:string):Observable<MapDesign> {
    return this.http.delete<MapDesign>(`${MapDesignService.url}territoryMap/${territoryNumber}`);
  }

  exportKml():Observable<void> {
    return this.http.get<any>(`${MapDesignService.url}exportKml`);
  }

  importStreetNames():Observable<void> {
    return this.http.get<any>(`${MapDesignService.url}importStreetNames`);
  }

  setActiveTerritory(territoryNumber:string,name:string):Observable<MapDesign> {
    return this.http.get<MapDesign>(`${MapDesignService.url}setActiveTerritory/${territoryNumber}/${name}`);
  }

  getCircularReplacer = () => {
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

  downloadOsmData(x1:number,y1:number,x2:number,y2:number):Observable<ResidentialUnit[]> {
    //console.log(`https://overpass-api.de/api/interpreter?data=[out:json];nwr(${x1},${y1},${x2},${y2});out;`);
    return this.http.get<ResidentialUnit[]>(`${MapDesignService.url}/downloadResidantialUnits/${x1}/${y1}/${x2}/${y2}`);
  }
}
