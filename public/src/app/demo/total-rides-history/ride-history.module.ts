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
import { RideHistoryRoutingModule } from './ride-history-routing.module';
import { RidesHistoryComponent } from './rides-history/rides-history.component';
import { ViewRidesHistoryComponent } from './view-rides-history/view-rides-history.component';

@NgModule({
  imports: [
    CommonModule,
    RideHistoryRoutingModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    NgbDropdownModule,
    NgxLoadingModule,
    InputTrimModule,
    NgbDatepickerModule,
    SelectModule
  ],
  declarations: [ RidesHistoryComponent, ViewRidesHistoryComponent],
  providers: [ FileValidator ]
})

export class RideHistoryModule { }
