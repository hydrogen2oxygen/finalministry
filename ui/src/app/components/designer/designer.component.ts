import {AfterViewInit, Component, OnInit} from '@angular/core';
import olMap from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import OSM from 'ol/source/OSM.js';
import XYZ from 'ol/source/XYZ';
import {FormControl} from "@angular/forms";
import {fromLonLat, Projection, toLonLat} from 'ol/proj';
import {Coordinate} from "ol/coordinate";
import {DragAndDrop, Draw, Modify, Select} from "ol/interaction";
import GeometryType from "ol/geom/GeometryType";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import {Fill, Stroke, Style, Text} from "ol/style";
import {MapDesign, TerritoryMap} from "../../domains/MapDesign";
import {CongregationService} from "../../services/congregation.service";
import {MapDesignService} from "../../services/map-design.service";
import {Congregation, Territory} from "../../domains/Congregation";
import {Geometry, Point} from "ol/geom";
import {Feature} from "ol";
import {GeoJSON, GPX, IGC, TopoJSON, WKT} from "ol/format";
import {ToastrService} from "ngx-toastr";
import {Extent} from "ol/extent";
import {NavigationService} from "../../services/navigation.service";
import KML from "ol/format/KML";
import VectorImageLayer from "ol/layer/VectorImage";
import {ResidentialUnit} from "../../domains/ResidentialUnit";

@Component({
  selector: 'app-designer',
  templateUrl: './designer.component.html',
  styleUrls: ['./designer.component.scss']
})
export class DesignerComponent implements OnInit, AfterViewInit {

  map: olMap | null = null;
  view: View = new View();
  vectorLayer:VectorLayer<any>=new VectorLayer<any>();
  coordinateX = new FormControl(48.6974947);
  coordinateY = new FormControl(9.1506559);
  source = new VectorSource();
  interaction: any = null;
  lastSelectedFeature: Feature | undefined = undefined;
  lastSelectedTerritoryMap: TerritoryMap | undefined = undefined;
  lastSavedTerritoryName: string = '';
  importedFeature: Feature | undefined = undefined;
  hideImportedFeature:boolean = true;
  showOsmData:boolean = false;

  styleRedOutline: Style = new Style({
    fill: new Fill({
      color: [0, 0, 0, 0.1]
    }),
    stroke: new Stroke({
      color: [255, 0, 0, 0.5],
      width: 5
    }),
    text: new Text({
      text: '',
      font: '12px Calibri,sans-serif',
      overflow: true,
      fill: new Fill({
        color: '#000',
      }),
      stroke: new Stroke({
        color: '#fff',
        width: 3,
      }),
    })
  });

  styleImported: Style = new Style({
    fill: new Fill({
      color: [0, 0, 0, 0.05]
    }),
    stroke: new Stroke({
      color: [255, 0, 0, 0.25],
      width: 4
    }),
    text: new Text({
      text: '',
      font: '12px Calibri,sans-serif',
      overflow: true,
      fill: new Fill({
        color: '#000',
      }),
      stroke: new Stroke({
        color: '#fff',
        width: 3,
      }),
    })
  });

  styleGreenOutlineActive: Style = new Style({
    fill: new Fill({
      color: [0, 255, 0, 0.1]
    }),
    stroke: new Stroke({
      color: [0, 100, 0, 0.5],
      width: 5
    }),
    text: new Text({
      text: '',
      font: '12px Calibri,sans-serif',
      overflow: true,
      fill: new Fill({
        color: '#007700',
      }),
      stroke: new Stroke({
        color: '#fff',
        width: 2,
      }),
    })
  });

  styleBlueOutlineActive: Style = new Style({
    fill: new Fill({
      color: [0, 255, 0, 0.05]
    }),
    stroke: new Stroke({
      color: [0, 0, 255, 0.05],
      width: 5
    }),
    text: new Text({
      text: '',
      font: '12px Calibri,sans-serif',
      overflow: true,
      fill: new Fill({
        color: '#00c4ff',
      }),
      stroke: new Stroke({
        color: '#fff',
        width: 2,
      }),
    })
  });

