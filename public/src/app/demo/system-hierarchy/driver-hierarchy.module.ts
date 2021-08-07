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
import { DriverHierarchyRoutingModule } from './driver-hierarchy-routing.module';
import { DriverHierarchyComponent } from './driver-hierarchy/driver-hierarchy.component';
import { ViewDriverHierarchyComponent } from './view-driver-hierarchy/view-driver-hierarchy.component';
import { OneDriverHierarchyComponent } from './one-driver-hierarchy/one-driver-hierarchy.component';
// import { SingleDriverRewardsComponent } from './single-driver-rewards/single-driver-rewards.component';
// import { ViewDriverRewardsComponent } from './view-driver-rewards/view-driver-rewards.component';
// import { AddRewardComponent } from './add-reward/add-reward.component';

@NgModule({
  imports: [
    CommonModule,
    DriverHierarchyRoutingModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    NgbDropdownModule,
    NgxLoadingModule,
    InputTrimModule,
    NgbDatepickerModule,
    SelectModule
  ],
  declarations: [ DriverHierarchyComponent, ViewDriverHierarchyComponent, OneDriverHierarchyComponent],
  providers: [ FileValidator ]
})

export class DriverHierarchyModule { }
