import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { Index } from './index/index';
import { EsriMapComponent } from './esri-map/esri-map.component';

import { CoreModule } from './core/core.module';

@NgModule({
  declarations: [
    Index,
    EsriMapComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule
  ],
  providers: [], 
  bootstrap: [Index]
})
export class AppModule { }
