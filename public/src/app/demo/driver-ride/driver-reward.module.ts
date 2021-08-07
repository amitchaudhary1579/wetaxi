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
import { DriverRewardRoutingModule } from './driver-reward-routing.module';
import { ListDriverRewardComponent } from './list-driver-reward/list-driver-reward.component';
import { ViewDriverRideComponent } from './view-driver-ride/view-driver-ride.component';
import { SingleViewDriverRideComponent } from './single-view-driver-ride/single-view-driver-ride.component';

@NgModule({
  imports: [
    CommonModule,
    DriverRewardRoutingModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    NgbDropdownModule,
    NgxLoadingModule,
    InputTrimModule,
    NgbDatepickerModule,
    SelectModule
  ],
  declarations: [ ListDriverRewardComponent, ViewDriverRideComponent, SingleViewDriverRideComponent],
  providers: [ FileValidator ]
})

export class DriverRewardModule { }
