import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PartialsModule } from './components/partials.module';
import {
  ApiService,
  BusTimesService,
  WeatherService,
} from './services/api-service.service';
import { HttpClientModule } from '@angular/common/http';
import { HeaderService } from './services/header.service';
import { LatLongService } from './services/lat-long-service';
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    PartialsModule,
    HttpClientModule,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    ApiService,
    WeatherService,
    HeaderService,
    LatLongService,
    BusTimesService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
