import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NgxLoadingModule } from 'ngx-loading';
import { InputTrimModule } from 'ng2-trim-directive';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FileValidator } from '../helper/file-input.validator';
import { PassengerRideRoutingModule } from './passenger-ride-routing.module';
import { ListPassengerRideComponent } from './list-passenger-ride/list-passenger-ride.component';
import { ViewPassengerRideComponent } from './view-passenger-ride/view-passenger-ride.component';
import { SingleViewPassengerRideComponent } from './single-view-passenger-ride/single-view-passenger-ride.component';

@NgModule({
  imports: [
    CommonModule,
    PassengerRideRoutingModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    NgbDropdownModule,
    NgxLoadingModule.forRoot({}),
    InputTrimModule,
    NgbDatepickerModule
  ],
  declarations: [ListPassengerRideComponent, ViewPassengerRideComponent, SingleViewPassengerRideComponent],
  providers: [ FileValidator ]

})

export class PassengerRideModule { }
