import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { loadModules } from 'esri-loader';
import esri = __esri;

import {State} from './region/us-state';
import { when } from 'q';

export class GenericMap {
    private _mapView: esri.MapView;
    private featureLayerLoadingConfigs: Map<esri.FeatureLayer, (layerView: esri.LayerView) => void>;

    private eventConfig: any = {};
    private subscriber: GenericMap;

    constructor(private readonly map: esri.Map, 
        private readonly featureDisplayLayer: esri.GraphicsLayer,
        private readonly graphicDisplayLayer: esri.GraphicsLayer,
        private readonly STATES: Array<number>) {
        this.graphicDisplayLayer.visible = false;
        this.featureDisplayLayer.visible = true;
        map.addMany([featureDisplayLayer, graphicDisplayLayer]);
        this.featureLayerLoadingConfigs = new Map();
    }

    addFeatureLayer(featureLayer: esri.FeatureLayer, 
        conditionalLoading: (featureLayer: esri.FeatureLayer, displayLayer: esri.GraphicsLayer) => (layerView: esri.LayerView) => void) {
        this.map.add(featureLayer);
        this.featureLayerLoadingConfigs.set(featureLayer, conditionalLoading(featureLayer, this.featureDisplayLayer));
    }

    addGraphic(...graphics: esri.Graphic[]) {
        this.graphicDisplayLayer.addMany(graphics);
    }

    initMap(mapView, switchZoom: number): GenericMap {
        try {
            this._mapView = mapView;
            this._mapView.set({"map": this.map});

            //display the specified US States only
            this.featureLayerLoadingConfigs.forEach((conditionalLoading, featureLayer) => {
                this._mapView.whenLayerView(featureLayer).then(conditionalLoading);
            });

            this._mapView.whenLayerView(this.featureDisplayLayer).then(() => {
                this._mapView.watch("zoom", (newValue, oldValue) => {
                    // console.log("old: " + oldValue + ", new: " + newValue);
                    const is3D = this._mapView.type === "3d";
                    const zoom = Math.ceil(newValue * 100)/100.0;
    
                    console.log("is3D: " + is3D + ", zoom: " + zoom + ", scale:" + this._mapView.scale);
                    //switch between 2d and 3d
                    if ((is3D && zoom > switchZoom + 1) || (!is3D && zoom < switchZoom && zoom >= 0)) {
                        this.subscriber.updateContainerAndViewpoint(this._mapView.container, this._mapView.viewpoint, zoom);
                        this._mapView.container = null;
                    }

                    //siwtch displayLayer
                    if (zoom >= 7) {
                        this.featureDisplayLayer.visible = false;
                        this.graphicDisplayLayer.visible = true;
                    } else {
                        this.featureDisplayLayer.visible = true;
                        this.graphicDisplayLayer.visible = false;
                    }
                });
            });
        } catch (error) {
            console.log(error);
        }
        return this;
    }

    /**
     * A wrapper for `MapView::on` or `SceneView::on`
     * @param name event anem
     * @param eventHandler event handler
     */
    on(name: string, eventHandler: (view: esri.MapView | esri.SceneView, config: any, ...displayLayers: esri.GraphicsLayer[]) => any) {
        this._mapView.on(name, eventHandler(this._mapView, this.eventConfig, this.featureDisplayLayer, this.graphicDisplayLayer));
    }

    subscribeZoomEvent(mapView: GenericMap) {
        this.subscriber = mapView;
    }

    updateContainerAndViewpoint(container: any, viewpoint: any, zoom: number) {
        this._mapView.container = container;
        if (viewpoint) {
            this._mapView.viewpoint = viewpoint.clone();
        }
        this._mapView.zoom = zoom;
    }
}


