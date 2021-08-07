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
import { DriverRewardsRoutingModule } from './driver-rewards-routing.module';
import { DriverRewardsComponent } from './driver-rewards/driver-rewards.component';
import { SingleDriverRewardsComponent } from './single-driver-rewards/single-driver-rewards.component';
import { ViewDriverRewardsComponent } from './view-driver-rewards/view-driver-rewards.component';
import { AddRewardComponent } from './add-reward/add-reward.component';

@NgModule({
  imports: [
    CommonModule,
    DriverRewardsRoutingModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    NgbDropdownModule,
    NgxLoadingModule,
    InputTrimModule,
    NgbDatepickerModule,
    SelectModule
  ],
  declarations: [ DriverRewardsComponent, SingleDriverRewardsComponent, ViewDriverRewardsComponent, AddRewardComponent],
  providers: [ FileValidator ]
})

export class DriverRewardsModule { }
