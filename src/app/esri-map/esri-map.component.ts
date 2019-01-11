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
    var appConfig = {
      mapView: null,
      sceneView: null,
      activeView: null,
      container: this.mapViewEl.nativeElement
    };

    try {
      const [EsriMap, EsriSceneView, EsriMapView, EsriFeatureLayer, EsriWatchUtils, EsriGraphicsLayer] = await loadModules([
        'esri/Map',
        'esri/views/SceneView',
        'esri/views/MapView',
        'esri/layers/FeatureLayer',
        'esri/core/watchUtils',
        "esri/layers/GraphicsLayer",
      ]);

      const defaultSymbol = {
        type: "simple-fill",
        style: "solid",
        color: [95, 155, 200, 0],
        outline: {
          color: [239, 239, 239, 1],
          width: 0.1
        }
      }

      const displaySymbol = {
        type: "simple-fill",
        style: "solid",
        color: [95, 155, 200, 0.5],
        outline: {
          color: [255, 255, 255, 1],
          width: 0.1
        }
      }

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

      const usStateLayer = new EsriFeatureLayer({
        portalItem: {id: "99fd67933e754a1181cc755146be21ca"},
        outFields: ["*"],
        renderer: renderer,
        labelingInfo: [{
          labelExpressionInfo: { expression: "$feature.STATE_ABBR" },
          symbol: {
            type: "text",  // autocasts as new TextSymbol()
            color: [239, 239, 239, 1],
            haloSize: 0.1,
            haloColor: "white"
          }
        }],
        labelsVisible: true
      });

      const displayLayer = new EsriGraphicsLayer();

      const basemap2D = new EsriMap({
        basemap: "gray",
        layers: [displayLayer, usStateLayer]
      });

      const basemap3D = new EsriMap({
        basemap: "gray",
        // layers: [displayLayer, usStateLayer]
      });

      const mapView: esri.MapView = new EsriMapView({
        container: appConfig.container,
        center: this._center,
        zoom: this._zoom,
        map: basemap2D,
        highlightOptions: {
          color: [255, 255, 255, 1],
          haloOpacity: 5,
          fillOpacity: 0
        }
      });
      appConfig.mapView = mapView;
      appConfig.activeView = mapView;
      
      const sceneView: esri.SceneView = new EsriSceneView({
        container: null,
        center: this._center,
        zoom: this.MAP_SWITCH_ZOOM - 1,
        map: basemap3D
      });
      appConfig.sceneView = sceneView;

      //display the specified US States only
      mapView.whenLayerView(usStateLayer).then(ignore => {
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
            displayLayer.addMany(features);
          });
      });

      //highlight layer while mouse hovers
      let highlight, oldGraphic;
      mapView.on("pointer-move", event => {
        //highlight handler
        const handler = response => {
          if (response.results.length) {
            var graphic = response.results.filter(result => {
              return result.graphic.layer === displayLayer;
            })[0].graphic;

            if (highlight && oldGraphic != graphic) {
              highlight.symbol = displaySymbol;
            }
            highlight = graphic;
            graphic.symbol = htsymbol;
            // console.log(graphic.attributes);
          } else {
            highlight.symbol = displaySymbol;
            highlight = null;
          }
        };
        mapView.hitTest(event).then(handler);
      });

      //switch between MapView and SceneView according to zoom value
      let switchHandler;
      const switchView = () => {
        const activeView = appConfig.activeView;
        const is3D = activeView.type === "3d";
        const activeViewpoint = activeView.viewpoint.clone();

        console.log("is3D: " + is3D + ", zoom: " + activeView.zoom);

        if (is3D && activeView.zoom >= this.MAP_SWITCH_ZOOM) {
          activeView.container = null;
          appConfig.mapView.viewpoint = activeViewpoint;
          appConfig.mapView.container = appConfig.container;
          appConfig.activeView = appConfig.mapView;
        } else if (!is3D && activeView.zoom < this.MAP_SWITCH_ZOOM) {
          activeView.container = null;
          appConfig.sceneView.viewpoint = activeViewpoint;
          appConfig.sceneView.container = appConfig.container;
          appConfig.activeView = appConfig.sceneView;
        }
      }

      EsriWatchUtils.watch(mapView, "zoom", switchView);
      EsriWatchUtils.watch(sceneView, "zoom", switchView);
    } catch (error) {
      console.log(error);
    }
  }

  ngOnInit() {
    this.initializeMap();
  }
}
