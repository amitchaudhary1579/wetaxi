import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NgxLoadingModule } from 'ngx-loading';
import { InputTrimModule } from 'ng2-trim-directive';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { FileValidator } from '../helper/file-input.validator';
import { SelectModule } from 'ng-select';
import { ListVehicleComponent } from './list-vehicle/list-vehicle.component';
import { VehicleRoutingModule } from './vehicle-routing.module';
import { AddVehicleComponent } from './add-vehicle/add-vehicle.component';
import { ViewVehicleComponent } from './view-vehicle/view-vehicle.component';

@NgModule({
  imports: [
    CommonModule,
    VehicleRoutingModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    NgbDropdownModule,
    NgxLoadingModule,
    InputTrimModule,
    NgbDatepickerModule,
    SelectModule
  ],
  declarations: [ ListVehicleComponent, AddVehicleComponent, ViewVehicleComponent],
  providers: [ FileValidator ]
})

export class VehicleModule { }
