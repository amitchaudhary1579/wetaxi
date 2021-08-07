import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { DashboardComponent } from './dashboard.component';
import { NgxLoadingModule } from 'ngx-loading';
import { AgmCoreModule } from '@agm/core';


@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    DashboardRoutingModule,
    NgxLoadingModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyA2nAC5PVSxPN5Zanwr_DE8B4ccx5ATbUI'
    })
  ],
  declarations: [DashboardComponent]
})
export class DashboardModule { }
