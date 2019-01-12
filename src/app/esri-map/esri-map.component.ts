/*
  Copyright 2018 Esri
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { loadModules } from 'esri-loader';
import esri = __esri;

import {State} from './region/us-state';
import {GenericMap} from './map';

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
    State.Washington, State.California, State.Alaska, State.Florida, State["New York"], State.Oregon];

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
      const [EsriMap, EsriSceneView, EsriMapView, EsriFeatureLayer, EsriGraphicsLayer] = 
        await loadModules([
          'esri/Map',
          'esri/views/SceneView',
          'esri/views/MapView',
          'esri/layers/FeatureLayer',
          "esri/layers/GraphicsLayer"
        ]);

      const defaultSymbol = {
        type: "simple-fill",
        style: "solid",
        color: [95, 155, 200, 0],
        outline: {
          color: [239, 239, 239, 1],
          width: 0.1
        }
      };

      const displaySymbol = {
        type: "simple-fill",
        style: "solid",
        color: [95, 155, 200, 0.5],
        outline: {
          color: [255, 255, 255, 1],
          width: 0.1
        }
      };

      const htsymbol = {
        type: "simple-fill",
        style: "solid",
        color: [95, 155, 200, 1],
        outline: {
          color: [255, 255, 255, 1],
          width: 3
        }
      };

      const renderer = {
        type: "unique-value",
        defaultSymbol: defaultSymbol
      };

      const usStateLayerConfig2D = {
        portalItem: {id: "99fd67933e754a1181cc755146be21ca"},
        renderer: renderer,
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

      const map2D = new GenericMap(new EsriMap({basemap: this._basemap}), new EsriGraphicsLayer(), this.STATES);
      const map3D = new GenericMap(new EsriMap({basemap: this._basemap}), new EsriGraphicsLayer(), this.STATES);

      const conditionalLoading = (usStateLayer, displayLayer): (layerView: esri.LayerView) => void => {
        return ignore => {
          const query = usStateLayer.createQuery();
          const stateNames = this.STATES.map(state => State[state]);
          query.where = "STATE_NAME = '" + stateNames.join("' OR STATE_NAME = '") + "'";
          // console.log(query.where);
          usStateLayer.queryFeatures(query)
          .then(result => {
            const features = result.features.map(graphic => {
              graphic.symbol = displaySymbol;
              return graphic;
            });
            // console.log(features);
            displayLayer.addMany(features);
          });
        };
      };

      map2D.addFeatureLayer(new EsriFeatureLayer(usStateLayerConfig2D), conditionalLoading);
      map3D.addFeatureLayer(new EsriFeatureLayer(usStateLayerConfig3D), conditionalLoading);

      const mapView = map2D.initMap(new EsriMapView({
        container: null,
        center: this._center,
        zoom: this._zoom
      }), this.MAP_SWITCH_ZOOM);
      const sceneView = map3D.initMap(new EsriSceneView({
        container: this.mapViewEl.nativeElement,
        center: this._center,
        zoom: 3
      }), this.MAP_SWITCH_ZOOM);
      
      mapView.subscribeZoomEvent(sceneView);
      sceneView.subscribeZoomEvent(mapView);

      //highlight layer while mouse hovers
      const pointerMoveHandler = (displayLayer, config, view): esri.MapViewPointerMoveEventHandler => {
        return event => {
          //highlight handler
          const handler = response => {
            // console.log("len: " + response.results.length + ", zoom: " + view.zoom);
            if (response.results.length && view.zoom < 6) {
              const graphic = response.results.filter(result => result.graphic && result.graphic.layer === displayLayer)[0].graphic;
              console.log(graphic);
              if (config && config.highlight && config.highlight != graphic) {
                config.highlight.symbol = displaySymbol;
              }
              config.highlight = graphic;
              graphic.symbol = htsymbol;
              console.log(graphic.attributes);
            } else {
              config.highlight.symbol = displaySymbol;
              config.highlight = null;
            }
          };
          view.hitTest(event).then(handler);
        };
      };

      map2D.on("pointer-move", pointerMoveHandler);
      // map3D.on("pointer-move", pointerMoveHandler);

      //click event
      const clickEventHandler = (displayLayer, config, view): esri.MapViewClickEventHandler => {
        return event => {
          view.hitTest(event).then(response => {
            if (response.results.length) {
              const graphic = response.results.filter(result => result.graphic.layer === displayLayer)[0].graphic;
              if (config && config.centerGraphic && config.centerGraphic !== graphic) {
                config.centerGraphic.set("symbol", displaySymbol);
              }
              config.centerGraphic = graphic;
              view.goTo(graphic).then(() => graphic.set("symbol", defaultSymbol));
            }
          });
        };
      };
      map2D.on("click", clickEventHandler);
      // map3D.on("click", clickEventHandler);

      // drag event
      //TODO: clean up config.centerGraphic
      const dragEventHandler = (displayLayer, config, view): esri.MapViewDragEventHandler => {
        return event => {
          if (!config.centerGraphic) {
            return;
          }
          //TODO: https://developers.arcgis.com/javascript/latest/api-reference/esri-views-MapView.html#event:drag
          view.hitTest(view.center).then(response => {
            if (response.results.length) {
              const graphic = response.results.filter(result => result.graphic.layer === displayLayer)[0].graphic;
              if (config.centerGraphic === graphic) {
                return;
              }
            }
            config.centerGraphic.set("symbol", displaySymbol);
            config.centerGraphic = null;
          });
        };
      };
      map2D.on("drag", dragEventHandler);
      map3D.on("drag", dragEventHandler);
    } catch (error) {
      console.log(error);
    }
  }

  ngOnInit() {
    this.initializeMap();
  }
}

