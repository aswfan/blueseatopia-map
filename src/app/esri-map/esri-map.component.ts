import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { loadModules } from 'esri-loader';
import esri = __esri;

import {State} from './region/us-state';
import {GenericMap} from './map';
import {Symbol} from './utilities/symbols'; 

@Component({
  selector: 'app-esri-map',
  templateUrl: './esri-map.component.html',
  styleUrls: ['./esri-map.component.css']
})
export class EsriMapComponent implements OnInit {

  @Output() mapLoaded = new EventEmitter<boolean>();
  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  /**
   * @private _zoom sets map zoom
   * @private _center sets map center
   * @private _basemap sets type of map
   */
  private _zoom: number = 3;
  private _center: Array<number> = [-101.17, 38];
  private _basemap: string = 'gray';

  private readonly MAP_SWITCH_ZOOM = 3;
  private readonly STATES = [
    State.Washington];//, State.California, State.Alaska, State.Florida, State["New York"], State.Oregon];

  @Input()
  set zoom(zoom: number) {
    this._zoom = zoom;
  }

  get zoom(): number {
    return this._zoom;
  }

  @Input()
  set center(center: Array<number>) {
    this._center = center;
  }

  get center(): Array<number> {
    return this._center;
  }

  @Input()
  set basemap(basemap: string) {
    this._basemap = basemap;
  }

  get basemap(): string {
    return this._basemap;
  }

  constructor() { }

  async initializeMap() {
    try {
      const [EsriMap, EsriSceneView, EsriMapView, EsriFeatureLayer, EsriGraphicsLayer, EsriGraphic] = 
        await loadModules([
          'esri/Map',
          'esri/views/SceneView',
          'esri/views/MapView',
          'esri/layers/FeatureLayer',
          "esri/layers/GraphicsLayer",
          "esri/Graphic"
        ]);

      const usStateLayerConfig2D = {
        portalItem: {id: "99fd67933e754a1181cc755146be21ca"},
        renderer: {
          type: "unique-value",
          defaultSymbol: Symbol.defaultSymbol
        },
        labelingInfo: [{
          labelExpressionInfo: { expression: "$feature.STATE_ABBR" },
          symbol: {
            type: "text",
            color: [239, 239, 239, 1],
            haloSize: 0.1,
            haloColor: [239, 239, 239, 1]
          }
        }],
        popupEnabled: false
      };

      const usStateLayerConfig3D = {
        portalItem: {id: "99fd67933e754a1181cc755146be21ca"},
        visible: false,
        highlightOptions: {
          color: [255, 241, 58],
          fillOpacity: 0.4
        }
      };

      const map2D = new GenericMap(new EsriMap({basemap: this._basemap}), new EsriGraphicsLayer(), new EsriGraphicsLayer(), this.STATES);
      const map3D = new GenericMap(new EsriMap({basemap: this._basemap}), new EsriGraphicsLayer({
        hasZ: true,
        elevationInfo: {
          mode: "absolute-height",
          offset: 0,
          featureExpressionInfo:{
            expression: "40000"
          },
          unit: "meters"
        }
      }), new EsriGraphicsLayer(), this.STATES);

      const conditionalLoading = (usStateLayer, displayLayer): (layerView: esri.LayerView) => void => {
        return ignore => {
          const query = usStateLayer.createQuery();
          const stateNames = this.STATES.map(state => State[state]);
          query.where = "STATE_NAME = '" + stateNames.join("' OR STATE_NAME = '") + "'";
          // console.log(query.where);
          usStateLayer.queryFeatures(query)
          .then(result => {
            const features = result.features.map(graphic => {
              graphic.symbol = Symbol.displaySymbol;
              return graphic;
            });
            // console.log(features);
            displayLayer.addMany(features);
          });
        };
      };

      //add layer
      map2D.addFeatureLayer(new EsriFeatureLayer(usStateLayerConfig2D), conditionalLoading);
      map3D.addFeatureLayer(new EsriFeatureLayer(usStateLayerConfig3D), conditionalLoading);

      //add point
      map2D.addGraphic(new EsriGraphic({
        geometry: {
          type: "point",
          longitude: -122.30546046972074,
          latitude: 47.654676728405775
        },
        symbol: Symbol.pictureSymbol//Symbol.pointSymbol
      }));

      const mapView = map2D.initMap(new EsriMapView({
        container: null,
        center: this._center,
        zoom: this._zoom
      }), this.MAP_SWITCH_ZOOM);
      const sceneView = map3D.initMap(new EsriSceneView({
        container: this.mapViewEl.nativeElement,
        center: this._center,
        zoom: this._zoom
      }), this.MAP_SWITCH_ZOOM);
      
      mapView.subscribeZoomEvent(sceneView);
      sceneView.subscribeZoomEvent(mapView);

      //highlight layer while mouse hovers
      const pointerMoveHandler = (view, config, ...displayLayers: esri.GraphicsLayer[]): esri.MapViewPointerMoveEventHandler => {
        return event => {
          //highlight handler
          const handler = response => {
            if (response.results.length) {
              let graphic = response.results.filter(result => result.graphic && displayLayers.includes(result.graphic.layer))
              if (graphic && graphic.length > 0) {
                graphic = graphic[0].graphic;
                if (config && config.highlight && config.highlight != graphic && config.centerGraphic != graphic) {
                  config.highlight.symbol = config.highlight.geometry.type === "point" ? Symbol.pictureSymbol : Symbol.displaySymbol;
                }
                // console.log(graphic.attributes);
                config.highlight = graphic;
                graphic.symbol = graphic.geometry.type === "point" ? Symbol.htPictureSymbol : Symbol.htSymbol;
                return;
              }
            }
            if (!(config && config.highlight && config.centerGraphic && config.highlight === config.centerGraphic)) {
              config.highlight.symbol = config.highlight.geometry.type === "point" ? Symbol.pictureSymbol : Symbol.displaySymbol;
            }
            config.highlight = null;
          };
          view.hitTest(event).then(handler);
        };
      };

      map2D.on("pointer-move", pointerMoveHandler);
      map3D.on("pointer-move", pointerMoveHandler);

      //click event
      const clickEventHandler = (view, config, ...displayLayers: esri.GraphicsLayer[]): esri.MapViewClickEventHandler => {
        return event => {
          view.hitTest(event).then(response => {
            if (response.results.length) {
              const graphic = response.results.filter(result => displayLayers.includes(result.graphic.layer))[0].graphic;
              config.centerGraphic = graphic;
              if (graphic.geometry.type === "point") {
                view.goTo({target: graphic, zoom: 12}).then(() => graphic.symbol = Symbol.htPictureSymbol);
              } else {
                view.goTo(graphic);
              }
            } else {
              if (config && config.centerGraphic) {
                config.centerGraphic.symbol = config.centerGraphic.geometry.type === "point" ? Symbol.pictureSymbol : Symbol.displaySymbol;
              }
              config.centerGraphic = null;
            }
          });
        };
      };
      map2D.on("click", clickEventHandler);
      map3D.on("click", clickEventHandler);
    } catch (error) {
      console.log(error);
    }
  }

  ngOnInit() {
    this.initializeMap();
  }
}