  mapDesign: MapDesign = new MapDesign();
  congregation: Congregation = new Congregation();
  note = new FormControl('');
  territoryNumber = new FormControl('');
  territoryCustomNumber = new FormControl('');
  territoryCustomName = new FormControl('');
  selectInteraction = new Select();
  dragAndDropInteraction = new DragAndDrop({formatConstructors: [GPX, GeoJSON, IGC, KML, TopoJSON],});
  wktFormat = new WKT();
  featureModified = false;
  modeSelected = '';

  constructor(
    private congregationService: CongregationService,
    private mapDesignService: MapDesignService,
    private toastr: ToastrService,
    private navigationService: NavigationService
  ) {
  }

  ngOnInit(): void {

    this.congregationService.getCongregation().subscribe((c: Congregation) => this.congregation = c);

    const osmLayer = new TileLayer({
      source: new OSM(),
    });
    osmLayer?.getSource()?.setAttributions([]);

    let that = this;

    this.vectorLayer = new VectorLayer({
      source: this.source,
      style: function (feature) {

        let style = that.styleRedOutline;

        if (!that.showOsmData && feature.get('residentialUnit')) {
          style = new Style({});
        } if (that.showOsmData && feature.get('residentialUnit')) {
          style = that.styleBlueOutlineActive;
        } else if (feature.get('imported') && !that.hideImportedFeature) {
          style = that.styleImported;
        } else if (feature.get('imported') && that.hideImportedFeature) {
          style = new Style({});
        } else if (feature.get('draft') == false) {
          style = that.styleGreenOutlineActive;
        }

        if (!(feature.get('imported') || feature.get('residentialUnit'))) {
          // @ts-ignore
          if (that.map.getView().getZoom() > 14 && feature.get('additionalNote')) {
            style.getText().setText(feature.get('name') + "\n" + feature.get('additionalNote'));
          } else
            // @ts-ignore
            if (that.map.getView().getZoom() > 14) {
            style.getText().setText(feature.get('name'));
          } else {
            style.getText().setText('');
          }
        }
        return style;
      }
    });

    const xyzLayer = new TileLayer({
      source: new XYZ({
        url: 'http://tile.osm.org/{z}/{x}/{y}.png'
      })
    });

    this.view = new View({
      center: [-472202, 7530279],
      zoom: 12
    });
    this.map = new olMap({
      layers: [
        osmLayer,
        this.vectorLayer
      ],
      view: this.view,
      controls: []
    });
  }

  ngAfterViewInit(): void {
    this.map?.setTarget('map');
    this.map?.addInteraction(this.selectInteraction);
    this.map?.addInteraction(this.dragAndDropInteraction);

    this.selectInteraction.on('select', e => {
      if (e.deselected) {
        console.log("deselect")
        this.lastSelectedFeature = undefined;
        this.territoryCustomNumber.setValue(null);
        this.territoryCustomName.setValue(null);
        this.note.setValue(null);
        //return;
      }

      this.lastSelectedFeature = e.selected[0];
      if (this.lastSelectedFeature) {
        this.territoryCustomNumber.setValue(this.lastSelectedFeature.get('territoryNumber'));
        this.territoryCustomName.setValue(this.lastSelectedFeature.get('territoryName'));
        this.note.setValue(this.lastSelectedFeature.get('note'));
      }

      this.mapDesign.territoryMapList.forEach(t => {
        if (t.territoryNumber == this.territoryCustomNumber.value) {
          this.lastSelectedTerritoryMap = t;
        }
      })
    });

    this.dragAndDropInteraction.on('addfeatures', e => {

      // @ts-ignore
      this.importedFeature = e.features[0];
      // @ts-ignore
      this.importedFeature.set('imported');
      let data = this.wktFormat.writeGeometry(<Geometry>this.importedFeature?.getGeometry());

      this.congregation.simpleFeatureData = data;
      this.congregationService.saveCongregation(this.congregation).subscribe(
        (c: Congregation) => this.congregation = c
      );

      const vectorSource = new VectorSource({
        // @ts-ignore
        features: e.features,
      });
      this.map?.addLayer(
        new VectorImageLayer({
          source: vectorSource,
        })
      );
      this.map?.getView().fit(vectorSource.getExtent());
    });

    this.loadMap(true);
  }

