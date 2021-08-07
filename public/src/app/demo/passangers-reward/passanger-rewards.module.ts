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
import { SelectModule } from 'ng-select';
import { PassangerRewardRoutingModule } from './passanger-rewards-routing.module';
import { PassangerRewardsComponent } from './passanger-rewards/passanger-rewards.component';
import { AddRewardsComponent } from './add-rewards/add-rewards.component';
import { ViewPassangerRewardsComponent } from './view-passanger-rewards/view-passanger-rewards.component';
// import { ViewPassengerRideComponent } from './view-passenger-ride/view-passenger-ride.component';
// import { SingleViewPassengerRideComponent } from './single-view-passenger-ride/single-view-passenger-ride.component';

@NgModule({
  imports: [
    CommonModule,
    PassangerRewardRoutingModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    NgbDropdownModule,
    NgxLoadingModule.forRoot({}),
    InputTrimModule,
    NgbDatepickerModule,
    SelectModule
  ],
  declarations: [PassangerRewardsComponent, AddRewardsComponent, ViewPassangerRewardsComponent],
  providers: [ FileValidator ]

})

export class PassangerRewardModule { }
