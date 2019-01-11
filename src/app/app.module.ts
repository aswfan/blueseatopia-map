import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { Index } from './index';
import { EsriMapComponent } from './esri-map/esri-map.component';

@NgModule({
  declarations: [
    Index,
    EsriMapComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [], 
  bootstrap: [Index]
})
export class AppModule { }