  navigate(url: string) {
    this.navigationService.navigate.emit(url)
  }

  loadMap(centerView?: boolean) {

    this.source.clear();

    this.mapDesignService.getMapDesign().subscribe((mapDesign: MapDesign) => {
      this.loadMapDesignObject(mapDesign);
      if (centerView) {
        this.map?.getView().setCenter([this.mapDesign.coordinatesX, this.mapDesign.coordinatesY]);
        this.map?.getView().setZoom(this.mapDesign.zoom);
      }
    })
  }

  loadMapDesignObject(mapDesign: MapDesign) {
    this.mapDesign = mapDesign;

    let format = new WKT();
    let territories = this.congregation.territoriesAssigned;
    territories = territories.concat(this.congregation.territoriesOlder4Months)
    territories = territories.concat(this.congregation.territoriesOlder8Months)

    mapDesign.territoryMapList.forEach(territoryMap => {

      let feature = format.readFeature(territoryMap.simpleFeatureData, {
        dataProjection: 'EPSG:3857',
        featureProjection: 'EPSG:3857'
      });
      feature.set('territoryNumber', territoryMap.territoryNumber);
      feature.set('territoryName', territoryMap.territoryName);
      feature.set('note', territoryMap.note);
      feature.set('name', '' + territoryMap.territoryNumber);
      feature.set('draft', territoryMap.draft);
      feature.setId(territoryMap.territoryNumber);
      let territory = territories.find(terr => terr.number == territoryMap.territoryNumber)
      if (territory) feature.set('additionalNote', territory.registryEntryList[territory.registryEntryList.length - 1].preacher.name)
      this.source.addFeature(feature);

      if (territoryMap.residentialUnits) {
        territoryMap.residentialUnits.forEach( (unit:ResidentialUnit) => {
          let featureUnit = format.readFeature(unit.polygon, {
            dataProjection: 'EPSG:3857',
            featureProjection: 'EPSG:3857'
          });
          featureUnit.set('residentialUnit', true);
          featureUnit.set('residentialData', unit);
          featureUnit.set('name', '');
          this.source.addFeature(featureUnit);
        });
      }
    });

    if (this.congregation.simpleFeatureData) {
      let feature = format.readFeature(this.congregation.simpleFeatureData, {
        dataProjection: 'EPSG:3857',
        featureProjection: 'EPSG:3857'
      });

      feature.set('imported', true);
      this.source.addFeature(feature);
    }

    this.featureModified = false;
    this.modeSelected = '';
  }

  saveMap() {

    if (!this.territoryCustomNumber.value) {
      this.toastr.warning("Territory Number is missing!");
      return;
    }

    if (this.territoryNumber.value?.length == 0) {
      this.territoryNumber.setValue(this.territoryCustomNumber.value)
    }

    if (this.lastSelectedFeature != undefined) {

      let territoryMap = new TerritoryMap();

      if (this.lastSelectedFeature.get('territoryNumber') != null) {
        console.log("Former territoryNumber = " + this.lastSelectedFeature.get('territoryNumber'))
        territoryMap.formerTerritoryNumber = this.lastSelectedFeature.get('territoryNumber');
      }

      this.lastSelectedFeature.setProperties([{'territoryNumber': this.territoryNumber.value}]);

      territoryMap.draft = true;
      territoryMap.lastUpdate = new Date();
      if (this.territoryNumber.value) territoryMap.territoryNumber = this.territoryNumber.value;
      if (this.territoryCustomName.value) territoryMap.territoryName = this.territoryCustomName.value;
      if (this.note.value) territoryMap.note = this.note.value;
      this.lastSavedTerritoryName = territoryMap.territoryNumber + ' ' + territoryMap.territoryName;
      let data = this.wktFormat.writeGeometry(<Geometry>this.lastSelectedFeature?.getGeometry());

      if (data == null || data == undefined) {
        data = '';
      }

      territoryMap.simpleFeatureData = data;
      this.mapDesign.territoryMapList.push(territoryMap);

      console.log(this.mapDesign);

      this.lastSelectedFeature = undefined;
    }

    this.mapDesignService.saveMapDesign(this.mapDesign).subscribe(() => {
      this.territoryNumber.setValue('');
      setTimeout(()=>{ // because sometimes this error occurs: com.fasterxml.jackson.databind.exc.MismatchedInputException: No content to map due to end-of-input
        this.loadMap();
      },250)
    })
  }

