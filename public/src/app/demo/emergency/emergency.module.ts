import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { FormsModule } from '@angular/forms';
import { NgxLoadingModule } from 'ngx-loading';
import { InputTrimModule } from 'ng2-trim-directive';
import { AgmCoreModule } from '@agm/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { EmergencyoutingModule } from './emergency-routing.module';
import { ListEmergencyComponent } from './list-emergency/list-emergency.component';
import { ViewEmergencyComponent } from './view-emergency/view-emergency.component';
import { AddEmergencyComponent } from './add-emergency/add-emergency.component';
@NgModule({
  imports: [
    CommonModule,
    EmergencyoutingModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    NgxLoadingModule.forRoot({}),
    InputTrimModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyA2nAC5PVSxPN5Zanwr_DE8B4ccx5ATbUI',
      libraries: ['places']
    })
  ],
  declarations: [ListEmergencyComponent, AddEmergencyComponent, ViewEmergencyComponent]
})

export class EmergencyModule { }