  setCoordinates() {
    let webMercatorCoordinates = fromLonLat(<number[]>[this.coordinateY.value, this.coordinateX.value]);
    this.map?.getView().setCenter(webMercatorCoordinates);
  }

  getCoordinates(coordinates: number[] | undefined): Coordinate {
    if (coordinates == undefined) return [0, 0];
    return toLonLat(coordinates)
  }

  drawPolygon() {
    this.territoryNumber.setValue('');
    this.addInteraction(GeometryType.POLYGON);
    this.modeSelected = 'polygon';
  }

  drawLine() {
    this.territoryNumber.setValue('');
    this.addInteraction(GeometryType.LINE_STRING);
    this.modeSelected = 'line';
  }

  drawPoint() {
    this.territoryNumber.setValue('');
    this.addInteraction(GeometryType.POINT);
    this.modeSelected = 'point';
  }

  editFeature() {

    if (this.interaction != null) {
      this.removeInteraction();
    }

    this.interaction = new Modify({
      source: this.source
    });

    let modify: Modify = this.interaction;

    modify.on('modifyend', evt => {

      let modifiedFeature = evt.features.getArray()[0];
      this.territoryCustomNumber.setValue(modifiedFeature.get('territoryNumber'));
      this.territoryCustomName.setValue(modifiedFeature.get('territoryName'));
      this.note.setValue(modifiedFeature.get('note'));
      this.lastSavedTerritoryName = this.territoryCustomNumber.value + ' ' + this.territoryCustomName.value;

      this.mapDesign.territoryMapList.forEach(t => {
        if (t.territoryNumber == this.territoryCustomNumber.value) {
          let data = this.wktFormat.writeGeometry(<Geometry>modifiedFeature.getGeometry());
          t.simpleFeatureData = data;
          t.draft = true; // it remains a "draft" until you activate it
          t.lastUpdate = new Date();
          this.featureModified = true;
        }
      })

    });

    this.map?.addInteraction(this.interaction);
    this.modeSelected = 'edit';
  }

  setNavigateMode() {
    this.territoryNumber.setValue('');
    this.removeInteraction();
  }

  private addInteraction(type: string) {
    this.removeInteraction();
    this.interaction = new Draw({
      type: type,
      source: this.source
    });
    let draw: Draw = this.interaction;
    draw.on('drawend', evt => {
      console.log('draw ended!');
      this.lastSelectedFeature = evt.feature;

      let territoryMap = new TerritoryMap();
      territoryMap.draft = true;
      territoryMap.lastUpdate = new Date();
      let data = this.wktFormat.writeGeometry(<Geometry>this.lastSelectedFeature?.getGeometry());

      if (data == null || data == undefined) {
        data = '';
      }

      territoryMap.simpleFeatureData = data;

      this.mapDesignService.saveTerritoryMap(territoryMap).subscribe((t: TerritoryMap) => {

        console.log(t)
        //this.lastSelectedFeature = undefined;

        if (this.lastSelectedFeature) {
          this.lastSelectedFeature.set('territoryNumber', t.territoryNumber);
          this.lastSelectedFeature.set('territoryName', t.territoryName);
          this.lastSelectedFeature.set('name', '' + t.territoryNumber);
          this.lastSelectedFeature.set('note', t.note);
          this.lastSelectedFeature.set('draft', t.draft);
          this.lastSelectedFeature.setId(territoryMap.territoryNumber);
          //this.source.addFeature(feature);
          console.log(this.lastSelectedFeature)
          this.mapDesign.territoryMapList.push(t);
        }
      });

    });

    this.map?.addInteraction(this.interaction);
    this.modeSelected = 'navigate';
  }

  private removeInteraction() {
    this.map?.removeInteraction(this.interaction);
    this.interaction = null;
  }

  setHomeCoordinates() {
    // @ts-ignore
    let center = this.map?.getView().getCenter();
    let zoom = this.map?.getView().getZoom();

    if (zoom) {
      this.mapDesign.zoom = zoom;
    }

    if (center) {
      this.mapDesign.coordinatesX = center[0];
      this.mapDesign.coordinatesY = center[1];
      this.mapDesignService.saveMapDesign(this.mapDesign).subscribe(() => {
        this.loadMap();
        this.toastr.info("New center was set!", "Map Service")
      })
    }
  }

  deleteMap() {
    console.log(this.lastSelectedFeature);
    let territoryNumber = this.lastSelectedFeature?.get('number');
    if (!territoryNumber) {
      territoryNumber = this.lastSelectedFeature?.get('territoryNumber');
    }
    console.log(territoryNumber)
    this.mapDesignService.deleteTerritoryMap(territoryNumber).subscribe((mapDesign: MapDesign) => {
      if (this.lastSelectedFeature) this.source.removeFeature(this.lastSelectedFeature);
      this.loadMapDesignObject(mapDesign)
    });
  }

  setMapData(territory: Territory) {
    this.territoryCustomNumber.setValue(territory.number);
    this.territoryCustomName.setValue(territory.name);
  }

  exportKml() {

    let format = new KML({
      'extractStyles':false
    });
    let kmlStyle = "<Document><Style id=\"failed\"><LineStyle><color>bfff55aa</color>" +
      "\t\t\t<width>2</width>\n" +
      "\t\t</LineStyle>\n" +
      "\t\t<PolyStyle>\n" +
      "\t\t\t<color>800055ff</color>\n" +
      "\t\t</PolyStyle>\n" +
      "\t</Style>\n" +
      "\t<Style id=\"failed0\">\n" +
      "\t\t<LineStyle>\n" +
      "\t\t\t<color>bfff55aa</color>\n" +
      "\t\t\t<width>2</width>\n" +
      "\t\t</LineStyle>\n" +
      "\t\t<PolyStyle>\n" +
      "\t\t\t<color>800055ff</color>\n" +
      "\t\t</PolyStyle>\n" +
      "\t</Style>\n" +
      "\t<StyleMap id=\"failed1\">\n" +
      "\t\t<Pair>\n" +
      "\t\t\t<key>normal</key>\n" +
      "\t\t\t<styleUrl>#failed</styleUrl>\n" +
      "\t\t</Pair>\n" +
      "\t\t<Pair>\n" +
      "\t\t\t<key>highlight</key>\n" +
      "\t\t\t<styleUrl>#failed0</styleUrl>\n" +
      "\t\t</Pair>\n" +
      "\t</StyleMap>";
    let kml = format.writeFeatures(this.source.getFeatures(), {featureProjection: 'EPSG:3857'});
    kml = kml.replace("<Document>", kmlStyle);
    kml = kml.replaceAll("<name>","<styleUrl>#failed1</styleUrl><name>");

    let binaryData = [];
    binaryData.push(kml);
    let downloadLink = document.createElement('a');
    downloadLink.href = window.URL.createObjectURL(new Blob(binaryData));
    downloadLink.setAttribute('download', 'export.kml');
    document.body.appendChild(downloadLink);
    downloadLink.click();
  }

  importKml() {
    console.log('import.kml')
  }

  importStreetNames() {
    this.mapDesignService.importStreetNames().subscribe(() => {
      this.toastr.info("Street data imported from OSM", "Map Service")
    });
  }

  setActive() {

    if (this.lastSelectedTerritoryMap != undefined) {

      console.log(this.lastSelectedTerritoryMap)
      this.lastSelectedTerritoryMap.draft = false;
      this.lastSelectedFeature?.set('draft', false);

      this.mapDesign.territoryMapList.forEach(t => {
        if (t.territoryNumber == this.lastSelectedTerritoryMap?.territoryNumber) {
          t.draft = false;

          this.mapDesignService.saveMapDesign(this.mapDesign).subscribe((m: MapDesign) => {
            this.territoryNumber.setValue('');
            this.loadMapDesignObject(m);
          });
        }
      });

      let territoryNumber = this.lastSelectedTerritoryMap.territoryNumber;
      let territoryName = this.lastSelectedTerritoryMap.territoryName;

      this.mapDesignService.setActiveTerritory(territoryNumber, territoryName).subscribe((mapDesign: MapDesign) => {
        this.toastr.success(territoryNumber + ' ' + territoryName + ' is now active!', 'Map Service');
        this.loadMapDesignObject(mapDesign);

      })

      this.lastSelectedFeature = undefined;
      this.lastSelectedTerritoryMap = undefined;
    }
  }

  navigateToTerritoryMap(number: any) {
    let feature: Feature<Geometry> | null = this.source.getFeatureById(number);
    if (feature != undefined && feature.getGeometry() != undefined) {
      // @ts-ignore
      let extent: Extent = feature.getGeometry().getExtent();
      this.map?.getView().fit(extent);
    }
  }

  territoryNumberSet() {
    if (this.territoryCustomNumber.value) {
      return this.territoryCustomNumber.value?.length > 0;
    }
    return false;
  }

  getDownloadOSMdata() {

    let epsg4326 = new Projection({'code':'EPSG:4326'});
    let epsg900913 = new Projection({'code':'EPSG:900913'});
    // @ts-ignore
    let extend:any[] = this.lastSelectedFeature?.getGeometry().getExtent();
    let xy1Coordinates = [extend[0],extend[1]];
    // @ts-ignore
    let xy1:number[] = new Point(xy1Coordinates).transform(epsg900913, epsg4326).flatCoordinates;
    let xy2Coordinates = [extend[2],extend[3]];
    // @ts-ignore
    let xy2:number[] = new Point(xy2Coordinates).transform(epsg900913, epsg4326).flatCoordinates;

    this.mapDesignService.downloadOsmData(xy1[1],xy1[0],xy2[1],xy2[0]).subscribe( (units:ResidentialUnit[]) => {

      let format = new WKT();
      let territoryMap:TerritoryMap|undefined;

      this.mapDesign.territoryMapList.forEach(t => {
        if (t.territoryNumber == this.territoryCustomNumber.value) {
          territoryMap = t;
        }
      });

      console.log(territoryMap)
      if (territoryMap == undefined) return;
      territoryMap.residentialUnits = [];

      units.forEach( unit => {

        if (unit.polygon) {
          let feature = format.readFeature(unit.polygon, {
            dataProjection: 'EPSG:3857',
            featureProjection: 'EPSG:3857'
          });

          // @ts-ignore
          let xy:any = this.getCenterOfExtent(feature.getGeometry()?.getExtent());

          // @ts-ignore
          if (this.lastSelectedFeature?.getGeometry().containsXY(xy[0],xy[1])) {

            feature.set('unit.data', '' + unit);
            this.source.addFeature(feature);
            territoryMap?.residentialUnits.push(unit);
          }
        }
      });

      if (territoryMap.residentialUnits.length > 0) {
        this.mapDesignService.saveMapDesign(this.mapDesign).subscribe(() => {
          // @ts-ignore
          this.toastr.success(`OSM Data downloaded, with ${territoryMap.residentialUnits.length} residential units`, "Map Service");
          //this.loadMap();
        })
      }
    });
  }

  getCenterOfExtent(extent:Extent){
    var X = extent[0] + (extent[2]-extent[0])/2;
    var Y = extent[1] + (extent[3]-extent[1])/2;
    return [X, Y];
  }
}

